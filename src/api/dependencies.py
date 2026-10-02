from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from src.db.engine import get_db
from src.db.schema import User, UserRole

security = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db)
) -> User:
    # Scaffold de autenticação; será integrado com Gov.br / JWT nos próximos passos
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Autenticação necessária para acessar este recurso."
        )
    # Placeholder para mock ou decodificação do token
    return User(id=1, cpf="000.000.000-00", name="Usuário Padrão", email="usuario@gov.br", role=UserRole.CIDADAO)


def require_role(allowed_roles: list[UserRole]):
    async def role_checker(user: User = Depends(get_current_user)):
        if user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Acesso não autorizado para o perfil do usuário."
            )
        return user
    return role_checker
