<script lang="ts">
  import { recapApi } from '../lib/api';

  const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

  let recapData: any = $state(null);
  let loadinRecap = $state(false);
  let errorRecap: string | null = $state(null);
  let selectedYear = $state(new Date().getFullYear());
  let selectedRecapMonth = $state(0);

  function formatMoney(value: number): string {
    return new Intl.NumberFormat('id-ID').format(value);
  }

  async function fetchRecap() {
    loadinRecap = true;
    errorRecap = null;
    try {
      recapData = await recapApi.get(selectedYear);
    } catch (err: any) {
      errorRecap = err.message || 'Gagal memuat rekap';
    } finally {
      loadinRecap = false;
    }
  }

  $effect(() => {
    fetchRecap();
  });
</script>

<div class="px-4 pt-6">
  <div class="flex items-center justify-between mb-4">
    <h1 class="text-xl font-bold text-slate-800">Rekapitulasi</h1>
    <select bind:value={selectedYear} onchange={() => fetchRecap()} class="text-sm bg-white border border-slate-200 rounded-xl px-3 py-1.5 font-medium text-slate-700">
      {#each [2025, 2026, 2027] as year}
        <option value={year}>{year}</option>
      {/each}
    </select>
  </div>

  {#if loadinRecap}
    <div class="flex justify-center py-12">
      <div class="w-8 h-8 border-4 border-sky-200 border-t-sky-500 rounded-full animate-spin"></div>
    </div>
  {:else if errorRecap}
    <div class="bg-red-50/80 text-red-600 p-4 rounded-2xl text-sm">{errorRecap}</div>
  {:else if recapData}
    <!-- Summary Cards -->
    <div class="grid grid-cols-3 gap-3 mb-5">
      <div class="bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl p-3 text-white shadow-sm shadow-emerald-200/50">
        <p class="text-[10px] uppercase tracking-wider opacity-80">Pemasukan</p>
        <p class="text-base font-bold mt-1">{formatMoney(recapData.income || 0)}</p>
      </div>
      <div class="bg-gradient-to-br from-rose-400 to-red-500 rounded-2xl p-3 text-white shadow-sm shadow-rose-200/50">
        <p class="text-[10px] uppercase tracking-wider opacity-80">Pengeluaran</p>
        <p class="text-base font-bold mt-1">{formatMoney(recapData.expense || 0)}</p>
      </div>
      <div class="bg-gradient-to-br from-sky-400 to-blue-600 rounded-2xl p-3 text-white shadow-sm shadow-sky-200/50">
        <p class="text-[10px] uppercase tracking-wider opacity-80">Saldo</p>
        <p class="text-base font-bold mt-1">{formatMoney(recapData.balance || 0)}</p>
      </div>
    </div>

    <!-- Monthly Balance -->
    {#if recapData.monthlyBalance}
      <div class="bg-white rounded-2xl shadow-[0_1px_8px_rgba(56,189,248,0.08)] border border-slate-100 p-4 mb-4">
        <h3 class="text-sm font-bold text-slate-700 mb-3">Saldo Bulanan</h3>
        <div class="space-y-2">
          {#each recapData.monthlyBalance as balance, i}
            {#if balance !== 0}
              <div class="flex justify-between items-center py-1.5 {i > 0 ? 'border-t border-gray-50' : ''}">
                <span class="text-xs text-gray-600 font-medium">{monthNames[i]}</span>
                <span class="text-xs font-bold {balance >= 0 ? 'text-emerald-600' : 'text-red-500'}">{formatMoney(balance)}</span>
              </div>
            {/if}
          {/each}
        </div>
      </div>
    {/if}

    <!-- Details by type -->
    {#if recapData.details}
      <div class="bg-white rounded-2xl shadow-[0_1px_8px_rgba(56,189,248,0.08)] border border-slate-100 p-4">
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-sm font-bold text-slate-700">Rincian per Tipe</h3>
          <select bind:value={selectedRecapMonth} class="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 font-medium text-slate-700">
            <option value={0}>Semua Bulan</option>
            {#each monthNames as m, i}
              <option value={i + 1}>{m}</option>
            {/each}
          </select>
        </div>
        <div class="space-y-2">
          {#each recapData.details as root}
            {@const isIncome = String(root.code_type).startsWith('4')}
            {@const rootTotal = selectedRecapMonth
              ? root.monthly.filter((m: any) => m.month === selectedRecapMonth).reduce((s: number, m: any) => s + m.amount, 0)
              : root.monthly.reduce((s: number, m: any) => s + m.amount, 0)}
            {#if rootTotal !== 0}
              <div class="py-2 border-b border-gray-50 last:border-0">
                <div class="flex justify-between items-center">
                  <span class="text-sm font-bold {isIncome ? 'text-emerald-700' : 'text-red-600'}">{root.name || root.code_type}</span>
                  <span class="text-xs font-bold {isIncome ? 'text-emerald-600' : 'text-red-500'}">
                    {formatMoney(rootTotal)}
                  </span>
                </div>
                {#if root.children}
                  <div class="mt-1 space-y-1">
                    {#each root.children as sub}
                      {@const subTotal = selectedRecapMonth
                        ? sub.monthly.filter((m: any) => m.month === selectedRecapMonth).reduce((s: number, m: any) => s + m.amount, 0)
                        : sub.monthly.reduce((s: number, m: any) => s + m.amount, 0)}
                      {#if subTotal !== 0}
                        <div class="ml-3">
                          <div class="flex justify-between items-center">
                            <span class="text-xs font-semibold text-gray-600">{sub.name || sub.code_type}</span>
                            <span class="text-[11px] font-semibold text-gray-500">
                              {formatMoney(subTotal)}
                            </span>
                          </div>
                          {#if sub.children && sub.children.length > 0}
                            {#each sub.children as item}
                              {@const itemTotal = selectedRecapMonth
                                ? item.monthly.filter((m: any) => m.month === selectedRecapMonth).reduce((s: number, m: any) => s + m.amount, 0)
                                : item.monthly.reduce((s: number, m: any) => s + m.amount, 0)}
                              {#if itemTotal !== 0}
                                <div class="ml-3 flex justify-between items-center py-0.5">
                                  <span class="text-[11px] text-gray-500">{item.name || item.code_type}</span>
                                  <span class="text-[10px] {isIncome ? 'text-emerald-500' : 'text-red-400'}">
                                    {formatMoney(itemTotal)}
                                  </span>
                                </div>
                              {/if}
                            {/each}
                          {/if}
                        </div>
                      {/if}
                    {/each}
                  </div>
                {/if}
              </div>
            {/if}
          {/each}
        </div>
      </div>
    {/if}
  {/if}
</div>
