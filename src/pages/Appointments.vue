<template>
  <section class="intake-page">
    <header class="page-head">
      <div>
        <h1 class="page-title">Appointments</h1>
        <p class="page-sub">Register patients for the doctor’s appointment list.</p>
      </div>
      <button class="btn btn-primary intake-create" type="button" @click="openCreate">
        <Plus :size="19" /> New Appointment
      </button>
    </header>

    <div class="intake-summary card">
      <div class="summary-icon"><CalendarDays :size="22" /></div>
      <div>
        <strong>{{ pagination.total || intakes.length }}</strong>
        <span>Appointments</span>
      </div>
      <p>New appointments are assigned to Dr. Hari Sankar Das.</p>
    </div>

    <div class="intake-toolbar">
      <label class="search-inline intake-search">
        <Search :size="19" />
        <input v-model="search" type="search" placeholder="Search patient name, phone, or serial number" aria-label="Search appointments" />
      </label>
      <span class="muted">{{ pagination.total || 0 }} appointments</span>
    </div>

    <div v-if="pageError" class="intake-error" role="alert">
      <span>{{ pageError }}</span>
      <button class="btn btn-outline btn-sm" type="button" @click="loadIntakes">Try again</button>
    </div>

    <div class="card intake-table-card">
      <div v-if="loading" class="intake-empty" role="status">Loading appointments…</div>
      <div v-else-if="!intakes.length" class="intake-empty">
        <CalendarDays :size="40" />
        <h3>{{ search ? 'No matching appointments' : 'No appointments yet' }}</h3>
        <p>{{ search ? 'Try another name, phone number, or serial number.' : 'Create an appointment by entering the patient details.' }}</p>
        <button v-if="!search" class="btn btn-primary" type="button" @click="openCreate">
          <Plus :size="17" /> Create First Appointment
        </button>
      </div>
      <div v-else class="table-wrap">
        <table class="table intake-table">
          <thead>
            <tr>
              <th>Serial No.</th>
              <th>Date</th>
              <th>Patient Name</th>
              <th>Age</th>
              <th>Gender</th>
              <th>Phone</th>
              <th>Status</th>
              <th class="actions-heading">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="intake in intakes" :key="intake.serial_number">
              <td><strong class="draft-number">{{ intake.serial_number }}</strong></td>
              <td>{{ formatDate(intake.date) }}</td>
              <td><strong>{{ intake.name }}</strong></td>
              <td>{{ intake.age }} yrs</td>
              <td class="capitalize">{{ intake.gender }}</td>
              <td>{{ intake.phone }}</td>
              <td><span class="badge" :class="intake.status === 'in_progress' ? 'info' : 'warning'">{{ intake.status === 'in_progress' ? 'In progress' : 'Waiting' }}</span></td>
              <td class="intake-actions">
                <button class="btn btn-outline btn-sm" type="button" @click="openView(intake)">
                  <Eye :size="15" /> View
                </button>
                <button class="btn btn-outline btn-sm" type="button" @click="openEdit(intake)">
                  <Pencil :size="15" /> Edit
                </button>
                <button class="icon-btn danger-action" type="button" :aria-label="`Delete appointment ${intake.serial_number}`" title="Delete appointment" @click="deleteIntake(intake)">
                  <Trash2 :size="16" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="!loading && pagination.last_page > 1" class="intake-pagination">
        <span>Page {{ pagination.current_page }} of {{ pagination.last_page }}</span>
        <div>
          <button class="btn btn-outline btn-sm" type="button" :disabled="pagination.current_page <= 1" @click="changePage(pagination.current_page - 1)">Previous</button>
          <button class="btn btn-outline btn-sm" type="button" :disabled="pagination.current_page >= pagination.last_page" @click="changePage(pagination.current_page + 1)">Next</button>
        </div>
      </div>
    </div>

    <div v-if="dialogOpen" class="intake-dialog-backdrop" @click.self="closeDialog">
      <section class="intake-dialog card" role="dialog" aria-modal="true" aria-labelledby="intake-dialog-title">
        <header class="intake-dialog-head">
          <div>
            <span class="dialog-kicker">{{ mode === 'view' ? 'Appointment details' : 'Patient appointment' }}</span>
            <h2 id="intake-dialog-title">{{ dialogTitle }}</h2>
            <p>{{ mode === 'view' ? 'Review the appointment details.' : 'Enter the patient details for the doctor.' }}</p>
          </div>
          <button class="icon-btn" type="button" aria-label="Close" @click="closeDialog"><X :size="20" /></button>
        </header>

        <form class="intake-form" @submit.prevent="saveIntake" novalidate>
          <div class="intake-fields-heading">
            <h3>Patient details</h3>
            <span class="muted">Date defaults to today</span>
          </div>

          <div class="intake-fields-grid">
            <div class="intake-field">
              <label for="appointment-date">Date <span class="required">*</span></label>
              <input id="appointment-date" v-model="form.date" type="date" :readonly="mode === 'view'" :class="{ 'input-invalid': fieldErrors.date }" :aria-invalid="Boolean(fieldErrors.date)" :aria-describedby="fieldErrors.date ? 'appointment-date-error' : undefined" required />
              <small v-if="fieldErrors.date" id="appointment-date-error" class="field-error">{{ fieldErrors.date }}</small>
            </div>
            <div class="intake-field intake-field-name">
              <label for="patient-name">Patient name <span class="required">*</span></label>
              <input id="patient-name" v-model.trim="form.patient_name" :readonly="mode === 'view'" :class="{ 'input-invalid': fieldErrors.name }" :aria-invalid="Boolean(fieldErrors.name)" :aria-describedby="fieldErrors.name ? 'patient-name-error' : undefined" autocomplete="name" required />
              <small v-if="fieldErrors.name" id="patient-name-error" class="field-error">{{ fieldErrors.name }}</small>
            </div>
            <div class="intake-field">
              <label for="patient-age">Age (years) <span class="required">*</span></label>
              <input id="patient-age" v-model="form.patient_age" type="number" min="0" max="130" inputmode="numeric" :readonly="mode === 'view'" :class="{ 'input-invalid': fieldErrors.age }" :aria-invalid="Boolean(fieldErrors.age)" :aria-describedby="fieldErrors.age ? 'patient-age-error' : undefined" required />
              <small v-if="fieldErrors.age" id="patient-age-error" class="field-error">{{ fieldErrors.age }}</small>
            </div>
            <div class="intake-field">
              <label for="patient-gender">Gender <span class="required">*</span></label>
              <select id="patient-gender" v-model="form.patient_gender" :disabled="mode === 'view'" :class="{ 'input-invalid': fieldErrors.gender }" :aria-invalid="Boolean(fieldErrors.gender)" :aria-describedby="fieldErrors.gender ? 'patient-gender-error' : undefined" required>
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
              <small v-if="fieldErrors.gender" id="patient-gender-error" class="field-error">{{ fieldErrors.gender }}</small>
            </div>
            <div class="intake-field intake-field-phone">
              <label for="patient-phone">Phone number <span class="required">*</span></label>
              <input id="patient-phone" v-model.trim="form.patient_phone" type="tel" inputmode="tel" autocomplete="tel" placeholder="01XXXXXXXXX or +8801XXXXXXXXX" :readonly="mode === 'view'" :class="{ 'input-invalid': fieldErrors.phone }" :aria-invalid="Boolean(fieldErrors.phone)" :aria-describedby="fieldErrors.phone ? 'patient-phone-error' : undefined" required />
              <small v-if="fieldErrors.phone" id="patient-phone-error" class="field-error">{{ fieldErrors.phone }}</small>
            </div>
          </div>

          <div v-if="pageError" class="intake-error form-error" role="alert">{{ pageError }}</div>

          <footer class="intake-dialog-foot">
            <button class="btn btn-outline intake-secondary" type="button" @click="closeDialog">{{ mode === 'view' ? 'Close' : 'Cancel' }}</button>
            <template v-if="mode === 'view'">
              <button class="btn btn-primary intake-primary" type="button" @click="openEdit(selectedIntake)"><Pencil :size="17" /> Edit Appointment</button>
            </template>
            <button v-else class="btn btn-primary intake-primary" type="submit" :disabled="saving">
              <LoaderCircle v-if="saving" :size="17" class="spin" />
              <Save v-else :size="17" />
              {{ saving ? 'Saving…' : mode === 'edit' ? 'Save Changes' : 'Create Appointment' }}
            </button>
          </footer>
        </form>
      </section>
    </div>
  </section>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { toast } from 'vue-sonner'
import { CalendarDays, Eye, LoaderCircle, Pencil, Plus, Save, Search, Trash2, X } from '@lucide/vue'
import api from '../api/axios'

const intakes = ref([])
const search = ref('')
const loading = ref(false)
const saving = ref(false)
const pageError = ref('')
const dialogOpen = ref(false)
const mode = ref('create')
const selectedIntake = ref(null)
const fieldErrors = ref({})
const pagination = reactive({ current_page: 1, last_page: 1, total: 0 })
const form = reactive({ date: todayInput(), patient_name: '', patient_age: '', patient_gender: '', patient_phone: '' })
let listSearchTimer

const dialogTitle = computed(() => ({ create: 'Create Appointment', edit: 'Edit Appointment', view: `Appointment #${selectedIntake.value?.serial_number || ''}` }[mode.value]))

onMounted(loadIntakes)
onBeforeUnmount(() => {
  window.clearTimeout(listSearchTimer)
})

watch(search, () => {
  window.clearTimeout(listSearchTimer)
  listSearchTimer = window.setTimeout(() => {
    pagination.current_page = 1
    loadIntakes()
  }, 250)
})

async function loadIntakes() {
  loading.value = true
  pageError.value = ''
  try {
    const { data } = await api.get('/appointments', {
      params: { search: search.value.trim() || undefined, page: pagination.current_page },
    })
    intakes.value = data.data || []
    pagination.current_page = data.meta?.current_page || 1
    pagination.last_page = data.meta?.last_page || 1
    pagination.total = data.meta?.total || 0
  } catch (error) {
    pageError.value = error.response?.data?.message || 'Appointments could not be loaded.'
  } finally {
    loading.value = false
  }
}

function openCreate() {
  resetForm()
  mode.value = 'create'
  selectedIntake.value = null
  dialogOpen.value = true
}

async function openEdit(intake) {
  try {
    const { data } = await api.get(`/appointments/${intake.serial_number}`)
    const record = data.data || data
    selectedIntake.value = record
    mode.value = 'edit'
    form.date = record.date || todayInput()
    form.patient_name = record.name
    form.patient_age = String(record.age)
    form.patient_gender = record.gender
    form.patient_phone = record.phone
    fieldErrors.value = {}
    pageError.value = ''
    dialogOpen.value = true
  } catch (error) {
    toast.error(error.response?.data?.message || 'The appointment could not be opened.')
  }
}

async function openView(intake) {
  try {
    const { data } = await api.get(`/appointments/${intake.serial_number}`)
    selectedIntake.value = data.data || data
    const record = selectedIntake.value
    form.date = record.date || todayInput()
    form.patient_name = record.name
    form.patient_age = String(record.age)
    form.patient_gender = record.gender
    form.patient_phone = record.phone
    mode.value = 'view'
    fieldErrors.value = {}
    pageError.value = ''
    dialogOpen.value = true
  } catch (error) {
    toast.error(error.response?.data?.message || 'The appointment could not be opened.')
  }
}

async function saveIntake() {
  fieldErrors.value = {}
  pageError.value = ''
  const payload = {
    date: form.date,
    name: form.patient_name.trim(),
    age: form.patient_age === '' ? '' : Number(form.patient_age),
    gender: form.patient_gender,
    phone: form.patient_phone.trim(),
  }
  saving.value = true
  try {
    if (mode.value === 'edit') {
      await api.put(`/appointments/${selectedIntake.value.serial_number}`, payload)
      toast.success('Appointment updated successfully.')
    } else {
      await api.post('/appointments', payload)
      toast.success('Appointment created successfully.')
    }
    closeDialog()
    pagination.current_page = 1
    await loadIntakes()
  } catch (error) {
    const response = error.response?.data
    if (response?.errors) {
      fieldErrors.value = Object.fromEntries(Object.entries(response.errors).map(([key, messages]) => [key, messages[0]]))
    } else {
      pageError.value = response?.message || 'The appointment could not be saved.'
    }
  } finally {
    saving.value = false
  }
}

async function deleteIntake(intake) {
  if (!window.confirm(`Delete appointment ${intake.serial_number} for ${intake.name}?`)) return
  try {
    await api.delete(`/appointments/${intake.serial_number}`)
    toast.success('Appointment deleted successfully.')
    if (intakes.value.length === 1 && pagination.current_page > 1) pagination.current_page -= 1
    await loadIntakes()
  } catch (error) {
    toast.error(error.response?.data?.message || 'The appointment could not be deleted.')
  }
}

function changePage(page) {
  pagination.current_page = page
  loadIntakes()
}

function resetForm() {
  form.date = todayInput()
  form.patient_name = ''
  form.patient_age = ''
  form.patient_gender = ''
  form.patient_phone = ''
  fieldErrors.value = {}
  pageError.value = ''
}

function closeDialog() {
  dialogOpen.value = false
}

function formatDate(value) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('en-BD', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(`${value}T00:00:00`))
}

function formatGender(value) {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : '—'
}

function todayInput() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}
</script>

<style scoped>
.intake-page { display: grid; gap: 18px; }
.intake-create { min-height: 48px; padding-inline: 19px; font-size: 15px; }
.intake-summary { display: flex; align-items: center; gap: 15px; padding: 17px 20px; }
.summary-icon { width: 48px; height: 48px; display: grid; place-items: center; flex: 0 0 auto; border-radius: 14px; color: #4338ca; background: #eef2ff; }
.intake-summary > div:nth-child(2) { display: grid; gap: 1px; min-width: 140px; }
.intake-summary strong { color: #172033; font-size: 23px; line-height: 1.15; }
.intake-summary span, .intake-summary p { color: var(--muted); font-size: 14px; }
.intake-summary p { margin-left: auto; }
.intake-toolbar { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
.intake-search { max-width: 520px; width: 100%; min-height: 48px; }
.intake-search input { font-size: 15px; }
.intake-table-card { overflow: hidden; }
.intake-table { min-width: 930px; }
.intake-table th { white-space: nowrap; }
.draft-number { color: var(--primary); }
.capitalize { text-transform: capitalize; }
.intake-actions { display: flex; gap: 7px; justify-content: flex-end; align-items: center; white-space: nowrap; }
.danger-action { color: #dc2626; background: #fff5f5; }
.danger-action:hover { background: #fee2e2; }
.intake-empty { min-height: 260px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 9px; padding: 28px; color: var(--muted); text-align: center; }
.intake-empty > svg { color: #6474ef; }
.intake-empty h3 { color: #18243a; font-size: 18px; }
.intake-empty p { margin-bottom: 8px; }
.intake-pagination { display: flex; align-items: center; justify-content: space-between; padding: 14px 18px; border-top: 1px solid var(--border); color: var(--muted); }
.intake-pagination > div { display: flex; gap: 8px; }
.intake-error { display: flex; align-items: center; justify-content: space-between; gap: 14px; padding: 12px 15px; border: 1px solid #fecaca; border-radius: 12px; color: #991b1b; background: #fff7f7; }
.intake-dialog-backdrop { position: fixed; inset: 0; z-index: 100; display: grid; place-items: center; padding: 18px; overflow-y: auto; background: rgba(15, 23, 42, .58); }
.intake-dialog { width: min(760px, 100%); max-height: min(820px, calc(100vh - 36px)); display: flex; flex-direction: column; overflow: hidden; border-radius: 20px; box-shadow: 0 24px 70px rgba(15, 23, 42, .28); }
.intake-dialog-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 20px; padding: 24px 28px 20px; border-bottom: 1px solid var(--border); }
.intake-dialog-head h2 { margin: 3px 0 5px; color: #172033; font-size: 25px; letter-spacing: -.025em; }
.intake-dialog-head p { color: var(--muted); font-size: 14px; }
.dialog-kicker { color: #4f46e5; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: .09em; }
.intake-dialog-head .icon-btn { width: 44px; height: 44px; flex: 0 0 auto; }
.intake-form { overflow-y: auto; padding: 22px 28px 0; }
.patient-search-block { position: relative; margin-bottom: 21px; }
.patient-search-block > label, .intake-field label { display: block; margin-bottom: 8px; color: #26344b; font-size: 15px; font-weight: 700; }
.patient-search-input { display: flex; align-items: center; gap: 11px; height: 54px; padding: 0 15px; border: 1px solid #d8dfeb; border-radius: 12px; color: #67748a; background: #fff; }
.patient-search-input:focus-within { border-color: #7c73f6; box-shadow: 0 0 0 4px rgba(99, 102, 241, .13); }
.patient-search-input input { width: 100%; height: 100%; border: 0; outline: 0; color: #18243a; font: inherit; font-size: 16px; background: transparent; }
.patient-search-block > small { display: block; margin-top: 7px; color: var(--muted); font-size: 12px; }
.patient-suggestions { position: absolute; z-index: 4; top: 96px; right: 0; left: 0; max-height: 260px; overflow-y: auto; padding: 6px; border: 1px solid #dfe4ed; border-radius: 12px; background: #fff; box-shadow: 0 14px 35px rgba(15, 23, 42, .15); }
.patient-suggestions button { display: flex; width: 100%; align-items: center; gap: 12px; padding: 11px 12px; border-radius: 9px; text-align: left; }
.patient-suggestions button:hover, .patient-suggestions button:focus-visible { outline: 0; background: #f2f4ff; }
.patient-suggestions button > span:last-child { display: grid; gap: 2px; }
.patient-suggestions strong { color: #1c2940; font-size: 15px; }
.patient-suggestions small, .patient-suggestions p { color: var(--muted); font-size: 13px; }
.patient-suggestions p { padding: 14px; }
.patient-suggestion-avatar, .selected-patient-icon { width: 40px; height: 40px; display: grid; flex: 0 0 auto; place-items: center; border-radius: 12px; color: #4f46e5; background: #eef2ff; }
.selected-patient-banner { display: flex; align-items: center; gap: 12px; margin-bottom: 21px; padding: 12px; border: 1px solid #dbe3ff; border-radius: 13px; background: #f8f9ff; }
.selected-patient-banner > span:nth-child(2) { display: grid; gap: 2px; }
.selected-patient-banner strong { color: #1d2940; font-size: 14px; }
.selected-patient-banner small { color: var(--muted); font-size: 13px; }
.selected-patient-banner button { margin-left: auto; }
.intake-fields-heading { display: flex; align-items: baseline; justify-content: space-between; gap: 10px; margin: 6px 0 14px; }
.intake-fields-heading h3 { color: #1c2940; font-size: 17px; }
.intake-fields-heading .muted { font-size: 12px; }
.intake-fields-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 17px 18px; padding-bottom: 17px; }
.intake-field input, .intake-field select { width: 100%; height: 54px; padding: 0 14px; border: 1px solid #d8dfeb; border-radius: 12px; outline: 0; color: #1b2940; font: inherit; font-size: 16px; background: #fff; }
.intake-field input:focus, .intake-field select:focus { border-color: #7c73f6; box-shadow: 0 0 0 4px rgba(99, 102, 241, .13); }
.intake-field input[readonly], .intake-field select:disabled { color: #546178; background: #f7f8fb; }
.intake-field .input-invalid { border-color: #dc2626; }
.required { color: #dc2626; }
.field-error { display: block; margin-top: 5px; color: #b91c1c; font-size: 12px; }
.edit-patient-note { margin: -6px 0 17px; }
.text-button { color: #4f46e5; font-size: 14px; font-weight: 700; text-decoration: underline; text-underline-offset: 3px; }
.form-error { margin: 0 0 16px; }
.intake-dialog-foot { position: sticky; bottom: 0; display: flex; justify-content: flex-end; gap: 10px; margin: 0 -28px; padding: 15px 28px; border-top: 1px solid var(--border); background: #fff; }
.intake-dialog-foot .btn { min-height: 47px; padding-inline: 18px; font-size: 15px; }
.spin { animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

@media (max-width: 760px) {
  .intake-summary { align-items: flex-start; }
  .intake-summary p { display: none; }
  .intake-toolbar { align-items: stretch; flex-direction: column; }
  .intake-search { max-width: none; }
  .intake-dialog-head, .intake-form { padding-right: 18px; padding-left: 18px; }
  .intake-dialog-foot { margin: 0 -18px; padding-right: 18px; padding-left: 18px; }
  .intake-fields-grid { grid-template-columns: 1fr; gap: 14px; }
  .intake-dialog-head h2 { font-size: 22px; }
}
</style>
