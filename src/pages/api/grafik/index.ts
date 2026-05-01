import type { APIRoute } from 'astro';
import { createSupabaseServer } from '../../../lib/supabaseServer';

export const GET: APIRoute = async ({ url }) => {
  try {
    const supabase = createSupabaseServer();

    const yearParam = url.searchParams.get('year');
    const year = yearParam ? parseInt(yearParam) : new Date().getFullYear();

    const { data: transactions, error } = await supabase
      .from('transaction')
      .select('*')
      .eq('year', year)
      .is('deleted_at', null)
      .order('month', { ascending: true });

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const months: Array<{
      month: number;
      income: number;
      expense: number;
      balance: number;
    }> = [];

    for (let m = 1; m <= 12; m++) {
      months.push({ month: m, income: 0, expense: 0, balance: 0 });
    }

    let totalIncome = 0;
    let totalExpense = 0;

    (transactions || []).forEach((t: any) => {
      const code = t.code_type?.toString() || '';
      const money = t.money || 0;
      const m = parseInt(t.month) - 1;
      if (m < 0 || m > 11) return;

      if (code.startsWith('4') || code.startsWith('4.')) {
        months[m].income += money;
        totalIncome += money;
      } else if (code.startsWith('5') || code.startsWith('5.')) {
        months[m].expense += money;
        totalExpense += money;
      }
    });

    months.forEach(m => {
      m.balance = m.income - m.expense;
    });

    return new Response(JSON.stringify({
      year,
      months,
      totalIncome,
      totalExpense,
      totalBalance: totalIncome - totalExpense
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err?.message || 'Server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};