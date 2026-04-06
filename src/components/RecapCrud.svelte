<script lang="ts">
  import { onMount } from 'svelte';
  import { recapApi } from '../lib/api';

  let recapData: any = null;
  let originalRecapData: any = null; // Store original data
  let loading = false;
  let error: string | null = null;
  let availableYears: number[] = [];

  // Reactive: month list from API (updates automatically when API data changes)
  $: monthList = originalRecapData?.months?.map((m: any) => ({
    year: m.year,
    month: m.month,
    label: m.label
  })) || [];

  // Month range filter
  let jarakBulan = 3; // Default to last 4 months
  let endYear = new Date().getFullYear();
  let endMonth = new Date().getMonth() + 1;
  let startMonth = endMonth - jarakBulan + 1;
  let startYear = new Date().getFullYear();

  if (startMonth <= 0) {
    startMonth += 12;
    startYear -= 1;
  }

  let showMonthFilter = false;

  function validateDateRange() {
    // Only ensure end is not before start
    const startDate = new Date(startYear, startMonth - 1);
    const endDate = new Date(endYear, endMonth - 1);
    if (endDate < startDate) {
      endYear = startYear;
      endMonth = startMonth;
    }
  }

  async function fetchRecap() {
    loading = true;
    error = null;
    try {
      // Build query params for multi-year fetch with month range
      const params = new URLSearchParams();
      params.append('startYear', startYear.toString());
      params.append('endYear', endYear.toString());
      params.append('startMonth', startMonth.toString());
      params.append('endMonth', endMonth.toString());

      console.log('Fetching recap with params:', params.toString());
      console.log('Date range:', `${startMonth}/${startYear} - ${endMonth}/${endYear}`);

      const response = await fetch(`/api/recap?${params.toString()}`);
      const data = await response.json();

      console.log('Recap data received:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch recap');
      }

      originalRecapData = data;
      console.log('originalRecapData.years:', originalRecapData.years);
      console.log('originalRecapData.months count:', originalRecapData.months?.length);
      console.log('monthList will update to:', originalRecapData.months?.map((m: any) => m.label));
      console.log('originalRecapData.details:', originalRecapData.details);
      applyMonthFilter();
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to fetch recap';
      console.error('Error fetching recap:', err);
    } finally {
      loading = false;
    }
  }

  function applyMonthFilter() {
    if (!originalRecapData) return;

    // Just pass through the original data - API already returns filtered data
    recapData = originalRecapData;
  }

  async function fetchYears() {
    try {
      // Get available years from transactions
      const response = await fetch('/api/transactions/years');
      const data = await response.json();
      availableYears = data.years || [new Date().getFullYear()];
    } catch (err) {
      availableYears = [new Date().getFullYear()];
    }
  }

  function formatMoney(amount: number | undefined): string {
    if (!amount) return '0';
    return new Intl.NumberFormat('id-ID', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  function getAmountColor(amount: number): string {
    if (amount >= 0) return 'text-emerald-600';
    return 'text-rose-500';
  }

  function getAmountBg(amount: number): string {
    if (amount >= 0) return 'bg-emerald-50';
    return 'bg-rose-50';
  }

  function getRowColor(codeType: string): { text: string; bg: string } {
    const code = codeType?.toString() || '';
    if (code.startsWith('4')) {
      return { text: 'text-emerald-600', bg: 'bg-emerald-50' };
    } else if (code.startsWith('5')) {
      return { text: 'text-rose-600', bg: 'bg-rose-50' };
    }
    return { text: 'text-slate-700', bg: 'bg-transparent' };
  }

  function getSubRowColor(codeType: string): { text: string; bg: string } {
    const code = codeType?.toString() || '';
    if (code.startsWith('5')) {
      return { text: 'text-rose-500', bg: 'bg-rose-50/30' };
    }
    return { text: 'text-slate-600', bg: 'bg-slate-50/30' };
  }

  function getGrandChildRowColor(): { text: string; bg: string } {
    return { text: 'text-slate-500', bg: 'bg-slate-50/50' };
  }

  // Get value for a specific month/year from the structured monthly array
  function getValueForMonth(monthlyArray: { year: number; month: number; amount: number }[], year: number, month: number): number {
    if (!monthlyArray) return 0;
    const item = monthlyArray.find(m => m.year === year && m.month === month);
    return item?.amount || 0;
  }

  function getFilteredTotal(monthlyArray: { year: number; month: number; amount: number }[]): number {
    return monthList.reduce((sum: number, { year, month }: { year: number; month: number }) => {
      return sum + getValueForMonth(monthlyArray, year, month);
    }, 0);
  }

  function getFilteredArray(monthlyArray: { year: number; month: number; amount: number }[]): number[] {
    return monthList.map(({ year, month }: { year: number; month: number }) => getValueForMonth(monthlyArray, year, month));
  }

  onMount(() => {
    fetchYears();
    fetchRecap();
  });

  // Validate date range when inputs change
  $: if (startYear || startMonth) {
    validateDateRange();
  }
  $: if (endYear || endMonth) {
    validateDateRange();
  }
</script>

<div class="max-w-full mx-auto px-2 sm:px-4 py-6 sm:py-8">
  <!-- Header -->
  <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
    <div>
      <h1 class="text-2xl font-semibold text-slate-800">Rekapitulasi</h1>
      <p class="text-sm text-slate-500 mt-1">Ringkasan keuangan tahunan</p>
    </div>
    <div class="flex items-center gap-3">
      <button
        on:click={fetchRecap}
        class="inline-flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-medium transition-all disabled:opacity-50"
        disabled={loading}
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        Refresh
      </button>
    </div>
  </div>

  <!-- Month Range Filter -->
  <div class="mb-6">
    <button
      on:click={() => showMonthFilter = !showMonthFilter}
      class="w-full flex items-center justify-between gap-4 px-3 sm:px-5 py-3 sm:py-3.5 bg-white rounded-2xl border border-slate-200 shadow-sm hover:bg-slate-50 transition-all"
    >
      <div class="flex items-center gap-3">
        <div class="p-1.5 bg-violet-100 rounded-lg">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <span class="text-sm font-semibold text-slate-700">Filter Periode</span>
        <span class="text-xs text-slate-500">
          {startMonth}/{startYear} - {endMonth}/{endYear}
        </span>
      </div>
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-slate-400 transition-transform {showMonthFilter ? 'rotate-180' : ''}" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
      </svg>
    </button>

    {#if showMonthFilter}
      <div class="mt-3 p-3 sm:p-5 bg-white rounded-2xl border border-slate-200 shadow-sm">
        <div class="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label for="filterStartMonth" class="block text-xs font-medium text-slate-600 mb-1.5">Dari Bulan</label>
            <select
              id="filterStartMonth"
              bind:value={startMonth}
              class="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            >
              {#each Array.from({ length: 12 }, (_, i) => i + 1) as m}
                <option value={m}>{m}</option>
              {/each}
            </select>
          </div>
          <div>
            <label for="filterStartYear" class="block text-xs font-medium text-slate-600 mb-1.5">Dari Tahun</label>
            <select
              id="filterStartYear"
              bind:value={startYear}
              class="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            >
              {#each availableYears as year}
                <option value={year}>{year}</option>
              {/each}
            </select>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label for="filterEndMonth" class="block text-xs font-medium text-slate-600 mb-1.5">Sampai Bulan</label>
            <select
              id="filterEndMonth"
              bind:value={endMonth}
              class="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            >
              {#each Array.from({ length: 12 }, (_, i) => i + 1) as m}
                <option value={m}>{m}</option>
              {/each}
            </select>
          </div>
          <div>
            <label for="filterEndYear" class="block text-xs font-medium text-slate-600 mb-1.5">Sampai Tahun</label>
            <select
              id="filterEndYear"
              bind:value={endYear}
              class="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            >
              {#each availableYears as year}
                <option value={year}>{year}</option>
              {/each}
            </select>
          </div>
        </div>
        <button
          on:click={() => {
            validateDateRange();
            fetchRecap();
          }}
          class="w-full mt-4 px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-medium text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          disabled={loading}
        >
          {#if loading}
            <svg class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Memuat...
          {:else}
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Terapkan Filter
          {/if}
        </button>
      </div>
    {/if}
  </div>

  {#if error}
    <div class="mb-4 p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl flex items-start gap-3">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-rose-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span class="text-sm font-medium">{error}</span>
    </div>
  {/if}

  {#if loading && !recapData}
    <div class="flex items-center justify-center py-16">
      <div class="flex items-center gap-3">
        <svg class="animate-spin h-5 w-5 text-violet-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span class="text-sm font-medium text-slate-700">Loading...</span>
      </div>
    </div>
  {:else if recapData}
    <!-- Summary Cards - calculated directly from API data -->
    {@const apiIncome = originalRecapData?.income || 0}
    {@const apiExpense = originalRecapData?.expense || 0}
    {@const apiBalance = originalRecapData?.balance || 0}
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
      <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-slate-500">Pendapatan</p>
            <p class="text-xl sm:text-2xl font-bold text-emerald-600 mt-1">{formatMoney(apiIncome)}</p>
          </div>
          <div class="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 11l5-5m0 0l5 5m-5-5v12" />
            </svg>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-slate-500">Pengeluaran</p>
            <p class="text-xl sm:text-2xl font-bold text-rose-500 mt-1">{formatMoney(apiExpense)}</p>
          </div>
          <div class="w-12 h-12 bg-rose-100 rounded-xl flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 13l-5 5m0 0l-5-5m5 5V6" />
            </svg>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-slate-500">Sisa</p>
            <p class="text-xl sm:text-2xl font-bold {apiBalance >= 0 ? 'text-emerald-600' : 'text-rose-500'} mt-1">{formatMoney(apiBalance)}</p>
          </div>
          <div class="w-12 h-12 bg-violet-100 rounded-xl flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
      </div>
    </div>

    <!-- Recap Table -->
    <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="bg-slate-50/80 border-b border-slate-200">
              <th class="px-1 sm:px-2 py-2 text-left text-[10px] font-semibold text-slate-600 uppercase tracking-wide sticky left-0 bg-slate-50/80 z-10">Kode</th>
              <th class="px-2 sm:px-3 py-2 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">Type</th>
              {#each monthList as m}
                <th class="px-1 sm:px-2 py-2 text-center text-xs font-semibold text-slate-600 uppercase tracking-wide whitespace-nowrap">
                  {m.label}
                </th>
              {/each}
              <th class="px-1 sm:px-2 py-2 text-right text-xs font-semibold text-violet-600 uppercase tracking-wide">Total</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            {#each recapData.details as item}
              {@const rootColor = getRowColor(item.code_type)}
              {@const isRoot5 = item.code_type?.toString().startsWith('5')}
              {@const filteredMonthly = getFilteredArray(item.monthly)}
              {@const rowTotal = getFilteredTotal(item.monthly)}
              <tr class="hover:opacity-80 {rootColor.bg}">
                <td class="px-1 sm:px-2 py-1.5 text-xs font-mono {rootColor.text} {isRoot5 ? 'font-bold' : ''}">{item.code_type}</td>
                <td class="px-2 sm:px-3 py-1.5 text-sm {rootColor.text} {isRoot5 ? 'font-bold' : 'font-medium'}">{item.name}</td>
                {#each filteredMonthly as amount}
                  <td class="px-1 sm:px-2 py-1.5 text-sm text-right {rootColor.text} whitespace-nowrap">
                    {amount > 0 ? formatMoney(amount) : '-'}
                  </td>
                {/each}
                <td class="px-1 sm:px-2 py-1.5 text-sm text-right font-semibold {rootColor.text} whitespace-nowrap">
                  {rowTotal > 0 ? formatMoney(rowTotal) : '-'}
                </td>
              </tr>

              {#if item.children && item.children.length > 0}
                {#each item.children as child}
                  <!-- Level 2: Subcategory -->
                  {@const subColor = getSubRowColor(child.code_type)}
                  {@const isSub5 = child.code_type?.toString().startsWith('5')}
                  {@const filteredChildMonthly = getFilteredArray(child.monthly)}
                  {@const childRowTotal = getFilteredTotal(child.monthly)}
                  <tr class="hover:opacity-80 {subColor.bg}">
                    <td class="px-1 sm:px-2 py-1.5 text-xs font-mono {subColor.text} {isSub5 ? 'font-bold' : ''} pl-3 sm:pl-6">{child.code_type}</td>
                    <td class="px-2 sm:px-3 py-1.5 text-sm {subColor.text} {isSub5 ? 'font-bold' : ''} pl-3 sm:pl-6">{child.name}</td>
                    {#each filteredChildMonthly as amount}
                      <td class="px-1 sm:px-2 py-1.5 text-sm text-right {subColor.text} whitespace-nowrap">
                        {amount > 0 ? formatMoney(amount) : '-'}
                      </td>
                    {/each}
                    <td class="px-1 sm:px-2 py-1.5 text-sm text-right font-semibold {subColor.text} whitespace-nowrap">
                      {childRowTotal > 0 ? formatMoney(childRowTotal) : '-'}
                    </td>
                  </tr>

                  <!-- Level 3: Grandchild -->
                  {#if child.children && child.children.length > 0}
                    {#each child.children as grandChild}
                      {@const grandChildColor = getGrandChildRowColor()}
                      {@const filteredGrandChildMonthly = getFilteredArray(grandChild.monthly)}
                      {@const grandChildRowTotal = getFilteredTotal(grandChild.monthly)}
                      <tr class="hover:opacity-80 {grandChildColor.bg}">
                        <td class="px-1 sm:px-2 py-1.5 text-xs font-mono {grandChildColor.text} pl-6 sm:pl-10">{grandChild.code_type}</td>
                        <td class="px-2 sm:px-3 py-1.5 text-sm {grandChildColor.text} pl-6 sm:pl-10">{grandChild.name}</td>
                        {#each filteredGrandChildMonthly as amount}
                          <td class="px-1 sm:px-2 py-1.5 text-sm text-right {grandChildColor.text} whitespace-nowrap">
                            {amount > 0 ? formatMoney(amount) : '-'}
                          </td>
                        {/each}
                        <td class="px-1 sm:px-2 py-1.5 text-sm text-right font-semibold {grandChildColor.text} whitespace-nowrap">
                          {grandChildRowTotal > 0 ? formatMoney(grandChildRowTotal) : '-'}
                        </td>
                      </tr>
                    {/each}
                  {/if}
                {/each}
              {/if}
            {/each}

            <!-- Total Bulanan -->
            {#if monthList.length > 0}
              {@const type4Data = originalRecapData?.details?.find((d: any) => d.code_type === '4')?.monthly || []}
              {@const type5Data = originalRecapData?.details?.find((d: any) => d.code_type === '5')?.monthly || []}
              {@const totalIncome = type4Data.reduce((sum: number, m: any) => sum + (m.amount || 0), 0)}
              {@const totalExpense = type5Data.reduce((sum: number, m: any) => sum + (m.amount || 0), 0)}
              {@const grandTotal = totalIncome - totalExpense}
              <tr class="bg-violet-50/50 border-t-2 border-violet-200">
                <td class="px-1 sm:px-2 py-2 text-xs font-semibold text-violet-700" colspan="2">Total Bulanan</td>
                {#each monthList as { year, month }}
                  {@const income = type4Data.find((m: any) => m.year === year && m.month === month)?.amount || 0}
                  {@const expense = type5Data.find((m: any) => m.year === year && m.month === month)?.amount || 0}
                  {@const balance = income - expense}
                  <td class="px-1 sm:px-2 py-2 text-sm text-right font-semibold {balance >= 0 ? 'text-emerald-600' : 'text-rose-500'} whitespace-nowrap">
                    {balance !== 0 ? formatMoney(balance) : '-'}
                  </td>
                {/each}
                <td class="px-1 sm:px-2 py-2 text-sm text-right font-bold {grandTotal >= 0 ? 'text-emerald-600' : 'text-rose-500'} whitespace-nowrap">
                  {grandTotal !== 0 ? formatMoney(grandTotal) : '-'}
                </td>
              </tr>
            {/if}
          </tbody>
        </table>
      </div>
    </div>
  {/if}
</div>
