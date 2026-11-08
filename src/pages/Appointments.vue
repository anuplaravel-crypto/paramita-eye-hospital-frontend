<template>
  <div>
    <div class="page-head">
      <div>
        <h1 class="page-title">Appointments</h1>
        <p class="page-sub">Manage bookings, tokens and patient visits — {{ filtered.length }} of {{ appointments.length }} shown</p>
      </div>
      <button class="btn btn-primary" @click="toast.success('New appointment form opened (demo)')">
        <Plus :size="17" /> New Appointment
      </button>
    </div>

    <div class="toolbar">
      <label class="search-inline">
        <Search :size="17" />
        <input v-model="search" placeholder="Search patient or doctor..." />
      </label>
      <div class="chips">
        <button
          v-for="f in filters"
          :key="f.key"
          class="chip"
          :class="{ active: filter === f.key }"
          @click="filter = f.key"
        >
          {{ f.label }} ({{ count(f.key) }})
        </button>
      </div>
      <span class="spacer"></span>
      <button class="btn btn-outline btn-sm" @click="toast.info('Calendar view coming soon!')">
        <CalendarDays :size="15" /> Calendar View
      </button>
    </div>

    <div class="card">
      <div v-if="filtered.length" class="table-wrap">
        <table class="table">
          <thead>
            <tr>
              <th>Token</th>
              <th>Patient</th>
              <th>Doctor</th>
              <th>Schedule</th>
              <th>Fee</th>
              <th>Status</th>
              <th style="text-align: right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="a in filtered" :key="a.token">
              <td><span class="badge primary plain">{{ a.token }}</span></td>
              <td>
                <div class="cell-user">
                  <div class="avatar sm" :style="{ background: grad(a.patient) }">{{ initials(a.patient) }}</div>
                  <div>
                    <strong>{{ a.patient }}</strong>
                    <span>{{ a.age }} yrs</span>
                  </div>
                </div>
              </td>
              <td>
                <strong style="font-size: 13px">{{ a.doctor }}</strong>
                <div style="font-size: 11.5px; color: var(--muted)">{{ a.dept }}</div>
              </td>
              <td>{{ a.date }}<div style="font-size: 12px; color: var(--muted)">{{ a.time }}</div></td>
              <td><strong>BDT {{ a.fee }}</strong></td>
              <td><span class="badge" :class="statusClass(a.status)">{{ statusLabel(a.status) }}</span></td>
              <td>
                <div style="display: flex; gap: 8px; justify-content: flex-end">
                  <button class="icon-btn" style="width: 34px; height: 34px" title="View" @click="toast.info(`${a.patient} — appointment details (demo)`)">
                    <Eye :size="16" />
                  </button>
                  <button class="icon-btn" style="width: 34px; height: 34px" title="Edit" @click="toast.info(`Edit ${a.patient}'s appointment (demo)`)">
                    <Pencil :size="16" />
                  </button>
                  <button class="icon-btn" style="width: 34px; height: 34px" title="More" @click="toast.info('More actions (demo)')">
                    <MoreHorizontal :size="16" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-else class="empty">
        <CalendarX :size="40" />
        <h4>No appointments found</h4>
        <p>Try a different filter or search term</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { toast } from 'vue-sonner'
import { Plus, Search, CalendarDays, CalendarX, Eye, Pencil, MoreHorizontal } from '@lucide/vue'
import { appointments, initials, grad } from '../data/mock'

const search = ref('')
const filter = ref('all')

const filters = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
]

const count = (key) => (key === 'all' ? appointments.length : appointments.filter((a) => a.status === key).length)

const filtered = computed(() =>
  appointments.filter((a) => {
    const matchFilter = filter.value === 'all' || a.status === filter.value
    const q = search.value.toLowerCase()
    const matchSearch = !q || a.patient.toLowerCase().includes(q) || a.doctor.toLowerCase().includes(q)
    return matchFilter && matchSearch
  })
)

const statusClass = (s) => ({ confirmed: 'info', pending: 'warning', completed: 'success', cancelled: 'danger' }[s])
const statusLabel = (s) => s.charAt(0).toUpperCase() + s.slice(1)
</script>
