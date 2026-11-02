export interface ManagementStatusStats {
  aberto: number;
  em_andamento: number;
  fechado: number;
}

export interface ManagementSeverityStats {
  critica: number;
  alta: number;
  media: number;
  baixa: number;
}

export interface ManagementOverview {
  total: number;
  status: ManagementStatusStats;
  severity: ManagementSeverityStats;
  resolution_rate: number;
}

export interface DepartmentComparison {
  department_id: number;
  department_name: string;
  email?: string;
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
