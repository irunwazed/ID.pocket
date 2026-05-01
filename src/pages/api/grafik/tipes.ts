import type { APIRoute } from 'astro';
import { createSupabaseServer } from '../../../lib/supabaseServer';

const defaultTypes: Array<{ code_type: string; name: string }> = [
  { code_type: '4', name: 'Pendapatan' },
  { code_type: '5', name: 'Pengeluaran' },
  { code_type: '5.01', name: 'Sandang' },
  { code_type: '5.02', name: 'Pangan' },
  { code_type: '5.03', name: 'Papan' },
  { code_type: '5.04', name: 'Sekolah' },
  { code_type: '5.05', name: 'Tagihan' },
  { code_type: '5.06', name: 'Hiburan' },
  { code_type: '5.07', name: 'Donasi' },
  { code_type: '5.08', name: 'Kesehatan' },
  { code_type: '5.09', name: 'Lainnya' }
];

function normalizeCode(code: string): string {
  if (code.includes('.')) return code;
  if (code.length === 2) return code;
  if (code.length === 3) return code[0] + '.' + code.slice(1);
  if (code.length === 5) return code[0] + '.' + code.slice(1, 3) + '.' + code.slice(3);
  return code;
}

export const GET: APIRoute = async ({ url }) => {
  try {
    const supabase = createSupabaseServer();

    const yearParam = url.searchParams.get('year');
    const year = yearParam ? parseInt(yearParam) : new Date().getFullYear();
    const codeTypeFilter = url.searchParams.get('code_type');

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

    const { data: types } = await supabase
      .from('type')
      .select('*')
      .order('code_type');

    const allTypes = [...(types || [])];
    const existingCodes = new Set((types || []).map((t: any) => t.code_type));
    for (const def of defaultTypes) {
      if (!existingCodes.has(def.code_type)) {
        allTypes.push(def);
      }
    }
    allTypes.sort((a: any, b: any) => a.code_type.localeCompare(b.code_type));

    const typeMap = new Map<string, { code_type: string; name: string; total: number; monthly: number[] }>();

    allTypes.forEach((t: any) => {
      const code = normalizeCode(t.code_type?.toString() || '');
      const parts = code.split('.');

      if (parts.length >= 2) {
        if (!typeMap.has(code)) {
          typeMap.set(code, {
            code_type: code,
            name: t.name || code,
            total: 0,
            monthly: Array(12).fill(0)
          });
        }
      }
    });

    (transactions || []).forEach((t: any) => {
      const code = normalizeCode(t.code_type?.toString() || '');
      const money = t.money || 0;
      const m = parseInt(t.month) - 1;
      if (m < 0 || m > 11) return;

      const entry = typeMap.get(code);
      if (entry) {
        entry.total += money;
        entry.monthly[m] += money;
      } else {
        typeMap.set(code, {
          code_type: code,
          name: code,
          total: money,
          monthly: Array.from({ length: 12 }, (_, i) => i === m ? money : 0)
        });
      }

      const parts = code.split('.');
      if (parts.length > 1) {
        const parentCode = parts.slice(0, -1).join('.');
        const parent = typeMap.get(parentCode);
        if (parent) {
          parent.total += money;
          parent.monthly[m] += money;
        }
      }
    });

    let tipes = Array.from(typeMap.values());

    tipes.sort((a, b) => a.code_type.localeCompare(b.code_type));

    if (codeTypeFilter) {
      const filterPrefix = normalizeCode(codeTypeFilter);
      tipes = tipes.filter(t => t.code_type === filterPrefix || t.code_type.startsWith(filterPrefix + '.'));
    }

    return new Response(JSON.stringify({
      year,
      tipes
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