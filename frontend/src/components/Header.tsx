import React from 'react';
import { UserProfile, formatCPF } from '../services/api';
import { IconCivicSeal, IconUser, IconShield, IconContrast, IconLogOut, IconSun, IconMoon } from './Icons';

interface HeaderProps {
  currentUser: UserProfile | null;
  activeRole: 'cidadao' | 'servidor';
  onSwitchRole: (role: 'cidadao' | 'servidor') => void;
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
  isHighContrast: boolean;
  onToggleContrast: () => void;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  activeRole,
  onSwitchRole,
  theme = 'dark',
  onToggleTheme,
  isHighContrast,
  onToggleContrast,
  onLogout
}) => {
  return (
    <header className="bg-slate-900 text-slate-100 border-b border-slate-800/90 shrink-0 z-40" role="banner">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:inline-block focus:bg-yellow-300 focus:text-black focus:font-bold focus:px-3 focus:py-1 focus:rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400 absolute top-2 left-2 z-50 transition"
      >
        Ir para o conteúdo [1]
      </a>

      {/* Faixa Institucional com Alinhamento Preciso */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between gap-3">
        
        {/* Identidade Institucional: Brasão Cívico + GovResolve */}
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-civic-800 border border-civic-700/80 flex items-center justify-center text-civic-200 shadow-xs shrink-0">
            <IconCivicSeal size={20} className="text-civic-200" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm sm:text-base tracking-tight text-white font-sans">GovResolve</span>
              <span className="hidden sm:inline-block text-[10px] uppercase font-mono tracking-wider bg-slate-800/90 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
                Ouvidoria Municipal
              </span>
            </div>
            <span className="text-[11px] text-slate-400 hidden md:block leading-none mt-0.5 font-sans">
              Balcão Integrado de Zeladoria Urbana e Participação Cidadã
            </span>
          </div>
        </div>

        {/* Controles de Navegação, Usuário e Acessibilidade */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Alternador Segmentado de Visão (Cidadão vs Servidor) */}
          <div className="bg-slate-950/90 p-1 rounded-lg flex items-center border border-slate-800 text-xs role-switcher" role="group" aria-label="Alternar visão de atendimento">
            <button
              onClick={() => onSwitchRole('cidadao')}
              className={`px-3 py-1.5 rounded-md font-medium text-xs transition flex items-center gap-1.5 ${
                activeRole === 'cidadao'
                  ? 'bg-civic-700 text-white shadow-xs font-semibold role-btn-active'
                  : 'text-slate-400 hover:text-slate-200 role-btn-inactive'
              }`}
            >
              <IconUser size={14} />
              <span>Visão Cidadão</span>
            </button>
            <button
              onClick={() => onSwitchRole('servidor')}
              className={`px-3 py-1.5 rounded-md font-medium text-xs transition flex items-center gap-1.5 ${
                activeRole === 'servidor'
                  ? 'bg-slate-800 text-white shadow-xs border border-slate-700 font-semibold role-btn-active'
                  : 'text-slate-400 hover:text-slate-200 role-btn-inactive'
              }`}
            >
              <IconShield size={14} />
              <span>Mesa do Servidor</span>
            </button>
          </div>

          {/* Dados do Usuário Ativo e Logout */}
          {currentUser && (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
              <div className="text-right hidden md:block">
                <div className="flex items-center gap-1.5 justify-end">
                  <p className="text-xs font-semibold text-slate-200 leading-tight font-sans">{currentUser.name}</p>
                  <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-civic-950 text-civic-300 border border-civic-800 font-mono font-semibold">
                    Cidadão & Servidor
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 font-mono">CPF: {formatCPF(currentUser.cpf)}</p>
              </div>
              {onLogout && (
                <button
                  type="button"
                  onClick={onLogout}
                  title="Sair da conta e voltar ao login"
                  aria-label="Sair da conta"
                  className="p-2 rounded-lg bg-slate-800/80 hover:bg-rose-900/60 hover:text-rose-200 text-slate-400 border border-slate-700/60 transition"
                >
                  <IconLogOut size={15} />
                </button>
              )}
            </div>
          )}

          {/* Alternância de Modo Escuro / Claro Confortável */}
          {onToggleTheme && !isHighContrast && (
            <button
              type="button"
              onClick={onToggleTheme}
              aria-label={theme === 'dark' ? 'Mudar para modo claro suave' : 'Mudar para modo escuro repousante'}
              title={theme === 'dark' ? 'Mudar para modo claro suave' : 'Mudar para modo escuro repousante'}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center transition-all bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:text-white shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-civic-400"
            >
              {theme === 'dark' ? (
                <IconSun size={16} className="text-amber-300" />
              ) : (
                <IconMoon size={16} className="text-slate-300" />
              )}
            </button>
          )}

          {/* Botão de Alto Contraste (design circular acessível WCAG/e-MAG) */}
          <button
            type="button"
            onClick={onToggleContrast}
            aria-pressed={isHighContrast}
            aria-label="Alto contraste"
            title="Alternar modo de alto contraste (WCAG/e-MAG)"
            className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400 header-contrast-toggle shrink-0 ${
              isHighContrast
                ? 'bg-yellow-300 text-black border-2 border-yellow-300 shadow-xs'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:text-white'
            }`}
          >
            <IconContrast size={16} className={isHighContrast ? 'text-black' : 'text-slate-200'} />
          </button>

        </div>

      </div>
    </header>
  );
};
