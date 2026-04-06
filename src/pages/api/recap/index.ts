import type { APIRoute } from 'astro';
import { createSupabaseServer } from '../../../lib/supabaseServer';

// Default categories that should always be included
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

export const GET: APIRoute = async ({ url }) => {
  try {
    const supabase = createSupabaseServer();

    // Get year(s) from query params - support multiple years with month range
    const yearParam = url.searchParams.get('year');
    const startYearParam = url.searchParams.get('startYear');
    const endYearParam = url.searchParams.get('endYear');
    const startMonthParam = url.searchParams.get('startMonth');
    const endMonthParam = url.searchParams.get('endMonth');

    let yearsToFetch: number[] = [];
    let hasMonthRange = false;
    let rangeStartYear = 0;
    let rangeStartMonth = 0;
    let rangeEndYear = 0;
    let rangeEndMonth = 0;

    if (startYearParam && endYearParam && startMonthParam && endMonthParam) {
      rangeStartYear = parseInt(startYearParam);
      rangeStartMonth = parseInt(startMonthParam);
      rangeEndYear = parseInt(endYearParam);
      rangeEndMonth = parseInt(endMonthParam);
      hasMonthRange = true;

      // Fetch all years that might be needed
      for (let y = rangeStartYear; y <= rangeEndYear; y++) {
        yearsToFetch.push(y);
      }
    } else if (startYearParam && endYearParam) {
      const startYear = parseInt(startYearParam);
      const endYear = parseInt(endYearParam);
      for (let y = startYear; y <= endYear; y++) {
        yearsToFetch.push(y);
      }
    } else if (yearParam) {
      yearsToFetch = [parseInt(yearParam)];
    } else {
      yearsToFetch = [new Date().getFullYear()];
    }

    // Get transactions for the selected years with month range filter
    let query;

    // Apply month range filter if specified
    if (hasMonthRange) {
      // Build individual filters for each month-year combination
      const monthFilters: string[] = [];

      // Generate all month-year combinations in the range
      let currentYear = rangeStartYear;
      let currentMonth = rangeStartMonth;

      while (
        (currentYear < rangeEndYear) ||
        (currentYear === rangeEndYear && currentMonth <= rangeEndMonth)
      ) {
        monthFilters.push(`and(year.eq.${currentYear},month.eq.${currentMonth})`);

        currentMonth++;
        if (currentMonth > 12) {
          currentMonth = 1;
          currentYear++;
        }
      }

      // Combine with OR
      query = supabase
        .from('transaction')
        .select('*')
        .or(monthFilters.join(','))
        .is('deleted_at', null);
    } else {
      // No month range filter, just filter by years
      query = supabase
        .from('transaction')
        .select('*')
        .in('year', yearsToFetch)
        .is('deleted_at', null);
    }

    const { data: transactions, error } = await query
      .order('year', { ascending: true })
      .order('month', { ascending: true });

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get all types
    const { data: types } = await supabase
      .from('type')
      .select('*')
      .order('code_type');

    // Merge with default types
    const allTypes = [...(types || [])];
    const existingCodes = new Set((types || []).map((t: any) => t.code_type));
    for (const def of defaultTypes) {
      if (!existingCodes.has(def.code_type)) {
        allTypes.push(def);
      }
    }

    // Sort all types by code_type
    allTypes.sort((a: any, b: any) => a.code_type.localeCompare(b.code_type));

    // Interface for recap item
    interface RecapItem {
      code_type: string;
      name: string;
      level: number;
      monthly: { year: number; month: number; amount: number }[];
      children?: RecapItem[];
    }

    // Helper to normalize code (convert "501" to "5.01", "50101" to "5.01.01")
    function normalizeCode(code: string): string {
      // If already has dot, keep as is
      if (code.includes('.')) {
        return code;
      }

      // No dot: insert dots appropriately
      if (code.length === 2) {
        return code; // e.g., "45" (unlikely but handle it)
      } else if (code.length === 3) {
        // e.g., "501" → "5.01"
        return code[0] + '.' + code.slice(1);
      } else if (code.length === 5) {
        // e.g., "50101" → "5.01.01"
        return code[0] + '.' + code.slice(1, 3) + '.' + code.slice(3);
      }

      return code;
    }

    // Build hierarchy
    // Code 4: 2 levels (4, 4.01) | Code 5: 3 levels (5, 5.01, 5.01.01)
    const rootMap = new Map<string, RecapItem>();
    const subMap = new Map<string, Map<string, RecapItem>>();

    // Helper to create structured monthly array
    function createMonthlyArray(): { year: number; month: number; amount: number }[] {
      const monthly: { year: number; month: number; amount: number }[] = [];
      for (const year of yearsToFetch) {
        for (let month = 1; month <= 12; month++) {
          monthly.push({ year, month, amount: 0 });
        }
      }
      return monthly;
    }

    // Pass 1: Create all items from type table
    (allTypes || []).forEach((t: any) => {
      let code = t.code_type;
      const name = t.name;
      const normalizedCode = normalizeCode(code);
      const parts = normalizedCode.split('.');
      const rootCode = parts[0];

      // Level 1: Single digit (4, 5)
      if (parts.length === 1) {
        if (!rootMap.has(normalizedCode)) {
          rootMap.set(normalizedCode, {
            code_type: normalizedCode,
            name: name || normalizedCode,
            level: 1,
            monthly: createMonthlyArray(),
            children: []
          });
        }
      }
      // Level 2: Two parts (4.01, 5.01, etc.)
      else if (parts.length === 2) {
        if (!subMap.has(rootCode)) {
          subMap.set(rootCode, new Map());
        }
        if (!subMap.get(rootCode)!.has(normalizedCode)) {
          subMap.get(rootCode)!.set(normalizedCode, {
            code_type: normalizedCode,
            name: name || normalizedCode,
            level: 2,
            monthly: createMonthlyArray(),
            // Only code 5 has 3 levels (with detail items)
            children: rootCode === '5' ? [] : undefined
          });
        }
      }
      // Level 3: Three parts (4.01.01, 5.01.01, etc.)
      else if (parts.length === 3) {
        const rootCode = parts[0];
        const subCode = `${parts[0]}.${parts[1]}`;

        // Only code 5 has level 3, code 4 doesn't
        if (rootCode === '5') {
          // Make sure parent sub exists
          if (!subMap.has(rootCode)) {
            subMap.set(rootCode, new Map());
          }
          if (!subMap.get(rootCode)!.has(subCode)) {
            subMap.get(rootCode)!.set(subCode, {
              code_type: subCode,
              name: subCode,
              level: 2,
              monthly: createMonthlyArray(),
              children: []
            });
          }

          const sub = subMap.get(rootCode)!.get(subCode);
          if (sub && !sub.children!.find(c => c.code_type === normalizedCode)) {
            sub.children!.push({
              code_type: normalizedCode,
              name: name || normalizedCode,
              level: 3,
              monthly: createMonthlyArray()
            });
          }
        }
        // For code 4, level 3 items should be treated as level 2
        else if (rootCode === '4') {
          if (!subMap.has(rootCode)) {
            subMap.set(rootCode, new Map());
          }
          if (!subMap.get(rootCode)!.has(normalizedCode)) {
            subMap.get(rootCode)!.set(normalizedCode, {
              code_type: normalizedCode,
              name: name || normalizedCode,
              level: 2,
              monthly: createMonthlyArray()
            });
          }
        }
      }
    });

    // Pass 2: Organize into final details array
    const details: RecapItem[] = [];

    const sortedRootCodes = Array.from(rootMap.keys()).sort();
    for (const rootCode of sortedRootCodes) {
      const root = rootMap.get(rootCode)!;

      // Add sub items under this root
      const subs = subMap.get(rootCode);
      if (subs) {
        const sortedSubCodes = Array.from(subs.keys()).sort();
        for (const subCode of sortedSubCodes) {
          const sub = subs.get(subCode)!;

          // Sort children (level 3 items) - only for code 5
          if (sub.children && sub.children.length > 0) {
            sub.children.sort((a, b) => a.code_type.localeCompare(b.code_type));
            // Remove children property if empty
            if (sub.children.length === 0) {
              delete sub.children;
            }
          }

          root.children!.push(sub);
        }
      }

      details.push(root);
    }


    // Debug: Log all transactions
    
    // Pass 3: Add transaction amounts - cascade to ALL matching parent levels
    (transactions || []).forEach((t: any) => {
      let code = t.code_type?.toString() || '';
      if (!code) return;

      const txMonth = parseInt(t.month);
      const txYear = parseInt(t.year);

      // Normalize the code (convert "501" to "5.01", "401" to "4.01", etc.)
      const normalizedCode = normalizeCode(code);
      const parts = normalizedCode.split('.');

      const amount = t.money || 0;

      // Helper function to add amount to a monthly array
      function addMonthly(monthlyArray: { year: number; month: number; amount: number }[], year: number, month: number, amt: number) {
        const item = monthlyArray.find(m => m.year === year && m.month === month);
        if (item) {
          item.amount += amt;
        }
      }

      // Find root (level 1)
      let parent = details.find(d => d.code_type === parts[0]);
      if (parent) {
        addMonthly(parent.monthly, txYear, txMonth, amount);
      }

      // Find sub (level 2) - e.g., 5.01
      if (parts.length > 1 && parent) {
        const sub = parent.children?.find(c => c.code_type === parts.slice(0, 2).join('.'));
        if (sub) {
          addMonthly(sub.monthly, txYear, txMonth, amount);
        }
      }

      // Find detail (level 3) - e.g., 5.01.01
      if (parts.length > 2 && parent) {
        const sub = parent.children?.find(c => c.code_type === parts.slice(0, 2).join('.'));
        if (sub && sub.children) {
          const detail = sub.children.find(c => c.code_type === normalizedCode);
          if (detail) {
            addMonthly(detail.monthly, txYear, txMonth, amount);
          }
        }
      }
    });

    // Calculate monthly totals for all months across all years
    const totalMonthsCount = yearsToFetch.length * 12;
    const monthlyData = Array.from({ length: totalMonthsCount }, (_, i) => {
      const yearIndex = Math.floor(i / 12);
      const monthIndex = i % 12;
      const year = yearsToFetch[yearIndex];
      const month = monthIndex + 1;

      const monthTransactions = (transactions || []).filter(
        (t: any) => t.year === year && t.month === month
      );

      let income = 0;
      let expense = 0;

      monthTransactions.forEach((t: any) => {
        const c = t.code_type?.toString() || '';
        if (c.startsWith('4') || c.startsWith('4.')) {
          income += t.money || 0;
        } else if (c.startsWith('5') || c.startsWith('5.')) {
          expense += t.money || 0;
        }
      });

      return { year, month, income, expense, balance: income - expense };
    });

    // Filter monthlyData to only include months within the requested range
    let filteredMonthlyData = monthlyData;
    if (hasMonthRange) {
      filteredMonthlyData = monthlyData.filter((m) => {
        const mDate = new Date(m.year, m.month - 1);
        const startDate = new Date(rangeStartYear, rangeStartMonth - 1);
        const endDate = new Date(rangeEndYear, rangeEndMonth - 1);
        return mDate >= startDate && mDate <= endDate;
      });
    }

    const totalIncome = filteredMonthlyData.reduce((sum, m) => sum + m.income, 0);
    const totalExpense = filteredMonthlyData.reduce((sum, m) => sum + m.expense, 0);
    const totalBalance = totalIncome - totalExpense;

    // Helper function to filter monthly array in details
    function filterMonthlyArray(monthlyArray: { year: number; month: number; amount: number }[]): { year: number; month: number; amount: number }[] {
      if (!hasMonthRange) return monthlyArray;
      return monthlyArray.filter((m) => {
        const mDate = new Date(m.year, m.month - 1);
        const startDate = new Date(rangeStartYear, rangeStartMonth - 1);
        const endDate = new Date(rangeEndYear, rangeEndMonth - 1);
        return mDate >= startDate && mDate <= endDate;
      });
    }

    // Recursively filter monthly arrays in details
    function filterDetailsMonthly(details: RecapItem[]): RecapItem[] {
      return details.map((item) => {
        const filteredItem: RecapItem = {
          ...item,
          monthly: filterMonthlyArray(item.monthly)
        };
        if (item.children) {
          filteredItem.children = filterDetailsMonthly(item.children);
        }
        return filteredItem;
      });
    }

    const filteredDetails = filterDetailsMonthly(details);

    const recapData = {
      year: yearsToFetch[0], // Use first year as reference
      startYear: rangeStartYear || yearsToFetch[0],
      endYear: rangeEndYear || yearsToFetch[yearsToFetch.length - 1],
      startMonth: rangeStartMonth,
      endMonth: rangeEndMonth,
      years: yearsToFetch,
      months: filteredMonthlyData.map((m, i) => ({
        index: i,
        year: m.year,
        month: m.month,
        label: `${m.month}/${m.year}`,
        income: m.income,
        expense: m.expense,
        balance: m.balance
      })),
      income: totalIncome,
      expense: totalExpense,
      balance: totalBalance,
      monthlyBalance: filteredMonthlyData.map(m => m.balance),
      details: filteredDetails
    };

    return new Response(JSON.stringify(recapData), {
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
