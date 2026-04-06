import type { User, Transaction, Type, TransactionStats } from './types';

const API_BASE = '/api';

// Helper function for API calls
async function fetchAPI(url: string, options?: RequestInit) {
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers
    },
    ...options
  });

  const contentType = response.headers.get('content-type');
  let data: any;

  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    throw new Error(data?.error || data || 'Request failed');
  }

  return data;
}

// ============ USER API ============
export const userApi = {
  async getAll(): Promise<User[]> {
    const data = await fetchAPI(`${API_BASE}/users`);
    return Array.isArray(data) ? data : [];
  },

  async create(data: { name: string; username: string; password: string; level?: number }): Promise<User> {
    return fetchAPI(`${API_BASE}/users`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async update(id: number, data: { name?: string; username?: string; password?: string; level?: number }): Promise<User> {
    return fetchAPI(`${API_BASE}/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  async delete(id: number): Promise<void> {
    return fetchAPI(`${API_BASE}/users/${id}`, {
      method: 'DELETE'
    });
  }
};

// ============ TRANSACTION API ============
export const transactionApi = {
  async getAll(): Promise<Transaction[]> {
    const data = await fetchAPI(`${API_BASE}/transactions`);
    return Array.isArray(data) ? data : [];
  },

  async getPaginated(
    page: number = 1,
    limit: number = 10,
    filters?: { code_type?: string; note?: string; year?: number; month?: number }
  ): Promise<{
    data: Transaction[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit)
    });

    if (filters?.code_type) params.append('code_type', filters.code_type);
    if (filters?.note) params.append('note', filters.note);
    if (filters?.year) params.append('year', String(filters.year));
    if (filters?.month) params.append('month', String(filters.month));

    const response = await fetchAPI(`${API_BASE}/transactions?${params.toString()}`);
    return {
      data: Array.isArray(response.data) ? response.data : [],
      total: response.pagination?.total || 0,
      page: response.pagination?.page || page,
      limit: response.pagination?.limit || limit,
      totalPages: response.pagination?.totalPages || 1
    };
  },

  async create(data: {
    year?: number;
    month?: number;
    note?: string;
    code_type?: string;
    money?: number;
    created_by?: string;
  }): Promise<Transaction> {
    return fetchAPI(`${API_BASE}/transactions`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async update(id: string, data: {
    year?: number;
    month?: number;
    note?: string;
    code_type?: string;
    money?: number;
    updated_by?: string;
  }): Promise<Transaction> {
    return fetchAPI(`${API_BASE}/transactions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  async delete(id: string): Promise<void> {
    return fetchAPI(`${API_BASE}/transactions/${id}`, {
      method: 'DELETE'
    });
  }
};

// ============ TYPE API ============
export const typeApi = {
  async getAll(): Promise<Type[]> {
    const data = await fetchAPI(`${API_BASE}/types`);
    return Array.isArray(data) ? data : [];
  },

  async create(data: { code_type?: string; name?: string }): Promise<Type> {
    return fetchAPI(`${API_BASE}/types`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async update(id: number, data: { code_type?: string; name?: string }): Promise<Type> {
    return fetchAPI(`${API_BASE}/types/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  async delete(id: number): Promise<void> {
    return fetchAPI(`${API_BASE}/types/${id}`, {
      method: 'DELETE'
    });
  }
};

// ============ STATS API ============
export const statsApi = {
  async get(): Promise<TransactionStats> {
    return fetchAPI(`${API_BASE}/stats`);
  }
};

// ============ RECAP API ============
export const recapApi = {
  async get(year?: number): Promise<{
    year: number;
    income: number;
    expense: number;
    balance: number;
    monthlyBalance: number[];
    details: Array<{
      code_type: string;
      name: string;
      level: number;
      monthly: number[];
      children?: Array<{
        code_type: string;
        name: string;
        level: number;
        monthly: number[];
      }>;
    }>;
  }> {
    const params = year ? `?year=${year}` : '';
    return fetchAPI(`${API_BASE}/recap${params}`);
  }
};
