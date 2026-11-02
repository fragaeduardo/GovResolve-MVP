import React, { useEffect, useState } from 'react';
import { DemandDetailed } from '../../types';
import { DemandStatusBadge } from './DemandStatusBadge';
import { SeverityBadge } from './SeverityBadge';
import { DemandTimeline } from './DemandTimeline';
import { IconX, IconShield, IconBuilding, IconUser } from '../common/Icons';

interface DemandDossierModalProps {
  isOpen: boolean;
  demand: DemandDetailed | null;
  onClose: () => void;
  onAddProgressNote: (note: string) => Promise<void>;
}

export const DemandDossierModal: React.FC<DemandDossierModalProps> = ({
  isOpen,
  demand,
  onClose,
  onAddProgressNote
}) => {
  const [progressNote, setProgressNote] = useState('');
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [noteError, setNoteError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setProgressNote('');
      setNoteError(null);
    }
  }, [isOpen, demand?.protocol]);

  // Tecla Escape para fechar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !demand) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="history-modal-title"
    >
      <div className="w-full max-w-3xl rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-5 flex flex-col gap-4 text-slate-100 font-sans max-h-[90vh] overflow-y-auto">
        {/* Cabeçalho do histórico */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-civic-700/30 text-civic-300 border border-civic-600/40">
              <IconShield size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-civic-400">
                  {demand.protocol}
                </span>
                <DemandStatusBadge status={demand.status} size="sm" />
                <SeverityBadge severity={demand.severity?.level} size="sm" />
              </div>
              <h3 id="history-modal-title" className="text-sm font-bold text-white mt-0.5">
                Histórico da Reclamação
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar histórico"
            className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg transition"
          >
            <IconX size={18} />
          </button>
        </div>

        {/* Título e Descrição */}
        <div className="flex flex-col gap-2 p-3.5 rounded-xl bg-slate-950 border border-slate-800">
          <h4 className="text-sm font-bold text-white">{demand.title}</h4>
          <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">
            {demand.description}
          </p>
        </div>

        {/* Metadados Cadastrais e IA */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 text-xs">
          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col gap-1">
            <div className="flex items-center gap-1.5 text-slate-400 text-[10px] uppercase font-bold tracking-wider">
              <IconBuilding size={14} className="text-civic-400" />
              <span>Órgão Competente</span>
            </div>
            <span className="font-semibold text-slate-200">
              {demand.department?.name || 'Não atribuído'}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col gap-1">
            <div className="flex items-center gap-1.5 text-slate-400 text-[10px] uppercase font-bold tracking-wider">
              <IconUser size={14} className="text-civic-400" />
              <span>Cidadão Notificante</span>
            </div>
            <span className="font-semibold text-slate-200">
              {demand.citizen_name || `Cidadão #${demand.citizen_id}`}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col gap-1">
            <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">
              Categoria
            </span>
            <span className="font-semibold text-slate-200">
              {demand.classification?.category || 'Atendimento Geral'}
            </span>
          </div>
        </div>

        {/* Justificativa Técnica da IA sobre Gravidade */}
        {demand.severity?.justification && (
          <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-800/60 text-amber-200 text-xs flex flex-col gap-1">
            <span className="text-[10px] uppercase font-bold text-amber-300 tracking-wider">
              Parecer de Triagem do Agente Especialista em Gravidade
            </span>
            <p className="leading-relaxed text-amber-100">
              {demand.severity.justification}
            </p>
          </div>
        )}

        {/* Linha do Tempo e Histórico de Tramitação */}
        <DemandTimeline
          currentStatus={demand.status}
          history={demand.history}
          resolutionNotes={demand.resolution_notes}
          createdAt={demand.created_at}
        />

        {demand.status === 'EM ANDAMENTO' && (
          <form
            className="flex flex-col gap-2 p-3.5 rounded-xl bg-slate-950 border border-slate-800"
            onSubmit={async (event) => {
              event.preventDefault();
              if (!progressNote.trim()) return;
              setIsSavingNote(true);
              setNoteError(null);
              try {
                await onAddProgressNote(progressNote.trim());
                setProgressNote('');
              } catch (error: any) {
                setNoteError(error?.message || 'Não foi possível registrar o andamento.');
              } finally {
                setIsSavingNote(false);
              }
            }}
          >
            <label htmlFor="progress-note" className="text-xs font-semibold text-slate-200">
              Adicionar comentário de andamento
            </label>
            <textarea
              id="progress-note"
              value={progressNote}
              onChange={(event) => setProgressNote(event.target.value)}
              maxLength={1000}
              rows={3}
              required
              placeholder="Descreva uma atualização do atendimento..."
              className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-civic-500 resize-y"
            />
            {noteError && <p role="alert" className="text-xs text-rose-400">{noteError}</p>}
            <div className="flex items-center justify-between gap-3">
              <span className="text-[11px] text-slate-500">A atualização ficará visível no histórico da reclamação.</span>
              <button
                type="submit"
                disabled={isSavingNote || !progressNote.trim()}
                className="px-3 py-2 rounded-lg bg-civic-700 hover:bg-civic-600 disabled:opacity-50 text-white text-xs font-semibold"
              >
                {isSavingNote ? 'Salvando...' : 'Adicionar comentário'}
              </button>
            </div>
          </form>
        )}

        {/* Rodapé */}
        <div className="flex justify-end pt-2 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
          >
            Fechar Histórico
          </button>
        </div>
      </div>
    </div>
  );
};
