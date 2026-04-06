<script lang="ts">
  import { onMount } from 'svelte';

  let currentPath = '';
  let mobileMenuOpen = false;
  let userMenuOpen = false;
  let currentUser: any = null;

  function toggleMobileMenu() {
    mobileMenuOpen = !mobileMenuOpen;
  }

  function closeMobileMenu() {
    mobileMenuOpen = false;
  }

  function toggleUserMenu() {
    userMenuOpen = !userMenuOpen;
  }

  function closeUserMenu() {
    userMenuOpen = false;
  }

  // Helper function to delete cookie
  function deleteCookie(name: string) {
    document.cookie = `${name}=; Max-Age=0; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT`;
  }

  async function handleLogout() {
    try {
      // Call logout API to clear cookie on server
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      // Always clear client-side data
      deleteCookie('auth_token');
      localStorage.removeItem('user');
      // Redirect to login
      window.location.href = '/login';
    }
  }

  onMount(() => {
    currentPath = window.location.pathname;

    // Get user from localStorage
    const userStr = localStorage.getItem('user');
    if (userStr) {
      currentUser = JSON.parse(userStr);
    }

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

      <!-- Right side - User menu -->
      <div class="flex items-center">
        <div class="relative" on:click|stopPropagation>
          <button
            on:click|stopPropagation={toggleUserMenu}
            class="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-gray-100 transition-all"
          >
            <div class="w-8 h-8 rounded-full bg-linear-to-r from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-semibold">
              {currentUser?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <span class="hidden sm:block text-sm font-medium text-gray-700">
              {currentUser?.name || 'User'}
            </span>
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          <!-- User dropdown menu -->
          {#if userMenuOpen}
            <div class="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50" on:click|stopPropagation>
              <div class="px-4 py-2 border-b border-gray-100">
                <p class="text-sm font-medium text-gray-900">{currentUser?.name || 'User'}</p>
                <p class="text-xs text-gray-500">@{currentUser?.username || 'user'}</p>
              </div>
              <button
                on:click={handleLogout}
                class="w-full text-left px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout
              </button>
            </div>
          {/if}
        </div>

        <!-- Hamburger menu button (mobile only) -->
        <div class="flex items-center sm:hidden ml-2">
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
        <div class="border-t border-gray-100 pt-2 mt-2">
          <button
            on:click={handleLogout}
            class="w-full text-left px-4 py-2.5 rounded-xl text-base font-medium text-rose-600 hover:bg-rose-50 flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Logout
          </button>
        </div>
      </div>
    </div>
  {/if}
</nav>

<!-- Close dropdown when clicking outside -->
<svelte:window on:click={() => { if (userMenuOpen) userMenuOpen = false; }} />
