<script lang="ts">
  import { onMount } from 'svelte';

  let currentPath = '';
  let mobileMenuOpen = false;

  function toggleMobileMenu() {
    mobileMenuOpen = !mobileMenuOpen;
  }

  function closeMobileMenu() {
    mobileMenuOpen = false;
  }

  onMount(() => {
    currentPath = window.location.pathname;

    // Listen for navigation changes
    const handleNavigate = () => {
      currentPath = window.location.pathname;
    };

    window.addEventListener('popstate', handleNavigate);

    // Also listen for clicks on internal links
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest('a');
      if (anchor && anchor.href && anchor.origin === window.location.origin) {
        setTimeout(handleNavigate, 0);
      }
    });

    return () => {
      window.removeEventListener('popstate', handleNavigate);
    };
  });
</script>

<nav class="bg-white/80 backdrop-blur-md shadow-md border-b border-gray-100" style="font-family: 'Quicksand', sans-serif;">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="flex justify-between h-16">
      <div class="flex">
        <div class="flex-shrink-0 flex items-center">
          <a href="/" class="text-2xl font-bold text-transparent bg-clip-text bg-linear-to-r from-indigo-500 to-purple-600" style="font-family: 'Quicksand', sans-serif;">ID Flow</a>
        </div>
        <div class="hidden sm:ml-8 sm:flex sm:space-x-6">
          <a
            href="/"
            class="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium transition-all {currentPath === '/'
              ? 'bg-indigo-100 text-indigo-700'
              : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'}"
          >
            Home
          </a>
          <a
            href="/users"
            class="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium transition-all {currentPath === '/users'
              ? 'bg-indigo-100 text-indigo-700'
              : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'}"
          >
            Users
          </a>
          <a
            href="/transactions"
            class="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium transition-all {currentPath === '/transactions'
              ? 'bg-indigo-100 text-indigo-700'
              : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'}"
          >
            Transactions
          </a>
          <a
            href="/types"
            class="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium transition-all {currentPath === '/types'
              ? 'bg-indigo-100 text-indigo-700'
              : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'}"
          >
            Types
          </a>
          <a
            href="/stats"
            class="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium transition-all {currentPath === '/stats'
              ? 'bg-indigo-100 text-indigo-700'
              : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'}"
          >
            Statistics
          </a>
          <a
            href="/recap"
            class="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium transition-all {currentPath === '/recap'
              ? 'bg-indigo-100 text-indigo-700'
              : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'}"
          >
            Recap
          </a>
        </div>
      </div>

      <!-- Hamburger menu button (mobile only) -->
      <div class="flex items-center sm:hidden">
        <button
          on:click={toggleMobileMenu}
          class="inline-flex items-center justify-center p-2 rounded-xl text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-all"
          aria-label="Open menu"
        >
          {#if mobileMenuOpen}
            <!-- Close icon -->
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          {:else}
            <!-- Hamburger icon -->
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          {/if}
        </button>
      </div>
    </div>
  </div>

  <!-- Mobile menu -->
  {#if mobileMenuOpen}
    <div class="sm:hidden bg-white/95 backdrop-blur-md border-t border-gray-100">
      <div class="px-4 pt-2 pb-4 space-y-1">
        <a
          href="/"
          on:click={closeMobileMenu}
          class="block px-4 py-2.5 rounded-xl text-base font-medium transition-all {currentPath === '/'
            ? 'bg-indigo-100 text-indigo-700'
            : 'text-gray-600 hover:bg-gray-100'}"
        >
          Home
        </a>
        <a
          href="/users"
          on:click={closeMobileMenu}
          class="block px-4 py-2.5 rounded-xl text-base font-medium transition-all {currentPath === '/users'
            ? 'bg-indigo-100 text-indigo-700'
            : 'text-gray-600 hover:bg-gray-100'}"
        >
          Users
        </a>
        <a
          href="/transactions"
          on:click={closeMobileMenu}
          class="block px-4 py-2.5 rounded-xl text-base font-medium transition-all {currentPath === '/transactions'
            ? 'bg-indigo-100 text-indigo-700'
            : 'text-gray-600 hover:bg-gray-100'}"
        >
          Transactions
        </a>
        <a
          href="/types"
          on:click={closeMobileMenu}
          class="block px-4 py-2.5 rounded-xl text-base font-medium transition-all {currentPath === '/types'
            ? 'bg-indigo-100 text-indigo-700'
            : 'text-gray-600 hover:bg-gray-100'}"
        >
          Types
        </a>
        <a
          href="/stats"
          on:click={closeMobileMenu}
          class="block px-4 py-2.5 rounded-xl text-base font-medium transition-all {currentPath === '/stats'
            ? 'bg-indigo-100 text-indigo-700'
            : 'text-gray-600 hover:bg-gray-100'}"
        >
          Statistics
        </a>
        <a
          href="/recap"
          on:click={closeMobileMenu}
          class="block px-4 py-2.5 rounded-xl text-base font-medium transition-all {currentPath === '/recap'
            ? 'bg-indigo-100 text-indigo-700'
            : 'text-gray-600 hover:bg-gray-100'}"
        >
          Recap
        </a>
      </div>
    </div>
  {/if}
</nav>
