<template>
  <section>
    <header class="page-head">
      <div>
        <h1 class="page-title">Print Header Settings</h1>
        <p class="page-sub">Manage the letterhead used on consultation and investigation printouts.</p>
      </div>
      <button class="btn btn-primary" type="button" :disabled="availableTypes.length === 0" @click="openDialog()">
        <Plus :size="17" /> Add Print Header
      </button>
    </header>

    <div class="print-header-toolbar">
      <span>{{ settings.length }} of 2 print headers configured</span>
      <span class="muted">Each print type can have one header configuration.</span>
    </div>

    <div v-if="pageError" class="page-error" role="alert">
      <span>{{ pageError }}</span>
      <button class="btn btn-outline btn-sm" type="button" @click="loadSettings">Try again</button>
    </div>

    <div class="card print-header-card">
      <div v-if="loading" class="empty" role="status">Loading print header settings...</div>
      <div v-else-if="!settings.length" class="empty">
        <FileText :size="30" />
        <h4>No print headers configured</h4>
        <p>Add a header to make it available on doctor printouts.</p>
      </div>
      <div v-else class="table-wrap">
        <table class="table print-header-table">
          <thead><tr><th>Print type</th><th>Hospital heading</th><th>Contact</th><th>Status</th><th class="actions-heading">Actions</th></tr></thead>
          <tbody>
            <tr v-for="setting in settings" :key="setting.id">
              <td><strong>{{ typeLabel(setting.document_type) }}</strong></td>
              <td>{{ setting.center_title_en || setting.center_title_bn || 'Not set' }}</td>
              <td>{{ setting.contact_phone || 'Not set' }}</td>
              <td><span class="status-pill" :class="setting.is_active ? 'status-active' : 'status-inactive'">{{ setting.is_active ? 'Active' : 'Inactive' }}</span></td>
              <td>
                <div class="print-header-actions">
                  <button class="btn btn-outline btn-sm" type="button" @click="openDialog(setting, 'view')"><Eye :size="15" /> View</button>
                  <button class="btn btn-outline btn-sm" type="button" @click="openDialog(setting, 'edit')"><Pencil :size="15" /> Edit</button>
                  <button class="icon-btn danger-action" type="button" :aria-label="'Delete ' + typeLabel(setting.document_type) + ' header'" title="Delete print header" @click="deleteSetting(setting)"><Trash2 :size="16" /></button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <Teleport to="body">
      <div v-if="dialogOpen" class="dialog-backdrop" @click.self="closeDialog">
        <section class="print-header-dialog card" role="dialog" aria-modal="true" aria-labelledby="print-header-dialog-title">
          <header class="dialog-head">
            <div><h2 id="print-header-dialog-title">{{ dialogTitle }}</h2><p>{{ dialogDescription }}</p></div>
            <button class="icon-btn" type="button" aria-label="Close dialog" :disabled="saving" @click="closeDialog"><X :size="18" /></button>
          </header>
          <form @submit.prevent="saveSetting">
            <div class="dialog-body">
              <div class="print-header-fields">
                <div class="field field-wide">
                  <label for="print-document-type">Print type <span class="required">*</span></label>
                  <select id="print-document-type" v-model="form.document_type" class="input" :class="{ 'input-invalid': fieldErrors.document_type }" :disabled="readOnly || Boolean(editingSetting)" required :aria-invalid="Boolean(fieldErrors.document_type)" aria-describedby="print-document-type-error">
                    <option value="">Select print type</option>
                    <option v-for="type in availableTypesForForm" :key="type.value" :value="type.value">{{ type.label }}</option>
                  </select>
                  <small v-if="fieldErrors.document_type" id="print-document-type-error" class="field-error" role="alert">{{ fieldErrors.document_type }}</small>
                </div>

                <h3 class="form-section-title">Left column</h3>
                <div class="field"><label for="left-title-bn">Title (Bangla)</label><input id="left-title-bn" v-model.trim="form.left_title_bn" class="input" :class="{ 'input-invalid': fieldErrors.left_title_bn }" maxlength="150" :readonly="readOnly" :aria-invalid="Boolean(fieldErrors.left_title_bn)" aria-describedby="left-title-bn-error" /><small v-if="fieldErrors.left_title_bn" id="left-title-bn-error" class="field-error" role="alert">{{ fieldErrors.left_title_bn }}</small></div>
                <div class="field"><label for="left-subtitle-bn">Subtitle (Bangla)</label><input id="left-subtitle-bn" v-model.trim="form.left_subtitle_bn" class="input" :class="{ 'input-invalid': fieldErrors.left_subtitle_bn }" maxlength="150" :readonly="readOnly" :aria-invalid="Boolean(fieldErrors.left_subtitle_bn)" aria-describedby="left-subtitle-bn-error" /><small v-if="fieldErrors.left_subtitle_bn" id="left-subtitle-bn-error" class="field-error" role="alert">{{ fieldErrors.left_subtitle_bn }}</small></div>
                <div class="field field-wide"><label for="left-details-bn">Details (one line per item)</label><textarea id="left-details-bn" v-model="form.left_details_bn_text" class="input details-input" :class="{ 'input-invalid': fieldErrors.left_details_bn }" rows="3" :readonly="readOnly" :aria-invalid="Boolean(fieldErrors.left_details_bn)" aria-describedby="left-details-bn-error"></textarea><small v-if="fieldErrors.left_details_bn" id="left-details-bn-error" class="field-error" role="alert">{{ fieldErrors.left_details_bn }}</small></div>

                <h3 class="form-section-title">Center column</h3>
                <div class="field"><label for="center-title-bn">Hospital title (Bangla) <span v-if="form.document_type === 'consultation_prescription' && !readOnly" class="required">*</span></label><input id="center-title-bn" v-model.trim="form.center_title_bn" class="input" :class="{ 'input-invalid': fieldErrors.center_title_bn }" maxlength="180" :readonly="readOnly" :required="form.document_type === 'consultation_prescription' && !readOnly" :aria-invalid="Boolean(fieldErrors.center_title_bn)" :aria-describedby="fieldErrors.center_title_bn ? 'center-title-bn-error' : undefined" /><small v-if="fieldErrors.center_title_bn" id="center-title-bn-error" class="field-error" role="alert">{{ fieldErrors.center_title_bn }}</small></div>
                <div class="field"><label for="center-title-en">Hospital title (English) <span v-if="form.document_type === 'investigation' && !readOnly" class="required">*</span></label><input id="center-title-en" v-model.trim="form.center_title_en" class="input" :class="{ 'input-invalid': fieldErrors.center_title_en }" maxlength="180" :readonly="readOnly" :required="form.document_type === 'investigation' && !readOnly" :aria-invalid="Boolean(fieldErrors.center_title_en)" :aria-describedby="fieldErrors.center_title_en ? 'center-title-en-error' : undefined" /><small v-if="fieldErrors.center_title_en" id="center-title-en-error" class="field-error" role="alert">{{ fieldErrors.center_title_en }}</small></div>
                <div class="field"><label for="center-subtitle-bn">Center subtitle</label><input id="center-subtitle-bn" v-model.trim="form.center_subtitle_bn" class="input" :class="{ 'input-invalid': fieldErrors.center_subtitle_bn }" maxlength="180" :readonly="readOnly" :aria-invalid="Boolean(fieldErrors.center_subtitle_bn)" aria-describedby="center-subtitle-bn-error" /><small v-if="fieldErrors.center_subtitle_bn" id="center-subtitle-bn-error" class="field-error" role="alert">{{ fieldErrors.center_subtitle_bn }}</small></div>
                <div class="field"><label for="registration-no">Registration number</label><input id="registration-no" v-model.trim="form.registration_no" class="input" :class="{ 'input-invalid': fieldErrors.registration_no }" maxlength="80" :readonly="readOnly" :aria-invalid="Boolean(fieldErrors.registration_no)" aria-describedby="registration-no-error" /><small v-if="fieldErrors.registration_no" id="registration-no-error" class="field-error" role="alert">{{ fieldErrors.registration_no }}</small></div>
                <div class="field field-wide"><label for="address-bn">Address</label><textarea id="address-bn" v-model.trim="form.address_bn" class="input details-input" :class="{ 'input-invalid': fieldErrors.address_bn }" rows="2" maxlength="1000" :readonly="readOnly" :aria-invalid="Boolean(fieldErrors.address_bn)" aria-describedby="address-bn-error"></textarea><small v-if="fieldErrors.address_bn" id="address-bn-error" class="field-error" role="alert">{{ fieldErrors.address_bn }}</small></div>
                <div class="field field-wide"><label for="opening-hours-bn">Opening hours (one line per item)</label><textarea id="opening-hours-bn" v-model="form.opening_hours_bn_text" class="input details-input" :class="{ 'input-invalid': fieldErrors.opening_hours_bn }" rows="2" :readonly="readOnly" :aria-invalid="Boolean(fieldErrors.opening_hours_bn)" aria-describedby="opening-hours-bn-error"></textarea><small v-if="fieldErrors.opening_hours_bn" id="opening-hours-bn-error" class="field-error" role="alert">{{ fieldErrors.opening_hours_bn }}</small></div>

                <h3 class="form-section-title">Right column</h3>
                <div class="field"><label for="right-title-en">Title (English)</label><input id="right-title-en" v-model.trim="form.right_title_en" class="input" :class="{ 'input-invalid': fieldErrors.right_title_en }" maxlength="180" :readonly="readOnly" :aria-invalid="Boolean(fieldErrors.right_title_en)" aria-describedby="right-title-en-error" /><small v-if="fieldErrors.right_title_en" id="right-title-en-error" class="field-error" role="alert">{{ fieldErrors.right_title_en }}</small></div>
                <div class="field"><label for="right-subtitle-en">Subtitle (English)</label><input id="right-subtitle-en" v-model.trim="form.right_subtitle_en" class="input" :class="{ 'input-invalid': fieldErrors.right_subtitle_en }" maxlength="180" :readonly="readOnly" :aria-invalid="Boolean(fieldErrors.right_subtitle_en)" aria-describedby="right-subtitle-en-error" /><small v-if="fieldErrors.right_subtitle_en" id="right-subtitle-en-error" class="field-error" role="alert">{{ fieldErrors.right_subtitle_en }}</small></div>
                <div class="field field-wide"><label for="right-details-en">Details (one line per item)</label><textarea id="right-details-en" v-model="form.right_details_en_text" class="input details-input" :class="{ 'input-invalid': fieldErrors.right_details_en }" rows="3" :readonly="readOnly" :aria-invalid="Boolean(fieldErrors.right_details_en)" aria-describedby="right-details-en-error"></textarea><small v-if="fieldErrors.right_details_en" id="right-details-en-error" class="field-error" role="alert">{{ fieldErrors.right_details_en }}</small></div>

                <h3 class="form-section-title">Contact and appearance</h3>
                <div class="field"><label for="contact-phone">Contact phone</label><input id="contact-phone" v-model.trim="form.contact_phone" class="input" :class="{ 'input-invalid': fieldErrors.contact_phone }" maxlength="30" :readonly="readOnly" :aria-invalid="Boolean(fieldErrors.contact_phone)" aria-describedby="contact-phone-error" /><small v-if="fieldErrors.contact_phone" id="contact-phone-error" class="field-error" role="alert">{{ fieldErrors.contact_phone }}</small></div>
                <div class="field"><label for="contact-email">Email</label><input id="contact-email" v-model.trim="form.email" class="input" type="email" maxlength="255" :readonly="readOnly" :class="{ 'input-invalid': fieldErrors.email }" :aria-invalid="Boolean(fieldErrors.email)" aria-describedby="contact-email-error" /><small v-if="fieldErrors.email" id="contact-email-error" class="field-error" role="alert">{{ fieldErrors.email }}</small></div>
                <div class="field"><label for="logo-path">Logo image URL</label><input id="logo-path" v-model.trim="form.logo_path" class="input" :class="{ 'input-invalid': fieldErrors.logo_path }" maxlength="2048" :readonly="readOnly" :aria-invalid="Boolean(fieldErrors.logo_path)" aria-describedby="logo-path-error" /><small v-if="fieldErrors.logo_path" id="logo-path-error" class="field-error" role="alert">{{ fieldErrors.logo_path }}</small></div>
                <div class="field"><label for="accent-color">Accent color</label><div class="color-field"><input id="accent-color" v-model.trim="form.accent_color" class="input" :class="{ 'input-invalid': fieldErrors.accent_color }" maxlength="7" :readonly="readOnly" :aria-invalid="Boolean(fieldErrors.accent_color)" aria-describedby="accent-color-error" /><input v-if="!readOnly" v-model="form.accent_color" type="color" aria-label="Choose accent color" /></div><small v-if="fieldErrors.accent_color" id="accent-color-error" class="field-error" role="alert">{{ fieldErrors.accent_color }}</small></div>
              </div>
              <label v-if="editingSetting && !readOnly" class="active-option"><input v-model="form.is_active" type="checkbox" /><span>Print header is active</span></label>
              <div v-if="readOnly" class="field status-field"><span class="field-label">Status</span><span class="status-pill" :class="form.is_active ? 'status-active' : 'status-inactive'">{{ form.is_active ? 'Active' : 'Inactive' }}</span></div>
            </div>
            <footer class="dialog-actions">
              <button class="btn btn-outline" type="button" :disabled="saving" @click="closeDialog">{{ readOnly ? 'Close' : 'Cancel' }}</button>
              <button v-if="!readOnly" class="btn btn-primary" type="submit" :disabled="saving || !form.document_type">{{ saving ? 'Saving...' : editingSetting ? 'Save Changes' : 'Create Print Header' }}</button>
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
import { Eye, FileText, Pencil, Plus, Trash2, X } from '@lucide/vue'
import api from '../api/axios'

const documentTypes = [
  { value: 'consultation_prescription', label: 'Consultation & Prescription' },
  { value: 'investigation', label: 'Investigation' },
]
const settings = ref([])
const loading = ref(true)
const saving = ref(false)
const pageError = ref('')
const dialogOpen = ref(false)
const dialogMode = ref('create')
const editingSetting = ref(null)
const fieldErrors = ref({})
const blankForm = () => ({
  document_type: '', left_title_bn: '', left_subtitle_bn: '', left_details_bn_text: '',
  center_title_bn: '', center_title_en: '', center_subtitle_bn: '', registration_no: '', address_bn: '', opening_hours_bn_text: '',
  right_title_en: '', right_subtitle_en: '', right_details_en_text: '', contact_phone: '', email: '', logo_path: '', accent_color: '#287048', is_active: true,
})
const form = reactive(blankForm())
const readOnly = computed(() => dialogMode.value === 'view')
const availableTypes = computed(() => documentTypes.filter((type) => !settings.value.some((setting) => setting.document_type === type.value)))
const availableTypesForForm = computed(() => editingSetting.value ? documentTypes : availableTypes.value)
const dialogTitle = computed(() => readOnly.value ? 'View Print Header' : editingSetting.value ? 'Edit Print Header' : 'Create Print Header')
const dialogDescription = computed(() => readOnly.value ? 'Review this print header configuration.' : editingSetting.value ? 'Update the letterhead content used on printouts.' : 'Add a letterhead configuration for a print type.')

function typeLabel(type) {
  return documentTypes.find((item) => item.value === type)?.label || type
}

function lines(value) {
  return (Array.isArray(value) ? value : []).join('\n')
}

function linesToArray(value) {
  return value.split(/\r?\n/).map((line) => line.trim()).filter(Boolean)
}

async function loadSettings() {
  loading.value = true
  pageError.value = ''
  try {
    const response = await api.get('/admin/print-header-settings')
    settings.value = response.data.data || []
  } catch (error) {
    const status = error.response?.status
    pageError.value = status === 401
      ? 'Your session has expired. Sign in again and reload this page.'
      : status === 403
        ? 'Your account is not authorized to manage print headers.'
        : status
          ? 'Print header settings could not be loaded (HTTP ' + status + '). Select Try again.'
          : 'The API did not respond. Check that Laravel is running, then select Try again.'
  } finally {
    loading.value = false
  }
}

function resetForm() {
  Object.assign(form, blankForm(), { document_type: availableTypes.value[0]?.value || '' })
}

async function openDialog(setting = null, mode = 'create') {
  dialogMode.value = mode
  editingSetting.value = null
  fieldErrors.value = {}
  resetForm()

  if (setting) {
    try {
      const response = await api.get('/admin/print-header-settings/' + setting.id)
      const data = response.data.data
      editingSetting.value = data
      Object.assign(form, {
        ...blankForm(),
        ...data,
        left_details_bn_text: lines(data.left_details_bn),
        opening_hours_bn_text: lines(data.opening_hours_bn),
        right_details_en_text: lines(data.right_details_en),
      })
    } catch {
      toast.error('The print header could not be loaded.')
      return
    }
  }

  dialogOpen.value = true
}

function closeDialog() {
  if (!saving.value) dialogOpen.value = false
}

async function saveSetting() {
  fieldErrors.value = {}
  saving.value = true
  try {
    const payload = {
      document_type: form.document_type,
      left_title_bn: form.left_title_bn || null,
      left_subtitle_bn: form.left_subtitle_bn || null,
      left_details_bn: linesToArray(form.left_details_bn_text),
      center_title_bn: form.center_title_bn || null,
      center_title_en: form.center_title_en || null,
      center_subtitle_bn: form.center_subtitle_bn || null,
      registration_no: form.registration_no || null,
      address_bn: form.address_bn || null,
      opening_hours_bn: linesToArray(form.opening_hours_bn_text),
      right_title_en: form.right_title_en || null,
      right_subtitle_en: form.right_subtitle_en || null,
      right_details_en: linesToArray(form.right_details_en_text),
      contact_phone: form.contact_phone || null,
      email: form.email || null,
      logo_path: form.logo_path || null,
      accent_color: form.accent_color || null,
      is_active: form.is_active,
    }
    if (editingSetting.value) {
      await api.put('/admin/print-header-settings/' + editingSetting.value.id, payload)
      toast.success('Print header updated successfully.')
    } else {
      await api.post('/admin/print-header-settings', payload)
      toast.success('Print header created successfully.')
    }
    dialogOpen.value = false
    await loadSettings()
  } catch (error) {
    const response = error.response?.data
    if (response?.errors) {
      fieldErrors.value = Object.fromEntries(Object.entries(response.errors).map(([key, messages]) => [key.split('.')[0] === 'email' ? 'email' : key.split('.')[0], messages[0]]))
    } else {
      toast.error(response?.message || 'The print header could not be saved.')
    }
  } finally {
    saving.value = false
  }
}

async function deleteSetting(setting) {
  if (!window.confirm('Delete the ' + typeLabel(setting.document_type) + ' print header?')) return
  try {
    await api.delete('/admin/print-header-settings/' + setting.id)
    toast.success('Print header deleted successfully.')
    await loadSettings()
  } catch (error) {
    toast.error(error.response?.data?.message || 'The print header could not be deleted.')
  }
}

onMounted(loadSettings)
</script>

<style scoped>
.print-header-toolbar { display: flex; align-items: center; gap: 15px; margin: 0 0 16px; color: var(--muted); font-size: 12px; }
.print-header-toolbar .muted { margin-left: auto; }
.print-header-card { overflow: hidden; }
.print-header-table { min-width: 760px; }
.actions-heading { text-align: right; }
.print-header-actions { display: flex; justify-content: flex-end; align-items: center; gap: 6px; }
.danger-action { color: #dc2626; }
.dialog-backdrop { position: fixed; inset: 0; z-index: 100; display: grid; place-items: center; overflow-y: auto; padding: 20px; background: rgba(15, 23, 42, .56); }
.print-header-dialog { display: flex; flex-direction: column; width: min(820px, 100%); max-height: min(850px, calc(100vh - 40px)); overflow: hidden; }
.print-header-dialog > form { display: flex; flex: 1; flex-direction: column; min-height: 0; overflow: hidden; }
.dialog-head { display: flex; flex: 0 0 auto; align-items: flex-start; justify-content: space-between; gap: 16px; padding: 21px 24px; border-bottom: 1px solid var(--border); }
.dialog-head h2 { font-size: 19px; }
.dialog-head p { margin-top: 3px; color: var(--muted); font-size: 12.5px; }
.dialog-body { flex: 1; min-height: 0; overflow-y: auto; padding: 20px 24px 8px; }
.print-header-fields { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0 18px; }
.field-wide, .form-section-title { grid-column: 1 / -1; }
.form-section-title { margin: 5px 0 12px; padding-bottom: 7px; border-bottom: 1px solid var(--border); color: var(--text); font-size: 13px; }
.print-header-fields .field { margin-bottom: 15px; }
.details-input { min-height: 68px; resize: vertical; }
.required { color: #dc2626; font-weight: 800; }
.input-invalid { border-color: #dc2626; }
.field-error { display: block; margin-top: 5px; color: #dc2626; font-size: 12px; }
.color-field { display: flex; align-items: center; gap: 8px; }
.color-field .input { flex: 1; }
.color-field input[type="color"] { width: 42px; height: 40px; padding: 3px; border: 1px solid var(--border); border-radius: 9px; background: #fff; }
.active-option { display: flex; align-items: center; gap: 9px; margin: 0 24px 16px; font-size: 13px; }
.status-field { margin: 0 24px 16px; }
.dialog-actions { display: flex; flex: 0 0 auto; justify-content: flex-end; gap: 10px; padding: 16px 24px 20px; border-top: 1px solid var(--border); }
@media (max-width: 620px) { .print-header-toolbar { align-items: flex-start; flex-direction: column; } .print-header-toolbar .muted { margin-left: 0; } .dialog-backdrop { padding: 10px; } .dialog-head, .dialog-body { padding-right: 16px; padding-left: 16px; } .print-header-fields { grid-template-columns: 1fr; } .field-wide, .form-section-title { grid-column: auto; } .active-option, .status-field { margin-right: 16px; margin-left: 16px; } .dialog-actions { padding-right: 16px; padding-left: 16px; } }
</style>
