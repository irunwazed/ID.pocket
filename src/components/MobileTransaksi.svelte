<script lang="ts">
  import { untrack } from 'svelte';
  import { transactionApi } from '../lib/api';
  import type { Transaction, Type } from '../lib/types';
  import { Briefcase, CircleDollarSign, Gift, Shirt, Sparkles, UtensilsCrossed, Cookie, ShoppingCart, Flame, House, Brush, Zap, Bike, Smartphone, Wrench, GraduationCap, FileText, Landmark, Gamepad2, Plane, HeartHandshake, Pill, Stethoscope, Hospital, Scale, Package, Tag } from 'lucide-svelte';

  let { types, refreshTick, onOpenCreate, onOpenEdit }: {
    types: Type[];
    refreshTick: number;
    onOpenCreate: () => void;
    onOpenEdit: (transaction: Transaction) => void;
  } = $props();

  const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

  const typeConfig: Record<string, { icon: any; color: string; bg: string }> = {
    '401': { icon: Briefcase, color: 'text-emerald-700', bg: 'bg-emerald-50' },
    '402': { icon: CircleDollarSign, color: 'text-green-700', bg: 'bg-green-50' },
    '403': { icon: Gift, color: 'text-teal-700', bg: 'bg-teal-50' },
    '50101': { icon: Shirt, color: 'text-pink-700', bg: 'bg-pink-50' },
    '50102': { icon: Sparkles, color: 'text-rose-700', bg: 'bg-rose-50' },
    '50201': { icon: UtensilsCrossed, color: 'text-orange-700', bg: 'bg-orange-50' },
    '50202': { icon: Cookie, color: 'text-amber-700', bg: 'bg-amber-50' },
    '50203': { icon: ShoppingCart, color: 'text-yellow-700', bg: 'bg-yellow-50' },
    '50204': { icon: Flame, color: 'text-lime-700', bg: 'bg-lime-50' },
    '50301': { icon: House, color: 'text-blue-700', bg: 'bg-blue-50' },
    '50302': { icon: Brush, color: 'text-sky-700', bg: 'bg-sky-50' },
    '50303': { icon: Zap, color: 'text-cyan-700', bg: 'bg-cyan-50' },
    '50304': { icon: Bike, color: 'text-indigo-700', bg: 'bg-indigo-50' },
    '50305': { icon: Smartphone, color: 'text-violet-700', bg: 'bg-violet-50' },
    '50309': { icon: Wrench, color: 'text-gray-700', bg: 'bg-gray-100' },
    '50401': { icon: GraduationCap, color: 'text-purple-700', bg: 'bg-purple-50' },
    '50501': { icon: FileText, color: 'text-slate-700', bg: 'bg-slate-50' },
    '50502': { icon: Landmark, color: 'text-red-700', bg: 'bg-red-50' },
    '50601': { icon: Gamepad2, color: 'text-fuchsia-700', bg: 'bg-fuchsia-50' },
    '50602': { icon: Plane, color: 'text-sky-700', bg: 'bg-sky-50' },
    '50701': { icon: HeartHandshake, color: 'text-red-700', bg: 'bg-red-50' },
    '50801': { icon: Pill, color: 'text-emerald-700', bg: 'bg-emerald-50' },
    '50802': { icon: Stethoscope, color: 'text-teal-700', bg: 'bg-teal-50' },
    '50803': { icon: Hospital, color: 'text-cyan-700', bg: 'bg-cyan-50' },
    '50901': { icon: Scale, color: 'text-indigo-700', bg: 'bg-indigo-50' },
    '50902': { icon: Package, color: 'text-gray-700', bg: 'bg-gray-100' },
  };

  function getTypeConfig(code: string) {
    return typeConfig[code] || { icon: Tag, color: 'text-gray-700', bg: 'bg-gray-100' };
  }

  let transactions: Transaction[] = $state([]);
  let loading = $state(false);
  let error: string | null = $state(null);

  // swipe-to-delete state
  let swipeOffset: Record<string, number> = $state({});
  let swipeRevealed: Record<string, boolean> = $state({});
  const swipeStart: Record<string, number> = {};
  const REVEAL_W = 76;
  const SNAP_THRESHOLD = 40;

  function onTouchStart(id: string, e: TouchEvent) {
    swipeStart[id] = e.touches[0].clientX;
    // snap back any other revealed row
    for (const k of Object.keys(swipeRevealed)) {
      if (k !== id && swipeRevealed[k]) {
        swipeOffset = { ...swipeOffset, [k]: 0 };
        swipeRevealed = { ...swipeRevealed, [k]: false };
      }
    }
  }

  function onTouchMove(id: string, e: TouchEvent) {
    const startX = swipeStart[id];
    if (startX == null) return;
    const dx = e.touches[0].clientX - startX;
    if (dx > 4) { swipeOffset = { ...swipeOffset, [id]: 0 }; return; } // right swipe → snap
    const clamped = Math.max(-REVEAL_W, dx);
    swipeOffset = { ...swipeOffset, [id]: clamped };
  }

  function onTouchEnd(id: string) {
    const off = swipeOffset[id] ?? 0;
    if (Math.abs(off) >= SNAP_THRESHOLD) {
      swipeOffset = { ...swipeOffset, [id]: -REVEAL_W };
      swipeRevealed = { ...swipeRevealed, [id]: true };
    } else {
      swipeOffset = { ...swipeOffset, [id]: 0 };
      swipeRevealed = { ...swipeRevealed, [id]: false };
    }
    delete swipeStart[id];
  }

  function snapBack(id: string) {
    swipeOffset = { ...swipeOffset, [id]: 0 };
    swipeRevealed = { ...swipeRevealed, [id]: false };
  }

  let currentPage = $state(1);
  let pageSize = $state(10);
  let totalPages = $state(0);

  let filterType = $state('');
  let filterNote = $state('');
  let filterYear = $state('');
  let filterMonth = $state('');
  let showFilter = $state(false);

  function formatMoney(value: number): string {
    return new Intl.NumberFormat('id-ID').format(value);
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
      totalPages = result.totalPages;
    } catch (err: any) {
      error = err.message || 'Gagal memuat transaksi';
    } finally {
      loading = false;
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

  $effect(() => {
    refreshTick; // only track this — untrack prevents currentPage/filter deps from re-triggering effect
    untrack(() => {
      currentPage = 1;
      fetchTransactions();
    });
  });
</script>

<div class="px-4 pt-6">
  <div class="flex items-center justify-between mb-2">
    <h1 class="text-xl font-bold text-slate-800">Transaksi</h1>
    <div class="flex items-center gap-2">
      <button onclick={() => showFilter = !showFilter} class="p-1.5 rounded-lg border border-slate-200 bg-white active:bg-slate-50 relative">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"/></svg>
        {#if filterType || filterNote || filterYear || filterMonth}
          <span class="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
        {/if}
      </button>
      <button onclick={onOpenCreate} class="bg-gradient-to-r from-sky-400 to-blue-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm shadow-sky-200/50 active:scale-95 transition-transform">
        + Tambah
      </button>
    </div>
  </div>

  <!-- Filter Panel -->
  {#if showFilter}
    <div class="bg-white rounded-xl border border-slate-200 p-3 mb-2">
      <div class="grid grid-cols-2 gap-2">
        <div>
          <select bind:value={filterType} class="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-300">
            <option value="">Semua Tipe</option>
            {#each types as type}
              <option value={type.code_type}>{type.name || type.code_type}</option>
            {/each}
          </select>
        </div>
        <div>
          <select bind:value={filterMonth} class="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-300">
            <option value="">Semua Bulan</option>
            {#each monthNames as month, i}
              <option value={i + 1}>{month}</option>
            {/each}
          </select>
        </div>
        <div>
          <input type="number" bind:value={filterYear} placeholder="Tahun" class="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-300" />
        </div>
        <div>
          <input type="text" bind:value={filterNote} placeholder="Cari catatan..." class="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-300" />
        </div>
      </div>
      <div class="flex gap-2 mt-2">
        <button onclick={clearFilters} class="flex-1 py-1.5 rounded-lg border border-slate-200 text-slate-500 text-xs font-bold active:bg-slate-50">Reset</button>
        <button onclick={applyFilters} class="flex-1 py-1.5 rounded-lg bg-blue-500 text-white text-xs font-bold active:scale-95 transition-transform">Cari</button>
      </div>
    </div>
  {/if}

  {#if loading}
    <div class="flex justify-center py-8">
      <div class="w-6 h-6 border-3 border-sky-200 border-t-sky-500 rounded-full animate-spin"></div>
    </div>
  {:else if error}
    <div class="bg-red-50 text-red-600 p-3 rounded-xl text-sm">{error}</div>
  {:else}
    <div class="flex flex-col" style="height: calc(100dvh - 9rem);">
      <div class="flex-1 overflow-y-auto flex flex-col gap-2">
        {#each transactions as transaction}
          {@const isIncome = String(transaction.code_type || '').startsWith('4')}
          {@const txnConfig = getTypeConfig(String(transaction.code_type || ''))}
          {@const offset = swipeOffset[transaction.id] ?? 0}
          {@const revealed = swipeRevealed[transaction.id] ?? false}
          {@const progress = Math.min(1, Math.abs(offset) / REVEAL_W)}
          <div class="relative rounded-xl overflow-hidden">
            <!-- Delete button — fades in as card slides -->
            <div
              class="absolute inset-y-0 right-0 flex items-center justify-center bg-red-500 rounded-r-xl"
              style="width: {REVEAL_W}px; opacity: {progress}; transform: scale({0.6 + progress * 0.4}); pointer-events: {progress > 0.5 ? 'auto' : 'none'};"
            >
              <button
                onclick={() => handleDelete(transaction.id)}
                class="flex flex-col items-center gap-0.5 text-white px-3 active:opacity-70"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                </svg>
                <span class="text-[10px] font-bold">Hapus</span>
              </button>
            </div>

            <!-- Row card (slides left on swipe) -->
            <button
              ontouchstart={(e) => onTouchStart(transaction.id, e)}
              ontouchmove={(e) => onTouchMove(transaction.id, e)}
              ontouchend={() => onTouchEnd(transaction.id)}
              onclick={() => { if (revealed) { snapBack(transaction.id); return; } onOpenEdit(transaction); }}
              style="transform: translateX({offset}px); transition: transform {swipeStart[transaction.id] != null ? '0ms' : '200ms'} ease-out;"
              class="relative w-full flex items-center gap-3 py-3 px-3 text-left bg-white rounded-xl shadow-[0_1px_8px_rgba(56,189,248,0.08)] border border-slate-100"
            >
              <div class="w-10 h-10 rounded-xl {isIncome ? 'bg-emerald-50' : 'bg-red-50'} flex items-center justify-center flex-shrink-0">
                <span class="{isIncome ? 'text-emerald-500' : 'text-red-400'}">
                  <txnConfig.icon size={18} strokeWidth={1.5} />
                </span>
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-semibold text-slate-800 truncate">{transaction.note || '-'}</p>
                <p class="text-[11px] text-slate-400">{monthNames[(transaction.month || 1) - 1]} {transaction.year}</p>
              </div>
              <div class="text-right flex-shrink-0">
                <p class="text-sm font-bold {isIncome ? 'text-emerald-600' : 'text-red-500'}">
                  {isIncome ? '+' : '-'}{formatMoney(Math.abs(transaction.money || 0))}
                </p>
                <p class="text-[10px] text-slate-400">{#if transaction.created_at}{new Date(transaction.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}{/if}{#if transaction.created_by} · {transaction.created_by}{/if}</p>
              </div>
            </button>
          </div>
        {/each}
      </div>

      <!-- Pagination -->
      {#if totalPages > 1}
        <div class="flex justify-center items-center gap-2 py-3 border-t border-slate-100 bg-white flex-shrink-0">
          <button onclick={() => { currentPage = currentPage - 1; fetchTransactions(); }} disabled={currentPage <= 1} class="px-3 py-1.5 text-xs rounded-lg bg-white border border-slate-200 disabled:opacity-40 font-bold text-sky-700 active:bg-slate-50">Prev</button>
          <span class="text-xs text-slate-500 font-medium">{currentPage} / {totalPages}</span>
          <button onclick={() => { currentPage = currentPage + 1; fetchTransactions(); }} disabled={currentPage >= totalPages} class="px-3 py-1.5 text-xs rounded-lg bg-white border border-slate-200 disabled:opacity-40 font-bold text-sky-700 active:bg-slate-50">Next</button>
        </div>
      {/if}
    </div>
  {/if}
</div>
