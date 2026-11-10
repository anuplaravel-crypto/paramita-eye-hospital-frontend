<template>
  <div class="doctor-appointments">
    <header class="page-head">
      <div>
        <h1 class="page-title">My Appointments</h1>
        <p class="page-sub">Open an appointment to review the patient and start a prescription.</p>
      </div>
      <span class="badge primary plain">{{ pagination.total }} appointments</span>
    </header>

    <div class="toolbar">
      <label class="search-inline appointment-search">
        <Search :size="17" />
        <input v-model="search" type="search" placeholder="Search by patient, phone, or serial number..." aria-label="Search my appointments" />
      </label>
      <button class="btn btn-outline" type="button" :disabled="loading" @click="loadAppointments(pagination.current_page)">
        <RefreshCw :size="16" :class="{ spin: loading }" /> Refresh
      </button>
    </div>

    <div v-if="errorMessage" class="appointment-error" role="alert">
      <span>{{ errorMessage }}</span>
      <button class="btn btn-outline btn-sm" type="button" @click="loadAppointments(pagination.current_page)">Try again</button>
    </div>

    <section class="card appointment-list-card">
      <div v-if="loading && !appointments.length" class="appointment-empty" role="status">Loading your appointments…</div>
      <div v-else-if="!appointments.length" class="appointment-empty">
        <CalendarDays :size="38" />
        <h2>{{ search ? 'No matching appointments' : 'No appointments assigned' }}</h2>
        <p>{{ search ? 'Try a different name, serial number, or phone number.' : 'Appointments assigned to you by the reception desk will appear here.' }}</p>
      </div>
      <div v-else class="table-wrap">
        <table class="table doctor-appointment-table">
          <thead>
            <tr>
              <th>Serial No.</th>
              <th>Date</th>
              <th>Patient Name</th>
              <th>Age</th>
              <th>Gender</th>
              <th>Phone</th>
              <th>Status</th>
              <th class="actions-heading">Action</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="appointment in appointments" :key="appointment.serial_number">
              <td><strong class="serial-number">{{ appointment.serial_number }}</strong></td>
              <td>{{ formatDate(appointment.date) }}</td>
              <td><strong class="capitalize">{{ appointment.name }}</strong></td>
              <td>{{ appointment.age }} yrs</td>
              <td class="capitalize">{{ appointment.gender }}</td>
              <td>{{ appointment.phone }}</td>
              <td><span class="badge" :class="statusClass(appointment.status)">{{ statusLabel(appointment.status) }}</span></td>
              <td class="appointment-action">
                <RouterLink class="btn btn-outline btn-sm" :to="{ name: 'doctor.appointment', params: { serialNumber: appointment.serial_number } }">
                  <Eye :size="15" /> Open
                </RouterLink>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <footer v-if="pagination.last_page > 1" class="appointment-pagination">
        <span>Page {{ pagination.current_page }} of {{ pagination.last_page }}</span>
        <div>
          <button class="btn btn-outline btn-sm" type="button" :disabled="loading || pagination.current_page <= 1" @click="loadAppointments(pagination.current_page - 1)">Previous</button>
          <button class="btn btn-outline btn-sm" type="button" :disabled="loading || pagination.current_page >= pagination.last_page" @click="loadAppointments(pagination.current_page + 1)">Next</button>
        </div>
      </footer>
    </section>
  </div>
</template>

<script setup>
import { onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { CalendarDays, Eye, RefreshCw, Search } from '@lucide/vue'
import { useRoute } from 'vue-router'
import api from '../api/axios'

const route = useRoute()
const appointments = ref([])
const search = ref('')
const loading = ref(false)
const errorMessage = ref('')
const pagination = reactive({ current_page: 1, last_page: 1, total: 0 })
let searchTimer

onMounted(loadAppointments)
onBeforeUnmount(() => window.clearTimeout(searchTimer))

watch(search, () => {
  window.clearTimeout(searchTimer)
  searchTimer = window.setTimeout(() => loadAppointments(1), 300)
})

watch(() => route.query.refresh, () => loadAppointments(pagination.current_page))

async function loadAppointments(page = 1) {
  loading.value = true
  errorMessage.value = ''

  try {
    const { data } = await api.get('/doctor/appointments', {
      params: { search: search.value.trim() || undefined, page },
    })
    appointments.value = data.data || []
    pagination.current_page = data.meta?.current_page || 1
    pagination.last_page = data.meta?.last_page || 1
    pagination.total = data.meta?.total || 0
  } catch (error) {
    errorMessage.value = error.response?.data?.message || 'Your appointments could not be loaded.'
  } finally {
    loading.value = false
  }
}

function formatDate(value) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('en-BD', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(`${value}T00:00:00`))
}

function statusClass(status) {
  return { waiting: 'warning', in_progress: 'info', completed: 'success' }[status] || 'neutral'
}

function statusLabel(status) {
  return { waiting: 'Waiting', in_progress: 'In progress', completed: 'Completed' }[status] || 'Waiting'
}
</script>

<style scoped>
.doctor-appointments { display: grid; gap: 18px; }
.doctor-appointments .page-head { margin-bottom: 0; }
.appointment-search { width: min(480px, 100%); }
.appointment-list-card { overflow: hidden; }
.doctor-appointment-table { min-width: 900px; }
.doctor-appointment-table th { white-space: nowrap; }
.serial-number { color: var(--primary); }
.capitalize { text-transform: capitalize; }
.appointment-action { text-align: right; white-space: nowrap; }
.appointment-empty { min-height: 270px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 9px; padding: 28px; color: var(--muted); text-align: center; }
.appointment-empty > svg { color: var(--primary); }
.appointment-empty h2 { color: var(--text); font-size: 17px; }
.appointment-empty p { max-width: 450px; font-size: 13px; }
.appointment-error { display: flex; align-items: center; justify-content: space-between; gap: 14px; padding: 12px 15px; border: 1px solid #fecaca; border-radius: 12px; color: #991b1b; background: #fff7f7; }
.appointment-pagination { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 14px 18px; border-top: 1px solid var(--border); color: var(--muted); }
.appointment-pagination > div { display: flex; gap: 8px; }
.spin { animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
@media (max-width: 640px) { .doctor-appointments .toolbar { align-items: stretch; flex-direction: column; } .appointment-search { width: 100%; } }
</style>
