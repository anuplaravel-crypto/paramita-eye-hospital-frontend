<template>
  <div class="doctor-appointment-detail">
    <header class="page-head">
      <div>
        <RouterLink class="back-link" :to="{ name: 'doctor.appointments' }"><ArrowLeft :size="16" /> My Appointments</RouterLink>
        <h1 class="page-title">Appointment #{{ appointment?.serial_number || route.params.serialNumber }}</h1>
        <p class="page-sub">Review the patient details before starting the prescription.</p>
      </div>
      <button v-if="appointment?.status === 'waiting'" class="btn btn-primary start-button" type="button" :disabled="starting" @click="startPrescription">
        <LoaderCircle v-if="starting" :size="17" class="spin" />
        <FilePlus2 v-else :size="17" />
        {{ starting ? 'Starting…' : 'Start Prescription' }}
      </button>
      <span v-else-if="appointment" class="badge detail-status" :class="statusClass(appointment.status)">{{ statusLabel(appointment.status) }}</span>
    </header>

    <div v-if="errorMessage" class="appointment-error" role="alert">
      <span>{{ errorMessage }}</span>
      <button class="btn btn-outline btn-sm" type="button" @click="loadAppointment">Try again</button>
    </div>

    <section v-if="loading" class="card detail-empty" role="status">Loading appointment…</section>
    <section v-else-if="appointment" class="card patient-detail-card">
      <header class="card-head">
        <div>
          <h2 class="card-title">Patient details</h2>
          <p class="card-sub">Appointment date: {{ formatDate(appointment.date) }}</p>
        </div>
        <span class="badge" :class="statusClass(appointment.status)">{{ statusLabel(appointment.status) }}</span>
      </header>

      <div class="patient-details-grid">
        <div class="patient-name-block">
          <div class="patient-avatar"><UserRound :size="25" /></div>
          <div><span>Patient name</span><strong>{{ appointment.name }}</strong></div>
        </div>
        <div class="patient-detail"><span>Serial number</span><strong>{{ appointment.serial_number }}</strong></div>
        <div class="patient-detail"><span>Age</span><strong>{{ appointment.age }} years</strong></div>
        <div class="patient-detail"><span>Gender</span><strong class="capitalize">{{ appointment.gender }}</strong></div>
        <div class="patient-detail"><span>Phone number</span><strong>{{ appointment.phone }}</strong></div>
      </div>

      <div v-if="appointment.status === 'in_progress'" class="prescription-started" role="status">
        <FileCheck2 :size="20" />
        <div><strong>Prescription started</strong><span>This appointment is now open for your clinical work.</span></div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { ArrowLeft, FileCheck2, FilePlus2, LoaderCircle, UserRound } from '@lucide/vue'
import { toast } from 'vue-sonner'
import api from '../api/axios'

const route = useRoute()
const appointment = ref(null)
const loading = ref(false)
const starting = ref(false)
const errorMessage = ref('')

onMounted(loadAppointment)

async function loadAppointment() {
  loading.value = true
  errorMessage.value = ''
  try {
    const { data } = await api.get(`/doctor/appointments/${route.params.serialNumber}`)
    appointment.value = data.data || data
  } catch (error) {
    errorMessage.value = error.response?.data?.message || 'This appointment could not be loaded.'
  } finally {
    loading.value = false
  }
}

async function startPrescription() {
  starting.value = true
  errorMessage.value = ''
  try {
    const { data } = await api.post(`/doctor/appointments/${route.params.serialNumber}/start-prescription`)
    appointment.value = data.data || data
    toast.success('Prescription started for this appointment.')
  } catch (error) {
    errorMessage.value = error.response?.data?.message || 'The prescription could not be started.'
  } finally {
    starting.value = false
  }
}

function formatDate(value) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('en-BD', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(`${value}T00:00:00`))
}

function statusClass(status) {
  return { waiting: 'warning', in_progress: 'info', completed: 'success' }[status] || 'neutral'
}

function statusLabel(status) {
  return { waiting: 'Waiting', in_progress: 'In progress', completed: 'Completed' }[status] || 'Waiting'
}
</script>

<style scoped>
.doctor-appointment-detail { display: grid; gap: 18px; }
.doctor-appointment-detail .page-head { margin-bottom: 0; align-items: center; }
.back-link { display: inline-flex; align-items: center; gap: 6px; margin-bottom: 8px; color: var(--primary); font-size: 13px; font-weight: 700; }
.start-button, .detail-status { min-height: 46px; }
.patient-detail-card { overflow: hidden; }
.patient-details-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0; padding: 10px 22px 20px; }
.patient-name-block, .patient-detail { display: flex; align-items: center; gap: 13px; min-height: 78px; padding: 14px; border-bottom: 1px solid var(--border); }
.patient-name-block { grid-column: 1 / -1; }
.patient-avatar { width: 48px; height: 48px; display: grid; place-items: center; border-radius: 15px; color: #fff; background: linear-gradient(135deg, #6366f1, #06b6d4); }
.patient-name-block div:last-child, .patient-detail { display: grid; align-content: center; gap: 4px; }
.patient-name-block span, .patient-detail span { color: var(--muted); font-size: 12px; }
.patient-name-block strong, .patient-detail strong { color: var(--text); font-size: 15px; }
.capitalize { text-transform: capitalize; }
.prescription-started { display: flex; align-items: center; gap: 12px; margin: 0 22px 22px; padding: 14px 16px; border: 1px solid #bfdbfe; border-radius: 13px; color: #1d4ed8; background: #eff6ff; }
.prescription-started div { display: grid; gap: 3px; }
.prescription-started span { color: #475569; font-size: 13px; }
.detail-empty { min-height: 180px; display: grid; place-items: center; color: var(--muted); }
.appointment-error { display: flex; align-items: center; justify-content: space-between; gap: 14px; padding: 12px 15px; border: 1px solid #fecaca; border-radius: 12px; color: #991b1b; background: #fff7f7; }
.spin { animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
@media (max-width: 640px) { .patient-details-grid { grid-template-columns: 1fr; padding-inline: 14px; } .patient-name-block { grid-column: auto; } .prescription-started { margin-inline: 14px; } }
</style>
