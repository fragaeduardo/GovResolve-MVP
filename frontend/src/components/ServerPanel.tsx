import React, { useState, useEffect } from 'react';
import { api, Demand } from '../services/api';

export const ServerPanel: React.FC = () => {
  const [demands, setDemands] = useState<Demand[]>([]);
  const [stats, setStats] = useState({ total: 0, aberto: 0, em_andamento: 0, fechado: 0 });
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Modal de Fechamento com Parecer Obrigatório (RF014)
  const [closingDemand, setClosingDemand] = useState<Demand | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [closingNotes, setClosingNotes] = useState('');
  const [closeError, setCloseError] = useState('');

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  const loadData = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const [list, statsData] = await Promise.all([
        api.getAdminDemands(statusFilter || undefined),
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

  const handleStartAttendance = async (demand: Demand) => {
    try {
      await api.updateDemandStatus(
        demand.protocol,
        'EM ANDAMENTO',
        'Atendimento iniciado pela equipe responsável.'
      );
      await loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleConfirmClose = async () => {
    if (!closingDemand) return;
    if (!resolutionNotes.trim()) {
      setCloseError('O parecer conclusivo do atendimento é obrigatório para encerrar a demanda (RF014).');
      return;
    }

    try {
      await api.updateDemandStatus(
        closingDemand.protocol,
        'FECHADO',
        closingNotes || 'Atendimento concluído.',
        resolutionNotes.trim()
      );
      setClosingDemand(null);
      setResolutionNotes('');
      setClosingNotes('');
      setCloseError('');
      await loadData();
    } catch (err: any) {
      setCloseError(err.message);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Cards de Métricas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-500 font-semibold uppercase">Total de Demandas</span>
          <p className="text-2xl font-bold text-slate-900 mt-1">{stats.total}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-amber-200 shadow-sm bg-amber-50/30">
          <span className="text-xs text-amber-700 font-semibold uppercase">Abertas (Novas)</span>
          <p className="text-2xl font-bold text-amber-900 mt-1">{stats.aberto}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-blue-200 shadow-sm bg-blue-50/30">
          <span className="text-xs text-blue-700 font-semibold uppercase">Em Andamento</span>
          <p className="text-2xl font-bold text-blue-900 mt-1">{stats.em_andamento}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-emerald-200 shadow-sm bg-emerald-50/30">
          <span className="text-xs text-emerald-700 font-semibold uppercase">Concluídas / Fechadas</span>
          <p className="text-2xl font-bold text-emerald-900 mt-1">{stats.fechado}</p>
        </div>
      </div>

      {/* Barra de Filtros e Ações */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-700">Filtrar por Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs border rounded-lg px-3 py-1.5 bg-slate-50 text-slate-800 outline-none focus:ring-2 focus:ring-blue-600"
          >
            <option value="">Todos os Status</option>
            <option value="ABERTO">Aberto</option>
            <option value="EM ANDAMENTO">Em Andamento</option>
            <option value="FECHADO">Fechado</option>
          </select>
        </div>

        <button
          onClick={loadData}
          className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg transition"
        >
          🔄 Atualizar Lista
        </button>
      </div>

      {errorMsg && (
        <div role="alert" className="p-4 bg-red-50 text-red-700 text-sm rounded border-l-4 border-red-500">
          {errorMsg}
        </div>
      )}

      {/* Lista de Demandas */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
          <h3 className="text-sm font-bold text-slate-800">Fila de Atendimento do Setor (RF011)</h3>
          <span className="text-xs text-slate-500">{demands.length} demanda(s) encontrada(s)</span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-sm text-slate-500">Carregando fila de demandas...</div>
        ) : demands.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">Nenhuma demanda pendente para o filtro selecionado.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {demands.map((demand) => (
              <div key={demand.id} className="p-5 hover:bg-slate-50 transition space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sm text-blue-900 bg-blue-50 px-2.5 py-0.5 rounded border border-blue-200">
                      {demand.protocol}
                    </span>
                    <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                      {demand.category || 'Geral'}
                    </span>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                    demand.status === 'ABERTO' ? 'bg-amber-100 text-amber-800' :
                    demand.status === 'EM ANDAMENTO' ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {demand.status}
                  </span>
                </div>

                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{demand.title}</h4>
                  <p className="text-xs text-slate-600 mt-1 whitespace-pre-line">{demand.description}</p>
                </div>

                {demand.organized_summary && (
                  <div className="bg-slate-50 p-2.5 rounded border text-xs text-slate-600">
                    <span className="font-semibold text-slate-800">Síntese Estruturada da IA (RF009):</span>
                    <p className="mt-0.5 whitespace-pre-line">{demand.organized_summary}</p>
                  </div>
                )}

                {demand.resolution_notes && (
                  <div className="bg-emerald-50 p-2.5 rounded border border-emerald-200 text-xs text-emerald-950">
                    <span className="font-bold">Parecer de Resolução Registrado (RF014):</span>
                    <p className="mt-0.5">{demand.resolution_notes}</p>
                  </div>
                )}

                {/* Ações da Máquina de Estados (RF012) */}
                <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                  {demand.status === 'ABERTO' && (
                    <button
                      onClick={() => handleStartAttendance(demand)}
                      className="bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold px-4 py-1.5 rounded-lg transition"
                    >
                      ▶ Iniciar Atendimento (EM ANDAMENTO)
                    </button>
                  )}

                  {demand.status === 'EM ANDAMENTO' && (
                    <button
                      onClick={() => setClosingDemand(demand)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-1.5 rounded-lg transition"
                    >
                      ✓ Concluir e Fechar Demanda...
                    </button>
                  )}

                  {demand.status === 'FECHADO' && (
                    <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
                      ✓ Atendimento Finalizado e Notificado ao Cidadão (RF005)
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL DE CONCLUSÃO COM PARECER OBRIGATÓRIO (RF014) */}
      {closingDemand && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 space-y-4">
            <h3 className="text-lg font-bold text-slate-900">
              Concluir Atendimento: {closingDemand.protocol}
            </h3>
            <p className="text-xs text-slate-600">
              Para formalizar o encerramento da demanda e notificar o cidadão, informe obrigatoriamente o parecer técnico das ações realizadas (RF014).
            </p>

            {closeError && (
              <div role="alert" className="p-3 bg-red-50 text-red-700 text-xs rounded border-l-4 border-red-500">
                {closeError}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1">
                Parecer Técnico Conclusivo <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={4}
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                placeholder="Ex: Equipe de manutenção compareceu ao local em 02/10 e realizou o reparo completo da tubulação..."
                className="w-full text-xs p-3 border rounded-lg focus:ring-2 focus:ring-emerald-600 outline-none"
                required
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setClosingDemand(null);
                  setCloseError('');
                }}
                className="text-xs px-4 py-2 border rounded-lg hover:bg-slate-100 transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmClose}
                className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-4 py-2 rounded-lg transition"
              >
                Confirmar e Notificar Cidadão
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
