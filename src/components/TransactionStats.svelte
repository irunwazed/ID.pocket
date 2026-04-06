<script lang="ts">
  import { onMount } from 'svelte';
  import { statsApi } from '../lib/api';
  import type { TransactionStats } from '../lib/types';

  let stats: TransactionStats | null = null;
  let loading = false;
  let error: string | null = null;

  async function fetchStats() {
    loading = true;
    error = null;
    try {
      stats = await statsApi.get();
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to fetch statistics';
      console.error('Error fetching stats:', err);
    } finally {
      loading = false;
    }
  }

  function formatMoney(amount: number): string {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR'
    }).format(amount);
  }

  function getMonthName(month: number): string {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months[month - 1] || `${month}`;
  }

  function getPercentage(value: number, total: number): number {
    if (total === 0) return 0;
    return (value / total) * 100;
  }

  onMount(() => {
    fetchStats();
  });
</script>

<div class="max-w-6xl mx-auto p-6 bg-white rounded-xl shadow-lg">
  <div class="flex justify-between items-center mb-6">
    <h2 class="text-2xl font-bold text-gray-800">Transaction Statistics</h2>
    <button
      on:click={fetchStats}
      class="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors font-medium"
      disabled={loading}
    >
      Refresh
    </button>
  </div>

  {#if error}
    <div class="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
      {error}
    </div>
  {/if}

  {#if loading}
    <p class="text-gray-500 text-center py-8">Loading statistics...</p>
  {:else if stats}
    <!-- Summary Cards -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      <div class="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-xl">
        <p class="text-sm opacity-80 mb-1">Total Transactions</p>
        <p class="text-3xl font-bold">{stats.totalTransactions}</p>
      </div>
      <div class="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-xl">
        <p class="text-sm opacity-80 mb-1">Total Money</p>
        <p class="text-3xl font-bold">{formatMoney(stats.totalMoney)}</p>
      </div>
      <div class="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-xl">
        <p class="text-sm opacity-80 mb-1">Average Money</p>
        <p class="text-3xl font-bold">{formatMoney(stats.averageMoney)}</p>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- By Month -->
      {#if stats.byMonth.length > 0}
        <div class="bg-gray-50 rounded-lg p-4">
          <h3 class="text-lg font-semibold text-gray-800 mb-4">By Month</h3>
          <div class="space-y-3">
            {#each stats.byMonth as item}
              <div>
                <div class="flex justify-between text-sm mb-1">
                  <span class="text-gray-700">{getMonthName(item.month)}</span>
                  <span class="text-gray-600">{formatMoney(item.total)} ({item.count})</span>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-2">
                  <div
                    class="bg-indigo-500 h-2 rounded-full transition-all"
                    style="width: {getPercentage(item.total, stats.totalMoney)}%"
                  ></div>
                </div>
              </div>
            {/each}
          </div>
        </div>
      {/if}

      <!-- By Type -->
      {#if stats.byType.length > 0}
        <div class="bg-gray-50 rounded-lg p-4">
          <h3 class="text-lg font-semibold text-gray-800 mb-4">By Type</h3>
          <div class="space-y-3">
            {#each stats.byType as item}
              <div>
                <div class="flex justify-between text-sm mb-1">
                  <span class="text-gray-700">{item.code_type || 'undefined'}</span>
                  <span class="text-gray-600">{formatMoney(item.total)} ({item.count})</span>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-2">
                  <div
                    class="bg-green-500 h-2 rounded-full transition-all"
                    style="width: {getPercentage(item.total, stats.totalMoney)}%"
                  ></div>
                </div>
              </div>
            {/each}
          </div>
        </div>
      {/if}

      <!-- By Year -->
      {#if stats.byYear.length > 0}
        <div class="bg-gray-50 rounded-lg p-4 lg:col-span-2">
          <h3 class="text-lg font-semibold text-gray-800 mb-4">By Year</h3>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            {#each stats.byYear as item}
              <div class="bg-white rounded-lg p-4 text-center border border-gray-200">
                <p class="text-2xl font-bold text-indigo-600">{item.year}</p>
                <p class="text-sm text-gray-600 mt-1">{formatMoney(item.total)}</p>
                <p class="text-xs text-gray-500">{item.count} transactions</p>
              </div>
            {/each}
          </div>
        </div>
      {/if}
    </div>

    {#if stats.byMonth.length === 0 && stats.byType.length === 0 && stats.byYear.length === 0}
      <p class="text-gray-500 text-center py-8">No data available for statistics.</p>
    {/if}
  {/if}
</div>
