// Database Types
export interface User {
  id: number;
  created_at: string;
  name: string;
  username: string;
  password: string;
  level?: number;
}

export interface Transaction {
  id: string;
  created_at: string;
  created_by?: string;
  deleted_at?: string;
  deleted_by?: string;
  updated_at?: string;
  updated_by?: string;
  year?: number;
  month?: number;
  note?: string;
  code_type?: string;
  money?: number;
}

export interface Type {
  id: number;
  code_type?: string;
  name?: string;
}

// Form Types
export interface UserFormData {
  name: string;
  username: string;
  password: string;
  level?: number;
}

export interface TransactionFormData {
  year?: number;
  month?: number;
  note?: string;
  code_type?: string;
  money?: number;
}

export interface TypeFormData {
  code_type?: string;
  name?: string;
}

// Stats Types
export interface TransactionStats {
  totalTransactions: number;
  totalMoney: number;
  averageMoney: number;
  byMonth: { month: number; total: number; count: number }[];
  byType: { code_type: string; total: number; count: number }[];
  byYear: { year: number; total: number; count: number }[];
}

// Pagination Types
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
