import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { clearSavedChatSession } from '../../hooks/useChatSession';
import { NewDemandChat } from './NewDemandChat';
import { MyDemandsList } from './MyDemandsList';

export const CitizenPortal: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'nova' | 'minhas'>('nova');
  const [selectedProtocolForView, setSelectedProtocolForView] = useState<string | null>(null);
  const [chatKey, setChatKey] = useState(0);
  const handleViewProtocol = (protocol: string) => {
    setSelectedProtocolForView(protocol);
    setActiveTab('minhas');
  };

  const firstName = user?.name ? user.name.split(' ')[0] : 'Carlos';

  return (
    <div className="flex-1 min-h-0 flex flex-col md:flex-row gap-4 sm:gap-7 overflow-y-auto md:overflow-hidden px-4 pt-4 pb-3 sm:px-[38px] sm:pt-7 sm:pb-11 font-sans">
      {/* 1. Barra Lateral de Navegação (Conforme Protótipo do Figma) */}
      <aside
        aria-label="Menu do Cidadão"
        className="w-full md:w-[310px] shrink-0 rounded-[26px] p-[14px] sm:px-[18px] sm:py-6 flex flex-col gap-3 sm:gap-4 overflow-y-auto transition-colors duration-200 bg-[#ddedea] dark:bg-[#101a20]"
      >
        <div className="flex flex-col gap-2 sm:gap-4">
          {/* Identificação do Usuário */}
          <div className="flex flex-col gap-1 sm:gap-4">
            <h1 className="text-xl sm:text-[25px] leading-[30px] font-bold text-[#0d3b42] dark:text-[#f3f7f6] tracking-tight">
              Olá, {firstName}.
            </h1>
            <p className="text-[13px] leading-4 text-[#527277] dark:text-[#90aaa7]">
              O que vamos resolver hoje?
            </p>
          </div>

          {/* Botões de Ação Principais (Pills do Figma) */}
          <div className="grid grid-cols-2 sm:grid-cols-1 gap-2 sm:gap-4">
            {/* Botão + Nova Demanda */}
            <button
              type="button"
              onClick={() => {
                clearSavedChatSession();
                setChatKey(key => key + 1);
                setSelectedProtocolForView(null);
                setActiveTab('nova');
              }}
              className={`w-full h-11 px-4 rounded-[10px] font-semibold text-[13px] flex items-center justify-center gap-2 transition ${
                activeTab === 'nova'
                  ? 'citizen-nav-active bg-[#f4a261] hover:bg-[#e99855] text-[#0d3b42] dark:bg-[#5ee0b5] dark:hover:bg-[#49cfa6] dark:text-[#092018]'
                  : 'bg-white hover:bg-[#f7faf9] text-[#0d3b42] dark:bg-[#111b24] dark:hover:bg-[#17232c] dark:text-[#f3f7f6] border border-[#c7d8d4] dark:border-[#273a3b]'
              }`}
            >
              <span>Nova demanda</span>
            </button>

            {/* Botão Meus Protocolos */}
            <button
              type="button"
              onClick={() => {
                setActiveTab('minhas');
                setSelectedProtocolForView(null);
              }}
              className={`w-full h-11 px-4 rounded-[10px] font-semibold text-[13px] flex items-center justify-center gap-2 transition ${
                activeTab === 'minhas'
                  ? 'citizen-nav-active bg-[#f4a261] hover:bg-[#e99855] text-[#0d3b42] dark:bg-[#5ee0b5] dark:hover:bg-[#49cfa6] dark:text-[#092018]'
                  : 'bg-white hover:bg-[#f7faf9] text-[#0d3b42] dark:bg-[#111b24] dark:hover:bg-[#17232c] dark:text-[#f3f7f6] border border-[#c7d8d4] dark:border-[#273a3b]'
              }`}
            >
              <span>Meus protocolos</span>
            </button>
          </div>
        </div>

        {/* Card Informativo "Como funciona?" no rodapé da Sidebar */}
        <div className="p-[10px] sm:p-[14px] rounded-2xl bg-[#c8e2dc] dark:bg-[#12302b] text-xs flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5 text-[#0d3b42] dark:text-[#f3f7f6] font-semibold text-xs">
            <span>Revisão humana</span>
          </div>
          <p className="text-[11px] text-[#527277] dark:text-[#90aaa7] leading-[17px]">
            A IA organiza e encaminha. Você confirma antes do protocolo.
          </p>
        </div>
      </aside>

      {/* 2. Conteúdo Central Conforme Aba Selecionada */}
      <main className="flex-1 min-w-0 min-h-[430px] md:min-h-0 flex flex-col gap-4 overflow-hidden">
        <div className="h-[70px] shrink-0 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-2xl sm:text-[32px] leading-tight font-bold text-[#0d3b42] dark:text-[#f3f7f6]">
              {activeTab === 'nova' ? 'Fale com a cidade' : selectedProtocolForView ? 'Acompanhe sua solicitação' : 'Meus protocolos'}
            </h2>
            <p className="mt-1 text-[13px] leading-4 text-[#527277] dark:text-[#90aaa7]">
              {activeTab === 'nova'
                ? 'O atendimento começa em conversa, não em formulário.'
                : selectedProtocolForView
                  ? 'Status, encaminhamento e parecer ficam reunidos em um só lugar.'
                  : 'Acompanhe o andamento das suas solicitações em um só lugar.'}
            </p>
          </div>
          <span className="hidden sm:inline-flex shrink-0 items-center rounded-full border border-[#c7d8d4] dark:border-[#273a3b] bg-white dark:bg-[#111b24] px-[10px] py-1.5 text-[11px] font-semibold text-[#0d3b42] dark:text-[#f3f7f6]">
            Goiânia • canal municipal
          </span>
        </div>
        {activeTab === 'nova' ? (
          <NewDemandChat key={chatKey} onViewProtocol={handleViewProtocol} />
        ) : (
          <MyDemandsList
            initialProtocol={selectedProtocolForView}
            onClearInitialProtocol={() => setSelectedProtocolForView(null)}
          />
        )}
      </main>
    </div>
  );
};
