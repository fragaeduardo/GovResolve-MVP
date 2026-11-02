import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { hasAreaAccess, UserProfile, UserRole } from '../types';

export function useAuth() {
  const [user, setUser] = useState<UserProfile | null>(() => api.getCurrentUser());
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const refreshProfile = useCallback(async () => {
    if (!api.getToken()) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const liveUser = await api.getMe();
      setUser(liveUser);
      setError(null);
    } catch (err: any) {
      console.warn('Erro ao atualizar perfil autenticado:', err);
      if (err?.status === 401) {
        api.logout();
        setUser(null);
      }
      setError(err?.message || 'Falha ao autenticar.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshProfile();
  }, [refreshProfile]);

  const login = async (cpf: string, role: UserRole = 'cidadao', name?: string) => {
    setLoading(true);
    setError(null);
    sessionStorage.removeItem('govresolve_manual_logout');
    try {
      const res = await api.login(cpf, role, name);
      setUser(res.user);
      return res.user;
    } catch (err: any) {
      setError(err?.message || 'Falha no login');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    sessionStorage.setItem('govresolve_manual_logout', 'true');
    api.logout();
    setUser(null);
  };

  const canAccessCitizen = hasAreaAccess(user, 'citizen');
  const canAccessServer = hasAreaAccess(user, 'server');
  const canAccessManagement = hasAreaAccess(user, 'management');

  const defaultArea: 'citizen' | 'server' | 'management' = user?.role === 'gestor' ? 'management' : user?.role === 'servidor' ? 'server' : canAccessCitizen
    ? 'citizen'
    : canAccessServer
    ? 'server'
    : canAccessManagement
    ? 'management'
    : 'citizen';

  return {
    user,
    loading,
    error,
    login,
    logout,
    refreshProfile,
    canAccessCitizen,
    canAccessServer,
    canAccessManagement,
    defaultArea
  };
}
