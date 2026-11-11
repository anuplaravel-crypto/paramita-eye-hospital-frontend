<template>
  <section class="investigation-reports">
    <header class="page-head">
      <div>
        <h1 class="page-title">Investigation Reports</h1>
        <p class="page-sub">Review investigation collections and commissions for a date range.</p>
      </div>
    </header>

    <div v-if="dateRangeError" class="page-error" role="alert">{{ dateRangeError }}</div>
    <section class="daily-summary-grid report-summary-grid" aria-label="Investigation report totals" aria-live="polite" :aria-busy="summaryLoading">
      <article class="daily-summary-card"><span>Total investigation collection</span><strong>{{ formatAmount(summary.total_investigation_collection) }}</strong></article>
      <article class="daily-summary-card commission-summary-card"><span>Total agent commission</span><strong>{{ formatAmount(summary.total_agent_commission) }}</strong></article>
      <article class="daily-summary-card report-discount-card"><span>Customer request discount</span><strong>{{ formatAmount(summary.total_customer_requested_discount) }}</strong></article>
      <article class="daily-summary-card report-cash-card"><span>Cash in hand</span><strong>{{ formatAmount(summary.cash_in_hand) }}</strong><small>Collection less agent commission and customer discount</small></article>
      <article class="daily-summary-card report-doctor-card"><span>Doctor commission</span><strong>{{ formatAmount(summary.total_doctor_commission) }}</strong></article>
      <article class="daily-summary-card report-technician-card"><span>Technician commission</span><strong>{{ formatAmount(summary.total_technician_commission) }}</strong></article>
      <article class="daily-summary-card report-count-card"><span>Investigation count</span><strong>{{ summary.total_investigation_count }}</strong><small>Matching date range and investigation</small></article>
      <article class="daily-summary-card actual-cash-card"><span>Actual cash in hand</span><strong>{{ formatAmount(summary.actual_cash_in_hand) }}</strong><small>After discounts and agent, doctor, and technician commissions</small></article>
    </section>

    <div class="toolbar report-toolbar">
      <label class="report-date-filter"><span>From date</span><input v-model="fromDate" type="date" aria-label="Report start date" /></label>
      <label class="report-date-filter"><span>To date</span><input v-model="toDate" type="date" aria-label="Report end date" /></label>
      <select v-model="investigationTypeFilter" class="input report-filter-select" aria-label="Filter report by investigation type">
        <option value="all">All types</option><option value="indoor">Indoor</option><option value="outdoor">Outdoor</option>
      </select>
      <select v-model="doctorFilter" class="input report-filter-select" aria-label="Filter report by doctor">
        <option value="all">All doctors</option>
        <option v-for="doctor in doctors" :key="doctor.id" :value="doctor.name">{{ doctor.name }}</option>
      </select>
      <select v-model="investigationFilter" class="input report-investigation-filter" aria-label="Filter report by investigation">
        <option value="all">All investigations</option>
        <option v-for="investigation in investigations" :key="investigation.id" :value="String(investigation.id)">{{ investigation.name }}</option>
      </select>
      <select v-model="technicianFilter" class="input report-filter-select" aria-label="Filter report by technician">
        <option value="all">All technicians</option>
        <option v-for="technician in technicians" :key="technician.id" :value="String(technician.id)">{{ technician.name }}</option>
      </select>
      <span class="receipt-total-count">{{ filteredReceipts.length }} receipts</span>
    </div>

    <div v-if="pageError" class="page-error" role="alert"><span>{{ pageError }}</span><button class="btn btn-outline btn-sm" type="button" @click="loadData">Try again</button></div>
    <div v-if="summaryError" class="summary-error" role="alert">{{ summaryError }} <button class="btn btn-outline btn-sm" type="button" @click="loadSummary">Try again</button></div>

    <div class="card report-table-card">
      <div v-if="loading" class="empty" role="status">Loading investigation report...</div>
      <div v-else-if="!filteredReceipts.length" class="empty"><FileText :size="30" /><h4>No matching receipts</h4><p>Adjust the date range or report filters.</p></div>
      <div v-else class="table-wrap">
        <table class="table report-table">
          <thead>
            <tr>
              <th>Sl</th>
              <th :aria-sort="sortAria('date')"><button class="sort-button" type="button" @click="toggleSort('date')">Date <span class="sort-indicator" aria-hidden="true">{{ sortIndicator('date') }}</span></button></th>
              <th :aria-sort="sortAria('receipt_number')"><button class="sort-button" type="button" @click="toggleSort('receipt_number')">Receipt <span class="sort-indicator" aria-hidden="true">{{ sortIndicator('receipt_number') }}</span></button></th>
              <th :aria-sort="sortAria('patient_name')"><button class="sort-button" type="button" @click="toggleSort('patient_name')">Patient <span class="sort-indicator" aria-hidden="true">{{ sortIndicator('patient_name') }}</span></button></th>
              <th :aria-sort="sortAria('investigations')"><button class="sort-button" type="button" @click="toggleSort('investigations')">Investigations <span class="sort-indicator" aria-hidden="true">{{ sortIndicator('investigations') }}</span></button></th>
              <th>Doctor</th>
              <th :aria-sort="sortAria('actual_fees')"><button class="sort-button" type="button" @click="toggleSort('actual_fees')">Actual Fees <span class="sort-indicator" aria-hidden="true">{{ sortIndicator('actual_fees') }}</span></button></th>
              <th :aria-sort="sortAria('discount')"><button class="sort-button" type="button" @click="toggleSort('discount')">Discount <span class="sort-indicator" aria-hidden="true">{{ sortIndicator('discount') }}</span></button></th>
              <th :aria-sort="sortAria('requested_discount')"><button class="sort-button" type="button" @click="toggleSort('requested_discount')">Discount (Req) <span class="sort-indicator" aria-hidden="true">{{ sortIndicator('requested_discount') }}</span></button></th>
              <th :aria-sort="sortAria('agent_commission')"><button class="sort-button" type="button" @click="toggleSort('agent_commission')">Agent Com <span class="sort-indicator" aria-hidden="true">{{ sortIndicator('agent_commission') }}</span></button></th>
              <th :aria-sort="sortAria('doctor_commission')"><button class="sort-button" type="button" @click="toggleSort('doctor_commission')">Doc Com <span class="sort-indicator" aria-hidden="true">{{ sortIndicator('doctor_commission') }}</span></button></th>
              <th :aria-sort="sortAria('technician_commission')"><button class="sort-button" type="button" @click="toggleSort('technician_commission')">Techni Com <span class="sort-indicator" aria-hidden="true">{{ sortIndicator('technician_commission') }}</span></button></th>
              <th :aria-sort="sortAria('payable')"><button class="sort-button" type="button" @click="toggleSort('payable')">Payable <span class="sort-indicator" aria-hidden="true">{{ sortIndicator('payable') }}</span></button></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(receipt, index) in sortedReceipts" :key="receipt.id">
              <td>{{ index + 1 }}</td><td>{{ formatDate(receipt.receipt_date) }}</td><td><strong>{{ receipt.receipt_number }}</strong></td><td>{{ receipt.patient_name || '—' }}</td>
              <td class="report-investigations">{{ investigationNames(receipt) }}</td><td>{{ receipt.doctor_name || '—' }}</td><td class="price-cell">{{ formatAmount(receiptAmount(receipt, 'price', 'actual_fees')) }}</td>
              <td class="price-cell">{{ formatAmount(receiptAmount(receipt, 'discount', 'discount')) }}</td>
              <td class="price-cell">{{ formatAmount(receiptAmount(receipt, 'customer_requested_discount', 'customer_requested_discount')) }}</td>
              <td class="price-cell">{{ formatAmount(receiptAmount(receipt, 'agent_commission', 'agent_commission')) }}</td>
              <td class="price-cell">{{ formatAmount(receiptAmount(receipt, 'doctor_commission', 'doctor_commission')) }}</td><td class="price-cell">{{ formatAmount(receiptTechnicianCommission(receipt)) }}</td>
              <td class="price-cell payable-cell">{{ formatAmount(receiptPayable(receipt)) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { FileText } from '@lucide/vue'
import api from '../api/axios'

function localDate(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const today = new Date()
const fromDate = ref(localDate(new Date(today.getFullYear(), today.getMonth(), 1)))
const toDate = ref(localDate(today))
const investigationTypeFilter = ref('all')
const doctorFilter = ref('all')
const investigationFilter = ref('all')
const technicianFilter = ref('all')
const receipts = ref([])
const investigations = ref([])
const doctors = ref([])
const technicians = ref([])
const loading = ref(true)
const summaryLoading = ref(false)
const pageError = ref('')
const summaryError = ref('')
const summary = ref({
  total_investigation_collection: '0.00',
  total_agent_commission: '0.00',
  total_customer_requested_discount: '0.00',
  cash_in_hand: '0.00',
  actual_cash_in_hand: '0.00',
  total_doctor_commission: '0.00',
  total_technician_commission: '0.00',
  total_investigation_count: 0,
})
const sortKey = ref('')
const sortDirection = ref('asc')
let summaryRequest = 0

const dateRangeError = computed(() => fromDate.value && toDate.value && fromDate.value > toDate.value ? 'From date must be on or before the to date.' : '')
const filteredReceipts = computed(() => {
  return receipts.value.filter((receipt) => {
    if (dateRangeError.value) return false
    const date = receipt.receipt_date || ''
    const inRange = (!fromDate.value || date >= fromDate.value) && (!toDate.value || date <= toDate.value)
    const matchesType = investigationTypeFilter.value === 'all' || receipt.investigation_type === investigationTypeFilter.value
    const matchesDoctor = doctorFilter.value === 'all' || receipt.doctor_name === doctorFilter.value
    const matchesInvestigation = investigationFilter.value === 'all' || (receipt.items || []).some((item) => String(item.investigation_id) === investigationFilter.value)
    const matchesTechnician = technicianFilter.value === 'all' || (receipt.items || []).some((item) => String(item.technician_id || '') === technicianFilter.value)
    return inRange && matchesType && matchesDoctor && matchesInvestigation && matchesTechnician
  })
})
const sortedReceipts = computed(() => {
  const rows = [...filteredReceipts.value]
  if (!sortKey.value) return rows

  const direction = sortDirection.value === 'asc' ? 1 : -1
  return rows.sort((first, second) => {
    const firstValue = receiptSortValue(first, sortKey.value)
    const secondValue = receiptSortValue(second, sortKey.value)
    const comparison = typeof firstValue === 'number' && typeof secondValue === 'number'
      ? firstValue - secondValue
      : String(firstValue ?? '').localeCompare(String(secondValue ?? ''), 'en', { numeric: true, sensitivity: 'base' })
    return comparison * direction
  })
})

function formatAmount(value) {
  const number = Number(value || 0)
  return number.toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
function formatDate(value) {
  if (!value) return '—'
  const [year, month, day] = value.split('-').map(Number)
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(year, month - 1, day))
}
function matchingItems(receipt) {
  const items = receipt.items || []
  return items.filter((item) => {
    const matchesInvestigation = investigationFilter.value === 'all' || String(item.investigation_id) === investigationFilter.value
    const matchesTechnician = technicianFilter.value === 'all' || String(item.technician_id || '') === technicianFilter.value
    return matchesInvestigation && matchesTechnician
  })
}
function receiptAmount(receipt, key, fallback) {
  const items = matchingItems(receipt)
  if (items.some((item) => item[key] !== undefined && item[key] !== null)) return items.reduce((sum, item) => sum + Number(item[key] || 0), 0)
  return Number(receipt[fallback] || 0)
}
function receiptTechnicianCommission(receipt) {
  return matchingItems(receipt).reduce((sum, item) => sum + Number(item.technician_commission || 0), 0)
}
function receiptPayable(receipt) {
  return matchingItems(receipt).reduce((sum, item) => sum
    + Number(item.price || 0)
    - Number(item.discount || 0)
    - Number(item.customer_requested_discount || 0)
    - Number(item.agent_commission || 0)
    - Number(item.doctor_commission || 0)
    - Number(item.technician_commission || 0), 0)
}
function investigationNames(receipt) {
  return matchingItems(receipt).map((item) => item.investigation?.name).filter(Boolean).join(', ') || '—'
}
function receiptSortValue(receipt, key) {
  switch (key) {
    case 'date': return receipt.receipt_date || ''
    case 'receipt_number': return receipt.receipt_number || ''
    case 'patient_name': return receipt.patient_name || ''
    case 'investigations': return investigationNames(receipt)
    case 'actual_fees': return receiptAmount(receipt, 'price', 'actual_fees')
    case 'discount': return receiptAmount(receipt, 'discount', 'discount')
    case 'requested_discount': return receiptAmount(receipt, 'customer_requested_discount', 'customer_requested_discount')
    case 'agent_commission': return receiptAmount(receipt, 'agent_commission', 'agent_commission')
    case 'doctor_commission': return receiptAmount(receipt, 'doctor_commission', 'doctor_commission')
    case 'technician_commission': return receiptTechnicianCommission(receipt)
    case 'payable': return receiptPayable(receipt)
    default: return ''
  }
}
function toggleSort(key) {
  if (sortKey.value === key) sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
  else {
    sortKey.value = key
    sortDirection.value = 'asc'
  }
}
function sortIndicator(key) {
  if (sortKey.value !== key) return '↕'
  return sortDirection.value === 'asc' ? '↑' : '↓'
}
function sortAria(key) {
  return sortKey.value !== key ? 'none' : sortDirection.value === 'asc' ? 'ascending' : 'descending'
}

async function loadData() {
  loading.value = true
  pageError.value = ''
  try {
    const [receiptResponse, investigationResponse, userResponse] = await Promise.all([api.get('/admin/investigation-receipts'), api.get('/admin/investigations'), api.get('/admin/users')])
    receipts.value = receiptResponse.data.data || []
    investigations.value = investigationResponse.data.data || []
    const users = userResponse.data.data || []
    doctors.value = users.filter((user) => user.role?.name?.toLowerCase() === 'doctor').sort((a, b) => a.name.localeCompare(b.name))
    technicians.value = users.filter((user) => ['technishian', 'technician'].includes(user.role?.name?.toLowerCase())).sort((a, b) => a.name.localeCompare(b.name))
  } catch (error) {
    pageError.value = error.response?.status ? `Investigation report could not be loaded (HTTP ${error.response.status}).` : 'The API did not respond. Check that Laravel is running, then select Try again.'
  } finally {
    loading.value = false
  }
}

async function loadSummary() {
  if (dateRangeError.value || !fromDate.value || !toDate.value) return
  const requestId = ++summaryRequest
  summaryLoading.value = true
  summaryError.value = ''
  try {
    const params = { from_date: fromDate.value, to_date: toDate.value }
    if (investigationFilter.value !== 'all') params.investigation_id = Number(investigationFilter.value)
    if (investigationTypeFilter.value !== 'all') params.investigation_type = investigationTypeFilter.value
    if (doctorFilter.value !== 'all') params.doctor_name = doctorFilter.value
    if (technicianFilter.value !== 'all') params.technician_id = Number(technicianFilter.value)
    const response = await api.get('/admin/investigation-receipts/report-summary', { params })
    if (requestId === summaryRequest) summary.value = response.data.data
  } catch (error) {
    if (requestId === summaryRequest) summaryError.value = error.response?.status ? `Report totals could not be loaded (HTTP ${error.response.status}).` : 'Report totals could not be loaded. Check that Laravel is running.'
  } finally {
    if (requestId === summaryRequest) summaryLoading.value = false
  }
}

watch([fromDate, toDate, investigationTypeFilter, doctorFilter, investigationFilter, technicianFilter], loadSummary)
onMounted(async () => { await loadData(); await loadSummary() })
</script>

<style scoped>
.report-toolbar { display: flex; align-items: end; gap: 10px; margin-bottom: 18px; }
.daily-summary-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 14px; margin: 0 0 18px; }
.daily-summary-card { display: flex; min-height: 98px; flex-direction: column; justify-content: center; gap: 8px; padding: 17px 20px; border: 1px solid var(--border); border-radius: 17px; background: #fff; box-shadow: 0 5px 16px rgba(27, 42, 74, .045); }
.daily-summary-card > span { color: var(--muted); font-size: 12px; font-weight: 600; }
.daily-summary-card > strong { color: #172033; font-size: 22px; line-height: 1.15; }
.daily-summary-card > small { color: var(--muted); font-size: 11px; }
.commission-summary-card { border-left: 4px solid #f59e0b; }
.report-discount-card { border-left: 4px solid #6366f1; }
.report-cash-card { border-left: 4px solid #10b981; }
.report-cash-card > strong { color: #059669; }
.actual-cash-card { border-left: 4px solid #059669; }
.actual-cash-card > strong { color: #059669; }
.report-doctor-card { border-left: 4px solid #6366f1; }
.report-technician-card { border-left: 4px solid #f59e0b; }
.report-count-card { border-left: 4px solid #0ea5e9; }
.page-error, .summary-error { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin: 0 0 16px; padding: 10px 13px; border: 1px solid #fecaca; border-radius: 12px; color: #b91c1c; background: #fef2f2; font-size: 12px; }
.report-date-filter { display: grid; gap: 5px; color: var(--muted); font-size: 12px; font-weight: 600; }
.report-date-filter input { width: 150px; min-height: 42px; padding: 0 12px; border: 1.5px solid var(--border); border-radius: 12px; color: var(--text); background: #fff; }
.report-investigation-filter { width: auto; min-width: 180px; min-height: 42px; flex: 1 1 180px; }
.report-filter-select { width: auto; min-width: 135px; min-height: 42px; flex: 1 1 135px; }
.receipt-total-count { margin-left: auto; color: var(--muted); font-size: 12px; white-space: nowrap; }
.report-summary-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); }
.report-doctor-card { border-left: 4px solid #6366f1; }
.report-count-card { border-left: 4px solid #0ea5e9; }
.report-table-card { overflow: hidden; }
.report-table { min-width: 1360px; table-layout: fixed; }
.report-table th, .report-table td { padding-right: 7px; padding-left: 7px; }
.sort-button { display: inline-flex; align-items: center; gap: 4px; padding: 0; border: 0; color: inherit; background: transparent; font: inherit; text-align: left; text-transform: inherit; cursor: pointer; }
.sort-button:hover, .sort-button:focus-visible { color: #475569; }
.sort-button:focus-visible { outline: 2px solid var(--primary); outline-offset: 3px; border-radius: 3px; }
.sort-indicator { color: #94a3b8; font-size: 13px; line-height: 1; }
.report-table th:nth-child(1) { width: 3%; }
.report-table th:nth-child(2) { width: 6%; }
.report-table th:nth-child(3) { width: 7%; }
.report-table th:nth-child(4) { width: 9%; }
.report-table th:nth-child(5) { width: 13%; }
.report-table th:nth-child(6) { width: 8%; }
.report-table th:nth-child(7) { width: 8%; }
.report-table th:nth-child(8) { width: 6%; }
.report-table th:nth-child(9) { width: 8%; }
.report-table th:nth-child(10) { width: 7%; }
.report-table th:nth-child(11) { width: 7%; }
.report-table th:nth-child(12) { width: 8%; }
.report-table th:nth-child(13) { width: 10%; min-width: 132px; }
.report-table th:last-child, .report-table td:last-child { position: sticky; right: 0; z-index: 1; background: #fff; box-shadow: -7px 0 10px -10px rgba(15, 23, 42, .5); }
.report-table thead th:last-child { z-index: 2; background: #f8fafd; }
.report-investigations { min-width: 170px; max-width: 260px; white-space: normal; }
@media (max-width: 900px) { .daily-summary-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (max-width: 640px) { .daily-summary-grid { grid-template-columns: 1fr; } .report-toolbar { align-items: stretch; } .report-date-filter, .report-date-filter input, .report-investigation-filter, .report-filter-select { width: 100%; } .receipt-total-count { margin: 0; } }
</style>
