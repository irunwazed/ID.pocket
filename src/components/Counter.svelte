<script lang="ts">
  let count = 0;

  function increment() {
    count += 1;
  }

  function decrement() {
    count -= 1;
  }

  function reset() {
    count = 0;
  }
</script>

<div class="flex flex-col items-center gap-4 p-6 bg-white rounded-xl shadow-md">
  <h2 class="text-2xl font-bold text-gray-800">Svelte Counter</h2>
  <p class="text-5xl font-mono font-bold text-indigo-600">{count}</p>
  <div class="flex gap-3">
    <button
      on:click={decrement}
      class="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors font-medium"
    >
      - Decrease
    </button>
    <button
      on:click={reset}
      class="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors font-medium"
    >
      Reset
    </button>
    <button
      on:click={increment}
      class="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors font-medium"
    >
      + Increase
    </button>
  </div>
</div>
