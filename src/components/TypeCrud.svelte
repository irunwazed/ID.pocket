<script lang="ts">
  import { onMount } from 'svelte';
  import { typeApi } from '../lib/api';
  import type { Type, TypeFormData } from '../lib/types';

  let types: Type[] = [];
  let loading = false;
  let error: string | null = null;
  let showForm = false;
  let editingType: Type | null = null;
  let formData: TypeFormData = {
    code_type: '',
    name: ''
  };

  async function fetchTypes() {
    loading = true;
    error = null;
    try {
      types = await typeApi.getAll();
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to fetch types';
      console.error('Error fetching types:', err);
    } finally {
      loading = false;
    }
  }

  function openCreateForm() {
    editingType = null;
    formData = { code_type: '', name: '' };
    showForm = true;
  }

  function openEditForm(type: Type) {
    editingType = type;
    formData = {
      code_type: type.code_type,
      name: type.name
    };
    showForm = true;
  }

  function closeForm() {
    showForm = false;
    editingType = null;
    formData = { code_type: '', name: '' };
  }

  async function saveType() {
    if (!formData.code_type?.trim() || !formData.name?.trim()) {
      error = 'Code type and name are required';
      return;
    }

    loading = true;
    error = null;
    try {
      if (editingType) {
        const updated = await typeApi.update(editingType.id, formData);
        types = types.map(t => t.id === updated.id ? updated : t);
      } else {
        const created = await typeApi.create(formData);
        types = [...types, created];
      }
      closeForm();
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to save type';
      console.error('Error saving type:', err);
    } finally {
      loading = false;
    }
  }

  async function deleteType(id: number) {
    if (!confirm('Are you sure you want to delete this type?')) return;

    loading = true;
    error = null;
    try {
      await typeApi.delete(id);
      types = types.filter(t => t.id !== id);
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to delete type';
      console.error('Error deleting type:', err);
    } finally {
      loading = false;
    }
  }

  onMount(() => {
    fetchTypes();
  });
</script>

<div class="max-w-6xl mx-auto p-6 bg-white rounded-xl shadow-lg">
  <div class="flex justify-between items-center mb-6">
    <h2 class="text-2xl font-bold text-gray-800">Type Management</h2>
    <button
      on:click={openCreateForm}
      class="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors font-medium"
      disabled={loading}
    >
      + Add Type
    </button>
  </div>

  {#if error}
    <div class="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
      {error}
    </div>
  {/if}

  {#if showForm}
    <div class="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
      <h3 class="text-lg font-semibold mb-4">{editingType ? 'Edit Type' : 'Create New Type'}</h3>
      <form on:submit|preventDefault={saveType} class="space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Code Type</label>
            <input
              type="text"
              bind:value={formData.code_type}
              placeholder="Enter code type"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              disabled={loading}
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              bind:value={formData.name}
              placeholder="Enter name"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              disabled={loading}
            />
          </div>
        </div>
        <div class="flex gap-2">
          <button
            type="submit"
            class="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-300 text-white rounded-lg transition-colors font-medium"
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Save'}
          </button>
          <button
            type="button"
            on:click={closeForm}
            class="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors font-medium"
            disabled={loading}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  {/if}

  {#if types.length === 0}
    <p class="text-gray-500 text-center py-8">
      {loading ? 'Loading...' : 'No types found. Add one to get started!'}
    </p>
  {:else}
    <div class="overflow-x-auto">
      <table class="w-full">
        <thead>
          <tr class="bg-gray-50 border-b border-gray-200">
            <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700">ID</th>
            <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700">Code Type</th>
            <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700">Name</th>
            <th class="px-4 py-3 text-right text-sm font-semibold text-gray-700">Actions</th>
          </tr>
        </thead>
        <tbody>
          {#each types as type (type.id)}
            <tr class="border-b border-gray-100 hover:bg-gray-50 transition-colors">
              <td class="px-4 py-3 text-sm text-gray-600">{type.id}</td>
              <td class="px-4 py-3 text-sm font-medium text-gray-800">{type.code_type || '-'}</td>
              <td class="px-4 py-3 text-sm text-gray-600">{type.name || '-'}</td>
              <td class="px-4 py-3 text-right">
                <button
                  on:click={() => openEditForm(type)}
                  class="px-2 py-1 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded mr-1"
                  title="Edit"
                >
                  Edit
                </button>
                <button
                  on:click={() => deleteType(type.id)}
                  class="px-2 py-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                  title="Delete"
                >
                  Delete
                </button>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</div>
