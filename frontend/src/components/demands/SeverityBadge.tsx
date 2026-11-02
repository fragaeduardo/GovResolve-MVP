import React from 'react';
import { DemandSeverity } from '../../types';

interface SeverityBadgeProps {
  severity?: DemandSeverity | null;
  size?: 'sm' | 'md';
}

export const SeverityBadge: React.FC<SeverityBadgeProps> = ({
  severity = 'MEDIA',
  size = 'md'
}) => {
  const isSm = size === 'sm';
  const padding = isSm ? 'px-1.5 py-0.2 text-[9px]' : 'px-2 py-0.5 text-[11px]';

  switch (severity) {
    case 'CRITICA':
      return (
        <span className={`inline-flex items-center gap-1 font-bold rounded uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/40 ${padding}`}>
          Crítica
        </span>
      );
    case 'ALTA':
      return (
        <span className={`inline-flex items-center gap-1 font-bold rounded uppercase tracking-wider bg-orange-500/20 text-orange-300 border border-orange-500/40 ${padding}`}>
          Alta
        </span>
      );
    case 'MEDIA':
      return (
        <span className={`inline-flex items-center gap-1 font-semibold rounded uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40 ${padding}`}>
          Média
        </span>
      );
    case 'BAIXA':
      return (
        <span className={`inline-flex items-center gap-1 font-semibold rounded uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 ${padding}`}>
          Baixa
        </span>
      );
    default:
      return null;
  }
};
