import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { CitizenPortal } from './components/CitizenPortal';
import { ServerPanel } from './components/ServerPanel';
import { LoginPage } from './pages/LoginPage';
import { api, UserProfile } from './services/api';

export const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => api.getCurrentUser());
  const [isHighContrast, setIsHighContrast] = useState(false);
  const [activeRole, setActiveRole] = useState<'cidadao' | 'servidor'>('cidadao');

  // Inicialização e garantia de perfil híbrido (Cidadão & Servidor) com CPF válido
  useEffect(() => {
    const ensureValidUser = async () => {
      const saved = api.getCurrentUser();
      if (!saved || saved.cpf === '11111111111' || saved.cpf === '22222222222' || !api.getToken()) {
        try {
          const res = await api.login('52998224725', 'servidor', 'Carlos Eduardo da Silva');
          setCurrentUser(res.user);
        } catch (e) {
          console.error('Erro ao inicializar perfil unificado:', e);
        }
      }
    };
    ensureValidUser();
  }, []);

  useEffect(() => {
    if (isHighContrast) {
      document.documentElement.classList.add('high-contrast');
      document.body.classList.add('high-contrast');
    } else {
      document.documentElement.classList.remove('high-contrast');
      document.body.classList.remove('high-contrast');
    }
  }, [isHighContrast]);

  const handleLoginSuccess = (user: UserProfile) => {
    setCurrentUser(user);
  };

  const handleLogout = () => {
    api.logout();
    setCurrentUser(null);
  };

  // Alterna simplesmente a visão (aba) sem alterar o usuário, token ou CPF
  const handleSwitchRole = (role: 'cidadao' | 'servidor') => {
    setActiveRole(role);
  };

  // Se não estiver logado, exibe a página de login
  if (!currentUser) {
    return (
      <LoginPage
        onLoginSuccess={handleLoginSuccess}
        isHighContrast={isHighContrast}
        onToggleContrast={() => setIsHighContrast(!isHighContrast)}
      />
    );
  }

  return (
    <div className={`h-screen max-h-screen overflow-hidden flex flex-col ${isHighContrast ? 'high-contrast' : 'bg-slate-100 text-slate-900'}`}>
      
      {/* Header Institucional Compacto */}
      <Header
        currentUser={currentUser}
        activeRole={activeRole}
        onSwitchRole={handleSwitchRole}
        isHighContrast={isHighContrast}
        onToggleContrast={() => setIsHighContrast(!isHighContrast)}
        onLogout={handleLogout}
      />

      {/* Conteúdo Principal Centralizado na Tela (Sem rolagem externa) */}
      <main id="main-content" className="flex-1 min-h-0 w-full max-w-7xl mx-auto p-2 sm:p-3 md:p-4 overflow-hidden flex flex-col" role="main">
        {activeRole === 'cidadao' ? (
          <section aria-labelledby="secao-cidadao" className="h-full min-h-0 flex flex-col">
            <CitizenPortal />
          </section>
        ) : (
          <section aria-labelledby="secao-servidor" className="h-full min-h-0 flex flex-col overflow-y-auto pr-1">
            <ServerPanel />
          </section>
        )}
      </main>

    </div>
  );
};
