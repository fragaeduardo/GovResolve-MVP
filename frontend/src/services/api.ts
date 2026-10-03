const getApiBase = () => {
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  if (typeof window !== 'undefined' && window.location) {
    return `${window.location.protocol}//${window.location.hostname}:8000/api/v1`;
  }
  return 'http://localhost:8000/api/v1';
};

const API_BASE = getApiBase();

export interface Demand {
  id: number;
  protocol: string;
  title: string;
  description: string;
  status: 'ABERTO' | 'EM ANDAMENTO' | 'FECHADO';
  severity?: 'BAIXA' | 'MEDIA' | 'ALTA' | 'CRITICA';
  severity_justification?: string;
  service_type?: 'AUTOATENDIMENTO' | 'ATENDIMENTO_PUBLICO';
  category?: string;
  organized_summary?: string;
  resolution_notes?: string;
  department_id?: number;
  citizen_id: number;
  created_at: string;
  updated_at: string;
}

export interface Department {
  id: number;
  name: string;
  description: string;
  email: string;
}

export interface DepartmentComparison {
  department_id: number;
  department_name: string;
  email: string;
  total: number;
  aberto: number;
  em_andamento: number;
  fechado: number;
  critica: number;
  alta: number;
  media: number;
  baixa: number;
  resolution_rate: number;
}

export interface UserProfile {
  id: number;
  cpf: string;
  name: string;
  email: string;
  role: 'cidadao' | 'servidor' | 'gestor';
}

export interface ChatMessageItem {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatAgentResult {
  reply: string;
  ready_to_register: boolean;
  service_type?: 'AUTOATENDIMENTO' | 'ATENDIMENTO_PUBLICO';
  category?: string;
  department_name?: string;
  suggested_title?: string;
  suggested_description?: string;
  self_service_link?: string;
  self_service_instructions?: string;
  session_id?: string;
  missing_slots?: string[];
}

export interface FormalizeResponse {
  success: boolean;
  protocol: string;
  department_name: string;
  category: string;
  severity: 'BAIXA' | 'MEDIA' | 'ALTA' | 'CRITICA';
  severity_justification?: string;
  status: 'ABERTO' | 'EM ANDAMENTO' | 'FECHADO';
  title: string;
  description: string;
  reply: string;
  demand: Demand;
}

export const api = {
  // Autenticação
  async login(cpf: string, role: 'cidadao' | 'servidor', name?: string): Promise<{ token: string; user: UserProfile }> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cpf,
        name: name || (role === 'cidadao' ? 'Maria Silva' : 'Carlos Souza'),
        email: `${cpf}@exemplo.com.br`,
        role
      })
    });
    if (!res.ok) throw new Error((await res.json()).detail || 'Erro ao realizar login.');
    const data = await res.json();
    localStorage.setItem('govresolve_token', data.access_token);
    localStorage.setItem('govresolve_user', JSON.stringify(data.user));
    return { token: data.access_token, user: data.user };
  },

  getToken(): string | null {
    return localStorage.getItem('govresolve_token');
  },

  getCurrentUser(): UserProfile | null {
    const u = localStorage.getItem('govresolve_user');
    return u ? JSON.parse(u) : null;
  },

  // Chatbot com Agentes Inteligentes
  async sendChatMessage(messages: ChatMessageItem[], sessionId?: string): Promise<ChatAgentResult> {
    const token = this.getToken();
    const res = await fetch(`${API_BASE}/demands/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ messages, session_id: sessionId || undefined })
    });
    if (!res.ok) throw new Error((await res.json()).detail || 'Erro ao comunicar com o assistente.');
    return res.json();
  },

  // Formalização Multiagente com Execução de Tool no Banco de Dados
  async formalizeChatDemand(sessionId?: string, title?: string, description?: string): Promise<FormalizeResponse> {
    const token = this.getToken();
    const res = await fetch(`${API_BASE}/demands/chat/formalize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        session_id: sessionId || undefined,
        title: title || undefined,
        description: description || undefined
      })
    });
    if (!res.ok) throw new Error((await res.json()).detail || 'Erro ao formalizar demanda com o assistente.');
    return res.json();
  },

  // Demandas
  async createDemand(title: string, description: string): Promise<Demand> {
    const token = this.getToken();
    const res = await fetch(`${API_BASE}/demands`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ title, description })
    });
    if (!res.ok) throw new Error((await res.json()).detail || 'Erro ao registrar demanda.');
    return res.json();
  },

  async getDemandByProtocol(protocol: string): Promise<Demand> {
    const token = this.getToken();
    const res = await fetch(`${API_BASE}/demands/${encodeURIComponent(protocol)}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    if (!res.ok) throw new Error((await res.json()).detail || 'Demanda não encontrada.');
    return res.json();
  },

  async getMyDemands(): Promise<Demand[]> {
    const token = this.getToken();
    const res = await fetch(`${API_BASE}/demands/my`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error((await res.json()).detail || 'Erro ao buscar demandas.');
    return res.json();
  },

  async submitFeedback(protocol: string, rating: number, comment?: string) {
    const token = this.getToken();
    const res = await fetch(`${API_BASE}/demands/${encodeURIComponent(protocol)}/feedback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ rating, comment })
    });
    if (!res.ok) throw new Error((await res.json()).detail || 'Erro ao registrar avaliação.');
    return res.json();
  },

  logout() {
    localStorage.removeItem('govresolve_token');
    localStorage.removeItem('govresolve_user');
  },

  // Consulta de Órgãos e Secretarias
  async getDepartments(): Promise<Department[]> {
    try {
      const res = await fetch(`${API_BASE}/demands/departments`);
      if (!res.ok) return [];
      return res.json();
    } catch {
      return [];
    }
  },

  // Painel Servidor
  async getAdminDemands(
    statusFilter?: string,
    severityFilter?: string,
    departmentId?: number,
    orderByPriority?: boolean,
    search?: string
  ): Promise<Demand[]> {
    const token = this.getToken();
    const params = new URLSearchParams();
    if (statusFilter) params.append('status_filter', statusFilter);
    if (severityFilter) params.append('severity_filter', severityFilter);
    if (departmentId) params.append('department_id', departmentId.toString());
    if (orderByPriority) params.append('order_by_priority', 'true');
    if (search && search.trim()) params.append('search', search.trim());
    const qs = params.toString() ? `?${params.toString()}` : '';
    const url = `${API_BASE}/admin/demands${qs}`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error((await res.json()).detail || 'Erro ao carregar demandas.');
    return res.json();
  },

  async getDepartmentComparison(): Promise<DepartmentComparison[]> {
    const token = this.getToken();
    try {
      const res = await fetch(`${API_BASE}/admin/department-comparison`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) return [];
      return res.json();
    } catch {
      return [];
    }
  },

  async updateDemandStatus(protocol: string, newStatus: string, notes?: string, resolutionNotes?: string): Promise<Demand> {
    const token = this.getToken();
    const res = await fetch(`${API_BASE}/admin/demands/${encodeURIComponent(protocol)}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        new_status: newStatus,
        notes: notes || undefined,
        resolution_notes: resolutionNotes || undefined
      })
    });
    if (!res.ok) throw new Error((await res.json()).detail || 'Erro ao atualizar status.');
    return res.json();
  },

  async getStats() {
    const token = this.getToken();
    const res = await fetch(`${API_BASE}/admin/stats`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) return { total: 0, aberto: 0, em_andamento: 0, fechado: 0 };
    return res.json();
  }
};
