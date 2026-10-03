import { useState, useEffect } from 'react';
import { api, UserProfile } from '../services/api';

export interface UseAuthReturn {
  currentUser: UserProfile | null;
  isAuthenticated: boolean;
  login: (cpfOrId: string, role: 'cidadao' | 'servidor', name?: string) => Promise<UserProfile>;
  logout: () => void;
  switchRole: (role: 'cidadao' | 'servidor') => Promise<UserProfile>;
}

export function useAuth(): UseAuthReturn {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => api.getCurrentUser());

  useEffect(() => {
    // Se já havia usuário salvo no localStorage, carrega
    const saved = api.getCurrentUser();
    if (saved) {
      setCurrentUser(saved);
    }
  }, []);

  const login = async (cpfOrId: string, role: 'cidadao' | 'servidor', name?: string): Promise<UserProfile> => {
    const res = await api.login(cpfOrId, role, name);
    setCurrentUser(res.user);
    return res.user;
  };

  const logout = () => {
    api.logout();
    setCurrentUser(null);
  };

  const switchRole = async (role: 'cidadao' | 'servidor'): Promise<UserProfile> => {
    const id = currentUser?.cpf || '52998224725';
    const name = currentUser?.name || 'Carlos Eduardo da Silva';
    return await login(id, 'servidor', name);
  };

  return {
    currentUser,
    isAuthenticated: !!currentUser,
    login,
    logout,
    switchRole
  };
}
