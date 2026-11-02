import React, { useState } from 'react';
import { IconSend } from '../common/Icons';

interface ChatInputProps {
  disabled: boolean;
  onSendMessage: (message: string) => Promise<void> | void;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  disabled,
  onSendMessage
}) => {
  const [text, setText] = useState('');

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!text.trim() || disabled) return;
    const message = text.trim();
    Promise.resolve(onSendMessage(message)).then(() => setText(''));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="shrink-0 flex flex-col border-t border-[#c7d8d4] dark:border-[#273a3b] bg-white dark:bg-[#111b24] font-sans chat-input-container">
      {/* Caixa de Entrada e Botão Enviar */}
      <form onSubmit={handleSubmit} className="h-[76px] px-[14px] flex items-center gap-[10px]">
        <textarea
          rows={1}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder="Digite sua mensagem…"
          className="h-12 min-w-0 flex-1 px-[14px] py-3 rounded-[10px] bg-[#f4f8f7] dark:bg-[#0b1117] border border-[#c7d8d4] dark:border-[#273a3b] text-[13px] text-[#0d3b42] dark:text-[#f3f7f6] placeholder:text-[#78908e] dark:placeholder:text-[#90aaa7] focus:outline-none focus:ring-2 focus:ring-[#f4a261] dark:focus:ring-[#5ee0b5] resize-none leading-5 transition"
        />

        <button
          type="submit"
          disabled={disabled || !text.trim()}
          title="Enviar relato para triagem"
          className="h-11 w-11 rounded-[10px] bg-[#f4a261] hover:bg-[#e99855] dark:bg-[#5ee0b5] dark:hover:bg-[#49cfa6] disabled:cursor-not-allowed text-[#0d3b42] dark:text-[#092018] flex items-center justify-center transition shrink-0"
        >
          <IconSend size={16} />
        </button>
      </form>
    </div>
  );
};
