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
      <select v-model="dosageFormFilter" class="input catalog-filter dosage-form-filter" aria-label="Filter medicines by dosage form">
        <option value="all">All dosage forms</option>
        <option v-for="dosageForm in dosageForms" :key="dosageForm" :value="dosageForm">{{ dosageForm }}</option>
      </select>
      <select v-model="categoryFilter" class="input catalog-filter category-filter" aria-label="Filter medicines by category">
        <option value="all">All categories</option>
        <option v-if="hasUncategorizedMedicines" value="__uncategorized__">Uncategorized</option>
        <option v-for="category in categories" :key="category" :value="category">{{ category }}</option>
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
        <h4>{{ hasActiveFilters ? 'No matching medicines' : 'No medicines found' }}</h4>
        <p>{{ hasActiveFilters ? 'Adjust your search or filters and try again.' : 'Add a medicine to start building the prescription catalog.' }}</p>
      </div>
      <div v-else class="table-wrap">
        <table class="table medicine-table">
          <thead>
            <tr>
              <th class="serial-heading">SL No.</th>
              <th>Medicine</th>
              <th>Strength & form</th>
              <th>Route</th>
              <th>Prescription Usage</th>
              <th>Status</th>
              <th class="actions-heading">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(medicine, index) in paginatedMedicines" :key="medicine.id">
              <td class="serial-cell">{{ (currentPage - 1) * pageSize + index + 1 }}</td>
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
                  <button v-if="medicine.is_active" class="icon-btn danger-action" type="button" title="Deactivate medicine" :aria-label="'Deactivate ' + medicine.name" :disabled="busyId === medicine.id" @click="requestMedicineStatus(medicine, false)"><Ban :size="16" /></button>
                  <button v-else class="icon-btn activate-action" type="button" title="Activate medicine" :aria-label="'Activate ' + medicine.name" :disabled="busyId === medicine.id" @click="requestMedicineStatus(medicine, true)"><Check :size="16" /></button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <footer v-if="!loading && filteredMedicines.length" class="medicine-pagination">
        <div class="pagination-summary">
          Showing <strong>{{ paginationStart }}–{{ paginationEnd }}</strong> of <strong>{{ filteredMedicines.length }}</strong> medicines
        </div>
        <div class="pagination-controls">
          <label class="page-size-control">Rows per page
            <select v-model.number="pageSize" class="input page-size-select" aria-label="Medicines per page">
              <option :value="10">10</option>
              <option :value="25">25</option>
              <option :value="50">50</option>
            </select>
          </label>
          <button class="btn btn-outline btn-sm" type="button" :disabled="currentPage <= 1" @click="currentPage--">Previous</button>
          <button
            v-for="page in paginationPages"
            :key="page"
            class="btn btn-sm pagination-page"
            :class="page === currentPage ? 'btn-primary' : 'btn-outline'"
            type="button"
            :aria-current="page === currentPage ? 'page' : undefined"
            :aria-label="'Go to page ' + page"
            @click="currentPage = page"
          >{{ page }}</button>
          <button class="btn btn-outline btn-sm" type="button" :disabled="currentPage >= pageCount" @click="currentPage++">Next</button>
        </div>
      </footer>
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
                  <select id="medicine-form" v-model="form.dosage_form" class="input" :class="{ 'input-invalid': fieldErrors.dosage_form }" :disabled="readOnly || dosageLoading" required :aria-invalid="Boolean(fieldErrors.dosage_form)" :aria-describedby="fieldErrors.dosage_form ? 'medicine-form-error' : undefined">
                    <option value="">{{ dosageLoading ? 'Loading dosage forms...' : 'Select dosage form' }}</option>
                    <option v-if="form.dosage_form && !dosageOptions.some((dosage) => dosage.name === form.dosage_form)" :value="form.dosage_form">{{ form.dosage_form }} (existing)</option>
                    <option v-for="dosage in dosageOptions" :key="dosage.id" :value="dosage.name">{{ dosage.name }}</option>
                  </select>
                  <small v-if="fieldErrors.dosage_form" id="medicine-form-error" class="field-error" role="alert">{{ fieldErrors.dosage_form }}</small>
                  <small v-else-if="!dosageLoading && !dosageOptions.length" class="field-error">No active dosage forms. Add one from the Dosages menu.</small>
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

    <Teleport to="body">
      <div v-if="statusDialogOpen" class="dialog-backdrop status-backdrop" @click.self="closeStatusDialog" @keydown.esc="closeStatusDialog">
        <section class="status-confirm-dialog card" role="alertdialog" aria-modal="true" aria-labelledby="status-dialog-title" aria-describedby="status-dialog-description">
          <div class="status-confirm-icon" :class="pendingStatus?.isActive ? 'status-confirm-activate' : 'status-confirm-deactivate'">
            <Check v-if="pendingStatus?.isActive" :size="22" />
            <Ban v-else :size="22" />
          </div>
          <h2 id="status-dialog-title">{{ pendingStatus?.isActive ? 'Activate medicine?' : 'Deactivate medicine?' }}</h2>
          <p id="status-dialog-description">
            {{ pendingStatus?.isActive ? 'This medicine will be available in the prescription catalog again.' : 'This medicine will no longer be available for new prescriptions. Existing records will be kept.' }}
          </p>
          <strong class="status-confirm-name">{{ pendingStatus?.medicine?.name }}</strong>
          <footer class="status-confirm-actions">
            <button class="btn btn-outline" type="button" :disabled="busyId !== null" @click="closeStatusDialog">Cancel</button>
            <button class="btn" :class="pendingStatus?.isActive ? 'btn-primary' : 'btn-danger'" type="button" :disabled="busyId !== null" @click="confirmMedicineStatus">
              {{ busyId !== null ? 'Updating...' : pendingStatus?.isActive ? 'Activate medicine' : 'Deactivate medicine' }}
            </button>
          </footer>
        </section>
      </div>
    </Teleport>
  </section>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { toast } from 'vue-sonner'
import { Ban, Check, Eye, Pill, Pencil, Plus, Search, X } from '@lucide/vue'
import api from '../api/axios'

const medicines = ref([])
const dosageCatalog = ref([])
const dosageLoading = ref(true)
const loading = ref(true)
const saving = ref(false)
const busyId = ref(null)
const pageError = ref('')
const search = ref('')
const statusFilter = ref('all')
const dosageFormFilter = ref('all')
const categoryFilter = ref('all')
const currentPage = ref(1)
const pageSize = ref(10)
const dialogOpen = ref(false)
const statusDialogOpen = ref(false)
const pendingStatus = ref(null)
const dialogMode = ref('create')
const editingMedicine = ref(null)
const fieldErrors = ref({})
const form = reactive({ name: '', generic_name: '', brand_name: '', strength: '', dosage_form: '', category: '', route: '', notes: '', is_active: true })
const dosageOptions = computed(() => dosageCatalog.value.filter((dosage) => dosage.is_active))

const dosageForms = computed(() => [...new Set(medicines.value.map((medicine) => String(medicine.dosage_form || '').trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b)))
const categories = computed(() => [...new Set(medicines.value.map((medicine) => String(medicine.category || '').trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b)))
const hasUncategorizedMedicines = computed(() => medicines.value.some((medicine) => !String(medicine.category || '').trim()))
const hasActiveFilters = computed(() => Boolean(search.value.trim())
  || statusFilter.value !== 'all'
  || dosageFormFilter.value !== 'all'
  || categoryFilter.value !== 'all')

const filteredMedicines = computed(() => {
  const query = search.value.trim().toLowerCase()
  return medicines.value.filter((medicine) => {
    const matchesSearch = [medicine.name, medicine.generic_name, medicine.brand_name, medicine.strength, medicine.dosage_form, medicine.category, medicine.route]
      .some((value) => String(value || '').toLowerCase().includes(query))
    const matchesStatus = statusFilter.value === 'all'
      || (statusFilter.value === 'active' ? medicine.is_active : !medicine.is_active)
    const matchesDosageForm = dosageFormFilter.value === 'all'
      || String(medicine.dosage_form || '').trim() === dosageFormFilter.value
    const medicineCategory = String(medicine.category || '').trim()
    const matchesCategory = categoryFilter.value === 'all'
      || (categoryFilter.value === '__uncategorized__' ? !medicineCategory : medicineCategory === categoryFilter.value)
    return matchesSearch && matchesStatus && matchesDosageForm && matchesCategory
  })
})

const pageCount = computed(() => Math.max(1, Math.ceil(filteredMedicines.value.length / pageSize.value)))
const paginatedMedicines = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredMedicines.value.slice(start, start + pageSize.value)
})
const paginationStart = computed(() => filteredMedicines.value.length ? (currentPage.value - 1) * pageSize.value + 1 : 0)
const paginationEnd = computed(() => Math.min(currentPage.value * pageSize.value, filteredMedicines.value.length))
const paginationPages = computed(() => {
  const visibleCount = 5
  const start = Math.max(1, Math.min(currentPage.value - 2, pageCount.value - visibleCount + 1))
  const end = Math.min(pageCount.value, start + visibleCount - 1)
  return Array.from({ length: end - start + 1 }, (_, index) => start + index)
})

watch([search, statusFilter, dosageFormFilter, categoryFilter, pageSize], () => { currentPage.value = 1 })
watch(pageCount, (lastPage) => {
  if (currentPage.value > lastPage) currentPage.value = lastPage
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

async function loadDosages() {
  dosageLoading.value = true
  try {
    const response = await api.get('/admin/dosages')
    dosageCatalog.value = response.data.data || []
  } catch (error) {
    dosageCatalog.value = []
    toast.error(error.response?.data?.message || 'Dosage forms could not be loaded.')
  } finally {
    dosageLoading.value = false
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

function requestMedicineStatus(medicine, isActive) {
  pendingStatus.value = { medicine, isActive }
  statusDialogOpen.value = true
}

function closeStatusDialog() {
  if (busyId.value !== null) return
  statusDialogOpen.value = false
  pendingStatus.value = null
}

async function confirmMedicineStatus() {
  if (!pendingStatus.value || busyId.value !== null) return
  const { medicine, isActive } = pendingStatus.value
  busyId.value = medicine.id
  try {
    if (isActive) {
      await api.patch('/admin/medicines/' + medicine.id, { is_active: true })
    } else {
      await api.delete('/admin/medicines/' + medicine.id)
    }
    toast.success(isActive ? 'Medicine activated successfully.' : 'Medicine deactivated successfully.')
    statusDialogOpen.value = false
    pendingStatus.value = null
    await loadMedicines()
  } catch (error) {
    toast.error(error.response?.data?.message || 'The medicine status could not be changed.')
  } finally {
    busyId.value = null
  }
}

onMounted(() => {
  loadMedicines()
  loadDosages()
})
</script>

<style scoped>
.medicine-card { overflow: hidden; }
.medicine-pagination { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 14px 18px; border-top: 1px solid var(--border); color: var(--muted); font-size: 12px; }
.pagination-summary strong { color: var(--text); }
.pagination-controls { display: flex; align-items: center; gap: 6px; }
.page-size-control { display: inline-flex; align-items: center; gap: 8px; margin-right: 8px; white-space: nowrap; }
.page-size-select { width: 68px; min-height: 34px; padding: 5px 8px; }
.pagination-page { min-width: 34px; justify-content: center; }
.medicine-table { min-width: 960px; }
.serial-heading, .serial-cell { width: 72px; white-space: nowrap; }
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
.catalog-filter { width: auto; min-width: 155px; }
.dosage-form-filter { min-width: 165px; }
.category-filter { min-width: 155px; }
.dialog-backdrop { position: fixed; inset: 0; z-index: 100; display: grid; place-items: center; overflow-y: auto; padding: 24px; background: rgba(15, 23, 42, .56); }
.status-backdrop { z-index: 110; }
.status-confirm-dialog { width: min(440px, 100%); padding: 28px; text-align: center; box-shadow: 0 24px 70px rgba(15, 23, 42, .24); }
.status-confirm-icon { display: grid; place-items: center; width: 52px; height: 52px; margin: 0 auto 16px; border-radius: 16px; }
.status-confirm-activate { color: #059669; background: #ecfdf5; }
.status-confirm-deactivate { color: #dc2626; background: #fef2f2; }
.status-confirm-dialog h2 { font-size: 19px; }
.status-confirm-dialog p { margin: 8px 0 14px; color: var(--muted); font-size: 13px; line-height: 1.55; }
.status-confirm-name { display: block; margin-bottom: 24px; color: var(--text); font-size: 14px; }
.status-confirm-actions { display: flex; justify-content: center; gap: 10px; }
.btn-danger { color: white; background: #dc2626; border-color: #dc2626; }
.btn-danger:hover { background: #b91c1c; border-color: #b91c1c; }
.status-confirm-actions button:disabled { opacity: .65; cursor: wait; }
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
  .medicine-pagination { align-items: flex-start; flex-direction: column; }
  .pagination-controls { width: 100%; flex-wrap: wrap; }
  .page-size-control { margin-right: auto; }
  .form-grid { grid-template-columns: 1fr; }
  .field-wide { grid-column: auto; }
  .dialog-backdrop { padding: 12px; }
  .dialog-head, .dialog-body { padding-right: 17px; padding-left: 17px; }
  .dialog-actions { padding-right: 17px; padding-left: 17px; }
}
</style>
