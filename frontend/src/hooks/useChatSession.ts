import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import {
  ChatMessageItem,
  ConversationState,
  ProposalDTO,
  ChatFormalizeResponse,
  ChatAgentResult
} from '../types';

const INITIAL_GREETING: ChatMessageItem = {
  role: 'assistant',
  content:
    'Olá! Eu vou te ajudar a registrar sua solicitação. Me conte, com suas palavras, o que aconteceu.'
};

const SESSION_STORAGE_KEY = 'govresolve_active_chat_session';

export const clearSavedChatSession = () => sessionStorage.removeItem(SESSION_STORAGE_KEY);

export function useChatSession() {
  const [sessionId, setSessionId] = useState<string>(() => {
    return sessionStorage.getItem(SESSION_STORAGE_KEY) || '';
  });

  const [messages, setMessages] = useState<ChatMessageItem[]>([INITIAL_GREETING]);
  const [state, setState] = useState<ConversationState>('COLLECTING');
  const [proposal, setProposal] = useState<ProposalDTO | null>(null);
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [isActionLoading, setIsActionLoading] = useState<boolean>(false);
  const [formalizedResult, setFormalizedResult] = useState<ChatFormalizeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selfServiceInfo, setSelfServiceInfo] = useState<{
    link?: string;
    instructions?: string;
    departmentName?: string;
    category?: string;
  } | null>(null);

  // Restaura sessão existente ao carregar a página
  const restoreSession = useCallback(async (sid: string) => {
    if (!sid) return;
    try {
      const data = await api.getChatSession(sid);
      if (data && data.session_id) {
        setSessionId(data.session_id);
        if (data.messages && data.messages.length > 0) {
          setMessages(data.messages);
        }
        setState(data.state || 'COLLECTING');
        if (data.proposal) {
          setProposal(data.proposal);
        }
        if (data.is_self_service) {
          setSelfServiceInfo({
            departmentName: data.department_name,
            category: data.category
          });
        }
      }
    } catch (err: any) {
      console.warn('Sessão expirada ou não encontrada no servidor:', err);
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
      setSessionId('');
    }
  }, []);

  useEffect(() => {
    const savedId = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (savedId) {
      restoreSession(savedId);
    }
  }, [restoreSession]);

  // Envio de mensagem pelo usuário
  const sendMessage = async (text: string): Promise<void> => {
    const trimmed = text.trim();
    if (!trimmed || isTyping) return;

    setError(null);
    const newMessages: ChatMessageItem[] = [
      ...messages,
      { role: 'user', content: trimmed }
    ];
    setMessages(newMessages);
    setIsTyping(true);

    try {
      const res: ChatAgentResult = await api.sendChatMessage(newMessages, sessionId || undefined);

      if (res.session_id) {
        setSessionId(res.session_id);
        sessionStorage.setItem(SESSION_STORAGE_KEY, res.session_id);
      }

      setMessages([...newMessages, { role: 'assistant', content: res.reply }]);

      if (res.state) {
        setState(res.state);
      } else if (res.ready_to_register) {
        setState('AWAITING_CONFIRMATION');
      }

      if (res.proposal) {
        setProposal(res.proposal);
      }

      if (res.service_type === 'AUTOATENDIMENTO') {
        setSelfServiceInfo({
          link: res.self_service_link,
          instructions: res.self_service_instructions,
          departmentName: res.department_name,
          category: res.category
        });
      }
    } catch (err: any) {
      setMessages(messages);
      setError(err?.message || 'Falha ao comunicar com o assistente.');
    } finally {
      setIsTyping(false);
    }
  };

  // Revisão e correção de proposta HITL
  const reviseProposal = async (
    instructions: string,
    slots?: Record<string, string>
  ) => {
    if (!sessionId || isActionLoading) return;

    setIsActionLoading(true);
    setError(null);

    try {
      const currentVer = proposal?.version || 1;
      const res = await api.reviseChatProposal(
        sessionId,
        currentVer,
        instructions,
        instructions,
        slots
      );

      setState(res.state || 'AWAITING_CONFIRMATION');

      if (res.proposal) {
        setProposal(res.proposal);
      }

      setMessages(prev => [
        ...prev,
        { role: 'user', content: instructions },
        { role: 'assistant', content: res.reply }
      ]);
    } catch (err: any) {
      setError(err?.message || 'Falha ao solicitar revisão dos dados.');
    } finally {
      setIsActionLoading(false);
    }
  };

  const returnToConversation = () => {
    setState('COLLECTING');
    setProposal(null);
    setMessages(prev => [
      ...prev,
      { role: 'assistant', content: 'Tudo bem. A ficha ainda não será registrada. O que você quer corrigir ou acrescentar?' }
    ]);
  };

  // Confirmação e formalização da proposta com idempotência
  const confirmProposal = async () => {
    if (!sessionId || isActionLoading) return;

    setIsActionLoading(true);
    setError(null);

    try {
      const propId = proposal?.id;
      const propVer = proposal?.version || 1;

      const result = await api.confirmChatProposal(sessionId, propId, propVer);

      setState('FORMALIZED');
      setFormalizedResult(result);
      setProposal(null);

      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: result.reply }
      ]);

      sessionStorage.removeItem(SESSION_STORAGE_KEY);
    } catch (err: any) {
      setError(err?.message || 'Falha ao confirmar e formalizar a demanda.');
    } finally {
      setIsActionLoading(false);
    }
  };

  // Cancelamento do fluxo antes do protocolo
  const cancelSession = async () => {
    if (!sessionId || isActionLoading) return;

    setIsActionLoading(true);
    setError(null);

    try {
      const res = await api.cancelChatDemand(sessionId);
      setState('CANCELLED');
      setProposal(null);

      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: res.message || 'Solicitação cancelada com sucesso.' }
      ]);

      sessionStorage.removeItem(SESSION_STORAGE_KEY);
    } catch (err: any) {
      setError(err?.message || 'Falha ao cancelar solicitação.');
    } finally {
      setIsActionLoading(false);
    }
  };

  // Reiniciar atendimento
  const resetChat = () => {
    setMessages([INITIAL_GREETING]);
    setState('COLLECTING');
    setProposal(null);
    setFormalizedResult(null);
    setError(null);
    setSelfServiceInfo(null);
    setSessionId('');
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
  };

  const startNewChat = () => {
    resetChat();
  };

  return {
    sessionId,
    messages,
    state,
    proposal,
    isTyping,
    isActionLoading,
    formalizedResult,
    selfServiceInfo,
    error,
    sendMessage,
    reviseProposal,
    returnToConversation,
    confirmProposal,
    cancelSession,
    resetChat,
    startNewChat
  };
}
