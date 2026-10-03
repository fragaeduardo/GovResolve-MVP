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

  useEffect(() => {
    if (currentUser) {
      setActiveRole(currentUser.role === 'cidadao' ? 'cidadao' : 'servidor');
    }
  }, [currentUser]);

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
    setActiveRole(user.role === 'cidadao' ? 'cidadao' : 'servidor');
  };

  const handleLogout = () => {
    api.logout();
    setCurrentUser(null);
  };

  const switchRole = async (role: 'cidadao' | 'servidor') => {
    setActiveRole(role);
    try {
      const cpf = role === 'cidadao' ? '11111111111' : '22222222222';
      const name = role === 'cidadao' ? 'Maria Silva' : 'Carlos Souza';
      const result = await api.login(cpf, role, name);
      setCurrentUser(result.user);
    } catch (e) {
      const mockUser: UserProfile = {
        id: role === 'cidadao' ? 1 : 2,
        cpf: role === 'cidadao' ? '11111111111' : '22222222222',
        name: role === 'cidadao' ? 'Maria Silva' : 'Carlos Souza',
        email: `${role}@prefeitura.gov.br`,
        role
      };
      setCurrentUser(mockUser);
    }
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
        onSwitchRole={switchRole}
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
