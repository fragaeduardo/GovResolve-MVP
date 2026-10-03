import React from 'react';
import { UserProfile } from '../services/api';
import { IconBuilding, IconUser, IconShield, IconContrast } from './Icons';

interface HeaderProps {
  currentUser: UserProfile | null;
  onSwitchRole: (role: 'cidadao' | 'servidor') => void;
  isHighContrast: boolean;
  onToggleContrast: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  onSwitchRole,
  isHighContrast,
  onToggleContrast
}) => {
  return (
    <header className="bg-slate-900 text-slate-100 border-b border-slate-800 shrink-0 z-40" role="banner">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:inline-block focus:bg-yellow-300 focus:text-black focus:font-bold focus:px-3 focus:py-1 focus:rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400 absolute top-2 left-2 z-50 transition"
      >
        Ir para o conteúdo [1]
      </a>

      {/* Cabeçalho Principal Compacto e Centralizado */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between gap-3">
        
        {/* Identidade Visual */}
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-xs shrink-0">
            <IconBuilding size={18} className="text-white" />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm sm:text-base tracking-tight text-white">GovResolve</span>
            <span className="hidden sm:inline text-[10px] uppercase tracking-wider bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono border border-slate-700">
              Ouvidoria Digital
            </span>
          </div>
        </div>

        {/* Troca de Perfil, Informações do Usuário e Botão de Alto Contraste */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Troca de Perfil (Cidadão vs Servidor) */}
          <div className="bg-slate-950 p-1 rounded-lg flex items-center border border-slate-800 text-xs role-switcher" role="group" aria-label="Alternar perfil de acesso">
            <button
              onClick={() => onSwitchRole('cidadao')}
              className={`px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-md font-medium text-xs transition flex items-center gap-1.5 ${
                currentUser?.role === 'cidadao'
                  ? 'bg-blue-600 text-white shadow-xs role-btn-active'
                  : 'text-slate-400 hover:text-slate-200 role-btn-inactive'
              }`}
            >
              <IconUser size={14} />
              <span>Cidadão</span>
            </button>
            <button
              onClick={() => onSwitchRole('servidor')}
              className={`px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-md font-medium text-xs transition flex items-center gap-1.5 ${
                currentUser?.role === 'servidor'
                  ? 'bg-slate-800 text-white shadow-xs border border-slate-700 role-btn-active'
                  : 'text-slate-400 hover:text-slate-200 role-btn-inactive'
              }`}
            >
              <IconShield size={14} />
              <span>Servidor</span>
            </button>
          </div>

          {/* Dados do Usuário Ativo */}
          {currentUser && (
            <div className="text-right pl-2 hidden md:block border-l border-slate-800">
              <p className="text-xs font-medium text-slate-200 leading-tight">{currentUser.name}</p>
              <p className="text-[10px] text-slate-400 font-mono">CPF: {currentUser.cpf}</p>
            </div>
          )}

          {/* Botão de Alto Contraste (design circular / bolinha) */}
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
            <IconContrast size={17} className={isHighContrast ? 'text-black' : 'text-slate-200'} />
          </button>

        </div>

      </div>
    </header>
  );
};
