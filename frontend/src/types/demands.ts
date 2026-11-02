export type DemandStatus = 'ABERTO' | 'EM ANDAMENTO' | 'FECHADO';
export type DemandSeverity = 'BAIXA' | 'MEDIA' | 'ALTA' | 'CRITICA';
export type ServiceType = 'AUTOATENDIMENTO' | 'ATENDIMENTO_PUBLICO';

export interface Department {
  id: number;
  name: string;
  description?: string;
  email: string;
}

export interface Feedback {
  id: number;
  demand_id: number;
  citizen_id: number;
  rating: number;
  comment?: string;
  created_at: string;
}

export interface StatusHistoryDetail {
  from?: string | null;
  to: string;
  created_at: string;
  notes?: string | null;
  changed_by_name?: string | null;
}

export interface SeverityDetail {
  level: DemandSeverity;
  justification?: string | null;
}

export interface ClassificationDetail {
  category?: string | null;
  service_type?: ServiceType | null;
}

export interface DepartmentDetail {
  id?: number | null;
  name?: string | null;
}

export interface Demand {
  department?: DepartmentDetail | null;
  id: number;
  protocol: string;
  title: string;
  description: string;
  status: DemandStatus;
  severity: DemandSeverity;
  severity_justification?: string | null;
  service_type?: ServiceType | null;
  category?: string | null;
  organized_summary?: string | null;
  resolution_notes?: string | null;
  department_id?: number | null;
  citizen_id: number;
  created_at: string;
  updated_at: string;
}

export interface DemandDetailed {
  id: number;
  protocol: string;
  title: string;
  description: string;
  status: DemandStatus;
  severity: SeverityDetail;
  classification: ClassificationDetail;
  department?: DepartmentDetail | null;
  organized_summary?: string | null;
  history: StatusHistoryDetail[];
  resolution_notes?: string | null;
  feedback?: Feedback | null;
  citizen_id: number;
  citizen_name?: string | null;
  created_at: string;
  updated_at: string;
}
