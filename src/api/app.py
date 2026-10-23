from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select, update, delete

from src.config import settings
from src.api.middlewares import ProcessTimeHeaderMiddleware
from src.db.engine import engine, Base, AsyncSessionLocal
from src.db.schema import Department, User, UserRole
from src.api.routes import auth, demands, admin


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Inicialização do banco de dados relacional
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

        def _migrate_columns(sync_conn):
            if sync_conn.dialect.name != "sqlite":
                return
            try:
                res = sync_conn.exec_driver_sql("PRAGMA table_info(demands)").fetchall()
                cols = [row[1] for row in res]
                if cols and "severity" not in cols:
                    sync_conn.exec_driver_sql("ALTER TABLE demands ADD COLUMN severity VARCHAR(20) DEFAULT 'MEDIA' NOT NULL")
                if cols and "severity_justification" not in cols:
                    sync_conn.exec_driver_sql("ALTER TABLE demands ADD COLUMN severity_justification TEXT")
                if cols and "chat_session_id" not in cols:
                    sync_conn.exec_driver_sql("ALTER TABLE demands ADD COLUMN chat_session_id VARCHAR(64)")
                sync_conn.exec_driver_sql("CREATE UNIQUE INDEX IF NOT EXISTS ix_demands_chat_session_id ON demands (chat_session_id)")
                user_cols = [row[1] for row in sync_conn.exec_driver_sql("PRAGMA table_info(users)").fetchall()]
                if user_cols and "department_id" not in user_cols:
                    sync_conn.exec_driver_sql("ALTER TABLE users ADD COLUMN department_id INTEGER REFERENCES departments(id)")
                dept_cols = [row[1] for row in sync_conn.exec_driver_sql("PRAGMA table_info(departments)").fetchall()]
                if dept_cols and "code" not in dept_cols:
                    sync_conn.exec_driver_sql("ALTER TABLE departments ADD COLUMN code VARCHAR(24)")
                sync_conn.exec_driver_sql("CREATE UNIQUE INDEX IF NOT EXISTS uq_departments_code ON departments (code)")
            except Exception:
                pass

        await conn.run_sync(_migrate_columns)
        # PostgreSQL nao entende PRAGMA; aplicar as colunas tambem ao banco existente.
        from sqlalchemy import inspect
        def _migrate_postgres(sync_conn):
            if sync_conn.dialect.name != "postgresql":
                return
            user_cols = {column["name"] for column in inspect(sync_conn).get_columns("users")}
            if "department_id" not in user_cols:
                sync_conn.exec_driver_sql("ALTER TABLE users ADD COLUMN department_id INTEGER")
            demand_cols = {column["name"] for column in inspect(sync_conn).get_columns("demands")}
            if "chat_session_id" not in demand_cols:
                sync_conn.exec_driver_sql("ALTER TABLE demands ADD COLUMN chat_session_id VARCHAR(64)")
            sync_conn.exec_driver_sql("CREATE UNIQUE INDEX IF NOT EXISTS ix_demands_chat_session_id ON demands (chat_session_id)")
            dept_cols = {column["name"] for column in inspect(sync_conn).get_columns("departments")}
            if "code" not in dept_cols:
                sync_conn.exec_driver_sql("ALTER TABLE departments ADD COLUMN code VARCHAR(24)")
            sync_conn.exec_driver_sql("CREATE UNIQUE INDEX IF NOT EXISTS uq_departments_code ON departments (code)")
        await conn.run_sync(_migrate_postgres)

    # Sincroniza os destinos sem perder protocolos existentes.
    async with AsyncSessionLocal() as session:
        import json
        from pathlib import Path
        records = [
            json.loads(line) for line in Path("data/departments.jsonl").read_text(encoding="utf-8").splitlines()
            if line.strip()
        ]
        legacy_aliases = {
            "SET": "SMM",
            "SEFAZ": "SEFIN",
            "AGCM": "GCM",
            "SEMASDH": "SEMAS",
        }
        for entry in records:
            code = entry["code"]
            dept = await session.scalar(select(Department).where(Department.code == code))
            if not dept:
                dept = await session.scalar(select(Department).where(Department.name == entry["name"]))
            if not dept and code in legacy_aliases:
                dept = await session.scalar(
                    select(Department).where(Department.name.like(legacy_aliases[code] + " —%"))
                )
            if not dept:
                dept = Department()
                session.add(dept)
            dept.code = code
            dept.name = entry["name"]
            dept.description = entry["description"]
            dept.email = entry["email"]
        await session.flush()

        # O antigo destino "Iluminacao" passa a integrar a SEINFRA;
        # preservar as demandas e vinculos de servidores existentes.
        old_light = await session.scalar(
            select(Department).where(Department.name == "Concessionária de Iluminação Pública")
        )
        seinfra = await session.scalar(select(Department).where(Department.code == "SEINFRA"))
        if old_light and seinfra and old_light.id != seinfra.id:
            from src.db.schema import Demand
            await session.execute(update(Demand).where(Demand.department_id == old_light.id).values(department_id=seinfra.id))
            await session.execute(update(User).where(User.department_id == old_light.id).values(department_id=seinfra.id))
            await session.delete(old_light)
        await session.commit()

        # Usuario de teste isolado; nunca transformar automaticamente uma conta real.
        demo_department = await session.scalar(select(Department).where(Department.code == "SEINFRA"))
        user_carlos = await session.scalar(select(User).where(User.cpf == "52998224725"))
        u_carlos = user_carlos
        if not u_carlos:
            session.add(User(
                cpf="52998224725",
                name="Carlos Eduardo da Silva",
                email="carlos.silva@prefeitura.gov.br",
                role=UserRole.SERVIDOR,
                department_id=demo_department.id if demo_department else None
            ))
        await session.commit()

        from src.db.seed_demands import seed_artificial_demands
        await seed_artificial_demands(session)
        await session.commit()

    yield
    # Finalização
    await engine.dispose()


def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.APP_NAME,
        description="GovResolve MVP - Plataforma centralizada para registro, classificação, encaminhamento e acompanhamento de reclamações municipais com IA.",
        version="0.1.0",
        docs_url="/docs",
        redoc_url="/redoc",
        lifespan=lifespan
    )

    # Origens CORS explicitamente permitidas pela configuracao local.
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Middleware customizado de tempo de processamento
    app.add_middleware(ProcessTimeHeaderMiddleware)

    # Registro de Rotas da API v1
    app.include_router(auth.router, prefix="/api/v1")
    app.include_router(demands.router, prefix="/api/v1")
    app.include_router(admin.router, prefix="/api/v1")

    @app.get("/health", tags=["Health"])
    async def health_check():
        return {
            "status": "healthy",
            "app": settings.APP_NAME,
            "version": "0.1.0"
        }

    return app
