import React, { useEffect, useRef } from 'react';
import { ChatMessageItem } from '../../types';
import { IconMessageSquare, IconExternalLink } from '../common/Icons';

interface ChatMessageListProps {
  messages: ChatMessageItem[];
  isTyping: boolean;
  selfServiceInfo?: {
    link?: string;
    instructions?: string;
    departmentName?: string;
    category?: string;
  } | null;
  onSuggestionClick?: (message: string) => void;
}

export const ChatMessageList: React.FC<ChatMessageListProps> = ({
  messages,
  isTyping,
  selfServiceInfo,
  onSuggestionClick
}) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping, selfServiceInfo]);

  return (
    <div className="flex-1 min-h-0 overflow-y-auto p-[18px] flex flex-col gap-[13px] bg-[#f7faf9] dark:bg-[#0b1117] font-sans chat-messages">
      {messages.map((msg, idx) => {
        const isUser = msg.role === 'user';

        return (
          <React.Fragment key={idx}>
          <div
            className={`flex items-start gap-2.5 max-w-[85%] ${
              isUser ? 'self-end flex-row-reverse' : 'self-start'
            }`}
          >
            {!isUser && (
              <div className="w-[30px] h-[30px] rounded-[10px] flex items-center justify-center shrink-0 bg-[#ddedea] dark:bg-[#18302b] text-[#0d3b42] dark:text-[#5ee0b5] chat-avatar-bot">
                <IconMessageSquare size={16} />
              </div>
            )}

            {/* Balão da Mensagem */}
            <div
              className={`px-[14px] py-[11px] rounded-[15px] text-xs sm:text-[13px] leading-[19px] ${
                isUser
                  ? 'bg-[#f4a261] dark:bg-[#5ee0b5] text-[#0d3b42] dark:text-[#092018] chat-bubble-user font-medium'
                  : 'bg-white dark:bg-[#111b24] text-[#0d3b42] dark:text-[#f3f7f6] border border-[#c7d8d4] dark:border-[#273a3b] chat-bubble-bot'
              }`}
            >
              <div className="whitespace-pre-line">{msg.content}</div>
            </div>
          </div>
          {!isUser && idx === 0 && messages.length <= 2 && onSuggestionClick && (
            <div className="mt-2 flex flex-wrap gap-2" aria-label="Sugestões de assunto">
              {[
                ['Iluminação apagada', 'Há um poste de iluminação apagado na minha rua.'],
                ['Buraco na rua', 'Há um buraco na rua que precisa de reparo.'],
                ['Lixo acumulado', 'Há lixo acumulado na minha região.']
              ].map(([label, message]) => (
                <button key={label} type="button" onClick={() => onSuggestionClick(message)} className="rounded-full border border-[#c7d8d4] dark:border-[#273a3b] bg-white dark:bg-[#111b24] px-[10px] py-1.5 text-[11px] font-semibold text-[#0d3b42] dark:text-[#f3f7f6] hover:bg-[#eaf4f1] dark:hover:bg-[#17232c]">
                  {label}
                </button>
              ))}
            </div>
          )}
          </React.Fragment>
        );
      })}

      {/* Card de Encaminhamento para Autoatendimento se detectado */}
      {selfServiceInfo && (
        <div className="self-start max-w-[85%] p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs flex flex-col gap-2">
          <div className="font-bold flex items-center gap-1.5 text-xs text-amber-700 dark:text-amber-300">
              <span>Serviço de autoatendimento disponível</span>
          </div>
          <p className="leading-relaxed">
            {selfServiceInfo.instructions ||
              'Esta demanda pode ser emitida ou resolvida imediatamente pelo portal de autoatendimento da Prefeitura sem necessidade de fiscalização presencial.'}
          </p>
          {selfServiceInfo.link && (
            <a
              href={selfServiceInfo.link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-semibold text-amber-700 dark:text-amber-300 underline hover:text-amber-600 mt-1"
            >
              <span>Acessar portal de autoatendimento</span>
              <IconExternalLink size={13} />
            </a>
          )}
        </div>
      )}

      {/* Indicador de Digitação do Assistente */}
      {isTyping && (
        <div className="self-start flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 pl-9">
          <span className="w-2 h-2 rounded-full bg-[#f4a261] dark:bg-[#5ee0b5] animate-bounce" />
          <span className="w-2 h-2 rounded-full bg-[#f4a261] dark:bg-[#5ee0b5] animate-bounce [animation-delay:0.2s]" />
          <span className="w-2 h-2 rounded-full bg-[#f4a261] dark:bg-[#5ee0b5] animate-bounce [animation-delay:0.4s]" />
          <span className="text-[11px] font-medium ml-1">Analisando relato e identificando órgão...</span>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
};
