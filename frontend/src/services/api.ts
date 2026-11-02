import {
  UserProfile,
  LoginResponse,
  ChatMessageItem,
  ChatAgentResult,
  ChatSessionState,
  ChatFormalizeResponse,
  ChatCancelResponse,
  Demand,
  DemandDetailed,
  Department,
  PaginatedResponse,
  ManagementOverview,
  DepartmentComparison,
  UserRole
} from '../types';

const getApiBase = (): string => {
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  return '/api/v1';
};

const API_BASE = getApiBase();

export function formatCPF(cpf?: string): string {
  if (!cpf) return '';
  const digits = cpf.replace(/\D/g, '');
  if (digits.length === 11) {
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`;
  }
  return cpf;
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errorDetail = 'Erro na requisição ao servidor.';
    try {
      const err = await res.json();
      errorDetail = err.detail || err.message || errorDetail;
    } catch {
      errorDetail = res.statusText || errorDetail;
    }
    const error = new Error(errorDetail);
    (error as any).status = res.status;
    throw error;
  }
  return res.json();
}

export const api = {
  // -------------------------------------------------------------
  // Token & Local Storage
  // -------------------------------------------------------------
  getToken(): string | null {
    return localStorage.getItem('govresolve_token');
  },

  getCurrentUser(): UserProfile | null {
    const raw = localStorage.getItem('govresolve_user');
    return raw ? JSON.parse(raw) : null;
  },

  saveAuth(token: string, user: UserProfile) {
    localStorage.setItem('govresolve_token', token);
    localStorage.setItem('govresolve_user', JSON.stringify(user));
  },

  logout() {
    localStorage.removeItem('govresolve_token');
    localStorage.removeItem('govresolve_user');
  },

  getAuthHeaders(): Record<string, string> {
    const token = this.getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  },

  // -------------------------------------------------------------
  // 1. Autenticação & Perfil Real (/auth)
  // -------------------------------------------------------------
  async getDemoConfig(): Promise<{ enabled: boolean }> {
    return handleResponse(await fetch(`${API_BASE}/auth/demo-config`));
  },

  async demoLogin(role: UserRole, departmentId?: number): Promise<LoginResponse> {
    const res = await fetch(`${API_BASE}/auth/demo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role, department_id: departmentId })
    });
    const data = await handleResponse<LoginResponse>(res);
    this.saveAuth(data.access_token, data.user);
    return data;
  },

  async login(cpf: string, role: UserRole = 'cidadao', name?: string, staffAccessCode?: string): Promise<LoginResponse> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cpf, role, name, staff_access_code: staffAccessCode })
    });
    const data = await handleResponse<LoginResponse>(res);
    this.saveAuth(data.access_token, data.user);
    return data;
  },

  async getReviewQueue(): Promise<Demand[]> {
    return handleResponse(await fetch(`${API_BASE}/admin/review`, { headers: this.getAuthHeaders() }));
  },

  async assignReview(protocol: string, departmentId: number): Promise<Demand> {
    return handleResponse(await fetch(`${API_BASE}/admin/review/${encodeURIComponent(protocol)}/assign`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', ...this.getAuthHeaders() },
      body: JSON.stringify({ department_id: departmentId })
    }));
  },

  async getMe(): Promise<UserProfile> {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: this.getAuthHeaders()
    });
    const user: UserProfile = await handleResponse<UserProfile>(res);
    localStorage.setItem('govresolve_user', JSON.stringify(user));
    return user;
  },

  // -------------------------------------------------------------
  // 2. Chatbot Multiagente & Fluxo HITL (/demands/chat)
  // -------------------------------------------------------------
  async sendChatMessage(
    messages: ChatMessageItem[],
    sessionId?: string
  ): Promise<ChatAgentResult> {
    const res = await fetch(`${API_BASE}/demands/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders()
      },
      body: JSON.stringify({
        messages,
        session_id: sessionId || undefined
      })
    });
    return handleResponse<ChatAgentResult>(res);
  },

  async getChatSession(sessionId: string): Promise<ChatSessionState> {
    const res = await fetch(`${API_BASE}/demands/chat/${encodeURIComponent(sessionId)}`, {
      headers: this.getAuthHeaders()
    });
    return handleResponse<ChatSessionState>(res);
  },

  async reviseChatProposal(
    sessionId: string,
    proposalVersion?: number,
    message?: string,
    instructions?: string,
    slots?: Record<string, string>
  ): Promise<ChatAgentResult> {
    const res = await fetch(`${API_BASE}/demands/chat/${encodeURIComponent(sessionId)}/revision`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders()
      },
      body: JSON.stringify({
        proposal_version: proposalVersion,
        message: message || instructions,
        instructions,
        slots
      })
    });
    return handleResponse<ChatAgentResult>(res);
  },

  async confirmChatProposal(
    sessionId: string,
    proposalId?: string,
    proposalVersion?: number
  ): Promise<ChatFormalizeResponse> {
    const res = await fetch(`${API_BASE}/demands/chat/${encodeURIComponent(sessionId)}/confirm`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders()
      },
      body: JSON.stringify({
        proposal_id: proposalId,
        approved_proposal_version: proposalVersion,
        proposal_version: proposalVersion
      })
    });
    return handleResponse<ChatFormalizeResponse>(res);
  },

  async cancelChatDemand(sessionId: string): Promise<ChatCancelResponse> {
    const res = await fetch(`${API_BASE}/demands/chat/${encodeURIComponent(sessionId)}/cancel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders()
      }
    });
    return handleResponse<ChatCancelResponse>(res);
  },

  // -------------------------------------------------------------
  // 3. Demandas do Cidadão (/demands)
  // -------------------------------------------------------------
  async createDemand(title: string, description: string): Promise<Demand> {
    const res = await fetch(`${API_BASE}/demands`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders()
      },
      body: JSON.stringify({ title, description })
    });
    return handleResponse<Demand>(res);
  },

  async getMyDemands(params?: {
    status?: string;
    search?: string;
    page?: number;
    pageSize?: number;
  }): Promise<PaginatedResponse<Demand> | Demand[]> {
    const q = new URLSearchParams();
    if (params?.status) q.append('status', params.status);
    if (params?.search && params.search.trim()) q.append('search', params.search.trim());
    if (params?.page) q.append('page', params.page.toString());
    if (params?.pageSize) q.append('page_size', params.pageSize.toString());

    const qs = q.toString() ? `?${q.toString()}` : '';
    const res = await fetch(`${API_BASE}/demands/my${qs}`, {
      headers: this.getAuthHeaders()
    });
    return handleResponse<PaginatedResponse<Demand> | Demand[]>(res);
  },

  async getDemandByProtocol(protocol: string): Promise<DemandDetailed> {
    const res = await fetch(`${API_BASE}/demands/${encodeURIComponent(protocol)}`, {
      headers: this.getAuthHeaders()
    });
    return handleResponse<DemandDetailed>(res);
  },

  async submitFeedback(
    protocol: string,
    rating: number,
    comment?: string
  ): Promise<any> {
    const res = await fetch(`${API_BASE}/demands/${encodeURIComponent(protocol)}/feedback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders()
      },
      body: JSON.stringify({ rating, comment })
    });
    return handleResponse<any>(res);
  },

  async getDepartments(): Promise<Department[]> {
    try {
      const res = await fetch(`${API_BASE}/demands/departments`);
      if (!res.ok) return [];
      return res.json();
    } catch {
      return [];
    }
  },

  // -------------------------------------------------------------
  // 4. Área do Servidor (/admin)
  // -------------------------------------------------------------
  async getAdminDemands(params?: {
    statusFilter?: string;
    severityFilter?: string;
    departmentId?: number;
    orderByPriority?: boolean;
    search?: string;
    page?: number;
    pageSize?: number;
  }): Promise<PaginatedResponse<Demand> | Demand[]> {
    const q = new URLSearchParams();
    if (params?.statusFilter) q.append('status_filter', params.statusFilter);
    if (params?.severityFilter) q.append('severity_filter', params.severityFilter);
    if (params?.departmentId) q.append('department_id', params.departmentId.toString());
    if (params?.orderByPriority) q.append('order_by_priority', 'true');
    if (params?.search && params.search.trim()) q.append('search', params.search.trim());
    if (params?.page) q.append('page', params.page.toString());
    if (params?.pageSize) q.append('page_size', params.pageSize.toString());

    const qs = q.toString() ? `?${q.toString()}` : '';
    const res = await fetch(`${API_BASE}/admin/demands${qs}`, {
      headers: this.getAuthHeaders()
    });
    return handleResponse<PaginatedResponse<Demand> | Demand[]>(res);
  },

  async getAdminDossier(protocol: string): Promise<DemandDetailed> {
    const res = await fetch(`${API_BASE}/admin/demands/${encodeURIComponent(protocol)}`, {
      headers: this.getAuthHeaders()
    });
    return handleResponse<DemandDetailed>(res);
  },

  async updateDemandStatus(
    protocol: string,
    newStatus: string,
    notes?: string,
    resolutionNotes?: string
  ): Promise<Demand> {
    const res = await fetch(`${API_BASE}/admin/demands/${encodeURIComponent(protocol)}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders()
      },
      body: JSON.stringify({
        new_status: newStatus,
        notes: notes || undefined,
        resolution_notes: resolutionNotes || undefined
      })
    });
    return handleResponse<Demand>(res);
  },

  async getAdminStats(): Promise<{ total: number; aberto: number; em_andamento: number; fechado: number }> {
    try {
      const res = await fetch(`${API_BASE}/admin/stats`, {
        headers: this.getAuthHeaders()
      });
      if (!res.ok) return { total: 0, aberto: 0, em_andamento: 0, fechado: 0 };
      return res.json();
    } catch {
      return { total: 0, aberto: 0, em_andamento: 0, fechado: 0 };
    }
  },

  // -------------------------------------------------------------
  // 5. Gestão e Indicadores (/management) - Restrito a GESTOR
  // -------------------------------------------------------------
  async getManagementOverview(): Promise<ManagementOverview> {
    const res = await fetch(`${API_BASE}/management/overview`, {
      headers: this.getAuthHeaders()
    });
    return handleResponse<ManagementOverview>(res);
  },

  async getManagementDepartments(): Promise<DepartmentComparison[]> {
    const res = await fetch(`${API_BASE}/management/departments`, {
      headers: this.getAuthHeaders()
    });
    return handleResponse<DepartmentComparison[]>(res);
  }
};
