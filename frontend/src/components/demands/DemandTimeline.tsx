import React from 'react';
import { DemandStatus, StatusHistoryDetail } from '../../types';
import { IconCheck, IconClock, IconAlertCircle, IconCheckCircle } from '../common/Icons';

interface DemandTimelineProps {
  currentStatus: DemandStatus;
  history?: StatusHistoryDetail[];
  resolutionNotes?: string | null;
  createdAt: string;
}

export const DemandTimeline: React.FC<DemandTimelineProps> = ({
  currentStatus,
  history = [],
  resolutionNotes,
  createdAt
}) => {
  const steps: { key: DemandStatus; label: string }[] = [
    { key: 'ABERTO', label: 'Registrado' },
    { key: 'EM ANDAMENTO', label: 'Em Andamento' },
    { key: 'FECHADO', label: 'Concluído' }
  ];

  const getStepIndex = (st: DemandStatus) => {
    switch (st) {
      case 'ABERTO': return 0;
      case 'EM ANDAMENTO': return 1;
      case 'FECHADO': return 2;
      default: return 0;
    }
  };

  const currentIdx = getStepIndex(currentStatus);

  const formatDate = (isoString?: string) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      return d.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="flex flex-col gap-6 font-sans">
      {/* 1. Stepper Horizontal Visual */}
      <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800">
        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
          Etapa do Atendimento
        </h4>
        <div className="flex items-center justify-between relative max-w-lg mx-auto">
          {/* Linha de progresso de fundo */}
          <div className="absolute top-1/2 left-6 right-6 -translate-y-1/2 h-0.5 bg-slate-800 z-0" />
          {/* Linha ativa */}
          <div
            className="absolute top-1/2 left-6 -translate-y-1/2 h-0.5 bg-civic-600 transition-all duration-300 z-0"
            style={{
              width: currentIdx === 0 ? '0%' : currentIdx === 1 ? '50%' : 'calc(100% - 3rem)'
            }}
          />

          {steps.map((step, idx) => {
            const isCompleted = idx < currentIdx;
            const isCurrent = idx === currentIdx;

            return (
              <div key={step.key} className="flex flex-col items-center gap-1.5 z-10">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition ${
                    isCurrent
                      ? 'bg-civic-600 text-white ring-4 ring-civic-900/50 shadow-sm'
                      : isCompleted
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}
                >
                  {isCompleted ? <IconCheck size={14} /> : idx + 1}
                </div>
                <span
                  className={`text-[11px] font-medium ${
                    isCurrent
                      ? 'text-civic-300 font-semibold'
                      : isCompleted
                      ? 'text-slate-200'
                      : 'text-slate-500'
                  }`}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Parecer de Resolução (quando concluído) */}
      {resolutionNotes && (
        <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/80 text-emerald-200 flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <IconCheckCircle size={18} className="text-emerald-400" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-300">
              Parecer Oficial de Conclusão (RF014)
            </h4>
          </div>
          <p className="text-xs leading-relaxed text-emerald-100 bg-emerald-900/30 p-3 rounded-lg border border-emerald-800/50 font-sans">
            {resolutionNotes}
          </p>
        </div>
      )}

      {/* 3. Timeline Vertical Detalhada */}
      <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 flex flex-col gap-3">
        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Histórico e Tramitação Oficial
        </h4>

        {history && history.length > 0 ? (
          <div className="relative pl-6 flex flex-col gap-4 before:content-[''] before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
            {history.map((item, idx) => (
              <div key={idx} className="relative flex flex-col gap-1">
                {/* Marcador na linha */}
                <div className="absolute -left-[23px] top-1 w-3.5 h-3.5 rounded-full bg-slate-900 border-2 border-civic-500 shadow-xs" />

                <div className="flex items-center gap-2 text-xs">
                  <span className="font-semibold text-slate-200">
                    {item.from === item.to
                      ? 'Atualização do atendimento'
                      : !item.from && item.to === 'EM ANDAMENTO'
                      ? 'Reclamação registrada e atendimento iniciado'
                      : item.to === 'ABERTO'
                      ? 'Demanda Registrada'
                      : item.to === 'EM ANDAMENTO'
                      ? 'Atendimento Iniciado'
                      : item.to === 'FECHADO'
                      ? 'Atendimento Concluído'
                      : `Alteração para ${item.to}`}
                  </span>
                  <span className="text-[11px] text-slate-500 font-mono">
                    {formatDate(item.created_at)}
                  </span>
                </div>

                {item.notes && (
                  <p className="text-xs text-slate-300 bg-slate-950/60 p-2 rounded border border-slate-800 leading-relaxed">
                    {item.notes}
                  </p>
                )}

                {item.changed_by_name && (
                  <span className="text-[10px] text-slate-500">
                    Responsável: {item.changed_by_name}
                  </span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-xs text-slate-400 italic">
            Demanda registrada em {formatDate(createdAt)}. Aguardando início de atendimento técnico pelo órgão responsável.
          </div>
        )}
      </div>
    </div>
  );
};
