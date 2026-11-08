<template>
  <div>
    <div class="page-head">
      <div>
        <h1 class="page-title">Patients</h1>
        <p class="page-sub">{{ filtered.length }} registered patients · records & visit history</p>
      </div>
      <div style="display: flex; gap: 10px">
        <button class="btn btn-outline" @click="toast.info('Patient list exported (demo)')">
          <Download :size="17" /> Export
        </button>
        <button class="btn btn-primary" @click="toast.success('Register patient form opened (demo)')">
          <UserPlus :size="17" /> Register Patient
        </button>
      </div>
    </div>

    <div class="toolbar">
      <label class="search-inline">
        <Search :size="17" />
        <input v-model="search" placeholder="Search by name, ID or phone..." />
      </label>
      <span class="spacer"></span>
      <button class="btn btn-outline btn-sm" @click="toast.info('Advanced filter coming soon!')">
        <Filter :size="15" /> Filters
      </button>
    </div>

    <div class="stat-grid" style="grid-template-columns: repeat(3, 1fr)">
      <div class="stat-card" style="--glow: rgba(99,102,241,.14)">
        <div class="stat-icon" style="background: linear-gradient(135deg,#6366f1,#8b5cf6)"><Users :size="23" /></div>
        <div>
          <div class="stat-label">Total Registered</div>
          <div class="stat-value">1,248</div>
        </div>
      </div>
      <div class="stat-card" style="--glow: rgba(16,185,129,.14)">
        <div class="stat-icon" style="background: linear-gradient(135deg,#10b981,#06b6d4)"><UserCheck :size="23" /></div>
        <div>
          <div class="stat-label">New This Month</div>
          <div class="stat-value">86</div>
        </div>
      </div>
      <div class="stat-card" style="--glow: rgba(245,158,11,.16)">
        <div class="stat-icon" style="background: linear-gradient(135deg,#f59e0b,#f43f5e)"><Activity :size="23" /></div>
        <div>
          <div class="stat-label">Visits Today</div>
          <div class="stat-value">32</div>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="table-wrap">
        <table class="table">
          <thead>
            <tr>
              <th>Patient ID</th>
              <th>Name</th>
              <th>Age / Gender</th>
              <th>Blood</th>
              <th>Contact</th>
              <th>Last Visit</th>
              <th>Visits</th>
              <th style="text-align: right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in filtered" :key="p.id">
              <td><span class="badge primary plain">{{ p.id }}</span></td>
              <td>
                <div class="cell-user">
                  <div class="avatar sm" :style="{ background: grad(p.name) }">{{ initials(p.name) }}</div>
                  <strong>{{ p.name }}</strong>
                </div>
              </td>
              <td>{{ p.age }} yrs · {{ p.gender }}</td>
              <td><span class="badge danger plain" style="font-size: 12px">{{ p.blood }}</span></td>
              <td>{{ p.phone }}</td>
              <td>{{ p.lastVisit }}</td>
              <td><strong>{{ p.visits }}</strong></td>
              <td>
                <div style="display: flex; gap: 8px; justify-content: flex-end">
                  <button class="icon-btn" style="width: 34px; height: 34px" @click="toast.info(`${p.name} — medical record (demo)`)">
                    <FileText :size="16" />
                  </button>
                  <button class="icon-btn" style="width: 34px; height: 34px" @click="toast.info(`Edit ${p.name} (demo)`)">
                    <Pencil :size="16" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { toast } from 'vue-sonner'
import {
  Search, UserPlus, Download, Filter, Users, UserCheck, Activity,
  FileText, Pencil,
} from '@lucide/vue'
import { patients, initials, grad } from '../data/mock'

const search = ref('')

const filtered = computed(() => {
  const q = search.value.toLowerCase()
  return patients.filter(
    (p) => !q || p.name.toLowerCase().includes(q) || p.id.toLowerCase().includes(q) || p.phone.includes(q)
  )
})
</script>
