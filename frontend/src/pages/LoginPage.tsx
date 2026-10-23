import React, { useEffect, useState } from 'react';
import { api, Department, UserProfile } from '../services/api';
import {
  IconCivicSeal, IconUser, IconShield, IconBuilding,
  IconContrast, IconSun, IconMoon, IconArrowRight
} from '../components/Icons';

interface LoginPageProps {
  onLoginSuccess: (user: UserProfile) => void;
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
  isHighContrast: boolean;
  onToggleContrast: () => void;
}

type DemoRole = 'cidadao' | 'servidor' | 'gestor';

const profiles: {
  role: DemoRole; title: string; description: string;
}[] = [
  { role: 'cidadao', title: 'Cidadão', description: 'Conversar com a IA, registrar e acompanhar minhas solicitações.' },
  { role: 'servidor', title: 'Servidor', description: 'Atender solicitações vinculadas a um órgão específico.' },
  { role: 'gestor', title: 'Gestor', description: 'Visualizar todas as filas, indicadores e órgãos.' }
];

export const LoginPage: React.FC<LoginPageProps> = ({
  onLoginSuccess, theme = 'dark', onToggleTheme,
  isHighContrast, onToggleContrast
}) => {
  const [role, setRole] = useState<DemoRole>('cidadao');
  const [departments, setDepartments] = useState<Department[]>([]);
  const [departmentId, setDepartmentId] = useState<number | ''>('');
  const [demoEnabled, setDemoEnabled] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getDemoConfig().then(result => setDemoEnabled(result.enabled))
      .catch(() => setDemoEnabled(false));
    api.getDepartments().then(items => {
      setDepartments(items);
      if (items.length > 0) setDepartmentId(items[0].id);
    }).catch(() => setDepartments([]));
  }, []);

  const enterDemo = async (event: React.FormEvent) => {
    event.preventDefault();
    if (role === 'servidor' && departmentId === '') {
      setError('Selecione um órgão para o perfil de servidor.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const user = await api.demoLogin(
        role, role === 'servidor' ? Number(departmentId) : undefined
      );
      onLoginSuccess(user);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao iniciar demonstração.');
    } finally {
      setLoading(false);
    }
  };

  const iconFor = (value: DemoRole) => {
    if (value === 'cidadao') return <IconUser size={22} />;
    if (value === 'servidor') return <IconBuilding size={22} />;
    return <IconShield size={22} />;
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0b0f19] text-slate-900 dark:text-slate-100 flex flex-col">
      <header className="bg-slate-900 text-white border-b border-slate-800 px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <IconCivicSeal size={30} />
          <div>
            <p className="font-bold text-lg leading-5">GovResolve</p>
            <p className="text-xs text-slate-300">Projeto acadêmico • Demonstração</p>
          </div>
        </div>
        <div className="flex gap-2">
          {onToggleTheme && !isHighContrast && (
            <button type="button" aria-label="Alternar tema" onClick={onToggleTheme}
              className="rounded-lg p-2 bg-slate-800">
              {theme === 'dark' ? <IconSun size={18} /> : <IconMoon size={18} />}
            </button>
          )}
          <button type="button" aria-label="Alternar alto contraste" aria-pressed={isHighContrast}
            onClick={onToggleContrast} className="rounded-lg p-2 bg-slate-800">
            <IconContrast size={18} />
          </button>
        </div>
      </header>
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <form onSubmit={enterDemo} className="max-w-3xl w-full bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 sm:p-9 shadow-lg space-y-6">
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-300">Modo de demonstração</p>
            <h1 className="font-extrabold text-2xl sm:text-3xl">Escolha como deseja acessar</h1>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Simule um perfil para conhecer as funcionalidades. Este acesso não utiliza nem representa uma conta gov.br real.
            </p>
          </div>
          <fieldset>
            <legend className="text-sm font-semibold mb-3">Perfil de acesso</legend>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {profiles.map(item => (
                <label key={item.role}
                  className={`relative cursor-pointer border-2 rounded-xl p-4 flex flex-col gap-2 transition-colors ${
                    role === item.role
                      ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/50'
                      : 'border-slate-200 dark:border-slate-700 hover:border-blue-400'
                  }`}>
                  <input type="radio" name="demo-role" value={item.role}
                    checked={role === item.role}
                    onChange={() => { setRole(item.role); setError(''); }}
                    className="absolute top-3 right-3" />
                  <span className="text-blue-700 dark:text-blue-300">{iconFor(item.role)}</span>
                  <span className="font-bold">{item.title}</span>
                  <span className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">{item.description}</span>
                </label>
              ))}
            </div>
          </fieldset>

          {role === 'servidor' && (
            <div className="space-y-2">
              <label htmlFor="demo-department" className="block font-semibold text-sm">
                Órgão de atuação do servidor
              </label>
              <select id="demo-department" required value={departmentId}
                onChange={e => setDepartmentId(Number(e.target.value))}
                className="w-full p-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm">
                {departments.length === 0 && <option value="">Nenhum órgão disponível</option>}
                {departments.map(d => <option value={d.id} key={d.id}>{d.name}</option>)}
              </select>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                O servidor poderá consultar e alterar apenas demandas deste órgão.
              </p>
            </div>
          )}

          {demoEnabled === false && (
            <p role="status" className="text-sm p-3 rounded-lg border border-amber-500 text-amber-800 dark:text-amber-200">
              Modo de demonstração desativado. Para testar localmente, configure DEMO_MODE=True no .env do backend e reinicie o servidor.
            </p>
          )}
          {error && <p role="alert" className="text-sm text-red-700 dark:text-red-300">{error}</p>}
          <button type="submit" disabled={loading || demoEnabled !== true || (role === 'servidor' && departmentId === '')}
            className="w-full rounded-lg bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white p-3 font-semibold flex items-center justify-center gap-2">
            {loading ? 'Preparando acesso...' : `Entrar como ${profiles.find(p => p.role === role)?.title}`}
            <IconArrowRight size={17} />
          </button>
          <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
            Ambiente fictício. Não informe CPFs, senhas reais ou dados pessoais.
          </p>
        </form>
      </main>
    </div>
  );
};
