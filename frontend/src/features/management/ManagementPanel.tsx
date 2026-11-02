import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../services/api';
import { ManagementOverview, DepartmentComparison } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { ReviewQueue } from './ReviewQueue';
import { MetricsOverview } from './MetricsOverview';
import { DepartmentComparisonTable } from './DepartmentComparisonTable';
import {
  IconBarChart,
  IconRefresh,
  IconShield,
  IconAlertCircle,
  IconLock
} from '../../components/common/Icons';

export const ManagementPanel: React.FC = () => {
  const { user, canAccessManagement } = useAuth();

  const [overview, setOverview] = useState<ManagementOverview | null>(null);
  const [departments, setDepartments] = useState<DepartmentComparison[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!canAccessManagement) return;

    setLoading(true);
    setErrorMsg(null);
    try {
      const [overviewData, deptsData] = await Promise.all([
        api.getManagementOverview(),
        api.getManagementDepartments()
      ]);
      setOverview(overviewData);
      setDepartments(deptsData);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Falha ao carregar indicadores consolidados de gestão.');
    } finally {
      setLoading(false);
    }
  }, [canAccessManagement]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Se o usuário não tiver permissão para a Área de Gestão
  if (!canAccessManagement) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 font-sans">
        <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
            <IconLock size={32} />
          </div>
          <div className="max-w-md">
            <h2 className="text-lg font-bold text-white tracking-tight">
              Acesso Restrito à Gestão Estratégica
            </h2>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              O módulo de indicadores executivos e comparativos globais é restrito ao perfil de
              <strong className="text-slate-200"> Gestor Municipal (Ouvidoria Geral e Gabinete)</strong>.
              Seu perfil atual não possui autorização administrativa concedida pelo controle de acesso.
            </p>
          </div>
          <div className="p-3 rounded-lg bg-slate-800/80 border border-slate-700 text-xs text-slate-300 font-mono">
            Usuário: {user?.name} • Papel: {user?.role}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 font-sans">
      {/* Cabeçalho Estratégico */}
      <section
        aria-label="Cabeçalho executivo de gestão"
        className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-slate-800 border border-slate-700 shadow-sm"
      >
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-civic-700/20 border border-civic-600/30 flex items-center justify-center text-civic-300">
            <IconBarChart size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-white tracking-tight">
                Gestão e Indicadores Estratégicos
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-800/60">
                GABINETE & OUVIDORIA
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Consolidação de resolutividade, gravidade e demandas da Ouvidoria Municipal de Goiânia
            </p>
          </div>
        </div>

        {/* Ações do Topo */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            type="button"
            onClick={() => loadData()}
            disabled={loading}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-2 transition-all disabled:opacity-50"
            title="Atualizar dados analíticos"
          >
            <IconRefresh size={14} className={loading ? 'animate-spin text-civic-400' : 'text-slate-400'} />
            <span>{loading ? 'Calculando...' : 'Atualizar Dados'}</span>
          </button>
        </div>
      </section>

      {/* Banner de Erro caso a carga falhe */}
      {errorMsg && (
        <div
          role="alert"
          className="p-3.5 rounded-xl border bg-rose-950/40 border-rose-800/60 text-rose-300 text-xs flex items-center gap-2"
        >
          <IconAlertCircle size={16} className="text-rose-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Visão Geral dos Indicadores */}
      <MetricsOverview overview={overview} isLoading={loading} />

      <ReviewQueue />

      {/* Tabela de Comparativo por Órgão */}
      <DepartmentComparisonTable departments={departments} isLoading={loading} />
    </div>
  );
};
