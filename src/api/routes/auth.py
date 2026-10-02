from datetime import datetime, timedelta
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
    email: Optional[EmailStr] = "cidadao@exemplo.com.br"
    role: UserRole = UserRole.CIDADAO


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
    cpf_clean = data.cpf.replace(".", "").replace("-", "").strip()
    if len(cpf_clean) != 11:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="CPF inválido. Deve conter 11 dígitos numéricos."
        )

    # Busca usuário existente
    res = await db.execute(select(User).where(User.cpf == cpf_clean))
    user = res.scalar_one_or_none()

    if not user:
        user = User(
            cpf=cpf_clean,
            name=data.name or "Cidadão Gov.br",
            email=str(data.email or f"{cpf_clean}@cidadao.gov.br"),
            role=data.role
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
