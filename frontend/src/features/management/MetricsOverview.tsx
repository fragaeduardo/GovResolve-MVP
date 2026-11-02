import React from 'react';
import { ManagementOverview } from '../../types';
import { Skeleton } from '../../components/common/Skeleton';
import {
  IconBarChart,
  IconClock,
  IconCheckCircle,
  IconAlertCircle,
  IconShield
} from '../../components/common/Icons';

interface MetricsOverviewProps {
  overview: ManagementOverview | null;
  isLoading: boolean;
}

export const MetricsOverview: React.FC<MetricsOverviewProps> = ({ overview, isLoading }) => {
  if (isLoading || !overview) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Skeleton height="110px" />
        <Skeleton height="110px" />
        <Skeleton height="110px" />
        <Skeleton height="110px" />
      </div>
    );
  }

  const { total, status, severity, resolution_rate } = overview;
  const resolutionPct = Math.round(resolution_rate);

  const abertoPct = total > 0 ? Math.round((status.aberto / total) * 100) : 0;
  const emAndamentoPct = total > 0 ? Math.round((status.em_andamento / total) * 100) : 0;
  const fechadoPct = total > 0 ? Math.round((status.fechado / total) * 100) : 0;

  return (
    <div className="flex flex-col gap-5">
      {/* 4 Cards Principais de Indicadores */}
      <section aria-label="Indicadores Globais da Cidade" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Geral */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider block">
              Volume Municipal Total
            </span>
            <span className="text-3xl font-extrabold text-white mt-1 block">
              {total}
            </span>
            <span className="text-[11px] text-slate-400 mt-1 block">
              Demandas registradas em todos os órgãos
            </span>
          </div>
          <div className="p-3 rounded-xl bg-slate-800 text-slate-300">
            <IconBarChart size={24} />
          </div>
        </div>

        {/* Em Aberto */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-amber-400 font-semibold uppercase tracking-wider block">
                Aguardando Início
              </span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold">
                {abertoPct}%
              </span>
            </div>
            <span className="text-3xl font-extrabold text-amber-300 mt-1 block">
              {status.aberto}
            </span>
            <span className="text-[11px] text-slate-400 mt-1 block">
              Triadas pelo agente com protocolo
            </span>
          </div>
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <IconAlertCircle size={24} />
          </div>
        </div>

        {/* Em Tratamento */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-sky-400 font-semibold uppercase tracking-wider block">
                Em Andamento
              </span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20 font-bold">
                {emAndamentoPct}%
              </span>
            </div>
            <span className="text-3xl font-extrabold text-sky-300 mt-1 block">
              {status.em_andamento}
            </span>
            <span className="text-[11px] text-slate-400 mt-1 block">
              Com equipe técnica em campo
            </span>
          </div>
          <div className="p-3 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
            <IconClock size={24} />
          </div>
        </div>

        {/* Taxa de Resolução */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] text-emerald-400 font-semibold uppercase tracking-wider block">
                Taxa de Resolução
              </span>
              <span className="text-3xl font-extrabold text-emerald-300 mt-1 block">
                {resolutionPct}%
              </span>
            </div>
            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <IconCheckCircle size={24} />
            </div>
          </div>
          {/* Barra de progresso */}
          <div className="w-full bg-slate-800 rounded-full h-2 mt-2 overflow-hidden">
            <div
              className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(resolutionPct, 100)}%` }}
              role="progressbar"
              aria-valuenow={resolutionPct}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">
            {status.fechado} concluídas de {total} protocoladas
          </span>
        </div>
      </section>

      {/* Gráficos / Distribuições Analíticas */}
      <section
        aria-label="Distribuição analítica de demandas"
        className="grid grid-cols-1 lg:grid-cols-2 gap-4"
      >
        {/* Distribuição por Status */}
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 shadow-xs flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Distribuição por Ciclo de Vida
            </h3>
            <span className="text-[11px] text-slate-400">Total: {total}</span>
          </div>

          {/* Barra composta */}
          <div className="w-full h-4 bg-slate-800 rounded-full overflow-hidden flex">
            {abertoPct > 0 && (
              <div
                style={{ width: `${abertoPct}%` }}
                title={`Aberto: ${status.aberto} (${abertoPct}%)`}
                className="bg-amber-500 transition-all duration-500"
              />
            )}
            {emAndamentoPct > 0 && (
              <div
                style={{ width: `${emAndamentoPct}%` }}
                title={`Em Andamento: ${status.em_andamento} (${emAndamentoPct}%)`}
                className="bg-sky-500 transition-all duration-500"
              />
            )}
            {fechadoPct > 0 && (
              <div
                style={{ width: `${fechadoPct}%` }}
                title={`Fechado: ${status.fechado} (${fechadoPct}%)`}
                className="bg-emerald-500 transition-all duration-500"
              />
            )}
          </div>

          {/* Legenda de Status */}
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
              <div>
                <span className="text-slate-400 text-[11px] block">Abertas</span>
                <strong className="text-white text-xs">{status.aberto} ({abertoPct}%)</strong>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-500 shrink-0" />
              <div>
                <span className="text-slate-400 text-[11px] block">Em Andamento</span>
                <strong className="text-white text-xs">{status.em_andamento} ({emAndamentoPct}%)</strong>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
              <div>
                <span className="text-slate-400 text-[11px] block">Fechadas</span>
                <strong className="text-white text-xs">{status.fechado} ({fechadoPct}%)</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Distribuição por Gravidade Técnica (IA) */}
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 shadow-xs flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <span>Classificação de Gravidade</span>
              <span className="px-1.5 py-0.2 rounded-xs bg-civic-800 text-civic-300 text-[10px] font-mono">
                IA RF016
              </span>
            </h3>
            <span className="text-[11px] text-slate-400">Ponderação de Risco</span>
          </div>

          {/* Barras de Severidade */}
          <div className="flex flex-col gap-2">
            {/* Crítica */}
            <div className="flex items-center gap-3">
              <span className="w-16 text-[11px] font-semibold text-rose-400">Crítica</span>
              <div className="flex-1 bg-slate-800 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-rose-500 h-2.5 rounded-full transition-all duration-500"
                  style={{ width: `${total > 0 ? (severity.critica / total) * 100 : 0}%` }}
                />
              </div>
              <span className="w-10 text-right text-xs font-bold text-white">
                {severity.critica}
              </span>
            </div>

            {/* Alta */}
            <div className="flex items-center gap-3">
              <span className="w-16 text-[11px] font-semibold text-amber-400">Alta</span>
              <div className="flex-1 bg-slate-800 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-amber-500 h-2.5 rounded-full transition-all duration-500"
                  style={{ width: `${total > 0 ? (severity.alta / total) * 100 : 0}%` }}
                />
              </div>
              <span className="w-10 text-right text-xs font-bold text-white">
                {severity.alta}
              </span>
            </div>

            {/* Média */}
            <div className="flex items-center gap-3">
              <span className="w-16 text-[11px] font-semibold text-yellow-400">Média</span>
              <div className="flex-1 bg-slate-800 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-yellow-500 h-2.5 rounded-full transition-all duration-500"
                  style={{ width: `${total > 0 ? (severity.media / total) * 100 : 0}%` }}
                />
              </div>
              <span className="w-10 text-right text-xs font-bold text-white">
                {severity.media}
              </span>
            </div>

            {/* Baixa */}
            <div className="flex items-center gap-3">
              <span className="w-16 text-[11px] font-semibold text-emerald-400">Baixa</span>
              <div className="flex-1 bg-slate-800 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-emerald-500 h-2.5 rounded-full transition-all duration-500"
                  style={{ width: `${total > 0 ? (severity.baixa / total) * 100 : 0}%` }}
                />
              </div>
              <span className="w-10 text-right text-xs font-bold text-white">
                {severity.baixa}
              </span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
