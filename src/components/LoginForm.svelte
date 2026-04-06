<script lang="ts">
  let username = '';
  let password = '';
  let loading = false;
  let error: string | null = null;

  // Helper function to set cookie
  function setCookie(name: string, value: string, days: number) {
    const expires = new Date();
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
  }

  async function handleLogin() {
    if (!username || !password) {
      error = 'Username dan password wajib diisi';
      return;
    }

    loading = true;
    error = null;

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login gagal');
      }

      // Store token in cookie (expires in 365 days = 1 year)
      setCookie('auth_token', data.token, 365);

      // Store user in localStorage
      localStorage.setItem('user', JSON.stringify(data.user));

      // Redirect to dashboard
      window.location.href = '/';
    } catch (err: any) {
      error = err.message || 'Login gagal';
    } finally {
      loading = false;
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      handleLogin();
    }
  }
</script>

<div class="min-h-screen flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8 bg-linear-to-br from-violet-50 to-indigo-100">
  <div class="max-w-md w-full space-y-8">
    <!-- Logo/Header -->
    <div class="text-center">
      <h1 class="text-4xl font-bold text-violet-600 tracking-tight">ID Flow</h1>
      <p class="mt-2 text-sm text-slate-600">Flow your money, grow your life.</p>
      <h2 class="mt-6 text-2xl font-semibold text-slate-800">Sign in to your account</h2>
    </div>

    <!-- Login Form -->
    <div class="mt-8 bg-white rounded-2xl shadow-xl p-8">
      {#if error}
        <div class="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-rose-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span class="text-sm font-medium text-rose-700">{error}</span>
        </div>
      {/if}

      <form class="space-y-6" on:submit|preventDefault={handleLogin}>
        <!-- Username -->
        <div>
          <label for="username" class="block text-sm font-medium text-slate-700 mb-2">Username</label>
          <input
            id="username"
            name="username"
            type="text"
            bind:value={username}
            on:keydown={handleKeydown}
            class="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
            placeholder="Masukkan username"
            autocomplete="username"
            disabled={loading}
          />
        </div>

        <!-- Password -->
        <div>
          <label for="password" class="block text-sm font-medium text-slate-700 mb-2">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            bind:value={password}
            on:keydown={handleKeydown}
            class="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
            placeholder="Masukkan password"
            autocomplete="current-password"
            disabled={loading}
          />
        </div>

        <!-- Login Button -->
        <button
          type="submit"
          class="w-full flex items-center justify-center px-4 py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={loading}
        >
          {#if loading}
            <svg class="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Signing in...
          {:else}
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
            </svg>
            Sign in
          {/if}
        </button>
      </form>

      <!-- Footer Link -->
      <div class="mt-6 text-center">
        <p class="text-sm text-slate-600">
          Belum punya akun?
          <a href="/register" class="font-medium text-violet-600 hover:text-violet-700 transition-colors">
            Daftar sekarang
          </a>
        </p>
      </div>
    </div>

    <!-- Footer -->
    <p class="text-center text-xs text-slate-500">
      © 2025 ID Flow. All rights reserved.
    </p>
  </div>
</div>
