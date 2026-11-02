import React from 'react';
import { IconAlertCircle } from './Icons';

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  actionLabel,
  onAction,
  icon,
  action
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center rounded-xl border border-dashed border-slate-800 bg-slate-900/30">
      <div className="h-12 w-12 rounded-full bg-slate-800/80 border border-slate-700/80 flex items-center justify-center text-slate-400 mb-3 shadow-inner">
        {icon || <IconAlertCircle size={24} />}
      </div>
      <h3 className="text-sm font-semibold text-slate-200">{title}</h3>
      <p className="text-xs text-slate-400 max-w-sm mt-1 leading-relaxed">{description}</p>
      {action || (actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-4 px-3 py-1.5 rounded-lg bg-civic-700 hover:bg-civic-600 text-white text-xs font-medium shadow-xs transition"
        >
          {actionLabel}
        </button>
      ))}
    </div>
  );
};
