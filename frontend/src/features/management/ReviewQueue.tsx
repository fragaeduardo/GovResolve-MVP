import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { Demand, Department } from '../../types';

export const ReviewQueue: React.FC = () => {
  const [items, setItems] = useState<Demand[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [pending, setPending] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.getReviewQueue(), api.getDepartments()])
      .then(([queue, depts]) => { setItems(queue); setDepartments(depts); })
      .catch(err => setError(err.message || 'Não foi possível consultar a fila de revisão.'))
      .finally(() => setLoading(false));
  }, []);

  const assign = async (protocol: string) => {
    setPending(protocol); setError('');
    try {
      await api.assignReview(protocol, Number(selected[protocol]));
      setItems(previous => previous.filter(item => item.protocol !== protocol));
    } catch (err: any) { setError(err.message || 'Não foi possível encaminhar a demanda.'); }
    finally { setPending(''); }
  };

  return <section className="rounded-2xl bg-slate-900 border border-slate-700 p-5" aria-labelledby="review-queue-title">
    <h2 id="review-queue-title" className="font-semibold text-white">Revisão de encaminhamento</h2>
    <p className="text-xs text-slate-400 mt-1">Solicitações que o cidadão escolheu encaminhar para análise humana da Ouvidoria.</p>
    {error && <p role="alert" className="text-sm text-rose-300 mt-3">{error}</p>}
    {loading ? <p role="status" className="text-sm text-slate-300 mt-4">Consultando fila...</p> : items.length === 0 ? <p className="text-sm text-slate-300 mt-4">Não há protocolos aguardando definição do órgão.</p> : <ul className="mt-4 space-y-4">{items.map(item => <li key={item.protocol} className="rounded-xl border border-slate-700 p-4">
      <p className="text-xs text-slate-400">{item.protocol}</p><h3 className="text-sm font-semibold text-white mt-1">{item.title}</h3><p className="text-sm text-slate-300 mt-2">{item.description}</p>
      <div className="flex flex-wrap gap-3 mt-3 items-end"><div className="flex-1 min-w-52"><label htmlFor={`route-${item.protocol}`} className="block text-xs text-slate-300 mb-1">Órgão responsável</label><select id={`route-${item.protocol}`} value={selected[item.protocol] || ''} onChange={event => setSelected(previous => ({ ...previous, [item.protocol]: event.target.value }))} className="w-full rounded-lg bg-slate-800 border border-slate-600 text-slate-100 p-2 text-sm"><option value="">Selecione o órgão</option>{departments.map(dept => <option key={dept.id} value={dept.id}>{dept.name}</option>)}</select></div><button type="button" disabled={!selected[item.protocol] || !!pending} onClick={() => assign(item.protocol)} className="rounded-lg bg-civic-600 text-white px-4 py-2 text-sm font-semibold disabled:opacity-50">{pending === item.protocol ? 'Encaminhando...' : 'Confirmar encaminhamento'}</button></div>
    </li>)}</ul>}
  </section>;
};
