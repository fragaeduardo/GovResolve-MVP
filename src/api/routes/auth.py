from datetime import datetime, timedelta
from hmac import compare_digest
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from jose import jwt
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.config import settings
from src.db.engine import get_db
from src.db.schema import User, UserRole
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


def create_token(user: User) -> str:
    payload = {
        "sub": str(user.id),
        "cpf": user.cpf,
        "name": user.name,
        "email": user.email,
        "role": user.role.value,
        "exp": datetime.utcnow() + timedelta(days=7)
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm="HS256")


@router.post("/login", response_model=TokenResponse)
async def login_or_register(data: LoginRequest, db: AsyncSession = Depends(get_db)):
    """
    Login e cadastro automático do cidadão ou servidor (Simulação do Gov.br / SSO - RF001).
    """
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
            not code
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
                email=str(data.email or f"{cpf_clean}@example.invalid"),
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
