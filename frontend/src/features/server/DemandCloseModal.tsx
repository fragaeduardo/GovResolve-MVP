import React, { useState, useEffect } from 'react';
import { Demand } from '../../types';
import { IconCheckCircle, IconX } from '../../components/common/Icons';

interface DemandCloseModalProps {
  isOpen: boolean;
  demand: Demand | null;
  isLoading: boolean;
  onClose: () => void;
  onConfirmClose: (protocol: string, notes?: string, resolutionNotes?: string) => Promise<void>;
}

export const DemandCloseModal: React.FC<DemandCloseModalProps> = ({
  isOpen,
  demand,
  isLoading,
  onClose,
  onConfirmClose
}) => {
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setResolutionNotes('');
      setNotes('Serviço vistoriado e executado com sucesso no local.');
      setError(null);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isLoading) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isLoading, onClose]);

  if (!isOpen || !demand) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolutionNotes.trim() || resolutionNotes.trim().length < 10) {
      setError('O parecer de resolução técnico é obrigatório e deve ter no mínimo 10 caracteres (RF014).');
      return;
    }

    try {
      await onConfirmClose(demand.protocol, notes, resolutionNotes.trim());
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Falha ao concluir atendimento.');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="close-modal-title"
    >
      <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-5 flex flex-col gap-4 text-slate-100 font-sans">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <IconCheckCircle size={18} />
            </div>
            <div>
              <span className="font-mono text-xs font-bold text-civic-400">
                {demand.protocol}
              </span>
              <h3 id="close-modal-title" className="text-sm font-bold text-white mt-0.5">
                Concluir Atendimento de Demanda
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg transition"
          >
            <IconX size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs">
            <span className="font-semibold text-slate-200 block">{demand.title}</span>
            <span className="text-slate-400 line-clamp-2 mt-0.5">{demand.description}</span>
          </div>

          {/* Campo Obrigatório: Parecer de Resolução (RF014) */}
          <div className="flex flex-col gap-1">
            <label htmlFor="resolution-notes" className="text-xs font-bold text-emerald-300 flex items-center justify-between">
              <span>Parecer Técnico de Resolução (Obrigatório - RF014) *</span>
              <span className="text-[10px] text-slate-400 font-normal">Mínimo 10 caracteres</span>
            </label>
            <textarea
              id="resolution-notes"
              rows={3}
              required
              value={resolutionNotes}
              onChange={e => setResolutionNotes(e.target.value)}
              placeholder="Descreva as ações executadas pela equipe (ex: Asfalto recomposto com aplicação de 30kg de CBUQ e compactação com rolo liso)..."
              className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 resize-none transition"
            />
          </div>

          {/* Campo Opcional: Notas Internas de Tramitação */}
          <div className="flex flex-col gap-1">
            <label htmlFor="internal-notes" className="text-xs font-medium text-slate-300">
              Observações Administrativas Internas
            </label>
            <input
              id="internal-notes"
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Ex: Equipe de campo destacada sob O.S. 2024-991"
              className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-civic-500"
            />
          </div>

          {error && (
            <p className="text-xs text-rose-400 font-medium p-2.5 rounded bg-rose-950/40 border border-rose-800">
              {error}
            </p>
          )}

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
              disabled={isLoading || !resolutionNotes.trim()}
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
            >
              <IconCheckCircle size={15} />
              <span>{isLoading ? 'Registrando fechamento...' : 'Concluir Demanda (FECHADO)'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
