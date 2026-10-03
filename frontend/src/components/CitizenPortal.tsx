import React, { useState, useEffect, useRef } from 'react';
import { api, Demand, ChatMessageItem, ChatAgentResult } from '../services/api';
import {
  IconBot,
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
  IconArrowRight
} from './Icons';

export const CitizenPortal: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'chat' | 'consultar' | 'minhas'>('chat');

  // Estado do Chatbot de Atendimento
  const [messages, setMessages] = useState<ChatMessageItem[]>([
    {
      role: 'assistant',
      content: 'Olá! Sou o assistente virtual de triagem do GovResolve. Em que posso te ajudar hoje? Você pode relatar um problema na sua rua ou solicitar informações sobre serviços municipais.'
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
        content: 'Olá! Sou o assistente virtual de triagem do GovResolve. Em que posso te ajudar hoje? Você pode relatar um problema na sua rua ou solicitar informações sobre serviços municipais.'
      }
    ]);
    setRegisteredDemand(null);
    setCurrentProposal(null);
    setSessionId(undefined);
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

  const quickPills = [
    'Buraco ou asfalto danificado na rua',
    'Lixo acumulado ou poda de árvores',
    'Falta de remédio ou posto de saúde',
    'Semáforo apagado ou sinalização',
    'Vazamento de água tratada ou esgoto',
    'Segunda via de IPTU ou certidão'
  ];

  return (
    <div className="h-full min-h-0 flex flex-col md:flex-row gap-3 sm:gap-4 overflow-hidden">
      
      {/* Navegação Vertical na Esquerda (Adaptável: barra horizontal em telas móveis) */}
      <aside
        aria-label="Menu de Atendimento do Cidadão"
        className="w-full md:w-60 lg:w-68 shrink-0 bg-white dark:bg-[#111827] rounded-xl border border-slate-200 dark:border-slate-800 p-2 sm:p-3 shadow-xs flex flex-row md:flex-col justify-between overflow-x-auto md:overflow-y-auto portal-sidebar"
      >
        <div className="flex flex-row md:flex-col gap-1.5 w-full">
          <div className="hidden md:flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            <span>Menu do Cidadão</span>
          </div>

          <button
            type="button"
            onClick={() => setActiveTab('chat')}
            className={`w-full py-2.5 px-3 rounded-lg font-medium text-xs sm:text-sm flex items-center gap-2.5 transition text-left shrink-0 tab-btn ${
              activeTab === 'chat'
                ? 'bg-blue-600 text-white shadow-xs tab-btn-active'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1a263c] hover:text-slate-900 dark:hover:text-white tab-btn-inactive'
            }`}
          >
            <IconBot size={18} className="shrink-0" />
            <span className="truncate">Atendimento Inteligente</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('consultar')}
            className={`w-full py-2.5 px-3 rounded-lg font-medium text-xs sm:text-sm flex items-center gap-2.5 transition text-left shrink-0 tab-btn ${
              activeTab === 'consultar'
                ? 'bg-blue-600 text-white shadow-xs tab-btn-active'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1a263c] hover:text-slate-900 dark:hover:text-white tab-btn-inactive'
            }`}
          >
            <IconSearch size={18} className="shrink-0" />
            <span className="truncate">Consultar Protocolo</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('minhas')}
            className={`w-full py-2.5 px-3 rounded-lg font-medium text-xs sm:text-sm flex items-center justify-between gap-2.5 transition text-left shrink-0 tab-btn ${
              activeTab === 'minhas'
                ? 'bg-blue-600 text-white shadow-xs tab-btn-active'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1a263c] hover:text-slate-900 dark:hover:text-white tab-btn-inactive'
            }`}
          >
            <div className="flex items-center gap-2.5 truncate">
              <IconFileText size={18} className="shrink-0" />
              <span className="truncate">Minhas Solicitações</span>
            </div>
            <span className={`text-[11px] font-mono px-2 py-0.5 rounded-full shrink-0 ${
              activeTab === 'minhas'
                ? 'bg-blue-500 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}>
              {myDemands.length}
            </span>
          </button>
        </div>

        {/* Rodapé Informativo da Sidebar (Visível em md+) */}
        <div className="hidden md:block pt-3 border-t border-slate-100 dark:border-slate-800/80 text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
          <p className="font-semibold text-slate-700 dark:text-slate-300">GovResolve Ouvidoria</p>
          <p className="leading-tight text-slate-500 dark:text-slate-400">Mapeamento em tempo real com direcionamento direto para órgãos municipais.</p>
        </div>
      </aside>

      {/* Conteúdo Central/Direito Adaptativo */}
      <section className="flex-1 h-full min-min-0 overflow-hidden flex flex-col portal-content">

        {/* ABA 1: CHATBOT DE ATENDIMENTO COM AGENTES INTELIGENTES */}
        {activeTab === 'chat' && (
          <div className="bg-white dark:bg-[#111827] rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col h-full min-h-0 overflow-hidden chat-container">
            
            {/* Header do Chat */}
            <div className="px-4 sm:px-5 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-[#0c121e]/80 flex items-center justify-between chat-header shrink-0">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 flex items-center justify-center chat-header-icon shrink-0">
                  <IconBot size={18} />
                </div>
                <div>
                  <h2 className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 chat-header-title">Assistente de Triagem e Ouvidoria</h2>
                  <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 chat-header-subtitle">Mapeamento em tempo real dos órgãos competentes</p>
                </div>
              </div>
              <span className="text-[11px] font-mono text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800 flex items-center gap-1.5 chat-status-badge shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse chat-status-dot"></span>
                Operacional
              </span>
            </div>

            {/* Janela de Mensagens */}
            <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-5 space-y-4 bg-slate-50/30 dark:bg-[#0b101b] chat-messages">
              
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex gap-3 max-w-[85%] ${
                    msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''
                  }`}
                >
                  <div
                    className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 text-xs ${
                      msg.role === 'user'
                        ? 'bg-blue-600 text-white chat-avatar-user'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 chat-avatar-bot'
                    }`}
                  >
                    {msg.role === 'user' ? <IconUser size={14} /> : <IconBot size={14} />}
                  </div>
                  <div
                    className={`p-3.5 rounded-xl text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-blue-600 text-white rounded-tr-none chat-bubble-user'
                        : 'bg-white dark:bg-[#152033] border border-slate-200/90 dark:border-slate-700/80 text-slate-800 dark:text-slate-200 rounded-tl-none shadow-xs chat-bubble-bot'
                    }`}
                  >
                    <p className="whitespace-pre-line">{msg.content}</p>
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex gap-3 max-w-[85%]">
                  <div className="h-7 w-7 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0 chat-avatar-bot">
                    <IconBot size={14} />
                  </div>
                  <div className="p-3.5 bg-white dark:bg-[#152033] border border-slate-200/90 dark:border-slate-700/80 rounded-xl rounded-tl-none shadow-xs flex items-center gap-1.5 chat-bubble-bot typing-bubble">
                    <span className="w-2 h-2 rounded-full bg-slate-400 dark:bg-slate-500 animate-bounce typing-dot"></span>
                    <span className="w-2 h-2 rounded-full bg-slate-400 dark:bg-slate-500 animate-bounce [animation-delay:0.2s] typing-dot"></span>
                    <span className="w-2 h-2 rounded-full bg-slate-400 dark:bg-slate-500 animate-bounce [animation-delay:0.4s] typing-dot"></span>
                  </div>
                </div>
              )}

              {/* CARD DE PROPOSTA DE DEMANDA ESTRUTURADA */}
              {currentProposal && currentProposal.ready_to_register && (
                <div className="p-4 bg-white dark:bg-[#131e30] border border-blue-200 dark:border-blue-900/60 rounded-xl shadow-xs space-y-3.5 ml-10 proposal-card">
                  <div className="flex items-center gap-2 text-xs font-semibold text-blue-900 dark:text-blue-300 border-b border-blue-100 dark:border-blue-900/50 pb-2 proposal-header">
                    <IconBuilding size={16} className="text-blue-700 dark:text-blue-400" />
                    <span>Órgão Destinatário Identificado</span>
                  </div>
                  <div className="space-y-1.5">
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider proposal-meta-label">Órgão Competente</span>
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 proposal-org-name">{currentProposal.department_name}</p>
                    <span className="text-xs inline-block bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded font-medium mt-1 proposal-badge">
                      {currentProposal.category || 'Atendimento Geral'}
                    </span>
                  </div>
                  <div className="space-y-1 text-xs">
                    <span className="font-medium text-slate-500 dark:text-slate-400 proposal-meta-label">Título Estruturado:</span>
                    <p className="font-semibold text-slate-800 dark:text-slate-200 proposal-title">{currentProposal.suggested_title}</p>
                  </div>
                  <div className="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-slate-800 proposal-footer">
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 proposal-meta-label">Geração de protocolo imediata (&lt;3s)</span>
                    <button
                      onClick={handleConfirmRegister}
                      disabled={registering}
                      className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition flex items-center gap-1.5 focus:ring-2 focus:ring-blue-500 proposal-confirm-btn"
                    >
                      <span>{registering ? 'Gerando Protocolo...' : 'Confirmar e Gerar Protocolo'}</span>
                      <IconArrowRight size={14} />
                    </button>
                  </div>
                </div>
              )}

              {/* CARD DE AUTOATENDIMENTO DETECTADO */}
              {currentProposal && currentProposal.service_type === 'AUTOATENDIMENTO' && (
                <div className="p-4 bg-white dark:bg-[#111e24] border border-emerald-200 dark:border-emerald-900/60 rounded-xl shadow-xs space-y-3 ml-10 self-service-card">
                  <div className="flex items-center gap-2 text-xs font-semibold text-emerald-900 dark:text-emerald-300 border-b border-emerald-100 dark:border-emerald-900/50 pb-2 self-service-header">
                    <IconCheckCircle size={16} className="text-emerald-600 dark:text-emerald-400" />
                    <span>Autoatendimento Digital Disponível</span>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed self-service-text">
                    {currentProposal.self_service_instructions}
                  </p>
                  {currentProposal.self_service_link && (
                    <a
                      href={currentProposal.self_service_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3.5 py-2 rounded-lg transition self-service-btn"
                    >
                      <span>Acessar Portal Oficial de Autoatendimento</span>
                      <IconExternalLink size={14} />
                    </a>
                  )}
                </div>
              )}

              {/* CARD DE ACOMPANHAMENTO EM TEMPO REAL DA DEMANDA FORMALIZADA */}
              {registeredDemand && (
                <div className="p-4 bg-emerald-50/60 dark:bg-[#0c1a17] border border-emerald-300 dark:border-emerald-800/80 rounded-xl space-y-3.5 ml-10 protocol-card">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-emerald-900 dark:text-emerald-300 font-semibold text-sm protocol-card-header">
                      <IconCheckCircle size={18} className="text-emerald-600 dark:text-emerald-400" />
                      <span>Demanda Formalizada e em Acompanhamento</span>
                    </div>
                    <span className="text-[10px] font-mono bg-emerald-200/80 dark:bg-emerald-900/60 text-emerald-900 dark:text-emerald-200 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                      Status: {registeredDemand.status}
                    </span>
                  </div>

                  <div className="p-3 bg-white dark:bg-[#132320] rounded-lg border border-emerald-200 dark:border-emerald-800/70 flex items-center justify-between protocol-num-box">
                    <div>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-mono block protocol-num-label">Número do Protocolo Oficial</span>
                      <span className="font-mono font-bold text-base text-blue-900 dark:text-emerald-300 protocol-num-value">{registeredDemand.protocol}</span>
                    </div>
                    <button
                      onClick={() => handleCopyProtocol(registeredDemand.protocol)}
                      className="text-xs font-medium px-3 py-1.5 rounded border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition flex items-center gap-1 text-slate-700 dark:text-slate-300 protocol-copy-btn"
                    >
                      {copiedProtocol ? <IconCheck size={14} className="text-emerald-600 dark:text-emerald-400" /> : <IconCopy size={14} />}
                      <span>{copiedProtocol ? 'Copiado' : 'Copiar Protocolo'}</span>
                    </button>
                  </div>

                  {registeredDemand.title && (
                    <div className="text-xs space-y-1">
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold block">Título Registrado:</span>
                      <p className="font-semibold text-slate-800 dark:text-slate-200">{registeredDemand.title}</p>
                    </div>
                  )}

                  {registeredDemand.severity && (
                    <div className="p-3 bg-white dark:bg-[#132320] rounded-lg border border-emerald-200 dark:border-emerald-800/70 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold">Gravidade Operacional:</span>
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded border ${
                          registeredDemand.severity === 'CRITICA' ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-800' :
                          registeredDemand.severity === 'ALTA' ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800' :
                          registeredDemand.severity === 'MEDIA' ? 'bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-800' :
                          'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                        }`}>
                          {registeredDemand.severity}
                        </span>
                      </div>
                      {registeredDemand.severity_justification && (
                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed pt-1">
                          {registeredDemand.severity_justification}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Linha de Progresso Visual do Acompanhamento */}
                  <div className="p-3 bg-white dark:bg-[#132320] rounded-lg border border-slate-200 dark:border-slate-700 space-y-2">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold block">Fluxo de Atendimento Municipal:</span>
                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="p-1.5 bg-emerald-50 dark:bg-emerald-950/60 rounded border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 font-semibold flex flex-col items-center">
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono">Etapa 1</span>
                        <span>Protocolado</span>
                      </div>
                      <div className="p-1.5 bg-slate-50 dark:bg-slate-800/50 rounded border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 flex flex-col items-center">
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">Etapa 2</span>
                        <span>Em Andamento</span>
                      </div>
                      <div className="p-1.5 bg-slate-50 dark:bg-slate-800/50 rounded border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 flex flex-col items-center">
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">Etapa 3</span>
                        <span>Conclusão / Parecer</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-between border-t border-emerald-200/60 dark:border-emerald-800/60">
                    <button
                      onClick={() => {
                        setSearchProtocol(registeredDemand.protocol);
                        setActiveTab('consultar');
                        api.getDemandByProtocol(registeredDemand.protocol).then(setSearchedDemand);
                      }}
                      className="text-xs text-blue-700 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 font-semibold flex items-center gap-1.5 protocol-consult-link"
                    >
                      <IconSearch size={14} />
                      <span>Acompanhar protocolo detalhado</span>
                    </button>
                    <button
                      onClick={handleResetChat}
                      className="text-xs text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-medium px-2.5 py-1 rounded border border-slate-300 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 transition"
                    >
                      Nova solicitação
                    </button>
                  </div>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            {/* Pílulas de Ação Rápida */}
            <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-[#0c121e]/80 flex gap-2 overflow-x-auto no-scrollbar quick-pills-container">
              {quickPills.map((pill, pIdx) => (
                <button
                  key={pIdx}
                  type="button"
                  onClick={() => handleSendMessage(pill)}
                  className="text-xs whitespace-nowrap bg-white dark:bg-[#162238] hover:bg-slate-100 dark:hover:bg-[#1c2c47] border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 px-3 py-1.5 rounded-full transition shadow-xs quick-pill-btn"
                >
                  {pill}
                </button>
              ))}
            </div>

            {/* Caixa de Entrada de Texto */}
            <div className="p-3.5 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] flex items-center gap-2 chat-input-container">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Descreva o problema ou serviço que deseja relatar..."
                className="flex-1 px-4 py-2.5 bg-slate-50 dark:bg-[#131d2e] border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:bg-white dark:focus:bg-[#172338] transition chat-input-field"
              />
              <button
                type="button"
                onClick={() => handleSendMessage()}
                disabled={!inputMessage.trim() || isTyping}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white p-2.5 rounded-lg transition shrink-0 chat-send-btn"
                aria-label="Enviar mensagem"
              >
                <IconSend size={18} />
              </button>
            </div>

          </div>
        )}

        {/* ABA 2: CONSULTAR PROTOCOLO */}
        {activeTab === 'consultar' && (
          <div className="h-full min-h-0 overflow-y-auto pr-1">
            <div className="max-w-3xl mx-auto space-y-6">
          <div className="bg-white dark:bg-[#111827] rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-5">
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Acompanhamento Oficial de Demanda</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Informe o código de protocolo para verificar o andamento do atendimento público.</p>
            </div>

            <form onSubmit={handleSearchProtocol} className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={searchProtocol}
                  onChange={(e) => setSearchProtocol(e.target.value)}
                  placeholder="GR-YYYYMMDD-XXXXX"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-[#131d2e] border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-mono uppercase tracking-wider text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:bg-white dark:focus:bg-[#172338] transition"
                />
                <div className="absolute left-3 top-3 text-slate-400 dark:text-slate-500">
                  <IconSearch size={16} />
                </div>
              </div>
              <button
                type="submit"
                disabled={searchLoading}
                className="bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500 text-white px-5 py-2.5 rounded-lg text-xs font-semibold transition"
              >
                {searchLoading ? 'Consultando...' : 'Consultar'}
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
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-5 bg-slate-50/50 dark:bg-[#0c121e]/60 mt-4">
                
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
                  <div>
                    <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 uppercase">Protocolo</span>
                    <p className="font-mono font-bold text-lg text-slate-900 dark:text-slate-100">{searchedDemand.protocol}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    {searchedDemand.severity && (
                      <div className="text-right">
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Gravidade</span>
                        <span className={`inline-flex items-center px-2.5 py-1 rounded text-xs font-bold border ${
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
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Status da Demanda</span>
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                        searchedDemand.status === 'ABERTO' ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800' :
                        searchedDemand.status === 'EM ANDAMENTO' ? 'bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-800' :
                        'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                      }`}>
                        {searchedDemand.status === 'ABERTO' && <IconClock size={13} />}
                        {searchedDemand.status === 'EM ANDAMENTO' && <IconClock size={13} />}
                        {searchedDemand.status === 'FECHADO' && <IconCheckCircle size={13} />}
                        <span>{searchedDemand.status}</span>
                      </span>
                    </div>
                  </div>
                </div>

                {searchedDemand.severity_justification && (
                  <div className="bg-white dark:bg-[#131d2e] p-3.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 space-y-1">
                    <span className="text-[11px] font-semibold uppercase text-slate-700 dark:text-slate-300 block">Classificação de Gravidade (IA Pós-Aprovação):</span>
                    <p className="leading-relaxed text-slate-600 dark:text-slate-300">{searchedDemand.severity_justification}</p>
                  </div>
                )}

                {/* STEPPER HORIZONTAL MINIMALISTA */}
                <div className="py-2 demand-stepper">
                  <div className="flex items-center justify-between max-w-md mx-auto text-xs">
                    <div className="flex flex-col items-center stepper-step">
                      <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs stepper-circle stepper-circle-active">1</div>
                      <span className="mt-1.5 font-medium text-slate-700 dark:text-slate-300 stepper-label">Aberto</span>
                    </div>
                    <div className={`flex-1 h-0.5 mx-2 stepper-line ${searchedDemand.status !== 'ABERTO' ? 'bg-blue-600 stepper-line-active' : 'bg-slate-200 dark:bg-slate-700'}`} />
                    <div className="flex flex-col items-center stepper-step">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs stepper-circle ${
                        searchedDemand.status === 'EM ANDAMENTO' || searchedDemand.status === 'FECHADO'
                          ? 'bg-blue-600 text-white stepper-circle-active' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                      }`}>2</div>
                      <span className="mt-1.5 font-medium text-slate-700 dark:text-slate-300 stepper-label">Em Andamento</span>
                    </div>
                    <div className={`flex-1 h-0.5 mx-2 stepper-line ${searchedDemand.status === 'FECHADO' ? 'bg-emerald-600 stepper-line-active' : 'bg-slate-200 dark:bg-slate-700'}`} />
                    <div className="flex flex-col items-center stepper-step">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs stepper-circle ${
                        searchedDemand.status === 'FECHADO' ? 'bg-emerald-600 text-white stepper-circle-active' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                      }`}>3</div>
                      <span className="mt-1.5 font-medium text-slate-700 dark:text-slate-300 stepper-label">Fechado</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-[#131d2e] p-4 rounded-lg border border-slate-200 dark:border-slate-700 space-y-2 demand-detail-card">
                  <span className="text-[11px] font-semibold uppercase text-slate-500 dark:text-slate-400 demand-detail-label">Relato Original</span>
                  <h4 className="font-semibold text-sm text-slate-900 dark:text-slate-100 demand-detail-title">{searchedDemand.title}</h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300 whitespace-pre-line leading-relaxed demand-detail-text">{searchedDemand.description}</p>
                </div>

                {searchedDemand.organized_summary && (
                  <div className="bg-white dark:bg-[#131d2e] p-4 rounded-lg border border-slate-200 dark:border-slate-700 space-y-1.5 text-xs text-slate-700 dark:text-slate-300 demand-ia-card">
                    <span className="text-[11px] font-semibold uppercase text-blue-900 dark:text-blue-300 block demand-ia-label">Síntese Estruturada da Demanda (IA)</span>
                    <p className="whitespace-pre-line leading-relaxed demand-ia-text">{searchedDemand.organized_summary}</p>
                  </div>
                )}

                {/* PARECER DO SERVIDOR AO FECHAR */}
                {searchedDemand.status === 'FECHADO' && searchedDemand.resolution_notes && (
                  <div className="p-4 bg-emerald-50/80 dark:bg-[#0d221c] border border-emerald-300 dark:border-emerald-800 rounded-lg space-y-1 demand-resolution-card">
                    <span className="text-xs font-semibold text-emerald-950 dark:text-emerald-300 uppercase tracking-wide demand-resolution-label">Parecer Conclusivo do Órgão</span>
                    <p className="text-xs text-emerald-900 dark:text-emerald-200 leading-relaxed demand-resolution-text">{searchedDemand.resolution_notes}</p>
                  </div>
                )}

                {/* AVALIAÇÃO / FEEDBACK */}
                {searchedDemand.status === 'FECHADO' && (
                  <div className="p-4 bg-white dark:bg-[#131d2e] border border-slate-200 dark:border-slate-700 rounded-lg space-y-3 demand-feedback-card">
                    <h5 className="font-semibold text-xs text-slate-900 dark:text-slate-100 uppercase demand-feedback-title">Avaliação do Atendimento</h5>
                    {feedbackSuccess ? (
                      <p className="text-emerald-700 dark:text-emerald-400 text-xs font-medium feedback-success-msg">Avaliação registrada com sucesso. Agradecemos sua colaboração.</p>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex items-center gap-1.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setFeedbackRating(star)}
                              className={`p-1 rating-star-btn ${star <= feedbackRating ? 'text-amber-500 rating-star-active' : 'text-slate-300 dark:text-slate-600 rating-star-inactive'}`}
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
                          placeholder="Comentário sobre a solução do problema (opcional)"
                          className="w-full text-xs px-3 py-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#0c121e] text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 feedback-input"
                        />
                        <button
                          onClick={handleSendFeedback}
                          className="bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500 text-white text-xs font-semibold px-4 py-2 rounded-lg transition feedback-submit-btn"
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
        </div>
      </div>
    )}

    {/* ABA 3: MINHAS DEMANDAS */}
    {activeTab === 'minhas' && (
      <div className="h-full min-h-0 overflow-y-auto pr-1">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white dark:bg-[#111827] rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Histórico de Solicitações do Cidadão</h2>
            {myDemands.length === 0 ? (
              <p className="text-xs text-slate-500 dark:text-slate-400 py-8 text-center">Nenhuma solicitação encontrada no seu cadastro.</p>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {myDemands.map((d) => (
                  <div key={d.id} className="py-3.5 flex items-center justify-between gap-4">
                    <div className="space-y-1">
                      <span className="font-mono text-xs font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded border border-blue-100 dark:border-blue-900/60">
                        {d.protocol}
                      </span>
                      <h4 className="text-sm font-medium text-slate-900 dark:text-slate-100">{d.title}</h4>
                      <span className="text-[11px] text-slate-400 dark:text-slate-500">{new Date(d.created_at).toLocaleDateString('pt-BR')}</span>
                    </div>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                      d.status === 'ABERTO' ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800' :
                      d.status === 'EM ANDAMENTO' ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800' :
                      'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                    }`}>
                      {d.status}
                    </span>
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
