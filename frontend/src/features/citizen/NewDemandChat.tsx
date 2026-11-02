import React from 'react';
import { ChatContainer } from '../../components/chat/ChatContainer';

interface NewDemandChatProps {
  onViewProtocol?: (protocol: string) => void;
}

export const NewDemandChat: React.FC<NewDemandChatProps> = ({ onViewProtocol }) => {
  return (
    <div className="flex-1 min-h-0 flex flex-col h-full overflow-hidden font-sans">
      <ChatContainer onViewProtocol={onViewProtocol} />
    </div>
  );
};
