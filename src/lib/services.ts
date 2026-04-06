import { supabase } from './supabase';
import type { User, Transaction, Type, TransactionStats } from './types';

// ============ USER SERVICE ============
export const userService = {
  async getAll() {
    const { data, error } = await supabase
      .from('user')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data as User[];
  },

  async getById(id: number) {
    const { data, error } = await supabase
      .from('user')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data as User;
  },

  async create(formData: { name: string; username: string; password: string; level?: number }) {
    const { data, error } = await supabase
      .from('user')
      .insert(formData)
      .select()
      .single();
    if (error) throw error;
    return data as User;
  },

  async update(id: number, formData: { name?: string; username?: string; password?: string; level?: number }) {
    const { data, error } = await supabase
      .from('user')
      .update(formData)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as User;
  },

  async delete(id: number) {
    const { error } = await supabase.from('user').delete().eq('id', id);
    if (error) throw error;
  }
};

// ============ TRANSACTION SERVICE ============
export const transactionService = {
  async getAll() {
    const { data, error } = await supabase
      .from('transaction')
      .select('*')
      .is('deleted_at', null)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data as Transaction[];
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('transaction')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data as Transaction;
  },

  async create(formData: {
    year?: number;
    month?: number;
    note?: string;
    code_type?: string;
    money?: number;
    created_by?: string;
  }) {
    const { data, error } = await supabase
      .from('transaction')
      .insert(formData)
      .select()
      .single();
    if (error) throw error;
    return data as Transaction;
  },

  async update(id: string, formData: {
    year?: number;
    month?: number;
    note?: string;
    code_type?: string;
    money?: number;
    updated_by?: string;
  }) {
    const { data, error } = await supabase
      .from('transaction')
      .update({ ...formData, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as Transaction;
  },

  async softDelete(id: string, deletedBy?: string) {
    const { error } = await supabase
      .from('transaction')
      .update({ deleted_at: new Date().toISOString(), deleted_by: deletedBy })
      .eq('id', id);
    if (error) throw error;
  },

  async getStats(): Promise<TransactionStats> {
    const { data, error } = await supabase
      .from('transaction')
      .select('*')
      .is('deleted_at', null);
    if (error) throw error;

    const transactions = data as Transaction[];

    const totalTransactions = transactions.length;
    const totalMoney = transactions.reduce((sum, t) => sum + (t.money || 0), 0);
    const averageMoney = totalTransactions > 0 ? totalMoney / totalTransactions : 0;

    // Group by month
    const byMonthMap = new Map<number, { total: number; count: number }>();
    transactions.forEach(t => {
      if (t.month !== undefined) {
        const current = byMonthMap.get(t.month) || { total: 0, count: 0 };
        byMonthMap.set(t.month, {
          total: current.total + (t.money || 0),
          count: current.count + 1
        });
      }
    });

    // Group by type
    const byTypeMap = new Map<string, { total: number; count: number }>();
    transactions.forEach(t => {
      const codeType = t.code_type || 'undefined';
      const current = byTypeMap.get(codeType) || { total: 0, count: 0 };
      byTypeMap.set(codeType, {
        total: current.total + (t.money || 0),
        count: current.count + 1
      });
    });

    // Group by year
    const byYearMap = new Map<number, { total: number; count: number }>();
    transactions.forEach(t => {
      if (t.year !== undefined) {
        const current = byYearMap.get(t.year) || { total: 0, count: 0 };
        byYearMap.set(t.year, {
          total: current.total + (t.money || 0),
          count: current.count + 1
        });
      }
    });

    return {
      totalTransactions,
      totalMoney,
      averageMoney,
      byMonth: Array.from(byMonthMap.entries()).map(([month, data]) => ({ month, ...data })),
      byType: Array.from(byTypeMap.entries()).map(([code_type, data]) => ({ code_type, ...data })),
      byYear: Array.from(byYearMap.entries()).map(([year, data]) => ({ year, ...data }))
    };
  }
};

// ============ TYPE SERVICE ============
export const typeService = {
  async getAll() {
    const { data, error } = await supabase
      .from('type')
      .select('*')
      .order('id', { ascending: true });
    if (error) throw error;
    return data as Type[];
  },

  async getById(id: number) {
    const { data, error } = await supabase
      .from('type')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data as Type;
  },

  async create(formData: { code_type?: string; name?: string }) {
    const { data, error } = await supabase
      .from('type')
      .insert(formData)
      .select()
      .single();
    if (error) throw error;
    return data as Type;
  },

  async update(id: number, formData: { code_type?: string; name?: string }) {
    const { data, error } = await supabase
      .from('type')
      .update(formData)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as Type;
  },

  async delete(id: number) {
    const { error } = await supabase.from('type').delete().eq('id', id);
    if (error) throw error;
  }
};
