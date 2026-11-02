import { UserProfile, UserRole } from '../../types';

export const DEMO_PROFILES = {
  server: {
    identifier: 'govresolve-demo-servidor',
    role: 'servidor' as UserRole,
    name: 'Servidor de Demonstração'
  },
  management: {
    identifier: 'govresolve-demo-gestor',
    role: 'gestor' as UserRole,
    name: 'Gestor de Demonstração'
  }
};

export function isDemoProfileForArea(user: UserProfile | null | undefined, area: 'server' | 'management') {
  const profile = DEMO_PROFILES[area];
  return user?.name === profile.name && user.role === profile.role;
}
