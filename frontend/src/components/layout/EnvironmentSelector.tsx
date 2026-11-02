import React from 'react';
import { UserAreas } from '../../types';
import { IconUser, IconShield, IconBarChart } from '../common/Icons';

export type AppArea = 'citizen' | 'server' | 'management';

interface EnvironmentSelectorProps {
  activeArea: AppArea;
  onSelectArea: (area: AppArea) => void;
  areas?: UserAreas;
}

export const EnvironmentSelector: React.FC<EnvironmentSelectorProps> = ({
  activeArea,
  onSelectArea,
  areas
}) => {
  const canCitizen = areas?.citizen?.authorized ?? true;
  const canServer = areas?.server?.authorized ?? false;
  const canManagement = areas?.management?.authorized ?? false;

  return (
    <div
      className="bg-slate-950/90 p-1 rounded-lg flex items-center border border-slate-800 text-xs role-switcher"
      role="group"
      aria-label="Alternar ambiente do sistema"
    >
      {canCitizen && (
        <button
          type="button"
          onClick={() => onSelectArea('citizen')}
          aria-pressed={activeArea === 'citizen'}
          className={`px-3 py-1.5 rounded-md font-medium text-xs transition flex items-center gap-1.5 ${
            activeArea === 'citizen'
              ? 'bg-civic-700 text-white shadow-xs font-semibold role-btn-active'
              : 'text-slate-400 hover:text-slate-200 role-btn-inactive'
          }`}
        >
          <IconUser size={14} />
          <span>Área do Cidadão</span>
        </button>
      )}

      {canServer && (
        <button
          type="button"
          onClick={() => onSelectArea('server')}
          aria-pressed={activeArea === 'server'}
          className={`px-3 py-1.5 rounded-md font-medium text-xs transition flex items-center gap-1.5 ${
            activeArea === 'server'
              ? 'bg-slate-800 text-white shadow-xs border border-slate-700 font-semibold role-btn-active'
              : 'text-slate-400 hover:text-slate-200 role-btn-inactive'
          }`}
        >
          <IconShield size={14} />
          <span>Área do Servidor</span>
        </button>
      )}

      {canManagement && (
        <button
          type="button"
          onClick={() => onSelectArea('management')}
          aria-pressed={activeArea === 'management'}
          className={`px-3 py-1.5 rounded-md font-medium text-xs transition flex items-center gap-1.5 ${
            activeArea === 'management'
              ? 'bg-emerald-900/80 text-emerald-200 shadow-xs border border-emerald-700/80 font-semibold role-btn-active'
              : 'text-slate-400 hover:text-slate-200 role-btn-inactive'
          }`}
        >
          <IconBarChart size={14} />
          <span>Gestão e Indicadores</span>
        </button>
      )}
    </div>
  );
};
