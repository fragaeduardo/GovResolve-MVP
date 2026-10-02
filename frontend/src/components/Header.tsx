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

        {/* Controles de Acessibilidade e Troca de Perfil */}
        <div className="flex items-center gap-3 flex-wrap justify-center">
          
          {/* Botão de Alto Contraste (WCAG 2.1 AA) */}
          <button
            onClick={onToggleContrast}
            aria-pressed={isHighContrast}
            aria-label="Alternar modo de alto contraste"
            className="text-xs font-medium px-3 py-1.5 rounded-md border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200 transition flex items-center gap-1.5 focus:ring-2 focus:ring-blue-500"
          >
            <IconContrast size={14} className="text-slate-300" />
            <span>{isHighContrast ? 'Contraste Normal' : 'Alto Contraste'}</span>
          </button>

          {/* Troca de Perfil (Cidadão vs Servidor) */}
          <div className="bg-slate-950 p-1 rounded-lg flex items-center border border-slate-800 text-xs" role="group" aria-label="Alternar perfil de acesso">
            <button
              onClick={() => onSwitchRole('cidadao')}
              className={`px-3 py-1.5 rounded-md font-medium transition flex items-center gap-1.5 ${
                currentUser?.role === 'cidadao'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <IconUser size={14} />
              <span>Portal do Cidadão</span>
            </button>
            <button
              onClick={() => onSwitchRole('servidor')}
              className={`px-3 py-1.5 rounded-md font-medium transition flex items-center gap-1.5 ${
                currentUser?.role === 'servidor'
                  ? 'bg-slate-800 text-white shadow-sm border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200'
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
