import React from 'react';
import { ProposalDTO } from '../../types';
import { IconCheckCircle, IconEdit, IconX, IconBuilding } from '../common/Icons';

interface ProposalCardProps {
  proposal: ProposalDTO;
  isLoading: boolean;
  onConfirm: () => void;
  onReturnToConversation: () => void;
  onCancel: () => void;
}

export const ProposalCard: React.FC<ProposalCardProps> = ({
  proposal,
  isLoading,
  onConfirm,
  onReturnToConversation,
  onCancel
}) => {
  const { version, department, category, title, description, slots, changed_fields } = proposal;

  const isChanged = (field: string) => changed_fields?.includes(field);

  return (
    <div className="w-full my-3 p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#111b24] border-2 border-[#f4a261]/60 dark:border-[#5ee0b5]/60 shadow-lg text-slate-800 dark:text-slate-100 font-sans flex flex-col gap-3.5 proposal-card">
      {/* Cabeçalho do Cartão HITL Conforme Figma */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-[#273a3b] proposal-header">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-[#f4a261]/10 text-[#f4a261] dark:bg-[#5ee0b5]/10 dark:text-[#5ee0b5] border border-[#f4a261]/20 dark:border-[#5ee0b5]/20">
            <IconBuilding size={16} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-[#0d3b42] dark:text-white proposal-title">
                Resumo da proposta
              </h3>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#ddedea] dark:bg-[#14393C] text-[#0d3b42] dark:text-[#5ee0b5] border border-[#c7d8d4] dark:border-[#273a3b] proposal-badge">
                v{version}
              </span>
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              Órgão sugerido: <strong className="text-slate-700 dark:text-slate-200">{department?.name || 'Órgão Municipal'}</strong>
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          title="Cancelar esta solicitação antes da autuação"
          className="text-slate-400 hover:text-rose-500 p-1.5 rounded-lg transition disabled:opacity-50"
        >
          <IconX size={16} />
        </button>
      </div>

      {/* Conteúdo Factual Estruturado (Slots) */}
      <div className="rounded-xl bg-slate-50 dark:bg-[#111b24] border border-slate-200 dark:border-[#273a3b] p-3.5 flex flex-col gap-2 text-xs">
        <div>
          <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-400 tracking-wider">
            Título
          </span>
          <p className="text-xs sm:text-sm font-semibold text-[#0d3b42] dark:text-white mt-0.5">
            {title}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-200/80 dark:border-[#273a3b]">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Localização
            </span>
            <p className={`text-xs font-medium text-slate-800 dark:text-slate-200 mt-0.5 ${isChanged('logradouro') ? 'text-[#f4a261] font-bold' : ''}`}>
              {slots?.logradouro || 'Não informado'}
            </p>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Bairro
            </span>
            <p className={`text-xs font-medium text-slate-800 dark:text-slate-200 mt-0.5 ${isChanged('bairro') ? 'text-[#f4a261] font-bold' : ''}`}>
              {slots?.bairro || 'Goiânia - GO'}
            </p>
          </div>
        </div>

        {slots?.referencia && (
          <div className="pt-2 border-t border-slate-200/80 dark:border-[#273a3b]">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Ponto de Referência
            </span>
            <p className={`text-xs font-medium text-slate-800 dark:text-slate-200 mt-0.5 ${isChanged('referencia') ? 'text-[#f4a261] font-bold' : ''}`}>
              {slots.referencia}
            </p>
          </div>
        )}

        <div className="pt-2 border-t border-slate-200/80 dark:border-[#273a3b]">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
            Descrição Factual
          </span>
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
            {description}
          </p>
        </div>
      </div>

      {/* Ações HITL Conforme Figma */}
      <div className="flex items-center justify-end gap-2.5 pt-1">
        <button
          type="button"
          disabled={isLoading}
          onClick={onReturnToConversation}
          className="px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-[#111b24] text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-50"
        >
          <IconEdit size={13} />
          <span>Não, quero ajustar</span>
        </button>

        <button
          type="button"
          disabled={isLoading}
          onClick={onConfirm}
          className="proposal-action-primary px-4 py-2 rounded-xl bg-[#f4a261] hover:bg-[#e99855] dark:bg-[#5ee0b5] dark:hover:bg-[#49cfa6] text-[#0d3b42] dark:text-[#f3f7f6] text-xs font-bold flex items-center gap-1.5 transition disabled:opacity-50"
        >
          <IconCheckCircle size={14} />
          <span>{isLoading ? 'Autuando...' : 'Confirmar e gerar protocolo'}</span>
        </button>
      </div>
    </div>
  );
};
