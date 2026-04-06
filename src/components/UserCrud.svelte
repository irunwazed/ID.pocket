<script lang="ts">
  import { onMount } from 'svelte';
  import { userApi } from '../lib/api';
  import type { User, UserFormData } from '../lib/types';

  let users: User[] = [];
  let loading = false;
  let error: string | null = null;
  let showForm = false;
  let editingUser: User | null = null;
  let formData: UserFormData = {
    name: '',
    username: '',
    password: '',
    level: undefined
  };

  async function fetchUsers() {
    loading = true;
    error = null;
    try {
      users = await userApi.getAll();
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to fetch users';
      console.error('Error fetching users:', err);
    } finally {
      loading = false;
    }
  }

  function openCreateForm() {
    editingUser = null;
    formData = { name: '', username: '', password: '', level: undefined };
    showForm = true;
  }

  function openEditForm(user: User) {
    editingUser = user;
    formData = {
      name: user.name,
      username: user.username,
      password: user.password,
      level: user.level
    };
    showForm = true;
  }

  function closeForm() {
    showForm = false;
    editingUser = null;
    formData = { name: '', username: '', password: '', level: undefined };
  }

  async function saveUser() {
    if (!formData.name.trim() || !formData.username.trim()) {
      error = 'Name and username are required';
      return;
    }

    loading = true;
    error = null;
    try {
      if (editingUser) {
        const updated = await userApi.update(editingUser.id, formData);
        users = users.map(u => u.id === updated.id ? updated : u);
      } else {
        const created = await userApi.create(formData);
        users = [created, ...users];
      }
      closeForm();
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to save user';
      console.error('Error saving user:', err);
    } finally {
      loading = false;
    }
  }

  async function deleteUser(id: number) {
    if (!confirm('Are you sure you want to delete this user?')) return;

    loading = true;
    error = null;
    try {
      await userApi.delete(id);
      users = users.filter(u => u.id !== id);
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to delete user';
      console.error('Error deleting user:', err);
    } finally {
      loading = false;
    }
  }

  onMount(() => {
    fetchUsers();
  });
</script>

<div class="max-w-6xl mx-auto p-6 bg-white rounded-xl shadow-lg">
  <div class="flex justify-between items-center mb-6">
    <h2 class="text-2xl font-bold text-gray-800">User Management</h2>
    <button
      on:click={openCreateForm}
      class="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors font-medium"
      disabled={loading}
    >
      + Add User
    </button>
  </div>

  {#if error}
    <div class="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
      {error}
    </div>
  {/if}

  {#if showForm}
    <div class="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
      <h3 class="text-lg font-semibold mb-4">{editingUser ? 'Edit User' : 'Create New User'}</h3>
      <form on:submit|preventDefault={saveUser} class="space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Username</label>
            <input
              type="text"
              bind:value={formData.username}
              placeholder="Enter username"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              disabled={loading}
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              bind:value={formData.password}
              placeholder="Enter password"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              disabled={loading}
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Level</label>
            <input
              type="number"
              bind:value={formData.level}
              placeholder="Enter level"
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

  {#if users.length === 0}
    <p class="text-gray-500 text-center py-8">
      {loading ? 'Loading...' : 'No users found. Add one to get started!'}
    </p>
  {:else}
    <div class="overflow-x-auto">
      <table class="w-full">
        <thead>
          <tr class="bg-gray-50 border-b border-gray-200">
            <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700">ID</th>
            <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700">Name</th>
            <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700">Username</th>
            <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700">Level</th>
            <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700">Created At</th>
            <th class="px-4 py-3 text-right text-sm font-semibold text-gray-700">Actions</th>
          </tr>
        </thead>
        <tbody>
          {#each users as user (user.id)}
            <tr class="border-b border-gray-100 hover:bg-gray-50 transition-colors">
              <td class="px-4 py-3 text-sm text-gray-600">{user.id}</td>
              <td class="px-4 py-3 text-sm font-medium text-gray-800">{user.name || '-'}</td>
              <td class="px-4 py-3 text-sm text-gray-600">{user.username || '-'}</td>
              <td class="px-4 py-3 text-sm text-gray-600">{user.level ?? '-'}</td>
              <td class="px-4 py-3 text-sm text-gray-600">{user.created_at ? new Date(user.created_at).toLocaleDateString() : '-'}</td>
              <td class="px-4 py-3 text-right">
                <button
                  on:click={() => openEditForm(user)}
                  class="px-2 py-1 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded mr-1"
                  title="Edit"
                >
                  Edit
                </button>
                <button
                  on:click={() => deleteUser(user.id)}
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
