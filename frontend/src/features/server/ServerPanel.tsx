import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../services/api';
import { Demand, DemandDetailed, Department } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { DemandQueue } from './DemandQueue';
import { DemandCloseModal } from './DemandCloseModal';
import { DemandDossierModal } from '../../components/demands/DemandDossierModal';
import {
  IconBuilding,
  IconClock,
  IconCheckCircle,
  IconAlertCircle,
  IconRefresh,
  IconShield,
  IconBarChart
} from '../../components/common/Icons';

export const ServerPanel: React.FC = () => {
  const { user } = useAuth();

  // Fila de Demandas
  const [demands, setDemands] = useState<Demand[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [stats, setStats] = useState({ total: 0, aberto: 0, em_andamento: 0, fechado: 0 });

  // Filtros & Paginação
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [severityFilter, setSeverityFilter] = useState<string>('');
  const [departmentFilter, setDepartmentFilter] = useState<number | ''>('');
  const [orderByPriority, setOrderByPriority] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [pageSize] = useState<number>(15);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalItems, setTotalItems] = useState<number>(0);

  // Estados de Controle & Feedback
  const [loading, setLoading] = useState<boolean>(false);
  const [actionLoadingProtocol, setActionLoadingProtocol] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modais
  const [dossierDemand, setDossierDemand] = useState<DemandDetailed | null>(null);
  const [isDossierOpen, setIsDossierOpen] = useState<boolean>(false);

  const [closingDemand, setClosingDemand] = useState<Demand | null>(null);
  const [isCloseOpen, setIsCloseOpen] = useState<boolean>(false);
  const [isClosingSubmitting, setIsClosingSubmitting] = useState<boolean>(false);

  // Carrega lista de órgãos
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const list = await api.getDepartments();
        setDepartments(list);
      } catch (err) {
        console.error('Falha ao carregar departamentos:', err);
      }
    };
    fetchDepartments();
  }, []);

  // Carrega dados da fila e estatísticas
  const loadData = useCallback(async () => {
    setLoading(true);
    setFeedbackMsg(null);
    try {
      const [demandsRes, statsData] = await Promise.all([
        api.getAdminDemands({
          statusFilter: statusFilter || undefined,
          severityFilter: severityFilter || undefined,
          departmentId: departmentFilter ? Number(departmentFilter) : undefined,
          orderByPriority,
          search: searchTerm.trim() || undefined,
          page,
          pageSize
        }),
        api.getAdminStats()
      ]);

      if (Array.isArray(demandsRes)) {
        setDemands(demandsRes);
        setTotalItems(demandsRes.length);
        setTotalPages(1);
      } else {
        setDemands(demandsRes.items);
        setTotalItems(demandsRes.total);
        setTotalPages(demandsRes.pages || Math.ceil(demandsRes.total / pageSize) || 1);
      }

      setStats(statsData);
    } catch (err: any) {
      setFeedbackMsg({
        type: 'error',
        text: err?.message || 'Falha ao sincronizar dados da fila operacional.'
      });
    } finally {
      setLoading(false);
    }
  }, [statusFilter, severityFilter, departmentFilter, orderByPriority, searchTerm, page, pageSize]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Ações Operacionais
  const handleViewDossier = async (demand: Demand) => {
    try {
      const detailed = await api.getAdminDossier(demand.protocol);
      setDossierDemand(detailed);
      setIsDossierOpen(true);
    } catch (err: any) {
      setFeedbackMsg({
        type: 'error',
        text: `Erro ao obter histórico de ${demand.protocol}: ${err?.message || 'Não encontrado'}`
      });
    }
  };

  const handleAddProgressNote = async (note: string) => {
    if (!dossierDemand) return;
    await api.updateDemandStatus(dossierDemand.protocol, 'EM ANDAMENTO', note);
    setDossierDemand(await api.getAdminDossier(dossierDemand.protocol));
  };

  const handleStartAttendance = async (demand: Demand) => {
    setActionLoadingProtocol(demand.protocol);
    try {
      await api.updateDemandStatus(
        demand.protocol,
        'EM ANDAMENTO',
        'Atendimento operacional iniciado pelo servidor responsável.'
      );
      setFeedbackMsg({
        type: 'success',
        text: `Demanda ${demand.protocol} alterada para EM ANDAMENTO.`
      });
      await loadData();
    } catch (err: any) {
      setFeedbackMsg({
        type: 'error',
        text: `Erro ao iniciar atendimento: ${err?.message || 'Falha no servidor'}`
      });
    } finally {
      setActionLoadingProtocol(null);
    }
  };

  const handleOpenCloseModal = (demand: Demand) => {
    setClosingDemand(demand);
    setIsCloseOpen(true);
  };

  const handleConfirmClose = async (protocol: string, notes?: string, resolutionNotes?: string) => {
    setIsClosingSubmitting(true);
    try {
      await api.updateDemandStatus(protocol, 'FECHADO', notes, resolutionNotes);
      setIsCloseOpen(false);
      setClosingDemand(null);
      setFeedbackMsg({
        type: 'success',
        text: `Demanda ${protocol} concluída e arquivada com sucesso com parecer técnico (RF014).`
      });
      await loadData();
    } catch (err: any) {
      throw err;
    } finally {
      setIsClosingSubmitting(false);
    }
  };

  const userDepartmentNames = user?.departments?.map((d) => d.name).join(', ') || 'Geral / Multidepartamental';

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 font-sans">
      {/* Cabeçalho da Área do Servidor */}
      <section
        aria-label="Identificação do servidor e secretaria"
        className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-slate-800 border border-slate-700 shadow-sm"
      >
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-civic-700/20 border border-civic-600/30 flex items-center justify-center text-civic-300">
            <IconShield size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-white tracking-tight">
                Painel Operacional do Servidor
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-civic-800/80 text-civic-300 border border-civic-700/60">
                RF011 / RF014
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
              <IconBuilding size={13} className="text-slate-400" />
              <span>Escopo de Atendimento:</span>
              <strong className="text-slate-200">{userDepartmentNames}</strong>
            </p>
          </div>
        </div>

        {/* Botão de Atualização Manual */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            type="button"
            onClick={() => loadData()}
            disabled={loading}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-2 transition-all disabled:opacity-50"
            title="Sincronizar fila de demandas"
          >
            <IconRefresh size={14} className={loading ? 'animate-spin text-civic-400' : 'text-slate-400'} />
            <span>{loading ? 'Atualizando...' : 'Atualizar Fila'}</span>
          </button>
        </div>
      </section>

      {/* Banner de Feedback / Alerta */}
      {feedbackMsg && (
        <div
          role="alert"
          className={`p-3.5 rounded-xl border text-xs font-medium flex items-center justify-between gap-3 ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
              : 'bg-rose-950/40 border-rose-800/60 text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedbackMsg.type === 'success' ? (
              <IconCheckCircle size={16} className="text-emerald-400 shrink-0" />
            ) : (
              <IconAlertCircle size={16} className="text-rose-400 shrink-0" />
            )}
            <span>{feedbackMsg.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackMsg(null)}
            className="text-slate-400 hover:text-white text-xs underline font-normal"
          >
            Fechar
          </button>
        </div>
      )}

      {/* Telemetria e Indicadores da Fila */}
      <section
        aria-label="Resumo de telemetria da fila"
        className="grid grid-cols-2 lg:grid-cols-4 gap-3.5"
      >
        {/* Total */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-400 font-medium uppercase tracking-wider block">
              Total Atribuídas
            </span>
            <span className="text-2xl font-bold text-white mt-1 block">
              {stats.total}
            </span>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-800 text-slate-300">
            <IconBarChart size={20} />
          </div>
        </div>

        {/* Aberto */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] text-amber-400 font-medium uppercase tracking-wider block">
              Aguardando Início
            </span>
            <span className="text-2xl font-bold text-amber-300 mt-1 block">
              {stats.aberto}
            </span>
          </div>
          <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <IconAlertCircle size={20} />
          </div>
        </div>

        {/* Em Andamento */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] text-sky-400 font-medium uppercase tracking-wider block">
              Em Atendimento
            </span>
            <span className="text-2xl font-bold text-sky-300 mt-1 block">
              {stats.em_andamento}
            </span>
          </div>
          <div className="p-2.5 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
            <IconClock size={20} />
          </div>
        </div>

        {/* Concluído */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] text-emerald-400 font-medium uppercase tracking-wider block">
              Concluídas
            </span>
            <span className="text-2xl font-bold text-emerald-300 mt-1 block">
              {stats.fechado}
            </span>
          </div>
          <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <IconCheckCircle size={20} />
          </div>
        </div>
      </section>

      {/* Fila Operacional com Tabela e Filtros */}
      <DemandQueue
        demands={demands}
        isLoading={loading}
        statusFilter={statusFilter}
        setStatusFilter={(val) => {
          setStatusFilter(val);
          setPage(1);
        }}
        severityFilter={severityFilter}
        setSeverityFilter={(val) => {
          setSeverityFilter(val);
          setPage(1);
        }}
        departmentFilter={departmentFilter}
        setDepartmentFilter={(val) => {
          setDepartmentFilter(val);
          setPage(1);
        }}
        departments={departments}
        orderByPriority={orderByPriority}
        setOrderByPriority={(val) => {
          setOrderByPriority(val);
          setPage(1);
        }}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        onSearchSubmit={() => {
          setPage(1);
          loadData();
        }}
        page={page}
        totalPages={totalPages}
        totalItems={totalItems}
        onPageChange={(newPage) => setPage(newPage)}
        onViewDossier={handleViewDossier}
        onStartAttendance={handleStartAttendance}
        onCloseDemand={handleOpenCloseModal}
        actionLoadingProtocol={actionLoadingProtocol}
      />

      {/* Histórico da Reclamação */}
      <DemandDossierModal
        isOpen={isDossierOpen}
        demand={dossierDemand}
        onClose={() => {
          setIsDossierOpen(false);
          setDossierDemand(null);
        }}
        onAddProgressNote={handleAddProgressNote}
      />

      {/* Modal de Fechamento de Demanda com Parecer Técnico Obrigatório */}
      <DemandCloseModal
        isOpen={isCloseOpen}
        demand={closingDemand}
        isLoading={isClosingSubmitting}
        onClose={() => {
          setIsCloseOpen(false);
          setClosingDemand(null);
        }}
        onConfirmClose={handleConfirmClose}
      />
    </div>
  );
};
