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
                cursor = sync_conn.connection.cursor()
                cols = [col[1] for col in cursor.execute("PRAGMA table_info(demands)").fetchall()]
                if cols and "severity" not in cols:
                    cursor.execute("ALTER TABLE demands ADD COLUMN severity VARCHAR(20) DEFAULT 'MEDIA' NOT NULL")
                if cols and "severity_justification" not in cols:
                    cursor.execute("ALTER TABLE demands ADD COLUMN severity_justification TEXT")
                sync_conn.connection.commit()
            except Exception:
                pass

        await conn.run_sync(_migrate_columns)

    # Seed dos 12 Órgãos Públicos Municipais e Concessionárias
    async with AsyncSessionLocal() as session:
        dept_count = await session.execute(select(Department))
        existing_depts = {d.name for d in dept_count.scalars().all()}

        catalog_depts = [
            Department(
                name="SEINFRA — Secretaria Municipal de Infraestrutura Urbana",
                description="Obras públicas, pavimentação asfáltica, tapa-buracos, bueiros e drenagem pluvial.",
                email="seinfra@prefeitura.gov.br"
            ),
            Department(
                name="COMURG — Companhia de Urbanização",
                description="Coleta de lixo, varrição, poda de árvores em vias públicas, roçagem e limpeza urbana.",
                email="comurg@prefeitura.gov.br"
            ),
            Department(
                name="SMS — Secretaria Municipal de Saúde",
                description="Postos de saúde, UPAs, falta de medicamentos, vigilância sanitária e combate a endemias.",
                email="ouvidoria.saude@prefeitura.gov.br"
            ),
            Department(
                name="SMM — Secretaria Municipal de Mobilidade e Trânsito",
                description="Semáforos com defeito, sinalização viária, fiscalização de trânsito e transporte público.",
                email="mobilidade@prefeitura.gov.br"
            ),
            Department(
                name="AMMA — Agência Municipal do Meio Ambiente",
                description="Denúncias de poluição sonora, descarte irregular de entulho e crimes ambientais.",
                email="amma@prefeitura.gov.br"
            ),
            Department(
                name="SEFIN — Secretaria Municipal de Finanças",
                description="IPTU, ISS, taxas municipais, Certidão Negativa de Débitos (CND) e tributos.",
                email="atendimento.sefin@prefeitura.gov.br"
            ),
            Department(
                name="SME — Secretaria Municipal de Educação",
                description="Vagas em creches (CMEI), escolas municipais, merenda escolar e transporte de alunos.",
                email="educacao@prefeitura.gov.br"
            ),
            Department(
                name="SANEAGO — Companhia de Saneamento",
                description="Vazamento de água tratada na rua/calçada, rompimento de rede e esgoto a céu aberto.",
                email="saneamento@concessionaria.gov.br"
            ),
            Department(
                name="Concessionária de Iluminação Pública",
                description="Postes com lâmpadas apagadas à noite, fios caídos e reparos na rede de iluminação.",
                email="iluminacao@concessionaria.gov.br"
            ),
            Department(
                name="GCM — Guarda Civil Metropolitana",
                description="Segurança preventiva em parques, praças, escolas e patrimônio público municipal.",
                email="gcm@prefeitura.gov.br"
            ),
            Department(
                name="PROCON Municipal — Defesa do Consumidor",
                description="Fiscalização de comércio abusivo, preços irregulares e direitos do consumidor.",
                email="procon@prefeitura.gov.br"
            ),
            Department(
                name="SEMAS — Secretaria Municipal de Assistência Social",
                description="Atendimento a famílias vulneráveis, acolhimento de pessoas em situação de rua e CRAS/CREAS.",
                email="semas@prefeitura.gov.br"
            ),
        ]

        for d in catalog_depts:
            if d.name not in existing_depts:
                session.add(d)

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

    # Configuração de CORS
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
