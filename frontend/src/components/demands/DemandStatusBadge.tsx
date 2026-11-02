import React from 'react';
import { DemandStatus } from '../../types';
import { IconClock, IconAlertCircle, IconCheckCircle } from '../common/Icons';

interface DemandStatusBadgeProps {
  status: DemandStatus;
  size?: 'sm' | 'md';
}

export const DemandStatusBadge: React.FC<DemandStatusBadgeProps> = ({
  status,
  size = 'md'
}) => {
  const isSm = size === 'sm';
  const padding = isSm ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs';

  switch (status) {
    case 'ABERTO':
      return (
        <span className={`inline-flex items-center gap-1 font-semibold rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 ${padding}`}>
          <IconAlertCircle size={isSm ? 12 : 14} />
          <span>Aberto</span>
        </span>
      );
    case 'EM ANDAMENTO':
      return (
        <span className={`inline-flex items-center gap-1 font-semibold rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/30 ${padding}`}>
          <IconClock size={isSm ? 12 : 14} />
          <span>Em Andamento</span>
        </span>
      );
    case 'FECHADO':
      return (
        <span className={`inline-flex items-center gap-1 font-semibold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 ${padding}`}>
          <IconCheckCircle size={isSm ? 12 : 14} />
          <span>Concluído</span>
        </span>
      );
    default:
      return (
        <span className={`inline-flex items-center gap-1 font-semibold rounded-full bg-slate-500/10 text-slate-400 border border-slate-500/30 ${padding}`}>
          <span>{status}</span>
        </span>
      );
  }
};
