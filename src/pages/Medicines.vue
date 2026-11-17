<template>
  <section>
    <header class="page-head">
      <div>
        <h1 class="page-title">Medicines</h1>
        <p class="page-sub">Manage the medicine catalog used for prescriptions.</p>
      </div>
      <button class="btn btn-primary" type="button" @click="openDialog()">
        <Plus :size="17" /> Add Medicine
      </button>
    </header>

    <div class="toolbar">
      <label class="search-inline">
        <Search :size="17" />
        <input v-model="search" type="search" placeholder="Search medicines..." aria-label="Search medicines" />
      </label>
      <select v-model="statusFilter" class="input status-filter" aria-label="Filter medicines by status">
        <option value="all">All medicines</option>
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
      </select>
      <span class="spacer"></span>
      <span class="medicine-total">{{ filteredMedicines.length }} medicines</span>
    </div>

    <div v-if="pageError" class="page-error" role="alert">
      <span>{{ pageError }}</span>
      <button class="btn btn-outline btn-sm" type="button" @click="loadMedicines">Try again</button>
    </div>

    <div class="card medicine-card">
      <div v-if="loading" class="empty" role="status">Loading medicines...</div>
      <div v-else-if="!filteredMedicines.length" class="empty">
        <Pill :size="30" />
        <h4>{{ search ? 'No matching medicines' : 'No medicines found' }}</h4>
        <p>{{ search ? 'Try a different search.' : 'Add a medicine to start building the prescription catalog.' }}</p>
      </div>
      <div v-else class="table-wrap">
        <table class="table medicine-table">
          <thead>
            <tr>
              <th>Medicine</th>
              <th>Strength & form</th>
              <th>Route</th>
              <th>Prescription Usage</th>
              <th>Status</th>
              <th class="actions-heading">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="medicine in filteredMedicines" :key="medicine.id">
              <td>
                <div class="medicine-name">
                  <span class="medicine-icon"><Pill :size="18" /></span>
                  <div><strong>{{ medicine.name }}</strong><small>{{ medicine.generic_name || medicine.brand_name || medicine.category || '—' }}</small></div>
                </div>
              </td>
              <td><strong>{{ medicine.strength || '—' }}</strong><small class="cell-subtitle">{{ medicine.dosage_form }}</small></td>
              <td>{{ medicine.route || '—' }}</td>
              <td><span class="usage-count">{{ medicine.prescription_items_count || 0 }}</span><span class="muted"> prescription items</span></td>
              <td><span class="status-pill" :class="medicine.is_active ? 'status-active' : 'status-inactive'">{{ medicine.is_active ? 'Active' : 'Inactive' }}</span></td>
              <td>
                <div class="medicine-actions">
                  <button class="btn btn-outline btn-sm" type="button" @click="openDialog(medicine, 'view')"><Eye :size="15" /> View</button>
                  <button class="btn btn-outline btn-sm" type="button" @click="openDialog(medicine, 'edit')"><Pencil :size="15" /> Edit</button>
                  <button v-if="medicine.is_active" class="icon-btn danger-action" type="button" title="Deactivate medicine" :aria-label="'Deactivate ' + medicine.name" :disabled="busyId === medicine.id" @click="setMedicineActive(medicine, false)"><Ban :size="16" /></button>
                  <button v-else class="icon-btn activate-action" type="button" title="Activate medicine" :aria-label="'Activate ' + medicine.name" :disabled="busyId === medicine.id" @click="setMedicineActive(medicine, true)"><Check :size="16" /></button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <Teleport to="body">
      <div v-if="dialogOpen" class="dialog-backdrop" @click.self="closeDialog">
        <section class="medicine-dialog card" role="dialog" aria-modal="true" aria-labelledby="medicine-dialog-title">
          <header class="dialog-head">
            <div><h2 id="medicine-dialog-title">{{ dialogTitle }}</h2><p>{{ dialogDescription }}</p></div>
            <button class="icon-btn" type="button" aria-label="Close dialog" @click="closeDialog"><X :size="18" /></button>
          </header>

          <form @submit.prevent="saveMedicine">
            <div class="dialog-body">
              <div class="form-grid">
                <div class="field">
                  <label for="medicine-name">Medicine name <span class="required">*</span></label>
                  <input id="medicine-name" v-model.trim="form.name" class="input" :class="{ 'input-invalid': fieldErrors.name }" type="text" maxlength="255" :readonly="readOnly" required :aria-invalid="Boolean(fieldErrors.name)" :aria-describedby="fieldErrors.name ? 'medicine-name-error' : undefined" />
                  <small v-if="fieldErrors.name" id="medicine-name-error" class="field-error" role="alert">{{ fieldErrors.name }}</small>
                </div>
                <div class="field">
                  <label for="medicine-generic">Generic name</label>
                  <input id="medicine-generic" v-model.trim="form.generic_name" class="input" :class="{ 'input-invalid': fieldErrors.generic_name }" type="text" maxlength="255" :readonly="readOnly" :aria-invalid="Boolean(fieldErrors.generic_name)" :aria-describedby="fieldErrors.generic_name ? 'medicine-generic-error' : undefined" />
                  <small v-if="fieldErrors.generic_name" id="medicine-generic-error" class="field-error" role="alert">{{ fieldErrors.generic_name }}</small>
                </div>
                <div class="field">
                  <label for="medicine-brand">Brand name</label>
                  <input id="medicine-brand" v-model.trim="form.brand_name" class="input" :class="{ 'input-invalid': fieldErrors.brand_name }" type="text" maxlength="255" :readonly="readOnly" :aria-invalid="Boolean(fieldErrors.brand_name)" :aria-describedby="fieldErrors.brand_name ? 'medicine-brand-error' : undefined" />
                  <small v-if="fieldErrors.brand_name" id="medicine-brand-error" class="field-error" role="alert">{{ fieldErrors.brand_name }}</small>
                </div>
                <div class="field">
                  <label for="medicine-strength">Strength</label>
                  <input id="medicine-strength" v-model.trim="form.strength" class="input" :class="{ 'input-invalid': fieldErrors.strength }" type="text" maxlength="100" placeholder="e.g. 0.5% or 250 mg" :readonly="readOnly" :aria-invalid="Boolean(fieldErrors.strength)" :aria-describedby="fieldErrors.strength ? 'medicine-strength-error' : undefined" />
                  <small v-if="fieldErrors.strength" id="medicine-strength-error" class="field-error" role="alert">{{ fieldErrors.strength }}</small>
                </div>
                <div class="field">
                  <label for="medicine-form">Dosage form <span class="required">*</span></label>
                  <input id="medicine-form" v-model.trim="form.dosage_form" class="input" :class="{ 'input-invalid': fieldErrors.dosage_form }" type="text" maxlength="40" placeholder="Eye drops, tablet, capsule, ointment..." :readonly="readOnly" required :aria-invalid="Boolean(fieldErrors.dosage_form)" :aria-describedby="fieldErrors.dosage_form ? 'medicine-form-error' : undefined" />
                  <small v-if="fieldErrors.dosage_form" id="medicine-form-error" class="field-error" role="alert">{{ fieldErrors.dosage_form }}</small>
                </div>
                <div class="field">
                  <label for="medicine-category">Category</label>
                  <input id="medicine-category" v-model.trim="form.category" class="input" :class="{ 'input-invalid': fieldErrors.category }" type="text" maxlength="60" :readonly="readOnly" :aria-invalid="Boolean(fieldErrors.category)" :aria-describedby="fieldErrors.category ? 'medicine-category-error' : undefined" />
                  <small v-if="fieldErrors.category" id="medicine-category-error" class="field-error" role="alert">{{ fieldErrors.category }}</small>
                </div>
                <div class="field">
                  <label for="medicine-route">Route</label>
                  <input id="medicine-route" v-model.trim="form.route" class="input" :class="{ 'input-invalid': fieldErrors.route }" type="text" maxlength="40" placeholder="Ophthalmic, oral..." :readonly="readOnly" :aria-invalid="Boolean(fieldErrors.route)" :aria-describedby="fieldErrors.route ? 'medicine-route-error' : undefined" />
                  <small v-if="fieldErrors.route" id="medicine-route-error" class="field-error" role="alert">{{ fieldErrors.route }}</small>
                </div>
                <div class="field field-wide">
                  <label for="medicine-notes">Notes</label>
                  <textarea id="medicine-notes" v-model.trim="form.notes" class="input notes-input" :class="{ 'input-invalid': fieldErrors.notes }" rows="3" :readonly="readOnly" :aria-invalid="Boolean(fieldErrors.notes)" :aria-describedby="fieldErrors.notes ? 'medicine-notes-error' : undefined"></textarea>
                  <small v-if="fieldErrors.notes" id="medicine-notes-error" class="field-error" role="alert">{{ fieldErrors.notes }}</small>
                </div>
                <label v-if="editingMedicine && !readOnly" class="active-option field-wide"><input v-model="form.is_active" type="checkbox" /> <span>Medicine is active</span></label>
                <div v-if="readOnly" class="field-wide"><span class="field-label">Status</span><span class="status-pill" :class="form.is_active ? 'status-active' : 'status-inactive'">{{ form.is_active ? 'Active' : 'Inactive' }}</span></div>
              </div>
            </div>
            <footer class="dialog-actions">
              <button class="btn btn-outline" type="button" :disabled="saving" @click="closeDialog">{{ readOnly ? 'Close' : 'Cancel' }}</button>
              <button v-if="!readOnly" class="btn btn-primary" type="submit" :disabled="saving">{{ saving ? 'Saving...' : editingMedicine ? 'Save Changes' : 'Create Medicine' }}</button>
            </footer>
          </form>
        </section>
      </div>
    </Teleport>
  </section>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { toast } from 'vue-sonner'
import { Ban, Check, Eye, Pill, Pencil, Plus, Search, X } from '@lucide/vue'
import api from '../api/axios'

const medicines = ref([])
const loading = ref(true)
const saving = ref(false)
const busyId = ref(null)
const pageError = ref('')
const search = ref('')
const statusFilter = ref('all')
const dialogOpen = ref(false)
const dialogMode = ref('create')
const editingMedicine = ref(null)
const fieldErrors = ref({})
const form = reactive({ name: '', generic_name: '', brand_name: '', strength: '', dosage_form: '', category: '', route: '', notes: '', is_active: true })

const filteredMedicines = computed(() => {
  const query = search.value.trim().toLowerCase()
  return medicines.value.filter((medicine) => {
    const matchesSearch = [medicine.name, medicine.generic_name, medicine.brand_name, medicine.strength, medicine.dosage_form, medicine.category, medicine.route]
      .some((value) => String(value || '').toLowerCase().includes(query))
    const matchesStatus = statusFilter.value === 'all'
      || (statusFilter.value === 'active' ? medicine.is_active : !medicine.is_active)
    return matchesSearch && matchesStatus
  })
})

const readOnly = computed(() => dialogMode.value === 'view')
const dialogTitle = computed(() => readOnly.value ? 'View Medicine' : editingMedicine.value ? 'Edit Medicine' : 'Create Medicine')
const dialogDescription = computed(() => readOnly.value ? 'Review medicine details and prescription usage.' : editingMedicine.value ? 'Update the medicine catalog entry.' : 'Add a medicine to the prescription catalog.')

async function loadMedicines() {
  loading.value = true
  pageError.value = ''
  try {
    const response = await api.get('/admin/medicines')
    medicines.value = response.data.data || []
  } catch (error) {
    const status = error.response?.status
    pageError.value = status === 401
      ? 'Your session has expired. Sign in again and reload this page.'
      : status === 403
        ? 'Your account is not authorized to manage medicines.'
        : status
          ? 'Medicines could not be loaded (HTTP ' + status + '). Select Try again.'
          : 'The API did not respond. Check that Laravel is running, then select Try again.'
  } finally {
    loading.value = false
  }
}

function resetForm() {
  Object.assign(form, { name: '', generic_name: '', brand_name: '', strength: '', dosage_form: '', category: '', route: '', notes: '', is_active: true })
}

async function openDialog(medicine = null, mode = 'create') {
  dialogMode.value = mode
  editingMedicine.value = null
  fieldErrors.value = {}
  resetForm()

  if (medicine) {
    try {
      const response = await api.get('/admin/medicines/' + medicine.id)
      const record = response.data.data
      editingMedicine.value = record
      Object.assign(form, {
        name: record.name || '',
        generic_name: record.generic_name || '',
        brand_name: record.brand_name || '',
        strength: record.strength || '',
        dosage_form: record.dosage_form || '',
        category: record.category || '',
        route: record.route || '',
        notes: record.notes || '',
        is_active: Boolean(record.is_active),
      })
    } catch {
      toast.error('The medicine could not be loaded.')
      return
    }
  }

  dialogOpen.value = true
}

function closeDialog() {
  if (saving.value) return
  dialogOpen.value = false
}

async function saveMedicine() {
  fieldErrors.value = {}
  saving.value = true
  const payload = { ...form }
  try {
    if (editingMedicine.value) {
      await api.put('/admin/medicines/' + editingMedicine.value.id, payload)
      toast.success('Medicine updated successfully.')
    } else {
      await api.post('/admin/medicines', payload)
      toast.success('Medicine created successfully.')
    }
    dialogOpen.value = false
    await loadMedicines()
  } catch (error) {
    const response = error.response?.data
    if (response?.errors) {
      fieldErrors.value = Object.fromEntries(Object.entries(response.errors).map(([key, messages]) => [key, messages[0]]))
    } else {
      toast.error(response?.message || 'The medicine could not be saved.')
    }
  } finally {
    saving.value = false
  }
}

async function setMedicineActive(medicine, isActive) {
  const action = isActive ? 'Activate' : 'Deactivate'
  if (!window.confirm(action + ' the "' + medicine.name + '" medicine?')) return
  busyId.value = medicine.id
  try {
    if (isActive) {
      await api.patch('/admin/medicines/' + medicine.id, { is_active: true })
    } else {
      await api.delete('/admin/medicines/' + medicine.id)
    }
    toast.success(isActive ? 'Medicine activated successfully.' : 'Medicine deactivated successfully.')
    await loadMedicines()
  } catch (error) {
    toast.error(error.response?.data?.message || 'The medicine status could not be changed.')
  } finally {
    busyId.value = null
  }
}

onMounted(loadMedicines)
</script>

<style scoped>
.medicine-card { overflow: hidden; }
.medicine-table { min-width: 920px; }
.actions-heading { text-align: right; }
.medicine-name { display: flex; align-items: center; gap: 11px; }
.medicine-name strong { display: block; text-transform: capitalize; }
.medicine-name small, .cell-subtitle { display: block; margin-top: 3px; color: var(--muted); font-size: 12px; }
.medicine-icon { display: grid; place-items: center; width: 38px; height: 38px; border-radius: 12px; color: var(--primary); background: #eef2ff; }
.usage-count { display: inline-flex; min-width: 28px; justify-content: center; padding: 3px 8px; border-radius: 99px; background: #f1f5f9; font-weight: 700; }
.muted, .medicine-total { color: var(--muted); font-size: 12px; }
.medicine-actions { display: flex; justify-content: flex-end; align-items: center; gap: 6px; }
.danger-action { color: #dc2626; }
.danger-action:hover { background: #fef2f2; color: #b91c1c; }
.activate-action { color: #059669; }
.activate-action:hover { background: #ecfdf5; }
.medicine-actions button:disabled { opacity: .55; cursor: wait; }
.status-filter { width: auto; min-width: 145px; }
.dialog-backdrop { position: fixed; inset: 0; z-index: 100; display: grid; place-items: center; overflow-y: auto; padding: 24px; background: rgba(15, 23, 42, .56); }
.medicine-dialog { display: flex; flex-direction: column; width: min(760px, 100%); max-height: min(820px, calc(100vh - 48px)); overflow: hidden; }
.medicine-dialog > form { display: flex; flex: 1; flex-direction: column; min-height: 0; overflow: hidden; }
.dialog-head { display: flex; flex: 0 0 auto; align-items: flex-start; justify-content: space-between; gap: 16px; padding: 22px 24px; border-bottom: 1px solid var(--border); }
.dialog-head h2 { font-size: 19px; }
.dialog-head p { margin-top: 3px; color: var(--muted); font-size: 12.5px; }
.dialog-body { flex: 1; min-height: 0; overflow-y: auto; padding: 22px 24px 8px; }
.form-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0 18px; }
.form-grid .field { margin-bottom: 18px; }
.field-wide { grid-column: 1 / -1; }
.field-label { display: block; margin-bottom: 8px; color: var(--text); font-size: 13px; font-weight: 600; }
.notes-input { min-height: 88px; resize: vertical; }
.required { color: #dc2626; font-weight: 800; }
.input-invalid { border-color: #dc2626; }
.input-invalid:focus { box-shadow: 0 0 0 4px rgba(220, 38, 38, .12); }
.field-error { display: block; margin-top: 6px; color: #dc2626; font-size: 12px; }
.active-option { display: flex; align-items: center; gap: 9px; margin: 0 0 18px; font-size: 13px; font-weight: 600; }
.active-option input { width: 16px; height: 16px; accent-color: var(--primary); }
.dialog-actions { display: flex; flex: 0 0 auto; justify-content: flex-end; gap: 10px; padding: 17px 24px 22px; border-top: 1px solid var(--border); }
.dialog-actions button:disabled { opacity: .65; cursor: wait; }
@media (max-width: 600px) {
  .form-grid { grid-template-columns: 1fr; }
  .field-wide { grid-column: auto; }
  .dialog-backdrop { padding: 12px; }
  .dialog-head, .dialog-body { padding-right: 17px; padding-left: 17px; }
  .dialog-actions { padding-right: 17px; padding-left: 17px; }
}
</style>
