import React from 'react';
import { IconChevronLeft, IconChevronRight } from './Icons';

interface PaginationProps {
  page: number;
  total: number;
  pageSize: number;
  pages?: number;
  onPageChange: (newPage: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({
  page,
  total,
  pageSize,
  pages,
  onPageChange
}) => {
  const totalPages = pages || Math.max(1, Math.ceil(total / pageSize));

  if (totalPages <= 1) return null;

  const startItem = (page - 1) * pageSize + 1;
  const endItem = Math.min(total, page * pageSize);

  return (
    <nav
      className="flex items-center justify-between px-3 py-2 bg-slate-900/60 border-t border-slate-800 text-xs text-slate-400 font-sans"
      aria-label="Navegação entre páginas"
    >
      <div>
        Exibindo <span className="font-semibold text-slate-200">{startItem}</span> a{' '}
        <span className="font-semibold text-slate-200">{endItem}</span> de{' '}
        <span className="font-semibold text-slate-200">{total}</span> registros
      </div>

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          aria-label="Página anterior"
          className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-200 border border-slate-700/60 transition"
        >
          <IconChevronLeft size={14} />
        </button>

        <span className="px-2.5 py-1 rounded bg-slate-950 font-mono text-[11px] text-slate-300 border border-slate-800">
          Página {page} de {totalPages}
        </span>

        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          aria-label="Próxima página"
          className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-200 border border-slate-700/60 transition"
        >
          <IconChevronRight size={14} />
        </button>
      </div>
    </nav>
  );
};
