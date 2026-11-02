import React from 'react';
import { Demand, Department } from '../../types';
import { DemandStatusBadge } from '../../components/demands/DemandStatusBadge';
import { SeverityBadge } from '../../components/demands/SeverityBadge';
import { Pagination } from '../../components/common/Pagination';
import { EmptyState } from '../../components/common/EmptyState';
import { Skeleton } from '../../components/common/Skeleton';
import {
  IconSearch,
  IconFilter,
  IconSort,
  IconEye,
  IconClock,
  IconCheckCircle,
  IconBuilding,
  IconShield
} from '../../components/common/Icons';

export interface DemandQueueProps {
  demands: Demand[];
  isLoading: boolean;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  severityFilter: string;
  setSeverityFilter: (severity: string) => void;
  departmentFilter?: number | '';
  setDepartmentFilter?: (deptId: number | '') => void;
  departments?: Department[];
  orderByPriority: boolean;
  setOrderByPriority: (order: boolean) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  onSearchSubmit: (e?: React.FormEvent) => void;
  page: number;
  totalPages: number;
  totalItems: number;
  onPageChange: (newPage: number) => void;
  onViewDossier: (demand: Demand) => void;
  onStartAttendance: (demand: Demand) => void;
  onCloseDemand: (demand: Demand) => void;
  actionLoadingProtocol?: string | null;
}

export const DemandQueue: React.FC<DemandQueueProps> = ({
  demands,
  isLoading,
  statusFilter,
  setStatusFilter,
  severityFilter,
  setSeverityFilter,
  departmentFilter = '',
  setDepartmentFilter,
  departments = [],
  orderByPriority,
  setOrderByPriority,
  searchTerm,
  setSearchTerm,
  onSearchSubmit,
  page,
  totalPages,
  totalItems,
  onPageChange,
  onViewDossier,
  onStartAttendance,
  onCloseDemand,
  actionLoadingProtocol
}) => {
  return (
    <div className="flex flex-col gap-4">
      {/* Barra de Filtros e Busca */}
      <section
        aria-label="Filtros e busca da fila operacional"
        className="rounded-xl bg-slate-900 border border-slate-800 p-4 shadow-sm"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSearchSubmit(e);
          }}
          className="flex flex-col lg:flex-row lg:items-center gap-3 justify-between"
        >
          {/* Campo de Busca */}
          <div className="relative flex-1">
            <label htmlFor="server-search-input" className="sr-only">
              Buscar por protocolo, título ou localização
            </label>
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <IconSearch size={16} />
            </div>
            <input
              id="server-search-input"
              type="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por protocolo, título ou palavra-chave..."
              className="w-full pl-10 pr-24 py-2 rounded-lg bg-slate-800/80 border border-slate-700 text-slate-100 placeholder-slate-400 text-sm focus:outline-hidden focus:ring-2 focus:ring-civic-500 transition-all"
            />
            <button
              type="submit"
              className="absolute right-1.5 top-1.5 bottom-1.5 px-3 rounded-md bg-civic-600 hover:bg-civic-500 text-white text-xs font-semibold transition-colors flex items-center gap-1"
            >
              Buscar
            </button>
          </div>

          {/* Filtros em Linha */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Filtro de Status */}
            <div className="flex items-center gap-1.5">
              <label htmlFor="filter-status" className="text-xs text-slate-400 font-medium whitespace-nowrap">
                Status:
              </label>
              <select
                id="filter-status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="py-1.5 px-2.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-xs focus:ring-2 focus:ring-civic-500 focus:outline-hidden"
              >
                <option value="">Todos</option>
                <option value="ABERTO">Aberto</option>
                <option value="EM ANDAMENTO">Em Andamento</option>
                <option value="FECHADO">Fechado</option>
              </select>
            </div>

            {/* Filtro de Severidade */}
            <div className="flex items-center gap-1.5">
              <label htmlFor="filter-severity" className="text-xs text-slate-400 font-medium whitespace-nowrap">
                Gravidade:
              </label>
              <select
                id="filter-severity"
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                className="py-1.5 px-2.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-xs focus:ring-2 focus:ring-civic-500 focus:outline-hidden"
              >
                <option value="">Todas</option>
                <option value="CRITICA">Crítica</option>
                <option value="ALTA">Alta</option>
                <option value="MEDIA">Média</option>
                <option value="BAIXA">Baixa</option>
              </select>
            </div>

            {/* Filtro de Órgão (se aplicável) */}
            {departments && departments.length > 0 && setDepartmentFilter && (
              <div className="flex items-center gap-1.5">
                <label htmlFor="filter-department" className="text-xs text-slate-400 font-medium whitespace-nowrap">
                  Órgão:
                </label>
                <select
                  id="filter-department"
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value ? Number(e.target.value) : '')}
                  className="py-1.5 px-2.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-xs focus:ring-2 focus:ring-civic-500 focus:outline-hidden max-w-[140px] truncate"
                >
                  <option value="">Todos os Órgãos</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Botão de Ordenação por Prioridade Técnica */}
            <button
              type="button"
              onClick={() => setOrderByPriority(!orderByPriority)}
              aria-pressed={orderByPriority}
              className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-all ${
                orderByPriority
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-xs'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
              }`}
              title="Prioriza demandas com risco iminente, gravidade crítica e maior tempo em aberto"
            >
              <IconSort size={14} className={orderByPriority ? 'text-amber-400' : 'text-slate-400'} />
              <span>Prioridade IA</span>
              {orderByPriority && (
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              )}
            </button>
          </div>
        </form>
      </section>

      {/* Conteúdo da Fila: Tabela / Cards */}
      <section aria-label="Lista de demandas na fila operacional" className="flex flex-col gap-3">
        {isLoading ? (
          <div className="rounded-xl bg-slate-900 border border-slate-800 p-6 flex flex-col gap-4">
            <Skeleton height="36px" width="100%" />
            <Skeleton height="56px" width="100%" />
            <Skeleton height="56px" width="100%" />
            <Skeleton height="56px" width="100%" />
          </div>
        ) : demands.length === 0 ? (
          <div className="rounded-xl bg-slate-900 border border-slate-800 p-8">
            <EmptyState
              title="Nenhuma demanda encontrada"
              description="Não foram encontradas demandas que correspondam aos filtros ou critérios de busca selecionados."
              action={
                <button
                  type="button"
                  onClick={() => {
                    setStatusFilter('');
                    setSeverityFilter('');
                    if (setDepartmentFilter) setDepartmentFilter('');
                    setSearchTerm('');
                    setOrderByPriority(true);
                  }}
                  className="px-4 py-2 rounded-lg bg-civic-600 hover:bg-civic-500 text-white text-xs font-semibold transition-colors"
                >
                  Limpar Filtros
                </button>
              }
            />
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900 shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-800/90 text-slate-400 uppercase text-[10px] tracking-wider font-semibold border-b border-slate-700">
                  <tr>
                    <th scope="col" className="px-4 py-3">Protocolo</th>
                    <th scope="col" className="px-4 py-3">Demanda & Detalhes</th>
                    <th scope="col" className="px-4 py-3">Secretaria</th>
                    <th scope="col" className="px-4 py-3">Gravidade</th>
                    <th scope="col" className="px-4 py-3">Status</th>
                    <th scope="col" className="px-4 py-3 text-right">Ações Operacionais</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {demands.map((demand) => {
                    const isProcessing = actionLoadingProtocol === demand.protocol;
                    const isAberto = demand.status === 'ABERTO';
                    const isEmAndamento = demand.status === 'EM ANDAMENTO';

                    return (
                      <tr
                        key={demand.id || demand.protocol}
                        className="hover:bg-slate-800/50 transition-colors"
                      >
                        {/* Protocolo e Data */}
                        <td className="px-4 py-3 whitespace-nowrap align-top">
                          <span className="font-mono text-xs font-bold text-civic-400 block">
                            {demand.protocol}
                          </span>
                          <span className="text-[11px] text-slate-400 block mt-0.5">
                            {demand.created_at
                              ? new Date(demand.created_at).toLocaleDateString('pt-BR', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })
                              : 'Recentemente'}
                          </span>
                        </td>

                        {/* Demanda: Título e Descrição */}
                        <td className="px-4 py-3 max-w-sm align-top">
                          <span className="font-semibold text-white block truncate text-xs">
                            {demand.title}
                          </span>
                          <p className="text-[11px] text-slate-400 line-clamp-2 mt-0.5">
                            {demand.description}
                          </p>
                        </td>

                        {/* Secretaria Responsável */}
                        <td className="px-4 py-3 whitespace-nowrap align-top">
                          <span className="inline-flex items-center gap-1 text-[11px] text-slate-300 font-medium">
                            <IconBuilding size={13} className="text-slate-400" />
                            <span className="max-w-[170px] truncate" title={demand.department?.name}>{demand.department?.name || 'Órgão Municipal'}</span>
                          </span>
                        </td>

                        {/* Gravidade */}
                        <td className="px-4 py-3 whitespace-nowrap align-top">
                          <SeverityBadge severity={demand.severity} size="sm" />
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3 whitespace-nowrap align-top">
                          <DemandStatusBadge status={demand.status} size="sm" />
                        </td>

                        {/* Ações Operacionais */}
                        <td className="px-4 py-3 whitespace-nowrap align-top text-right">
                          <div className="inline-flex items-center gap-1.5 justify-end">
                            {/* Abrir histórico */}
                            <button
                              type="button"
                              onClick={() => onViewDossier(demand)}
                              title="Ver histórico completo da reclamação"
                              className="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium flex items-center gap-1 transition-colors"
                            >
                              <IconEye size={13} className="text-slate-400" />
                              <span>Histórico</span>
                            </button>

                            {/* Iniciar Atendimento (ABERTO -> EM ANDAMENTO) */}
                            {isAberto && (
                              <button
                                type="button"
                                disabled={isProcessing}
                                onClick={() => onStartAttendance(demand)}
                                className="px-2.5 py-1 rounded-md bg-civic-700 hover:bg-civic-600 text-white text-xs font-semibold flex items-center gap-1 transition-colors disabled:opacity-50"
                                title="Iniciar atendimento técnico desta demanda"
                              >
                                <IconClock size={13} />
                                <span>{isProcessing ? 'Iniciando...' : 'Iniciar atendimento'}</span>
                              </button>
                            )}

                            {/* Concluir Atendimento (EM ANDAMENTO -> FECHADO) */}
                            {isEmAndamento && (
                              <button
                                type="button"
                                disabled={isProcessing}
                                onClick={() => onCloseDemand(demand)}
                                className="px-2.5 py-1 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1 transition-colors disabled:opacity-50"
                                title="Finalizar demanda com parecer técnico obrigatório (RF014)"
                              >
                                <IconCheckCircle size={13} />
                                <span>Concluir</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Rodapé da Tabela com Paginação */}
            <div className="p-3 bg-slate-900 border-t border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-400">
                Mostrando <strong className="text-slate-200">{demands.length}</strong> de{' '}
                <strong className="text-slate-200">{totalItems}</strong> demandas
              </span>
              <Pagination
                page={page}
                total={totalItems}
                pageSize={15}
                pages={totalPages}
                onPageChange={onPageChange}
              />
            </div>
          </div>
        )}
      </section>
    </div>
  );
};
