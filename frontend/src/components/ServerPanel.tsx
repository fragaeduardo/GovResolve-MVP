import React, { useState, useEffect } from 'react';
import { api, Demand, Department, DepartmentComparison } from '../services/api';
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
  IconEye
} from './Icons';

export const ServerPanel: React.FC = () => {
  const [activeView, setActiveView] = useState<'fila' | 'comparativo'>('fila');
  
  // Dados da Fila
  const [demands, setDemands] = useState<Demand[]>([]);
  const [stats, setStats] = useState({ total: 0, aberto: 0, em_andamento: 0, fechado: 0 });
  const [departments, setDepartments] = useState<Department[]>([]);
  const [comparison, setComparison] = useState<DepartmentComparison[]>([]);
  
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
    if (activeView === 'fila') {
      loadDemandsData();
    } else {
      loadComparisonData();
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
          departmentFilter ? Number(departmentFilter) : undefined,
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
    <div className="space-y-5">
      
      {/* Barra de Sub-Navegação do Servidor */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2 bg-slate-200/60 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveView('fila')}
            className={`py-2 px-3.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition ${
              activeView === 'fila'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <IconFileText size={16} />
            <span>Fila de Atendimento</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveView('comparativo')}
            className={`py-2 px-3.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition ${
              activeView === 'comparativo'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <IconBarChart size={16} />
            <span>Comparativo entre Órgãos ({departments.length})</span>
          </button>
        </div>

        <button
          type="button"
          onClick={() => { activeView === 'fila' ? loadDemandsData() : loadComparisonData(); }}
          className="text-xs font-medium bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 px-3.5 py-2 rounded-lg transition flex items-center gap-1.5 shadow-2xs"
        >
          <IconRefresh size={14} />
          <span>Atualizar Dados</span>
        </button>
      </div>

      {/* Cards de Métricas Gerais de Resumo */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 server-stats-grid">
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs stat-card stat-card-total">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block stat-card-label">Total de Demandas</span>
          <p className="text-2xl font-bold text-slate-900 mt-1 stat-card-value">{stats.total}</p>
        </div>
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs stat-card stat-card-open">
          <span className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider block stat-card-label">Novas (Abertas)</span>
          <p className="text-2xl font-bold text-amber-900 mt-1 stat-card-value">{stats.aberto}</p>
        </div>
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs stat-card stat-card-progress">
          <span className="text-[11px] font-semibold text-blue-700 uppercase tracking-wider block stat-card-label">Em Andamento</span>
          <p className="text-2xl font-bold text-blue-900 mt-1 stat-card-value">{stats.em_andamento}</p>
        </div>
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs stat-card stat-card-closed">
          <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider block stat-card-label">Concluídas</span>
          <p className="text-2xl font-bold text-emerald-900 mt-1 stat-card-value">{stats.fechado}</p>
        </div>
      </div>

      {errorMsg && (
        <div role="alert" className="p-4 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-center gap-2">
          <IconAlertCircle size={16} className="text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ABA 1: FILA DE ATENDIMENTO COM FILTROS, ORDENAÇÃO E VISUALIZAÇÃO INDIVIDUAL */}
      {/* ========================================================================= */}
      {activeView === 'fila' && (
        <div className="space-y-4">
          
          {/* Barra de Filtros, Pesquisa e Ordenação */}
          <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-xs space-y-3 filter-bar-container">
            
            {/* Linha 1: Busca Textual */}
            <form onSubmit={handleSearchSubmit} className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Pesquisar por protocolo, título ou palavras-chave..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                />
                <div className="absolute left-3 top-2.5 text-slate-400">
                  <IconSearch size={15} />
                </div>
              </div>
              <button
                type="submit"
                className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-4 py-2 rounded-lg transition"
              >
                Buscar
              </button>
            </form>

            {/* Linha 2: Dropdowns de Filtro e Ordenação por Prioridade */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-slate-100">
              
              <div className="flex flex-wrap items-center gap-3">
                {/* Filtro por Órgão */}
                <div className="flex items-center gap-1.5 text-xs">
                  <label htmlFor="filter-dept" className="font-semibold text-slate-600">Órgão:</label>
                  <select
                    id="filter-dept"
                    value={departmentFilter}
                    onChange={(e) => setDepartmentFilter(e.target.value ? Number(e.target.value) : '')}
                    className="border border-slate-200 rounded-lg px-2.5 py-1.5 bg-slate-50 text-slate-800 outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                  >
                    <option value="">Todos os Órgãos ({departments.length})</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name.split('—')[0].trim()}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Filtro por Status */}
                <div className="flex items-center gap-1.5 text-xs">
                  <label htmlFor="filter-status" className="font-semibold text-slate-600">Status:</label>
                  <select
                    id="filter-status"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="border border-slate-200 rounded-lg px-2.5 py-1.5 bg-slate-50 text-slate-800 outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                  >
                    <option value="">Todos os Status</option>
                    <option value="ABERTO">Aberto</option>
                    <option value="EM ANDAMENTO">Em Andamento</option>
                    <option value="FECHADO">Fechado</option>
                  </select>
                </div>

                {/* Filtro por Gravidade */}
                <div className="flex items-center gap-1.5 text-xs">
                  <label htmlFor="filter-severity" className="font-semibold text-slate-600">Gravidade:</label>
                  <select
                    id="filter-severity"
                    value={severityFilter}
                    onChange={(e) => setSeverityFilter(e.target.value)}
                    className="border border-slate-200 rounded-lg px-2.5 py-1.5 bg-slate-50 text-slate-800 outline-none focus:ring-2 focus:ring-blue-500 text-xs"
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
                      ? 'bg-rose-50 border-rose-300 text-rose-800 shadow-2xs'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                  title="Ordenar automaticamente por gravidade: Crítica -> Alta -> Média -> Baixa"
                >
                  <IconSort size={14} className={orderByPriority ? 'text-rose-600' : 'text-slate-500'} />
                  <span>{orderByPriority ? 'Prioridade Automática (Ativa)' : 'Ordenar por Data'}</span>
                </button>
              </div>

            </div>
          </div>

          {/* Fila de Atendimento em Lista de Cards com Ação de Visualização Individual */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden demands-table-card">
            <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h3 className="font-semibold text-sm text-slate-900">
                Demandas em Fila ({demands.length})
              </h3>
              {orderByPriority && (
                <span className="text-[11px] font-mono font-medium text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                  Ordenado por Prioridade (Crítica → Baixa)
                </span>
              )}
            </div>

            {loading ? (
              <div className="p-8 text-center text-xs text-slate-500">Atualizando fila de atendimento...</div>
            ) : demands.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">Nenhuma solicitação encontrada para os filtros selecionados.</div>
            ) : (
              <div className="divide-y divide-slate-100">
                {demands.map((demand) => (
                  <div key={demand.id} className="p-4 hover:bg-slate-50/70 transition space-y-3">
                    
                    {/* Linha Superior: Protocolo, Gravidade e Status */}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded border border-blue-100">
                          {demand.protocol}
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono">
                          {new Date(demand.created_at).toLocaleDateString('pt-BR')} às {new Date(demand.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {demand.severity && (
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold border ${
                            demand.severity === 'CRITICA' ? 'bg-rose-100 text-rose-800 border-rose-300' :
                            demand.severity === 'ALTA' ? 'bg-amber-100 text-amber-800 border-amber-300' :
                            demand.severity === 'MEDIA' ? 'bg-blue-100 text-blue-800 border-blue-300' :
                            'bg-emerald-100 text-emerald-800 border-emerald-300'
                          }`}>
                            {demand.severity}
                          </span>
                        )}

                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          demand.status === 'ABERTO' ? 'bg-amber-50 text-amber-800 border border-amber-200' :
                          demand.status === 'EM ANDAMENTO' ? 'bg-blue-50 text-blue-800 border border-blue-200' :
                          'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        }`}>
                          {demand.status === 'ABERTO' && <IconClock size={12} />}
                          {demand.status === 'EM ANDAMENTO' && <IconClock size={12} />}
                          {demand.status === 'FECHADO' && <IconCheckCircle size={12} />}
                          <span>{demand.status}</span>
                        </span>
                      </div>
                    </div>

                    {/* Título e Descrição Resumida */}
                    <div>
                      <h4 className="font-semibold text-sm text-slate-900">{demand.title}</h4>
                      <p className="text-xs text-slate-600 line-clamp-2 mt-0.5 leading-relaxed">{demand.description}</p>
                    </div>

                    {/* Barra de Ações: Visualização Individual & Tramitação */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
                      <button
                        type="button"
                        onClick={() => setViewingDemand(demand)}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 font-medium transition flex items-center gap-1.5 shadow-2xs"
                      >
                        <IconEye size={14} className="text-blue-600" />
                        <span>Visualizar Detalhes Completos</span>
                      </button>

                      <div className="flex items-center gap-2">
                        {demand.status === 'ABERTO' && (
                          <button
                            type="button"
                            onClick={() => handleStartAttendance(demand)}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-3 py-1.5 rounded-lg transition flex items-center gap-1.5"
                          >
                            <span>Assumir Atendimento</span>
                            <IconArrowRight size={13} />
                          </button>
                        )}

                        {demand.status === 'EM ANDAMENTO' && (
                          <button
                            type="button"
                            onClick={() => setClosingDemand(demand)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-3 py-1.5 rounded-lg transition flex items-center gap-1.5"
                          >
                            <IconCheckCircle size={13} />
                            <span>Concluir Demanda...</span>
                          </button>
                        )}

                        {demand.status === 'FECHADO' && (
                          <span className="text-emerald-700 font-medium flex items-center gap-1">
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
      {/* ABA 2: ESTATÍSTICAS E PAINEL COMPARATIVO ENTRE ÓRGÃOS REGISTRADOS */}
      {/* ========================================================================= */}
      {activeView === 'comparativo' && (
        <div className="space-y-4">
          
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Quadro Comparativo de Atendimento por Órgão</h3>
              <p className="text-xs text-slate-500">Métricas consolidadas de demanda, vazão e gravidade entre os 12 órgãos municipais cadastrados.</p>
            </div>
            <span className="text-xs font-mono bg-blue-50 text-blue-800 border border-blue-200 px-2.5 py-1 rounded-lg font-semibold">
              {departments.length} Órgãos Registrados
            </span>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
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
                <tbody className="divide-y divide-slate-100">
                  {comparison.map((dept) => (
                    <tr key={dept.department_id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3.5 px-4 font-medium text-slate-900">
                        <div>
                          <p className="font-semibold text-slate-800">{dept.department_name}</p>
                          <p className="text-[11px] text-slate-400 font-mono">{dept.email}</p>
                        </div>
                      </td>
                      <td className="py-3.5 px-3 text-center font-bold text-slate-900 text-sm">
                        {dept.total}
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <span className="px-2 py-0.5 rounded font-mono font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                          {dept.aberto}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <span className="px-2 py-0.5 rounded font-mono font-semibold bg-blue-50 text-blue-800 border border-blue-200">
                          {dept.em_andamento}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <span className="px-2 py-0.5 rounded font-mono font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          {dept.fechado}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded font-mono font-semibold ${
                          (dept.critica + dept.alta) > 0 ? 'bg-rose-100 text-rose-800 border border-rose-300' : 'text-slate-400'
                        }`}>
                          {dept.critica + dept.alta}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-16 bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
                            <div
                              className="bg-emerald-600 h-full rounded-full transition-all duration-300"
                              style={{ width: `${dept.resolution_rate}%` }}
                            />
                          </div>
                          <span className="font-mono font-bold text-slate-800 text-[11px] w-10 text-right">
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
      {/* MODAL DE VISUALIZAÇÃO INDIVIDUAL DETALHADA DA RECLAMAÇÃO */}
      {/* ========================================================================= */}
      {viewingDemand && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 modal-overlay">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-5 sm:p-6 space-y-4 border border-slate-200 max-h-[90vh] overflow-y-auto modal-card">
            
            <div className="flex items-center justify-between border-b pb-3 modal-header">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-mono block">Ficha Cadastral da Demanda</span>
                <h3 className="text-base font-bold text-slate-900 font-mono">
                  {viewingDemand.protocol}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setViewingDemand(null)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold px-2 py-0.5 rounded"
              >
                ✕
              </button>
            </div>

            {/* Cabeçalho de Status e Gravidade */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-semibold">Status de Atendimento</span>
                <span className={`font-bold inline-flex items-center gap-1 mt-0.5 ${
                  viewingDemand.status === 'ABERTO' ? 'text-amber-800' :
                  viewingDemand.status === 'EM ANDAMENTO' ? 'text-blue-800' :
                  'text-emerald-800'
                }`}>
                  {viewingDemand.status}
                </span>
              </div>

              {viewingDemand.severity && (
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-semibold">Gravidade Operacional</span>
                  <span className={`font-bold px-2 py-0.5 rounded text-[11px] inline-block mt-0.5 border ${
                    viewingDemand.severity === 'CRITICA' ? 'bg-rose-100 text-rose-800 border-rose-300' :
                    viewingDemand.severity === 'ALTA' ? 'bg-amber-100 text-amber-800 border-amber-300' :
                    viewingDemand.severity === 'MEDIA' ? 'bg-blue-100 text-blue-800 border-blue-300' :
                    'bg-emerald-100 text-emerald-800 border-emerald-300'
                  }`}>
                    {viewingDemand.severity}
                  </span>
                </div>
              )}

              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-semibold">Data do Registro</span>
                <span className="font-mono text-slate-700 block mt-0.5">
                  {new Date(viewingDemand.created_at).toLocaleString('pt-BR')}
                </span>
              </div>
            </div>

            {/* Relato Original do Cidadão */}
            <div className="p-3.5 bg-white rounded-xl border border-slate-200 space-y-1.5 text-xs">
              <span className="font-semibold text-slate-500 uppercase tracking-wider text-[10px] block">Relato Registrado pelo Cidadão</span>
              <h4 className="font-bold text-sm text-slate-900">{viewingDemand.title}</h4>
              <p className="text-slate-700 whitespace-pre-line leading-relaxed">{viewingDemand.description}</p>
            </div>

            {/* Parecer da IA: Gravidade e Síntese */}
            {(viewingDemand.severity_justification || viewingDemand.organized_summary) && (
              <div className="p-3.5 bg-blue-50/50 rounded-xl border border-blue-200 space-y-2 text-xs">
                <span className="font-semibold text-blue-900 uppercase tracking-wider text-[10px] block">Triagem Automatizada por IA</span>
                {viewingDemand.severity_justification && (
                  <div>
                    <span className="font-semibold text-slate-800 block">Justificativa da Classificação:</span>
                    <p className="text-slate-700 leading-relaxed mt-0.5">{viewingDemand.severity_justification}</p>
                  </div>
                )}
                {viewingDemand.organized_summary && (
                  <div className="pt-1 border-t border-blue-100">
                    <span className="font-semibold text-slate-800 block">Síntese Estruturada dos Fatos:</span>
                    <p className="text-slate-700 whitespace-pre-line leading-relaxed mt-0.5">{viewingDemand.organized_summary}</p>
                  </div>
                )}
              </div>
            )}

            {/* Parecer Conclusivo se Concluída */}
            {viewingDemand.status === 'FECHADO' && viewingDemand.resolution_notes && (
              <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-300 space-y-1 text-xs">
                <span className="font-semibold text-emerald-950 uppercase tracking-wider text-[10px] block">Parecer Conclusivo Emitido</span>
                <p className="text-emerald-900 leading-relaxed whitespace-pre-line">{viewingDemand.resolution_notes}</p>
              </div>
            )}

            {/* Ações do Servidor */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-200 modal-footer">
              <button
                type="button"
                onClick={() => setViewingDemand(null)}
                className="px-4 py-2 border border-slate-200 rounded-lg text-xs text-slate-700 hover:bg-slate-50 transition"
              >
                Fechar Ficha
              </button>

              <div className="flex items-center gap-2">
                {viewingDemand.status === 'ABERTO' && (
                  <button
                    type="button"
                    onClick={() => handleStartAttendance(viewingDemand)}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-4 py-2 rounded-lg transition flex items-center gap-1.5"
                  >
                    <span>Iniciar Atendimento (EM ANDAMENTO)</span>
                    <IconArrowRight size={14} />
                  </button>
                )}

                {viewingDemand.status === 'EM ANDAMENTO' && (
                  <button
                    type="button"
                    onClick={() => setClosingDemand(viewingDemand)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-4 py-2 rounded-lg transition flex items-center gap-1.5"
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
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 space-y-4 border border-slate-200 modal-card">
            <div className="flex items-center justify-between border-b pb-3 modal-header">
              <h3 className="text-base font-semibold text-slate-900 modal-title">
                Parecer Conclusivo: {closingDemand.protocol}
              </h3>
            </div>
            
            <p className="text-xs text-slate-600 leading-relaxed modal-desc">
              O parecer técnico é o documento oficial que será notificado ao cidadão por e-mail e exibido na consulta de protocolo. Descreva com clareza a intervenção realizada pelo órgão competente.
            </p>

            {closeError && (
              <div role="alert" className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg flex items-center gap-2 modal-alert-error">
                <IconAlertCircle size={15} className="text-rose-600 shrink-0" />
                <span>{closeError}</span>
              </div>
            )}

            <div>
              <label htmlFor="res-notes" className="block text-xs font-semibold text-slate-800 mb-1.5 modal-label">
                Parecer Técnico do Órgão <span className="text-rose-500 modal-required-star">*</span>
              </label>
              <textarea
                id="res-notes"
                rows={4}
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                placeholder="Ex: Equipe técnica da secretaria compareceu ao local e concluiu o reparo asfáltico e desobstrução da galeria..."
                className="w-full text-xs p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none leading-relaxed modal-textarea"
                required
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 modal-footer">
              <button
                type="button"
                onClick={() => {
                  setClosingDemand(null);
                  setCloseError('');
                }}
                className="text-xs px-4 py-2 border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 transition modal-btn-cancel"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmClose}
                className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-4 py-2 rounded-lg transition modal-btn-confirm"
              >
                Registrar Conclusão e Notificar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
