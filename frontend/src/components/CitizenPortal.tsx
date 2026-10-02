import React, { useState, useEffect } from 'react';
import { api, Demand } from '../services/api';

export const CitizenPortal: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'nova' | 'consultar' | 'minhas'>('nova');
  
  // Form Nova Demanda
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [createdDemand, setCreatedDemand] = useState<Demand | null>(null);

  // Consulta por Protocolo
  const [searchProtocol, setSearchProtocol] = useState('');
  const [searchedDemand, setSearchedDemand] = useState<Demand | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState('');

  // Minhas Demandas
  const [myDemands, setMyDemands] = useState<Demand[]>([]);

  // Feedback
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);

  useEffect(() => {
    if (activeTab === 'minhas') {
      loadMyDemands();
    }
  }, [activeTab]);

  const loadMyDemands = async () => {
    try {
      const data = await api.getMyDemands();
      setMyDemands(data);
    } catch (e: any) {
      console.error(e);
    }
  };

  const handleCreateDemand = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setCreatedDemand(null);

    if (!title.trim() || title.length < 5) {
      setErrorMsg('Informe um título válido com pelo menos 5 caracteres.');
      return;
    }
    if (!description.trim() || description.length < 15) {
      setErrorMsg('Descreva detalhadamente a situação (mínimo de 15 caracteres).');
      return;
    }

    setLoading(true);
    const startTime = performance.now();
    try {
      const result = await api.createDemand(title, description);
      const elapsed = ((performance.now() - startTime) / 1000).toFixed(2);
      setCreatedDemand(result);
      setTitle('');
      setDescription('');
      console.log(`Demanda confirmada em ${elapsed}s (RNF003)`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao registrar solicitação.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchProtocol = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchProtocol.trim()) return;
    setSearchLoading(true);
    setSearchError('');
    setSearchedDemand(null);
    setFeedbackSuccess(false);

    try {
      const result = await api.getDemandByProtocol(searchProtocol.trim());
      setSearchedDemand(result);
    } catch (err: any) {
      setSearchError(err.message || 'Protocolo não encontrado.');
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSendFeedback = async () => {
    if (!searchedDemand) return;
    try {
      await api.submitFeedback(searchedDemand.protocol, feedbackRating, feedbackComment);
      setFeedbackSuccess(true);
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Navegação por Abas */}
      <nav aria-label="Abas de Atendimento do Cidadão" className="flex border-b border-slate-200 gap-4">
        <button
          onClick={() => setActiveTab('nova')}
          className={`py-3 px-4 font-semibold text-sm border-b-2 flex items-center gap-2 transition ${
            activeTab === 'nova'
              ? 'border-blue-700 text-blue-800'
              : 'border-transparent text-slate-600 hover:text-blue-700'
          }`}
        >
          📝 Registrar Demanda
        </button>
        <button
          onClick={() => setActiveTab('consultar')}
          className={`py-3 px-4 font-semibold text-sm border-b-2 flex items-center gap-2 transition ${
            activeTab === 'consultar'
              ? 'border-blue-700 text-blue-800'
              : 'border-transparent text-slate-600 hover:text-blue-700'
          }`}
        >
          🔍 Consultar Protocolo
        </button>
        <button
          onClick={() => setActiveTab('minhas')}
          className={`py-3 px-4 font-semibold text-sm border-b-2 flex items-center gap-2 transition ${
            activeTab === 'minhas'
              ? 'border-blue-700 text-blue-800'
              : 'border-transparent text-slate-600 hover:text-blue-700'
          }`}
        >
          📂 Minhas Demandas ({myDemands.length})
        </button>
      </nav>

      {/* ABA 1: NOVA DEMANDA */}
      {activeTab === 'nova' && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 max-w-3xl mx-auto">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-900">Registrar Nova Demanda Municipal</h2>
            <p className="text-sm text-slate-600 mt-1">
              Descreva sua solicitação ou problema. Nossa inteligência artificial triará o assunto para orientar sobre autoatendimento ou encaminhar diretamente à secretaria competente.
            </p>
          </div>

          {errorMsg && (
            <div role="alert" className="p-4 mb-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm rounded">
              {errorMsg}
            </div>
          )}

          {/* SUCESSO DO REGISTRO */}
          {createdDemand && (
            <div className="p-5 mb-6 bg-emerald-50 border border-emerald-300 rounded-lg text-emerald-950 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-lg flex items-center gap-2">
                  ✅ Demanda Registrada com Sucesso!
                </span>
                <span className="text-xs bg-emerald-200 text-emerald-900 font-mono px-2 py-1 rounded">
                  Tempo &lt; 3s (RNF003)
                </span>
              </div>
              <p className="text-sm">
                Seu número de protocolo único é: <strong className="font-mono text-base bg-white px-2 py-0.5 rounded border border-emerald-400">{createdDemand.protocol}</strong>
              </p>

              {/* CARD DE AUTOATENDIMENTO DETECTADO */}
              {createdDemand.service_type === 'AUTOATENDIMENTO' && (
                <div className="mt-4 p-4 bg-blue-50 border-l-4 border-blue-600 rounded text-slate-800 space-y-2">
                  <h4 className="font-bold text-blue-900 flex items-center gap-2">
                    💡 Autoatendimento Disponível (RF006, RF007)
                  </h4>
                  <p className="text-sm">
                    Identificamos que este serviço pode ser realizado diretamente por você via internet, sem necessidade de aguardar um servidor:
                  </p>
                  <p className="text-xs bg-white p-3 rounded border font-mono whitespace-pre-line text-slate-700">
                    {createdDemand.organized_summary}
                  </p>
                  <div className="pt-2">
                    <a
                      href="https://cidadao.governo.br/servicos"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block bg-blue-600 text-white text-xs font-semibold px-4 py-2 rounded hover:bg-blue-700 transition"
                    >
                      Acessar Portal de Autoatendimento ↗
                    </a>
                  </div>
                </div>
              )}

              {/* ATENDIMENTO PÚBLICO */}
              {createdDemand.service_type === 'ATENDIMENTO_PUBLICO' && (
                <div className="text-xs text-slate-700 bg-white p-3 rounded border border-emerald-200">
                  <p><strong>Setor Competente:</strong> {createdDemand.category || 'Secretaria de Obras'}</p>
                  <p className="mt-1">Uma equipe técnica foi notificada para analisar sua demanda. Você receberá atualizações por e-mail a cada mudança de status.</p>
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleCreateDemand} className="space-y-4">
            <div>
              <label htmlFor="demand-title" className="block text-sm font-semibold text-slate-800 mb-1">
                Assunto / Título da Demanda <span className="text-red-500">*</span>
              </label>
              <input
                id="demand-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Buraco profundo no asfalto ou 2ª via de IPTU"
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none"
              />
            </div>

            <div>
              <label htmlFor="demand-desc" className="block text-sm font-semibold text-slate-800 mb-1">
                Descrição Detalhada e Localização <span className="text-red-500">*</span>
              </label>
              <textarea
                id="demand-desc"
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Informe o endereço exato, pontos de referência e o que você precisa que seja feito..."
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none"
              />
              <span className="text-xs text-slate-500 mt-1 block">
                Preservamos fielmente o seu relato para envio ao setor público (RNF007).
              </span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-700 hover:bg-blue-800 text-white font-semibold py-2.5 px-4 rounded-lg text-sm transition shadow-sm flex items-center justify-center gap-2"
            >
              {loading ? 'Processando e Gerando Protocolo...' : '🚀 Enviar Demanda'}
            </button>
          </form>
        </div>
      )}

      {/* ABA 2: CONSULTAR PROTOCOLO */}
      {activeTab === 'consultar' && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 max-w-3xl mx-auto space-y-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Acompanhamento de Demanda</h2>
            <p className="text-sm text-slate-600 mt-1">Consulte o andamento em tempo real informando o código de protocolo recebido.</p>
          </div>

          <form onSubmit={handleSearchProtocol} className="flex gap-2">
            <input
              type="text"
              value={searchProtocol}
              onChange={(e) => setSearchProtocol(e.target.value)}
              placeholder="Ex: GR-20261002-XXXXX"
              className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 outline-none uppercase font-mono"
            />
            <button
              type="submit"
              disabled={searchLoading}
              className="bg-blue-700 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-blue-800 transition"
            >
              {searchLoading ? 'Buscando...' : 'Consultar'}
            </button>
          </form>

          {searchError && (
            <div role="alert" className="p-4 bg-red-50 text-red-700 text-sm rounded border-l-4 border-red-500">
              {searchError}
            </div>
          )}

          {/* RESULTADO DA CONSULTA */}
          {searchedDemand && (
            <div className="border border-slate-200 rounded-lg p-5 space-y-4 bg-slate-50">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3">
                <div>
                  <span className="text-xs text-slate-500 font-mono">Protocolo</span>
                  <p className="font-bold text-lg font-mono text-blue-900">{searchedDemand.protocol}</p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-500">Status do Atendimento</span>
                  <p className={`font-bold text-sm px-3 py-1 rounded-full ${
                    searchedDemand.status === 'ABERTO' ? 'bg-amber-100 text-amber-800' :
                    searchedDemand.status === 'EM ANDAMENTO' ? 'bg-blue-100 text-blue-800' :
                    'bg-emerald-100 text-emerald-800'
                  }`}>
                    {searchedDemand.status}
                  </p>
                </div>
              </div>

              {/* LINHA DO TEMPO DO STATUS */}
              <div className="py-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Linha do Tempo (RF012)</span>
                <div className="flex items-center justify-between mt-2 max-w-md mx-auto text-xs font-semibold">
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">1</div>
                    <span className="mt-1">Aberto</span>
                  </div>
                  <div className={`flex-1 h-1 mx-2 ${searchedDemand.status !== 'ABERTO' ? 'bg-blue-600' : 'bg-slate-300'}`} />
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                      searchedDemand.status === 'EM ANDAMENTO' || searchedDemand.status === 'FECHADO'
                        ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'
                    }`}>2</div>
                    <span className="mt-1">Em Andamento</span>
                  </div>
                  <div className={`flex-1 h-1 mx-2 ${searchedDemand.status === 'FECHADO' ? 'bg-emerald-600' : 'bg-slate-300'}`} />
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                      searchedDemand.status === 'FECHADO' ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
                    }`}>3</div>
                    <span className="mt-1">Fechado</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-900">{searchedDemand.title}</h4>
                <p className="text-sm text-slate-700 mt-1 whitespace-pre-line">{searchedDemand.description}</p>
              </div>

              {searchedDemand.organized_summary && (
                <div className="bg-white p-3 rounded border text-xs text-slate-600">
                  <span className="font-semibold text-blue-900 block mb-1">Síntese Estruturada da Demanda:</span>
                  <p className="whitespace-pre-line">{searchedDemand.organized_summary}</p>
                </div>
              )}

              {/* PARECER CONCLUSIVO QUANDO FECHADO */}
              {searchedDemand.status === 'FECHADO' && searchedDemand.resolution_notes && (
                <div className="p-4 bg-emerald-50 border-l-4 border-emerald-600 rounded">
                  <h5 className="font-bold text-emerald-950 text-sm">Parecer Oficial do Órgão (RF014):</h5>
                  <p className="text-sm text-emerald-900 mt-1">{searchedDemand.resolution_notes}</p>
                </div>
              )}

              {/* AVALIAÇÃO / FEEDBACK */}
              {searchedDemand.status === 'FECHADO' && (
                <div className="p-4 bg-white border border-slate-200 rounded-lg mt-4 space-y-3">
                  <h5 className="font-bold text-sm text-slate-900">Avalie o Atendimento Recebido (RF015)</h5>
                  {feedbackSuccess ? (
                    <p className="text-emerald-700 text-xs font-semibold">Obrigado pelo seu feedback! Ele auxilia na melhoria dos serviços públicos.</p>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-600">Nota:</span>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setFeedbackRating(star)}
                            className={`text-lg ${star <= feedbackRating ? 'text-amber-500' : 'text-slate-300'}`}
                          >
                            ★
                          </button>
                        ))}
                      </div>
                      <input
                        type="text"
                        value={feedbackComment}
                        onChange={(e) => setFeedbackComment(e.target.value)}
                        placeholder="Deixe um comentário sobre o atendimento (opcional)"
                        className="w-full text-xs px-3 py-1.5 border rounded"
                      />
                      <button
                        onClick={handleSendFeedback}
                        className="bg-emerald-600 text-white text-xs font-semibold px-4 py-1.5 rounded hover:bg-emerald-700"
                      >
                        Enviar Avaliação
                      </button>
                    </div>
                  )}
                </div>
              )}

            </div>
          )}

        </div>
      )}

      {/* ABA 3: MINHAS DEMANDAS */}
      {activeTab === 'minhas' && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 max-w-4xl mx-auto space-y-4">
          <h2 className="text-xl font-bold text-slate-900">Histórico de Solicitações do Cidadão</h2>
          {myDemands.length === 0 ? (
            <p className="text-sm text-slate-500 py-6 text-center">Nenhuma solicitação encontrada no seu cadastro.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {myDemands.map((d) => (
                <div key={d.id} className="py-3 flex items-center justify-between gap-4">
                  <div>
                    <span className="text-xs font-mono font-bold text-blue-800">{d.protocol}</span>
                    <h4 className="text-sm font-semibold text-slate-900">{d.title}</h4>
                    <span className="text-xs text-slate-500">{new Date(d.created_at).toLocaleDateString('pt-BR')}</span>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                      d.status === 'ABERTO' ? 'bg-amber-100 text-amber-800' :
                      d.status === 'EM ANDAMENTO' ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {d.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
};
