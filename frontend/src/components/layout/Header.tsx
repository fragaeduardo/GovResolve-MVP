import React, { useState, useRef, useEffect } from 'react';
import { hasAreaAccess, UserProfile } from '../../types';
import { AppArea } from './EnvironmentSelector';
import { ContrastToggle } from '../accessibility/ContrastToggle';
import { SkipLink } from '../accessibility/SkipLink';
import { isDemoProfileForArea } from '../../features/auth/demoProfiles';
import {
  IconSun,
  IconMoon,
  IconUser,
  IconShield,
  IconBarChart,
  IconCheck
} from '../common/Icons';

interface HeaderProps {
  currentUser: UserProfile | null;
  activeArea: AppArea;
  onSelectArea: (area: AppArea) => void | Promise<void>;
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
  isHighContrast: boolean;
  onToggleContrast: () => void;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  activeArea,
  onSelectArea,
  theme = 'light',
  onToggleTheme,
  isHighContrast,
  onToggleContrast,
  onLogout
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [switchingArea, setSwitchingArea] = useState<AppArea | null>(null);
  const [switchError, setSwitchError] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fecha dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentAreaLabel =
    activeArea === 'citizen'
      ? 'Área do cidadão'
      : activeArea === 'server'
      ? 'Área do servidor'
      : 'Gestão e indicadores';

  const areaOptions: Array<{
    id: AppArea;
    title: string;
    description: string;
    icon: React.ReactNode;
  }> = [
    {
      id: 'citizen',
      title: 'Área do cidadão',
      description: 'Demandas e acompanhamento',
      icon: <IconUser size={14} />
    },
    {
      id: 'server',
      title: 'Área do servidor',
      description: 'Fila e tratamento das demandas',
      icon: <IconShield size={14} />
    },
    {
      id: 'management',
      title: 'Gestão e indicadores',
      description: 'Comparativos e visão gerencial',
      icon: <IconBarChart size={14} />
    }
  ];

  const selectArea = async (area: AppArea) => {
    setSwitchError(null);
    setSwitchingArea(area);
    try {
      await onSelectArea(area);
      setIsDropdownOpen(false);
    } catch (error) {
      setSwitchError(error instanceof Error ? error.message : 'Não foi possível trocar de ambiente.');
    } finally {
      setSwitchingArea(null);
    }
  };

  return (
    <header
      className={`h-[72px] shrink-0 z-40 border-b transition-colors duration-200 ${
        isHighContrast
          ? 'bg-black border-yellow-300 text-white'
          : 'bg-[#0d3b42] dark:bg-[#0b1117] border-[#0d3b42] dark:border-[#273a3b] text-white'
      }`}
      role="banner"
    >
      <SkipLink />

      <div className="h-full px-5 sm:px-7 flex items-center justify-between gap-4">
        {/* Identidade Institucional: Logo GovResolve com Ponto Âmbar */}
        <div className="flex items-center gap-[10px]">
          <div className="brand-mark h-8 w-8 rounded-full bg-[#f4a261] dark:bg-[#5ee0b5] shrink-0" aria-hidden="true" />
          <div className="flex items-center">
            <span className="font-bold text-[17px] tracking-tight text-white font-sans">
              GovResolve
            </span>
          </div>
        </div>

        {/* Lado Direito: Acessibilidade + Seletor de Papel / Perfil */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Alternância de Modo Claro / Escuro */}
          {onToggleTheme && !isHighContrast && (
            <button
              type="button"
              onClick={onToggleTheme}
              aria-label={theme === 'dark' ? 'Mudar para modo claro' : 'Mudar para modo escuro'}
              title={theme === 'dark' ? 'Mudar para modo claro' : 'Mudar para modo escuro'}
              className="w-9 h-9 rounded-full flex items-center justify-center transition-all bg-[#173f43] dark:bg-[#173f43] hover:bg-[#20545a] text-slate-300 hover:text-white border border-[#3c6468]"
            >
              {theme === 'dark' ? (
                <IconSun size={15} className="text-amber-300" />
              ) : (
                <IconMoon size={15} className="text-slate-300" />
              )}
            </button>
          )}

          {/* Alternância de Alto Contraste (WCAG 2.1 AAA) */}
          <ContrastToggle
            isHighContrast={isHighContrast}
            onToggle={onToggleContrast}
          />

          {/* Seletor de ambiente conforme o menu aberto do Figma */}
          {currentUser && (
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => {
                  setSwitchError(null);
                  setIsDropdownOpen(!isDropdownOpen);
                }}
                aria-expanded={isDropdownOpen}
                aria-haspopup="menu"
                aria-label={`${currentUser.name}. Ambiente: ${currentAreaLabel}. Abrir seletor de ambiente`}
                className="w-10 sm:w-[152px] h-10 flex items-center justify-center sm:justify-start gap-[9px] px-0 sm:px-[10px] py-[7px] rounded-full bg-[#164c52] dark:bg-[#16242a] hover:bg-[#20575c] text-white border border-[#3e6e70] dark:border-[#30464b] transition text-xs font-semibold"
              >
                <div className="w-[17px] h-[17px] rounded-full text-[#b9d2cf] flex items-center justify-center">
                  <IconUser size={16} />
                </div>
                <div className="w-[82px] text-left hidden md:block">
                  <span className="block truncate font-bold text-[11px] text-white leading-tight">
                    {currentUser.name.split(' ')[0]} {currentUser.name.split(' ')[1] || ''}
                  </span>
                  <span className="block truncate text-[9px] text-[#b9d2cf] dark:text-[#93aaa6] font-normal">
                    {currentAreaLabel}
                  </span>
                </div>
                <svg
                  className={`hidden sm:block w-3.5 h-3.5 text-slate-400 transition-transform ${
                    isDropdownOpen ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Menu Dropdown "Mudar papel" do Figma */}
              {isDropdownOpen && (
                <div
                  role="menu"
                  aria-label="Seletor de ambiente"
                  className="absolute right-0 top-full mt-2 w-[min(320px,calc(100vw-24px))] min-h-[306px] max-h-[calc(100vh-80px)] overflow-y-auto rounded-[18px] bg-white dark:bg-[#111b24] border border-[#c7d8d4] dark:border-[#273a3b] shadow-2xl p-[11px] z-50 font-sans text-[#0d3b42] dark:text-[#f3f7f6]"
                >
                  <div className="h-11 px-2 flex flex-col justify-center">
                    <span className="truncate text-[12px] leading-4 font-bold text-[#0d3b42] dark:text-[#f3f7f6]">
                      {currentUser.name}
                    </span>
                    <span className="text-[10px] leading-3 text-[#527277] dark:text-[#90aaa7]">
                      Selecione o ambiente
                    </span>
                  </div>

                  <div className="my-1 border-t border-[#c7d8d4] dark:border-[#273a3b]" />

                  <div className="flex flex-col gap-1 py-1">
                    {areaOptions.map((option) => {
                      const authorized = hasAreaAccess(currentUser, option.id);
                      const canTestDemo = import.meta.env.DEV && option.id !== 'citizen';
                      const isSelected = activeArea === option.id;
                      const isTargetDemoProfile = option.id !== 'citizen' && isDemoProfileForArea(currentUser, option.id);
                      const status = canTestDemo && !isTargetDemoProfile
                        ? 'TESTAR DEMO'
                        : authorized ? 'AUTORIZADO' : 'NÃO AUTORIZADO';

                      return (
                        <button
                          key={option.id}
                          type="button"
                          role="menuitem"
                          disabled={switchingArea !== null || (!authorized && !canTestDemo)}
                          onClick={() => selectArea(option.id)}
                          aria-label={`${option.title}: ${status}`}
                          className={`h-12 w-full rounded-[12px] px-[10px] flex items-center justify-between gap-2 text-left transition disabled:cursor-not-allowed disabled:opacity-60 ${
                            isSelected
                              ? 'bg-[#ddedea] dark:bg-[#12302b]'
                              : 'hover:bg-[#f4f8f7] dark:hover:bg-[#17232c]'
                          }`}
                        >
                          <span className="min-w-0 flex items-center gap-[9px]">
                            <span className={`w-6 h-6 shrink-0 rounded-full flex items-center justify-center ${
                              isSelected
                                ? 'bg-white dark:bg-[#0b1117] text-[#0d6e65] dark:text-[#5ee0b5]'
                                : 'border border-[#c7d8d4] dark:border-[#3a5054] text-[#527277] dark:text-[#90aaa7]'
                            }`}>
                              {isSelected ? <IconCheck size={13} /> : option.icon}
                            </span>
                            <span className="min-w-0 flex flex-col">
                              <span className="truncate text-[11px] leading-[14px] font-semibold text-[#0d3b42] dark:text-[#f3f7f6]">
                                {option.title}
                              </span>
                              <span className="truncate text-[9px] leading-[12px] text-[#527277] dark:text-[#90aaa7]">
                                {option.description}
                              </span>
                            </span>
                          </span>
                          <span className={`shrink-0 rounded-full px-[7px] py-[4px] text-[8px] leading-[10px] font-bold tracking-[0.02em] ${
                            authorized
                              ? 'bg-[#e3f3ee] text-[#14745f] dark:bg-[#12302b] dark:text-[#5ee0b5]'
                              : canTestDemo
                                ? 'bg-[#fff1df] text-[#8a4d17] dark:bg-[#342516] dark:text-[#f4a261]'
                                : 'bg-[#f1f3f2] text-[#647775] dark:bg-[#17232c] dark:text-[#90aaa7]'
                          }`}>
                            {switchingArea === option.id ? 'ABRINDO' : status}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {switchError && (
                    <p role="alert" className="mx-1 mt-1 rounded-lg bg-rose-50 dark:bg-rose-950/40 px-2 py-1.5 text-[10px] leading-4 text-rose-700 dark:text-rose-300">
                      {switchError}
                    </p>
                  )}

                  <div className="my-1 border-t border-[#c7d8d4] dark:border-[#273a3b]" />

                  <div className="flex h-[22px] items-center justify-between px-2">
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setIsDropdownOpen(false);
                        setIsAccountOpen(true);
                      }}
                      className="text-[10px] font-medium text-[#315b5d] hover:text-[#0d3b42] dark:text-[#b9d2cf] dark:hover:text-white"
                    >
                      Minha conta
                    </button>
                    {onLogout && (
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setIsDropdownOpen(false);
                          onLogout();
                        }}
                        className="text-[10px] font-medium text-[#315b5d] hover:text-[#0d3b42] dark:text-[#b9d2cf] dark:hover:text-white"
                      >
                        Sair
                      </button>
                    )}
                  </div>
                </div>
              )}

              {isAccountOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4" onMouseDown={(event) => {
                  if (event.target === event.currentTarget) setIsAccountOpen(false);
                }}>
                  <section
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="account-dialog-title"
                    className="w-full max-w-sm rounded-2xl border border-[#c7d8d4] bg-white p-6 text-[#0d3b42] shadow-2xl dark:border-[#273a3b] dark:bg-[#111b24] dark:text-[#f3f7f6]"
                  >
                    <h2 id="account-dialog-title" className="text-base font-bold">Minha conta</h2>
                    <dl className="mt-4 space-y-3 text-xs">
                      <div>
                        <dt className="text-[#527277] dark:text-[#90aaa7]">Nome</dt>
                        <dd className="mt-0.5 font-semibold">{currentUser.name}</dd>
                      </div>
                      <div>
                        <dt className="text-[#527277] dark:text-[#90aaa7]">Ambiente atual</dt>
                        <dd className="mt-0.5 font-semibold">{currentAreaLabel}</dd>
                      </div>
                    </dl>
                    <button
                      type="button"
                      onClick={() => setIsAccountOpen(false)}
                      className="mt-6 h-10 w-full rounded-xl bg-[#f4a261] text-sm font-semibold text-[#0d3b42] dark:bg-[#5ee0b5] dark:text-[#092018]"
                    >
                      Fechar
                    </button>
                  </section>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
