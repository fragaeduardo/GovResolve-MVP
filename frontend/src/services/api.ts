const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

export interface Demand {
  id: number;
  protocol: string;
  title: string;
  description: string;
  status: 'ABERTO' | 'EM ANDAMENTO' | 'FECHADO';
  service_type?: 'AUTOATENDIMENTO' | 'ATENDIMENTO_PUBLICO';
  category?: string;
  organized_summary?: string;
  resolution_notes?: string;
  department_id?: number;
  citizen_id: number;
  created_at: string;
  updated_at: string;
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
  async sendChatMessage(messages: ChatMessageItem[]): Promise<ChatAgentResult> {
    const token = this.getToken();
    const res = await fetch(`${API_BASE}/demands/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ messages })
    });
    if (!res.ok) throw new Error((await res.json()).detail || 'Erro ao comunicar com o assistente.');
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

  // Painel Servidor
  async getAdminDemands(statusFilter?: string): Promise<Demand[]> {
    const token = this.getToken();
    const url = statusFilter ? `${API_BASE}/admin/demands?status_filter=${statusFilter}` : `${API_BASE}/admin/demands`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error((await res.json()).detail || 'Erro ao carregar demandas.');
    return res.json();
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
