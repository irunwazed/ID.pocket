<script lang="ts">
  import { onMount } from 'svelte';
  import { transactionApi, typeApi } from '../lib/api';
  import type { Transaction, TransactionFormData, Type } from '../lib/types';
  import Modal from './Modal.svelte';
  import SearchableSelect from './SearchableSelect.svelte';

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  let transactions: Transaction[] = [];
  let types: Type[] = [];
  let loading = false;
  let error: string | null = null;
  let showForm = false;
  let editingTransaction: Transaction | null = null;
  let formData: TransactionFormData = {
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    note: '',
    code_type: '',
    money: 0
  };

  // Pagination
  let currentPage = 1;
  let pageSize = 10;
  let totalItems = 0;
  let totalPages = 0;

  // Filters
  let filterType = '';
  let filterNote = '';
  let filterYear = '';
  let filterMonth = '';
  let showFilter = false;

  // Money input formatting
  let moneyDisplay = '';

  function formatMoneyInput(value: string): string {
    const cleanValue = value.replace(/\D/g, '');
    if (!cleanValue) return '';
    return parseInt(cleanValue).toLocaleString('id-ID');
  }

  function parseMoneyInput(value: string): number {
    const cleanValue = value.replace(/\D/g, '');
    return cleanValue ? parseInt(cleanValue) : 0;
  }

  function handleMoneyInput(e: Event) {
    const input = e.target as HTMLInputElement;
    const formatted = formatMoneyInput(input.value);
    moneyDisplay = formatted;
    formData.money = parseMoneyInput(formatted);
  }

  // Prepare types options for SearchableSelect
  $: typeOptions = types.map(t => ({
    value: t.code_type || '',
    label: t.name || '',
    code: t.code_type || ''
  }));

  async function fetchTransactions() {
    loading = true;
    error = null;
    try {
      const result = await transactionApi.getPaginated(currentPage, pageSize, {
        code_type: filterType || undefined,
        note: filterNote || undefined,
        year: filterYear ? parseInt(filterYear) : undefined,
        month: filterMonth ? parseInt(filterMonth) : undefined
      });
      transactions = result.data;
      totalItems = result.total;
      totalPages = result.totalPages;
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to fetch transactions';
      console.error('Error fetching transactions:', err);
    } finally {
      loading = false;
    }
  }

  function applyFilters() {
    currentPage = 1;
    fetchTransactions();
  }

  function resetFilters() {
    filterType = '';
    filterNote = '';
    filterYear = '';
    filterMonth = '';
    currentPage = 1;
    fetchTransactions();
  }

  function changePage(newPage: number) {
    if (newPage >= 1 && newPage <= totalPages) {
      currentPage = newPage;
      fetchTransactions();
    }
  }

  function changePageSize(newSize: number) {
    pageSize = newSize;
    currentPage = 1;
    fetchTransactions();
  }

  async function fetchTypes() {
    try {
      types = await typeApi.getAll();
    } catch (err) {
      console.error('Error fetching types:', err);
    }
  }

  function openCreateForm() {
    editingTransaction = null;
    formData = {
      year: new Date().getFullYear(),
      month: new Date().getMonth() + 1,
      note: '',
      code_type: '',
      money: 0
    };
    moneyDisplay = '';
    showForm = true;
  }

  function openEditForm(transaction: Transaction) {
    editingTransaction = transaction;
    formData = {
      year: transaction.year,
      month: transaction.month,
      note: transaction.note,
      code_type: transaction.code_type,
      money: transaction.money
    };
    moneyDisplay = transaction.money ? transaction.money.toLocaleString('id-ID') : '';
    showForm = true;
  }

  function closeForm() {
    showForm = false;
    editingTransaction = null;
    formData = {
      year: new Date().getFullYear(),
      month: new Date().getMonth() + 1,
      note: '',
      code_type: '',
      money: 0
    };
  }

  async function saveTransaction() {
    loading = true;
    error = null;
    try {
      if (editingTransaction) {
        await transactionApi.update(editingTransaction.id, formData);
      } else {
        await transactionApi.create(formData);
      }
      closeForm();
      await fetchTransactions();
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to save transaction';
      console.error('Error saving transaction:', err);
    } finally {
      loading = false;
    }
  }

  async function deleteTransaction(id: string) {
    if (!confirm('Are you sure you want to delete this transaction?')) return;

    loading = true;
    error = null;
    try {
      await transactionApi.delete(id);
      await fetchTransactions();
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to delete transaction';
      console.error('Error deleting transaction:', err);
    } finally {
      loading = false;
    }
  }

  function formatMoney(amount: number | undefined): string {
    if (!amount) return '0';
    return new Intl.NumberFormat('id-ID', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  function formatDate(dateString: string | undefined): string {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).format(date);
  }

  function getTypeName(codeType: string | undefined): string {
    if (!codeType) return '-';
    const type = types.find(t => t.code_type === codeType);
    return type?.name || codeType;
  }

  function getAmountColor(codeType: string | undefined): string {
    if (!codeType) return 'text-slate-700';

    const code = codeType.toString().trim();
    if (code.startsWith('4')) {
      return 'text-emerald-600';
    }
    if (code.startsWith('5')) {
      return 'text-rose-500';
    }
    return 'text-slate-700';
  }

  function getAmountBg(codeType: string | undefined): string {
    if (!codeType) return 'bg-slate-50';

    const code = codeType.toString().trim();
    if (code.startsWith('4')) {
      return 'bg-emerald-50';
    }
    if (code.startsWith('5')) {
      return 'bg-rose-50';
    }
    return 'bg-slate-50';
  }

  // Generate page numbers for pagination
  function getPageNumbers(): Array<{ type: 'page' | 'ellipsis'; value?: number; key: string }> {
    const pages: Array<{ type: 'page' | 'ellipsis'; value?: number; key: string }> = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push({ type: 'page', value: i, key: `page-${i}` });
      }
    } else {
      // Always show page 1
      pages.push({ type: 'page', value: 1, key: 'page-1' });

      // Calculate the visible range around current page (show 2 pages on each side)
      let start = Math.max(2, currentPage - 2);
      let end = Math.min(totalPages - 1, currentPage + 2);

      // Show ellipsis at start if there's a gap after page 1
      if (start > 2) {
        pages.push({ type: 'ellipsis', key: 'ellipsis-start' });
      } else {
        // No gap, show page 2
        start = 2;
      }

      // Add middle pages
      for (let i = start; i <= end; i++) {
        pages.push({ type: 'page', value: i, key: `page-${i}` });
      }

      // Show ellipsis at end if there's a gap before last page
      if (end < totalPages - 1) {
        pages.push({ type: 'ellipsis', key: 'ellipsis-end' });
      }

      // Always show last page
      pages.push({ type: 'page', value: totalPages, key: `page-${totalPages}` });
    }

    return pages;
  }

  onMount(() => {
    fetchTransactions();
    fetchTypes();
  });
</script>

<div class="max-w-7xl mx-auto px-2 sm:px-4 py-6 sm:py-8">
  <!-- Header -->
  <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
    <div>
      <h1 class="text-2xl font-semibold text-slate-800">Transactions</h1>
      <p class="text-sm text-slate-500 mt-1">Manage your financial records</p>
    </div>
    <button
      on:click={openCreateForm}
      class="inline-flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-medium transition-all duration-200 shadow-sm hover:shadow disabled:opacity-50 disabled:cursor-not-allowed"
      disabled={loading}
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
      </svg>
      Add Transaction
    </button>
  </div>

  <!-- Filters Toggle -->
  <div class="mb-6">
    <button
      on:click={() => showFilter = !showFilter}
      class="w-full flex items-center justify-between gap-4 px-3 sm:px-5 py-3 sm:py-3.5 bg-white rounded-2xl border border-slate-200 shadow-sm hover:bg-slate-50 transition-all"
    >
      <div class="flex items-center gap-3">
        <div class="p-1.5 bg-violet-100 rounded-lg">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
        </div>
        <span class="text-sm font-semibold text-slate-700">Filter Transactions</span>
        {#if filterType || filterNote || filterYear || filterMonth}
          <span class="px-2 py-0.5 text-xs bg-violet-100 text-violet-700 rounded-full font-medium">Active</span>
        {/if}
      </div>
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-slate-400 transition-transform {showFilter ? 'rotate-180' : ''}" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
      </svg>
    </button>

    {#if showFilter}
      <div class="mt-3 p-3 sm:p-5 bg-white rounded-2xl border border-slate-200 shadow-sm {loading ? 'opacity-60 pointer-events-none' : ''}">
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label class="block text-xs font-medium text-slate-600 mb-1.5">Type</label>
            <select
              bind:value={filterType}
              class="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all disabled:bg-slate-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              <option value="">All Types</option>
              {#each types as type (type.id)}
                <option value={type.code_type}>{type.name}</option>
              {/each}
            </select>
          </div>
          <div>
            <label class="block text-xs font-medium text-slate-600 mb-1.5">Search Note</label>
            <input
              type="text"
              bind:value={filterNote}
              placeholder="Type to search..."
              class="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all placeholder:text-slate-400 disabled:bg-slate-50 disabled:cursor-not-allowed"
              disabled={loading}
            />
          </div>
          <div>
            <label class="block text-xs font-medium text-slate-600 mb-1.5">Year</label>
            <input
              type="number"
              bind:value={filterYear}
              placeholder="2024"
              class="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all placeholder:text-slate-400 disabled:bg-slate-50 disabled:cursor-not-allowed"
              disabled={loading}
            />
          </div>
          <div>
            <label class="block text-xs font-medium text-slate-600 mb-1.5">Month</label>
            <select
              bind:value={filterMonth}
              class="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all disabled:bg-slate-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              <option value="">All Months</option>
              {#each monthNames as name, i}
                <option value={i + 1}>{name}</option>
              {/each}
            </select>
          </div>
        </div>
        <div class="flex gap-3 mt-4">
          <button
            on:click={applyFilters}
            class="inline-flex items-center gap-1.5 px-4 py-2 text-sm bg-violet-600 hover:bg-violet-700 disabled:bg-violet-300 text-white rounded-xl font-medium transition-all duration-200 disabled:cursor-not-allowed"
            disabled={loading}
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Apply
          </button>
          <button
            on:click={resetFilters}
            class="inline-flex items-center gap-1.5 px-4 py-2 text-sm bg-slate-100 hover:bg-slate-200 disabled:bg-slate-50 disabled:text-slate-400 text-slate-600 rounded-xl font-medium transition-all duration-200 disabled:cursor-not-allowed"
            disabled={loading}
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Reset
          </button>
        </div>
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

  {#if transactions.length === 0 && !loading}
    <div class="text-center py-16">
      <div class="inline-flex items-center justify-center w-16 h-16 bg-slate-100 rounded-2xl mb-4">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>
      <h3 class="text-lg font-semibold text-slate-700 mb-1">No transactions yet</h3>
      <p class="text-sm text-slate-500 mb-4">Create your first transaction to get started</p>
      <button
        on:click={openCreateForm}
        class="inline-flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-medium transition-all duration-200"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        Add Transaction
      </button>
    </div>
  {:else}
    <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden relative {loading ? 'pointer-events-none' : ''}">
      {#if loading}
        <div class="absolute inset-0 bg-white/70 z-10 flex items-center justify-center backdrop-blur-sm">
          <div class="flex items-center gap-3 bg-white px-5 py-3 rounded-2xl shadow-lg border border-slate-100">
            <svg class="animate-spin h-5 w-5 text-violet-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span class="text-sm font-medium text-slate-700">Loading...</span>
          </div>
        </div>
      {/if}

      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="bg-slate-50/80 border-b border-slate-200">
              <th class="px-2 sm:px-5 py-2 sm:py-3.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">Period</th>
              <th class="px-2 sm:px-5 py-2 sm:py-3.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">Type</th>
              <th class="px-2 sm:px-5 py-2 sm:py-3.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">Note</th>
              <th class="px-2 sm:px-5 py-2 sm:py-3.5 text-right text-xs font-semibold text-slate-600 uppercase tracking-wide">Amount</th>
              <th class="px-2 sm:px-5 py-2 sm:py-3.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">By</th>
              <th class="px-2 sm:px-5 py-2 sm:py-3.5 text-right text-xs font-semibold text-slate-600 uppercase tracking-wide">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            {#each transactions as transaction, index (transaction.id)}
              <tr class="transition-all duration-150 {index % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'} hover:bg-violet-50/30 {loading ? 'opacity-50' : ''}">
                <td class="px-2 sm:px-5 py-2 sm:py-4">
                  <div class="flex flex-col gap-1">
                    <span class="inline-flex items-center px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg text-xs font-semibold bg-violet-100 text-violet-700 w-fit">
                      {transaction.year || '-'}/{String(transaction.month || 0).padStart(2, '0')}
                    </span>
                    <span class="text-xs text-slate-400">
                      {formatDate(transaction.created_at)}
                    </span>
                  </div>
                </td>
                <td class="px-2 sm:px-5 py-2 sm:py-4 text-sm text-slate-600">{getTypeName(transaction.code_type)}</td>
                <td class="px-2 sm:px-5 py-2 sm:py-4 text-sm text-slate-600 max-w-xs truncate" title={transaction.note}>{transaction.note || '-'}</td>
                <td class="px-2 sm:px-5 py-2 sm:py-4 text-right">
                  <span class="inline-flex items-center px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg text-sm font-bold {getAmountBg(transaction.code_type)} {getAmountColor(transaction.code_type)}">
                    {formatMoney(transaction.money)}
                  </span>
                </td>
                <td class="px-2 sm:px-5 py-2 sm:py-4 text-sm text-slate-600">{transaction.created_by || '-'}</td>
                <td class="px-2 sm:px-5 py-2 sm:py-4 text-right">
                  <div class="flex items-center justify-end gap-1">
                    <button
                      on:click={() => openEditForm(transaction)}
                      class="p-2 text-slate-500 hover:text-violet-600 hover:bg-violet-50 rounded-xl transition-all duration-150"
                      title="Edit"
                      disabled={loading}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      on:click={() => deleteTransaction(transaction.id)}
                      class="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all duration-150"
                      title="Delete"
                      disabled={loading}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>

    <!-- Pagination -->
    {#if totalPages > 0}
      <div class="mt-4 sm:mt-6 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 px-1 sm:px-2">
        <div class="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-slate-600">
          <span class="hidden sm:inline">Showing</span>
          <span class="font-semibold text-slate-800">{Math.min((currentPage - 1) * pageSize + 1, totalItems)}</span>
          <span class="hidden sm:inline">to</span>
          <span class="hidden sm:inline font-semibold text-slate-800">{Math.min(currentPage * pageSize, totalItems)}</span>
          <span class="hidden sm:inline">of</span>
          <span class="hidden sm:inline font-semibold text-slate-800">{totalItems}</span>
        </div>

        <div class="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
          <select
            bind:value={pageSize}
            on:change={() => changePageSize(pageSize)}
            class="px-2 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent sm:px-3 sm:py-2 sm:text-sm sm:rounded-xl"
          >
            <option value="5">5</option>
            <option value="10">10</option>
            <option value="20">20</option>
            <option value="50">50</option>
          </select>

          <div class="flex items-center gap-1">
            <button
              on:click={() => changePage(currentPage - 1)}
              disabled={currentPage === 1 || loading}
              class="p-1.5 sm:p-2 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all sm:rounded-xl"
              aria-label="Previous page"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            {#each getPageNumbers() as pageItem (pageItem.key)}
              {#if pageItem.type === 'ellipsis'}
                <span class="px-1 sm:px-2 text-xs sm:text-sm text-slate-400">...</span>
              {:else}
                <button
                  on:click={() => changePage(pageItem.value!)}
                  disabled={loading}
                  class="min-w-7 sm:min-w-9 px-1.5 sm:px-2 py-1 sm:py-1.5 text-xs sm:text-sm font-medium rounded-lg sm:rounded-xl transition-all {currentPage === pageItem.value
                    ? 'bg-violet-600 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100'}"
                >
                  {pageItem.value}
                </button>
              {/if}
            {/each}

            <button
              on:click={() => changePage(currentPage + 1)}
              disabled={currentPage === totalPages || loading}
              class="p-1.5 sm:p-2 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all sm:rounded-xl"
              aria-label="Next page"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    {/if}
  {/if}
</div>

<!-- Modal Form -->
<Modal
  title={editingTransaction ? 'Edit Transaction' : 'Create New Transaction'}
  open={showForm}
  size="md"
  on:close={closeForm}
>
  {#if error}
    <div class="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl flex items-start gap-2">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-rose-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span class="text-sm">{error}</span>
    </div>
  {/if}

  <form on:submit|preventDefault={saveTransaction} class="space-y-4">
    <div class="grid grid-cols-2 gap-4">
      <div>
        <label for="year" class="block text-sm font-medium text-slate-700 mb-1.5">Year</label>
        <input
          id="year"
          type="number"
          bind:value={formData.year}
          class="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all disabled:bg-slate-50"
          disabled={loading}
        />
      </div>
      <div>
        <label for="month" class="block text-sm font-medium text-slate-700 mb-1.5">Month</label>
        <select
          id="month"
          bind:value={formData.month}
          class="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all disabled:bg-slate-50"
          disabled={loading}
        >
          {#each monthNames as name, i}
            <option value={i + 1}>{name}</option>
          {/each}
        </select>
      </div>
    </div>

    <div>
      <label for="code_type" class="block text-sm font-medium text-slate-700 mb-1.5">Type</label>
      <SearchableSelect
        id="code_type"
        bind:value={formData.code_type}
        options={typeOptions}
        placeholder="Select type..."
        disabled={loading}
      />
    </div>

    <div>
      <label for="note" class="block text-sm font-medium text-slate-700 mb-1.5">Note</label>
      <textarea
        id="note"
        bind:value={formData.note}
        placeholder="Enter note"
        rows="3"
        class="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all placeholder:text-slate-400 disabled:bg-slate-50 resize-none"
        disabled={loading}
      ></textarea>
    </div>

    <div>
      <label for="money" class="block text-sm font-medium text-slate-700 mb-1.5">Amount</label>
      <input
        id="money"
        type="text"
        value={moneyDisplay}
        on:input={handleMoneyInput}
        placeholder="0"
        class="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all placeholder:text-slate-400 disabled:bg-slate-50"
        disabled={loading}
      />
    </div>

    <div class="flex justify-end gap-3 pt-2">
      <button
        type="button"
        on:click={closeForm}
        class="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={loading}
      >
        Cancel
      </button>
      <button
        type="submit"
        class="inline-flex items-center gap-2 px-5 py-2 bg-violet-600 hover:bg-violet-700 disabled:bg-violet-300 text-white rounded-xl font-medium transition-all disabled:cursor-not-allowed"
        disabled={loading}
      >
        {#if loading}
          <svg class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Saving...
        {:else}
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
          Save
        {/if}
      </button>
    </div>
  </form>
</Modal>
