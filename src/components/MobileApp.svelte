<script lang="ts">
  import { onMount } from 'svelte';
  import { transactionApi, recapApi, statsApi, typeApi, grafikApi } from '../lib/api';
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

  // Grafik state
  let grafikData: any = $state(null);
  let grafikTipes: any = $state(null);
  let loadinGrafik = $state(false);
  let errorGrafik: string | null = $state(null);
  let grafikYear = $state(new Date().getFullYear());
  let grafikTypeFilter = $state('');
  let showDetailTable = $state(false);
  let showMonthlyTable = $state(false);

  // Month names
  const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

  // Type icon & color mapping
  const typeConfig: Record<string, { color: string; bg: string }> = {
    '401': { color: 'text-emerald-700', bg: 'bg-emerald-50' },
    '402': { color: 'text-green-700', bg: 'bg-green-50' },
    '403': { color: 'text-teal-700', bg: 'bg-teal-50' },
    '50101': { color: 'text-pink-700', bg: 'bg-pink-50' },
    '50102': { color: 'text-rose-700', bg: 'bg-rose-50' },
    '50201': { color: 'text-orange-700', bg: 'bg-orange-50' },
    '50202': { color: 'text-amber-700', bg: 'bg-amber-50' },
    '50203': { color: 'text-yellow-700', bg: 'bg-yellow-50' },
    '50204': { color: 'text-lime-700', bg: 'bg-lime-50' },
    '50301': { color: 'text-blue-700', bg: 'bg-blue-50' },
    '50302': { color: 'text-sky-700', bg: 'bg-sky-50' },
    '50303': { color: 'text-cyan-700', bg: 'bg-cyan-50' },
    '50304': { color: 'text-indigo-700', bg: 'bg-indigo-50' },
    '50305': { color: 'text-violet-700', bg: 'bg-violet-50' },
    '50309': { color: 'text-gray-700', bg: 'bg-gray-100' },
    '50401': { color: 'text-purple-700', bg: 'bg-purple-50' },
    '50501': { color: 'text-slate-700', bg: 'bg-slate-50' },
    '50502': { color: 'text-red-700', bg: 'bg-red-50' },
    '50601': { color: 'text-fuchsia-700', bg: 'bg-fuchsia-50' },
    '50602': { color: 'text-sky-700', bg: 'bg-sky-50' },
    '50701': { color: 'text-red-700', bg: 'bg-red-50' },
    '50801': { color: 'text-emerald-700', bg: 'bg-emerald-50' },
    '50802': { color: 'text-teal-700', bg: 'bg-teal-50' },
    '50803': { color: 'text-cyan-700', bg: 'bg-cyan-50' },
    '50901': { color: 'text-indigo-700', bg: 'bg-indigo-50' },
    '50902': { color: 'text-gray-700', bg: 'bg-gray-100' },
  };

  function getTypeIcon(code: string): string {
    const svgs: Record<string, string> = {
      '401': '<path stroke-linecap="round" stroke-linejoin="round" d="M20.25 14.15v4.25c0 1.09-.85 1.98-1.94 2.01a51.88 51.88 0 00-6.62 0c-1.09.03-1.94-.92-1.94-2.01v-4.25M20.25 14.15H3.75m16.5 0l-1.5-8.4a1.07 1.07 0 00-.87-.84 46.3 46.3 0 00-13.76 0 1.07 1.07 0 00-.87.84l-1.5 8.4M3.75 14.15h16.5"/>',
      '402': '<path stroke-linecap="round" stroke-linejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>',
      '403': '<path stroke-linecap="round" stroke-linejoin="round" d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1114.625 7.5H12m0 0v7.5m-8.625-3h17.25"/>',
      '50101': '<path stroke-linecap="round" stroke-linejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5-.092v.092a3.75 3.75 0 01-3.75 3.75h-.75a.75.75 0 00-.75.75v6c0 .414.336.75.75.75h1.5a.75.75 0 00.75-.75v-3.75a.75.75 0 01.75-.75h2.25v7.5a1.5 1.5 0 003 0v-7.5h2.25a.75.75 0 01.75.75v3.75a.75.75 0 00.75.75h1.5a.75.75 0 00.75-.75v-6a.75.75 0 00-.75-.75h-.75a3.75 3.75 0 01-3.75-3.75z"/>',
      '50102': '<path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"/>',
      '50201': '<path stroke-linecap="round" stroke-linejoin="round" d="M12 8.25v-1.5m0 1.5a2.25 2.25 0 00-2.25 2.25c0 1.5-1.125 2.25-2.25 2.25S5.25 12 5.25 10.5A2.25 2.25 0 017.5 8.25H12zm0 0v7.5m4.5-4.5H12m4.5 0a2.25 2.25 0 002.25 2.25c1.125 0 2.25.75 2.25 2.25S19.875 18 18.75 18c-1.125 0-2.25-.75-4.5-2.25m5.25-4.5a2.25 2.25 0 00-2.25-2.25h-1.5"/>',
      '50202': '<path stroke-linecap="round" stroke-linejoin="round" d="M12 8.25a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 11.25a3 3 0 11-6 0 3 3 0 016 0zM3.75 21h.75a.75.75 0 00.75-.75v-1.5a2.625 2.625 0 012.625-2.625h4.5a2.625 2.625 0 012.625 2.625v1.5a.75.75 0 00.75.75h.75a.75.75 0 00.75-.75v-1.5a4.125 4.125 0 00-4.125-4.125h-4.5A4.125 4.125 0 003 18.75v1.5c0 .414.336.75.75.75z"/>',
      '50203': '<path stroke-linecap="round" stroke-linejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.1-6.75A2.25 2.25 0 0018.75 6h-1.5M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"/>',
      '50204': '<path stroke-linecap="round" stroke-linejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z"/>',
      '50301': '<path stroke-linecap="round" stroke-linejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"/>',
      '50302': '<path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zm8.446-7.189L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z"/>',
      '50303': '<path stroke-linecap="round" stroke-linejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"/>',
      '50304': '<path stroke-linecap="round" stroke-linejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.435-.734l-.434-.064a1.5 1.5 0 00-1.57.926l-.286.713a1.5 1.5 0 01-1.4.926h-3.282a1.5 1.5 0 01-1.4-.926l-.286-.713a1.5 1.5 0 00-1.57-.926l-.434.064a2.056 2.056 0 00-1.435.734A17.902 17.902 0 003.375 17.626c-.04.62.469 1.124 1.09 1.124H5.25"/>',
      '50305': '<path stroke-linecap="round" stroke-linejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3"/>',
      '50309': '<path stroke-linecap="round" stroke-linejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.148a4.508 4.508 0 013.082 1.194c.878.878 1.766 2.1 1.12 3.586m-7.945-3.658l-.87-.87a2.127 2.127 0 013.005-3.005l.87.87"/>',
      '50401': '<path stroke-linecap="round" stroke-linejoin="round" d="M4.26 10.147a60.438 60.438 0 00-.491 6.347A48.62 48.62 0 0112 20.904a48.62 48.62 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.636 50.636 0 00-2.658-.813A59.906 59.906 0 0112 3.493a59.903 59.903 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 19.5v-2.25m0 0a2.25 2.25 0 00-2.25-2.25H3.75a2.25 2.25 0 00-2.25 2.25v2.25m6-4.5a1.5 1.5 0 00-1.5-1.5H5.25a1.5 1.5 0 00-1.5 1.5v2.25"/>',
      '50501': '<path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"/>',
      '50502': '<path stroke-linecap="round" stroke-linejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21"/>',
      '50601': '<path stroke-linecap="round" stroke-linejoin="round" d="M14.25 6.087c0-.355.186-.676.401-.959.221-.29.349-.634.349-1.003 0-1.036-1.007-1.875-2.25-1.875s-2.25.84-2.25 1.875c0 .369.128.713.349 1.003.215.283.401.604.401.959v0a.64.64 0 01-.657.643 48.491 48.491 0 01-4.163-.3c.186 1.613.293 3.25.315 4.907a.656.656 0 01-.65.66H6.3c-.35 0-.673-.186-.958-.401a1.938 1.938 0 00-1.002-.349c-1.036 0-1.875 1.007-1.875 2.25s.84 2.25 1.875 2.25c.37 0 .713-.128 1.003-.349.283-.215.604-.401.959-.401h0c.38 0 .694.273.708.652a48.625 48.625 0 01-.327 4.563 48.492 48.492 0 014.163-.3.64.64 0 01.657.643v0c0 .355-.186.676-.401.959a1.938 1.938 0 00-.349 1.003c0 1.035 1.008 1.875 2.25 1.875 1.243 0 2.25-.84 2.25-1.875 0-.37-.128-.713-.349-1.003-.215-.283-.401-.604-.401-.959v0a.64.64 0 01.657-.643 48.5 48.5 0 014.163.3c-.186-1.613-.293-3.25-.315-4.907a.656.656 0 01.65-.66h.108c.35 0 .673.186.958.401.29.221.634.349 1.003.349 1.035 0 1.875-1.007 1.875-2.25s-.84-2.25-1.875-2.25a1.938 1.938 0 00-1.002.349c-.283.215-.604.401-.959.401h0a.656.656 0 01-.708-.652 48.625 48.625 0 01.327-4.563 48.492 48.492 0 01-4.163.3.64.64 0 01-.657-.643z"/>',
      '50602': '<path stroke-linecap="round" stroke-linejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"/>',
      '50701': '<path stroke-linecap="round" stroke-linejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"/>',
      '50801': '<path stroke-linecap="round" stroke-linejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5"/>',
      '50802': '<path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"/>',
      '50803': '<path stroke-linecap="round" stroke-linejoin="round" d="M2.25 21a1.125 1.125 0 01-1.125-1.125V18.75a3.375 3.375 0 013.375-3.375h1.5a1.125 1.125 0 011.125 1.125v3.75a1.125 1.125 0 01-1.125 1.125h-4.5zM15.75 21a1.125 1.125 0 01-1.125-1.125v-3.75a1.125 1.125 0 011.125-1.125h1.5a3.375 3.375 0 013.375 3.375v1.125a1.125 1.125 0 01-1.125 1.125h-4.5zM5.25 15.75V12a6.75 6.75 0 0113.5 0v3.75m-9 0h4.5"/>',
      '50901': '<path stroke-linecap="round" stroke-linejoin="round" d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M12 20.25c-4.97 0-9-2.686-9-6v-.75m18 .75c0 3.314-4.03 6-9 6m0-6c-4.97 0-9-2.015-9-4.5S7.03 5.25 12 5.25s9 2.015 9 4.5-4.03 4.5-9 4.5z"/>',
      '50902': '<path stroke-linecap="round" stroke-linejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"/>',
    };
    const path = svgs[code] || '<path stroke-linecap="round" stroke-linejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z"/><path stroke-linecap="round" stroke-linejoin="round" d="M6 6h.008v.008H6V6z"/>';
    return `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">${path}</svg>`;
  }

  // Group definitions for home screen categories
  const typeGroups = [
    { label: 'Populer', codes: ['401', '50201', '50202', '50203', '50304'] },
    { label: 'Pemasukan', codes: ['401', '402', '403'] },
    { label: 'Pakaian & Beauty', codes: ['50101', '50102'] },
    { label: 'Makanan', codes: ['50201', '50202', '50203', '50204'] },
    { label: 'Tempat Tinggal', codes: ['50301', '50302', '50303'] },
    { label: 'Transportasi & Komunikasi', codes: ['50304', '50305'] },
    { label: 'Lainnya', codes: ['50309', '50401', '50501', '50502', '50601', '50602', '50701', '50801', '50802', '50803', '50901', '50902'] },
  ];

  function getTypeConfig(code: string) {
    return typeConfig[code] || { color: 'text-gray-700', bg: 'bg-gray-100' };
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
    if (activeTab === 'grafik') {
      fetchTypes();
      fetchGrafik();
    }
  });
</script>

<div class="min-h-screen pb-24 bg-white" style="font-family: 'Quicksand', sans-serif; background-image: linear-gradient(180deg, rgba(224,242,254,0.4) 0%, rgba(255,255,255,0) 30%);">
  {#if activeTab === 'home'}
    <!-- HOME TAB -->
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
                  on:click={() => openCreateFormWithType(code)}
                  class="flex flex-col items-center gap-1.5 active:scale-90 transition-transform"
                >
                  <div class="w-12 h-12 rounded-2xl {config.bg} flex items-center justify-center shadow-md ring-1 ring-white/80">
                    <span class="{config.color} [&_svg]:h-6 [&_svg]:w-6">{@html getTypeIcon(code)}</span>
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
                  on:click={() => openCreateFormWithType(code)}
                  class="flex flex-col items-center gap-1.5 rounded-2xl p-2 active:scale-95 transition-transform"
                >
                  <div class="w-11 h-11 rounded-2xl {config.bg} flex items-center justify-center shadow-sm">
                    <span class="{config.color} [&_svg]:h-5 [&_svg]:w-5">{@html getTypeIcon(code)}</span>
                  </div>
                  <span class="text-[10px] font-semibold text-slate-600 leading-tight text-center line-clamp-2">{typeName}</span>
                </button>
              {/each}
            </div>
          {/if}
        </div>
      {/each}
    </div>

  {:else if activeTab === 'rekap'}
    <!-- REKAP TAB -->
    <div class="px-4 pt-6">
      <div class="flex items-center justify-between mb-4">
        <h1 class="text-xl font-bold text-slate-800">Rekapitulasi</h1>
        <select bind:value={selectedYear} on:change={() => fetchRecap()} class="text-sm bg-white border border-slate-200 rounded-xl px-3 py-1.5 font-medium text-slate-700">
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

  {:else if activeTab === 'grafik'}
    <!-- GRAFIK TAB -->
    <div class="px-4 pt-6">
      <div class="flex items-center justify-between mb-4">
        <h1 class="text-xl font-bold text-slate-800">Grafik</h1>
        <select bind:value={grafikYear} on:change={() => fetchGrafik()} class="text-sm bg-white border border-slate-200 rounded-xl px-3 py-1.5 font-medium text-slate-700">
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
          <button on:click={() => showMonthlyTable = !showMonthlyTable} class="w-full mt-3 text-xs text-sky-600 font-semibold flex items-center justify-center gap-1 py-1.5">
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
            <select bind:value={grafikTypeFilter} on:change={() => fetchGrafik()} class="text-[11px] bg-sky-50/80 border border-blue-100 rounded-lg px-2 py-1 font-medium text-slate-700 max-w-[55%]">
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
            <button on:click={() => showDetailTable = !showDetailTable} class="w-full mt-3 text-xs text-sky-600 font-semibold flex items-center justify-center gap-1 py-1.5">
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

  {:else if activeTab === 'transaksi'}
    <!-- TRANSAKSI TAB -->
    <div class="px-4 pt-6">
      <div class="flex items-center justify-between mb-2">
        <h1 class="text-xl font-bold text-slate-800">Transaksi</h1>
        <div class="flex items-center gap-2">
          <button on:click={() => showFilter = !showFilter} class="p-1.5 rounded-lg border border-slate-200 bg-white active:bg-slate-50 relative">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"/></svg>
            {#if filterType || filterNote || filterYear || filterMonth}
              <span class="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
            {/if}
          </button>
          <button on:click={openCreateForm} class="bg-gradient-to-r from-sky-400 to-blue-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm shadow-sky-200/50 active:scale-95 transition-transform">
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
            <button on:click={clearFilters} class="flex-1 py-1.5 rounded-lg border border-slate-200 text-slate-500 text-xs font-bold active:bg-slate-50">Reset</button>
            <button on:click={applyFilters} class="flex-1 py-1.5 rounded-lg bg-blue-500 text-white text-xs font-bold active:scale-95 transition-transform">Cari</button>
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
              <button
                on:click={() => openEditForm(transaction)}
                class="w-full flex items-center gap-3 py-3 px-3 text-left bg-white rounded-xl shadow-[0_1px_8px_rgba(56,189,248,0.08)] border border-slate-100 active:scale-[0.98] transition-transform"
              >
                <div class="w-10 h-10 rounded-xl {isIncome ? 'bg-emerald-50' : 'bg-red-50'} flex items-center justify-center flex-shrink-0">
                  <span class="{isIncome ? 'text-emerald-500' : 'text-red-400'} [&_svg]:h-5 [&_svg]:w-5">
                    {@html getTypeIcon(String(transaction.code_type || ''))}
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
            {/each}
          </div>

          <!-- Pagination -->
          {#if totalPages > 1}
            <div class="flex justify-center items-center gap-2 py-3 border-t border-slate-100 bg-white flex-shrink-0">
              <button on:click={() => { currentPage = currentPage - 1; fetchTransactions(); }} disabled={currentPage <= 1} class="px-3 py-1.5 text-xs rounded-lg bg-white border border-slate-200 disabled:opacity-40 font-bold text-sky-700 active:bg-slate-50">Prev</button>
              <span class="text-xs text-slate-500 font-medium">{currentPage} / {totalPages}</span>
              <button on:click={() => { currentPage = currentPage + 1; fetchTransactions(); }} disabled={currentPage >= totalPages} class="px-3 py-1.5 text-xs rounded-lg bg-white border border-slate-200 disabled:opacity-40 font-bold text-sky-700 active:bg-slate-50">Next</button>
            </div>
          {/if}
        </div>
      {/if}
    </div>

  {:else if activeTab === 'pengaturan'}
    <!-- PENGATURAN TAB -->
    <div class="px-4 pt-6">
      <h1 class="text-xl font-bold text-slate-800 mb-6">Pengaturan</h1>

      {#if currentUser}
        <div class="bg-white rounded-2xl shadow-[0_1px_8px_rgba(56,189,248,0.08)] border border-slate-100 p-4 mb-4">
          <div class="flex items-center gap-4">
            <div class="w-14 h-14 rounded-full bg-gradient-to-br from-sky-400 to-blue-500 flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-sky-200/50">
              {currentUser.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div>
              <p class="text-base font-bold text-slate-700">{currentUser.name}</p>
              <p class="text-sm text-slate-400">@{currentUser.username}</p>
            </div>
          </div>
        </div>
      {/if}

      <div class="space-y-2">
        <a href="/" class="flex items-center justify-between bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-sm shadow-sky-100/50 border border-blue-100/50 active:bg-sky-50">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 bg-sky-50 rounded-lg flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-sky-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
              </svg>
            </div>
            <span class="text-sm font-semibold text-slate-700">Tampilan Desktop</span>
          </div>
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg>
        </a>

        <a href="/users" class="flex items-center justify-between bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-sm shadow-sky-100/50 border border-blue-100/50 active:bg-sky-50">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 bg-emerald-50 rounded-lg flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
              </svg>
            </div>
            <span class="text-sm font-semibold text-slate-700">Kelola Pengguna</span>
          </div>
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg>
        </a>

        <a href="/types" class="flex items-center justify-between bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-sm shadow-sky-100/50 border border-blue-100/50 active:bg-sky-50">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 bg-violet-50 rounded-lg flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/>
              </svg>
            </div>
            <span class="text-sm font-semibold text-slate-700">Kelola Tipe Transaksi</span>
          </div>
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg>
        </a>

        <a href="/stats" class="flex items-center justify-between bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-sm shadow-sky-100/50 border border-blue-100/50 active:bg-sky-50">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 bg-amber-50 rounded-lg flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
              </svg>
            </div>
            <span class="text-sm font-semibold text-slate-700">Statistik Lengkap</span>
          </div>
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg>
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
          class="w-full bg-red-50/80 text-red-500 py-3 rounded-xl text-sm font-bold active:bg-red-100 transition-colors border border-red-100/50"
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
    <div class="bg-white/95 backdrop-blur-xl w-full max-w-lg rounded-t-2xl max-h-[90vh] overflow-y-auto" on:click|stopPropagation>
      <div class="sticky top-0 bg-white/95 backdrop-blur-xl z-10 p-5 pb-2 flex justify-between items-center border-b border-blue-100/50">
        <h2 class="text-lg font-bold text-slate-700">{editingTransaction ? 'Edit Transaksi' : 'Tambah Transaksi'}</h2>
        <button on:click={() => showForm = false} class="text-sky-300 hover:text-sky-500 p-1">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
      </div>

      <form on:submit|preventDefault={handleSubmit} class="p-5 pt-4 space-y-4">
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-sm font-semibold text-gray-600 mb-1">Tahun</label>
            <input type="number" bind:value={formData.year} class="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-sky-300 focus:bg-white" />
          </div>
          <div>
            <label class="block text-sm font-semibold text-gray-600 mb-1">Bulan</label>
            <select bind:value={formData.month} class="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-sky-300 focus:bg-white">
              {#each monthNames as month, i}
                <option value={i + 1}>{month}</option>
              {/each}
            </select>
          </div>
        </div>

        <div>
          <label class="block text-sm font-semibold text-gray-600 mb-1">Tipe</label>
          <select bind:value={formData.code_type} class="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-sky-300 focus:bg-white">
            <option value="">Pilih tipe...</option>
            {#each types as type}
              <option value={type.code_type}>{type.name || type.code_type}</option>
            {/each}
          </select>
        </div>

        <div>
          <label class="block text-sm font-semibold text-gray-600 mb-1">Catatan</label>
          <input type="text" bind:value={formData.note} placeholder="Catatan transaksi" class="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-sky-300 focus:bg-white" />
        </div>

        <div>
          <label class="block text-sm font-semibold text-gray-600 mb-1">Jumlah Uang</label>
          <input type="text" bind:value={moneyDisplay} on:input={(e) => { moneyDisplay = e.target.value.replace(/\D/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, '.'); formData.money = parseInt(e.target.value.replace(/\D/g, '')) || 0; }} placeholder="0" class="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-sky-300 focus:bg-white" />
        </div>

        <div class="flex gap-3 pt-2 pb-2">
          <button type="button" on:click={() => showForm = false} class="flex-1 py-2.5 rounded-xl border border-blue-100 text-sky-700 text-sm font-bold active:bg-sky-50">Batal</button>
          <button type="submit" class="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-sky-400 to-blue-500 text-white text-sm font-bold active:scale-95 transition-transform shadow-md shadow-sky-200/50">
            {editingTransaction ? 'Simpan' : 'Tambah'}
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}

<MobileNavbar bind:activeTab />