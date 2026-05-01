<script lang="ts">
  let { activeTab = $bindable('home'), onTabChange }: { activeTab?: string; onTabChange?: (tab: string) => void } = $props();

  const tabs = [
    { id: 'home', label: 'Home' },
    { id: 'rekap', label: 'Rekap' },
    { id: 'transaksi', label: 'Transaksi' },
    { id: 'pengaturan', label: 'Pengaturan' },
  ];

  function selectTab(tabId: string) {
    activeTab = tabId;
    onTabChange?.(tabId);
  }
</script>

<nav class="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-gray-200" style="font-family: 'Quicksand', sans-serif; padding-bottom: env(safe-area-inset-bottom);">
  <div class="flex items-center justify-around h-16 max-w-lg mx-auto">
    {#each tabs as tab}
      <button
        on:click={() => selectTab(tab.id)}
        class="flex flex-col items-center justify-center gap-0.5 flex-1 py-1.5 transition-colors duration-200 {activeTab === tab.id ? 'text-indigo-600' : 'text-gray-400 active:text-gray-600'}"
      >
        {#if tab.id === 'home'}
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" viewBox="0 0 24 24" fill={activeTab === 'home' ? 'currentColor' : 'none'} stroke="currentColor" stroke-width={activeTab === 'home' ? '0' : '1.5'}>
            <path stroke-linecap="round" stroke-linejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
          </svg>
        {:else if tab.id === 'rekap'}
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" viewBox="0 0 24 24" fill={activeTab === 'rekap' ? 'currentColor' : 'none'} stroke="currentColor" stroke-width={activeTab === 'rekap' ? '0' : '1.5'}>
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
            {#if activeTab === 'rekap'}<path stroke-linecap="round" stroke-linejoin="round" d="M9 14l2 2 4-4"/>{/if}
          </svg>
        {:else if tab.id === 'transaksi'}
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" viewBox="0 0 24 24" fill={activeTab === 'transaksi' ? 'currentColor' : 'none'} stroke="currentColor" stroke-width={activeTab === 'transaksi' ? '0' : '1.5'}>
            <path stroke-linecap="round" stroke-linejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"/>
          </svg>
        {:else if tab.id === 'pengaturan'}
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" viewBox="0 0 24 24" fill={activeTab === 'pengaturan' ? 'currentColor' : 'none'} stroke="currentColor" stroke-width={activeTab === 'pengaturan' ? '0' : '1.5'}>
            <path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.573-1.066z"/>
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
          </svg>
        {/if}
        <span class="text-[10px] font-bold">{tab.label}</span>
      </button>
    {/each}
  </div>
</nav>