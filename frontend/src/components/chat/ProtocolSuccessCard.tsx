import React, { useState } from 'react';
import { ChatFormalizeResponse } from '../../types';
import { IconCheckCircle, IconCopy, IconCheck, IconBuilding, IconClock, IconArrowRight } from '../common/Icons';

interface ProtocolSuccessCardProps {
  data: ChatFormalizeResponse;
  onViewProtocol?: (protocol: string) => void;
  onNewDemand?: () => void;
}

export const ProtocolSuccessCard: React.FC<ProtocolSuccessCardProps> = ({
  data,
  onViewProtocol,
  onNewDemand
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(data.protocol);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full my-4 p-6 rounded-2xl bg-white dark:bg-[#111b24] border border-slate-200 dark:border-[#273a3b] text-slate-800 dark:text-slate-100 font-sans shadow-lg flex flex-col gap-5 animate-in fade-in zoom-in-95 duration-200">
      {/* Cabeçalho da Demanda Registrada (Conforme Frame 5 do Figma) */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20">
          <IconCheckCircle size={24} />
        </div>
        <div>
          <h2 className="text-lg font-extrabold text-[#0d3b42] dark:text-white tracking-tight">
            Demanda registrada!
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Sua solicitação foi encaminhada para a secretaria competente.
          </p>
        </div>
      </div>

      {/* Banner Principal com Número do Protocolo (Faixa Verde Escura do Figma) */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[#082627] text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md">
        <div>
          <span className="text-[10px] uppercase font-bold text-[#5ee0b5] tracking-wider block">
            Protocolo de atendimento
          </span>
          <span className="text-xl sm:text-2xl font-mono font-black text-white tracking-wider block mt-1">
            {data.protocol}
          </span>
        </div>

        <button
          type="button"
          onClick={handleCopy}
          className="px-3.5 py-1.5 rounded-xl bg-[#0F3B3D] hover:bg-[#165053] text-[#5ee0b5] text-xs font-bold border border-[#1C5557] transition flex items-center gap-1.5 shadow-xs"
        >
          {copied ? <IconCheck size={14} className="text-emerald-300" /> : <IconCopy size={14} />}
          <span>{copied ? 'Copiado!' : 'Copiar'}</span>
        </button>
      </div>

      {/* Grid de 3 Cartões de Informação do Figma */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Órgão */}
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#111b24] border border-slate-200 dark:border-[#273a3b] flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[#ddedea] dark:bg-[#082627] text-[#0d3b42] dark:text-[#5ee0b5]">
            <IconBuilding size={16} />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium block">
              Órgão Responsável
            </span>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-100 block">
              {data.department_name || data.demand?.department?.name || 'Órgão Municipal'}
            </span>
          </div>
        </div>

        {/* Gravidade retornada pelo servidor */}
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#111b24] border border-slate-200 dark:border-[#273a3b] flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[#ddedea] dark:bg-[#082627] text-[#0d3b42] dark:text-[#5ee0b5]">
            <IconClock size={16} />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium block">
              Gravidade
            </span>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-100 block">
              {data.severity}
            </span>
          </div>
        </div>

        {/* Status Inicial */}
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#111b24] border border-slate-200 dark:border-[#273a3b] flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <IconCheckCircle size={16} />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium block">
              Status Inicial
            </span>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 block">
              Aberto (Autuado)
            </span>
          </div>
        </div>
      </div>

      {data.severity_justification && <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">{data.severity_justification}</p>}

      {/* Botões de Ação do Rodapé Conforme Figma */}
      <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
        {onViewProtocol && (
          <button
            type="button"
            onClick={() => onViewProtocol(data.protocol)}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#082627] hover:bg-[#0d3839] text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-xs"
          >
            <span>Acompanhar solicitação</span>
            <IconArrowRight size={14} />
          </button>
        )}

        {onNewDemand && (
          <button
            type="button"
            onClick={onNewDemand}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-[#111b24] text-slate-700 dark:text-slate-200 text-xs font-semibold transition"
          >
            Nova solicitação
          </button>
        )}
      </div>
    </div>
  );
};
