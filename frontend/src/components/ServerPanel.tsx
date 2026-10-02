import React, { useState, useEffect } from 'react';
import { api, Demand } from '../services/api';
import {
  IconBuilding,
  IconClock,
  IconCheckCircle,
  IconAlertCircle,
  IconRefresh,
  IconArrowRight,
  IconFileText
} from './Icons';

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
        'Atendimento assumido e iniciado pela equipe técnica do órgão responsável.'
      );
      await loadData();
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
      await api.updateDemandStatus(
        closingDemand.protocol,
        'FECHADO',
        closingNotes || 'Atendimento finalizado com sucesso.',
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
      
      {/* Cards de Métricas Executivas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Total de Demandas</span>
          <p className="text-2xl font-bold text-slate-900 mt-2">{stats.total}</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider block">Novas (Abertas)</span>
          <p className="text-2xl font-bold text-amber-900 mt-2">{stats.aberto}</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-blue-700 uppercase tracking-wider block">Em Andamento</span>
          <p className="text-2xl font-bold text-blue-900 mt-2">{stats.em_andamento}</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider block">Concluídas</span>
          <p className="text-2xl font-bold text-emerald-900 mt-2">{stats.fechado}</p>
        </div>
      </div>

      {/* Barra de Filtros */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <label htmlFor="filter-status" className="text-xs font-medium text-slate-700">Filtrar por Status:</label>
          <select
            id="filter-status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs border border-slate-200 rounded-lg px-3 py-1.5 bg-slate-50 text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todos os Status</option>
            <option value="ABERTO">Aberto</option>
            <option value="EM ANDAMENTO">Em Andamento</option>
            <option value="FECHADO">Fechado</option>
          </select>
        </div>

        <button
          onClick={loadData}
          className="text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-1.5 rounded-lg transition flex items-center gap-1.5"
        >
          <IconRefresh size={14} />
          <span>Atualizar Fila</span>
        </button>
      </div>

      {errorMsg && (
        <div role="alert" className="p-4 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-center gap-2">
          <IconAlertCircle size={16} className="text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Fila de Atendimento do Órgão */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 bg-slate-50/70 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <IconBuilding size={16} className="text-slate-600" />
            <h3 className="text-sm font-semibold text-slate-900">Fila de Demandas Operacionais</h3>
          </div>
          <span className="text-xs text-slate-500 font-mono">{demands.length} registro(s)</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Carregando demandas do órgão...</div>
        ) : demands.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">Nenhuma solicitação encontrada para o filtro selecionado.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {demands.map((demand) => (
              <div key={demand.id} className="p-5 hover:bg-slate-50/60 transition space-y-3.5">
                
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono font-bold text-xs text-blue-900 bg-blue-50 px-2.5 py-1 rounded border border-blue-200">
                      {demand.protocol}
                    </span>
                    <span className="text-xs bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded font-medium">
                      {demand.category || 'Geral'}
                    </span>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium inline-flex items-center gap-1.5 ${
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

                <div className="space-y-1">
                  <h4 className="font-semibold text-sm text-slate-900">{demand.title}</h4>
                  <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">{demand.description}</p>
                </div>

                {demand.organized_summary && (
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs text-slate-700 space-y-1">
                    <span className="font-semibold text-blue-950 block">Síntese Estruturada da IA:</span>
                    <p className="whitespace-pre-line leading-relaxed">{demand.organized_summary}</p>
                  </div>
                )}

                {demand.resolution_notes && (
                  <div className="bg-emerald-50/70 p-3 rounded-lg border border-emerald-200 text-xs text-emerald-950 space-y-1">
                    <span className="font-semibold block">Parecer Conclusivo Registrado:</span>
                    <p className="leading-relaxed">{demand.resolution_notes}</p>
                  </div>
                )}

                {/* Ações da Máquina de Estados */}
                <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
                  {demand.status === 'ABERTO' && (
                    <button
                      onClick={() => handleStartAttendance(demand)}
                      className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition flex items-center gap-1.5"
                    >
                      <span>Iniciar Atendimento (EM ANDAMENTO)</span>
                      <IconArrowRight size={13} />
                    </button>
                  )}

                  {demand.status === 'EM ANDAMENTO' && (
                    <button
                      onClick={() => setClosingDemand(demand)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition flex items-center gap-1.5"
                    >
                      <IconCheckCircle size={14} />
                      <span>Concluir e Emitir Parecer...</span>
                    </button>
                  )}

                  {demand.status === 'FECHADO' && (
                    <span className="text-xs text-emerald-700 font-medium flex items-center gap-1.5">
                      <IconCheckCircle size={14} />
                      <span>Atendimento Finalizado e Notificação Enviada</span>
                    </span>
                  )}
                </div>

              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL DE CONCLUSÃO COM PARECER TÉCNICO OBRIGATÓRIO */}
      {closingDemand && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-semibold text-slate-900">
                Parecer Conclusivo: {closingDemand.protocol}
              </h3>
            </div>
            
            <p className="text-xs text-slate-600 leading-relaxed">
              O parecer técnico é o documento que será notificado ao cidadão por e-mail e exibido na consulta de protocolo. Descreva com clareza a intervenção realizada.
            </p>

            {closeError && (
              <div role="alert" className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg flex items-center gap-2">
                <IconAlertCircle size={15} className="text-rose-600 shrink-0" />
                <span>{closeError}</span>
              </div>
            )}

            <div>
              <label htmlFor="res-notes" className="block text-xs font-semibold text-slate-800 mb-1.5">
                Parecer Técnico do Órgão <span className="text-rose-500">*</span>
              </label>
              <textarea
                id="res-notes"
                rows={4}
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                placeholder="Ex: Equipe operacional deslocada ao local realizou a desobstrução da galeria pluvial e recomposição asfáltica..."
                className="w-full text-xs p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none leading-relaxed"
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
                className="text-xs px-4 py-2 border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmClose}
                className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-4 py-2 rounded-lg transition"
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
