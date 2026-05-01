<script lang="ts">
  import { transactionApi } from '../lib/api';
  import type { Transaction, Type } from '../lib/types';

  let {
    show = $bindable(),
    editingTransaction,
    formData = $bindable(),
    moneyDisplay = $bindable(),
    types,
    onSuccess,
  }: {
    show: boolean;
    editingTransaction: Transaction | null;
    formData: { year: number; month: number; note: string; code_type: string; money: number };
    moneyDisplay: string;
    types: Type[];
    onSuccess: () => void;
  } = $props();

  const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

  let submitError: string | null = $state(null);

  function parseMoneyInput(value: string): number {
    return parseInt(value.replace(/\D/g, '')) || 0;
  }

  async function handleSubmit() {
    submitError = null;
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
      onSuccess();
    } catch (err: any) {
      submitError = err.message || 'Gagal menyimpan';
    }
  }
</script>

{#if show}
  <div class="fixed inset-0 z-[60] flex items-end justify-center">
    <button
      class="absolute inset-0 bg-black/50 cursor-default"
      onclick={() => show = false}
      aria-label="Tutup form"
    ></button>
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="form-title"
      class="relative bg-white/95 backdrop-blur-xl w-full max-w-lg rounded-t-2xl max-h-[90vh] overflow-y-auto"
    >
      <div class="sticky top-0 bg-white/95 backdrop-blur-xl z-10 p-5 pb-2 flex justify-between items-center border-b border-blue-100/50">
        <h2 id="form-title" class="text-lg font-bold text-slate-700">{editingTransaction ? 'Edit Transaksi' : 'Tambah Transaksi'}</h2>
        <button onclick={() => show = false} aria-label="Tutup" class="text-sky-300 hover:text-sky-500 p-1">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
      </div>

      <form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }} class="p-5 pt-4 space-y-4">
        {#if submitError}
          <div class="bg-red-50 text-red-600 p-3 rounded-xl text-sm">{submitError}</div>
        {/if}

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label for="form-year" class="block text-sm font-semibold text-gray-600 mb-1">Tahun</label>
            <input id="form-year" type="number" bind:value={formData.year} class="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-sky-300 focus:bg-white" />
          </div>
          <div>
            <label for="form-month" class="block text-sm font-semibold text-gray-600 mb-1">Bulan</label>
            <select id="form-month" bind:value={formData.month} class="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-sky-300 focus:bg-white">
              {#each monthNames as month, i}
                <option value={i + 1}>{month}</option>
              {/each}
            </select>
          </div>
        </div>

        <div>
          <label for="form-type" class="block text-sm font-semibold text-gray-600 mb-1">Tipe</label>
          <select id="form-type" bind:value={formData.code_type} class="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-sky-300 focus:bg-white">
            <option value="">Pilih tipe...</option>
            {#each types as type}
              <option value={type.code_type}>{type.name || type.code_type}</option>
            {/each}
          </select>
        </div>

        <div>
          <label for="form-note" class="block text-sm font-semibold text-gray-600 mb-1">Catatan</label>
          <input id="form-note" type="text" bind:value={formData.note} placeholder="Catatan transaksi" class="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-sky-300 focus:bg-white" />
        </div>

        <div>
          <label for="form-money" class="block text-sm font-semibold text-gray-600 mb-1">Jumlah Uang</label>
          <input
            id="form-money"
            type="text"
            bind:value={moneyDisplay}
            oninput={(e) => {
              const raw = (e.target as HTMLInputElement).value.replace(/\D/g, '');
              moneyDisplay = raw.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
              formData.money = parseInt(raw) || 0;
            }}
            placeholder="0"
            class="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-sky-300 focus:bg-white"
          />
        </div>

        <div class="flex gap-3 pt-2 pb-2">
          <button type="button" onclick={() => show = false} class="flex-1 py-2.5 rounded-xl border border-blue-100 text-sky-700 text-sm font-bold active:bg-sky-50">Batal</button>
          <button type="submit" class="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-sky-400 to-blue-500 text-white text-sm font-bold active:scale-95 transition-transform shadow-md shadow-sky-200/50">
            {editingTransaction ? 'Simpan' : 'Tambah'}
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}
