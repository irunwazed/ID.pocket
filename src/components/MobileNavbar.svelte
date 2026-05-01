<script lang="ts">
  let { activeTab = $bindable('home'), onTabChange }: { activeTab?: string; onTabChange?: (tab: string) => void } = $props();

  const leftTabs = [
    { id: 'rekap', label: 'Rekap' },
    { id: 'grafik', label: 'Grafik' },
  ];

  const rightTabs = [
    { id: 'transaksi', label: 'Transaksi' },
    { id: 'pengaturan', label: 'Pengaturan' },
  ];

  function selectTab(tabId: string) {
    activeTab = tabId;
    onTabChange?.(tabId);
  }
</script>

<nav class="fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-t border-blue-100/60" style="font-family: 'Quicksand', sans-serif; padding-bottom: env(safe-area-inset-bottom);">
  <div class="flex items-end justify-around h-16 max-w-lg mx-auto">
    {#each leftTabs as tab}
      <button
        on:click={() => selectTab(tab.id)}
        class="flex flex-col items-center justify-center gap-0.5 flex-1 py-1.5 transition-all duration-200 {activeTab === tab.id ? 'text-sky-600' : 'text-gray-400 active:text-sky-400'}"
      >
        {#if tab.id === 'rekap'}
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 transition-all" viewBox="0 0 24 24" fill={activeTab === 'rekap' ? 'currentColor' : 'none'} stroke="currentColor" stroke-width={activeTab === 'rekap' ? '0' : '1.5'}>
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
            {#if activeTab === 'rekap'}<path stroke-linecap="round" stroke-linejoin="round" d="M9 14l2 2 4-4"/>{/if}
          </svg>
        {:else if tab.id === 'grafik'}
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 transition-all" viewBox="0 0 24 24" fill={activeTab === 'grafik' ? 'currentColor' : 'none'} stroke="currentColor" stroke-width={activeTab === 'grafik' ? '0' : '1.5'}>
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
          </svg>
        {/if}
        <span class="text-[10px] font-bold {activeTab === tab.id ? 'text-sky-600' : ''}">{tab.label}</span>
      </button>
    {/each}

    <button
      on:click={() => selectTab('home')}
      class="flex flex-col items-center justify-center -mt-5 transition-transform duration-200 {activeTab === 'home' ? 'scale-100' : 'scale-95 active:scale-90'}"
    >
      <div class="w-14 h-14 rounded-full {activeTab === 'home' ? 'bg-gradient-to-br from-sky-400 to-blue-500 shadow-lg shadow-sky-200/60' : 'bg-gradient-to-br from-sky-300 to-blue-400'} flex items-center justify-center">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-7 w-7 text-white" viewBox="0 0 24 24" fill="currentColor">
          <path d="M10.704 2.293a1 1 0 00-1.408 0l-7 7A1 1 0 003 11h1v8a1 1 0 001 1h5a1 1 0 001-1v-4h2v4a1 1 0 001 1h5a1 1 0 001-1v-8h1a1 1 0 00.704-1.707l-7-7z"/>
        </svg>
      </div>
      <span class="text-[10px] font-bold mt-0.5 {activeTab === 'home' ? 'text-sky-600' : 'text-gray-400'}">Home</span>
    </button>

    {#each rightTabs as tab}
      <button
        on:click={() => selectTab(tab.id)}
        class="flex flex-col items-center justify-center gap-0.5 flex-1 py-1.5 transition-all duration-200 {activeTab === tab.id ? 'text-sky-600' : 'text-gray-400 active:text-sky-400'}"
      >
        {#if tab.id === 'transaksi'}
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 transition-all" viewBox="0 0 24 24" fill={activeTab === 'transaksi' ? 'currentColor' : 'none'} stroke="currentColor" stroke-width={activeTab === 'transaksi' ? '0' : '1.5'}>
            <path stroke-linecap="round" stroke-linejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"/>
          </svg>
        {:else if tab.id === 'pengaturan'}
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 transition-all" viewBox="0 0 24 24" fill={activeTab === 'pengaturan' ? 'currentColor' : 'none'} stroke="currentColor" stroke-width={activeTab === 'pengaturan' ? '0' : '1.5'}>
            <path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.573-1.066z"/>
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
          </svg>
        {/if}
        <span class="text-[10px] font-bold {activeTab === tab.id ? 'text-sky-600' : ''}">{tab.label}</span>
      </button>
    {/each}
  </div>
</nav>