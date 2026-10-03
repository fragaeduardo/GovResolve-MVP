import React, { useState, useEffect } from 'react';
import { api, UserProfile, Department } from '../services/api';
import {
  IconBuilding,
  IconUser,
  IconShield,
  IconLock,
  IconArrowRight,
  IconContrast,
  IconCheckCircle
} from '../components/Icons';

interface LoginPageProps {
  onLoginSuccess: (user: UserProfile) => void;
  isHighContrast: boolean;
  onToggleContrast: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onLoginSuccess,
  isHighContrast,
  onToggleContrast
}) => {
  const [activeTab, setActiveTab] = useState<'cidadao' | 'servidor'>('cidadao');
  
  // Estado Cidadão
  const [citizenCpf, setCitizenCpf] = useState('');
  const [citizenPassword, setCitizenPassword] = useState('');
  const [citizenName, setCitizenName] = useState('Maria Silva');
  
  // Estado Servidor
  const [serverMatricula, setServerMatricula] = useState('');
  const [serverPassword, setServerPassword] = useState('');
  const [serverName, setServerName] = useState('Carlos Souza');
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
      const loginId = citizenCpf.trim() || '11111111111';
      const name = citizenName.trim() || 'Maria Silva';
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
      const loginId = serverMatricula.trim() || '22222222222';
      const name = serverName.trim() || 'Carlos Souza';
      const result = await api.login(loginId, 'servidor', name);
      onLoginSuccess(result.user);
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao realizar login.');
    } finally {
      setLoading(false);
    }
  };

  const fillQuickCitizen = () => {
    setCitizenCpf('111.222.333-44');
    setCitizenPassword('senha123');
    setCitizenName('Maria Silva');
    handleCitizenLogin();
  };

  const fillQuickServer = () => {
    setServerMatricula('MAT-2024-0912');
    setServerPassword('servidor2024');
    setServerName('Carlos Souza');
    handleServerLogin();
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-slate-100 text-slate-900 transition-colors duration-200">
      
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
      </header>

      {/* Container Principal de Login Centralizado */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6" role="main">
        <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden login-card">
          
          {/* Seletor de Perfil de Login (Abas) */}
          <div className="grid grid-cols-2 p-1.5 bg-slate-100/80 border-b border-slate-200" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'cidadao'}
              onClick={() => { setActiveTab('cidadao'); setErrorMsg(''); }}
              className={`py-2.5 px-3 rounded-xl font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition ${
                activeTab === 'cidadao'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
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
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <IconShield size={16} />
              <span>Sou Servidor</span>
            </button>
          </div>

          <div className="p-6 sm:p-8 space-y-6">
            
            {errorMsg && (
              <div role="alert" className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800">
                {errorMsg}
              </div>
            )}

            {/* ABA 1: LOGIN CIDADÃO (PADRÃO GOV.BR) */}
            {activeTab === 'cidadao' && (
              <form onSubmit={handleCitizenLogin} className="space-y-4">
                <div className="space-y-1 text-center">
                  <h1 className="text-base font-bold text-slate-900">Entrar com conta gov.br</h1>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Identificação segura unificada para envio de demandas municipais e acompanhamento em tempo real.
                  </p>
                </div>

                <div className="space-y-3 pt-2">
                  <div>
                    <label htmlFor="citizen-cpf" className="block text-xs font-semibold text-slate-700 mb-1">
                      CPF ou Identificador
                    </label>
                    <div className="relative">
                      <input
                        id="citizen-cpf"
                        type="text"
                        value={citizenCpf}
                        onChange={(e) => setCitizenCpf(e.target.value)}
                        placeholder="Qualquer CPF ou usuário (MVP)"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                      />
                      <div className="absolute right-3 top-3 text-slate-400">
                        <IconUser size={16} />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="citizen-pwd" className="block text-xs font-semibold text-slate-700 mb-1">
                      Senha gov.br
                    </label>
                    <div className="relative">
                      <input
                        id="citizen-pwd"
                        type="password"
                        value={citizenPassword}
                        onChange={(e) => setCitizenPassword(e.target.value)}
                        placeholder="Qualquer senha (esboço MVP)"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                      />
                      <div className="absolute right-3 top-3 text-slate-400">
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
                    className="w-full py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition flex items-center justify-center gap-1.5"
                  >
                    <IconCheckCircle size={14} className="text-blue-600" />
                    <span>Acesso Rápido de Demonstração (Maria Silva)</span>
                  </button>
                </div>

                <p className="text-[11px] text-slate-400 text-center pt-2">
                  Ambiente de demonstração MVP: qualquer identificador ou senha é aceito sem validação de credencial real.
                </p>
              </form>
            )}

            {/* ABA 2: LOGIN SERVIDOR PÚBLICO */}
            {activeTab === 'servidor' && (
              <form onSubmit={handleServerLogin} className="space-y-4">
                <div className="space-y-1 text-center">
                  <h1 className="text-base font-bold text-slate-900">Portal do Servidor Municipal</h1>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Acesso para servidores, técnicos e gestores dos órgãos municipais cadastrados.
                  </p>
                </div>

                <div className="space-y-3 pt-2">
                  <div>
                    <label htmlFor="server-mat" className="block text-xs font-semibold text-slate-700 mb-1">
                      Matrícula Funcional ou E-mail
                    </label>
                    <div className="relative">
                      <input
                        id="server-mat"
                        type="text"
                        value={serverMatricula}
                        onChange={(e) => setServerMatricula(e.target.value)}
                        placeholder="Ex: 2024-8841 ou carlos@prefeitura.gov.br"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                      />
                      <div className="absolute right-3 top-3 text-slate-400">
                        <IconShield size={16} />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="server-dept" className="block text-xs font-semibold text-slate-700 mb-1">
                      Órgão / Secretaria de Atuação
                    </label>
                    <select
                      id="server-dept"
                      value={selectedDept}
                      onChange={(e) => setSelectedDept(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                    >
                      {departments.map((dept) => (
                        <option key={dept.id} value={dept.id}>
                          {dept.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="server-pwd" className="block text-xs font-semibold text-slate-700 mb-1">
                      Senha Funcional
                    </label>
                    <div className="relative">
                      <input
                        id="server-pwd"
                        type="password"
                        value={serverPassword}
                        onChange={(e) => setServerPassword(e.target.value)}
                        placeholder="Qualquer senha (esboço MVP)"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                      />
                      <div className="absolute right-3 top-3 text-slate-400">
                        <IconLock size={16} />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-2 space-y-2.5">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold text-sm transition flex items-center justify-center gap-2 shadow-xs"
                  >
                    <span>{loading ? 'Autenticando...' : 'Acessar Painel do Servidor'}</span>
                    <IconArrowRight size={16} />
                  </button>

                  <button
                    type="button"
                    onClick={fillQuickServer}
                    className="w-full py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition flex items-center justify-center gap-1.5"
                  >
                    <IconCheckCircle size={14} className="text-emerald-600" />
                    <span>Acesso Rápido de Demonstração (Carlos Souza - SEINFRA)</span>
                  </button>
                </div>

                <p className="text-[11px] text-slate-400 text-center pt-2">
                  Ambiente de demonstração MVP: qualquer matrícula e senha são aceitos para teste das rotinas do servidor.
                </p>
              </form>
            )}

          </div>
        </div>
      </main>

      {/* Rodapé Institucional */}
      <footer className="py-3 px-4 text-center text-xs text-slate-500 border-t border-slate-200 bg-white">
        <p>GovResolve • Ouvidoria e Participação Cidadã • Em conformidade com a LGPD e Lei Federal nº 13.460/2017</p>
      </footer>

    </div>
  );
};
