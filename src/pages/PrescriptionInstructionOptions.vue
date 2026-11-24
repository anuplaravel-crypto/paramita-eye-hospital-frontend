<template>
  <section>
    <header class="page-head">
      <div>
        <h1 class="page-title">Prescription Instruction Options</h1>
        <p class="page-sub">Manage the options used in prescription dose, frequency, duration, meal timing, and instruction fields.</p>
      </div>
      <button class="btn btn-primary" type="button" @click="openDialog()"><Plus :size="17" /> Add Option</button>
    </header>

    <div class="option-tabs" role="tablist" aria-label="Prescription option categories">
      <button
        v-for="tab in tabs"
        :key="tab.type"
        class="option-tab"
        :class="{ 'option-tab-active': activeType === tab.type }"
        type="button"
        role="tab"
        :aria-selected="activeType === tab.type"
        @click="selectTab(tab.type)"
      >
        {{ tab.label }}
        <span class="tab-count">{{ typeCounts[tab.type] || 0 }}</span>
      </button>
    </div>

    <div class="toolbar">
      <label class="search-inline">
        <Search :size="17" />
        <input v-model="search" type="search" :placeholder="'Search ' + currentTab.label.toLowerCase() + ' options...'" :aria-label="'Search ' + currentTab.label.toLowerCase() + ' options'" />
      </label>
      <span class="spacer"></span>
      <span class="option-total">{{ filteredOptions.length }} {{ currentTab.label.toLowerCase() }} options</span>
    </div>

    <div v-if="pageError" class="page-error" role="alert">
      <span>{{ pageError }}</span>
      <button class="btn btn-outline btn-sm" type="button" @click="loadPageData">Try again</button>
    </div>

    <div class="card option-card">
      <div v-if="loading" class="empty" role="status">Loading {{ currentTab.label.toLowerCase() }} options...</div>
      <div v-else-if="!filteredOptions.length" class="empty">
        <ClipboardList :size="30" />
        <h4>{{ search ? 'No matching options' : 'No ' + currentTab.label.toLowerCase() + ' options found' }}</h4>
        <p>{{ search ? 'Try another search.' : 'Add an option to make it available in prescriptions.' }}</p>
      </div>
      <div v-else class="table-wrap">
        <table class="table option-table">
          <thead>
            <tr>
              <th v-if="activeType === 'dose' || activeType === 'meal_timing'">Dosage form</th>
              <th v-if="activeType === 'dose'">Route</th>
              <th>{{ currentTab.label }}</th>
              <th>Status</th>
              <th class="actions-heading">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="option in filteredOptions" :key="option.id">
              <td v-if="activeType === 'dose' || activeType === 'meal_timing'"><strong>{{ option.dosage_form?.name || 'Unknown dosage form' }}</strong></td>
              <td v-if="activeType === 'dose'">{{ option.route || '—' }}</td>
              <td class="option-value">{{ optionValueLabel(option) }}</td>
              <td><span class="status-pill" :class="option.is_active ? 'status-active' : 'status-inactive'">{{ option.is_active ? 'Active' : 'Inactive' }}</span></td>
              <td>
                <div class="option-actions">
                  <button class="btn btn-outline btn-sm" type="button" @click="openDialog(option, 'view')"><Eye :size="15" /> View</button>
                  <button class="btn btn-outline btn-sm" type="button" @click="openDialog(option, 'edit')"><Pencil :size="15" /> Edit</button>
                  <button class="icon-btn danger-action" type="button" :aria-label="'Delete ' + currentTab.label.toLowerCase() + ' option'" title="Delete option" @click="deleteOption(option)"><Trash2 :size="16" /></button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <Teleport to="body">
      <div v-if="dialogOpen" class="dialog-backdrop" @click.self="closeDialog">
        <section class="option-dialog card" role="dialog" aria-modal="true" aria-labelledby="option-dialog-title">
          <header class="dialog-head">
            <div><h2 id="option-dialog-title">{{ dialogTitle }}</h2><p>{{ dialogDescription }}</p></div>
            <button class="icon-btn" type="button" aria-label="Close dialog" :disabled="saving" @click="closeDialog"><X :size="18" /></button>
          </header>
          <form @submit.prevent="saveOption">
            <div class="dialog-body">
              <div v-if="activeType === 'dose' || activeType === 'meal_timing'" class="field">
                <label for="option-dosage-form">Dosage form <span class="required">*</span></label>
                <select id="option-dosage-form" v-model="form.dosage_form_id" class="input" :class="{ 'input-invalid': fieldErrors.dosage_form_id }" :disabled="readOnly" required :aria-invalid="Boolean(fieldErrors.dosage_form_id)" :aria-describedby="fieldErrors.dosage_form_id ? 'option-dosage-form-error' : undefined">
                  <option value="">Select a dosage form</option>
                  <option v-for="dosage in availableDosages" :key="dosage.id" :value="String(dosage.id)">{{ dosage.name }}</option>
                </select>
                <small v-if="fieldErrors.dosage_form_id" id="option-dosage-form-error" class="field-error" role="alert">{{ fieldErrors.dosage_form_id }}</small>
              </div>

              <div v-if="activeType === 'dose'" class="field">
                <label for="option-route">Route <span class="required">*</span></label>
                <select id="option-route" v-model="form.route" class="input" :class="{ 'input-invalid': fieldErrors.route }" :disabled="readOnly" required :aria-invalid="Boolean(fieldErrors.route)" :aria-describedby="fieldErrors.route ? 'option-route-error' : undefined">
                  <option value="">Select a route</option>
                  <option value="Oral">Oral</option>
                  <option value="Ophthalmic">Ophthalmic</option>
                </select>
                <small v-if="fieldErrors.route" id="option-route-error" class="field-error" role="alert">{{ fieldErrors.route }}</small>
              </div>

              <div class="field">
                <label :for="'option-' + activeType">{{ currentTab.label }} <span class="required">*</span></label>
                <input v-if="activeType === 'meal_timing'" :id="'option-' + activeType" v-model.trim="form.meal_timing" class="input" :class="{ 'input-invalid': fieldErrors[activeType] }" type="text" maxlength="30" placeholder="e.g. Before meal or After meal" :readonly="readOnly" required :aria-invalid="Boolean(fieldErrors[activeType])" :aria-describedby="fieldErrors[activeType] ? 'option-value-error' : undefined" />
                <textarea v-else-if="activeType === 'instruction'" :id="'option-' + activeType" v-model.trim="form[activeType]" class="input instruction-input" :class="{ 'input-invalid': fieldErrors[activeType] }" rows="4" :readonly="readOnly" required :aria-invalid="Boolean(fieldErrors[activeType])" :aria-describedby="fieldErrors[activeType] ? 'option-value-error' : undefined"></textarea>
                <input v-else :id="'option-' + activeType" v-model.trim="form[activeType]" class="input" :class="{ 'input-invalid': fieldErrors[activeType] }" type="text" maxlength="100" :readonly="readOnly" required :aria-invalid="Boolean(fieldErrors[activeType])" :aria-describedby="fieldErrors[activeType] ? 'option-value-error' : undefined" />
                <small v-if="fieldErrors[activeType]" id="option-value-error" class="field-error" role="alert">{{ fieldErrors[activeType] }}</small>
              </div>

              <div v-if="!readOnly" class="field">
                <label for="option-order">Display order</label>
                <input id="option-order" v-model.number="form.sort_order" class="input" :class="{ 'input-invalid': fieldErrors.sort_order }" type="number" min="0" max="65535" :aria-invalid="Boolean(fieldErrors.sort_order)" :aria-describedby="fieldErrors.sort_order ? 'option-order-error' : undefined" />
                <small v-if="fieldErrors.sort_order" id="option-order-error" class="field-error" role="alert">{{ fieldErrors.sort_order }}</small>
              </div>
              <label v-if="editingOption && !readOnly" class="active-option"><input v-model="form.is_active" type="checkbox" /> <span>Option is active</span></label>
              <div v-if="readOnly" class="field"><span class="field-label">Status</span><span class="status-pill" :class="form.is_active ? 'status-active' : 'status-inactive'">{{ form.is_active ? 'Active' : 'Inactive' }}</span></div>
              <p v-if="(activeType === 'dose' || activeType === 'meal_timing') && !activeDosages.length" class="field-error" role="alert">No active dosage forms are available. Add or activate one in Dosages first.</p>
            </div>
            <footer class="dialog-actions">
              <button class="btn btn-outline" type="button" :disabled="saving" @click="closeDialog">{{ readOnly ? 'Close' : 'Cancel' }}</button>
              <button v-if="!readOnly" class="btn btn-primary" type="submit" :disabled="saving || (['dose', 'meal_timing'].includes(activeType) && !activeDosages.length)">{{ saving ? 'Saving...' : editingOption ? 'Save Changes' : 'Create Option' }}</button>
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
import { ClipboardList, Eye, Pencil, Plus, Search, Trash2, X } from '@lucide/vue'
import api from '../api/axios'

const tabs = [
  { type: 'dose', label: 'Dose' },
  { type: 'frequency', label: 'Frequency' },
  { type: 'duration', label: 'Duration' },
  { type: 'instruction', label: 'Instructions' },
  { type: 'meal_timing', label: 'Meal timing' },
]
const options = ref([])
const dosages = ref([])
const activeType = ref('dose')
const loading = ref(true)
const saving = ref(false)
const pageError = ref('')
const search = ref('')
const dialogOpen = ref(false)
const dialogMode = ref('create')
const editingOption = ref(null)
const fieldErrors = ref({})
const form = reactive({ dosage_form_id: '', route: '', dose: '', frequency: '', duration: '', instruction: '', meal_timing: '', sort_order: 0, is_active: true })

const currentTab = computed(() => tabs.find((tab) => tab.type === activeType.value) || tabs[0])
const activeDosages = computed(() => dosages.value.filter((dosage) => dosage.is_active))
const availableDosages = computed(() => {
  if (form.dosage_form_id && !activeDosages.value.some((dosage) => String(dosage.id) === String(form.dosage_form_id))) {
    return dosages.value.filter((dosage) => String(dosage.id) === String(form.dosage_form_id) || dosage.is_active)
  }
  return activeDosages.value
})
const typeCounts = computed(() => options.value.reduce((counts, option) => {
  counts[option.option_type] = (counts[option.option_type] || 0) + 1
  return counts
}, {}))
const filteredOptions = computed(() => {
  const query = search.value.trim().toLowerCase()
  return options.value
    .filter((option) => option.option_type === activeType.value)
    .filter((option) => [option.dosage_form?.name, option.route, optionValueLabel(option)].some((value) => String(value || '').toLowerCase().includes(query)))
})
const readOnly = computed(() => dialogMode.value === 'view')
const dialogTitle = computed(() => readOnly.value ? 'View ' + currentTab.value.label + ' Option' : editingOption.value ? 'Edit ' + currentTab.value.label + ' Option' : 'Create ' + currentTab.value.label + ' Option')
const dialogDescription = computed(() => readOnly.value ? 'Review this prescription option.' : editingOption.value ? 'Update this prescription option.' : 'Add an option for the ' + currentTab.value.label.toLowerCase() + ' list.')

function selectTab(type) {
  activeType.value = type
  search.value = ''
  dialogOpen.value = false
  fieldErrors.value = {}
}

function optionValueLabel(option) {
  if (option.option_type !== 'meal_timing') return option[activeType.value]
  return option.meal_timing === 'before_meal' ? 'Before meal' : option.meal_timing === 'after_meal' ? 'After meal' : option.meal_timing
}

async function loadPageData() {
  loading.value = true
  pageError.value = ''
  try {
    const [optionResponse, dosageResponse] = await Promise.all([
      api.get('/admin/prescription-instruction-options'),
      api.get('/admin/dosages'),
    ])
    options.value = optionResponse.data.data || []
    dosages.value = dosageResponse.data.data || []
  } catch (error) {
    const status = error.response?.status
    pageError.value = status === 401
      ? 'Your session has expired. Sign in again and reload this page.'
      : status === 403
        ? 'Your account is not authorized to manage prescription options.'
        : status
          ? 'Prescription options could not be loaded (HTTP ' + status + '). Select Try again.'
          : 'The API did not respond. Check that Laravel is running, then select Try again.'
  } finally {
    loading.value = false
  }
}

function resetForm() {
  Object.assign(form, {
    dosage_form_id: activeDosages.value[0] ? String(activeDosages.value[0].id) : '',
    route: '', dose: '', frequency: '', duration: '', instruction: '', meal_timing: '',
    sort_order: typeCounts.value[activeType.value] || 0,
    is_active: true,
  })
}

async function openDialog(option = null, mode = 'create') {
  dialogMode.value = mode
  editingOption.value = null
  fieldErrors.value = {}
  resetForm()

  if (option) {
    try {
      const response = await api.get('/admin/prescription-instruction-options/' + option.id)
      editingOption.value = response.data.data
      Object.assign(form, {
        ...response.data.data,
        dosage_form_id: response.data.data.dosage_form_id ? String(response.data.data.dosage_form_id) : '',
      })
    } catch {
      toast.error('The prescription option could not be loaded.')
      return
    }
  }

  dialogOpen.value = true
}

function closeDialog() {
  if (!saving.value) dialogOpen.value = false
}

async function saveOption() {
  fieldErrors.value = {}
  saving.value = true
  try {
    const payload = {
      option_type: activeType.value,
      dosage_form_id: ['dose', 'meal_timing'].includes(activeType.value) ? Number(form.dosage_form_id) : null,
      route: activeType.value === 'dose' ? form.route : null,
      dose: activeType.value === 'dose' ? form.dose : null,
      frequency: activeType.value === 'frequency' ? form.frequency : null,
      duration: activeType.value === 'duration' ? form.duration : null,
      instruction: activeType.value === 'instruction' ? form.instruction : null,
      meal_timing: activeType.value === 'meal_timing' ? form.meal_timing : null,
      sort_order: form.sort_order,
      is_active: form.is_active,
    }
    if (editingOption.value) {
      await api.put('/admin/prescription-instruction-options/' + editingOption.value.id, payload)
      toast.success(currentTab.value.label + ' option updated successfully.')
    } else {
      await api.post('/admin/prescription-instruction-options', payload)
      toast.success(currentTab.value.label + ' option created successfully.')
    }
    dialogOpen.value = false
    await loadPageData()
  } catch (error) {
    const response = error.response?.data
    if (response?.errors) {
      fieldErrors.value = Object.fromEntries(Object.entries(response.errors).map(([key, messages]) => [key, messages[0]]))
    } else {
      toast.error(response?.message || 'The prescription option could not be saved.')
    }
  } finally {
    saving.value = false
  }
}

async function deleteOption(option) {
  if (!window.confirm('Delete this ' + currentTab.value.label.toLowerCase() + ' option?')) return
  try {
    await api.delete('/admin/prescription-instruction-options/' + option.id)
    toast.success(currentTab.value.label + ' option deleted successfully.')
    await loadPageData()
  } catch (error) {
    toast.error(error.response?.data?.message || 'The prescription option could not be deleted.')
  }
}

onMounted(loadPageData)
</script>

<style scoped>
.option-tabs { display: flex; gap: 8px; margin: 0 0 18px; padding: 6px; width: fit-content; max-width: 100%; overflow-x: auto; border: 1px solid var(--border); border-radius: 14px; background: #fff; }
.option-tab { display: inline-flex; align-items: center; gap: 9px; white-space: nowrap; border: 0; border-radius: 10px; padding: 10px 14px; color: var(--muted); background: transparent; font: inherit; font-size: 13px; font-weight: 700; cursor: pointer; }
.option-tab-active { color: var(--primary); background: #eef2ff; }
.tab-count { display: inline-flex; min-width: 21px; height: 21px; justify-content: center; align-items: center; padding: 0 6px; border-radius: 99px; color: inherit; background: rgba(99, 102, 241, .12); font-size: 11px; }
.option-card { overflow: hidden; }
.option-table { min-width: 740px; }
.actions-heading { text-align: right; }
.option-value { font-weight: 650; }
.option-total { color: var(--muted); font-size: 12px; }
.option-actions { display: flex; justify-content: flex-end; align-items: center; gap: 6px; }
.danger-action { color: #dc2626; }
.dialog-backdrop { position: fixed; inset: 0; z-index: 100; display: grid; place-items: center; overflow-y: auto; padding: 24px; background: rgba(15, 23, 42, .56); }
.option-dialog { display: flex; flex-direction: column; width: min(560px, 100%); max-height: min(700px, calc(100vh - 48px)); overflow: hidden; }
.option-dialog > form { display: flex; flex: 1; flex-direction: column; min-height: 0; overflow: hidden; }
.dialog-head { display: flex; flex: 0 0 auto; align-items: flex-start; justify-content: space-between; gap: 16px; padding: 22px 24px; border-bottom: 1px solid var(--border); }
.dialog-head h2 { font-size: 19px; }
.dialog-head p { margin-top: 3px; color: var(--muted); font-size: 12.5px; }
.dialog-body { flex: 1; min-height: 0; overflow-y: auto; padding: 22px 24px 8px; }
.dialog-body .field { margin-bottom: 19px; }
.instruction-input { min-height: 98px; resize: vertical; }
.required { color: #dc2626; font-weight: 800; }
.input-invalid { border-color: #dc2626; }
.field-error { display: block; margin-top: 6px; color: #dc2626; font-size: 12px; }
.active-option { display: flex; align-items: center; gap: 9px; margin-bottom: 18px; font-size: 13px; }
.dialog-actions { display: flex; flex: 0 0 auto; justify-content: flex-end; gap: 10px; padding: 17px 24px 22px; border-top: 1px solid var(--border); }
@media (max-width: 600px) { .option-tabs { width: 100%; } .dialog-backdrop { padding: 12px; } .dialog-head, .dialog-body { padding-right: 17px; padding-left: 17px; } .dialog-actions { padding-right: 17px; padding-left: 17px; } }
</style>
