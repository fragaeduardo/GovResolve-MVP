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
  IconMoon
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
  const [citizenCpf, setCitizenCpf] = useState('529.982.247-25');
  const [citizenPassword, setCitizenPassword] = useState('gov12345');
  const [citizenName, setCitizenName] = useState('Carlos Eduardo da Silva');
  
  // Estado Servidor
  const [serverMatricula, setServerMatricula] = useState('529.982.247-25');
  const [serverPassword, setServerPassword] = useState('servidor2024');
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
      const result = await api.login(loginId, 'servidor', name);
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
      const result = await api.login(loginId, 'servidor', name);
      onLoginSuccess(result.user);
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao realizar login.');
    } finally {
      setLoading(false);
    }
  };

  const fillQuickCitizen = () => {
    setCitizenCpf('529.982.247-25');
    setCitizenPassword('gov12345');
    setCitizenName('Carlos Eduardo da Silva');
    handleCitizenLogin();
  };

  const fillQuickServer = () => {
    setServerMatricula('529.982.247-25');
    setServerPassword('servidor2024');
    setServerName('Carlos Eduardo da Silva');
    handleServerLogin();
  };

  return (
    <div className={`min-h-screen flex flex-col justify-between ${
      isHighContrast ? 'high-contrast' : 'bg-slate-100/90 dark:bg-[#0b0f19] text-slate-800 dark:text-slate-100 transition-colors duration-200'
    }`}>
      
      {/* Top Header Simplificado da Página de Login */}
      <header className="bg-slate-900 text-white px-4 sm:px-8 py-3.5 flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-xs">
            <IconBuilding size={18} className="text-white" />
          </div>
          <div>
            <span className="font-semibold text-base tracking-tight text-white block">GovResolve</span>
            <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider block">Sistema de Ouvidoria Integrada</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Alternância de Modo Escuro / Claro Confortável */}
          {onToggleTheme && !isHighContrast && (
            <button
              type="button"
              onClick={onToggleTheme}
              aria-label={theme === 'dark' ? 'Mudar para modo claro suave' : 'Mudar para modo escuro repousante'}
              title={theme === 'dark' ? 'Mudar para modo claro suave' : 'Mudar para modo escuro repousante'}
              className="w-9 h-9 rounded-full flex items-center justify-center transition-all bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:text-white"
            >
              {theme === 'dark' ? (
                <IconSun size={17} className="text-amber-300" />
              ) : (
                <IconMoon size={17} className="text-slate-300" />
              )}
            </button>
          )}

          <button
            type="button"
            onClick={onToggleContrast}
            aria-pressed={isHighContrast}
            aria-label="Alto contraste"
            title="Alternar alto contraste (WCAG/e-MAG)"
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
              isHighContrast
                ? 'bg-yellow-300 text-black border-2 border-yellow-300 shadow-xs'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
            }`}
          >
            <IconContrast size={18} className={isHighContrast ? 'text-black' : 'text-slate-200'} />
          </button>
        </div>
      </header>

      {/* Container Principal de Login Centralizado */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6" role="main">
        <div className="w-full max-w-md bg-white dark:bg-[#111827] rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-md overflow-hidden login-card">
          
          {/* Seletor de Perfil de Login (Abas) */}
          <div className="grid grid-cols-2 p-1.5 bg-slate-100/80 dark:bg-[#0c121e] border-b border-slate-200 dark:border-slate-800" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'cidadao'}
              onClick={() => { setActiveTab('cidadao'); setErrorMsg(''); }}
              className={`py-2.5 px-3 rounded-xl font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition ${
                activeTab === 'cidadao'
                  ? 'bg-white dark:bg-[#1e293b] text-blue-700 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <IconUser size={16} />
              <span>Sou Cidadão</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'servidor'}
              onClick={() => { setActiveTab('servidor'); setErrorMsg(''); }}
              className={`py-2.5 px-3 rounded-xl font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition ${
                activeTab === 'servidor'
                  ? 'bg-white dark:bg-[#1e293b] text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <IconShield size={16} />
              <span>Sou Servidor</span>
            </button>
          </div>

          <div className="p-6 sm:p-8 space-y-6">
            
            {errorMsg && (
              <div role="alert" className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-lg text-xs text-rose-800 dark:text-rose-300">
                {errorMsg}
              </div>
            )}

            {/* ABA 1: LOGIN CIDADÃO (PADRÃO GOV.BR) */}
            {activeTab === 'cidadao' && (
              <form onSubmit={handleCitizenLogin} className="space-y-4">
                <div className="space-y-1 text-center">
                  <h1 className="text-base font-bold text-slate-900 dark:text-slate-100">Entrar com conta gov.br</h1>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Identificação segura unificada para envio de demandas municipais e acompanhamento em tempo real.
                  </p>
                </div>

                <div className="space-y-3 pt-2">
                  <div>
                    <label htmlFor="citizen-cpf" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      CPF ou Identificador
                    </label>
                    <div className="relative">
                      <input
                        id="citizen-cpf"
                        type="text"
                        value={citizenCpf}
                        onChange={(e) => setCitizenCpf(e.target.value)}
                        placeholder="Qualquer CPF ou usuário (MVP)"
                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#131d2e] border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:bg-white dark:focus:bg-[#172338] transition"
                      />
                      <div className="absolute right-3 top-3 text-slate-400 dark:text-slate-500">
                        <IconUser size={16} />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="citizen-pwd" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Senha gov.br
                    </label>
                    <div className="relative">
                      <input
                        id="citizen-pwd"
                        type="password"
                        value={citizenPassword}
                        onChange={(e) => setCitizenPassword(e.target.value)}
                        placeholder="Qualquer senha (esboço MVP)"
                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#131d2e] border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:bg-white dark:focus:bg-[#172338] transition"
                      />
                      <div className="absolute right-3 top-3 text-slate-400 dark:text-slate-500">
                        <IconLock size={16} />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-2 space-y-2.5">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-sm transition flex items-center justify-center gap-2 shadow-xs"
                  >
                    <span>{loading ? 'Autenticando...' : 'Entrar com gov.br'}</span>
                    <IconArrowRight size={16} />
                  </button>

                  <button
                    type="button"
                    onClick={fillQuickCitizen}
                    className="w-full py-2 px-3 bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium transition flex items-center justify-center gap-1.5"
                  >
                    <IconCheckCircle size={14} className="text-blue-600 dark:text-blue-400" />
                    <span>Acesso Rápido de Demonstração (Carlos Eduardo - Cidadão & Servidor)</span>
                  </button>
                </div>

                <p className="text-[11px] text-slate-400 dark:text-slate-500 text-center pt-2">
                  Ambiente de demonstração MVP: qualquer identificador ou senha é aceito sem validação de credencial real.
                </p>
              </form>
            )}

            {/* ABA 2: LOGIN SERVIDOR PÚBLICO */}
            {activeTab === 'servidor' && (
              <form onSubmit={handleServerLogin} className="space-y-4">
                <div className="space-y-1 text-center">
                  <h1 className="text-base font-bold text-slate-900 dark:text-slate-100">Portal do Servidor Municipal</h1>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Acesso para servidores, técnicos e gestores dos órgãos municipais cadastrados.
                  </p>
                </div>

                <div className="space-y-3 pt-2">
                  <div>
                    <label htmlFor="server-mat" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Matrícula Funcional ou E-mail
                    </label>
                    <div className="relative">
                      <input
                        id="server-mat"
                        type="text"
                        value={serverMatricula}
                        onChange={(e) => setServerMatricula(e.target.value)}
                        placeholder="Ex: 2024-8841 ou carlos@prefeitura.gov.br"
                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#131d2e] border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:bg-white dark:focus:bg-[#172338] transition"
                      />
                      <div className="absolute right-3 top-3 text-slate-400 dark:text-slate-500">
                        <IconShield size={16} />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="server-dept" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Órgão / Secretaria de Atuação
                    </label>
                    <select
                      id="server-dept"
                      value={selectedDept}
                      onChange={(e) => setSelectedDept(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#131d2e] border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:bg-white dark:focus:bg-[#172338] transition"
                    >
                      {departments.map((dept) => (
                        <option key={dept.id} value={dept.id}>
                          {dept.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="server-pwd" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Senha Funcional
                    </label>
                    <div className="relative">
                      <input
                        id="server-pwd"
                        type="password"
                        value={serverPassword}
                        onChange={(e) => setServerPassword(e.target.value)}
                        placeholder="Qualquer senha (esboço MVP)"
                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#131d2e] border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:bg-white dark:focus:bg-[#172338] transition"
                      />
                      <div className="absolute right-3 top-3 text-slate-400 dark:text-slate-500">
                        <IconLock size={16} />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-2 space-y-2.5">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500 text-white rounded-lg font-semibold text-sm transition flex items-center justify-center gap-2 shadow-xs"
                  >
                    <span>{loading ? 'Autenticando...' : 'Acessar Painel do Servidor'}</span>
                    <IconArrowRight size={16} />
                  </button>

                  <button
                    type="button"
                    onClick={fillQuickServer}
                    className="w-full py-2 px-3 bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium transition flex items-center justify-center gap-1.5"
                  >
                    <IconCheckCircle size={14} className="text-emerald-600 dark:text-emerald-400" />
                    <span>Acesso Rápido de Demonstração (Carlos Eduardo - Servidor & Cidadão)</span>
                  </button>
                </div>

                <p className="text-[11px] text-slate-400 dark:text-slate-500 text-center pt-2">
                  Ambiente de demonstração MVP: qualquer matrícula e senha são aceitos para teste das rotinas do servidor.
                </p>
              </form>
            )}

          </div>
        </div>
      </main>

      {/* Rodapé Institucional */}
      <footer className="py-3 px-4 text-center text-xs text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0b0f19]">
        <p>GovResolve • Ouvidoria e Participação Cidadã • Em conformidade com a LGPD e Lei Federal nº 13.460/2017</p>
      </footer>

    </div>
  );
};
