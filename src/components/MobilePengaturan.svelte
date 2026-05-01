<script lang="ts">
  let { currentUser }: { currentUser: any } = $props();
</script>

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

  <div class="mt-8">
    <button
      onclick={() => {
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
