export type UserRole = 'cidadao' | 'servidor' | 'gestor';

export interface AreaAuthorization {
  authorized: boolean;
}

export interface UserAreas {
  citizen: AreaAuthorization;
  server: AreaAuthorization;
  management: AreaAuthorization;
}

export interface DepartmentRef {
  id: number;
  name: string;
}

export interface UserProfile {
  id: number;
  cpf: string;
  name: string;
  email?: string;
  role: UserRole;
  roles: UserRole[];
  areas: UserAreas;
  departments: DepartmentRef[];
  created_at?: string;
}

export function hasAreaAccess(user: UserProfile | null | undefined, area: keyof UserAreas): boolean {
  const declaredAccess = user?.areas?.[area]?.authorized;
  if (typeof declaredAccess === 'boolean') return declaredAccess;

  const roles = user?.roles?.length ? user.roles : user?.role ? [user.role] : [];
  if (area === 'citizen') return roles.includes('cidadao');
  if (area === 'server') return roles.some((role) => role === 'servidor' || role === 'gestor');
  return roles.includes('gestor');
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: UserProfile;
}
