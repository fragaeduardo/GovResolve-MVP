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

    # Seed inicial de departamentos e usuários demonstrativos
    async with AsyncSessionLocal() as session:
        dept_count = await session.execute(select(Department))
        if not dept_count.scalars().first():
            default_depts = [
                Department(
                    name="Secretaria de Obras e Infraestrutura",
                    description="Responsável por pavimentação, tapa-buracos, bueiros e obras públicas.",
                    email="obras@prefeitura.gov.br"
                ),
                Department(
                    name="Secretaria de Saúde",
                    description="Responsável por postos de saúde, UPAs, medicamentos e vigilância sanitária.",
                    email="saude@prefeitura.gov.br"
                ),
                Department(
                    name="Secretaria de Trânsito e Transporte",
                    description="Responsável por sinalização, semáforos, linhas de ônibus e mobilidade.",
                    email="transito@prefeitura.gov.br"
                ),
                Department(
                    name="Secretaria de Meio Ambiente",
                    description="Responsável por poda de árvores, descarte de resíduos, praças e parques.",
                    email="meioambiente@prefeitura.gov.br"
                ),
                Department(
                    name="Secretaria de Educação",
                    description="Responsável por escolas municipais, creches, merenda e transporte escolar.",
                    email="educacao@prefeitura.gov.br"
                ),
            ]
            session.add_all(default_depts)

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
                    name="Servidor Público Municipal",
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
