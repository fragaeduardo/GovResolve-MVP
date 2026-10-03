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
    const defaultId = role === 'cidadao' ? '11111111111' : '22222222222';
    const defaultName = role === 'cidadao' ? 'Maria Silva' : 'Carlos Souza';
    return await login(defaultId, role, defaultName);
  };

  return {
    currentUser,
    isAuthenticated: !!currentUser,
    login,
    logout,
    switchRole
  };
}
