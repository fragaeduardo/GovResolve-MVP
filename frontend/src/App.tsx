import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { CitizenPortal } from './components/CitizenPortal';
import { ServerPanel } from './components/ServerPanel';
import { api, UserProfile } from './services/api';

export const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isHighContrast, setIsHighContrast] = useState(false);
  const [activeRole, setActiveRole] = useState<'cidadao' | 'servidor'>('cidadao');

  useEffect(() => {
    switchRole('cidadao');
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

  return (
    <div className={`min-h-screen flex flex-col ${isHighContrast ? 'high-contrast' : 'bg-slate-50 text-slate-900'}`}>
      
      {/* Header Institucional */}
      <Header
        currentUser={currentUser}
        onSwitchRole={switchRole}
        isHighContrast={isHighContrast}
        onToggleContrast={() => setIsHighContrast(!isHighContrast)}
      />

      {/* Conteúdo Principal */}
      <main id="main-content" className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8" role="main">
        {activeRole === 'cidadao' ? (
          <section aria-labelledby="secao-cidadao">
            <CitizenPortal />
          </section>
        ) : (
          <section aria-labelledby="secao-servidor">
            <ServerPanel />
          </section>
        )}
      </main>

      {/* Rodapé Acessível e Sóbrio */}
      <footer className="bg-slate-950 text-slate-400 text-xs py-6 border-t border-slate-800" role="contentinfo">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-3 text-center md:text-left">
          <div>
            <p className="font-medium text-slate-200">GovResolve — Sistema Integrado de Ouvidoria e Triagem com IA</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Grupo 10 • INF / UFG • Bacharelado em Ciência da Computação</p>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-slate-400">
            <span>Eduardo Fraga • Ralph Torres • Samuel Jaime • Wender Viana</span>
            <span className="text-slate-700">|</span>
            <span className="font-mono text-slate-400">WCAG 2.1 AAA / e-MAG</span>
          </div>
        </div>
      </footer>

    </div>
  );
};
