export type ConversationState =
  | 'COLLECTING'
  | 'AWAITING_CONFIRMATION'
  | 'REVISING'
  | 'APPROVED'
  | 'FORMALIZED'
  | 'CANCELLED';

export interface ChatMessageItem {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ProposalDepartment {
  id?: number;
  name: string;
}

export interface ProposalDTO {
  id?: string;
  version: number;
  department: ProposalDepartment;
  category: string;
  title: string;
  description: string;
  slots: Record<string, string>;
  changed_fields?: string[];
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
  state?: ConversationState;
  proposal?: ProposalDTO;
  proposal_version?: number;
}

export interface ChatSessionState {
  session_id: string;
  state: ConversationState;
  messages: ChatMessageItem[];
  proposal?: ProposalDTO;
  missing_slots?: string[];
  is_self_service?: boolean;
  service_type?: 'AUTOATENDIMENTO' | 'ATENDIMENTO_PUBLICO';
  department_name?: string;
  category?: string;
}

export interface ChatFormalizeResponse {
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
  demand?: any;
}

export interface ChatCancelResponse {
  success: boolean;
  session_id: string;
  state: string;
  message: string;
  cancelled: boolean;
}
