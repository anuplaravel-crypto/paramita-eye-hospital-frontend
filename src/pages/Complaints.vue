<template>
  <section>
    <header class="page-head">
      <div>
        <h1 class="page-title">Complaints</h1>
        <p class="page-sub">Manage the complaint options doctors can select during consultations.</p>
      </div>
      <button class="btn btn-primary" type="button" @click="openDialog()"><Plus :size="17" /> Add Complaint</button>
    </header>

    <div class="toolbar">
      <label class="search-inline">
        <Search :size="17" />
        <input v-model="search" type="search" placeholder="Search complaints..." aria-label="Search complaints" />
      </label>
      <span class="spacer"></span>
      <span class="complaint-total">{{ filteredComplaints.length }} complaints</span>
    </div>

    <div v-if="pageError" class="page-error" role="alert">
      <span>{{ pageError }}</span>
      <button class="btn btn-outline btn-sm" type="button" @click="loadComplaints">Try again</button>
    </div>

    <div class="card complaints-card">
      <div v-if="loading" class="empty" role="status">Loading complaints...</div>
      <div v-else-if="!filteredComplaints.length" class="empty">
        <FileText :size="30" />
        <h4>{{ search ? 'No matching complaints' : 'No complaints found' }}</h4>
        <p>{{ search ? 'Try a different search.' : 'Add complaints to make them available in doctor consultations.' }}</p>
      </div>
      <div v-else class="table-wrap">
        <table class="table complaints-table">
          <thead><tr><th>Complaint</th><th>Description</th><th>Order</th><th>Status</th><th class="actions-heading">Actions</th></tr></thead>
          <tbody>
            <tr v-for="complaint in filteredComplaints" :key="complaint.id">
              <td><strong>{{ complaint.name }}</strong></td>
              <td class="description-cell">{{ complaint.description || '—' }}</td>
              <td>{{ complaint.sort_order }}</td>
              <td><span class="status-pill" :class="complaint.is_active ? 'status-active' : 'status-inactive'">{{ complaint.is_active ? 'Active' : 'Inactive' }}</span></td>
              <td>
                <div class="complaint-actions">
                  <button class="btn btn-outline btn-sm" type="button" @click="openDialog(complaint, 'view')"><Eye :size="15" /> View</button>
                  <button class="btn btn-outline btn-sm" type="button" @click="openDialog(complaint, 'edit')"><Pencil :size="15" /> Edit</button>
                  <button class="icon-btn danger-action" type="button" :aria-label="'Delete ' + complaint.name" @click="deleteComplaint(complaint)"><Trash2 :size="16" /></button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <Teleport to="body">
      <div v-if="dialogOpen" class="dialog-backdrop" @click.self="closeDialog">
        <section class="complaint-dialog card" role="dialog" aria-modal="true" aria-labelledby="complaint-dialog-title">
          <header class="dialog-head">
            <div><h2 id="complaint-dialog-title">{{ dialogTitle }}</h2><p>{{ dialogDescription }}</p></div>
            <button class="icon-btn" type="button" aria-label="Close dialog" :disabled="saving" @click="closeDialog"><X :size="18" /></button>
          </header>
          <form @submit.prevent="saveComplaint">
            <div class="dialog-body">
              <div class="field">
                <label for="complaint-name">Complaint name <span class="required">*</span></label>
                <input id="complaint-name" v-model.trim="form.name" class="input" :class="{ 'input-invalid': fieldErrors.name }" type="text" maxlength="255" :readonly="readOnly" required :aria-invalid="Boolean(fieldErrors.name)" :aria-describedby="fieldErrors.name ? 'complaint-name-error' : undefined" />
                <small v-if="fieldErrors.name" id="complaint-name-error" class="field-error" role="alert">{{ fieldErrors.name }}</small>
              </div>
              <div class="field">
                <label for="complaint-description">Description</label>
                <textarea id="complaint-description" v-model.trim="form.description" class="input" :class="{ 'input-invalid': fieldErrors.description }" rows="3" maxlength="5000" :readonly="readOnly" :aria-invalid="Boolean(fieldErrors.description)" :aria-describedby="fieldErrors.description ? 'complaint-description-error' : undefined"></textarea>
                <small v-if="fieldErrors.description" id="complaint-description-error" class="field-error" role="alert">{{ fieldErrors.description }}</small>
              </div>
              <div class="form-grid complaint-options">
                <div class="field">
                  <label for="complaint-order">Display order</label>
                  <input id="complaint-order" v-model.number="form.sort_order" class="input" :class="{ 'input-invalid': fieldErrors.sort_order }" type="number" min="0" max="65535" :readonly="readOnly" :aria-invalid="Boolean(fieldErrors.sort_order)" :aria-describedby="fieldErrors.sort_order ? 'complaint-order-error' : undefined" />
                  <small v-if="fieldErrors.sort_order" id="complaint-order-error" class="field-error" role="alert">{{ fieldErrors.sort_order }}</small>
                </div>
                <label v-if="editingComplaint && !readOnly" class="active-option"><input v-model="form.is_active" type="checkbox" /> <span>Complaint is active</span></label>
                <div v-if="readOnly" class="field"><span class="field-label">Status</span><span class="status-pill" :class="form.is_active ? 'status-active' : 'status-inactive'">{{ form.is_active ? 'Active' : 'Inactive' }}</span></div>
              </div>
            </div>
            <footer class="dialog-actions">
              <button class="btn btn-outline" type="button" :disabled="saving" @click="closeDialog">{{ readOnly ? 'Close' : 'Cancel' }}</button>
              <button v-if="!readOnly" class="btn btn-primary" type="submit" :disabled="saving">{{ saving ? 'Saving...' : editingComplaint ? 'Save Changes' : 'Create Complaint' }}</button>
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

const complaints = ref([])
const loading = ref(true)
const saving = ref(false)
const pageError = ref('')
const search = ref('')
const dialogOpen = ref(false)
const dialogMode = ref('create')
const editingComplaint = ref(null)
const fieldErrors = ref({})
const form = reactive({ name: '', description: '', sort_order: 0, is_active: true })

const filteredComplaints = computed(() => {
  const query = search.value.trim().toLowerCase()
  return complaints.value.filter((complaint) => [complaint.name, complaint.description].some((value) => String(value || '').toLowerCase().includes(query)))
})
const readOnly = computed(() => dialogMode.value === 'view')
const dialogTitle = computed(() => readOnly.value ? 'View Complaint' : editingComplaint.value ? 'Edit Complaint' : 'Create Complaint')
const dialogDescription = computed(() => readOnly.value ? 'Review this complaint option.' : editingComplaint.value ? 'Update the complaint option doctors can select.' : 'Add a complaint option to the consultation catalog.')

async function loadComplaints() {
  loading.value = true
  pageError.value = ''
  try {
    const response = await api.get('/admin/complaints')
    complaints.value = response.data.data || []
  } catch (error) {
    const status = error.response?.status
    pageError.value = status === 401
      ? 'Your session has expired. Sign in again and reload this page.'
      : status === 403
        ? 'Your account is not authorized to manage complaints.'
        : status
          ? 'Complaints could not be loaded (HTTP ' + status + '). Select Try again.'
          : 'The API did not respond. Check that Laravel is running, then select Try again.'
  } finally {
    loading.value = false
  }
}

function resetForm() {
  Object.assign(form, { name: '', description: '', sort_order: complaints.value.length, is_active: true })
}

async function openDialog(complaint = null, mode = 'create') {
  dialogMode.value = mode
  editingComplaint.value = null
  fieldErrors.value = {}
  resetForm()
  if (complaint) {
    try {
      const response = await api.get('/admin/complaints/' + complaint.id)
      editingComplaint.value = response.data.data
      Object.assign(form, response.data.data)
    } catch {
      toast.error('The complaint could not be loaded.')
      return
    }
  }
  dialogOpen.value = true
}

function closeDialog() {
  if (!saving.value) dialogOpen.value = false
}

async function saveComplaint() {
  fieldErrors.value = {}
  saving.value = true
  try {
    const payload = { name: form.name, description: form.description || null, sort_order: form.sort_order, is_active: form.is_active }
    if (editingComplaint.value) {
      await api.put('/admin/complaints/' + editingComplaint.value.id, payload)
      toast.success('Complaint updated successfully.')
    } else {
      await api.post('/admin/complaints', payload)
      toast.success('Complaint created successfully.')
    }
    dialogOpen.value = false
    await loadComplaints()
  } catch (error) {
    const response = error.response?.data
    if (response?.errors) {
      fieldErrors.value = Object.fromEntries(Object.entries(response.errors).map(([key, messages]) => [key, messages[0]]))
    } else {
      toast.error(response?.message || 'The complaint could not be saved.')
    }
  } finally {
    saving.value = false
  }
}

async function deleteComplaint(complaint) {
  if (!window.confirm('Delete the "' + complaint.name + '" complaint?')) return
  try {
    await api.delete('/admin/complaints/' + complaint.id)
    toast.success('Complaint deleted successfully.')
    await loadComplaints()
  } catch (error) {
    toast.error(error.response?.data?.message || 'The complaint could not be deleted.')
  }
}

onMounted(loadComplaints)
</script>

<style scoped>
.complaints-card { overflow: hidden; }
.complaints-table { min-width: 850px; }
.actions-heading { text-align: right; }
.description-cell { max-width: 420px; color: var(--muted); }
.complaint-total { color: var(--muted); font-size: 12px; }
.complaint-actions { display: flex; justify-content: flex-end; align-items: center; gap: 6px; }
.danger-action { color: #dc2626; }
.dialog-backdrop { position: fixed; inset: 0; z-index: 100; display: grid; place-items: center; overflow-y: auto; padding: 24px; background: rgba(15, 23, 42, .56); }
.complaint-dialog { display: flex; flex-direction: column; width: min(560px, 100%); max-height: min(700px, calc(100vh - 48px)); overflow: hidden; }
.complaint-dialog > form { display: flex; flex: 1; flex-direction: column; min-height: 0; overflow: hidden; }
.dialog-head { display: flex; flex: 0 0 auto; align-items: flex-start; justify-content: space-between; gap: 16px; padding: 20px 22px; border-bottom: 1px solid var(--border); }
.dialog-head h2 { margin: 0; color: var(--text); font-size: 18px; }
.dialog-head p { margin: 5px 0 0; color: var(--muted); font-size: 12px; }
.dialog-head .icon-btn { flex: 0 0 auto; }
.dialog-body { display: grid; flex: 1; gap: 16px; min-height: 0; overflow-y: auto; padding: 20px 22px; }
.complaint-options { align-items: end; }
.active-option { display: flex; align-items: center; gap: 8px; min-height: 42px; color: var(--text); font-size: 13px; }
.dialog-actions { display: flex; flex: 0 0 auto; justify-content: flex-end; gap: 9px; padding: 15px 22px; border-top: 1px solid var(--border); background: white; }
@media (max-width: 640px) { .complaint-options { grid-template-columns: 1fr; } }
</style>
