import React, { useState, useEffect } from 'react';
import { ProposalDTO } from '../../types';
import { IconX, IconEdit } from '../common/Icons';

interface RevisionModalProps {
  isOpen: boolean;
  proposal: ProposalDTO;
  isLoading: boolean;
  onClose: () => void;
  onRevise: (instructions: string, slots?: Record<string, string>) => void;
}

export const RevisionModal: React.FC<RevisionModalProps> = ({
  isOpen,
  proposal,
  isLoading,
  onClose,
  onRevise
}) => {
  const [instructions, setInstructions] = useState('');
  const [slots, setSlots] = useState<Record<string, string>>({});

  useEffect(() => {
    if (proposal?.slots) {
      setSlots({ ...proposal.slots });
    }
  }, [proposal]);

  // Tecla Escape para fechar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isLoading) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isLoading, onClose]);

  if (!isOpen) return null;

  const handleSlotChange = (key: string, value: string) => {
    setSlots(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalInstructions = instructions.trim() || 'Correção manual de campos da proposta';
    onRevise(finalInstructions, slots);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/75 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="revision-modal-title"
    >
      <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-5 flex flex-col gap-4 text-slate-100 font-sans max-h-[90vh] overflow-y-auto">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-civic-700/30 text-civic-300 border border-civic-600/40">
              <IconEdit size={16} />
            </div>
            <div>
              <h3 id="revision-modal-title" className="text-sm font-bold text-white">
                Corrigir Informações da Demanda
              </h3>
              <p className="text-[11px] text-slate-400">
                Ajuste os dados antes de gerar a versão {proposal.version + 1} da proposta
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            aria-label="Fechar modal"
            className="p-1 text-slate-400 hover:text-slate-200 rounded transition"
          >
            <IconX size={18} />
          </button>
        </div>

        {/* Formulário de Edição */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label htmlFor="slot-logradouro" className="text-xs font-semibold text-slate-300">
              Endereço (rua, avenida, número)
            </label>
            <input
              id="slot-logradouro"
              type="text"
              value={slots.logradouro || ''}
              onChange={e => handleSlotChange('logradouro', e.target.value)}
              placeholder="Ex: Rua 10, nº 25"
              className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-civic-500"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="slot-bairro" className="text-xs font-semibold text-slate-300">
              Bairro / Setor
            </label>
            <input
              id="slot-bairro"
              type="text"
              value={slots.bairro || ''}
              onChange={e => handleSlotChange('bairro', e.target.value)}
              placeholder="Ex: Setor Central"
              className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-civic-500"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="slot-referencia" className="text-xs font-semibold text-slate-300">
              Ponto de Referência ou Cruzamento
            </label>
            <input
              id="slot-referencia"
              type="text"
              value={slots.referencia || ''}
              onChange={e => handleSlotChange('referencia', e.target.value)}
              placeholder="Ex: Em frente à Farmácia Popular, esquina com a Av. Brasil"
              className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-civic-500"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="slot-detalhes" className="text-xs font-semibold text-slate-300">
              Observações / Detalhes Adicionais
            </label>
            <input
              id="slot-detalhes"
              type="text"
              value={slots.detalhes || ''}
              onChange={e => handleSlotChange('detalhes', e.target.value)}
              placeholder="Ex: Cratera com 1 metro de profundidade, risco iminente de acidente"
              className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-civic-500"
            />
          </div>

          <div className="flex flex-col gap-1 pt-2 border-t border-slate-800">
            <label htmlFor="revision-instruction" className="text-xs font-semibold text-slate-300">
              Instruções Adicionais para o Assistente (opcional)
            </label>
            <textarea
              id="revision-instruction"
              rows={2}
              value={instructions}
              onChange={e => setInstructions(e.target.value)}
              placeholder="Ex: Por favor reescreva a descrição informando que o asfalto cedeu ontem à noite."
              className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-civic-500 resize-none"
            />
          </div>

          {/* Botões do Rodapé */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-slate-200 text-xs transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 rounded-lg bg-civic-600 hover:bg-civic-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm disabled:opacity-50"
            >
              <IconEdit size={14} />
              <span>{isLoading ? 'Atualizando...' : `Salvar e Gerar Proposta v${proposal.version + 1}`}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
