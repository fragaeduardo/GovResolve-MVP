import React, { useState, useEffect } from 'react';
import { api, UserProfile, Department } from '../services/api';
import {
  IconBuilding,
  IconUser,
  IconShield,
  IconLock,
  IconArrowRight,
  IconContrast,
  IconCheckCircle,
  IconSun,
  IconMoon,
  IconCivicSeal,
  IconCertificate,
  IconFileCheck,
  IconClock
} from '../components/Icons';

interface LoginPageProps {
  onLoginSuccess: (user: UserProfile) => void;
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
  isHighContrast: boolean;
  onToggleContrast: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onLoginSuccess,
  theme = 'dark',
  onToggleTheme,
  isHighContrast,
  onToggleContrast
}) => {
  const [activeTab, setActiveTab] = useState<'cidadao' | 'servidor'>('cidadao');
  
  // Estado Cidadão
  const [citizenCpf, setCitizenCpf] = useState('123.456.789-01');
  const [citizenPassword, setCitizenPassword] = useState('gov12345');
  const [citizenName, setCitizenName] = useState('Carlos Eduardo da Silva');
  
  // Estado Servidor
  const [serverMatricula, setServerMatricula] = useState('529.982.247-25');
  const [serverPassword, setServerPassword] = useState('');
  const [serverName, setServerName] = useState('Carlos Eduardo da Silva');
  const [selectedDept, setSelectedDept] = useState<number | ''>('');
  const [departments, setDepartments] = useState<Department[]>([]);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    loadDepartments();
  }, []);

  const loadDepartments = async () => {
    try {
      const list = await api.getDepartments();
      setDepartments(list);
      if (list.length > 0) {
        setSelectedDept(list[0].id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCitizenLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    try {
      const loginId = citizenCpf.trim() || '529.982.247-25';
      const name = citizenName.trim() || 'Carlos Eduardo da Silva';
      const result = await api.login(loginId, 'cidadao', name);
      onLoginSuccess(result.user);
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao realizar login.');
    } finally {
      setLoading(false);
    }
  };

  const handleServerLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    try {
      const loginId = serverMatricula.trim() || '529.982.247-25';
      const name = serverName.trim() || 'Carlos Eduardo da Silva';
      const result = await api.login(loginId, 'servidor', name, serverPassword);
      onLoginSuccess(result.user);
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao realizar login.');
    } finally {
      setLoading(false);
    }
  };

  const fillQuickCitizen = () => {
    setCitizenCpf('123.456.789-01');
    setCitizenPassword('gov12345');
    setCitizenName('Carlos Eduardo da Silva');
    handleCitizenLogin();
  };

  const fillQuickServer = () => {
    setServerMatricula('529.982.247-25');
    setServerPassword('');
    setServerName('Carlos Eduardo da Silva');
    handleServerLogin();
  };

  return (
    <div className={`min-h-screen flex flex-col justify-between ${
      isHighContrast ? 'high-contrast' : 'bg-civic-slate-50 dark:bg-civic-slate-950 text-civic-slate-900 dark:text-civic-slate-100 transition-colors duration-200'
    }`}>
      
      {/* Top Header Institucional da Página de Acesso */}
      <header className="bg-civic-slate-900 text-white px-4 sm:px-8 py-3 flex items-center justify-between border-b border-civic-slate-800" role="banner">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-md bg-civic-slate-800 border border-civic-slate-700 flex items-center justify-center text-amber-400 shadow-xs">
            <IconCivicSeal size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm tracking-tight text-white uppercase">Projeto acadêmico • Simulação de Goiânia</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-sm bg-civic-slate-800 text-civic-slate-300 border border-civic-slate-700 font-mono">OUVIDORIA</span>
            </div>
            <span className="text-[11px] text-civic-slate-400 font-mono tracking-wider block">GovResolve • Sistema de Ouvidoria Integrada</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Alternância de Modo Escuro / Claro */}
          {onToggleTheme && !isHighContrast && (
            <button
              type="button"
              onClick={onToggleTheme}
              aria-label={theme === 'dark' ? 'Mudar para modo claro' : 'Mudar para modo escuro'}
              title={theme === 'dark' ? 'Mudar para modo claro' : 'Mudar para modo escuro'}
              className="w-8 h-8 rounded-md flex items-center justify-center transition-all bg-civic-slate-800 hover:bg-civic-slate-700 text-civic-slate-300 border border-civic-slate-700 hover:text-white"
            >
              {theme === 'dark' ? (
                <IconSun size={15} className="text-amber-300" />
              ) : (
                <IconMoon size={15} className="text-civic-slate-300" />
              )}
            </button>
          )}

          <button
            type="button"
            onClick={onToggleContrast}
            aria-pressed={isHighContrast}
            aria-label="Alto contraste"
            title="Alternar modo de alto contraste (WCAG 2.1 AAA / e-MAG)"
            className={`w-8 h-8 rounded-md flex items-center justify-center transition-all ${
              isHighContrast
                ? 'bg-yellow-300 text-black border-2 border-yellow-300'
                : 'bg-civic-slate-800 hover:bg-civic-slate-700 text-civic-slate-300 border border-civic-slate-700 hover:text-white'
            }`}
          >
            <IconContrast size={16} />
          </button>
        </div>
      </header>

      {/* Conteúdo Principal — Duas Colunas Institucionais */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-10" role="main">
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Coluna Esquerda: Contextualização Cívica & Pilares Normativos (Desktop) */}
          <div className="lg:col-span-6 space-y-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm bg-civic-blue-50 dark:bg-civic-blue-950/60 border border-civic-blue-200 dark:border-civic-blue-800/80 text-[11px] font-mono font-medium text-civic-blue-900 dark:text-civic-blue-300">
                <IconCertificate size={13} />
                <span>Lei Federal nº 13.460/2017 • Transparência Ativa</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-civic-slate-900 dark:text-white tracking-tight leading-tight">
                Balcão Unificado de Zeladoria & Ouvidoria
              </h1>
              <p className="text-sm text-civic-slate-600 dark:text-civic-slate-300 leading-relaxed">
                Canal centralizado da Ouvidoria-Geral para autuação e despacho de demandas de zeladoria urbana, serviços municipais e proteção dos direitos dos usuários de serviços públicos.
              </p>
            </div>

            {/* Pilares Institucionais */}
            <div className="space-y-3 pt-1">
              <div className="p-3.5 rounded-lg bg-white dark:bg-civic-slate-900/80 border border-civic-slate-200 dark:border-civic-slate-800 flex gap-3 items-start shadow-xs">
                <div className="w-8 h-8 rounded-md bg-civic-slate-100 dark:bg-civic-slate-800 border border-civic-slate-300 dark:border-civic-slate-700 flex items-center justify-center text-civic-blue-700 dark:text-civic-blue-400 shrink-0">
                  <IconFileCheck size={16} />
                </div>
                <div className="space-y-0.5">
                  <h2 className="text-xs font-bold text-civic-slate-900 dark:text-civic-slate-100">Autuação Administrativa Imediata</h2>
                  <p className="text-[11px] text-civic-slate-500 dark:text-civic-slate-400 leading-normal">
                    Geração de protocolo auditável com data, hora e hash de validação formal em segundos.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-lg bg-white dark:bg-civic-slate-900/80 border border-civic-slate-200 dark:border-civic-slate-800 flex gap-3 items-start shadow-xs">
                <div className="w-8 h-8 rounded-md bg-civic-slate-100 dark:bg-civic-slate-800 border border-civic-slate-300 dark:border-civic-slate-700 flex items-center justify-center text-emerald-700 dark:text-emerald-400 shrink-0">
                  <IconBuilding size={16} />
                </div>
                <div className="space-y-0.5">
                  <h2 className="text-xs font-bold text-civic-slate-900 dark:text-civic-slate-100">Despacho entre 12 Órgãos Municipais</h2>
                  <p className="text-[11px] text-civic-slate-500 dark:text-civic-slate-400 leading-normal">
                    Triagem técnica com endereçamento direto a secretarias como SEINFRA, COMURG, SMS, SMM e SANEAGO.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-lg bg-white dark:bg-civic-slate-900/80 border border-civic-slate-200 dark:border-civic-slate-800 flex gap-3 items-start shadow-xs">
                <div className="w-8 h-8 rounded-md bg-civic-slate-100 dark:bg-civic-slate-800 border border-civic-slate-300 dark:border-civic-slate-700 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                  <IconClock size={16} />
                </div>
                <div className="space-y-0.5">
                  <h2 className="text-xs font-bold text-civic-slate-900 dark:text-civic-slate-100">Controle Operacional de SLA</h2>
                  <p className="text-[11px] text-civic-slate-500 dark:text-civic-slate-400 leading-normal">
                    Prazos regulamentares rigorosos (24h a 15 dias) conforme a gravidade e o risco comunitário relatado.
                  </p>
                </div>
              </div>
            </div>

            {/* Contato Oficial Central 156 */}
            <div className="pt-2 text-xs text-civic-slate-500 dark:text-civic-slate-400 flex items-center gap-2 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>Central Telefônica 156 • Atendimento de Segunda a Sexta, das 07h às 19h</span>
            </div>
          </div>

          {/* Coluna Direita: Caixa de Acesso & Autenticação */}
          <div className="lg:col-span-6 flex justify-center">
            <div className="w-full max-w-md bg-white dark:bg-civic-slate-900 rounded-xl border border-civic-slate-200 dark:border-civic-slate-800 shadow-sm overflow-hidden login-card">
              
              {/* Seletor de Perfil de Login (Abas Administrativas) */}
              <div className="grid grid-cols-2 p-1.5 bg-civic-slate-100 dark:bg-civic-slate-950 border-b border-civic-slate-200 dark:border-civic-slate-800" role="tablist">
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === 'cidadao'}
                  onClick={() => { setActiveTab('cidadao'); setErrorMsg(''); }}
                  className={`py-2.5 px-3 rounded-lg font-semibold text-xs flex items-center justify-center gap-2 transition ${
                    activeTab === 'cidadao'
                      ? 'bg-white dark:bg-civic-slate-800 text-civic-blue-700 dark:text-civic-blue-400 shadow-xs border border-civic-slate-200 dark:border-civic-slate-700'
                      : 'text-civic-slate-600 dark:text-civic-slate-400 hover:text-civic-slate-900 dark:hover:text-white'
                  }`}
                >
                  <IconUser size={15} />
                  <span>Sou Cidadão</span>
                </button>

                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === 'servidor'}
                  onClick={() => { setActiveTab('servidor'); setErrorMsg(''); }}
                  className={`py-2.5 px-3 rounded-lg font-semibold text-xs flex items-center justify-center gap-2 transition ${
                    activeTab === 'servidor'
                      ? 'bg-white dark:bg-civic-slate-800 text-civic-slate-900 dark:text-civic-slate-100 shadow-xs border border-civic-slate-200 dark:border-civic-slate-700'
                      : 'text-civic-slate-600 dark:text-civic-slate-400 hover:text-civic-slate-900 dark:hover:text-white'
                  }`}
                >
                  <IconShield size={15} />
                  <span>Sou Servidor</span>
                </button>
              </div>

              <div className="p-6 sm:p-7 space-y-5">
                
                {errorMsg && (
                  <div role="alert" className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-md text-xs text-rose-800 dark:text-rose-300">
                    {errorMsg}
                  </div>
                )}

                {/* ABA 1: LOGIN CIDADÃO (PADRÃO GOV.BR) */}
                {activeTab === 'cidadao' && (
                  <form onSubmit={handleCitizenLogin} className="space-y-4">
                    <div className="space-y-1">
                      <h2 className="text-sm font-bold text-civic-slate-900 dark:text-civic-slate-100">
                        Acesso do Cidadão (Demonstração)
                      </h2>
                      <p className="text-xs text-civic-slate-500 dark:text-civic-slate-400 leading-relaxed">
                        Acesso unificado para protocolo de demandas, acompanhamento de prazos e consulta de histórico.
                      </p>
                    </div>

                    <div className="space-y-3 pt-1">
                      <div>
                        <label htmlFor="citizen-cpf" className="block text-xs font-semibold text-civic-slate-700 dark:text-civic-slate-300 mb-1">
                          CPF do Titular
                        </label>
                        <div className="relative">
                          <input
                            id="citizen-cpf"
                            type="text"
                            value={citizenCpf}
                            onChange={(e) => setCitizenCpf(e.target.value)}
                            placeholder="000.000.000-00"
                            className="w-full px-3 py-2 bg-civic-slate-50 dark:bg-civic-slate-950 border border-civic-slate-300 dark:border-civic-slate-700 rounded-md text-xs font-mono text-civic-slate-900 dark:text-civic-slate-100 placeholder-civic-slate-400 outline-none focus:ring-1 focus:ring-civic-blue-600 focus:border-civic-blue-600 transition"
                          />
                          <div className="absolute right-2.5 top-2.5 text-civic-slate-400 dark:text-civic-slate-500">
                            <IconUser size={15} />
                          </div>
                        </div>
                      </div>

                      <div>
                        <label htmlFor="citizen-pwd" className="block text-xs font-semibold text-civic-slate-700 dark:text-civic-slate-300 mb-1">
                          Senha (não verificada nesta demonstração)
                        </label>
                        <div className="relative">
                          <input
                            id="citizen-pwd"
                            type="password"
                            value={citizenPassword}
                            onChange={(e) => setCitizenPassword(e.target.value)}
                            placeholder="••••••••••••"
                            className="w-full px-3 py-2 bg-civic-slate-50 dark:bg-civic-slate-950 border border-civic-slate-300 dark:border-civic-slate-700 rounded-md text-xs text-civic-slate-900 dark:text-civic-slate-100 placeholder-civic-slate-400 outline-none focus:ring-1 focus:ring-civic-blue-600 focus:border-civic-blue-600 transition"
                          />
                          <div className="absolute right-2.5 top-2.5 text-civic-slate-400 dark:text-civic-slate-500">
                            <IconLock size={15} />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 space-y-2">
                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-2.5 px-4 bg-civic-blue-700 hover:bg-civic-blue-800 text-white rounded-md font-semibold text-xs transition flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                      >
                        <span>{loading ? 'Validando identificação...' : 'Entrar com conta gov.br'}</span>
                        <IconArrowRight size={14} />
                      </button>

                      <button
                        type="button"
                        onClick={fillQuickCitizen}
                        className="w-full py-2 px-3 bg-civic-slate-100 dark:bg-civic-slate-800 hover:bg-civic-slate-200 dark:hover:bg-civic-slate-700 text-civic-slate-700 dark:text-civic-slate-300 border border-civic-slate-300 dark:border-civic-slate-700 rounded-md text-[11px] font-mono font-medium transition flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <IconCheckCircle size={13} className="text-civic-blue-600 dark:text-civic-blue-400" />
                        <span>Acesso de Demonstração (Carlos Eduardo • Cidadão & Servidor)</span>
                      </button>
                    </div>

                    <p className="text-[11px] text-civic-slate-400 dark:text-civic-slate-500 text-center pt-1 font-mono">
                      Ambiente de homologação: identificador aceito sem exigência de token real.
                    </p>
                  </form>
                )}

                {/* ABA 2: LOGIN SERVIDOR PÚBLICO */}
                {activeTab === 'servidor' && (
                  <form onSubmit={handleServerLogin} className="space-y-4">
                    <div className="space-y-1">
                      <h2 className="text-sm font-bold text-civic-slate-900 dark:text-civic-slate-100">
                        Credencial Funcional do Servidor
                      </h2>
                      <p className="text-xs text-civic-slate-500 dark:text-civic-slate-400 leading-relaxed">
                        Acesso exclusivo para servidores, fiscais e gestores de secretarias municipais.
                      </p>
                    </div>

                    <div className="space-y-3 pt-1">
                      <div>
                        <label htmlFor="server-mat" className="block text-xs font-semibold text-civic-slate-700 dark:text-civic-slate-300 mb-1">
                          Matrícula Funcional ou CPF
                        </label>
                        <div className="relative">
                          <input
                            id="server-mat"
                            type="text"
                            value={serverMatricula}
                            onChange={(e) => setServerMatricula(e.target.value)}
                            placeholder="Ex: 529.982.247-25 ou 2024-8841"
                            className="w-full px-3 py-2 bg-civic-slate-50 dark:bg-civic-slate-950 border border-civic-slate-300 dark:border-civic-slate-700 rounded-md text-xs font-mono text-civic-slate-900 dark:text-civic-slate-100 placeholder-civic-slate-400 outline-none focus:ring-1 focus:ring-civic-blue-600 focus:border-civic-blue-600 transition"
                          />
                          <div className="absolute right-2.5 top-2.5 text-civic-slate-400 dark:text-civic-slate-500">
                            <IconShield size={15} />
                          </div>
                        </div>
                      </div>

                      <div>
                        <label htmlFor="server-dept" className="block text-xs font-semibold text-civic-slate-700 dark:text-civic-slate-300 mb-1">
                          Órgão de Lotação
                        </label>
                        <select
                          id="server-dept"
                          value={selectedDept}
                          onChange={(e) => setSelectedDept(Number(e.target.value))}
                          className="w-full px-3 py-2 bg-civic-slate-50 dark:bg-civic-slate-950 border border-civic-slate-300 dark:border-civic-slate-700 rounded-md text-xs text-civic-slate-900 dark:text-civic-slate-100 outline-none focus:ring-1 focus:ring-civic-blue-600 focus:border-civic-blue-600 transition"
                        >
                          {departments.map((dept) => (
                            <option key={dept.id} value={dept.id}>
                              {dept.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label htmlFor="server-pwd" className="block text-xs font-semibold text-civic-slate-700 dark:text-civic-slate-300 mb-1">
                          Senha Funcional
                        </label>
                        <div className="relative">
                          <input
                            id="server-pwd"
                            type="password"
                            value={serverPassword}
                            onChange={(e) => setServerPassword(e.target.value)}
                            placeholder="••••••••••••"
                            className="w-full px-3 py-2 bg-civic-slate-50 dark:bg-civic-slate-950 border border-civic-slate-300 dark:border-civic-slate-700 rounded-md text-xs text-civic-slate-900 dark:text-civic-slate-100 placeholder-civic-slate-400 outline-none focus:ring-1 focus:ring-civic-blue-600 focus:border-civic-blue-600 transition"
                          />
                          <div className="absolute right-2.5 top-2.5 text-civic-slate-400 dark:text-civic-slate-500">
                            <IconLock size={15} />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 space-y-2">
                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-2.5 px-4 bg-civic-slate-900 hover:bg-civic-slate-800 dark:bg-civic-slate-800 dark:hover:bg-civic-slate-700 text-white rounded-md font-semibold text-xs transition flex items-center justify-center gap-2 shadow-xs cursor-pointer border border-civic-slate-700"
                      >
                        <span>{loading ? 'Autenticando...' : 'Acessar Painel do Servidor'}</span>
                        <IconArrowRight size={14} />
                      </button>

                      <button
                        type="button"
                        onClick={fillQuickServer}
                        className="w-full py-2 px-3 bg-civic-slate-100 dark:bg-civic-slate-800 hover:bg-civic-slate-200 dark:hover:bg-civic-slate-700 text-civic-slate-700 dark:text-civic-slate-300 border border-civic-slate-300 dark:border-civic-slate-700 rounded-md text-[11px] font-mono font-medium transition flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <IconCheckCircle size={13} className="text-emerald-600 dark:text-emerald-400" />
                        <span>Acesso Demonstrativo Servidor (Visão Geral de Despacho)</span>
                      </button>
                    </div>

                    <p className="text-[11px] text-civic-slate-400 dark:text-civic-slate-500 text-center pt-1 font-mono">
                      Ambiente de homologação: credencial funcional habilitada para testes operacionais.
                    </p>
                  </form>
                )}

              </div>
            </div>
          </div>

        </div>
      </main>

      {/* Rodapé Institucional Conforme Padrão do Governo Federal / Municipal */}
      <footer className="py-3 px-4 text-center text-[11px] font-mono text-civic-slate-500 dark:text-civic-slate-400 border-t border-civic-slate-200 dark:border-civic-slate-800 bg-white dark:bg-civic-slate-950" role="contentinfo">
        <p>República Federativa do Brasil • Estado de Goiás • Município de Goiânia • Ouvidoria Geral • Conforme Lei Federal nº 13.460/2017 e LGPD (Lei nº 13.709/2018)</p>
      </footer>

    </div>
  );
};
