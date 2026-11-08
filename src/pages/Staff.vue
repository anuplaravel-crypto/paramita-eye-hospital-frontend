<template>
  <section>
    <header class="page-head">
      <div>
        <h1 class="page-title">Staff Members</h1>
        <p class="page-sub">{{ filteredUsers.length }} staff accounts</p>
      </div>
      <router-link class="btn btn-primary" to="/admin/users">Manage Users</router-link>
    </header>

    <div class="toolbar">
      <label class="search-inline">
        <Search :size="17" />
        <input v-model="search" type="search" placeholder="Search staff..." aria-label="Search staff" />
      </label>
      <span class="spacer"></span>
      <span class="muted">Showing accounts with the staff role</span>
    </div>

    <div v-if="error" class="list-error" role="alert">
      <span>{{ error }}</span>
      <button class="btn btn-outline btn-sm" type="button" @click="loadUsers">Try again</button>
    </div>

    <div class="card staff-card">
      <div v-if="loading" class="empty" role="status">Loading staff accounts...</div>
      <div v-else-if="!filteredUsers.length" class="empty">
        <Users :size="32" />
        <h4>{{ search ? 'No matching staff accounts' : 'No staff accounts found' }}</h4>
        <p>{{ search ? 'Try a different search.' : 'Assign the staff role to a user to show them here.' }}</p>
      </div>
      <div v-else class="table-wrap">
        <table class="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Contact</th>
              <th>Role</th>
              <th>Status</th>
              <th class="actions-heading">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in filteredUsers" :key="user.id">
              <td>
                <div class="cell-user">
                  <div class="avatar" :style="{ background: grad(user.name) }">{{ initials(user.name) }}</div>
                  <div>
                    <strong>{{ user.name }}</strong>
                    <span>{{ user.email }}</span>
                  </div>
                </div>
              </td>
              <td>{{ user.phone || '—' }}</td>
              <td><span class="badge neutral plain role-label">{{ user.role.name }}</span></td>
              <td>
                <span class="badge" :class="user.is_active ? 'success' : 'danger'">
                  {{ user.is_active ? 'Active' : 'Inactive' }}
                </span>
              </td>
              <td class="actions-cell">
                <router-link class="btn btn-outline btn-sm" to="/admin/users">Manage</router-link>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </section>
</template>

<script setup>
import { Search, Users } from '@lucide/vue'
import { grad, initials } from '../data/mock'
import { useRoleUsers } from '../composables/useRoleUsers'

const { filteredUsers, search, loading, error, loadUsers } = useRoleUsers('staff')
</script>

<style scoped>
.staff-card { overflow: hidden; }
.actions-heading, .actions-cell { text-align: right; }
.role-label { text-transform: capitalize; }
.muted { color: var(--muted); font-size: 12px; }
.list-error { display: flex; align-items: center; justify-content: space-between; gap: 14px; padding: 14px 17px; margin-bottom: 16px; border: 1px solid #fecaca; border-radius: 13px; background: #fef2f2; color: #b91c1c; }
@media (max-width: 600px) {
  .list-error { align-items: flex-start; flex-direction: column; }
}
</style>
