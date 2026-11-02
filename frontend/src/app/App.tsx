import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import { Header } from '../components/layout/Header';
import { AppArea } from '../components/layout/EnvironmentSelector';
import { CitizenPortal } from '../features/citizen/CitizenPortal';
import { ServerPanel } from '../features/server/ServerPanel';
import { ManagementPanel } from '../features/management/ManagementPanel';
import { LoginPage } from '../features/auth/LoginPage';
import { IconCivicSeal } from '../components/common/Icons';
import { hasAreaAccess } from '../types';

export const App: React.FC = () => {
  const {
    user,
    loading: authLoading,
    login,
    logout,
    canAccessCitizen,
    canAccessServer,
    canAccessManagement,
    defaultArea,
    refreshProfile
  } = useAuth();

  const { theme, isHighContrast, toggleTheme, toggleHighContrast } = useTheme();

  const [activeArea, setActiveArea] = useState<AppArea>(defaultArea);

  const handleSelectArea = async (area: AppArea) => {
    if (hasAreaAccess(user, area)) {
      setActiveArea(area);
    } else {
      logout();
    }
  };

  useEffect(() => {
    if (user) setActiveArea(defaultArea);
  }, [user, defaultArea]);

  // Se estiver verificando perfil inicial
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0d3b42] flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-14 h-14 rounded-2xl bg-[#f4a261] text-[#0d3b42] flex items-center justify-center font-black text-xl shadow-lg animate-pulse">
            <IconCivicSeal size={32} />
          </div>
          <div>
            <h1 className="text-base font-bold text-white tracking-tight">GovResolve</h1>
            <p className="text-xs text-slate-300 mt-1">Carregando ambiente institucional de Goiânia...</p>
          </div>
        </div>
      </div>
    );
  }

  // Se não autenticado (por exemplo após logout explícito), exibe a tela de login
  if (!user) {
    return (
      <LoginPage
        onLoginSuccess={() => refreshProfile()}
        theme={theme}
        onToggleTheme={toggleTheme}
        isHighContrast={isHighContrast}
        onToggleContrast={toggleHighContrast}
      />
    );
  }

  return (
    <div
      className={`h-screen max-h-screen overflow-hidden flex flex-col font-sans transition-colors duration-200 ${
        isHighContrast
          ? 'high-contrast'
          : 'bg-[#f1f6f5] text-[#0d3b42] dark:bg-[#0b1117] dark:text-[#f3f7f6]'
      }`}
    >
      {/* Header Institucional com Seletor de Papel do Figma */}
      <Header
        currentUser={user}
        activeArea={activeArea}
        onSelectArea={handleSelectArea}
        theme={theme}
        onToggleTheme={toggleTheme}
        isHighContrast={isHighContrast}
        onToggleContrast={toggleHighContrast}
        onLogout={logout}
      />

      {/* Conteúdo Principal Conforme Ambiente Selecionado */}
      <main
        id="main-content"
        className="flex-1 min-h-0 w-full overflow-hidden flex flex-col"
        role="main"
      >
        {activeArea === 'citizen' && (
          <section
            aria-label="Portal de Autoatendimento do Cidadão"
            className="h-full min-h-0 flex flex-col w-full overflow-hidden"
          >
            <CitizenPortal />
          </section>
        )}

        {activeArea === 'server' && (
          <section
            aria-label="Painel de Atendimento do Servidor"
            className="h-full min-h-0 flex flex-col overflow-y-auto"
          >
            <ServerPanel />
          </section>
        )}

        {activeArea === 'management' && (
          <section
            aria-label="Painel de Gestão e Indicadores Estratégicos"
            className="h-full min-h-0 flex flex-col overflow-y-auto"
          >
            <ManagementPanel />
          </section>
        )}
      </main>
      <footer role="contentinfo" className="hidden sm:flex h-16 shrink-0 px-5 sm:px-7 items-center justify-between gap-4 bg-[#0d3b42] dark:bg-[#0b1117] text-[#d6e5e2] dark:text-[#90aaa7] text-[10px]">
        <span>GovResolve • Ouvidoria Municipal</span>
        <span className="hidden sm:block">Transparência • protocolo único • acompanhamento</span>
      </footer>
    </div>
  );
};
