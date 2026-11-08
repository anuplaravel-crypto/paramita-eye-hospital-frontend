<template>
  <section>
    <header class="page-head"><div><h1 class="page-title">Technician Commissions</h1><p class="page-sub">Review investigation commissions and record technician payments.</p></div></header>

    <div class="commission-summary">
      <article class="summary-card pending-card"><span>Unpaid commissions</span><strong>BDT {{ formatAmount(pendingTotal) }}</strong><small>{{ pendingCount }} items awaiting payment</small></article>
      <article class="summary-card paid-card"><span>Paid commissions</span><strong>BDT {{ formatAmount(paidTotal) }}</strong><small>{{ paidCount }} items paid</small></article>
      <article class="summary-card investigation-card"><span>Total investigations</span><strong>{{ investigationCount }}</strong><small>Matching current filters</small></article>
    </div>

    <div class="toolbar commission-toolbar">
      <label class="search-inline"><Search :size="17" /><input v-model="search" type="search" placeholder="Search technician, receipt, or investigation..." aria-label="Search technician commissions" /></label>
      <select v-model="statusFilter" class="input status-filter" aria-label="Filter commissions by payment status"><option value="all">All statuses</option><option value="pending">Unpaid</option><option value="paid">Paid</option><option value="not_applicable">No commission</option></select>
      <input v-model="selectedDate" class="input date-filter" type="date" aria-label="Filter commissions by receipt date" />
      <select v-model="investigationFilter" class="input investigation-filter" aria-label="Filter commissions by investigation"><option value="all">All investigations</option><option v-for="investigation in investigationOptions" :key="investigation.id" :value="String(investigation.id)">{{ investigation.name }}</option></select>
      <span class="spacer"></span><span class="muted">{{ receiptGroups.length }} receipts</span>
    </div>

    <div v-if="pageError" class="page-error" role="alert"><span>{{ pageError }}</span><button class="btn btn-outline btn-sm" type="button" @click="loadCommissions">Try again</button></div>
    <div class="card commission-card">
      <div v-if="loading" class="empty" role="status">Loading technician commissions...</div>
      <div v-else-if="!receiptGroups.length" class="empty"><HandCoins :size="30" /><h4>{{ hasActiveFilters ? 'No matching commission entries' : 'No technician commissions yet' }}</h4><p>{{ hasActiveFilters ? 'Adjust the filters to see other commission entries.' : 'Commission entries are created when investigation receipts are saved.' }}</p></div>
      <div v-else class="table-wrap"><table class="table commission-table"><thead><tr><th>Sl</th><th>Receipt Date</th><th>Receipt No</th><th>Patient</th><th>Investigation</th><th>Technician</th><th>Discount</th><th>Commission</th><th>Status</th><th class="actions-heading">Action</th></tr></thead><tbody><tr v-for="(receipt, index) in receiptGroups" :key="receipt.id">
          <td>{{ index + 1 }}</td><td>{{ formatDate(receipt.receipt?.receipt_date) }}</td><td><strong>{{ receipt.receipt?.receipt_number || '—' }}</strong></td><td>{{ capitalizeWords(receipt.receipt?.patient_name) || '—' }}</td><td class="investigation-summary">{{ receipt.investigationSummary }}</td><td>{{ receipt.technicianSummary }}</td><td>{{ formatAmount(receipt.discountTotal) }}</td><td class="commission-amount">{{ formatAmount(receipt.commissionTotal) }}</td>
          <td><span class="status-pill" :class="statusClass(receipt.status)">{{ statusLabel(receipt.status) }}</span></td>
          <td class="action-cell"><button class="btn btn-outline btn-sm" type="button" @click="openReceiptDialog(receipt)"><Eye :size="14" /> View</button><button v-if="hasPendingPayment(receipt.id)" class="btn btn-primary btn-sm" type="button" @click="openReceiptPayment(receipt)"><Check :size="14" /> Mark Paid</button></td>
        </tr></tbody></table></div>
    </div>

    <Teleport to="body"><div v-if="receiptDialogOpen && selectedReceipt" class="dialog-backdrop receipt-details-backdrop" @click.self="closeReceiptDialog"><section class="receipt-details-dialog card" role="dialog" aria-modal="true" aria-labelledby="receipt-details-title">
      <header class="dialog-head"><div><h2 id="receipt-details-title">Investigation Commission Details</h2><p>Receipt {{ selectedReceipt.receipt?.receipt_number || '' }} · {{ formatDate(selectedReceipt.receipt?.receipt_date) }}</p></div><button class="icon-btn" type="button" aria-label="Close receipt details" @click="closeReceiptDialog"><X :size="18" /></button></header>
      <div class="dialog-body"><div class="receipt-patient-summary"><div><span>Patient</span><strong>{{ capitalizeWords(selectedReceipt.receipt?.patient_name) || '—' }}</strong></div><div><span>Patient contact number</span><strong>{{ selectedReceipt.receipt?.contact_number || '—' }}</strong></div><div><span>Doctor name</span><strong>{{ doctorNameLoading ? 'Loading...' : selectedDoctorName || selectedReceipt.receipt?.doctor_name || '—' }}</strong></div><div><span>Receipt date</span><strong>{{ formatDate(selectedReceipt.receipt?.receipt_date) }}</strong></div><div><span>Receipt number</span><strong>{{ selectedReceipt.receipt?.receipt_number || '—' }}</strong></div></div>
        <div class="receipt-detail-table-wrap"><table class="table receipt-detail-table"><thead><tr><th>Investigation</th><th>Technician</th><th>Commission</th><th>Status</th><th>Paid date</th></tr></thead><tbody><tr v-for="commission in selectedReceipt.items" :key="commission.id"><td>{{ commission.investigation_name }}</td><td>{{ commission.technician_name || '—' }}</td><td class="commission-amount">{{ formatAmount(commission.commission_amount) }} <small>BDT</small></td><td><span class="status-pill" :class="statusClass(commission.status)">{{ statusLabel(commission.status) }}</span></td><td>{{ commission.paid_at ? formatDate(commission.paid_at) : '—' }}</td></tr></tbody></table></div>
      </div><footer class="dialog-actions"><button class="btn btn-outline" type="button" @click="closeReceiptDialog">Close</button><button v-if="selectedReceipt.pendingCommissionTotal > 0" class="btn btn-primary" type="button" @click="openPayDialog(selectedReceipt)"><Check :size="14" /> Mark Full Receipt Paid</button></footer>
    </section></div></Teleport>

    <Teleport to="body"><div v-if="dialogOpen" class="dialog-backdrop pay-dialog-backdrop" @click.self="closeDialog"><section class="pay-dialog card" role="dialog" aria-modal="true" aria-labelledby="pay-dialog-title">
      <header class="dialog-head"><div><h2 id="pay-dialog-title">Record Technician Payment</h2><p>Confirm full payment of the outstanding technician commissions for this receipt.</p></div><button class="icon-btn" type="button" aria-label="Close payment dialog" @click="closeDialog"><X :size="18" /></button></header>
      <form @submit.prevent="markPaid"><div class="dialog-body">
        <div v-if="selectedPaymentReceipt" class="payment-preview"><div><span>Technician(s)</span><strong>{{ selectedPaymentReceipt.pendingTechnicianSummary }}</strong></div><div><span>Investigation(s)</span><strong>{{ selectedPaymentReceipt.pendingInvestigationSummary }}</strong></div><div><span>Receipt No</span><strong>{{ selectedPaymentReceipt.receipt?.receipt_number || '—' }}</strong></div><div><span>Full payment amount</span><strong class="payment-amount">BDT {{ formatAmount(selectedPaymentReceipt.pendingCommissionTotal) }}</strong></div></div>
        <p v-if="fieldErrors.receipt" class="field-error" role="alert">{{ fieldErrors.receipt }}</p>
        <div class="field"><label for="paid-at">Payment date <span class="required">*</span></label><input id="paid-at" v-model="form.paid_at" class="input" :class="{ 'input-invalid': fieldErrors.paid_at }" type="date" required :aria-invalid="Boolean(fieldErrors.paid_at)" :aria-describedby="fieldErrors.paid_at ? 'paid-at-error' : undefined" /><small v-if="fieldErrors.paid_at" id="paid-at-error" class="field-error" role="alert">{{ fieldErrors.paid_at }}</small></div>
        <div class="field"><label for="payment-reference">Payment reference</label><input id="payment-reference" v-model.trim="form.payment_reference" class="input" :class="{ 'input-invalid': fieldErrors.payment_reference }" type="text" maxlength="255" placeholder="Optional transaction or receipt reference" :aria-invalid="Boolean(fieldErrors.payment_reference)" :aria-describedby="fieldErrors.payment_reference ? 'payment-reference-error' : undefined" /><small v-if="fieldErrors.payment_reference" id="payment-reference-error" class="field-error" role="alert">{{ fieldErrors.payment_reference }}</small></div>
        <div class="field"><label for="payment-notes">Notes</label><textarea id="payment-notes" v-model.trim="form.notes" class="input notes-input" :class="{ 'input-invalid': fieldErrors.notes }" rows="3" maxlength="1000" placeholder="Optional payment notes" :aria-invalid="Boolean(fieldErrors.notes)" :aria-describedby="fieldErrors.notes ? 'payment-notes-error' : undefined"></textarea><small v-if="fieldErrors.notes" id="payment-notes-error" class="field-error" role="alert">{{ fieldErrors.notes }}</small></div>
      </div><footer class="dialog-actions"><button class="btn btn-outline" type="button" :disabled="saving" @click="closeDialog">Cancel</button><button class="btn btn-primary" type="submit" :disabled="saving">{{ saving ? 'Saving...' : 'Confirm Payment' }}</button></footer></form>
    </section></div></Teleport>
  </section>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { toast } from 'vue-sonner'
import { Check, Eye, HandCoins, Search, X } from '@lucide/vue'
import api from '../api/axios'

const commissions = ref([])
const loading = ref(true)
const saving = ref(false)
const pageError = ref('')
const search = ref('')
const statusFilter = ref('all')
const selectedDate = ref(currentDate())
const investigationFilter = ref('all')
const dialogOpen = ref(false)
const receiptDialogOpen = ref(false)
const selectedReceiptId = ref(null)
const selectedDoctorName = ref('')
const doctorNameLoading = ref(false)
const selectedPaymentReceipt = ref(null)
const fieldErrors = ref({})
const form = reactive({ paid_at: '', payment_reference: '', notes: '' })
const pendingCommissions = computed(() => filteredCommissions.value.filter((item) => item.status === 'pending'))
const paidCommissions = computed(() => filteredCommissions.value.filter((item) => item.status === 'paid'))
const pendingCount = computed(() => pendingCommissions.value.length)
const paidCount = computed(() => paidCommissions.value.length)
const pendingTotal = computed(() => pendingCommissions.value.reduce((sum, item) => sum + Number(item.commission_amount || 0), 0))
const paidTotal = computed(() => paidCommissions.value.reduce((sum, item) => sum + Number(item.commission_amount || 0), 0))
const investigationCount = computed(() => filteredCommissions.value.length)
const investigationOptions = computed(() => {
  const investigations = new Map()
  for (const item of commissions.value) {
    if (item.investigation_id && item.investigation_name) investigations.set(String(item.investigation_id), item.investigation_name)
  }
  return Array.from(investigations, ([id, name]) => ({ id, name })).sort((first, second) => first.name.localeCompare(second.name))
})
const hasActiveFilters = computed(() => Boolean(search.value.trim()) || statusFilter.value !== 'all' || Boolean(selectedDate.value) || investigationFilter.value !== 'all')
const filteredCommissions = computed(() => {
  const query = search.value.trim().toLowerCase()
  return commissions.value.filter((item) => {
    const matchesStatus = statusFilter.value === 'all' || item.status === statusFilter.value
    const matchesDate = !selectedDate.value || item.receipt?.receipt_date === selectedDate.value
    const matchesInvestigation = investigationFilter.value === 'all' || String(item.investigation_id) === investigationFilter.value
    const fields = [item.technician_name, item.investigation_name, item.receipt?.receipt_number, item.receipt?.patient_name].filter(Boolean)
    return matchesStatus && matchesDate && matchesInvestigation && (!query || fields.some((field) => String(field).toLowerCase().includes(query)))
  })
})
const allReceiptGroups = computed(() => groupByReceipt(commissions.value))
const receiptGroups = computed(() => groupByReceipt(filteredCommissions.value))
const selectedReceipt = computed(() => allReceiptGroups.value.find((receipt) => String(receipt.id) === String(selectedReceiptId.value)) || null)

function groupByReceipt(entries) {
  const groups = new Map()
  for (const commission of entries) {
    const receiptId = commission.receipt?.id ?? commission.receipt?.receipt_number ?? 'commission-' + commission.id
    if (!groups.has(receiptId)) {
      groups.set(receiptId, { id: receiptId, receipt: commission.receipt, items: [] })
    }
    groups.get(receiptId).items.push(commission)
  }

  return Array.from(groups.values()).map((receipt) => {
    const paidItems = receipt.items.filter((item) => Number(item.commission_amount) > 0)
    const statuses = new Set(paidItems.map((item) => item.status))
    const investigationNames = [...new Set(receipt.items.map((item) => item.investigation_name).filter(Boolean))]
    const technicianNames = [...new Set(receipt.items.map((item) => item.technician_name).filter(Boolean))]
    const pendingItems = receipt.items.filter((item) => item.status === 'pending' && Number(item.commission_amount) > 0)
    const pendingInvestigationNames = [...new Set(pendingItems.map((item) => item.investigation_name).filter(Boolean))]
    const pendingTechnicianNames = [...new Set(pendingItems.map((item) => item.technician_name).filter(Boolean))]
    const paidDates = paidItems.filter((item) => item.status === 'paid' && item.paid_at).map((item) => item.paid_at)

    return {
      ...receipt,
      investigationSummary: investigationNames.join(', ') || '—',
      technicianSummary: technicianNames.join(', ') || '—',
      pendingInvestigationSummary: pendingInvestigationNames.join(', ') || '—',
      pendingTechnicianSummary: pendingTechnicianNames.join(', ') || '—',
      discountTotal: receipt.items.reduce((total, item) => total + Number(item.discount || 0), 0),
      commissionTotal: paidItems.reduce((total, item) => total + Number(item.commission_amount || 0), 0),
      pendingCommissionTotal: pendingItems.reduce((total, item) => total + Number(item.commission_amount || 0), 0),
      status: statuses.size === 0 ? 'not_applicable' : statuses.has('pending') ? 'pending' : 'paid',
      paidAt: statuses.size === 1 && statuses.has('paid') && paidDates.length ? paidDates.sort().at(-1) : null,
    }
  })
}
function capitalizeWords(value) { return String(value || '').trim().toLocaleLowerCase('en').replace(/(^|\s)(\p{L})/gu, (_, space, letter) => space + letter.toLocaleUpperCase('en')) }
function formatAmount(value) { return new Intl.NumberFormat('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(value || 0)) }
function formatDate(value) {
  if (!value) return '—'
  const date = String(value).slice(0, 10)
  const [year, month, day] = date.split('-').map(Number)
  if (!year || !month || !day) return '—'
  return new Date(year, month - 1, day).toLocaleDateString('en-BD', { year: 'numeric', month: 'short', day: 'numeric' })
}
function statusLabel(status) { return status === 'paid' ? 'Paid' : status === 'pending' ? 'Unpaid' : 'No commission' }
function statusClass(status) { return status === 'paid' ? 'status-paid' : status === 'pending' ? 'status-pending' : 'status-free' }
function currentDate() { const today = new Date(); return [today.getFullYear(), String(today.getMonth() + 1).padStart(2, '0'), String(today.getDate()).padStart(2, '0')].join('-') }
async function loadCommissions() {
  loading.value = true; pageError.value = ''
  try { const response = await api.get('/admin/technician-commissions'); commissions.value = response.data.data }
  catch (error) { const status = error.response?.status; pageError.value = status === 401 ? 'Your session has expired. Sign in again and reload this page.' : status === 403 ? 'Your account is not authorized to view technician commissions.' : status ? 'Technician commissions could not be loaded (HTTP ' + status + '). Select Try again.' : 'The API did not respond. Check that Laravel is running, then select Try again.' }
  finally { loading.value = false }
}
async function openReceiptDialog(receipt) {
  selectedReceiptId.value = receipt.id
  selectedDoctorName.value = receipt.receipt?.doctor_name || ''
  receiptDialogOpen.value = true

  if (selectedDoctorName.value || !receipt.receipt?.id) return

  const openedReceiptId = receipt.id
  doctorNameLoading.value = true
  try {
    const response = await api.get('/admin/investigation-receipts/' + receipt.receipt.id)
    if (String(selectedReceiptId.value) === String(openedReceiptId)) {
      selectedDoctorName.value = response.data.data.doctor_name || ''
    }
  } catch {
    if (String(selectedReceiptId.value) === String(openedReceiptId)) selectedDoctorName.value = ''
  } finally {
    if (String(selectedReceiptId.value) === String(openedReceiptId)) doctorNameLoading.value = false
  }
}
function hasPendingPayment(receiptId) {
  return allReceiptGroups.value.find((group) => String(group.id) === String(receiptId))?.pendingCommissionTotal > 0
}
function openReceiptPayment(receipt) {
  const fullReceipt = allReceiptGroups.value.find((group) => String(group.id) === String(receipt.id))
  if (fullReceipt?.pendingCommissionTotal > 0) openPayDialog(fullReceipt)
}
function closeReceiptDialog() { receiptDialogOpen.value = false; selectedReceiptId.value = null; selectedDoctorName.value = ''; doctorNameLoading.value = false }
function openPayDialog(receipt) { selectedPaymentReceipt.value = receipt; fieldErrors.value = {}; form.paid_at = currentDate(); form.payment_reference = ''; form.notes = ''; dialogOpen.value = true }
function closeDialog() { if (!saving.value) dialogOpen.value = false }
async function markPaid() {
  if (!selectedPaymentReceipt.value?.receipt?.id) return
  fieldErrors.value = {}; saving.value = true
  try {
    await api.post('/admin/technician-commissions/receipts/' + selectedPaymentReceipt.value.receipt.id + '/pay', { ...form })
    toast.success('Full technician commission payment recorded successfully.')
    dialogOpen.value = false; await loadCommissions()
  } catch (error) {
    const response = error.response?.data
    if (response?.errors) fieldErrors.value = Object.fromEntries(Object.entries(response.errors).map(([key, messages]) => [key, messages[0]]))
    else toast.error(response?.message || 'The technician commission payment could not be recorded.')
  } finally { saving.value = false }
}
onMounted(loadCommissions)
</script>

<style scoped>
.commission-summary { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; margin-bottom: 18px; }
.summary-card { display: grid; gap: 5px; padding: 18px 20px; border: 1px solid var(--border); border-radius: 16px; background: #fff; box-shadow: 0 4px 12px rgba(15,23,42,.04); }
.summary-card span { color: var(--muted); font-size: 12px; font-weight: 600; }.summary-card strong { color: #172033; font-size: 21px; }.summary-card small { color: var(--muted); font-size: 11px; }
.pending-card { border-left: 4px solid #f59e0b; }.paid-card { border-left: 4px solid #10b981; }.investigation-card { border-left: 4px solid #6366f1; }
.commission-toolbar { gap: 12px; }.status-filter { width: auto; min-width: 165px; }.date-filter { width: auto; min-width: 145px; }.investigation-filter { width: auto; min-width: 185px; max-width: 240px; }.commission-card { overflow: hidden; }.commission-table { min-width: 1200px; }.investigation-summary { max-width: 280px; white-space: normal; }
.commission-amount { color: var(--primary); font-weight: 800; white-space: nowrap; }.commission-amount small { color: var(--muted); font-size: 10px; }.muted { color: var(--muted); font-size: 12px; }.action-cell { text-align: right; white-space: nowrap; }
.status-pill { display: inline-flex; padding: 5px 10px; border-radius: 999px; font-size: 11px; font-weight: 700; }.status-pending { color: #92400e; background: #fffbeb; }.status-paid { color: #047857; background: #ecfdf5; }.status-free { color: #64748b; background: #f1f5f9; }
.dialog-backdrop { position: fixed; inset: 0; z-index: 100; display: grid; place-items: center; overflow-y: auto; padding: 20px; background: rgba(15,23,42,.56); }.pay-dialog-backdrop { z-index: 120; }.receipt-details-dialog { display: flex; flex-direction: column; width: min(900px,100%); max-height: min(780px,calc(100vh - 40px)); overflow: hidden; }.receipt-patient-summary { display: grid; grid-template-columns: repeat(3,minmax(0,1fr)); gap: 12px; padding: 14px; margin-bottom: 18px; border: 1px solid var(--border); border-radius: 13px; background: #f8faff; }.receipt-patient-summary div { display: grid; gap: 4px; }.receipt-patient-summary span { color: var(--muted); font-size: 11px; }.receipt-patient-summary strong { overflow-wrap: anywhere; }.receipt-detail-table-wrap { overflow-x: auto; }.receipt-detail-table { min-width: 720px; }.pay-dialog { display: flex; flex-direction: column; width: min(600px,100%); max-height: min(780px,calc(100vh - 40px)); overflow: hidden; }.pay-dialog form { display: flex; flex: 1; flex-direction: column; min-height: 0; overflow: hidden; }
.dialog-head { display: flex; flex: 0 0 auto; justify-content: space-between; gap: 16px; padding: 20px 24px; border-bottom: 1px solid var(--border); }.dialog-head h2 { font-size: 19px; }.dialog-head p { margin-top: 3px; color: var(--muted); font-size: 12px; }.dialog-body { flex: 1; min-height: 0; overflow-y: auto; padding: 20px 24px; }.field + .field { margin-top: 15px; }
.payment-preview { display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap: 12px; padding: 14px; margin-bottom: 18px; border: 1px solid var(--border); border-radius: 13px; background: #f8faff; }.payment-preview div { display: grid; gap: 4px; min-width: 0; }.payment-preview span { color: var(--muted); font-size: 11px; }.payment-preview strong { overflow-wrap: anywhere; color: #172033; font-size: 13px; }.payment-preview .payment-amount { color: var(--primary); font-size: 15px; }
.notes-input { height: auto; min-height: 74px; padding-top: 10px; resize: vertical; }.dialog-actions { display: flex; flex: 0 0 auto; justify-content: flex-end; gap: 10px; padding: 15px 24px 19px; border-top: 1px solid var(--border); }.required { color: #dc2626; font-weight: 800; }.input-invalid { border-color: #dc2626; }.field-error { display: block; margin-top: 5px; color: #dc2626; font-size: 12px; }
@media (max-width: 900px) { .commission-summary { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (max-width: 700px) { .commission-summary { grid-template-columns: 1fr; }.commission-toolbar { flex-wrap: wrap; }.commission-toolbar .search-inline { width: 100%; }.status-filter,.date-filter,.investigation-filter { flex: 1; min-width: 0; max-width: none; }.payment-preview { grid-template-columns: 1fr; }.receipt-patient-summary { grid-template-columns: 1fr; } }
@media (max-width: 600px) { .dialog-backdrop { padding: 10px; }.dialog-head,.dialog-body { padding-right: 15px; padding-left: 15px; }.dialog-actions { padding-right: 15px; padding-left: 15px; } }
</style>
