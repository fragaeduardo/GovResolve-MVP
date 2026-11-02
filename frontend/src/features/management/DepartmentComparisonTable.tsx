import React, { useState } from 'react';
import { DepartmentComparison } from '../../types';
import { Skeleton } from '../../components/common/Skeleton';
import { EmptyState } from '../../components/common/EmptyState';
import { IconBuilding, IconSearch, IconAlertCircle, IconCheckCircle } from '../../components/common/Icons';

interface DepartmentComparisonTableProps {
  departments: DepartmentComparison[];
  isLoading: boolean;
}

export const DepartmentComparisonTable: React.FC<DepartmentComparisonTableProps> = ({
  departments,
  isLoading
}) => {
  const [filterQuery, setFilterQuery] = useState('');

  if (isLoading) {
    return (
      <div className="rounded-xl bg-slate-900 border border-slate-800 p-6 flex flex-col gap-3">
        <Skeleton height="32px" />
        <Skeleton height="48px" />
        <Skeleton height="48px" />
        <Skeleton height="48px" />
      </div>
    );
  }

  const filtered = departments.filter((d) =>
    d.department_name.toLowerCase().includes(filterQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-4">
      {/* Barra de Busca de Secretarias */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-slate-900 border border-slate-800">
        <div>
          <h2 className="text-sm font-bold text-white tracking-tight">
            Desempenho Comparativo por Secretaria
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Monitoramento de volume de atendimento, gravidade e resolução por pasta
          </p>
        </div>

        <div className="relative max-w-xs w-full">
          <label htmlFor="dept-search-input" className="sr-only">
            Filtrar secretarias por nome
          </label>
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <IconSearch size={14} />
          </div>
          <input
            id="dept-search-input"
            type="search"
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            placeholder="Filtrar secretaria..."
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 placeholder-slate-400 text-xs focus:ring-2 focus:ring-civic-500 focus:outline-hidden"
          />
        </div>
      </div>

      {/* Tabela Comparativa */}
      {filtered.length === 0 ? (
        <div className="p-8 rounded-xl bg-slate-900 border border-slate-800">
          <EmptyState
            title="Nenhum órgão encontrado"
            description="Não encontramos nenhuma secretaria com o termo buscado."
            action={
              <button
                type="button"
                onClick={() => setFilterQuery('')}
                className="px-3 py-1.5 rounded-lg bg-civic-600 text-white text-xs font-semibold"
              >
                Limpar Busca
              </button>
            }
          />
        </div>
      ) : (
        <div className="mx-auto w-full max-w-6xl overflow-hidden rounded-xl border border-slate-800 bg-slate-900 shadow-sm">
          <div className="w-full">
            <table className="w-full table-fixed text-left text-xs text-slate-300">
              <colgroup>
                <col className="w-[34%]" />
                <col className="w-[11%]" />
                <col className="w-[8%]" />
                <col className="w-[14%]" />
                <col className="w-[11%]" />
                <col className="w-[8%]" />
                <col className="w-[14%]" />
              </colgroup>
              <thead className="bg-slate-800/90 text-slate-400 uppercase text-[10px] tracking-wider font-semibold border-b border-slate-700">
                <tr>
                  <th scope="col" className="px-2 py-3 leading-tight break-words">Órgão / Secretaria</th>
                  <th scope="col" className="px-1.5 py-3 text-center leading-tight break-words">Volume Total</th>
                  <th scope="col" className="px-1.5 py-3 text-center leading-tight break-words">Abertas</th>
                  <th scope="col" className="px-1.5 py-3 text-center leading-tight break-words">Em Andamento</th>
                  <th scope="col" className="px-1.5 py-3 text-center leading-tight break-words">Concluídas</th>
                  <th scope="col" className="px-1.5 py-3 text-center leading-tight break-words">Críticas</th>
                  <th scope="col" className="px-2 py-3 text-right leading-tight break-words">Taxa de Resolução</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filtered.map((dept) => {
                  const ratePct = Math.round(dept.resolution_rate);
                  const isHighRate = ratePct >= 70;
                  const isMidRate = ratePct >= 40 && ratePct < 70;

                  return (
                    <tr
                      key={dept.department_id}
                      className="hover:bg-slate-800/50 transition-colors"
                    >
                      {/* Nome do Órgão */}
                      <td className="px-2 py-3.5 sm:px-3">
                        <div className="flex items-center gap-2.5">
                          <div className="p-1.5 rounded-lg bg-slate-800 text-slate-300 border border-slate-700">
                            <IconBuilding size={14} />
                          </div>
                          <div className="min-w-0">
                            <span className="block break-words font-semibold text-white text-xs">
                              {dept.department_name}
                            </span>
                            {dept.email && (
                              <span className="block break-words text-[11px] text-slate-400">
                                {dept.email}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Total */}
                      <td className="px-1.5 py-3.5 whitespace-nowrap text-center">
                        <span className="font-mono text-xs font-bold text-white">
                          {dept.total}
                        </span>
                      </td>

                      {/* Abertas */}
                      <td className="px-1.5 py-3.5 whitespace-nowrap text-center">
                        <span className="font-mono text-xs font-semibold text-amber-300">
                          {dept.aberto}
                        </span>
                      </td>

                      {/* Em Andamento */}
                      <td className="px-1.5 py-3.5 whitespace-nowrap text-center">
                        <span className="font-mono text-xs font-semibold text-sky-300">
                          {dept.em_andamento}
                        </span>
                      </td>

                      {/* Concluídas */}
                      <td className="px-1.5 py-3.5 whitespace-nowrap text-center">
                        <span className="font-mono text-xs font-semibold text-emerald-300">
                          {dept.fechado}
                        </span>
                      </td>

                      {/* Críticas */}
                      <td className="px-1.5 py-3.5 whitespace-nowrap text-center">
                        {dept.critica > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 font-bold text-[11px]">
                            <IconAlertCircle size={12} />
                            {dept.critica}
                          </span>
                        ) : (
                          <span className="text-slate-500 font-mono text-xs">0</span>
                        )}
                      </td>

                      {/* Taxa de Resolução */}
                      <td className="px-2 py-3.5 whitespace-nowrap text-right">
                        <div className="inline-flex items-center gap-2.5 justify-end">
                          <div className="w-20 bg-slate-800 rounded-full h-1.5 overflow-hidden hidden xl:block">
                            <div
                              className={`h-1.5 rounded-full ${
                                isHighRate
                                  ? 'bg-emerald-500'
                                  : isMidRate
                                  ? 'bg-amber-500'
                                  : 'bg-rose-500'
                              }`}
                              style={{ width: `${Math.min(ratePct, 100)}%` }}
                            />
                          </div>
                          <span
                            className={`font-mono text-xs font-bold ${
                              isHighRate
                                ? 'text-emerald-400'
                                : isMidRate
                                ? 'text-amber-400'
                                : 'text-rose-400'
                            }`}
                          >
                            {ratePct}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
