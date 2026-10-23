from datetime import datetime, timedelta
from hmac import compare_digest
from hashlib import sha256
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from jose import jwt
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.config import settings
from src.db.engine import get_db
from src.db.schema import User, UserRole, Department
from src.api.schemas import UserResponse
from src.api.dependencies import get_current_user

router = APIRouter(prefix="/auth", tags=["Autenticação & Perfis (RF001)"])


class LoginRequest(BaseModel):
    cpf: str
    name: Optional[str] = "Cidadão Exemplo"
    email: Optional[EmailStr] = None
    role: UserRole = UserRole.CIDADAO
    staff_access_code: Optional[str] = None


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


def create_token(user: User, demo: bool = False) -> str:
    if len(settings.SECRET_KEY) < 32:
        raise HTTPException(status_code=503, detail="Configure uma SECRET_KEY segura no .env.")
    payload = {
        "sub": str(user.id),
        "cpf": user.cpf,
        "name": user.name,
        "email": user.email,
        "role": user.role.value,
        "demo": demo,
        "exp": datetime.utcnow() + timedelta(days=7)
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm="HS256")


@router.post("/login", response_model=TokenResponse)
async def login_or_register(data: LoginRequest, db: AsyncSession = Depends(get_db)):
    """
    Login e cadastro automático do cidadão ou servidor (Simulação do Gov.br / SSO - RF001).
    """
    # Identificacao simulada sem prova de titularidade: nunca habilitar em producao.
    if settings.ENV != "development" or not settings.DEBUG:
        raise HTTPException(
            status_code=501,
            detail="Login simulado indisponivel fora de desenvolvimento. Configure gov.br na versao de producao."
        )

    # Para o MVP: qualquer login é aceito. Normaliza identificadores numéricos ou texto
    raw_id = data.cpf.replace(".", "").replace("-", "").replace("/", "").strip()
    digits = "".join(c for c in raw_id if c.isdigit())
    if len(digits) == 11:
        cpf_clean = digits
    elif digits:
        cpf_clean = digits[:11].zfill(11)
    else:
        # Quando o login for texto (ex: "admin", "servidor", "maria", matrícula funcional)
        import hashlib
        num_hash = str(int(hashlib.md5(raw_id.encode("utf-8") if raw_id else b"mvp_user").hexdigest(), 16))
        cpf_clean = num_hash[:11].zfill(11)

    # Login de demonstracao: o papel nao pode ser concedido pelo cliente.
    # Usuarios administrativos devem existir previamente e apresentar o codigo do ambiente.
    res = await db.execute(select(User).where(User.cpf == cpf_clean))
    user = res.scalar_one_or_none()

    requesting_staff = data.role in (UserRole.SERVIDOR, UserRole.GESTOR)
    if requesting_staff:
        code = settings.DEMO_STAFF_ACCESS_CODE
        if (
            len(code) < 12
            or not data.staff_access_code
            or not compare_digest(data.staff_access_code, code)
            or user is None
            or user.role not in (UserRole.SERVIDOR, UserRole.GESTOR)
        ):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Acesso de servidor nao autorizado. Confira o codigo de demonstracao."
            )
    else:
        # Em modo demonstracao, identidades cidadas nao sao autenticacao real.
        # Uma pessoa sem codigo nao pode se passar por um usuario administrativo.
        if user is not None and user.role != UserRole.CIDADAO:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Esta conta e administrativa; utilize o acesso de servidor."
            )
        if user is None:
            user = User(
                cpf=cpf_clean,
                name=data.name or "Cidadao",
                email=str(data.email or f"{cpf_clean}@example.com"),
                role=UserRole.CIDADAO
            )
            db.add(user)
            await db.commit()
            await db.refresh(user)

    token = create_token(user)
    return TokenResponse(access_token=token, user=UserResponse.model_validate(user))


@router.get("/me", response_model=UserResponse)
async def get_my_profile(current_user: User = Depends(get_current_user)):
    """Retorna os dados do perfil autenticado."""
    return UserResponse.model_validate(current_user)


class DemoLoginRequest(BaseModel):
    role: UserRole
    department_id: Optional[int] = None


@router.get("/demo-config")
async def get_demo_config():
    """Informa se a simulacao academica esta disponivel no ambiente."""
    return {"enabled": bool(settings.DEMO_MODE and settings.DEBUG and settings.ENV == "development")}


@router.post("/demo", response_model=TokenResponse)
async def demo_login(data: DemoLoginRequest, db: AsyncSession = Depends(get_db)):
    """Seleciona um perfil FICTICIO; nunca deve estar ativo em producao."""
    if not (settings.DEMO_MODE and settings.DEBUG and settings.ENV == "development"):
        raise HTTPException(status_code=403, detail="Modo de demonstracao desativado.")

    department = None
    if data.role == UserRole.SERVIDOR:
        if data.department_id is None:
            raise HTTPException(status_code=422, detail="Selecione um orgao para o servidor.")
        department = await db.get(Department, data.department_id)
        if department is None:
            raise HTTPException(status_code=404, detail="Orgao nao encontrado.")
        scope = f"servidor:{department.id}"
    elif data.department_id is not None:
        raise HTTPException(status_code=422, detail="Somente servidores selecionam orgao.")
    else:
        scope = data.role.value

    # IDs estaveis permitem apresentar historico entre acessos na mesma instalacao.
    # Prefixo reservado e namespace deixam perfis de demonstracao isolados.
    ident = int.from_bytes(sha256(f"govresolve-demo:{scope}".encode()).digest()[:8], "big")
    cpf_demo = "88" + str(ident % 1_000_000_000).zfill(9)
    user = await db.scalar(select(User).where(User.cpf == cpf_demo))

    display_name = {
        UserRole.CIDADAO: "Cidadao de Demonstracao",
        UserRole.SERVIDOR: "Servidor de Demonstracao",
        UserRole.GESTOR: "Gestor de Demonstracao",
    }[data.role]
    if user is None:
        user = User(
            cpf=cpf_demo,
            name=display_name,
            email=f"demo-{cpf_demo}@example.com",
            role=data.role,
            department_id=department.id if department else None,
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)
    elif user.role != data.role or user.department_id != (department.id if department else None):
        raise HTTPException(status_code=409, detail="Identificador reservado de demo em uso.")

    return TokenResponse(access_token=create_token(user, demo=True), user=UserResponse.model_validate(user))
