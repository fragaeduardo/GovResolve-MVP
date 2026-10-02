import React from 'react';
import { UserProfile } from '../services/api';

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
    <header className="bg-blue-900 text-white shadow-md border-b-4 border-yellow-500" role="banner">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Identidade Visual */}
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="Logotipo GovResolve" className="h-10 w-10 object-contain bg-white rounded-full p-1" />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-xl tracking-tight">GovResolve</span>
              <span className="text-xs bg-blue-800 text-blue-200 px-2 py-0.5 rounded font-mono">MVP</span>
            </div>
            <p className="text-xs text-blue-200">Plataforma Municipal de Gestão e Triagem Inteligente</p>
          </div>
        </div>

        {/* Controles de Acessibilidade e Troca de Perfil */}
        <div className="flex items-center gap-3 flex-wrap justify-center">
          
          {/* Botão de Alto Contraste (WCAG) */}
          <button
            onClick={onToggleContrast}
            aria-pressed={isHighContrast}
            aria-label="Alternar modo de alto contraste"
            className="text-xs font-semibold px-3 py-1.5 rounded border border-white hover:bg-white hover:text-blue-900 transition flex items-center gap-1 focus:ring-2 focus:ring-yellow-400"
          >
            <span>👁️</span> {isHighContrast ? 'Contraste Normal' : 'Alto Contraste'}
          </button>

          {/* Troca de Perfil (Cidadão Gov.br vs Servidor Público) */}
          <div className="bg-blue-950 p-1 rounded-lg flex items-center border border-blue-800 text-xs" role="group" aria-label="Alternar tipo de usuário">
            <button
              onClick={() => onSwitchRole('cidadao')}
              className={`px-3 py-1.5 rounded font-medium transition ${
                currentUser?.role === 'cidadao'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-blue-300 hover:text-white'
              }`}
            >
              🏛️ Cidadão (Gov.br)
            </button>
            <button
              onClick={() => onSwitchRole('servidor')}
              className={`px-3 py-1.5 rounded font-medium transition ${
                currentUser?.role === 'servidor'
                  ? 'bg-amber-600 text-white shadow'
                  : 'text-blue-300 hover:text-white'
              }`}
            >
              💼 Servidor Público
            </button>
          </div>

          {/* Usuário Atual */}
          {currentUser && (
            <div className="text-right pl-2 hidden sm:block border-l border-blue-800">
              <p className="text-xs font-semibold">{currentUser.name}</p>
              <p className="text-[10px] text-blue-300 font-mono">CPF: {currentUser.cpf}</p>
            </div>
          )}

        </div>

      </div>
    </header>
  );
};
