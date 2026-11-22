<template>
  <section>
    <header class="page-head">
      <div>
        <h1 class="page-title">Dosages</h1>
        <p class="page-sub">Manage dosage forms available in the medicine catalog.</p>
      </div>
      <button class="btn btn-primary" type="button" @click="openDialog()"><Plus :size="17" /> Add Dosage</button>
    </header>

    <div class="toolbar">
      <label class="search-inline">
        <Search :size="17" />
        <input v-model="search" type="search" placeholder="Search dosage forms..." aria-label="Search dosage forms" />
      </label>
      <span class="spacer"></span>
      <span class="dosage-total">{{ filteredDosages.length }} dosage forms</span>
    </div>

    <div v-if="pageError" class="page-error" role="alert">
      <span>{{ pageError }}</span>
      <button class="btn btn-outline btn-sm" type="button" @click="loadDosages">Try again</button>
    </div>

    <div class="card dosage-card">
      <div v-if="loading" class="empty" role="status">Loading dosage forms...</div>
      <div v-else-if="!filteredDosages.length" class="empty">
        <Pill :size="30" />
        <h4>{{ search ? 'No matching dosage forms' : 'No dosage forms found' }}</h4>
        <p>{{ search ? 'Try a different search.' : 'Add a dosage form to use it when creating medicines.' }}</p>
      </div>
      <div v-else class="table-wrap">
        <table class="table dosage-table">
          <thead>
            <tr><th>Dosage form</th><th>Medicine usage</th><th>Status</th><th class="actions-heading">Actions</th></tr>
          </thead>
          <tbody>
            <tr v-for="dosage in filteredDosages" :key="dosage.id">
              <td><div class="dosage-name"><span class="dosage-icon"><Pill :size="18" /></span><strong>{{ dosage.name }}</strong></div></td>
              <td><span class="usage-count">{{ dosage.medicines_count || 0 }}</span><span class="muted"> medicines</span></td>
              <td><span class="status-pill" :class="dosage.is_active ? 'status-active' : 'status-inactive'">{{ dosage.is_active ? 'Active' : 'Inactive' }}</span></td>
              <td>
                <div class="dosage-actions">
                  <button class="btn btn-outline btn-sm" type="button" @click="openDialog(dosage, 'view')"><Eye :size="15" /> View</button>
                  <button class="btn btn-outline btn-sm" type="button" @click="openDialog(dosage, 'edit')"><Pencil :size="15" /> Edit</button>
                  <button class="icon-btn danger-action" type="button" :title="dosage.medicines_count ? 'Dosage forms used by medicines cannot be deleted' : 'Delete dosage form'" :aria-label="'Delete ' + dosage.name" :disabled="dosage.medicines_count > 0" @click="deleteDosage(dosage)"><Trash2 :size="16" /></button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <Teleport to="body">
      <div v-if="dialogOpen" class="dialog-backdrop" @click.self="closeDialog">
        <section class="dosage-dialog card" role="dialog" aria-modal="true" aria-labelledby="dosage-dialog-title">
          <header class="dialog-head">
            <div><h2 id="dosage-dialog-title">{{ dialogTitle }}</h2><p>{{ dialogDescription }}</p></div>
            <button class="icon-btn" type="button" aria-label="Close dialog" :disabled="saving" @click="closeDialog"><X :size="18" /></button>
          </header>
          <form @submit.prevent="saveDosage">
            <div class="dialog-body">
              <div class="field">
                <label for="dosage-name">Dosage form name <span class="required">*</span></label>
                <input id="dosage-name" v-model.trim="form.name" class="input" :class="{ 'input-invalid': fieldErrors.name }" type="text" maxlength="40" :readonly="readOnly || Boolean(form.medicines_count)" required :aria-invalid="Boolean(fieldErrors.name)" :aria-describedby="fieldErrors.name ? 'dosage-name-error' : undefined" />
                <small v-if="fieldErrors.name" id="dosage-name-error" class="field-error" role="alert">{{ fieldErrors.name }}</small>
              </div>
              <div v-if="!readOnly" class="field">
                <label for="dosage-order">Display order</label>
                <input id="dosage-order" v-model.number="form.sort_order" class="input" :class="{ 'input-invalid': fieldErrors.sort_order }" type="number" min="0" max="65535" :aria-invalid="Boolean(fieldErrors.sort_order)" :aria-describedby="fieldErrors.sort_order ? 'dosage-order-error' : undefined" />
                <small v-if="fieldErrors.sort_order" id="dosage-order-error" class="field-error" role="alert">{{ fieldErrors.sort_order }}</small>
              </div>
              <label v-if="editingDosage && !readOnly" class="active-option"><input v-model="form.is_active" type="checkbox" /> <span>Dosage form is active</span></label>
              <div v-if="readOnly" class="field"><span class="field-label">Status</span><span class="status-pill" :class="form.is_active ? 'status-active' : 'status-inactive'">{{ form.is_active ? 'Active' : 'Inactive' }}</span></div>
              <p v-if="editingDosage && form.medicines_count" class="usage-note">Used by {{ form.medicines_count }} medicine(s). Deletion is disabled while in use.</p>
            </div>
            <footer class="dialog-actions">
              <button class="btn btn-outline" type="button" :disabled="saving" @click="closeDialog">{{ readOnly ? 'Close' : 'Cancel' }}</button>
              <button v-if="!readOnly" class="btn btn-primary" type="submit" :disabled="saving">{{ saving ? 'Saving...' : editingDosage ? 'Save Changes' : 'Create Dosage' }}</button>
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
import { Eye, Pencil, Pill, Plus, Search, Trash2, X } from '@lucide/vue'
import api from '../api/axios'

const dosages = ref([])
const loading = ref(true)
const saving = ref(false)
const pageError = ref('')
const search = ref('')
const dialogOpen = ref(false)
const dialogMode = ref('create')
const editingDosage = ref(null)
const fieldErrors = ref({})
const form = reactive({ name: '', sort_order: 0, is_active: true, medicines_count: 0 })

const filteredDosages = computed(() => {
  const query = search.value.trim().toLowerCase()
  return dosages.value.filter((dosage) => String(dosage.name || '').toLowerCase().includes(query))
})
const readOnly = computed(() => dialogMode.value === 'view')
const dialogTitle = computed(() => readOnly.value ? 'View Dosage' : editingDosage.value ? 'Edit Dosage' : 'Create Dosage')
const dialogDescription = computed(() => readOnly.value ? 'Review this dosage form.' : editingDosage.value ? 'Update the dosage form available in the medicine catalog.' : 'Add a dosage form to the medicine catalog.')

async function loadDosages() {
  loading.value = true
  pageError.value = ''
  try {
    const response = await api.get('/admin/dosages')
    dosages.value = response.data.data || []
  } catch (error) {
    const status = error.response?.status
    pageError.value = status === 401
      ? 'Your session has expired. Sign in again and reload this page.'
      : status === 403
        ? 'Your account is not authorized to manage dosage forms.'
        : status
          ? 'Dosage forms could not be loaded (HTTP ' + status + '). Select Try again.'
          : 'The API did not respond. Check that Laravel is running, then select Try again.'
  } finally {
    loading.value = false
  }
}

function resetForm() {
  Object.assign(form, { name: '', sort_order: dosages.value.length, is_active: true, medicines_count: 0 })
}

async function openDialog(dosage = null, mode = 'create') {
  dialogMode.value = mode
  editingDosage.value = null
  fieldErrors.value = {}
  resetForm()

  if (dosage) {
    try {
      const response = await api.get('/admin/dosages/' + dosage.id)
      editingDosage.value = response.data.data
      Object.assign(form, response.data.data)
    } catch {
      toast.error('The dosage form could not be loaded.')
      return
    }
  }

  dialogOpen.value = true
}

function closeDialog() {
  if (!saving.value) dialogOpen.value = false
}

async function saveDosage() {
  fieldErrors.value = {}
  saving.value = true
  try {
    const payload = { name: form.name, sort_order: form.sort_order, is_active: form.is_active }
    if (editingDosage.value) {
      await api.put('/admin/dosages/' + editingDosage.value.id, payload)
      toast.success('Dosage form updated successfully.')
    } else {
      await api.post('/admin/dosages', payload)
      toast.success('Dosage form created successfully.')
    }
    dialogOpen.value = false
    await loadDosages()
  } catch (error) {
    const response = error.response?.data
    if (response?.errors) {
      fieldErrors.value = Object.fromEntries(Object.entries(response.errors).map(([key, messages]) => [key, messages[0]]))
    } else {
      toast.error(response?.message || 'The dosage form could not be saved.')
    }
  } finally {
    saving.value = false
  }
}

async function deleteDosage(dosage) {
  if (dosage.medicines_count) return
  if (!window.confirm('Delete the "' + dosage.name + '" dosage form?')) return
  try {
    await api.delete('/admin/dosages/' + dosage.id)
    toast.success('Dosage form deleted successfully.')
    await loadDosages()
  } catch (error) {
    toast.error(error.response?.data?.errors?.dosage?.[0] || error.response?.data?.message || 'The dosage form could not be deleted.')
  }
}

onMounted(loadDosages)
</script>

<style scoped>
.dosage-card { overflow: hidden; }
.dosage-table { min-width: 720px; }
.actions-heading { text-align: right; }
.dosage-name { display: flex; align-items: center; gap: 11px; }
.dosage-icon { display: grid; place-items: center; width: 38px; height: 38px; border-radius: 12px; color: var(--primary); background: #eef2ff; }
.usage-count { display: inline-flex; min-width: 28px; justify-content: center; padding: 3px 8px; border-radius: 99px; background: #f1f5f9; font-weight: 700; }
.muted, .dosage-total { color: var(--muted); font-size: 12px; }
.dosage-actions { display: flex; justify-content: flex-end; align-items: center; gap: 6px; }
.danger-action { color: #dc2626; }
.danger-action:disabled { opacity: .35; cursor: not-allowed; }
.dialog-backdrop { position: fixed; inset: 0; z-index: 100; display: grid; place-items: center; overflow-y: auto; padding: 24px; background: rgba(15, 23, 42, .56); }
.dosage-dialog { display: flex; flex-direction: column; width: min(560px, 100%); max-height: min(700px, calc(100vh - 48px)); overflow: hidden; }
.dosage-dialog > form { display: flex; flex: 1; flex-direction: column; min-height: 0; overflow: hidden; }
.dialog-head { display: flex; flex: 0 0 auto; align-items: flex-start; justify-content: space-between; gap: 16px; padding: 22px 24px; border-bottom: 1px solid var(--border); }
.dialog-head h2 { font-size: 19px; }
.dialog-head p { margin-top: 3px; color: var(--muted); font-size: 12.5px; }
.dialog-body { flex: 1; min-height: 0; overflow-y: auto; padding: 22px 24px 8px; }
.dialog-body .field { margin-bottom: 20px; }
.required { color: #dc2626; font-weight: 800; }
.input-invalid { border-color: #dc2626; }
.field-error { display: block; margin-top: 6px; color: #dc2626; font-size: 12px; }
.active-option { display: flex; align-items: center; gap: 9px; margin-bottom: 18px; font-size: 13px; }
.usage-note { color: var(--muted); font-size: 12px; }
.dialog-actions { display: flex; flex: 0 0 auto; justify-content: flex-end; gap: 10px; padding: 17px 24px 22px; border-top: 1px solid var(--border); }
@media (max-width: 600px) { .dialog-backdrop { padding: 12px; } .dialog-head, .dialog-body { padding-right: 17px; padding-left: 17px; } .dialog-actions { padding-right: 17px; padding-left: 17px; } }
</style>
