<script lang="ts">
  import { onMount } from 'svelte';
  import { transactionApi, statsApi } from '../lib/api';
  import type { Transaction, Type } from '../lib/types';
  import { Briefcase, CircleDollarSign, Gift, Shirt, Sparkles, UtensilsCrossed, Cookie, ShoppingCart, Flame, House, Brush, Zap, Bike, Smartphone, Wrench, GraduationCap, FileText, Landmark, Gamepad2, Plane, HeartHandshake, Pill, Stethoscope, Hospital, Scale, Package, Tag } from 'lucide-svelte';

  let { currentUser, types, refreshTick, onOpenForm }: {
    currentUser: any;
    types: Type[];
    refreshTick: number;
    onOpenForm: (codeType?: string) => void;
  } = $props();

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

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

  const typeGroups = [
    { label: 'Populer', codes: ['401', '50201', '50202', '50203', '50304'] },
    { label: 'Pemasukan', codes: ['401', '402', '403'] },
    { label: 'Pakaian & Beauty', codes: ['50101', '50102'] },
    { label: 'Makanan', codes: ['50201', '50202', '50203', '50204'] },
    { label: 'Tempat Tinggal', codes: ['50301', '50302', '50303'] },
    { label: 'Transportasi & Komunikasi', codes: ['50304', '50305'] },
    { label: 'Lainnya', codes: ['50309', '50401', '50501', '50502', '50601', '50602', '50701', '50801', '50802', '50803', '50901', '50902'] },
  ];

  let monthlyIncome = $state(0);
  let monthlyExpense = $state(0);
  let monthlyBalance = $state(0);

  function formatMoney(value: number): string {
    return new Intl.NumberFormat('id-ID').format(value);
  }

  async function fetchHomeData() {
    try {
      const monthResult = await transactionApi.getPaginated(1, 500, { year: currentYear, month: currentMonth });
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
    } catch {
      // silently ignore — summary cards just show 0
    }
  }

  $effect(() => {
    // re-fetch whenever refreshTick changes (form submitted) or on mount
    refreshTick;
    fetchHomeData();
  });
</script>

<div class="px-4 pt-6">
  <div class="mb-5">
    <h1 class="text-2xl font-bold text-slate-800" style="font-family: 'Quicksand', sans-serif;">ID Flow</h1>
    <p class="text-sm text-slate-400">Halo, {currentUser?.name || 'User'} 👋</p>
  </div>

  <!-- Monthly Summary -->
  <div class="bg-white rounded-2xl shadow-[0_1px_8px_rgba(56,189,248,0.08)] border border-slate-100 p-4 mb-5">
    <div class="flex items-center justify-between mb-3">
      <h2 class="text-sm font-bold text-slate-700">{monthNames[currentMonth - 1]} {currentYear}</h2>
      <span class="text-[10px] font-semibold {monthlyBalance >= 0 ? 'text-emerald-600 bg-emerald-50' : 'text-red-600 bg-red-50'} px-2 py-0.5 rounded-full">
        {monthlyBalance >= 0 ? ' surplus' : ' defisit'}
      </span>
    </div>
    <div class="grid grid-cols-3 gap-3">
      <div class="text-center">
        <div class="w-10 h-10 mx-auto rounded-xl bg-emerald-50 flex items-center justify-center mb-1">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941"/></svg>
        </div>
        <p class="text-[10px] text-slate-400 font-medium">Pemasukan</p>
        <p class="text-sm font-bold text-emerald-600">{formatMoney(monthlyIncome)}</p>
      </div>
      <div class="text-center">
        <div class="w-10 h-10 mx-auto rounded-xl bg-red-50 flex items-center justify-center mb-1">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 8.25h15m-15 0V6a2.25 2.25 0 012.25-2.25h10.5A2.25 2.25 0 0122 6v2.25m-19.75 0v7.5a2.25 2.25 0 002.25 2.25h10.5a2.25 2.25 0 002.25-2.25v-7.5"/></svg>
        </div>
        <p class="text-[10px] text-slate-400 font-medium">Pengeluaran</p>
        <p class="text-sm font-bold text-red-500">{formatMoney(monthlyExpense)}</p>
      </div>
      <div class="text-center">
        <div class="w-10 h-10 mx-auto rounded-xl {monthlyBalance >= 0 ? 'bg-blue-50' : 'bg-amber-50'} flex items-center justify-center mb-1">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 {monthlyBalance >= 0 ? 'text-blue-500' : 'text-amber-500'}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"/></svg>
        </div>
        <p class="text-[10px] text-slate-400 font-medium">Sisa</p>
        <p class="text-sm font-bold {monthlyBalance >= 0 ? 'text-blue-600' : 'text-amber-600'}">{formatMoney(Math.abs(monthlyBalance))}</p>
      </div>
    </div>
  </div>

  <!-- Type Quick Actions -->
  {#each typeGroups as group}
    <div class="mb-4 {group.label === 'Populer' ? 'bg-gradient-to-br from-blue-50 via-white to-sky-50 shadow-[0_2px_16px_rgba(56,189,248,0.15)] border border-blue-200/60' : 'bg-white shadow-[0_1px_8px_rgba(56,189,248,0.08)] border border-slate-100'} rounded-2xl p-3">
      {#if group.label === 'Populer'}
        <div class="flex items-center gap-1.5 mb-3">
          <div class="flex items-center justify-center w-5 h-5 rounded-full bg-gradient-to-br from-blue-500 to-sky-400 shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
          </div>
          <h2 class="text-xs font-bold text-blue-600 tracking-wide">{group.label}</h2>
        </div>
        <div class="grid grid-cols-5 gap-3">
          {#each group.codes as code}
            {@const config = getTypeConfig(code)}
            {@const typeName = types.find(t => t.code_type === code)?.name || code}
            <button
              onclick={() => onOpenForm(code)}
              class="flex flex-col items-center gap-1.5 active:scale-90 transition-transform"
            >
              <div class="w-12 h-12 rounded-2xl {config.bg} flex items-center justify-center shadow-md ring-1 ring-white/80">
                <span class="{config.color}"><config.icon size={22} strokeWidth={1.5} /></span>
              </div>
              <span class="text-[10px] font-bold text-slate-700 leading-tight text-center line-clamp-2">{typeName}</span>
            </button>
          {/each}
        </div>
      {:else}
        <h2 class="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">{group.label}</h2>
        <div class="grid grid-cols-4 gap-3">
          {#each group.codes as code}
            {@const config = getTypeConfig(code)}
            {@const typeName = types.find(t => t.code_type === code)?.name || code}
            <button
              onclick={() => onOpenForm(code)}
              class="flex flex-col items-center gap-1.5 rounded-2xl p-2 active:scale-95 transition-transform"
            >
              <div class="w-11 h-11 rounded-2xl {config.bg} flex items-center justify-center shadow-sm">
                <span class="{config.color}"><config.icon size={18} strokeWidth={1.5} /></span>
              </div>
              <span class="text-[10px] font-semibold text-slate-600 leading-tight text-center line-clamp-2">{typeName}</span>
            </button>
          {/each}
        </div>
      {/if}
    </div>
  {/each}
</div>
