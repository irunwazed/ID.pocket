<script lang="ts">
  import { onMount } from 'svelte';
  import type { Todo } from '../lib/supabase';
  import { supabase } from '../lib/supabase';

  let todos: Todo[] = [];
  let newTodoTitle = '';
  let loading = false;
  let error: string | null = null;

  async function fetchTodos() {
    loading = true;
    error = null;
    try {
      const { data, error: err } = await supabase
        .from('todos')
        .select('*')
        .order('created_at', { ascending: false });

      if (err) throw err;
      todos = data || [];
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to fetch todos';
      console.error('Error fetching todos:', err);
    } finally {
      loading = false;
    }
  }

  async function addTodo() {
    if (!newTodoTitle.trim()) return;

    loading = true;
    error = null;
    try {
      const { data, error: err } = await supabase
        .from('todos')
        .insert({ title: newTodoTitle, completed: false })
        .select()
        .single();

      if (err) throw err;
      todos = [data, ...todos];
      newTodoTitle = '';
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to add todo';
      console.error('Error adding todo:', err);
    } finally {
      loading = false;
    }
  }

  async function toggleTodo(todo: Todo) {
    try {
      const { error: err } = await supabase
        .from('todos')
        .update({ completed: !todo.completed })
        .eq('id', todo.id);

      if (err) throw err;
      todos = todos.map((t) =>
        t.id === todo.id ? { ...t, completed: !t.completed } : t
      );
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to update todo';
      console.error('Error updating todo:', err);
    }
  }

  async function deleteTodo(id: number) {
    try {
      const { error: err } = await supabase.from('todos').delete().eq('id', id);

      if (err) throw err;
      todos = todos.filter((t) => t.id !== id);
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to delete todo';
      console.error('Error deleting todo:', err);
    }
  }

  onMount(() => {
    fetchTodos();
  });
</script>

<div class="max-w-md mx-auto p-6 bg-white rounded-xl shadow-lg">
  <h2 class="text-2xl font-bold text-gray-800 mb-4">Todo List (Supabase)</h2>

  {#if error}
    <div class="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
      {error}
    </div>
  {/if}

  <!-- Add Todo Form -->
  <form on:submit|preventDefault={addTodo} class="mb-6">
    <div class="flex gap-2">
      <input
        type="text"
        bind:value={newTodoTitle}
        placeholder="Add a new todo..."
        class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        disabled={loading}
      />
      <button
        type="submit"
        class="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-300 text-white rounded-lg transition-colors font-medium"
        disabled={loading || !newTodoTitle.trim()}
      >
        {loading ? '...' : 'Add'}
      </button>
    </div>
  </form>

  <!-- Todo List -->
  {#if todos.length === 0}
    <p class="text-gray-500 text-center py-4">
      {loading ? 'Loading...' : 'No todos yet. Add one above!'}
    </p>
  {:else}
    <ul class="space-y-2">
      {#each todos as todo (todo.id)}
        <li
          class="flex items-center gap-3 p-3 bg-gray-50 rounded-lg group hover:bg-gray-100 transition-colors"
        >
          <input
            type="checkbox"
            checked={todo.completed}
            on:change={() => toggleTodo(todo)}
            class="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500 cursor-pointer"
          />
          <span
            class="flex-1 {todo.completed
              ? 'line-through text-gray-400'
              : 'text-gray-800'}"
          >
            {todo.title}
          </span>
          <button
            on:click={() => deleteTodo(todo.id)}
            class="opacity-0 group-hover:opacity-100 px-2 py-1 text-red-500 hover:text-red-700 hover:bg-red-100 rounded transition-all"
            title="Delete"
          >
            ✕
          </button>
        </li>
      {/each}
    </ul>
  {/if}
</div>
