<script lang="ts">
  import { onMount } from 'svelte';
  import { typeApi } from '../lib/api';
  import type { Transaction, Type } from '../lib/types';
  import MobileNavbar from './MobileNavbar.svelte';
  import MobileHome from './MobileHome.svelte';
  import MobileRekap from './MobileRekap.svelte';
  import MobileGrafik from './MobileGrafik.svelte';
  import MobileTransaksi from './MobileTransaksi.svelte';
  import MobilePengaturan from './MobilePengaturan.svelte';
  import MobileTransactionForm from './MobileTransactionForm.svelte';
  import MobileChat from './MobileChat.svelte';

  let activeTab = $state('home');
  let currentUser: any = $state(null);
  let types: Type[] = $state([]);
  let refreshTick = $state(0);

  // Form state — shared between MobileHome and MobileTransaksi
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

  function formatMoney(value: number): string {
    return new Intl.NumberFormat('id-ID').format(value);
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

  function openCreateForm(codeType = '') {
    resetForm();
    if (codeType) formData.code_type = codeType;
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

  function onFormSuccess() {
    showForm = false;
    resetForm();
    refreshTick++;
  }

  onMount(async () => {
    const userStr = localStorage.getItem('user');
    if (userStr) currentUser = JSON.parse(userStr);
    try {
      types = await typeApi.getAll();
    } catch {
      types = [];
    }
  });
</script>

<div class="min-h-screen pb-24 bg-white" style="font-family: 'Quicksand', sans-serif; background-image: linear-gradient(180deg, rgba(224,242,254,0.4) 0%, rgba(255,255,255,0) 30%);">
  {#if activeTab === 'home'}
    <MobileHome {currentUser} {types} {refreshTick} onOpenForm={openCreateForm} />
  {:else if activeTab === 'rekap'}
    <MobileRekap />
  {:else if activeTab === 'grafik'}
    <MobileGrafik {types} />
  {:else if activeTab === 'transaksi'}
    <MobileTransaksi {types} {refreshTick} onOpenCreate={() => openCreateForm()} onOpenEdit={openEditForm} />
  {:else if activeTab === 'pengaturan'}
    <MobilePengaturan {currentUser} />
  {/if}
</div>

<MobileTransactionForm
  bind:show={showForm}
  {editingTransaction}
  bind:formData
  bind:moneyDisplay
  {types}
  onSuccess={onFormSuccess}
/>
<MobileChat />
<MobileNavbar bind:activeTab />
