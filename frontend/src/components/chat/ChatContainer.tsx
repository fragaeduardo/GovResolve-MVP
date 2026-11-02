import React from 'react';
import { useChatSession } from '../../hooks/useChatSession';
import { ChatMessageList } from './ChatMessageList';
import { ChatInput } from './ChatInput';
import { ProposalCard } from './ProposalCard';
import { ProtocolSuccessCard } from './ProtocolSuccessCard';
import { IconMessageSquare, IconAlertCircle } from '../common/Icons';

interface ChatContainerProps {
  onViewProtocol?: (protocol: string) => void;
}

export const ChatContainer: React.FC<ChatContainerProps> = ({ onViewProtocol }) => {
  const {
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
    returnToConversation,
    confirmProposal,
    cancelSession,
    resetChat,
    startNewChat
  } = useChatSession();

  // Se a demanda foi formalizada, exibe o cartão de sucesso do Figma
  if (formalizedResult) {
    return (
      <div className="flex-1 min-h-0 max-h-[710px] flex flex-col rounded-[24px] bg-white dark:bg-[#111b24] border border-[#c7d8d4] dark:border-[#273a3b] p-6 overflow-y-auto font-sans">
        <ProtocolSuccessCard
          data={formalizedResult}
          onViewProtocol={onViewProtocol}
          onNewDemand={resetChat}
        />
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-0 max-h-[710px] flex flex-col rounded-[24px] bg-white dark:bg-[#111b24] border border-[#c7d8d4] dark:border-[#273a3b] overflow-hidden font-sans chat-container">
      {/* Barra Superior do Chat (Conforme Figma) */}
      <div className="h-[68px] shrink-0 px-[18px] py-4 bg-white dark:bg-[#111b24] border-b border-[#c7d8d4] dark:border-[#273a3b] flex items-center justify-between gap-3 chat-header">
        <div className="flex min-w-0 items-center gap-[10px]">
          <div className="w-[34px] h-[34px] rounded-xl bg-[#ddedea] dark:bg-[#101a20] text-[#0d3b42] dark:text-[#5ee0b5] flex items-center justify-center shrink-0">
            <IconMessageSquare size={18} />
          </div>
          <div className="min-w-0">
            <h2 className="text-[15px] leading-[18px] font-bold text-[#0d3b42] dark:text-[#f3f7f6] chat-header-title">
              Atendimento GovResolve
            </h2>
            <p className="text-[11px] leading-[13px] text-[#527277] dark:text-[#90aaa7] mt-0.5 chat-header-subtitle">
              Montamos a ficha juntos • você aprova antes do protocolo
            </p>
          </div>
        </div>

              <button type="button" onClick={startNewChat} disabled={isTyping || isActionLoading} className="shrink-0 rounded-full bg-[#e3f3ee] dark:bg-[#12302b] px-[10px] py-1.5 text-[11px] font-semibold text-[#14745f] dark:text-[#5ee0b5] disabled:opacity-50">Nova conversa</button>
      </div>

      {/* Alerta de Erro se houver */}
      {error && (
        <div className="px-5 py-2.5 bg-rose-50 dark:bg-rose-950/60 border-b border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-medium flex items-center gap-2">
          <IconAlertCircle size={14} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Lista de Mensagens do Chat */}
      <ChatMessageList
        messages={messages}
        isTyping={isTyping}
        selfServiceInfo={selfServiceInfo}
        onSuggestionClick={sendMessage}
      />

      {/* Cartão de Proposta Estruturada HITL (inline na conversa) */}
      {proposal && (state === 'AWAITING_CONFIRMATION' || state === 'REVISING') && (
        <div className="px-4 sm:px-5 shrink-0 max-h-[45vh] overflow-y-auto">
          <ProposalCard
            proposal={proposal}
            isLoading={isActionLoading}
            onConfirm={confirmProposal}
            onReturnToConversation={returnToConversation}
            onCancel={cancelSession}
          />
        </div>
      )}

      {/* Barra de Entrada de Mensagem */}
      <ChatInput
        disabled={isTyping || isActionLoading || state === 'FORMALIZED'}
        onSendMessage={sendMessage}
      />

    </div>
  );
};
