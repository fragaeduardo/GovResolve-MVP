from typing import List, Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from src.config import settings
from src.db.engine import get_db
from src.db.schema import User, UserRole

security = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db)
) -> User:
    """
    Extrai e valida o token JWT do cabeçalho Authorization Bearer.
    Garante o controle de acesso e identificação do usuário com papéis e órgãos (RF001, RF013, RNF001).
    """
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token de autenticação não fornecido."
        )

    if len(settings.SECRET_KEY) < 32:
        raise HTTPException(status_code=503, detail="Configure a SECRET_KEY no .env.")

    token = credentials.credentials
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        if payload.get("demo") and not (settings.DEMO_MODE and settings.DEBUG and settings.ENV == "development"):
            raise JWTError("Modo demonstracao desativado")
        user_id = int(payload.get("sub"))
    except (JWTError, ValueError, TypeError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token de autenticação inválido ou expirado."
        )

    stmt = (
        select(User)
        .where(User.id == user_id)
        .options(
            selectinload(User.role_assignments),
            selectinload(User.departments)
        )
    )
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuário associado ao token não encontrado."
        )

    return user


def require_role(allowed_roles: list[UserRole]):
    """Dependência para controle de permissões por múltiplos papéis (RBAC - RF013)."""
    async def role_checker(user: User = Depends(get_current_user)) -> User:
        user_roles = user.get_roles()
        if not any(r in allowed_roles for r in user_roles):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Acesso negado. Esta operação exige o perfil: {[r.value for r in allowed_roles]}."
            )
        return user
    return role_checker


def get_user_department_scope(user: User) -> Optional[List[int]]:
    """
    Deriva o escopo de órgãos autorizados para o usuário autenticado:
    - Gestores: Acesso irrestrito a todos os departamentos (retorna None).
    - Servidores: Restrito estritamente aos IDs dos órgãos associados ao seu cadastro funcional.
    - Se o servidor ainda não tiver órgãos vinculados explicitamente (ex: em teste simples),
      retorna None para não bloquear o fluxo de desenvolvimento.
    """
    roles = user.get_roles()
    if UserRole.GESTOR in roles:
        return None
    dept_ids = user.get_department_ids()
    if UserRole.SERVIDOR in roles:
        return dept_ids
    return dept_ids
