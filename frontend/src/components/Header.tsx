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
    <header className="bg-slate-900 text-slate-100 border-b border-slate-800 sticky top-0 z-40 backdrop-blur-md bg-opacity-95" role="banner">
      {/* Barra Superior de Acessibilidade (Padrão e-MAG / Gov.br) */}
      <div className="bg-slate-950/90 border-b border-slate-800 text-xs py-1.5 px-4 sm:px-6 lg:px-8 accessibility-bar">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3 text-[11px] text-slate-400">
            <a
              href="#main-content"
              className="sr-only focus:not-sr-only focus:inline-block focus:bg-yellow-300 focus:text-black focus:font-bold focus:px-2.5 focus:py-0.5 focus:rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400 transition"
            >
              Ir para o conteúdo [1]
            </a>
            <span className="hidden sm:inline text-slate-400 font-medium">
              Governo Municipal • Ouvidoria e Participação Cidadã
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Botão de Alto Contraste (Ícone universal ◐ sem texto - e-MAG / WCAG) */}
            <button
              type="button"
              onClick={onToggleContrast}
              aria-pressed={isHighContrast}
              aria-label="Alto contraste"
              title="Alternar modo de alto contraste (WCAG/e-MAG)"
              className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 header-contrast-toggle ${
                isHighContrast
                  ? 'bg-yellow-300 text-black border-2 border-yellow-300 shadow-sm'
                  : 'bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:text-white'
              }`}
            >
              <IconContrast size={18} className={isHighContrast ? 'text-black' : 'text-slate-200'} />
            </button>
          </div>
        </div>
      </div>

      {/* Cabeçalho Principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Identidade Visual */}
        <div className="flex items-center gap-3.5">
          <div className="h-9 w-9 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-sm ring-1 ring-blue-500/30">
            <IconBuilding size={20} className="text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-base tracking-tight text-white">GovResolve</span>
              <span className="text-[10px] uppercase tracking-wider bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono border border-slate-700">
                Plataforma de Ouvidoria
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">Triagem Inteligente de Reclamações Municipais</p>
          </div>
        </div>

        {/* Troca de Perfil e Informações do Usuário */}
        <div className="flex items-center gap-3 flex-wrap justify-center">
          
          {/* Troca de Perfil (Cidadão vs Servidor) */}
          <div className="bg-slate-950 p-1 rounded-lg flex items-center border border-slate-800 text-xs role-switcher" role="group" aria-label="Alternar perfil de acesso">
            <button
              onClick={() => onSwitchRole('cidadao')}
              className={`px-3 py-1.5 rounded-md font-medium transition flex items-center gap-1.5 ${
                currentUser?.role === 'cidadao'
                  ? 'bg-blue-600 text-white shadow-sm role-btn-active'
                  : 'text-slate-400 hover:text-slate-200 role-btn-inactive'
              }`}
            >
              <IconUser size={14} />
              <span>Portal do Cidadão</span>
            </button>
            <button
              onClick={() => onSwitchRole('servidor')}
              className={`px-3 py-1.5 rounded-md font-medium transition flex items-center gap-1.5 ${
                currentUser?.role === 'servidor'
                  ? 'bg-slate-800 text-white shadow-sm border border-slate-700 role-btn-active'
                  : 'text-slate-400 hover:text-slate-200 role-btn-inactive'
              }`}
            >
              <IconShield size={14} />
              <span>Painel do Servidor</span>
            </button>
          </div>

          {/* Dados do Usuário Ativo */}
          {currentUser && (
            <div className="text-right pl-3 hidden sm:block border-l border-slate-800">
              <p className="text-xs font-medium text-slate-200">{currentUser.name}</p>
              <p className="text-[10px] text-slate-400 font-mono">CPF: {currentUser.cpf}</p>
            </div>
          )}

        </div>

      </div>
    </header>
  );
};
