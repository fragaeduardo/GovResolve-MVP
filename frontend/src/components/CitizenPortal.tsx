import React, { useState, useEffect, useRef } from 'react';
import { api, Demand, ChatMessageItem, ChatAgentResult } from '../services/api';
import {
  IconCivicSeal,
  IconUser,
  IconSend,
  IconBuilding,
  IconCheckCircle,
  IconClock,
  IconAlertCircle,
  IconSearch,
  IconCopy,
  IconCheck,
  IconExternalLink,
  IconStar,
  IconFileText,
  IconArrowRight,
  IconFileCheck,
  IconCertificate,
  IconEye
} from './Icons';

export const CitizenPortal: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'chat' | 'consultar' | 'minhas'>('chat');

  // Estado do Balcão Virtual de Triagem
  const [messages, setMessages] = useState<ChatMessageItem[]>([
    {
      role: 'assistant',
      content: 'Bem-vindo ao Balcão Virtual de Zeladoria e Ouvidoria Municipal. Descreva a ocorrência ou necessidade de serviço público na sua região para realizarmos a triagem e o encaminhamento ao órgão competente.'
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [sessionId, setSessionId] = useState<string>('');
  const [isTyping, setIsTyping] = useState(false);
  const [currentProposal, setCurrentProposal] = useState<ChatAgentResult | null>(null);
  const [registeredDemand, setRegisteredDemand] = useState<Demand | null>(null);
  const [registering, setRegistering] = useState(false);
  const [copiedProtocol, setCopiedProtocol] = useState(false);

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

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping, currentProposal]);

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

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputMessage;
    if (!text.trim() || isTyping) return;

    const newMessages: ChatMessageItem[] = [...messages, { role: 'user', content: text.trim() }];
    setMessages(newMessages);
    setInputMessage('');
    setIsTyping(true);
    setCurrentProposal(null);

    try {
      const response = await api.sendChatMessage(newMessages, sessionId);
      if (response.session_id) {
        setSessionId(response.session_id);
      }
      setMessages([...newMessages, { role: 'assistant', content: response.reply }]);
      if (response.ready_to_register || response.service_type === 'AUTOATENDIMENTO') {
        setCurrentProposal(response);
      }
    } catch (err: any) {
      setMessages([
        ...newMessages,
        {
          role: 'assistant',
          content: 'Desculpe, ocorreu uma instabilidade momentânea na conexão. Por favor, tente novamente em instantes.'
        }
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleConfirmRegister = async () => {
    if (!currentProposal) return;
    setRegistering(true);
    try {
      const title = currentProposal.suggested_title;
      const desc = currentProposal.suggested_description;
      const formalization = await api.formalizeChatDemand(sessionId, title, desc);

      setRegisteredDemand(formalization.demand);
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: formalization.reply }
      ]);
      setMyDemands(prev => [formalization.demand, ...prev.filter(d => d.id !== formalization.demand.id)]);
      setCurrentProposal(null);
    } catch (err: any) {
      alert(err.message || 'Erro ao formalizar solicitação.');
    } finally {
      setRegistering(false);
    }
  };

  const handleResetChat = () => {
    setMessages([
      {
        role: 'assistant',
        content: 'Bem-vindo ao Balcão Virtual de Zeladoria e Ouvidoria Municipal. Descreva a ocorrência ou necessidade de serviço público na sua região para realizarmos a triagem e o encaminhamento ao órgão competente.'
      }
    ]);
    setRegisteredDemand(null);
    setCurrentProposal(null);
    setSessionId('');
  };

  const handleCopyProtocol = (proto: string) => {
    navigator.clipboard.writeText(proto);
    setCopiedProtocol(true);
    setTimeout(() => setCopiedProtocol(false), 2000);
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
      setSearchError(err.message || 'Demanda não encontrada para o protocolo informado.');
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

  const frequentServices = [
    { label: 'Pavimentação e Asfalto', dept: 'SEINFRA', query: 'Buraco ou asfalto danificado na rua' },
    { label: 'Limpeza Urbana e Poda', dept: 'COMURG', query: 'Lixo acumulado ou poda de árvores' },
    { label: 'Atenção Básica e UBS', dept: 'SMS', query: 'Falta de remédio ou posto de saúde' },
    { label: 'Semáforos e Sinalização', dept: 'SMM', query: 'Semáforo apagado ou sinalização' },
    { label: 'Saneamento e Esgoto', dept: 'SANEAGO', query: 'Vazamento de água tratada ou esgoto' },
    { label: 'Segunda Via de IPTU', dept: 'SEFIN', query: 'Segunda via de IPTU ou certidão' }
  ];

  return (
    <div className="h-full min-h-0 flex flex-col md:flex-row gap-3 sm:gap-4 overflow-hidden">
      
      {/* Navegação Lateral Institucional (Adaptável para mobile) */}
      <aside
        aria-label="Balcão de Serviços ao Cidadão"
        className="w-full md:w-64 lg:w-72 shrink-0 bg-white dark:bg-[#111827] rounded-xl border border-slate-200 dark:border-slate-800 p-2 sm:p-3 shadow-xs flex flex-row md:flex-col justify-between overflow-x-auto md:overflow-y-auto portal-sidebar"
      >
        <div className="flex flex-row md:flex-col gap-1.5 w-full">
          <div className="hidden md:flex flex-col gap-1 px-3 py-2 border-b border-slate-100 dark:border-slate-800/80 mb-1">
            <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider font-mono">
              Balcão do Cidadão
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400">
              Canal Oficial 156 • Lei 13.460/2017
            </span>
          </div>

          <button
            type="button"
            onClick={() => setActiveTab('chat')}
            className={`w-full py-2.5 px-3 rounded-lg font-medium text-xs sm:text-sm flex items-center gap-2.5 transition text-left shrink-0 tab-btn ${
              activeTab === 'chat'
                ? 'bg-civic-700 text-white shadow-xs font-semibold tab-btn-active'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1a263c] hover:text-slate-900 dark:hover:text-white tab-btn-inactive'
            }`}
          >
            <IconFileCheck size={17} className="shrink-0" />
            <span className="truncate">Triagem e Autuação</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('consultar')}
            className={`w-full py-2.5 px-3 rounded-lg font-medium text-xs sm:text-sm flex items-center gap-2.5 transition text-left shrink-0 tab-btn ${
              activeTab === 'consultar'
                ? 'bg-civic-700 text-white shadow-xs font-semibold tab-btn-active'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1a263c] hover:text-slate-900 dark:hover:text-white tab-btn-inactive'
            }`}
          >
            <IconSearch size={17} className="shrink-0" />
            <span className="truncate">Consultar Protocolo</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('minhas')}
            className={`w-full py-2.5 px-3 rounded-lg font-medium text-xs sm:text-sm flex items-center justify-between gap-2.5 transition text-left shrink-0 tab-btn ${
              activeTab === 'minhas'
                ? 'bg-civic-700 text-white shadow-xs font-semibold tab-btn-active'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1a263c] hover:text-slate-900 dark:hover:text-white tab-btn-inactive'
            }`}
          >
            <div className="flex items-center gap-2.5 truncate">
              <IconFileText size={17} className="shrink-0" />
              <span className="truncate">Minhas Solicitações</span>
            </div>
            <span className={`text-[11px] font-mono px-2 py-0.5 rounded shrink-0 font-semibold ${
              activeTab === 'minhas'
                ? 'bg-civic-800 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}>
              {myDemands.length}
            </span>
          </button>
        </div>

        {/* Rodapé Informativo Institucional */}
        <div className="hidden md:block pt-3 border-t border-slate-100 dark:border-slate-800/80 text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
          <p className="font-semibold text-slate-700 dark:text-slate-300">Ouvidoria Geral do Município</p>
          <p className="leading-tight text-slate-500 dark:text-slate-400">
            Encaminhamento direto e autuação tempestiva com acompanhamento do SLA de atendimento.
          </p>
        </div>
      </aside>

      {/* Conteúdo Central/Direito Adaptativo */}
      <section className="flex-1 h-full min-min-0 overflow-hidden flex flex-col portal-content">

        {/* ABA 1: TRIAGEM E AUTUAÇÃO */}
        {activeTab === 'chat' && (
          <div className="bg-white dark:bg-[#111827] rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col h-full min-h-0 overflow-hidden chat-container">
            
            {/* Header Oficial do Balcão Virtual */}
            <div className="px-4 sm:px-5 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-[#0c121e]/80 flex items-center justify-between chat-header shrink-0">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-lg bg-civic-800 text-civic-200 flex items-center justify-center shadow-xs shrink-0 border border-civic-700/80">
                  <IconCivicSeal size={18} />
                </div>
                <div>
                  <h2 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 font-sans chat-header-title">
                    Balcão Virtual de Zeladoria Urbana
                  </h2>
                  <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 chat-header-subtitle">
                    Triagem Administrativa Oficial • Ouvidoria Geral do Município
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/90 px-2.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 shrink-0">
                  Canal Oficial Ativo
                </span>
              </div>
            </div>

            {/* Janela de Diálogo e Despacho */}
            <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-5 space-y-4 bg-slate-50/30 dark:bg-[#0b101b] chat-messages">
              
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex gap-3 max-w-[88%] ${
                    msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''
                  }`}
                >
                  <div
                    className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 text-xs ${
                      msg.role === 'user'
                        ? 'bg-civic-700 text-white'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {msg.role === 'user' ? <IconUser size={14} /> : <IconCivicSeal size={14} />}
                  </div>
                  <div
                    className={`p-3.5 rounded-xl text-xs sm:text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-civic-700 text-white rounded-tr-xs'
                        : 'bg-white dark:bg-[#131f33] border border-slate-200/90 dark:border-slate-700/80 text-slate-800 dark:text-slate-200 rounded-tl-xs shadow-xs'
                    }`}
                  >
                    <p className="whitespace-pre-line">{msg.content}</p>
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex gap-3 max-w-[85%]">
                  <div className="h-7 w-7 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0">
                    <IconCivicSeal size={14} />
                  </div>
                  <div className="p-3 bg-white dark:bg-[#131f33] border border-slate-200/90 dark:border-slate-700/80 rounded-xl rounded-tl-xs shadow-xs flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-500 animate-bounce"></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-500 animate-bounce [animation-delay:0.2s]"></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-500 animate-bounce [animation-delay:0.4s]"></span>
                  </div>
                </div>
              )}

              {/* MINUTA DE AUTUAÇÃO ADMINISTRATIVA (HUMAN IN THE LOOP) */}
              {currentProposal && currentProposal.ready_to_register && (
                <div className="p-4 sm:p-5 bg-white dark:bg-[#101b2d] border-2 border-civic-600/80 dark:border-civic-500/70 rounded-xl shadow-md space-y-4 ml-6 sm:ml-10 proposal-card">
                  
                  {/* Cabeçalho da Minuta */}
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <IconFileCheck size={18} className="text-civic-600 dark:text-civic-400" />
                      <div>
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 font-sans">
                          Minuta de Autuação Administrativa
                        </h4>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                          Revisão e confirmação cidadã antes da geração do protocolo oficial
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono uppercase bg-civic-100 dark:bg-civic-950 text-civic-800 dark:text-civic-300 px-2 py-0.5 rounded font-semibold border border-civic-300 dark:border-civic-800">
                      Pronta para Autuação
                    </span>
                  </div>

                  {/* Tabela de Enquadramento Oficial */}
                  <div className="bg-slate-50 dark:bg-[#0b1320] rounded-lg border border-slate-200 dark:border-slate-800 divide-y divide-slate-200 dark:border-slate-800 text-xs">
                    <div className="p-3 grid grid-cols-1 sm:grid-cols-3 gap-1">
                      <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase font-mono">
                        Órgão Competente:
                      </span>
                      <span className="sm:col-span-2 font-bold text-slate-900 dark:text-slate-100">
                        {currentProposal.department_name}
                      </span>
                    </div>

                    <div className="p-3 grid grid-cols-1 sm:grid-cols-3 gap-1">
                      <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase font-mono">
                        Categoria / Setor:
                      </span>
                      <span className="sm:col-span-2 font-medium text-slate-800 dark:text-slate-200">
                        {currentProposal.category || 'Zeladoria Geral'}
                      </span>
                    </div>

                    <div className="p-3 grid grid-cols-1 sm:grid-cols-3 gap-1">
                      <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase font-mono">
                        Assunto Proposto:
                      </span>
                      <span className="sm:col-span-2 font-semibold text-slate-900 dark:text-slate-100">
                        {currentProposal.suggested_title}
                      </span>
                    </div>

                    <div className="p-3 grid grid-cols-1 sm:grid-cols-3 gap-1">
                      <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase font-mono">
                        Síntese Factual:
                      </span>
                      <span className="sm:col-span-2 text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed">
                        {currentProposal.suggested_description}
                      </span>
                    </div>
                  </div>

                  {/* Ação de Formalização */}
                  <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-200 dark:border-slate-800">
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                      Geração imediata de protocolo rastreável (RNF003)
                    </span>
                    <button
                      type="button"
                      onClick={handleConfirmRegister}
                      disabled={registering}
                      className="w-full sm:w-auto bg-civic-700 hover:bg-civic-800 text-white text-xs font-bold px-4 py-2.5 rounded-lg transition flex items-center justify-center gap-2 shadow-xs"
                    >
                      <IconCertificate size={15} />
                      <span>{registering ? 'Autuando no Sistema...' : 'Confirmar e Autuar Demanda'}</span>
                      <IconArrowRight size={14} />
                    </button>
                  </div>
                </div>
              )}

              {/* AUTOATENDIMENTO DETECTADO */}
              {currentProposal && currentProposal.service_type === 'AUTOATENDIMENTO' && (
                <div className="p-4 sm:p-5 bg-white dark:bg-[#111f26] border border-emerald-300 dark:border-emerald-800/80 rounded-xl shadow-xs space-y-3 ml-6 sm:ml-10 self-service-card">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-900 dark:text-emerald-300 border-b border-emerald-100 dark:border-emerald-900/50 pb-2">
                    <IconCheckCircle size={16} className="text-emerald-600 dark:text-emerald-400" />
                    <span>Autoatendimento Digital Disponível</span>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed">
                    {currentProposal.self_service_instructions}
                  </p>
                  {currentProposal.self_service_link && (
                    <a
                      href={currentProposal.self_service_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold px-3.5 py-2 rounded-lg transition"
                    >
                      <span>Acessar Portal Oficial de Autoatendimento</span>
                      <IconExternalLink size={14} />
                    </a>
                  )}
                </div>
              )}

              {/* COMPROVANTE DIGITAL DE AUTUAÇÃO (DEMANDA FORMALIZADA) */}
              {registeredDemand && (
                <div className="p-4 sm:p-5 bg-white dark:bg-[#0f1d1a] border-2 border-emerald-500/80 rounded-xl space-y-4 ml-6 sm:ml-10 protocol-card shadow-md">
                  
                  {/* Cabeçalho do Comprovante */}
                  <div className="flex items-center justify-between border-b border-emerald-200 dark:border-emerald-900/60 pb-3">
                    <div className="flex items-center gap-2">
                      <IconCertificate size={18} className="text-emerald-600 dark:text-emerald-400" />
                      <div>
                        <h4 className="text-xs sm:text-sm font-bold text-emerald-950 dark:text-emerald-200 font-sans">
                          Comprovante Digital de Autuação
                        </h4>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                          Demanda registrada com sucesso no sistema da Ouvidoria Municipal
                        </span>
                      </div>
                    </div>
                    <span className="text-[11px] font-mono bg-emerald-100 dark:bg-emerald-950/80 text-emerald-900 dark:text-emerald-200 px-2.5 py-0.5 rounded font-bold border border-emerald-300 dark:border-emerald-800">
                      {registeredDemand.status}
                    </span>
                  </div>

                  {/* Selo Monospace do Protocolo */}
                  <div className="p-3.5 bg-slate-50 dark:bg-[#0a1412] rounded-lg border border-slate-200 dark:border-emerald-900/60 flex items-center justify-between protocol-num-box">
                    <div>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-mono block">
                        Número Oficial do Protocolo
                      </span>
                      <span className="font-mono font-bold text-base sm:text-lg text-slate-900 dark:text-emerald-300">
                        {registeredDemand.protocol}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopyProtocol(registeredDemand.protocol)}
                      className="text-xs font-semibold px-3 py-1.5 rounded border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 transition flex items-center gap-1.5 text-slate-700 dark:text-slate-200 shadow-2xs"
                    >
                      {copiedProtocol ? <IconCheck size={14} className="text-emerald-600 dark:text-emerald-400" /> : <IconCopy size={14} />}
                      <span>{copiedProtocol ? 'Copiado' : 'Copiar Protocolo'}</span>
                    </button>
                  </div>

                  {/* Informações de Gravidade & SLA Operacional */}
                  {registeredDemand.severity && (
                    <div className="p-3 bg-slate-50 dark:bg-[#0a1412] rounded-lg border border-slate-200 dark:border-emerald-900/50 space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-mono font-semibold">
                          Classificação de Gravidade:
                        </span>
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded border font-mono ${
                          registeredDemand.severity === 'CRITICA' ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-800' :
                          registeredDemand.severity === 'ALTA' ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800' :
                          registeredDemand.severity === 'MEDIA' ? 'bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-800' :
                          'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                        }`}>
                          {registeredDemand.severity}
                        </span>
                      </div>
                      {registeredDemand.severity_justification && (
                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                          {registeredDemand.severity_justification}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Linha Administrativa de Tramitação */}
                  <div className="p-3 bg-slate-50 dark:bg-[#0a1412] rounded-lg border border-slate-200 dark:border-emerald-900/50 space-y-2">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-mono font-semibold block">
                      Fluxo de Atendimento Municipal
                    </span>
                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="p-2 bg-emerald-50 dark:bg-emerald-950/60 rounded border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 font-semibold flex flex-col items-center">
                        <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-mono uppercase">Etapa 1</span>
                        <span>Autuado</span>
                      </div>
                      <div className="p-2 bg-slate-100 dark:bg-slate-800/60 rounded border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 flex flex-col items-center">
                        <span className="text-[9px] text-slate-400 dark:text-slate-500 font-mono uppercase">Etapa 2</span>
                        <span>Em Execução</span>
                      </div>
                      <div className="p-2 bg-slate-100 dark:bg-slate-800/60 rounded border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 flex flex-col items-center">
                        <span className="text-[9px] text-slate-400 dark:text-slate-500 font-mono uppercase">Etapa 3</span>
                        <span>Conclusão / Parecer</span>
                      </div>
                    </div>
                  </div>

                  {/* Ações Finais */}
                  <div className="pt-2 flex items-center justify-between border-t border-emerald-200 dark:border-emerald-900/60">
                    <button
                      type="button"
                      onClick={() => {
                        setSearchProtocol(registeredDemand.protocol);
                        setActiveTab('consultar');
                        api.getDemandByProtocol(registeredDemand.protocol).then(setSearchedDemand);
                      }}
                      className="text-xs text-civic-700 dark:text-civic-300 hover:underline font-semibold flex items-center gap-1.5"
                    >
                      <IconSearch size={14} />
                      <span>Consultar Tramitação Completa</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleResetChat}
                      className="text-xs text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-medium px-3 py-1.5 rounded border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                    >
                      Nova Solicitação
                    </button>
                  </div>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            {/* Catálogo de Serviços Mais Frequentes */}
            <div className="px-3 py-2 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-[#0c121e]/90 shrink-0">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-[10px] uppercase font-mono font-semibold text-slate-500 dark:text-slate-400">
                  Acesso Rápido por Secretaria:
                </span>
              </div>
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-0.5">
                {frequentServices.map((srv, sIdx) => (
                  <button
                    key={sIdx}
                    type="button"
                    onClick={() => handleSendMessage(srv.query)}
                    className="text-xs whitespace-nowrap bg-white dark:bg-[#152238] hover:bg-slate-100 dark:hover:bg-[#1a2d4b] border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 px-2.5 py-1.5 rounded-lg transition shadow-2xs flex items-center gap-1.5 shrink-0"
                  >
                    <span className="font-semibold text-slate-800 dark:text-slate-100">{srv.label}</span>
                    <span className="text-[10px] font-mono text-civic-700 dark:text-civic-300 bg-civic-50 dark:bg-civic-950 px-1 py-0.2 rounded border border-civic-200 dark:border-civic-800">
                      {srv.dept}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Caixa de Entrada de Texto do Cidadão */}
            <div className="p-3 sm:p-3.5 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] flex items-center gap-2 chat-input-container shrink-0">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Descreva a ocorrência, local e necessidade na sua região..."
                className="flex-1 px-4 py-2.5 bg-slate-50 dark:bg-[#131d2e] border border-slate-200 dark:border-slate-700 rounded-lg text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:ring-2 focus:ring-civic-500 dark:focus:ring-civic-400 focus:bg-white dark:focus:bg-[#172338] transition font-sans chat-input-field"
              />
              <button
                type="button"
                onClick={() => handleSendMessage()}
                disabled={!inputMessage.trim() || isTyping}
                className="bg-civic-700 hover:bg-civic-800 disabled:opacity-50 text-white p-2.5 rounded-lg transition shrink-0 shadow-xs chat-send-btn"
                aria-label="Enviar relato"
              >
                <IconSend size={18} />
              </button>
            </div>

          </div>
        )}

        {/* ABA 2: CONSULTAR PROTOCOLO */}
        {activeTab === 'consultar' && (
          <div className="h-full min-h-0 overflow-y-auto pr-1">
            <div className="max-w-3xl mx-auto space-y-5">
              <div className="bg-white dark:bg-[#111827] rounded-xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-4">
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 font-sans">
                    Consulta Pública de Protocolo Administrativo
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Acompanhamento público e transparente de solicitações perante os órgãos municipais.
                  </p>
                </div>

                <form onSubmit={handleSearchProtocol} className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={searchProtocol}
                      onChange={(e) => setSearchProtocol(e.target.value)}
                      placeholder="GR-YYYYMMDD-XXXXX"
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-[#131d2e] border border-slate-200 dark:border-slate-700 rounded-lg text-xs sm:text-sm font-mono uppercase tracking-wider text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:ring-2 focus:ring-civic-500 dark:focus:ring-civic-400 focus:bg-white dark:focus:bg-[#172338] transition"
                    />
                    <div className="absolute left-3 top-3 text-slate-400 dark:text-slate-500">
                      <IconSearch size={16} />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={searchLoading}
                    className="bg-slate-900 hover:bg-slate-800 dark:bg-civic-700 dark:hover:bg-civic-800 text-white px-5 py-2.5 rounded-lg text-xs font-bold transition shadow-xs"
                  >
                    {searchLoading ? 'Localizando...' : 'Consultar'}
                  </button>
                </form>

                {searchError && (
                  <div role="alert" className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-lg text-xs text-rose-800 dark:text-rose-300 flex items-center gap-2">
                    <IconAlertCircle size={16} className="text-rose-600 dark:text-rose-400 shrink-0" />
                    <span>{searchError}</span>
                  </div>
                )}

                {/* DETALHES DA DEMANDA CONSULTADA */}
                {searchedDemand && (
                  <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4 bg-slate-50/50 dark:bg-[#0c121e]/60 mt-4">
                    
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
                      <div>
                        <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 uppercase">
                          Protocolo Oficial
                        </span>
                        <p className="font-mono font-bold text-base sm:text-lg text-slate-900 dark:text-slate-100">
                          {searchedDemand.protocol}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-3">
                        {searchedDemand.severity && (
                          <div className="text-right">
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-mono">
                              Gravidade
                            </span>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold font-mono border ${
                              searchedDemand.severity === 'CRITICA' ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-800' :
                              searchedDemand.severity === 'ALTA' ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800' :
                              searchedDemand.severity === 'MEDIA' ? 'bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-800' :
                              'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                            }`}>
                              {searchedDemand.severity}
                            </span>
                          </div>
                        )}
                        <div className="text-right">
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-mono">
                            Situação
                          </span>
                          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded font-mono text-xs font-bold ${
                            searchedDemand.status === 'ABERTO' ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800' :
                            searchedDemand.status === 'EM ANDAMENTO' ? 'bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-800' :
                            'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                          }`}>
                            {searchedDemand.status}
                          </span>
                        </div>
                      </div>
                    </div>

                    {searchedDemand.severity_justification && (
                      <div className="bg-white dark:bg-[#131d2e] p-3.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 space-y-1">
                        <span className="text-[10px] font-bold uppercase text-slate-700 dark:text-slate-300 block font-mono">
                          Classificação de Risco e Gravidade:
                        </span>
                        <p className="leading-relaxed text-slate-600 dark:text-slate-300">
                          {searchedDemand.severity_justification}
                        </p>
                      </div>
                    )}

                    {/* Linha Administrativa de Andamento */}
                    <div className="py-2 demand-stepper">
                      <div className="flex items-center justify-between max-w-md mx-auto text-xs">
                        <div className="flex flex-col items-center stepper-step">
                          <div className="w-7 h-7 rounded bg-civic-700 text-white flex items-center justify-center font-bold text-xs font-mono">1</div>
                          <span className="mt-1.5 font-semibold text-slate-700 dark:text-slate-300">Autuado</span>
                        </div>
                        <div className={`flex-1 h-0.5 mx-2 ${searchedDemand.status !== 'ABERTO' ? 'bg-civic-700' : 'bg-slate-200 dark:bg-slate-700'}`} />
                        <div className="flex flex-col items-center stepper-step">
                          <div className={`w-7 h-7 rounded flex items-center justify-center font-bold text-xs font-mono ${
                            searchedDemand.status === 'EM ANDAMENTO' || searchedDemand.status === 'FECHADO'
                              ? 'bg-civic-700 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                          }`}>2</div>
                          <span className="mt-1.5 font-semibold text-slate-700 dark:text-slate-300">Em Execução</span>
                        </div>
                        <div className={`flex-1 h-0.5 mx-2 ${searchedDemand.status === 'FECHADO' ? 'bg-emerald-600' : 'bg-slate-200 dark:bg-slate-700'}`} />
                        <div className="flex flex-col items-center stepper-step">
                          <div className={`w-7 h-7 rounded flex items-center justify-center font-bold text-xs font-mono ${
                            searchedDemand.status === 'FECHADO' ? 'bg-emerald-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                          }`}>3</div>
                          <span className="mt-1.5 font-semibold text-slate-700 dark:text-slate-300">Concluído</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white dark:bg-[#131d2e] p-4 rounded-lg border border-slate-200 dark:border-slate-700 space-y-1.5">
                      <span className="text-[10px] font-mono font-semibold uppercase text-slate-500 dark:text-slate-400">
                        Objeto Autuado
                      </span>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">{searchedDemand.title}</h4>
                      <p className="text-xs text-slate-600 dark:text-slate-300 whitespace-pre-line leading-relaxed">{searchedDemand.description}</p>
                    </div>

                    {searchedDemand.organized_summary && (
                      <div className="bg-white dark:bg-[#131d2e] p-4 rounded-lg border border-slate-200 dark:border-slate-700 space-y-1 text-xs text-slate-700 dark:text-slate-300">
                        <span className="text-[10px] font-mono font-semibold uppercase text-civic-700 dark:text-civic-300 block">
                          Síntese Factual dos Fatos
                        </span>
                        <p className="whitespace-pre-line leading-relaxed">{searchedDemand.organized_summary}</p>
                      </div>
                    )}

                    {/* PARECER CONCLUSIVO SE FECHADO */}
                    {searchedDemand.status === 'FECHADO' && searchedDemand.resolution_notes && (
                      <div className="p-4 bg-emerald-50/80 dark:bg-[#0d221c] border border-emerald-300 dark:border-emerald-800 rounded-lg space-y-1">
                        <span className="text-[11px] font-bold text-emerald-950 dark:text-emerald-300 uppercase tracking-wide font-mono">
                          Parecer Conclusivo do Órgão Executor
                        </span>
                        <p className="text-xs text-emerald-900 dark:text-emerald-200 leading-relaxed">{searchedDemand.resolution_notes}</p>
                      </div>
                    )}

                    {/* AVALIAÇÃO DO CIDADÃO */}
                    {searchedDemand.status === 'FECHADO' && (
                      <div className="p-4 bg-white dark:bg-[#131d2e] border border-slate-200 dark:border-slate-700 rounded-lg space-y-3">
                        <h5 className="font-bold text-xs text-slate-900 dark:text-slate-100 uppercase font-mono">
                          Avaliação do Atendimento
                        </h5>
                        {feedbackSuccess ? (
                          <p className="text-emerald-700 dark:text-emerald-400 text-xs font-semibold">
                            Avaliação registrada com sucesso. Agradecemos sua colaboração cidadã.
                          </p>
                        ) : (
                          <div className="space-y-3">
                            <div className="flex items-center gap-1.5">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                  key={star}
                                  type="button"
                                  onClick={() => setFeedbackRating(star)}
                                  className={`p-1 ${star <= feedbackRating ? 'text-amber-500' : 'text-slate-300 dark:text-slate-600'}`}
                                  aria-label={`Nota ${star}`}
                                >
                                  <IconStar size={18} />
                                </button>
                              ))}
                            </div>
                            <input
                              type="text"
                              value={feedbackComment}
                              onChange={(e) => setFeedbackComment(e.target.value)}
                              placeholder="Manifestação sobre a resolução do atendimento (opcional)"
                              className="w-full text-xs px-3 py-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#0c121e] text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 rounded-lg outline-none focus:ring-2 focus:ring-civic-500"
                            />
                            <button
                              type="button"
                              onClick={handleSendFeedback}
                              className="bg-slate-900 hover:bg-slate-800 dark:bg-civic-700 dark:hover:bg-civic-800 text-white text-xs font-bold px-4 py-2 rounded-lg transition"
                            >
                              Registrar Avaliação
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                  </div>
                )}

              </div>
            </div>
          </div>
        )}

        {/* ABA 3: MINHAS DEMANDAS (LIVRO DE REGISTRO DO CIDADÃO) */}
        {activeTab === 'minhas' && (
          <div className="h-full min-h-0 overflow-y-auto pr-1">
            <div className="max-w-4xl mx-auto space-y-4">
              <div className="bg-white dark:bg-[#111827] rounded-xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div>
                    <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 font-sans">
                      Histórico de Solicitações do Cidadão
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Relação de manifestações autuadas em seu CPF para controle e acompanhamento.
                    </p>
                  </div>
                  <span className="font-mono text-xs font-semibold px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded border border-slate-200 dark:border-slate-700">
                    {myDemands.length} Registros
                  </span>
                </div>

                {myDemands.length === 0 ? (
                  <div className="text-center py-10 space-y-2">
                    <IconFileText size={32} className="mx-auto text-slate-300 dark:text-slate-600" />
                    <p className="text-xs text-slate-500 dark:text-slate-400">Nenhuma solicitação autuada para este cadastro.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {myDemands.map((d) => (
                      <div key={d.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50 dark:hover:bg-[#152033]/40 p-2 rounded-lg transition">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-civic-700 dark:text-civic-300 bg-civic-50 dark:bg-civic-950/80 px-2 py-0.5 rounded border border-civic-200 dark:border-civic-900">
                              {d.protocol}
                            </span>
                            <span className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">
                              {new Date(d.created_at).toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                          <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{d.title}</h4>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`text-xs px-2.5 py-1 rounded font-mono font-bold ${
                            d.status === 'ABERTO' ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800' :
                            d.status === 'EM ANDAMENTO' ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800' :
                            'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                          }`}>
                            {d.status}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setSearchProtocol(d.protocol);
                              setActiveTab('consultar');
                              api.getDemandByProtocol(d.protocol).then(setSearchedDemand);
                            }}
                            className="text-xs text-civic-700 dark:text-civic-400 hover:underline font-semibold flex items-center gap-1"
                          >
                            <IconEye size={14} />
                            <span>Ver Ficha</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

      </section>
    </div>
  );
};
