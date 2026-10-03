from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select

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
            try:
                res = sync_conn.exec_driver_sql("PRAGMA table_info(demands)").fetchall()
                cols = [row[1] for row in res]
                if cols and "severity" not in cols:
                    sync_conn.exec_driver_sql("ALTER TABLE demands ADD COLUMN severity VARCHAR(20) DEFAULT 'MEDIA' NOT NULL")
                if cols and "severity_justification" not in cols:
                    sync_conn.exec_driver_sql("ALTER TABLE demands ADD COLUMN severity_justification TEXT")
            except Exception:
                pass

        await conn.run_sync(_migrate_columns)

    # Seed dos 12 Órgãos Públicos Municipais e Concessionárias a partir de data/departments.jsonl
    async with AsyncSessionLocal() as session:
        dept_count = await session.execute(select(Department))
        existing_depts = {d.name for d in dept_count.scalars().all()}

        import json
        from pathlib import Path
        jsonl_path = Path("data/departments.jsonl")
        
        if jsonl_path.exists():
            with open(jsonl_path, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if not line:
                        continue
                    dept_data = json.loads(line)
                    if dept_data["name"] not in existing_depts:
                        session.add(Department(
                            name=dept_data["name"],
                            description=dept_data["description"],
                            email=dept_data["email"]
                        ))
                        existing_depts.add(dept_data["name"])
        await session.commit()

        # Usuários padrão de teste para Cidadão e Servidor
        user_cidadao = await session.execute(select(User).where(User.cpf == "11111111111"))
        if not user_cidadao.scalar_one_or_none():
            session.add(
                User(
                    cpf="11111111111",
                    name="Cidadão Teste Gov.br",
                    email="cidadao@exemplo.com.br",
                    role=UserRole.CIDADAO
                )
            )

        user_servidor = await session.execute(select(User).where(User.cpf == "22222222222"))
        if not user_servidor.scalar_one_or_none():
            session.add(
                User(
                    cpf="22222222222",
                    name="Servidor Obras Públicas",
                    email="servidor@prefeitura.gov.br",
                    role=UserRole.SERVIDOR
                )
            )

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

    # Configuração de CORS permissiva para desenvolvimento e rede local
    app.add_middleware(
        CORSMiddleware,
        allow_origin_regex=r"^https?://.*",
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
