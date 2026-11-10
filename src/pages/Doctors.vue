<template>
  <section>
    <header class="page-head">
      <div>
        <h1 class="page-title">Doctors</h1>
        <p class="page-sub">{{ filteredUsers.length }} doctor accounts</p>
      </div>
      <router-link class="btn btn-primary" to="/admin/users">Manage Users</router-link>
    </header>

    <div class="toolbar">
      <label class="search-inline">
        <Search :size="17" />
        <input v-model="search" type="search" placeholder="Search doctors..." aria-label="Search doctors" />
      </label>
      <span class="spacer"></span>
      <span class="muted">Showing accounts with the doctor role</span>
    </div>

    <div v-if="error" class="list-error" role="alert">
      <span>{{ error }}</span>
      <button class="btn btn-outline btn-sm" type="button" @click="loadUsers">Try again</button>
    </div>

    <div v-if="loading" class="card empty" role="status">Loading doctor accounts...</div>
    <div v-else-if="!filteredUsers.length" class="card empty">
      <Stethoscope :size="40" />
      <h4>{{ search ? 'No matching doctor accounts' : 'No doctor accounts found' }}</h4>
      <p>{{ search ? 'Try a different search.' : 'Assign the doctor role to a user to show them here.' }}</p>
    </div>
    <div v-else class="doctor-grid">
      <article v-for="user in filteredUsers" :key="user.id" class="card hoverable doctor-card">
        <span class="badge card-tag" :class="user.is_active ? 'success' : 'warning'">
          {{ user.is_active ? 'Active' : 'Inactive' }}
        </span>
        <div class="avatar lg" :style="{ background: grad(user.name) }">{{ initials(user.name) }}</div>
        <h4>{{ user.name }}</h4>
        <div class="spec">{{ user.specialty || 'Specialty not set' }}</div>
        <div class="qual">{{ user.qualifications || 'Qualifications not set' }}</div>
        <div class="doctor-contact">BMDC: {{ user.bmdc_registration_number || 'Not provided' }}</div>
        <div class="doctor-contact">
          {{ user.years_of_experience ?? '—' }} years experience · {{ user.type ? user.type[0].toUpperCase() + user.type.slice(1) : 'Type not set' }}
        </div>
        <div class="doctor-contact">{{ user.email }}</div>
        <div class="doctor-contact">{{ user.phone || 'No phone number' }}</div>
        <div class="doctor-actions">
          <router-link class="btn btn-outline btn-sm" to="/admin/users">Manage User</router-link>
        </div>
      </article>
    </div>
  </section>
</template>

<script setup>
import { Search, Stethoscope } from '@lucide/vue'
import { grad, initials } from '../data/mock'
import { useRoleUsers } from '../composables/useRoleUsers'

const { filteredUsers, search, loading, error, loadUsers } = useRoleUsers('doctor')
</script>

<style scoped>
.muted { color: var(--muted); font-size: 12px; }
.doctor-contact { margin-top: 12px; color: var(--muted); font-size: 13px; }
.list-error { display: flex; align-items: center; justify-content: space-between; gap: 14px; padding: 14px 17px; margin-bottom: 16px; border: 1px solid #fecaca; border-radius: 13px; background: #fef2f2; color: #b91c1c; }
@media (max-width: 600px) {
  .list-error { align-items: flex-start; flex-direction: column; }
}
</style>
