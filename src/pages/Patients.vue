<template>
  <div class="patients-page">
    <header class="page-head">
      <div>
        <h1 class="page-title">Patients</h1>
        <p class="page-sub">Patient records created from prescription intake.</p>
      </div>
      <button class="btn btn-outline" type="button" :disabled="loading" @click="loadPatients(pagination.current_page)">
        <RefreshCw :size="16" :class="{ spin: loading }" /> Refresh
      </button>
    </header>

    <div class="patient-summary card">
      <div class="summary-icon"><Users :size="22" /></div>
      <div>
        <strong>{{ pagination.total.toLocaleString() }}</strong>
        <span>{{ search ? 'Matching patients' : 'Registered patients' }}</span>
      </div>
    </div>

    <div class="toolbar patient-toolbar">
      <label class="search-inline">
        <Search :size="17" />
        <input v-model="search" type="search" placeholder="Search by name, patient ID, or phone..." aria-label="Search patients" @input="scheduleSearch" />
      </label>
      <span class="muted">{{ resultRange }}</span>
    </div>

    <div v-if="pageError" class="patients-error" role="alert">
      <span>{{ pageError }}</span>
      <button class="btn btn-outline btn-sm" type="button" @click="loadPatients(pagination.current_page)">Try again</button>
    </div>

    <div class="card patients-table-card">
      <div v-if="loading && !patients.length" class="patients-empty" role="status">Loading patient records…</div>
      <div v-else-if="!patients.length" class="patients-empty">
        <Users :size="38" />
        <h2>{{ search ? 'No matching patients' : 'No patients registered yet' }}</h2>
        <p>{{ search ? 'Try searching with a different name, patient ID, or phone number.' : 'Patients entered through prescription intake will appear here.' }}</p>
      </div>
      <div v-else class="table-wrap">
        <table class="table patients-table">
          <thead>
            <tr>
              <th>SL</th>
              <th>Date</th>
              <th>Name</th>
              <th>Patient ID</th>
              <th>Age / Gender</th>
              <th>Contact</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(patient, index) in patients" :key="patient.id">
              <td>{{ serialNumber(index) }}</td>
              <td>{{ formatDate(patient.created_at) }}</td>
              <td>
                <div class="cell-user">
                  <div class="avatar sm" :style="{ background: grad(patient.name) }">{{ initials(patient.name) }}</div>
                  <strong>{{ patient.name }}</strong>
                </div>
              </td>
              <td><span class="badge primary plain">{{ patient.id }}</span></td>
              <td>{{ patient.age }} yrs · {{ formatGender(patient.gender) }}</td>
              <td>{{ patient.phone }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <footer v-if="pagination.last_page > 1" class="patients-pagination">
        <span>Page {{ pagination.current_page }} of {{ pagination.last_page }}</span>
        <div>
          <button class="btn btn-outline btn-sm" type="button" :disabled="loading || pagination.current_page <= 1" @click="loadPatients(pagination.current_page - 1)">Previous</button>
          <button class="btn btn-outline btn-sm" type="button" :disabled="loading || pagination.current_page >= pagination.last_page" @click="loadPatients(pagination.current_page + 1)">Next</button>
        </div>
      </footer>
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { Search, Users, RefreshCw } from '@lucide/vue'
import api from '../api/axios'
import { initials, grad } from '../data/mock'

const patients = ref([])
const search = ref('')
const loading = ref(false)
const pageError = ref('')
const pagination = ref({ current_page: 1, last_page: 1, per_page: 25, total: 0 })
let searchTimer

const resultRange = computed(() => {
  if (!pagination.value.total) return '0 patients'
  const start = (pagination.value.current_page - 1) * pagination.value.per_page + 1
  const end = Math.min(start + patients.value.length - 1, pagination.value.total)
  return `Showing ${start}–${end} of ${pagination.value.total} patients`
})

async function loadPatients(page = 1) {
  loading.value = true
  pageError.value = ''

  try {
    const { data } = await api.get('/admin/patients', {
      params: {
        search: search.value.trim() || undefined,
        per_page: pagination.value.per_page,
        page,
      },
    })
    patients.value = data.data || []
    pagination.value = {
      current_page: data.meta?.current_page || 1,
      last_page: data.meta?.last_page || 1,
      per_page: data.meta?.per_page || 25,
      total: data.meta?.total || 0,
    }
  } catch (error) {
    pageError.value = error.response?.data?.message || 'Patient records could not be loaded.'
  } finally {
    loading.value = false
  }
}

function scheduleSearch() {
  window.clearTimeout(searchTimer)
  searchTimer = window.setTimeout(() => loadPatients(1), 300)
}

function serialNumber(index) {
  return (pagination.value.current_page - 1) * pagination.value.per_page + index + 1
}

function formatDate(value) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('en-BD', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(value))
}

function formatGender(value) {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : '—'
}

onMounted(() => loadPatients())
onBeforeUnmount(() => window.clearTimeout(searchTimer))
</script>

<style scoped>
.patients-page { display: grid; gap: 18px; }
.patients-page .page-head { margin-bottom: 0; }
.patient-summary { display: flex; align-items: center; gap: 14px; padding: 16px 20px; }
.summary-icon { width: 46px; height: 46px; display: grid; place-items: center; border-radius: 14px; color: #fff; background: linear-gradient(135deg, #6366f1, #06b6d4); }
.patient-summary > div:last-child { display: grid; gap: 2px; }
.patient-summary strong { color: var(--text); font-size: 22px; line-height: 1.2; }
.patient-summary span { color: var(--muted); font-size: 12.5px; }
.patient-toolbar { margin: 0; }
.patient-toolbar .search-inline { width: min(420px, 100%); }
.patients-table-card { overflow: hidden; }
.patients-table { min-width: 760px; }
.patients-table th { white-space: nowrap; }
.patients-empty { min-height: 250px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 9px; padding: 26px; color: var(--muted); text-align: center; }
.patients-empty > svg { color: #6574ed; }
.patients-empty h2 { color: var(--text); font-size: 17px; }
.patients-empty p { max-width: 430px; font-size: 13px; }
.patients-error { display: flex; align-items: center; justify-content: space-between; gap: 14px; padding: 12px 15px; border: 1px solid #fecaca; border-radius: 12px; color: #991b1b; background: #fff7f7; }
.patients-pagination { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 14px 18px; border-top: 1px solid var(--border); color: var(--muted); }
.patients-pagination > div { display: flex; gap: 8px; }
.spin { animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
@media (max-width: 640px) {
  .patient-toolbar { align-items: stretch; flex-direction: column; }
  .patient-toolbar .search-inline { width: 100%; }
}
</style>
