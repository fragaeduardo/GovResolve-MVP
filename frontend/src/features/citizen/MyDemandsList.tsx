import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../services/api';
import { Demand, DemandDetailed } from '../../types';
import { DemandStatusBadge } from '../../components/demands/DemandStatusBadge';
import { SeverityBadge } from '../../components/demands/SeverityBadge';
import { DemandTimeline } from '../../components/demands/DemandTimeline';
import { FeedbackForm } from '../../components/demands/FeedbackForm';
import { Pagination } from '../../components/common/Pagination';
import { CardSkeleton } from '../../components/common/Skeleton';
import { EmptyState } from '../../components/common/EmptyState';
import {
  IconSearch,
  IconClock,
  IconArrowRight,
  IconFileText,
  IconChevronLeft,
  IconBuilding
} from '../../components/common/Icons';

interface MyDemandsListProps {
  initialProtocol?: string | null;
  onClearInitialProtocol?: () => void;
}

export const MyDemandsList: React.FC<MyDemandsListProps> = ({
  initialProtocol,
  onClearInitialProtocol
}) => {
  const [demands, setDemands] = useState<Demand[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtros & Paginação
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [search, setSearch] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [pageSize] = useState<number>(10);
  const [total, setTotal] = useState<number>(0);
  const [pages, setPages] = useState<number>(1);

  // Demanda Selecionada para Visualização Detalhada
  const [selectedProtocol, setSelectedProtocol] = useState<string | null>(initialProtocol || null);
  const [detailedDemand, setDetailedDemand] = useState<DemandDetailed | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const loadDemands = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getMyDemands({
        status: statusFilter || undefined,
        search: search || undefined,
        page,
        pageSize
      });

      if (Array.isArray(res)) {
        setDemands(res);
        setTotal(res.length);
        setPages(1);
      } else {
        setDemands(res.items || []);
        setTotal(res.total || 0);
        setPages(res.pages || Math.max(1, Math.ceil(res.total / pageSize)));
      }
    } catch (err: any) {
      setError(err?.message || 'Falha ao carregar suas demandas.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search, page, pageSize]);

  useEffect(() => {
    loadDemands();
  }, [loadDemands]);

  // Carrega detalhe quando um protocolo é selecionado
  const loadDetail = useCallback(async (protocol: string) => {
    setLoadingDetail(true);
    try {
      const data = await api.getDemandByProtocol(protocol);
      setDetailedDemand(data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoadingDetail(false);
    }
  }, []);

  useEffect(() => {
    if (selectedProtocol) {
      loadDetail(selectedProtocol);
    } else {
      setDetailedDemand(null);
    }
  }, [selectedProtocol, loadDetail]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadDemands();
  };

  const handleBackToList = () => {
    setSelectedProtocol(null);
    setDetailedDemand(null);
    if (onClearInitialProtocol) onClearInitialProtocol();
  };

  // Se houver uma demanda selecionada, exibe a tela de timeline e feedback (Screen 6 do Figma)
  if (selectedProtocol) {
    if (loadingDetail || !detailedDemand) {
      return (
        <div className="flex-1 min-h-0 max-h-[710px] overflow-y-auto rounded-[24px] bg-white dark:bg-[#111b24] border border-[#c7d8d4] dark:border-[#273a3b] p-6 flex flex-col gap-4 font-sans">
          <button
            type="button"
            onClick={handleBackToList}
            className="self-start flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-white transition"
          >
            <IconChevronLeft size={16} />
            <span>Voltar para a lista</span>
          </button>
          <CardSkeleton />
        </div>
      );
    }

    return (
      <div className="flex-1 min-h-0 max-h-[710px] overflow-y-auto rounded-[24px] bg-white dark:bg-[#111b24] border border-[#c7d8d4] dark:border-[#273a3b] p-5 flex flex-col gap-[14px] font-sans">
        {/* Barra de Voltar Conforme Figma */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-[#273a3b]">
          <button
            type="button"
            onClick={handleBackToList}
            className="flex items-center gap-1.5 text-xs font-bold text-[#0d3b42] dark:text-[#5ee0b5] hover:underline transition"
          >
            <IconChevronLeft size={16} />
            <span>Voltar para lista de protocolos</span>
          </button>

          <div className="flex items-center gap-2">
            <DemandStatusBadge status={detailedDemand.status} />
            <SeverityBadge severity={detailedDemand.severity?.level} />
          </div>
        </div>

        {/* Título da Demanda Selecionada */}
        <div>
          <span className="text-[10px] uppercase font-bold text-[#f4a261] dark:text-[#5ee0b5] font-mono tracking-wider">
            Protocolo: {detailedDemand.protocol}
          </span>
          <h2 className="text-base sm:text-lg font-bold text-[#0d3b42] dark:text-white mt-0.5">
            {detailedDemand.title}
          </h2>
        </div>

        {/* Cartão de Resumo da Demanda */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#111b24] border border-slate-200 dark:border-[#273a3b] flex flex-col gap-2.5">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <IconBuilding size={14} />
            <span>Órgão Responsável: <strong className="text-slate-700 dark:text-slate-200">{detailedDemand.department?.name || 'Órgão Municipal'}</strong></span>
          </div>
          <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
            {detailedDemand.description}
          </p>
        </div>

        {/* Stepper e Linha do Tempo (Timeline) */}
        <DemandTimeline
          currentStatus={detailedDemand.status}
          history={detailedDemand.history}
          resolutionNotes={detailedDemand.resolution_notes}
          createdAt={detailedDemand.created_at}
        />

        {/* Avaliação do Cidadão (se o chamado estiver concluído) */}
        {detailedDemand.status === 'FECHADO' && (
          <FeedbackForm
            protocol={detailedDemand.protocol}
            existingFeedback={detailedDemand.feedback}
            onFeedbackSubmitted={(fb) => {
              setDetailedDemand((prev) => (prev ? { ...prev, feedback: fb } : null));
            }}
          />
        )}
      </div>
    );
  }

  // Visualização de Lista com Filtros e Busca (Screen 7 do Figma)
  return (
    <div className="flex-1 min-h-0 flex flex-col gap-3.5 rounded-2xl bg-white dark:bg-[#111b24] border border-slate-200 dark:border-[#273a3b] shadow-xs p-5 overflow-hidden font-sans">
      {/* Cabeçalho da Lista Conforme Figma */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-[#273a3b]">
        <div>
          <h2 className="text-sm sm:text-base font-bold text-[#0d3b42] dark:text-white">
            Meus protocolos
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Acompanhe o andamento de suas solicitações
          </p>
        </div>

        {/* Campo de Busca */}
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-1.5 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <IconSearch size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por protocolo ou descrição..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-50 dark:bg-[#111b24] border border-slate-200 dark:border-[#273a3b] text-xs text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#f4a261] dark:focus:ring-[#5ee0b5]"
            />
          </div>
          <button
            type="submit"
            className="px-3 py-1.5 rounded-xl bg-[#0d3b42] hover:bg-[#0D3839] text-white text-xs font-semibold transition"
          >
            Buscar
          </button>
        </form>
      </div>

      {/* Pílulas de Filtro de Status */}
      <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1" role="tablist">
        {[
          { key: '', label: 'Todos' },
          { key: 'ABERTO', label: 'Aberto' },
          { key: 'EM ANDAMENTO', label: 'Em Andamento' },
          { key: 'FECHADO', label: 'Concluído' }
        ].map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => {
              setStatusFilter(f.key);
              setPage(1);
            }}
            className={`px-3 py-1 rounded-full text-xs font-medium transition ${
              statusFilter === f.key
                ? 'bg-[#f4a261] dark:bg-[#5ee0b5] text-white font-semibold shadow-xs'
                : 'text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-[#111b24] border border-slate-200 dark:border-[#273a3b] hover:bg-slate-200'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Lista de Demandas com Rolagem */}
      <div className="flex-1 min-h-0 overflow-y-auto pr-1 flex flex-col gap-2.5">
        {loading ? (
          <div className="flex flex-col gap-2.5">
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </div>
        ) : error ? (
          <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs">
            {error}
          </div>
        ) : demands.length === 0 ? (
          <EmptyState
            title="Nenhum protocolo encontrado"
            description={
              search || statusFilter
                ? 'Nenhuma solicitação corresponde aos filtros aplicados.'
                : 'Você ainda não registrou nenhuma solicitação. Inicie um atendimento clicando em "+ Nova demanda".'
            }
            icon={<IconFileText size={24} />}
          />
        ) : (
          demands.map((demand) => (
            <div
              key={demand.id}
              onClick={() => setSelectedProtocol(demand.protocol)}
              className="p-4 rounded-xl bg-slate-50 hover:bg-slate-100/80 dark:bg-[#111b24] dark:hover:bg-[#16383B] border border-slate-200 dark:border-[#273a3b] transition cursor-pointer flex flex-col gap-2 shadow-2xs group"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-[#f4a261] dark:text-[#5ee0b5]">
                    {demand.protocol}
                  </span>
                  <DemandStatusBadge status={demand.status} size="sm" />
                </div>
                <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-400 text-[11px] font-mono">
                  <IconClock size={12} />
                  <span>{new Date(demand.created_at).toLocaleDateString('pt-BR')}</span>
                </div>
              </div>

              <h3 className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-white group-hover:text-[#f4a261] dark:group-hover:text-[#5ee0b5] transition">
                {demand.title}
              </h3>

              <p className="text-xs text-slate-500 dark:text-slate-300 line-clamp-2 leading-relaxed">
                {demand.description}
              </p>

              <div className="flex items-center justify-between pt-2 border-t border-slate-200/80 dark:border-[#273a3b] text-xs">
                <span className="text-[11px] text-slate-400 dark:text-slate-400">
                  {demand.department?.name || 'Órgão Municipal'}
                </span>
                <span className="text-[#0d3b42] dark:text-[#5ee0b5] group-hover:translate-x-0.5 transition flex items-center gap-1 font-semibold text-xs">
                  <span>Acompanhar</span>
                  <IconArrowRight size={12} />
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Paginação */}
      <Pagination
        page={page}
        total={total}
        pageSize={pageSize}
        pages={pages}
        onPageChange={(newPage) => setPage(newPage)}
      />
    </div>
  );
};
