<script lang="ts">
  import { onMount } from 'svelte';
  import { transactionApi, recapApi, statsApi, typeApi } from '../lib/api';
  import type { Transaction, TransactionStats, Type } from '../lib/types';
  import MobileNavbar from './MobileNavbar.svelte';
  import Modal from './Modal.svelte';

  let activeTab = $state('home');
  let currentUser: any = $state(null);

  // Transaction state
  let transactions: Transaction[] = $state([]);
  let types: Type[] = $state([]);
  let stats: TransactionStats | null = $state(null);
  let loading = $state(false);
  let error: string | null = $state(null);

  // Monthly summary for home
  let monthlyIncome = $state(0);
  let monthlyExpense = $state(0);
  let monthlyBalance = $state(0);
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  // Transaction form
  let showForm = $state(false);
  let editingTransaction: Transaction | null = $state(null);
  let formData = $state({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    note: '',
    code_type: '',
    money: 0
  });
  let moneyDisplay = $state('');

  // Transaction pagination
  let currentPage = $state(1);
  let pageSize = $state(10);
  let totalItems = $state(0);
  let totalPages = $state(0);

  // Transaction filters
  let filterType = $state('');
  let filterNote = $state('');
  let filterYear = $state('');
  let filterMonth = $state('');
  let showFilter = $state(false);

  // Recap state
  let recapData: any = $state(null);
  let loadinRecap = $state(false);
  let errorRecap: string | null = $state(null);
  let selectedYear = $state(new Date().getFullYear());
  let selectedRecapMonth = $state(0); // 0 = semua bulan

  // Month names
  const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

  // Type icon & color mapping
  const typeConfig: Record<string, { icon: string; color: string; bg: string }> = {
    '401': { icon: '💼', color: 'text-emerald-700', bg: 'bg-emerald-50' },
    '402': { icon: '💵', color: 'text-green-700', bg: 'bg-green-50' },
    '403': { icon: '🎁', color: 'text-teal-700', bg: 'bg-teal-50' },
    '50101': { icon: '👕', color: 'text-pink-700', bg: 'bg-pink-50' },
    '50102': { icon: '💅', color: 'text-rose-700', bg: 'bg-rose-50' },
    '50201': { icon: '🍽️', color: 'text-orange-700', bg: 'bg-orange-50' },
    '50202': { icon: '🍿', color: 'text-amber-700', bg: 'bg-amber-50' },
    '50203': { icon: '🍳', color: 'text-yellow-700', bg: 'bg-yellow-50' },
    '50204': { icon: '🧂', color: 'text-lime-700', bg: 'bg-lime-50' },
    '50301': { icon: '🏠', color: 'text-blue-700', bg: 'bg-blue-50' },
    '50302': { icon: '🧹', color: 'text-sky-700', bg: 'bg-sky-50' },
    '50303': { icon: '⚡', color: 'text-cyan-700', bg: 'bg-cyan-50' },
    '50304': { icon: '🚗', color: 'text-indigo-700', bg: 'bg-indigo-50' },
    '50305': { icon: '📱', color: 'text-violet-700', bg: 'bg-violet-50' },
    '50309': { icon: '🔧', color: 'text-gray-700', bg: 'bg-gray-100' },
    '50401': { icon: '🎓', color: 'text-purple-700', bg: 'bg-purple-50' },
    '50501': { icon: '📄', color: 'text-slate-700', bg: 'bg-slate-50' },
    '50502': { icon: '🏦', color: 'text-red-700', bg: 'bg-red-50' },
    '50601': { icon: '🎮', color: 'text-fuchsia-700', bg: 'bg-fuchsia-50' },
    '50602': { icon: '✈️', color: 'text-sky-700', bg: 'bg-sky-50' },
    '50701': { icon: '❤️', color: 'text-red-700', bg: 'bg-red-50' },
    '50801': { icon: '💊', color: 'text-emerald-700', bg: 'bg-emerald-50' },
    '50802': { icon: '🩺', color: 'text-teal-700', bg: 'bg-teal-50' },
    '50803': { icon: '🏥', color: 'text-cyan-700', bg: 'bg-cyan-50' },
    '50901': { icon: '⚖️', color: 'text-indigo-700', bg: 'bg-indigo-50' },
    '50902': { icon: '📦', color: 'text-gray-700', bg: 'bg-gray-100' },
  };

  // Group definitions for home screen categories
  const typeGroups = [
    { label: 'Pemasukan', codes: ['401', '402', '403'] },
    { label: 'Pakaian & Beauty', codes: ['50101', '50102'] },
    { label: 'Makanan', codes: ['50201', '50202', '50203', '50204'] },
    { label: 'Tempat Tinggal', codes: ['50301', '50302', '50303'] },
    { label: 'Transportasi & Komunikasi', codes: ['50304', '50305'] },
    { label: 'Lainnya', codes: ['50309', '50401', '50501', '50502', '50601', '50602', '50701', '50801', '50802', '50803', '50901', '50902'] },
  ];

  function getTypeConfig(code: string) {
    return typeConfig[code] || { icon: '📋', color: 'text-gray-700', bg: 'bg-gray-100' };
  }

  function openCreateFormWithType(codeType: string) {
    resetForm();
    formData.code_type = codeType;
    showForm = true;
  }

  function formatMoney(value: number): string {
    return new Intl.NumberFormat('id-ID').format(value);
  }

  function parseMoneyInput(value: string): number {
    return parseInt(value.replace(/\D/g, '')) || 0;
  }

  async function fetchHomeData() {
    loading = true;
    error = null;
    try {
      const [statsResult, recentResult, monthResult] = await Promise.all([
        statsApi.get(),
        transactionApi.getPaginated(1, 5),
        transactionApi.getPaginated(1, 500, { year: currentYear, month: currentMonth })
      ]);
      stats = statsResult;
      transactions = recentResult.data;
      totalItems = recentResult.total;

      // Calculate monthly income/expense
      let inc = 0;
      let exp = 0;
      monthResult.data.forEach((t: Transaction) => {
        const code = String(t.code_type || '');
        const money = t.money || 0;
        if (code.startsWith('4')) {
          inc += money;
        } else {
          exp += Math.abs(money);
        }
      });
      monthlyIncome = inc;
      monthlyExpense = exp;
      monthlyBalance = monthlyIncome - monthlyExpense;
    } catch (err: any) {
      error = err.message || 'Gagal memuat data';
    } finally {
      loading = false;
    }
  }

  async function fetchTypes() {
    try {
      types = await typeApi.getAll();
    } catch (err) {
      console.error('Failed to fetch types:', err);
    }
  }

  async function fetchTransactions() {
    loading = true;
    error = null;
    try {
      const filters: Record<string, any> = {};
      if (filterType) filters.code_type = filterType;
      if (filterNote) filters.note = filterNote;
      if (filterYear) filters.year = parseInt(filterYear);
      if (filterMonth) filters.month = parseInt(filterMonth);
      const result = await transactionApi.getPaginated(currentPage, pageSize, Object.keys(filters).length > 0 ? filters : undefined);
      transactions = result.data;
      totalItems = result.total;
      totalPages = result.totalPages;
    } catch (err: any) {
      error = err.message || 'Gagal memuat transaksi';
    } finally {
      loading = false;
    }
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

  function resetForm() {
    formData = {
      year: new Date().getFullYear(),
      month: new Date().getMonth() + 1,
      note: '',
      code_type: '',
      money: 0
    };
    moneyDisplay = '';
    editingTransaction = null;
  }

  function openCreateForm() {
    resetForm();
    showForm = true;
  }

  function openEditForm(transaction: Transaction) {
    editingTransaction = transaction;
    formData = {
      year: transaction.year || new Date().getFullYear(),
      month: transaction.month || new Date().getMonth() + 1,
      note: transaction.note || '',
      code_type: transaction.code_type || '',
      money: transaction.money || 0
    };
    moneyDisplay = transaction.money ? formatMoney(transaction.money) : '';
    showForm = true;
  }

  async function handleSubmit() {
    try {
      const submitData = {
        ...formData,
        money: parseMoneyInput(moneyDisplay)
      };
      if (editingTransaction) {
        await transactionApi.update(editingTransaction.id, submitData);
      } else {
        await transactionApi.create(submitData);
      }
      showForm = false;
      resetForm();
      if (activeTab === 'home') {
        await fetchHomeData();
      } else {
        await fetchTransactions();
      }
    } catch (err: any) {
      error = err.message || 'Gagal menyimpan';
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Hapus transaksi ini?')) return;
    try {
      await transactionApi.delete(id);
      await fetchTransactions();
    } catch (err: any) {
      error = err.message || 'Gagal menghapus';
    }
  }

  function clearFilters() {
    filterType = '';
    filterNote = '';
    filterYear = '';
    filterMonth = '';
    currentPage = 1;
    fetchTransactions();
  }

  function applyFilters() {
    currentPage = 1;
    fetchTransactions();
  }

  onMount(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) currentUser = JSON.parse(userStr);
  });

  $effect(() => {
    if (activeTab === 'home') {
      fetchTypes();
      fetchHomeData();
    }
  });

  $effect(() => {
    if (activeTab === 'transaksi') {
      fetchTypes();
      fetchTransactions();
    }
  });

  $effect(() => {
    if (activeTab === 'rekap') fetchRecap();
  });
</script>

<div class="min-h-screen pb-20" style="font-family: 'Quicksand', sans-serif;">
  {#if activeTab === 'home'}
    <!-- HOME TAB -->
    <div class="px-4 pt-6">
      <div class="mb-5">
        <h1 class="text-2xl font-bold text-gray-800" style="font-family: 'Quicksand', sans-serif;">ID Flow</h1>
        <p class="text-sm text-gray-500">Halo, {currentUser?.name || 'User'} 👋</p>
      </div>

      <!-- Monthly Summary -->
      <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-5">
        <div class="flex items-center justify-between mb-3">
          <h2 class="text-sm font-bold text-gray-700">{monthNames[currentMonth - 1]} {currentYear}</h2>
          <span class="text-[10px] font-semibold {monthlyBalance >= 0 ? 'text-emerald-600 bg-emerald-50' : 'text-red-600 bg-red-50'} px-2 py-0.5 rounded-full">
            {monthlyBalance >= 0 ? ' surplus' : ' defisit'}
          </span>
        </div>
        <div class="grid grid-cols-3 gap-3">
          <div class="text-center">
            <div class="w-10 h-10 mx-auto rounded-xl bg-emerald-50 flex items-center justify-center mb-1">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M7 11l5-5m0 0l5 5m-5-5v12"/></svg>
            </div>
            <p class="text-[10px] text-gray-400 font-medium">Pemasukan</p>
            <p class="text-sm font-bold text-emerald-600">{formatMoney(monthlyIncome)}</p>
          </div>
          <div class="text-center">
            <div class="w-10 h-10 mx-auto rounded-xl bg-red-50 flex items-center justify-center mb-1">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M17 13l-5 5m0 0l-5-5m5 5V6"/></svg>
            </div>
            <p class="text-[10px] text-gray-400 font-medium">Pengeluaran</p>
            <p class="text-sm font-bold text-red-500">{formatMoney(monthlyExpense)}</p>
          </div>
          <div class="text-center">
            <div class="w-10 h-10 mx-auto rounded-xl {monthlyBalance >= 0 ? 'bg-indigo-50' : 'bg-amber-50'} flex items-center justify-center mb-1">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 {monthlyBalance >= 0 ? 'text-indigo-600' : 'text-amber-600'}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.403 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.403-2.599-1"/></svg>
            </div>
            <p class="text-[10px] text-gray-400 font-medium">Sisa</p>
            <p class="text-sm font-bold {monthlyBalance >= 0 ? 'text-indigo-600' : 'text-amber-600'}">{formatMoney(Math.abs(monthlyBalance))}</p>
          </div>
        </div>
      </div>

      <!-- Type Quick Actions -->
      {#each typeGroups as group}
        <div class="mb-4">
          <h2 class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{group.label}</h2>
          <div class="grid grid-cols-4 gap-2">
            {#each group.codes as code}
              {@const config = getTypeConfig(code)}
              {@const typeName = types.find(t => t.code_type === code)?.name || code}
              <button
                on:click={() => openCreateFormWithType(code)}
                class="flex flex-col items-center gap-1 rounded-xl p-2 active:scale-95 transition-transform {config.bg}"
              >
                <span class="text-xl">{config.icon}</span>
                <span class="text-[10px] font-semibold text-gray-700 leading-tight text-center line-clamp-2">{typeName}</span>
              </button>
            {/each}
          </div>
        </div>
      {/each}

      {#if loading}
        <div class="flex justify-center py-8">
          <div class="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
        </div>
      {:else if error}
        <div class="bg-red-50 text-red-600 p-4 rounded-xl text-sm">{error}</div>
      {:else if stats}
        <!-- Stats Cards -->
        <div class="grid grid-cols-3 gap-3 mb-6">
          <div class="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-4 text-white">
            <p class="text-[10px] uppercase tracking-wider opacity-80">Total Transaksi</p>
            <p class="text-xl font-bold mt-1">{stats.totalTransactions}</p>
          </div>
          <div class="bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl p-4 text-white">
            <p class="text-[10px] uppercase tracking-wider opacity-80">Total Uang</p>
            <p class="text-lg font-bold mt-1">{formatMoney(stats.totalMoney)}</p>
          </div>
          <div class="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-4 text-white">
            <p class="text-[10px] uppercase tracking-wider opacity-80">Rata-rata</p>
            <p class="text-lg font-bold mt-1">{formatMoney(Math.round(stats.averageMoney))}</p>
          </div>
        </div>

        <!-- Recent Transactions -->
        <div class="mb-4">
          <div class="flex justify-between items-center mb-3">
            <h2 class="text-base font-bold text-gray-800">Transaksi Terakhir</h2>
            <button on:click={() => activeTab = 'transaksi'} class="text-xs text-indigo-600 font-semibold">Lihat Semua</button>
          </div>
          <div class="space-y-2">
            {#each transactions.slice(0, 5) as transaction}
              <div class="bg-white rounded-xl p-3 shadow-sm border border-gray-100">
                <div class="flex justify-between items-start">
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-semibold text-gray-800 truncate">{transaction.note || '-'}</p>
                    <p class="text-[11px] text-gray-400 mt-0.5">{transaction.code_type || '-'} · {monthNames[(transaction.month || 1) - 1]} {transaction.year}</p>
                  </div>
                  <p class="text-sm font-bold {String(transaction.code_type || '').startsWith('4') ? 'text-emerald-600' : 'text-red-500'}">
                    {String(transaction.code_type || '').startsWith('4') ? '+' : '-'}{formatMoney(Math.abs(transaction.money || 0))}
                  </p>
                </div>
              </div>
            {/each}
          </div>
        </div>
      {/if}
    </div>

  {:else if activeTab === 'rekap'}
    <!-- REKAP TAB -->
    <div class="px-4 pt-6">
      <div class="flex items-center justify-between mb-4">
        <h1 class="text-xl font-bold text-gray-800">Rekapitulasi</h1>
        <select bind:value={selectedYear} on:change={() => fetchRecap()} class="text-sm bg-white border border-gray-200 rounded-lg px-3 py-1.5 font-medium">
          {#each [2025, 2026, 2027] as year}
            <option value={year}>{year}</option>
          {/each}
        </select>
      </div>

      {#if loadinRecap}
        <div class="flex justify-center py-12">
          <div class="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
        </div>
      {:else if errorRecap}
        <div class="bg-red-50 text-red-600 p-4 rounded-xl text-sm">{errorRecap}</div>
      {:else if recapData}
        <!-- Summary Cards -->
        <div class="grid grid-cols-3 gap-3 mb-5">
          <div class="bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl p-3 text-white">
            <p class="text-[10px] uppercase tracking-wider opacity-80">Pemasukan</p>
            <p class="text-base font-bold mt-1">{formatMoney(recapData.income || 0)}</p>
          </div>
          <div class="bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl p-3 text-white">
            <p class="text-[10px] uppercase tracking-wider opacity-80">Pengeluaran</p>
            <p class="text-base font-bold mt-1">{formatMoney(recapData.expense || 0)}</p>
          </div>
          <div class="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-3 text-white">
            <p class="text-[10px] uppercase tracking-wider opacity-80">Saldo</p>
            <p class="text-base font-bold mt-1">{formatMoney(recapData.balance || 0)}</p>
          </div>
        </div>

        <!-- Monthly Balance -->
        {#if recapData.monthlyBalance}
          <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-4">
            <h3 class="text-sm font-bold text-gray-700 mb-3">Saldo Bulanan</h3>
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
          <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
            <div class="flex items-center justify-between mb-3">
              <h3 class="text-sm font-bold text-gray-700">Rincian per Tipe</h3>
              <select bind:value={selectedRecapMonth} class="text-xs bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 font-medium">
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

  {:else if activeTab === 'transaksi'}
    <!-- TRANSAKSI TAB -->
    <div class="px-4 pt-6">
      <div class="flex items-center justify-between mb-3">
        <h1 class="text-xl font-bold text-gray-800">Transaksi</h1>
        <div class="flex items-center gap-2">
          <button on:click={() => showFilter = !showFilter} class="p-2 rounded-xl border border-gray-200 bg-white active:bg-gray-50 relative">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"/></svg>
            {#if filterType || filterNote || filterYear || filterMonth}
              <span class="absolute -top-1 -right-1 w-2 h-2 bg-indigo-500 rounded-full"></span>
            {/if}
          </button>
          <button on:click={openCreateForm} class="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-md active:scale-95 transition-transform">
            + Tambah
          </button>
        </div>
      </div>

      <!-- Filter Panel -->
      {#if showFilter}
        <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-4">
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-[11px] font-semibold text-gray-500 mb-1">Tipe</label>
              <select bind:value={filterType} class="w-full border border-gray-200 rounded-lg px-2 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-300">
                <option value="">Semua</option>
                {#each types as type}
                  <option value={type.code_type}>{type.name || type.code_type}</option>
                {/each}
              </select>
            </div>
            <div>
              <label class="block text-[11px] font-semibold text-gray-500 mb-1">Bulan</label>
              <select bind:value={filterMonth} class="w-full border border-gray-200 rounded-lg px-2 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-300">
                <option value="">Semua</option>
                {#each monthNames as month, i}
                  <option value={i + 1}>{month}</option>
                {/each}
              </select>
            </div>
            <div>
              <label class="block text-[11px] font-semibold text-gray-500 mb-1">Tahun</label>
              <input type="number" bind:value={filterYear} placeholder="Tahun" class="w-full border border-gray-200 rounded-lg px-2 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-300" />
            </div>
            <div>
              <label class="block text-[11px] font-semibold text-gray-500 mb-1">Catatan</label>
              <input type="text" bind:value={filterNote} placeholder="Cari catatan..." class="w-full border border-gray-200 rounded-lg px-2 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-300" />
            </div>
          </div>
          <div class="flex gap-2 mt-3">
            <button on:click={clearFilters} class="flex-1 py-2 rounded-lg border border-gray-200 text-gray-500 text-xs font-bold active:bg-gray-50">Reset</button>
            <button on:click={applyFilters} class="flex-1 py-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-xs font-bold active:scale-95 transition-transform shadow-sm">Cari</button>
          </div>
        </div>
      {/if}

      {#if loading}
        <div class="flex justify-center py-12">
          <div class="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
        </div>
      {:else if error}
        <div class="bg-red-50 text-red-600 p-4 rounded-xl text-sm">{error}</div>
      {:else}
        <div class="space-y-2">
          {#each transactions as transaction}
            <div class="bg-white rounded-xl p-3 shadow-sm border border-gray-100">
              <div class="flex justify-between items-start">
<div class="flex-1 min-w-0">
                    <p class="text-sm font-semibold text-gray-800 truncate">{transaction.note || '-'}</p>
                    <p class="text-[11px] text-gray-400 mt-0.5">{transaction.code_type || '-'} · {monthNames[(transaction.month || 1) - 1]} {transaction.year}</p>
                    <p class="text-[10px] text-gray-300 mt-0.5">{transaction.created_at ? new Date(transaction.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}{#if transaction.created_by} · oleh {transaction.created_by}{/if}</p>
                  </div>
                <div class="flex items-center gap-2 ml-2">
                  <p class="text-sm font-bold {String(transaction.code_type || '').startsWith('4') ? 'text-emerald-600' : 'text-red-500'}">
                    {String(transaction.code_type || '').startsWith('4') ? '+' : '-'}{formatMoney(Math.abs(transaction.money || 0))}
                  </p>
                  <button on:click={() => openEditForm(transaction)} class="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-indigo-600 transition-colors" title="Edit">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                  </button>
                  <button on:click={() => handleDelete(transaction.id)} class="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-red-500 transition-colors" title="Hapus">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                  </button>
                </div>
              </div>
            </div>
          {/each}
        </div>

        <!-- Pagination -->
        {#if totalPages > 1}
          <div class="flex justify-center items-center gap-2 mt-4 mb-2">
            <button on:click={() => { currentPage = currentPage - 1; fetchTransactions(); }} disabled={currentPage <= 1} class="px-3 py-1.5 text-xs rounded-lg bg-white border border-gray-200 disabled:opacity-40 font-bold">Prev</button>
            <span class="text-xs text-gray-500 font-medium">{currentPage} / {totalPages}</span>
            <button on:click={() => { currentPage = currentPage + 1; fetchTransactions(); }} disabled={currentPage >= totalPages} class="px-3 py-1.5 text-xs rounded-lg bg-white border border-gray-200 disabled:opacity-40 font-bold">Next</button>
          </div>
        {/if}
      {/if}
    </div>

  {:else if activeTab === 'pengaturan'}
    <!-- PENGATURAN TAB -->
    <div class="px-4 pt-6">
      <h1 class="text-xl font-bold text-gray-800 mb-6">Pengaturan</h1>

      {#if currentUser}
        <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-4">
          <div class="flex items-center gap-4">
            <div class="w-14 h-14 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold shadow-lg">
              {currentUser.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div>
              <p class="text-base font-bold text-gray-800">{currentUser.name}</p>
              <p class="text-sm text-gray-400">@{currentUser.username}</p>
            </div>
          </div>
        </div>
      {/if}

      <div class="space-y-2">
        <a href="/" class="flex items-center justify-between bg-white rounded-xl p-4 shadow-sm border border-gray-100 active:bg-gray-50">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 bg-indigo-50 rounded-lg flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
              </svg>
            </div>
            <span class="text-sm font-semibold text-gray-700">Tampilan Desktop</span>
          </div>
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg>
        </a>

        <a href="/users" class="flex items-center justify-between bg-white rounded-xl p-4 shadow-sm border border-gray-100 active:bg-gray-50">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 bg-emerald-50 rounded-lg flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
              </svg>
            </div>
            <span class="text-sm font-semibold text-gray-700">Kelola Pengguna</span>
          </div>
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg>
        </a>

        <a href="/types" class="flex items-center justify-between bg-white rounded-xl p-4 shadow-sm border border-gray-100 active:bg-gray-50">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 bg-purple-50 rounded-lg flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/>
              </svg>
            </div>
            <span class="text-sm font-semibold text-gray-700">Kelola Tipe Transaksi</span>
          </div>
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg>
        </a>

        <a href="/stats" class="flex items-center justify-between bg-white rounded-xl p-4 shadow-sm border border-gray-100 active:bg-gray-50">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 bg-amber-50 rounded-lg flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
              </svg>
            </div>
            <span class="text-sm font-semibold text-gray-700">Statistik Lengkap</span>
          </div>
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg>
        </a>
      </div>

      <!-- Logout -->
      <div class="mt-8">
        <button
          on:click={() => {
            document.cookie = 'auth_token=; Max-Age=0; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT';
            localStorage.removeItem('user');
            window.location.href = '/login';
          }}
          class="w-full bg-red-50 text-red-600 py-3 rounded-xl text-sm font-bold active:bg-red-100 transition-colors"
        >
          Keluar
        </button>
      </div>
    </div>
  {/if}
</div>

<!-- Transaction Form Modal -->
{#if showForm}
  <div class="fixed inset-0 z-[60] flex items-end justify-center bg-black/50" on:click|self={() => showForm = false}>
    <div class="bg-white w-full max-w-lg rounded-t-2xl max-h-[90vh] overflow-y-auto" on:click|stopPropagation>
      <div class="sticky top-0 bg-white z-10 p-5 pb-2 flex justify-between items-center border-b border-gray-100">
        <h2 class="text-lg font-bold text-gray-800">{editingTransaction ? 'Edit Transaksi' : 'Tambah Transaksi'}</h2>
        <button on:click={() => showForm = false} class="text-gray-400 hover:text-gray-600 p-1">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
      </div>

      <form on:submit|preventDefault={handleSubmit} class="p-5 pt-4 space-y-4">
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-sm font-semibold text-gray-600 mb-1">Tahun</label>
            <input type="number" bind:value={formData.year} class="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:bg-white" />
          </div>
          <div>
            <label class="block text-sm font-semibold text-gray-600 mb-1">Bulan</label>
            <select bind:value={formData.month} class="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:bg-white">
              {#each monthNames as month, i}
                <option value={i + 1}>{month}</option>
              {/each}
            </select>
          </div>
        </div>

        <div>
          <label class="block text-sm font-semibold text-gray-600 mb-1">Tipe</label>
          <select bind:value={formData.code_type} class="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:bg-white">
            <option value="">Pilih tipe...</option>
            {#each types as type}
              <option value={type.code_type}>{type.name || type.code_type}</option>
            {/each}
          </select>
        </div>

        <div>
          <label class="block text-sm font-semibold text-gray-600 mb-1">Catatan</label>
          <input type="text" bind:value={formData.note} placeholder="Catatan transaksi" class="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:bg-white" />
        </div>

        <div>
          <label class="block text-sm font-semibold text-gray-600 mb-1">Jumlah Uang</label>
          <input type="text" bind:value={moneyDisplay} on:input={(e) => { moneyDisplay = e.target.value.replace(/\D/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, '.'); formData.money = parseInt(e.target.value.replace(/\D/g, '')) || 0; }} placeholder="0" class="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:bg-white" />
        </div>

        <div class="flex gap-3 pt-2 pb-2">
          <button type="button" on:click={() => showForm = false} class="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-bold active:bg-gray-50">Batal</button>
          <button type="submit" class="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-bold active:scale-95 transition-transform shadow-md">
            {editingTransaction ? 'Simpan' : 'Tambah'}
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}

<MobileNavbar bind:activeTab />