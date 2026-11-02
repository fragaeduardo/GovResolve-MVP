import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { Department, UserProfile, UserRole } from '../../types';
import { IconCivicSeal, IconArrowRight, IconSun, IconMoon } from '../../components/common/Icons';

interface LoginPageProps {
  onLoginSuccess: (user: UserProfile) => void;
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
  isHighContrast?: boolean;
  onToggleContrast?: () => void;
}

const profiles: { role: UserRole; label: string; description: string }[] = [
  { role: 'cidadao', label: 'Cidadão', description: 'Converse, revise a ficha e acompanhe seus protocolos.' },
  { role: 'servidor', label: 'Servidor', description: 'Consulte a fila do órgão e registre o atendimento.' },
  { role: 'gestor', label: 'Gestão', description: 'Compare os órgãos e revise encaminhamentos pendentes.' }
];

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess, theme = 'light', onToggleTheme, isHighContrast, onToggleContrast }) => {
  const [role, setRole] = useState<UserRole>('cidadao');
  const [departments, setDepartments] = useState<Department[]>([]);
  const [departmentId, setDepartmentId] = useState('');
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([api.getDemoConfig(), api.getDepartments()])
      .then(([config, items]) => { setEnabled(config.enabled); setDepartments(items); })
      .catch(() => { setEnabled(false); setError('Não foi possível consultar o ambiente. Confira se a API está disponível.'); });
  }, []);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true); setError('');
    try {
      const result = await api.demoLogin(role, role === 'servidor' ? Number(departmentId) : undefined);
      sessionStorage.removeItem('govresolve_manual_logout');
      onLoginSuccess(result.user);
    } catch (err: any) {
      setError(err.message || 'Não foi possível entrar.');
    } finally { setLoading(false); }
  };

  return (
    <div className={`min-h-screen flex flex-col bg-[#f1f6f5] text-[#0d3b42] dark:bg-[#0b1117] dark:text-[#f3f7f6] ${isHighContrast ? 'high-contrast' : ''}`}>
      <header className="flex items-center justify-between border-b border-[#c7d8d4] dark:border-[#273a3b] px-6 py-5">
        <div className="flex items-center gap-3"><IconCivicSeal size={34} /><div><strong className="text-lg">GovResolve</strong><p className="text-xs opacity-70">Serviços municipais em uma conversa</p></div></div>
        <div className="flex items-center gap-3">
          <button type="button" onClick={onToggleTheme} aria-label="Alternar tema" className="p-2 rounded-lg border border-current/20">{theme === 'dark' ? <IconSun size={18} /> : <IconMoon size={18} />}</button>
          <button type="button" onClick={onToggleContrast} aria-pressed={isHighContrast} className="text-xs p-2 rounded-lg border border-current/20">Alto contraste</button>
        </div>
      </header>
      <main className="flex-1 grid items-center gap-12 lg:grid-cols-2 max-w-6xl w-full mx-auto px-6 py-12">
        <section>
          <p className="text-xs font-semibold uppercase tracking-widest text-[#527277] dark:text-[#90aaa7]">Projeto acadêmico · Ciência da Computação</p>
          <h1 className="text-4xl sm:text-5xl font-bold leading-tight mt-5">Uma conversa.<br />Uma ficha clara.<br />Um protocolo para acompanhar.</h1>
          <p className="mt-6 text-base leading-relaxed max-w-md opacity-75">A IA ajuda a organizar a reclamação e sugere o órgão responsável. Você revisa a ficha e confirma antes do registro.</p>
          <ol className="mt-8 space-y-3 text-sm"><li>1. Conte o que aconteceu.</li><li>2. Revise as informações com o assistente.</li><li>3. Confirme e acompanhe o atendimento.</li></ol>
        </section>
        <section className="bg-white dark:bg-[#111b24] rounded-2xl border border-[#c7d8d4] dark:border-[#273a3b] p-7 shadow-sm" aria-labelledby="access-title">
          <span className="text-xs font-semibold uppercase tracking-widest text-[#527277] dark:text-[#90aaa7]">Ambiente de demonstração</span>
          <h2 id="access-title" className="text-2xl font-bold mt-2">Escolha seu perfil</h2>
          <p className="text-sm mt-2 opacity-70">Os perfis são fictícios. Esta versão não utiliza autenticação gov.br.</p>
          <div className="grid grid-cols-3 gap-2 mt-6" role="group" aria-label="Perfil de demonstração">
            {profiles.map(profile => <button key={profile.role} type="button" aria-pressed={role === profile.role} onClick={() => { setRole(profile.role); setError(''); }} className={`rounded-lg border px-2 py-3 text-sm font-semibold ${role === profile.role ? 'bg-[#0d3b42] text-white border-[#0d3b42] dark:bg-[#5ee0b5] dark:text-[#092018]' : 'border-[#c7d8d4] dark:border-[#273a3b]'}`}>{profile.label}</button>)}
          </div>
          <p className="min-h-12 text-sm mt-5 opacity-75">{profiles.find(profile => profile.role === role)?.description}</p>
          <form onSubmit={submit} className="space-y-5">
            {role === 'servidor' && <div><label htmlFor="demo-department" className="block text-sm font-semibold mb-2">Órgão de atendimento</label><select id="demo-department" required value={departmentId} onChange={event => setDepartmentId(event.target.value)} className="w-full rounded-lg border border-[#c7d8d4] dark:border-[#273a3b] bg-transparent p-3 text-sm"><option value="">Selecione um órgão</option>{departments.map(dept => <option key={dept.id} value={dept.id}>{dept.name}</option>)}</select></div>}
            {enabled === false && !error && <p role="status" className="text-sm">O modo de demonstração está desativado neste ambiente.</p>}
            {error && <p role="alert" className="text-sm text-red-700 dark:text-red-300">{error}</p>}
            <button type="submit" disabled={loading || !enabled} className="w-full rounded-xl p-3 font-semibold bg-[#f4a261] text-[#0d3b42] disabled:opacity-50 flex justify-center items-center gap-3">{loading ? 'Entrando...' : enabled === null ? 'Consultando ambiente...' : 'Entrar na demonstração'}<IconArrowRight size={18} /></button>
          </form>
        </section>
      </main>
      <footer className="text-center text-xs px-6 py-5 opacity-65">Grupo 10 · Ctrl+Z · Engenharia de Software · UFG · 2026</footer>
    </div>
  );
};
