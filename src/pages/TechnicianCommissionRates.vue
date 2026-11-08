<template>
  <section>
    <header class="page-head"><div><h1 class="page-title">Technician Commission Rates</h1><p class="page-sub">Set the BDT commission earned for each investigation performed by a technician.</p></div><button class="btn btn-primary" type="button" @click="openDialog()"><Plus :size="17" /> Add Rate</button></header>
    <div class="toolbar"><label class="search-inline"><Search :size="17" /><input v-model="search" type="search" placeholder="Search investigations..." aria-label="Search investigation commission rates" /></label><span class="spacer"></span><span class="muted">{{ filteredRates.length }} rates</span></div>
    <div v-if="pageError" class="page-error" role="alert"><span>{{ pageError }}</span><button class="btn btn-outline btn-sm" type="button" @click="loadData">Try again</button></div>
    <div class="card rate-card">
      <div v-if="loading" class="empty" role="status">Loading technician commission rates...</div>
      <div v-else-if="!filteredRates.length" class="empty"><BadgeDollarSign :size="30" /><h4>{{ search ? 'No matching rates' : 'No commission rates configured' }}</h4><p>{{ search ? 'Try a different investigation name.' : 'Add a rate for an investigation that earns technician commission.' }}</p></div>
      <div v-else class="table-wrap"><table class="table rate-table"><thead><tr><th>Investigation</th><th>Commission Rate</th><th>Ledger Entries</th><th>Status</th><th class="actions-heading">Actions</th></tr></thead><tbody>
        <tr v-for="rate in filteredRates" :key="rate.id"><td><div class="rate-investigation"><span class="rate-icon"><BadgeDollarSign :size="18" /></span><strong>{{ rate.investigation?.name || 'Investigation' }}</strong></div></td><td class="rate-amount">{{ formatAmount(rate.commission_amount) }} <small>BDT</small></td><td><span class="entry-count">{{ rate.commissions_count || 0 }}</span><span class="muted"> commission entries</span></td><td><span class="status-pill" :class="rate.is_active ? 'status-active' : 'status-inactive'">{{ rate.is_active ? 'Active' : 'Inactive' }}</span></td><td><div class="rate-actions"><button class="btn btn-outline btn-sm" type="button" @click="openDialog(rate, 'view')"><Eye :size="15" /> View</button><button class="btn btn-outline btn-sm" type="button" @click="openDialog(rate, 'edit')"><Pencil :size="15" /> Edit</button><button class="icon-btn danger-action" type="button" title="Delete rate" :aria-label="'Delete rate for ' + (rate.investigation?.name || 'investigation')" @click="deleteRate(rate)"><Trash2 :size="16" /></button></div></td></tr>
      </tbody></table></div>
    </div>
    <Teleport to="body"><div v-if="dialogOpen" class="dialog-backdrop" @click.self="closeDialog"><section class="rate-dialog card" role="dialog" aria-modal="true" aria-labelledby="rate-dialog-title">
      <header class="dialog-head"><div><h2 id="rate-dialog-title">{{ dialogTitle }}</h2><p>{{ dialogDescription }}</p></div><button class="icon-btn" type="button" aria-label="Close dialog" @click="closeDialog"><X :size="18" /></button></header>
      <form @submit.prevent="saveRate"><div class="dialog-body">
        <div class="field"><label for="rate-investigation">Investigation <span class="required">*</span></label><select id="rate-investigation" v-model.number="form.investigation_id" class="input" :class="{ 'input-invalid': fieldErrors.investigation_id }" :disabled="readOnly" required :aria-invalid="Boolean(fieldErrors.investigation_id)" :aria-describedby="fieldErrors.investigation_id ? 'rate-investigation-error' : undefined"><option value="" disabled>Select an investigation</option><option v-for="investigation in availableInvestigations" :key="investigation.id" :value="investigation.id">{{ investigation.name }}</option></select><small v-if="fieldErrors.investigation_id" id="rate-investigation-error" class="field-error" role="alert">{{ fieldErrors.investigation_id }}</small></div>
        <div class="field"><label for="rate-amount">Commission amount (BDT) <span class="required">*</span></label><input id="rate-amount" v-model="form.commission_amount" class="input" :class="{ 'input-invalid': fieldErrors.commission_amount }" type="number" min="0" max="99999999.99" step="0.01" inputmode="decimal" :readonly="readOnly" required :aria-invalid="Boolean(fieldErrors.commission_amount)" :aria-describedby="fieldErrors.commission_amount ? 'rate-amount-error' : undefined" /><small v-if="fieldErrors.commission_amount" id="rate-amount-error" class="field-error" role="alert">{{ fieldErrors.commission_amount }}</small></div>
        <label class="active-option"><input v-model="form.is_active" type="checkbox" :disabled="readOnly" /> <span>Rate is active <span class="required">*</span></span></label><small v-if="fieldErrors.is_active" class="field-error" role="alert">{{ fieldErrors.is_active }}</small><p class="rate-help">Investigations without an active rate receive BDT 0 technician commission.</p>
      </div><footer class="dialog-actions"><button class="btn btn-outline" type="button" :disabled="saving" @click="closeDialog">{{ readOnly ? 'Close' : 'Cancel' }}</button><button v-if="!readOnly" class="btn btn-primary" type="submit" :disabled="saving">{{ saving ? 'Saving...' : editingRate ? 'Save Changes' : 'Create Rate' }}</button></footer></form>
    </section></div></Teleport>
  </section>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { toast } from 'vue-sonner'
import { BadgeDollarSign, Eye, Pencil, Plus, Search, Trash2, X } from '@lucide/vue'
import api from '../api/axios'

const rates = ref([])
const investigations = ref([])
const loading = ref(true)
const saving = ref(false)
const pageError = ref('')
const search = ref('')
const dialogOpen = ref(false)
const dialogMode = ref('create')
const editingRate = ref(null)
const fieldErrors = ref({})
const form = reactive({ investigation_id: '', commission_amount: '', is_active: true })
const filteredRates = computed(() => {
  const query = search.value.trim().toLowerCase()
  return rates.value.filter((rate) => (rate.investigation?.name || '').toLowerCase().includes(query))
})
const availableInvestigations = computed(() => {
  const usedIds = new Set(rates.value.filter((rate) => rate.id !== editingRate.value?.id).map((rate) => Number(rate.investigation_id)))
  return investigations.value.filter((investigation) => !usedIds.has(Number(investigation.id)) || Number(investigation.id) === Number(form.investigation_id))
})
const readOnly = computed(() => dialogMode.value === 'view')
const dialogTitle = computed(() => readOnly.value ? 'View Technician Commission Rate' : editingRate.value ? 'Edit Technician Commission Rate' : 'Create Technician Commission Rate')
const dialogDescription = computed(() => readOnly.value ? 'Review the investigation commission rate.' : 'Choose an investigation and set its technician commission.')
function formatAmount(value) { return new Intl.NumberFormat('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(value || 0)) }
async function loadData() {
  loading.value = true; pageError.value = ''
  try {
    const [rateResponse, investigationResponse] = await Promise.all([api.get('/admin/technician-commission-rates'), api.get('/admin/investigations')])
    rates.value = rateResponse.data.data; investigations.value = investigationResponse.data.data
  } catch (error) {
    const status = error.response?.status
    pageError.value = status === 401 ? 'Your session has expired. Sign in again and reload this page.' : status === 403 ? 'Your account is not authorized to manage technician commission rates.' : status ? 'Technician commission rates could not be loaded (HTTP ' + status + '). Select Try again.' : 'The API did not respond. Check that Laravel is running, then select Try again.'
  } finally { loading.value = false }
}
function resetForm() { form.investigation_id = ''; form.commission_amount = ''; form.is_active = true }
async function openDialog(rate = null, mode = 'create') {
  dialogMode.value = mode; editingRate.value = null; fieldErrors.value = {}; resetForm()
  if (rate) {
    try {
      const response = await api.get('/admin/technician-commission-rates/' + rate.id)
      editingRate.value = response.data.data; form.investigation_id = response.data.data.investigation_id; form.commission_amount = response.data.data.commission_amount; form.is_active = Boolean(response.data.data.is_active)
    } catch { toast.error('The technician commission rate could not be loaded.'); return }
  }
  dialogOpen.value = true
}
function closeDialog() { if (!saving.value) dialogOpen.value = false }
async function saveRate() {
  fieldErrors.value = {}; saving.value = true
  const payload = { investigation_id: Number(form.investigation_id), commission_amount: form.commission_amount, is_active: form.is_active }
  try {
    if (editingRate.value) { await api.put('/admin/technician-commission-rates/' + editingRate.value.id, payload); toast.success('Technician commission rate updated successfully.') }
    else { await api.post('/admin/technician-commission-rates', payload); toast.success('Technician commission rate created successfully.') }
    dialogOpen.value = false; await loadData()
  } catch (error) {
    const response = error.response?.data
    if (response?.errors) fieldErrors.value = Object.fromEntries(Object.entries(response.errors).map(([key, messages]) => [key, messages[0]]))
    else toast.error(response?.message || 'The technician commission rate could not be saved.')
  } finally { saving.value = false }
}
async function deleteRate(rate) {
  if (!window.confirm('Delete the technician commission rate for "' + (rate.investigation?.name || 'this investigation') + '"?')) return
  try { await api.delete('/admin/technician-commission-rates/' + rate.id); toast.success('Technician commission rate deleted successfully.'); await loadData() }
  catch (error) { toast.error(error.response?.data?.message || 'The technician commission rate could not be deleted.') }
}
onMounted(loadData)
</script>

<style scoped>
.rate-card { overflow: hidden; }.rate-table { min-width: 850px; }.actions-heading { text-align: right; }
.rate-investigation { display: flex; align-items: center; gap: 11px; }.rate-investigation strong { color: #172033; }
.rate-icon { display: grid; width: 38px; height: 38px; place-items: center; border-radius: 12px; color: var(--primary); background: #eef2ff; }
.rate-amount { color: var(--primary); font-weight: 800; white-space: nowrap; }.rate-amount small { color: var(--muted); font-size: 10px; }
.muted { color: var(--muted); font-size: 12px; }.entry-count { display: inline-flex; min-width: 27px; justify-content: center; padding: 3px 8px; border-radius: 99px; background: #f1f5f9; font-weight: 700; }
.status-pill { display: inline-flex; padding: 5px 10px; border-radius: 999px; font-size: 11px; font-weight: 700; }.status-active { color: #047857; background: #ecfdf5; }.status-inactive { color: #64748b; background: #f1f5f9; }
.rate-actions { display: flex; align-items: center; justify-content: flex-end; gap: 6px; }.danger-action { color: #dc2626; }.danger-action:hover { color: #b91c1c; background: #fef2f2; }
.dialog-backdrop { position: fixed; inset: 0; z-index: 100; display: grid; place-items: center; overflow-y: auto; padding: 20px; background: rgba(15, 23, 42, .56); }
.rate-dialog { display: flex; flex-direction: column; width: min(560px, 100%); max-height: min(700px, calc(100vh - 40px)); overflow: hidden; }.rate-dialog form { display: flex; flex: 1; flex-direction: column; min-height: 0; overflow: hidden; }
.dialog-head { display: flex; flex: 0 0 auto; align-items: flex-start; justify-content: space-between; gap: 16px; padding: 20px 24px; border-bottom: 1px solid var(--border); }.dialog-head h2 { font-size: 19px; }.dialog-head p { margin-top: 3px; color: var(--muted); font-size: 12px; }
.dialog-body { flex: 1; min-height: 0; overflow-y: auto; padding: 20px 24px; }.dialog-body .field + .field { margin-top: 16px; }
.active-option { display: flex; align-items: center; gap: 9px; margin-top: 17px; color: #334155; font-size: 13px; }.active-option input { accent-color: var(--primary); }.rate-help { margin-top: 12px; color: var(--muted); font-size: 12px; }
.dialog-actions { display: flex; flex: 0 0 auto; justify-content: flex-end; gap: 10px; padding: 15px 24px 19px; border-top: 1px solid var(--border); }
.required { color: #dc2626; font-weight: 800; }.input-invalid { border-color: #dc2626; }.field-error { display: block; margin-top: 5px; color: #dc2626; font-size: 12px; }
@media (max-width: 600px) { .dialog-backdrop { padding: 10px; }.dialog-head, .dialog-body { padding-right: 15px; padding-left: 15px; }.dialog-actions { padding-right: 15px; padding-left: 15px; } }
</style>