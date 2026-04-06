<script lang="ts">
  import { onMount } from 'svelte';

  export let options: Array<{ value: string; label: string; code: string }> = [];
  export let placeholder = 'Select...';
  export let value = '';
  export let disabled = false;
  export let id = '';

  let isOpen = false;
  let searchQuery = '';
  let filteredOptions: typeof options = [];
  let selectElement: HTMLElement;

  function filterOptions() {
    if (!searchQuery) {
      filteredOptions = options;
    } else {
      const query = searchQuery.toLowerCase();
      filteredOptions = options.filter(opt =>
        opt.label.toLowerCase().includes(query) ||
        opt.code.toLowerCase().includes(query)
      );
    }
  }

  function selectOption(opt: typeof options[0]) {
    value = opt.value;
    isOpen = false;
    searchQuery = '';
  }

  function clearSelection(e: MouseEvent) {
    e.stopPropagation();
    value = '';
    isOpen = false;
  }

  function getDisplayLabel(): string {
    if (!value) return '';
    const selected = options.find(opt => opt.value === value);
    return selected ? selected.label : '';
  }

  function toggleDropdown() {
    if (disabled) return;
    isOpen = !isOpen;
    if (isOpen) {
      searchQuery = '';
      filterOptions();
    }
  }

  function handleClickOutside(e: MouseEvent) {
    if (selectElement && !selectElement.contains(e.target as Node)) {
      isOpen = false;
    }
  }

  onMount(() => {
    document.addEventListener('click', handleClickOutside);
    filterOptions();
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  });

  $: if (searchQuery !== undefined) {
    filterOptions();
  }
</script>

<div class="relative" bind:this={selectElement}>
  <!-- Trigger Button -->
  <div
    role="button"
    tabindex="0"
    {id}
    on:click={toggleDropdown}
    on:keydown={(e) => e.key === 'Enter' && toggleDropdown()}
    class="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all text-left disabled:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 flex items-center justify-between cursor-pointer"
  >
    <span class={value ? 'text-slate-800' : 'text-slate-400'}>
      {value ? getDisplayLabel() : placeholder}
    </span>
    <div class="flex items-center gap-2">
      {#if value}
        <button
          type="button"
          on:click={clearSelection}
          class="p-1 hover:bg-slate-100 rounded-lg transition-colors"
          aria-label="Clear selection"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      {/if}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="h-4 w-4 text-slate-400 transition-transform {isOpen ? 'rotate-180' : ''}"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
      </svg>
    </div>
  </div>

  <!-- Dropdown -->
  {#if isOpen}
    <div class="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-60 overflow-hidden flex flex-col">
      <!-- Search Input -->
      <div class="p-2 border-b border-slate-100">
        <input
          type="text"
          bind:value={searchQuery}
          placeholder="Search..."
          class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
          autofocus
        />
      </div>

      <!-- Options List -->
      <div class="overflow-y-auto flex-1">
        {#if filteredOptions.length === 0}
          <div class="px-3 py-4 text-center text-sm text-slate-400">
            No results found
          </div>
        {:else}
          {#each filteredOptions as option}
            <button
              type="button"
              on:click={() => selectOption(option)}
              class="w-full px-3 py-2.5 text-sm text-left hover:bg-violet-50 transition-colors {value === option.value ? 'bg-violet-100 text-violet-700' : 'text-slate-700'}"
            >
              <div class="flex items-center gap-2">
                <span class="text-slate-400 font-mono text-xs">[{option.code}]</span>
                <span class="font-medium">{option.label}</span>
              </div>
            </button>
          {/each}
        {/if}
      </div>
    </div>
  {/if}
</div>
