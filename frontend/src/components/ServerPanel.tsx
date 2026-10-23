import React, { useState, useEffect } from 'react';
import { api, Demand, Department, DepartmentComparison, UserProfile } from '../services/api';
import {
  IconBuilding,
  IconClock,
  IconCheckCircle,
  IconAlertCircle,
  IconRefresh,
  IconArrowRight,
  IconFileText,
  IconBarChart,
  IconSearch,
  IconFilter,
  IconSort,
  IconEye,
  IconCivicSeal,
  IconFileCheck,
  IconCertificate
} from './Icons';

export const ServerPanel: React.FC<{ currentUser: UserProfile }> = ({ currentUser }) => {
  const [activeView, setActiveView] = useState<'fila' | 'comparativo' | 'revisao'>('fila');
  
  // Dados da Fila
  const [demands, setDemands] = useState<Demand[]>([]);
  const [stats, setStats] = useState({ total: 0, aberto: 0, em_andamento: 0, fechado: 0 });
  const [departments, setDepartments] = useState<Department[]>([]);
  const [comparison, setComparison] = useState<DepartmentComparison[]>([]);
  const [reviewDemands, setReviewDemands] = useState<Demand[]>([]);
  const [assignmentDept, setAssignmentDept] = useState<Record<string, number>>({});
  
  // Filtros & Ordenação
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [severityFilter, setSeverityFilter] = useState<string>('');
  const [departmentFilter, setDepartmentFilter] = useState<number | ''>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [orderByPriority, setOrderByPriority] = useState<boolean>(true);
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Modal de Visualização Individual da Demanda
  const [viewingDemand, setViewingDemand] = useState<Demand | null>(null);

  // Modal de Fechamento com Parecer Obrigatório (RF014)
  const [closingDemand, setClosingDemand] = useState<Demand | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [closingNotes, setClosingNotes] = useState('');
  const [closeError, setCloseError] = useState('');

  useEffect(() => {
    loadDepartments();
  }, []);

  useEffect(() => {
    if (activeView === 'fila' || currentUser.role !== 'gestor') {
      loadDemandsData();
    } else if (activeView === 'comparativo') {
      loadComparisonData();
    } else {
      loadReviewQueue();
    }
  }, [activeView, statusFilter, severityFilter, departmentFilter, orderByPriority]);

  const loadDepartments = async () => {
    try {
      const list = await api.getDepartments();
      setDepartments(list);
    } catch (e) {
      console.error(e);
    }
  };

  const loadDemandsData = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const [list, statsData] = await Promise.all([
        api.getAdminDemands(
          statusFilter || undefined,
          severityFilter || undefined,
          currentUser.role === 'gestor' && departmentFilter ? Number(departmentFilter) : undefined,
          orderByPriority,
          searchTerm || undefined
        ),
        api.getStats()
      ]);
      setDemands(list);
      setStats(statsData);
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao carregar dados do painel.');
    } finally {
      setLoading(false);
    }
  };

  const loadComparisonData = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const [compList, statsData] = await Promise.all([
        api.getDepartmentComparison(),
        api.getStats()
      ]);
      setComparison(compList);
      setStats(statsData);
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao carregar comparativo dos órgãos.');
    } finally {
      setLoading(false);
    }
  };

  const loadReviewQueue = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      setReviewDemands(await api.getReviewQueue());
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao carregar a fila da Ouvidoria.');
    } finally {
      setLoading(false);
    }
  };

  const assignDemand = async (protocol: string) => {
    const target = assignmentDept[protocol];
    if (!target) {
      setErrorMsg('Selecione o órgão competente para encaminhar esta demanda.');
      return;
    }
    try {
      await api.assignReviewDemand(protocol, target);
      await loadReviewQueue();
    } catch (err: any) {
      setErrorMsg(err.message || 'Não foi possível encaminhar a demanda.');
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadDemandsData();
  };

  const handleStartAttendance = async (demand: Demand) => {
    try {
      await api.updateDemandStatus(
        demand.protocol,
        'EM ANDAMENTO',
        'Atendimento assumido e iniciado pela equipe técnica do órgão responsável.'
      );
      if (viewingDemand?.id === demand.id) {
        setViewingDemand({ ...demand, status: 'EM ANDAMENTO' });
      }
      await loadDemandsData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleConfirmClose = async () => {
    if (!closingDemand) return;
    if (!resolutionNotes.trim()) {
      setCloseError('O parecer técnico conclusivo é obrigatório para encerrar a demanda.');
      return;
    }

    try {
      const updated = await api.updateDemandStatus(
        closingDemand.protocol,
        'FECHADO',
        closingNotes || 'Atendimento finalizado com sucesso.',
        resolutionNotes.trim()
      );
      if (viewingDemand?.id === closingDemand.id) {
        setViewingDemand(updated);
      }
      setClosingDemand(null);
      setResolutionNotes('');
      setClosingNotes('');
      setCloseError('');
      await loadDemandsData();
    } catch (err: any) {
      setCloseError(err.message);
    }
  };

  return (
    <div className="space-y-4">
      
      {/* Barra de Sub-Navegação do Servidor */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-1.5 bg-slate-200/70 dark:bg-slate-900 p-1 rounded-xl border border-slate-300/60 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setActiveView('fila')}
            className={`py-2 px-3.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition ${
              activeView === 'fila'
                ? 'bg-white dark:bg-[#152033] text-slate-900 dark:text-slate-100 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <IconFileText size={16} />
            <span>Fila Operacional de Atendimento</span>
          </button>

          {currentUser.role === 'gestor' && <button
            type="button"
            onClick={() => setActiveView('comparativo')}
            className={`py-2 px-3.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition ${
              activeView === 'comparativo'
                ? 'bg-white dark:bg-[#152033] text-slate-900 dark:text-slate-100 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <IconBarChart size={16} />
            <span>Painel Comparativo de Órgãos ({departments.length})</span>
          </button>}
          {currentUser.role === 'gestor' && <button
            type="button" onClick={() => setActiveView('revisao')}
            className={`py-2 px-3.5 rounded-lg text-xs font-semibold transition ${
              activeView === 'revisao'
                ? 'bg-white dark:bg-[#152033] text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}>
            Revisão da Ouvidoria
          </button>}
        </div>

        <button
          type="button"
          onClick={() => { activeView === 'fila' ? loadDemandsData() : activeView === 'comparativo' ? loadComparisonData() : loadReviewQueue(); }}
          className="text-xs font-semibold bg-white dark:bg-[#111827] hover:bg-slate-50 dark:hover:bg-[#1a263c] border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 px-3.5 py-2 rounded-lg transition flex items-center gap-1.5 shadow-2xs"
        >
          <IconRefresh size={14} />
          <span>Atualizar Fila</span>
        </button>
      </div>

      {currentUser.role === 'servidor' && (
        <p className="text-sm rounded-lg px-4 py-3 border border-blue-300 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/40">
          Você está atendendo pelo órgão <strong>
            {departments.find(d => d.id === currentUser.department_id)?.name || 'selecionado'}
          </strong>. A fila e os indicadores são limitados a esse órgão.
        </p>
      )}

      {/* Faixa de Telemetria Operacional Integrada */}
      <div className="bg-white dark:bg-[#111827] rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs divide-y sm:divide-y-0 sm:divide-x divide-slate-100 dark:divide-slate-800 grid grid-cols-2 md:grid-cols-4 server-telemetry-strip">
        <div className="p-3.5 sm:p-4 flex flex-col justify-between">
          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider font-mono">
            Volume Registrado
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl sm:text-3xl font-bold font-mono text-slate-900 dark:text-slate-100">{stats.total}</span>
            <span className="text-[11px] text-slate-400 font-mono">demandas</span>
          </div>
        </div>

        <div className="p-3.5 sm:p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider font-mono">
              Aguardando Triagem
            </span>
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl sm:text-3xl font-bold font-mono text-amber-900 dark:text-amber-300">{stats.aberto}</span>
            <span className="text-[11px] text-amber-600/80 dark:text-amber-400/70 font-mono">novas</span>
          </div>
        </div>

        <div className="p-3.5 sm:p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-civic-700 dark:text-civic-300 uppercase tracking-wider font-mono">
              Em Execução
            </span>
            <span className="w-2 h-2 rounded-full bg-civic-500"></span>
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl sm:text-3xl font-bold font-mono text-civic-900 dark:text-civic-200">{stats.em_andamento}</span>
            <span className="text-[11px] text-civic-600/80 dark:text-civic-400/70 font-mono">em campo</span>
          </div>
        </div>

        <div className="p-3.5 sm:p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider font-mono">
              Concluídas com Parecer
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl sm:text-3xl font-bold font-mono text-emerald-900 dark:text-emerald-300">{stats.fechado}</span>
            <span className="text-[11px] text-emerald-600/80 dark:text-emerald-400/70 font-mono">finalizadas</span>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div role="alert" className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-lg text-xs text-rose-800 dark:text-rose-300 flex items-center gap-2">
          <IconAlertCircle size={16} className="text-rose-600 dark:text-rose-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {activeView === 'revisao' && currentUser.role === 'gestor' && (
        <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-4 space-y-4">
          <h2 className="font-semibold text-lg">Fila de revisão da Ouvidoria</h2>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Demandas que ainda não possuem um órgão identificado. O gestor verifica o relato e escolhe o destino.
          </p>
          {!loading && reviewDemands.length === 0 && <p className="text-sm">Nenhuma demanda aguardando encaminhamento.</p>}
          {reviewDemands.map(demand => (
            <article key={demand.protocol} className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 space-y-3">
              <p className="text-sm font-bold">{demand.protocol} — {demand.title}</p>
              <p className="text-sm whitespace-pre-wrap">{demand.description}</p>
              <div className="flex flex-wrap items-center gap-2">
                <label className="text-xs font-semibold" htmlFor={`assign-${demand.id}`}>Órgão de destino</label>
                <select id={`assign-${demand.id}`} value={assignmentDept[demand.protocol] || ''}
                  onChange={e => setAssignmentDept(prev => ({ ...prev, [demand.protocol]: Number(e.target.value) }))}
                  className="border border-slate-300 dark:border-slate-700 rounded-md p-2 text-xs bg-white dark:bg-slate-800">
                  <option value="">Selecione um órgão</option>
                  {departments.map(dept => <option key={dept.id} value={dept.id}>{dept.name}</option>)}
                </select>
                <button type="button" onClick={() => assignDemand(demand.protocol)}
                  disabled={!assignmentDept[demand.protocol]}
                  className="bg-blue-700 hover:bg-blue-800 disabled:opacity-50 rounded-md text-white text-xs px-3 py-2">
                  Encaminhar
                </button>
              </div>
            </article>
          ))}
        </section>
      )}

      {/* ========================================================================= */}
      {/* ABA 1: FILA DE ATENDIMENTO COM FILTROS, ORDENAÇÃO E VISUALIZAÇÃO INDIVIDUAL */}
      {/* ========================================================================= */}
      {activeView === 'fila' && (
        <div className="space-y-4">
          
          {/* Barra de Filtros, Pesquisa e Ordenação */}
          <div className="bg-white dark:bg-[#111827] p-3.5 sm:p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3 filter-bar-container">
            
            {/* Linha 1: Busca Textual */}
            <form onSubmit={handleSearchSubmit} className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Pesquisar por protocolo (GR-...), objeto ou palavras-chave..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-[#131d2e] border border-slate-200 dark:border-slate-700 rounded-lg text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:ring-2 focus:ring-civic-500 dark:focus:ring-civic-400 focus:bg-white dark:focus:bg-[#172338] transition font-sans"
                />
                <div className="absolute left-3 top-2.5 text-slate-400 dark:text-slate-500">
                  <IconSearch size={15} />
                </div>
              </div>
              <button
                type="submit"
                className="bg-slate-900 hover:bg-slate-800 dark:bg-civic-700 dark:hover:bg-civic-800 text-white text-xs font-bold px-4 py-2 rounded-lg transition shadow-xs"
              >
                Buscar
              </button>
            </form>

            {/* Linha 2: Dropdowns de Filtro e Ordenação por Prioridade */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              
              <div className="flex flex-wrap items-center gap-3">
                {/* Somente gestor pode filtrar todos os órgãos. */}
                {currentUser.role === 'gestor' && <div className="flex items-center gap-1.5 text-xs">
                  <label htmlFor="filter-dept" className="font-semibold text-slate-600 dark:text-slate-300 font-mono text-[11px] uppercase">Órgão:</label>
                  <select
                    id="filter-dept"
                    value={departmentFilter}
                    onChange={(e) => setDepartmentFilter(e.target.value ? Number(e.target.value) : '')}
                    className="border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 bg-slate-50 dark:bg-[#131d2e] text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-civic-500 text-xs"
                  >
                    <option value="">Todos os Órgãos ({departments.length})</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name.split('—')[0].trim()}
                      </option>
                    ))}
                  </select>
                </div>}

                {/* Filtro por Status */}
                <div className="flex items-center gap-1.5 text-xs">
                  <label htmlFor="filter-status" className="font-semibold text-slate-600 dark:text-slate-300 font-mono text-[11px] uppercase">Status:</label>
                  <select
                    id="filter-status"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 bg-slate-50 dark:bg-[#131d2e] text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-civic-500 text-xs font-mono"
                  >
                    <option value="">Todos os Status</option>
                    <option value="ABERTO">Aberto</option>
                    <option value="EM ANDAMENTO">Em Andamento</option>
                    <option value="FECHADO">Fechado</option>
                  </select>
                </div>

                {/* Filtro por Gravidade */}
                <div className="flex items-center gap-1.5 text-xs">
                  <label htmlFor="filter-severity" className="font-semibold text-slate-600 dark:text-slate-300 font-mono text-[11px] uppercase">Gravidade:</label>
                  <select
                    id="filter-severity"
                    value={severityFilter}
                    onChange={(e) => setSeverityFilter(e.target.value)}
                    className="border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 bg-slate-50 dark:bg-[#131d2e] text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-civic-500 text-xs font-mono"
                  >
                    <option value="">Todas as Gravidades</option>
                    <option value="CRITICA">Crítica (SLA 24h)</option>
                    <option value="ALTA">Alta (SLA 48h)</option>
                    <option value="MEDIA">Média (SLA 5-7d)</option>
                    <option value="BAIXA">Baixa (SLA 15d)</option>
                  </select>
                </div>
              </div>

              {/* Botão de Ordenação Automática por Prioridade */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setOrderByPriority(!orderByPriority)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition ${
                    orderByPriority
                      ? 'bg-rose-50 dark:bg-rose-950/50 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-300 shadow-2xs font-mono'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 font-mono'
                  }`}
                  title="Ordenar automaticamente por gravidade: Crítica -> Alta -> Média -> Baixa"
                >
                  <IconSort size={14} className={orderByPriority ? 'text-rose-600 dark:text-rose-400' : 'text-slate-500 dark:text-slate-400'} />
                  <span>{orderByPriority ? 'Prioridade por Gravidade (Ativa)' : 'Ordenar por Data'}</span>
                </button>
              </div>

            </div>
          </div>

          {/* Livro de Ocorrências Administrativas em Fila */}
          <div className="bg-white dark:bg-[#111827] rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden demands-table-card">
            <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-[#0c121e]/80 flex items-center justify-between">
              <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100 font-sans">
                Livro de Ocorrências em Fila ({demands.length})
              </h3>
              {orderByPriority && (
                <span className="text-[10px] font-mono font-semibold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded border border-rose-200 dark:border-rose-800">
                  Classificação Decrescente de Risco
                </span>
              )}
            </div>

            {loading ? (
              <div className="p-8 text-center text-xs text-slate-500 dark:text-slate-400 font-mono">
                Carregando registros da fila municipal...
              </div>
            ) : demands.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500 dark:text-slate-400">
                Nenhum protocolo localizado para os parâmetros informados.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {demands.map((demand) => (
                  <div key={demand.id} className="p-4 hover:bg-slate-50/60 dark:hover:bg-[#142033]/50 transition space-y-2.5">
                    
                    {/* Linha Superior: Protocolo, Data, Gravidade e Status */}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-civic-700 dark:text-civic-300 bg-civic-50 dark:bg-civic-950/80 px-2.5 py-0.5 rounded border border-civic-200 dark:border-civic-900">
                          {demand.protocol}
                        </span>
                        <span className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">
                          {new Date(demand.created_at).toLocaleDateString('pt-BR')} às {new Date(demand.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {demand.severity && (
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold font-mono border ${
                            demand.severity === 'CRITICA' ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-800' :
                            demand.severity === 'ALTA' ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800' :
                            demand.severity === 'MEDIA' ? 'bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-800' :
                            'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                          }`}>
                            {demand.severity === 'CRITICA' ? 'SLA 24H • CRÍTICA' :
                             demand.severity === 'ALTA' ? 'SLA 48H • ALTA' :
                             demand.severity === 'MEDIA' ? 'SLA 5-7D • MÉDIA' :
                             'SLA 15D • BAIXA'}
                          </span>
                        )}

                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded font-mono text-xs font-bold ${
                          demand.status === 'ABERTO' ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800' :
                          demand.status === 'EM ANDAMENTO' ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800' :
                          'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                        }`}>
                          {demand.status === 'ABERTO' && <IconClock size={12} />}
                          {demand.status === 'EM ANDAMENTO' && <IconClock size={12} />}
                          {demand.status === 'FECHADO' && <IconCheckCircle size={12} />}
                          <span>{demand.status}</span>
                        </span>
                      </div>
                    </div>

                    {/* Objeto e Descrição */}
                    <div>
                      <h4 className="font-semibold text-sm text-slate-900 dark:text-slate-100 font-sans">{demand.title}</h4>
                      <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 mt-0.5 leading-relaxed">{demand.description}</p>
                    </div>

                    {/* Ações Administrativas */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                      <button
                        type="button"
                        onClick={() => setViewingDemand(demand)}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold transition flex items-center gap-1.5 shadow-2xs"
                      >
                        <IconEye size={14} className="text-civic-600 dark:text-civic-400" />
                        <span>Ver Dossiê Completo</span>
                      </button>

                      <div className="flex items-center gap-2">
                        {demand.status === 'ABERTO' && (
                          <button
                            type="button"
                            onClick={() => handleStartAttendance(demand)}
                            className="bg-civic-700 hover:bg-civic-800 text-white font-bold px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 shadow-xs"
                          >
                            <span>Assumir Atendimento</span>
                            <IconArrowRight size={13} />
                          </button>
                        )}

                        {demand.status === 'EM ANDAMENTO' && (
                          <button
                            type="button"
                            onClick={() => setClosingDemand(demand)}
                            className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 shadow-xs"
                          >
                            <IconCheckCircle size={13} />
                            <span>Concluir c/ Parecer Técnico...</span>
                          </button>
                        )}

                        {demand.status === 'FECHADO' && (
                          <span className="text-emerald-700 dark:text-emerald-400 font-bold font-mono text-xs flex items-center gap-1">
                            <IconCheckCircle size={13} />
                            <span>Concluída</span>
                          </span>
                        )}
                      </div>
                    </div>

                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ========================================================================= */}
      {/* ABA 2: ESTATÍSTICAS E PAINEL COMPARATIVO ENTRE ÓRGÃOS REGISTRADOS */}
      {/* ========================================================================= */}
      {activeView === 'comparativo' && (
        <div className="space-y-4">
          
          <div className="bg-white dark:bg-[#111827] p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Quadro Comparativo de Atendimento por Órgão</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Métricas consolidadas de demanda, vazão e gravidade entre os 12 órgãos municipais cadastrados.</p>
            </div>
            <span className="text-xs font-mono bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-900/60 px-2.5 py-1 rounded-lg font-semibold">
              {departments.length} Órgãos Registrados
            </span>
          </div>

          <div className="bg-white dark:bg-[#111827] rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-[#0c121e] text-slate-700 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Órgão / Secretaria</th>
                    <th className="py-3 px-3 text-center">Total</th>
                    <th className="py-3 px-3 text-center">Abertas</th>
                    <th className="py-3 px-3 text-center">Em Andamento</th>
                    <th className="py-3 px-3 text-center">Concluídas</th>
                    <th className="py-3 px-3 text-center">Críticas / Altas</th>
                    <th className="py-3 px-4 text-center">Taxa de Resolução</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {comparison.map((dept) => (
                    <tr key={dept.department_id} className="hover:bg-slate-50/60 dark:hover:bg-[#152033]/60 transition">
                      <td className="py-3.5 px-4 font-medium text-slate-900 dark:text-slate-100">
                        <div>
                          <p className="font-semibold text-slate-800 dark:text-slate-200">{dept.department_name}</p>
                          <p className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">{dept.email}</p>
                        </div>
                      </td>
                      <td className="py-3.5 px-3 text-center font-bold text-slate-900 dark:text-slate-100 text-sm">
                        {dept.total}
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <span className="px-2 py-0.5 rounded font-mono font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                          {dept.aberto}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <span className="px-2 py-0.5 rounded font-mono font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-900/60">
                          {dept.em_andamento}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <span className="px-2 py-0.5 rounded font-mono font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          {dept.fechado}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded font-mono font-semibold ${
                          (dept.critica + dept.alta) > 0 ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800' : 'text-slate-400 dark:text-slate-500'
                        }`}>
                          {dept.critica + dept.alta}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-16 bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden border border-slate-200 dark:border-slate-700">
                            <div
                              className="bg-emerald-600 h-full rounded-full transition-all duration-300"
                              style={{ width: `${dept.resolution_rate}%` }}
                            />
                          </div>
                          <span className="font-mono font-bold text-slate-800 dark:text-slate-200 text-[11px] w-10 text-right">
                            {dept.resolution_rate}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL DE VISUALIZAÇÃO DO DOSSIÊ ADMINISTRATIVO DA DEMANDA */}
      {/* ========================================================================= */}
      {viewingDemand && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 modal-overlay">
          <div className="bg-white dark:bg-[#111827] rounded-2xl shadow-2xl max-w-2xl w-full p-5 sm:p-6 space-y-4 border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto modal-card">
            
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 modal-header">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-civic-800 text-civic-200 flex items-center justify-center border border-civic-700/80 shrink-0">
                  <IconCivicSeal size={18} />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-mono block">
                    Dossiê Administrativo Municipal
                  </span>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 font-mono">
                    {viewingDemand.protocol}
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewingDemand(null)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-lg font-bold px-2 py-0.5 rounded transition"
              >
                ✕
              </button>
            </div>

            {/* Cabeçalho de Status e Gravidade */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-50 dark:bg-[#0c121e] rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
              <div>
                <span className="text-slate-500 dark:text-slate-400 block text-[10px] uppercase font-mono font-semibold">
                  Status de Atendimento
                </span>
                <span className={`font-mono font-bold inline-flex items-center gap-1 mt-0.5 ${
                  viewingDemand.status === 'ABERTO' ? 'text-amber-800 dark:text-amber-300' :
                  viewingDemand.status === 'EM ANDAMENTO' ? 'text-blue-800 dark:text-blue-300' :
                  'text-emerald-800 dark:text-emerald-300'
                }`}>
                  {viewingDemand.status}
                </span>
              </div>

              {viewingDemand.severity && (
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block text-[10px] uppercase font-mono font-semibold">
                    Gravidade Operacional
                  </span>
                  <span className={`font-mono font-bold px-2 py-0.5 rounded text-[10px] inline-block mt-0.5 border ${
                    viewingDemand.severity === 'CRITICA' ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-800' :
                    viewingDemand.severity === 'ALTA' ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800' :
                    viewingDemand.severity === 'MEDIA' ? 'bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-800' :
                    'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                  }`}>
                    {viewingDemand.severity}
                  </span>
                </div>
              )}

              <div>
                <span className="text-slate-500 dark:text-slate-400 block text-[10px] uppercase font-mono font-semibold">
                  Data do Registro
                </span>
                <span className="font-mono text-slate-700 dark:text-slate-300 block mt-0.5">
                  {new Date(viewingDemand.created_at).toLocaleString('pt-BR')}
                </span>
              </div>
            </div>

            {/* Relato Original do Cidadão */}
            <div className="p-3.5 bg-white dark:bg-[#131d2e] rounded-xl border border-slate-200 dark:border-slate-700 space-y-1.5 text-xs">
              <span className="font-mono font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px] block">
                Relato Autuado pelo Cidadão
              </span>
              <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 font-sans">{viewingDemand.title}</h4>
              <p className="text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed">{viewingDemand.description}</p>
            </div>

            {/* Parecer da IA: Gravidade e Síntese */}
            {(viewingDemand.severity_justification || viewingDemand.organized_summary) && (
              <div className="p-3.5 bg-blue-50/50 dark:bg-[#0f1d33] rounded-xl border border-blue-200 dark:border-blue-900/60 space-y-2 text-xs">
                <span className="font-mono font-semibold text-civic-700 dark:text-civic-300 uppercase tracking-wider text-[10px] block">
                  Triagem e Avaliação Técnica por IA
                </span>
                {viewingDemand.severity_justification && (
                  <div>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 block font-mono text-[11px]">
                      Justificativa da Classificação de Risco:
                    </span>
                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed mt-0.5">{viewingDemand.severity_justification}</p>
                  </div>
                )}
                {viewingDemand.organized_summary && (
                  <div className="pt-2 border-t border-blue-100 dark:border-blue-900/40">
                    <span className="font-semibold text-slate-800 dark:text-slate-200 block font-mono text-[11px]">
                      Síntese Estruturada dos Fatos:
                    </span>
                    <p className="text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed mt-0.5">{viewingDemand.organized_summary}</p>
                  </div>
                )}
              </div>
            )}

            {/* Parecer Conclusivo se Concluída */}
            {viewingDemand.status === 'FECHADO' && viewingDemand.resolution_notes && (
              <div className="p-3.5 bg-emerald-50 dark:bg-[#0d221c] rounded-xl border border-emerald-300 dark:border-emerald-800 space-y-1 text-xs">
                <span className="font-mono font-bold text-emerald-950 dark:text-emerald-300 uppercase tracking-wider text-[10px] block">
                  Parecer Técnico Conclusivo Emitido
                </span>
                <p className="text-emerald-900 dark:text-emerald-200 leading-relaxed whitespace-pre-line">{viewingDemand.resolution_notes}</p>
              </div>
            )}

            {/* Ações do Servidor */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-200 dark:border-slate-800 modal-footer">
              <button
                type="button"
                onClick={() => setViewingDemand(null)}
                className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
              >
                Fechar Dossiê
              </button>

              <div className="flex items-center gap-2">
                {viewingDemand.status === 'ABERTO' && (
                  <button
                    type="button"
                    onClick={() => handleStartAttendance(viewingDemand)}
                    className="bg-civic-700 hover:bg-civic-800 text-white font-bold text-xs px-4 py-2 rounded-lg transition flex items-center gap-1.5 shadow-xs"
                  >
                    <span>Iniciar Atendimento (EM ANDAMENTO)</span>
                    <IconArrowRight size={14} />
                  </button>
                )}

                {viewingDemand.status === 'EM ANDAMENTO' && (
                  <button
                    type="button"
                    onClick={() => setClosingDemand(viewingDemand)}
                    className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-4 py-2 rounded-lg transition flex items-center gap-1.5 shadow-xs"
                  >
                    <IconCheckCircle size={14} />
                    <span>Concluir e Emitir Parecer Técnico</span>
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL DE CONCLUSÃO COM PARECER TÉCNICO OBRIGATÓRIO (RF014) */}
      {/* ========================================================================= */}
      {closingDemand && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 modal-overlay">
          <div className="bg-white dark:bg-[#111827] rounded-xl shadow-xl max-w-lg w-full p-6 space-y-4 border border-slate-200 dark:border-slate-800 modal-card">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 modal-header">
              <div>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-mono block">
                  Encerramento Administrativo
                </span>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 font-mono modal-title">
                  Parecer Técnico: {closingDemand.protocol}
                </h3>
              </div>
            </div>
            
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed modal-desc">
              O parecer técnico é o documento oficial que formaliza a resolução perante o cidadão (Lei Federal nº 13.460/2017) e dispara a notificação eletrônica imediata.
            </p>

            {closeError && (
              <div role="alert" className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-300 text-xs rounded-lg flex items-center gap-2 modal-alert-error">
                <IconAlertCircle size={15} className="text-rose-600 dark:text-rose-400 shrink-0" />
                <span>{closeError}</span>
              </div>
            )}

            <div>
              <label htmlFor="res-notes" className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1.5 modal-label font-mono">
                Parecer Técnico Conclusivo <span className="text-rose-500 modal-required-star">*</span>
              </label>
              <textarea
                id="res-notes"
                rows={4}
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                placeholder="Descreva a vistoria realizada, intervenção executada e providências adotadas pelo órgão responsável..."
                className="w-full text-xs p-3 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#131d2e] text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 rounded-lg focus:ring-2 focus:ring-civic-500 dark:focus:ring-civic-400 outline-none leading-relaxed modal-textarea font-sans"
                required
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 modal-footer">
              <button
                type="button"
                onClick={() => {
                  setClosingDemand(null);
                  setCloseError('');
                }}
                className="text-xs px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition modal-btn-cancel"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmClose}
                className="text-xs bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-4 py-2 rounded-lg transition modal-btn-confirm shadow-xs"
              >
                Homologar Conclusão e Notificar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
