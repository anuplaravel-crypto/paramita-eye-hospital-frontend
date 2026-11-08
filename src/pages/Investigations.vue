<template>
  <section>
    <header class="page-head">
      <div>
        <h1 class="page-title">Investigations</h1>
        <p class="page-sub">Manage investigation names and prices.</p>
      </div>
      <button class="btn btn-primary" type="button" @click="openDialog()">
        <Plus :size="17" /> Add Investigation
      </button>
    </header>

    <div class="toolbar">
      <label class="search-inline">
        <Search :size="17" />
        <input v-model="search" type="search" placeholder="Search investigations..." aria-label="Search investigations" />
      </label>
      <span class="spacer"></span>
      <span class="investigation-total">{{ filteredInvestigations.length }} investigations</span>
    </div>

    <div v-if="pageError" class="page-error" role="alert">
      <span>{{ pageError }}</span>
      <button class="btn btn-outline btn-sm" type="button" @click="loadInvestigations">Try again</button>
    </div>

    <div class="card investigation-card">
      <div v-if="loading" class="empty" role="status">Loading investigations...</div>
      <div v-else-if="!filteredInvestigations.length" class="empty">
        <FileText :size="30" />
        <h4>{{ search ? 'No matching investigations' : 'No investigations found' }}</h4>
        <p>{{ search ? 'Try a different search.' : 'Add an investigation to start managing the price list.' }}</p>
      </div>
      <div v-else class="table-wrap">
        <table class="table investigation-table">
          <thead>
            <tr>
              <th>Investigation</th>
              <th>Price</th>
              <th>Receipt Usage</th>
              <th class="actions-heading">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="investigation in filteredInvestigations" :key="investigation.id">
              <td>
                <div class="investigation-name">
                  <span class="investigation-icon"><FileText :size="18" /></span>
                  <strong>{{ investigation.name }}</strong>
                </div>
              </td>
              <td class="price-cell">{{ formatPrice(investigation.price) }}</td>
              <td>
                <span class="usage-count">{{ investigation.receipt_items_count || 0 }}</span>
                <span class="muted"> receipt items</span>
              </td>
              <td>
                <div class="investigation-actions">
                  <button class="btn btn-outline btn-sm" type="button" @click="openDialog(investigation, 'view')">
                    <Eye :size="15" /> View
                  </button>
                  <button class="btn btn-outline btn-sm" type="button" @click="openDialog(investigation, 'edit')">
                    <Pencil :size="15" /> Edit
                  </button>
                  <button
                    class="icon-btn danger-action"
                    type="button"
                    title="Delete investigation"
                    :aria-label="'Delete ' + investigation.name"
                    :disabled="investigation.receipt_items_count > 0"
                    @click="deleteInvestigation(investigation)"
                  >
                    <Trash2 :size="16" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <Teleport to="body">
      <div v-if="dialogOpen" class="dialog-backdrop" @click.self="closeDialog">
        <section class="investigation-dialog card" role="dialog" aria-modal="true" aria-labelledby="investigation-dialog-title">
          <header class="dialog-head">
            <div>
              <h2 id="investigation-dialog-title">{{ dialogTitle }}</h2>
              <p>{{ dialogDescription }}</p>
            </div>
            <button class="icon-btn" type="button" aria-label="Close dialog" @click="closeDialog">
              <X :size="18" />
            </button>
          </header>

          <form @submit.prevent="saveInvestigation">
            <div class="dialog-body">
              <div class="field">
                <label for="investigation-name">Investigation name <span class="required">*</span></label>
                <input
                  id="investigation-name"
                  v-model.trim="form.name"
                  class="input"
                  :class="{ 'input-invalid': fieldErrors.name }"
                  type="text"
                  maxlength="255"
                  :readonly="readOnly"
                  :aria-invalid="Boolean(fieldErrors.name)"
                  :aria-describedby="fieldErrors.name ? 'investigation-name-error' : undefined"
                />
                <small v-if="fieldErrors.name" id="investigation-name-error" class="field-error">{{ fieldErrors.name }}</small>
              </div>

              <div class="field">
                <label for="investigation-price">Price (BDT) <span class="required">*</span></label>
                <input
                  id="investigation-price"
                  v-model="form.price"
                  class="input"
                  :class="{ 'input-invalid': fieldErrors.price }"
                  type="number"
                  min="0.01"
                  max="99999999.99"
                  step="0.01"
                  inputmode="decimal"
                  :readonly="readOnly"
                  :aria-invalid="Boolean(fieldErrors.price)"
                  :aria-describedby="fieldErrors.price ? 'investigation-price-error' : undefined"
                />
                <small v-if="fieldErrors.price" id="investigation-price-error" class="field-error">{{ fieldErrors.price }}</small>
              </div>
            </div>

            <footer class="dialog-actions">
              <button class="btn btn-outline" type="button" :disabled="saving" @click="closeDialog">
                {{ readOnly ? 'Close' : 'Cancel' }}
              </button>
              <button v-if="!readOnly" class="btn btn-primary" type="submit" :disabled="saving">
                {{ saving ? 'Saving...' : editingInvestigation ? 'Save Changes' : 'Create Investigation' }}
              </button>
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
import { Eye, FileText, Pencil, Plus, Search, Trash2, X } from '@lucide/vue'
import api from '../api/axios'

const investigations = ref([])
const loading = ref(true)
const saving = ref(false)
const pageError = ref('')
const search = ref('')
const dialogOpen = ref(false)
const dialogMode = ref('create')
const editingInvestigation = ref(null)
const fieldErrors = ref({})
const form = reactive({ name: '', price: '' })

const filteredInvestigations = computed(() => {
  const query = search.value.trim().toLowerCase()
  return investigations.value.filter((investigation) => investigation.name.toLowerCase().includes(query))
})

const readOnly = computed(() => dialogMode.value === 'view')
const dialogTitle = computed(() => {
  if (readOnly.value) return 'View Investigation'
  return editingInvestigation.value ? 'Edit Investigation' : 'Create Investigation'
})
const dialogDescription = computed(() => {
  if (readOnly.value) return 'Review the investigation name and price.'
  return editingInvestigation.value ? 'Update the investigation name or price.' : 'Enter the investigation name and price.'
})

function formatPrice(price) {
  return new Intl.NumberFormat('en-BD', {
    style: 'currency',
    currency: 'BDT',
    minimumFractionDigits: 2,
  }).format(Number(price))
}

async function loadInvestigations() {
  loading.value = true
  pageError.value = ''
  try {
    const response = await api.get('/admin/investigations')
    investigations.value = response.data.data
  } catch (error) {
    const status = error.response?.status
    pageError.value = status === 401
      ? 'Your session has expired. Sign in again and reload this page.'
      : status === 403
        ? 'Your account is not authorized to manage investigations.'
        : status
          ? 'Investigations could not be loaded (HTTP ' + status + '). Select Try again.'
          : 'The API did not respond. Check that Laravel is running, then select Try again.'
  } finally {
    loading.value = false
  }
}

function resetForm() {
  form.name = ''
  form.price = ''
}

async function openDialog(investigation = null, mode = 'create') {
  dialogMode.value = mode
  editingInvestigation.value = null
  fieldErrors.value = {}
  resetForm()

  if (investigation) {
    try {
      const response = await api.get('/admin/investigations/' + investigation.id)
      editingInvestigation.value = response.data.data
      form.name = response.data.data.name
      form.price = response.data.data.price
    } catch {
      toast.error('The investigation could not be loaded.')
      return
    }
  }

  dialogOpen.value = true
}

function closeDialog() {
  if (saving.value) return
  dialogOpen.value = false
}

async function saveInvestigation() {
  fieldErrors.value = {}
  saving.value = true

  try {
    const payload = { name: form.name, price: form.price }
    if (editingInvestigation.value) {
      await api.put('/admin/investigations/' + editingInvestigation.value.id, payload)
      toast.success('Investigation updated successfully.')
    } else {
      await api.post('/admin/investigations', payload)
      toast.success('Investigation created successfully.')
    }

    dialogOpen.value = false
    await loadInvestigations()
  } catch (error) {
    const response = error.response?.data
    if (response?.errors) {
      fieldErrors.value = Object.fromEntries(
        Object.entries(response.errors).map(([key, messages]) => [key, messages[0]])
      )
      if (fieldErrors.value.investigation) toast.error(fieldErrors.value.investigation)
    } else {
      toast.error(response?.message || 'The investigation could not be saved.')
    }
  } finally {
    saving.value = false
  }
}

async function deleteInvestigation(investigation) {
  if (!window.confirm('Delete the "' + investigation.name + '" investigation?')) return

  try {
    await api.delete('/admin/investigations/' + investigation.id)
    toast.success('Investigation deleted successfully.')
    await loadInvestigations()
  } catch (error) {
    toast.error(
      error.response?.data?.errors?.investigation?.[0]
      || error.response?.data?.message
      || 'The investigation could not be deleted.'
    )
  }
}

onMounted(loadInvestigations)
</script>

<style scoped>
.investigation-card { overflow: hidden; }
.investigation-table { min-width: 720px; }
.actions-heading { text-align: right; }
.investigation-name { display: flex; align-items: center; gap: 11px; }
.investigation-name strong { text-transform: capitalize; }
.investigation-icon { display: grid; place-items: center; width: 38px; height: 38px; border-radius: 12px; color: var(--primary); background: #eef2ff; }
.price-cell { font-weight: 700; white-space: nowrap; }
.usage-count { display: inline-flex; min-width: 28px; justify-content: center; padding: 3px 8px; border-radius: 99px; background: #f1f5f9; font-weight: 700; }
.muted, .investigation-total { color: var(--muted); font-size: 12px; }
.investigation-actions { display: flex; justify-content: flex-end; align-items: center; gap: 6px; }
.investigation-actions .icon-btn:disabled { opacity: 0.35; cursor: not-allowed; transform: none; }
.danger-action { color: #dc2626; }
.danger-action:hover { background: #fef2f2; color: #b91c1c; }
.dialog-backdrop { position: fixed; inset: 0; z-index: 100; display: grid; place-items: center; overflow-y: auto; padding: 24px; background: rgba(15, 23, 42, 0.56); }
.investigation-dialog { display: flex; flex-direction: column; width: min(560px, 100%); max-height: min(700px, calc(100vh - 48px)); overflow: hidden; }
.investigation-dialog > form { display: flex; flex: 1; flex-direction: column; min-height: 0; overflow: hidden; }
.dialog-head { display: flex; flex: 0 0 auto; align-items: flex-start; justify-content: space-between; gap: 16px; padding: 22px 24px; border-bottom: 1px solid var(--border); }
.dialog-head h2 { font-size: 19px; }
.dialog-head p { margin-top: 3px; color: var(--muted); font-size: 12.5px; }
.dialog-body { flex: 1; min-height: 0; overflow-y: auto; padding: 22px 24px 8px; }
.dialog-body .field { margin-bottom: 20px; }
.required { color: #dc2626; font-weight: 800; }
.input-invalid { border-color: #dc2626; }
.input-invalid:focus { box-shadow: 0 0 0 4px rgba(220, 38, 38, 0.12); }
.field-error { display: block; margin-top: 6px; color: #dc2626; font-size: 12px; }
.dialog-actions { display: flex; flex: 0 0 auto; justify-content: flex-end; gap: 10px; padding: 17px 24px 22px; border-top: 1px solid var(--border); }
.dialog-actions button:disabled { opacity: 0.65; cursor: wait; }
@media (max-width: 600px) {
  .dialog-backdrop { padding: 12px; }
  .dialog-head, .dialog-body { padding-right: 17px; padding-left: 17px; }
  .dialog-actions { padding-right: 17px; padding-left: 17px; }
}
</style>
