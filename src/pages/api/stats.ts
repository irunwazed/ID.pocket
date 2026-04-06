import type { APIRoute } from 'astro';
import { createSupabaseServer } from '../../lib/supabaseServer';

export const GET: APIRoute = async () => {
  try {
    const supabase = createSupabaseServer();

    const { data, error } = await supabase
      .from('transaction')
      .select('*')
      .is('deleted_at', null);

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const transactions = data || [];

    const totalTransactions = transactions.length;
    const totalMoney = transactions.reduce((sum: number, t: any) => sum + (t.money || 0), 0);
    const averageMoney = totalTransactions > 0 ? totalMoney / totalTransactions : 0;

    // Group by month
    const byMonthMap = new Map<number, { total: number; count: number }>();
    transactions.forEach((t: any) => {
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
    transactions.forEach((t: any) => {
      const codeType = t.code_type || 'undefined';
      const current = byTypeMap.get(codeType) || { total: 0, count: 0 };
      byTypeMap.set(codeType, {
        total: current.total + (t.money || 0),
        count: current.count + 1
      });
    });

    // Group by year
    const byYearMap = new Map<number, { total: number; count: number }>();
    transactions.forEach((t: any) => {
      if (t.year !== undefined) {
        const current = byYearMap.get(t.year) || { total: 0, count: 0 };
        byYearMap.set(t.year, {
          total: current.total + (t.money || 0),
          count: current.count + 1
        });
      }
    });

    const stats = {
      totalTransactions,
      totalMoney,
      averageMoney,
      byMonth: Array.from(byMonthMap.entries()).map(([month, data]) => ({ month, ...data })),
      byType: Array.from(byTypeMap.entries()).map(([code_type, data]) => ({ code_type, ...data })),
      byYear: Array.from(byYearMap.entries()).map(([year, data]) => ({ year, ...data }))
    };

    return new Response(JSON.stringify(stats), {
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
