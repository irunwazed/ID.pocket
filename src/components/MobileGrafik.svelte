<script lang="ts">
  import { grafikApi } from '../lib/api';
  import type { Type } from '../lib/types';

  let { types }: { types: Type[] } = $props();

  const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

  let grafikData: any = $state(null);
  let grafikTipes: any = $state(null);
  let loadinGrafik = $state(false);
  let errorGrafik: string | null = $state(null);
  let grafikYear = $state(new Date().getFullYear());
  let grafikTypeFilter = $state('');
  let showDetailTable = $state(false);
  let showMonthlyTable = $state(false);

  function formatMoney(value: number): string {
    return new Intl.NumberFormat('id-ID').format(value);
  }

  let grafikMaxLine = $derived(grafikData
    ? Math.max(...grafikData.months.map((m: any) => Math.max(m.income, m.expense, Math.abs(m.balance))), 1)
    : 1);

  let grafikLeafTipes = $derived(grafikTipes
    ? (() => {
        if (grafikTipes.length === 0) return [];
        const maxDepth = Math.max(...grafikTipes.map((t: any) => t.code_type.split('.').length));
        return grafikTipes.filter((t: any) => t.code_type.split('.').length === maxDepth);
      })()
    : []);

  let grafikMaxType = $derived(grafikLeafTipes.length > 0
    ? Math.max(...grafikLeafTipes.map((t: any) => t.total), 1)
    : 1);

  async function fetchGrafik() {
    loadinGrafik = true;
    errorGrafik = null;
    try {
      const [monthlyRes, tipesRes] = await Promise.all([
        grafikApi.getMonthly(grafikYear),
        grafikApi.getTipes(grafikYear, grafikTypeFilter || undefined)
      ]);
      grafikData = monthlyRes;
      grafikTipes = tipesRes.tipes;
    } catch (err: any) {
      errorGrafik = err.message || 'Gagal memuat grafik';
    } finally {
      loadinGrafik = false;
    }
  }

  $effect(() => {
    fetchGrafik();
  });
</script>

<div class="px-4 pt-6">
  <div class="flex items-center justify-between mb-4">
    <h1 class="text-xl font-bold text-slate-800">Grafik</h1>
    <select bind:value={grafikYear} onchange={() => fetchGrafik()} class="text-sm bg-white border border-slate-200 rounded-xl px-3 py-1.5 font-medium text-slate-700">
      {#each [2025, 2026, 2027] as year}
        <option value={year}>{year}</option>
      {/each}
    </select>
  </div>

  {#if loadinGrafik}
    <div class="flex justify-center py-12">
      <div class="w-8 h-8 border-4 border-sky-200 border-t-sky-500 rounded-full animate-spin"></div>
    </div>
  {:else if errorGrafik}
    <div class="bg-red-50/80 text-red-600 p-4 rounded-2xl text-sm">{errorGrafik}</div>
  {:else if grafikData}
    <!-- Line Chart: Monthly Income vs Expense vs Balance -->
    <div class="bg-white rounded-2xl shadow-[0_1px_8px_rgba(56,189,248,0.08)] border border-slate-100 p-4 mb-4">
      <h3 class="text-sm font-bold text-slate-700 mb-3">Pemasukan, Pengeluaran & Sisa</h3>
      <div class="relative h-44">
        {#each Array(5) as _, i}
          <div class="absolute left-0 right-0 border-t border-gray-100" style="bottom: {i * 20}%"></div>
        {/each}
        <svg class="absolute inset-0 w-full h-full" viewBox="0 0 600 200" preserveAspectRatio="none">
          <polyline
            fill="none"
            stroke="#10b981"
            stroke-width="2.5"
            stroke-linecap="round"
            stroke-linejoin="round"
            points="{grafikData.months.map((m: any, i: number) => {
              const x = (i / 11) * 580 + 10;
              const y = 200 - (m.income / grafikMaxLine) * 180 - 10;
              return `${x},${y}`;
            }).join(' ')}"
          />
          <polyline
            fill="none"
            stroke="#ef4444"
            stroke-width="2.5"
            stroke-linecap="round"
            stroke-linejoin="round"
            points="{grafikData.months.map((m: any, i: number) => {
              const x = (i / 11) * 580 + 10;
              const y = 200 - (m.expense / grafikMaxLine) * 180 - 10;
              return `${x},${y}`;
            }).join(' ')}"
          />
          <polyline
            fill="none"
            stroke="#6366f1"
            stroke-width="2"
            stroke-dasharray="6,3"
            stroke-linecap="round"
            stroke-linejoin="round"
            points="{grafikData.months.map((m: any, i: number) => {
              const x = (i / 11) * 580 + 10;
              const y = 200 - (Math.max(0, m.balance) / grafikMaxLine) * 180 - 10;
              return `${x},${y}`;
            }).join(' ')}"
          />
          {#each grafikData.months as m, i}
            {@const x = (i / 11) * 580 + 10}
            {@const yInc = 200 - (m.income / grafikMaxLine) * 180 - 10}
            {@const yExp = 200 - (m.expense / grafikMaxLine) * 180 - 10}
            <circle cx={x} cy={yInc} r="3" fill="#10b981" />
            <circle cx={x} cy={yExp} r="3" fill="#ef4444" />
          {/each}
        </svg>
      </div>
      <div class="flex justify-between mt-1 px-0">
        {#each grafikData.months as m, i}
          <span class="text-[8px] text-slate-400 {i % 2 === 0 ? 'font-medium' : ''}">{monthNames[i]?.slice(0, 3)}</span>
        {/each}
      </div>
      <div class="flex justify-center gap-4 mt-3">
        <div class="flex items-center gap-1.5">
          <div class="w-3 h-0.5 bg-emerald-500 rounded"></div>
          <span class="text-[10px] text-gray-500">Masuk</span>
        </div>
        <div class="flex items-center gap-1.5">
          <div class="w-3 h-0.5 bg-red-500 rounded"></div>
          <span class="text-[10px] text-gray-500">Keluar</span>
        </div>
        <div class="flex items-center gap-1.5">
          <div class="w-3 h-0.5 border-t-2 border-dashed border-indigo-500 rounded"></div>
          <span class="text-[10px] text-gray-500">Sisa</span>
        </div>
      </div>
      <button onclick={() => showMonthlyTable = !showMonthlyTable} class="w-full mt-3 text-xs text-sky-600 font-semibold flex items-center justify-center gap-1 py-1.5">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 transition-transform {showMonthlyTable ? 'rotate-180' : ''}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/></svg>
        {showMonthlyTable ? 'Sembunyikan Tabel' : 'Lihat Tabel Detail'}
      </button>
      {#if showMonthlyTable}
        <div class="mt-3 overflow-x-auto">
          <table class="w-full text-[11px]">
            <thead>
              <tr class="border-b border-gray-100">
                <th class="text-left py-1.5 text-slate-400 font-medium">Bulan</th>
                <th class="text-right py-1.5 text-emerald-600 font-medium">Masuk</th>
                <th class="text-right py-1.5 text-red-500 font-medium">Keluar</th>
                <th class="text-right py-1.5 text-indigo-600 font-medium">Sisa</th>
              </tr>
            </thead>
            <tbody>
              {#each grafikData.months as m}
                <tr class="border-b border-gray-50">
                  <td class="py-1.5 text-gray-600">{monthNames[m.month - 1]?.slice(0, 3)}</td>
                  <td class="py-1.5 text-right text-emerald-600 font-semibold">{m.income > 0 ? formatMoney(m.income) : '-'}</td>
                  <td class="py-1.5 text-right text-red-500 font-semibold">{m.expense > 0 ? formatMoney(m.expense) : '-'}</td>
                  <td class="py-1.5 text-right text-indigo-600 font-semibold">{m.balance !== 0 ? formatMoney(m.balance) : '-'}</td>
                </tr>
              {/each}
              <tr class="border-t-2 border-gray-200 font-bold">
                <td class="py-1.5 text-gray-700">Total</td>
                <td class="py-1.5 text-right text-emerald-600">{formatMoney(grafikData.totalIncome)}</td>
                <td class="py-1.5 text-right text-red-500">{formatMoney(grafikData.totalExpense)}</td>
                <td class="py-1.5 text-right text-indigo-600">{formatMoney(grafikData.totalBalance)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      {/if}
    </div>

    <!-- Per-Type Line Chart -->
    <div class="bg-white rounded-2xl shadow-[0_1px_8px_rgba(56,189,248,0.08)] border border-slate-100 p-4 mb-4">
      <div class="flex items-center justify-between mb-3">
        <h3 class="text-sm font-bold text-slate-700">Per Tipe</h3>
        <select bind:value={grafikTypeFilter} onchange={() => fetchGrafik()} class="text-[11px] bg-sky-50/80 border border-blue-100 rounded-lg px-2 py-1 font-medium text-slate-700 max-w-[55%]">
          <option value="">Semua</option>
          <optgroup label="Pemasukan">
            <option value="4">Semua Pendapatan</option>
            {#each types.filter((t: any) => String(t.code_type).startsWith('4') && String(t.code_type) !== '4').toSorted((a: any, b: any) => String(a.code_type).localeCompare(String(b.code_type))) as t}
              <option value={t.code_type}>{t.name}</option>
            {/each}
          </optgroup>
          <optgroup label="Pengeluaran">
            <option value="5">Semua Pengeluaran</option>
            {#each types.filter((t: any) => String(t.code_type).startsWith('5') && String(t.code_type) !== '5').toSorted((a: any, b: any) => String(a.code_type).localeCompare(String(b.code_type))) as t}
              <option value={t.code_type}>{t.name}</option>
            {/each}
          </optgroup>
        </select>
      </div>
      {#if grafikLeafTipes.length > 0}
        {@const lineColors = ['#10b981','#3b82f6','#f59e0b','#ef4444','#8b5cf6','#ec4899','#14b8a6','#f97316','#06b6d4','#84cc16','#6366f1','#e11d48','#0ea5e9','#a3e635','#d946ef','#fb923c','#22d3ee','#facc15','#4ade80','#f87171']}
        {@const maxTypeMonthly = Math.max(...grafikLeafTipes.flatMap((t: any) => t.monthly), 1)}
        <div class="relative h-48">
          {#each Array(4) as _, i}
            <div class="absolute left-0 right-0 border-t border-gray-100" style="bottom: {i * 25}%"></div>
          {/each}
          <svg class="absolute inset-0 w-full h-full" viewBox="0 0 600 200" preserveAspectRatio="none">
            {#each grafikLeafTipes as tipe, idx}
              {@const color = lineColors[idx % lineColors.length]}
              <polyline
                fill="none"
                stroke={color}
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                points="{tipe.monthly.map((val: number, mi: number) => {
                  const x = (mi / 11) * 580 + 10;
                  const y = 200 - (val / maxTypeMonthly) * 180 - 10;
                  return `${x},${y}`;
                }).join(' ')}"
              />
            {/each}
          </svg>
        </div>
        <div class="flex justify-between mt-1 px-0">
          {#each grafikData.months as m, i}
            <span class="text-[8px] text-slate-400 {i % 2 === 0 ? 'font-medium' : ''}">{monthNames[i]?.slice(0, 3)}</span>
          {/each}
        </div>
        <div class="flex flex-wrap gap-x-4 gap-y-1 mt-3">
          {#each grafikLeafTipes as tipe, idx}
            {@const color = lineColors[idx % lineColors.length]}
            <div class="flex items-center gap-1.5">
              <div class="w-3 h-0.5 rounded" style="background: {color}"></div>
              <span class="text-[10px] text-gray-500">{tipe.name}</span>
              <span class="text-[10px] font-bold {tipe.code_type.startsWith('4') ? 'text-emerald-600' : 'text-red-500'}">{formatMoney(tipe.total)}</span>
            </div>
          {/each}
        </div>
      {:else}
        <p class="text-sm text-slate-400 text-center py-4">Tidak ada data</p>
      {/if}
      {#if grafikLeafTipes.length > 0}
        <button onclick={() => showDetailTable = !showDetailTable} class="w-full mt-3 text-xs text-sky-600 font-semibold flex items-center justify-center gap-1 py-1.5">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 transition-transform {showDetailTable ? 'rotate-180' : ''}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/></svg>
          {showDetailTable ? 'Sembunyikan Tabel' : 'Lihat Tabel Detail'}
        </button>
      {/if}
      {#if showDetailTable && grafikLeafTipes.length > 0}
        <div class="mt-3 overflow-x-auto -mx-4 px-4">
          <table class="w-full text-[9px] min-w-[400px]">
            <thead>
              <tr class="border-b border-gray-100">
                <th class="text-left py-1.5 pr-2 text-slate-400 font-medium sticky left-0 bg-white min-w-[60px]">Tipe</th>
                {#each grafikData.months as m}
                  <th class="text-right py-1.5 px-0.5 text-slate-400 font-medium">{monthNames[m.month - 1]?.slice(0, 3)}</th>
                {/each}
                <th class="text-right py-1.5 pl-1 text-slate-400 font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {#each grafikLeafTipes as tipe}
                <tr class="border-b border-gray-50">
                  <td class="py-1 pr-2 text-gray-700 font-medium sticky left-0 bg-white">{tipe.name}</td>
                  {#each tipe.monthly as val}
                    <td class="py-1 px-0.5 text-right {val > 0 ? (tipe.code_type.startsWith('4') ? 'text-emerald-600' : 'text-red-500') : 'text-gray-300'}">
                      {val > 0 ? formatMoney(val) : '-'}
                    </td>
                  {/each}
                  <td class="py-1 pl-1 text-right font-bold {tipe.code_type.startsWith('4') ? 'text-emerald-600' : 'text-red-500'}">{formatMoney(tipe.total)}</td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {/if}
    </div>
  {/if}
</div>
