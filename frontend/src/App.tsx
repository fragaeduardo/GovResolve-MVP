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
    // Inicialização da sessão com usuário padrão para prototipação
    switchRole('cidadao');
  }, []);

  const switchRole = async (role: 'cidadao' | 'servidor') => {
    setActiveRole(role);
    try {
      const cpf = role === 'cidadao' ? '11111111111' : '22222222222';
      const name = role === 'cidadao' ? 'Cidadão Teste Gov.br' : 'Servidor Obras Públicas';
      const result = await api.login(cpf, role, name);
      setCurrentUser(result.user);
    } catch (e) {
      console.warn('Backend offline ou inacessível; utilizando perfil mockado local.');
      const mockUser: UserProfile = {
        id: role === 'cidadao' ? 1 : 2,
        cpf: role === 'cidadao' ? '11111111111' : '22222222222',
        name: role === 'cidadao' ? 'Cidadão Teste Gov.br' : 'Servidor Obras Públicas',
        email: `${role}@prefeitura.gov.br`,
        role
      };
      setCurrentUser(mockUser);
    }
  };

  return (
    <div className={`min-h-screen flex flex-col ${isHighContrast ? 'high-contrast' : 'bg-slate-50'}`}>
      
      {/* Header Governamental Acessível */}
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

      {/* Rodapé Acessível e Institucional */}
      <footer className="bg-slate-900 text-slate-400 text-xs py-6 border-t border-slate-800" role="contentinfo">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-3 text-center md:text-left">
          <div>
            <p className="font-semibold text-slate-300">GovResolve MVP — Grupo 10 (Ctrl+Z)</p>
            <p className="text-[11px] mt-0.5">Eduardo Fraga • Ralph Torres • Samuel Jaime • Wender Viana</p>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span>INF / UFG — Engenharia de Software</span>
            <span className="text-slate-600">•</span>
            <span className="bg-blue-950 text-blue-300 px-2 py-0.5 rounded border border-blue-800">WCAG 2.1 AA</span>
          </div>
        </div>
      </footer>

    </div>
  );
};
