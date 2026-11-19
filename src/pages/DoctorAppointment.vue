<template>
  <div class="doctor-consultation">
    <header class="page-head consultation-head">
      <div>
        <RouterLink class="back-link" :to="{ name: 'doctor.appointments' }"><ArrowLeft :size="16" /> My Appointments</RouterLink>
        <h1 class="page-title">{{ isInvestigationPage ? 'Investigation Order' : 'Consultation (পরামর্শ) & Prescription' }} <span>#{{ appointment?.serial_number || route.params.serialNumber }}</span></h1>
        <p class="page-sub">{{ isInvestigationPage ? 'Prepare a separate investigation request for the patient to take to the cash counter.' : 'Record the doctor’s examination and assessment (পরীক্ষা ও মূল্যায়ন) before prescribing.' }}</p>
      </div>
      <div class="head-actions">
        <span v-if="appointment" class="badge detail-status" :class="statusClass(appointment.status)">{{ statusLabel(appointment.status) }}</span>
        <button v-if="appointment?.status === 'waiting'" class="btn btn-primary" type="button" :disabled="starting" @click="startPrescription">
          <LoaderCircle v-if="starting" :size="17" class="spin" />
          <FilePlus2 v-else :size="17" />
          {{ starting ? 'Starting…' : 'Start consultation (পরামর্শ শুরু করুন)' }}
        </button>
      </div>
    </header>

    <div v-if="errorMessage" class="appointment-error" role="alert">
      <span>{{ errorMessage }}</span>
      <button class="btn btn-outline btn-sm" type="button" @click="loadAppointment">Try again</button>
    </div>

    <section v-if="loading" class="card detail-empty" role="status">Loading appointment…</section>
    <template v-else-if="appointment">
      <section class="patient-banner card">
        <div class="patient-avatar"><UserRound :size="23" /></div>
        <div class="patient-banner-name"><span>Patient (রোগী)</span><strong>{{ appointment.name }}</strong></div>
        <div class="patient-banner-detail"><span>Age / Gender (বয়স / লিঙ্গ)</span><strong>{{ appointment.age }} years · <span class="capitalize">{{ appointment.gender }}</span></strong></div>
        <div class="patient-banner-detail"><span>Phone (ফোন)</span><strong>{{ appointment.phone }}</strong></div>
        <div class="patient-banner-detail"><span>Visit date (ভিজিটের তারিখ)</span><strong>{{ formatDate(appointment.date) }}</strong></div>
        <div class="patient-serial"><span>Serial (সিরিয়াল)</span><strong>{{ appointment.serial_number }}</strong></div>
      </section>

      <div class="mock-data-note"><FileText :size="17" /><span><strong>Clinical record</strong> — save each section to store it in the patient record.</span></div>

      <nav class="consultation-tabs" aria-label="Doctor visit pages">
        <RouterLink v-if="isInvestigationPage" class="visit-page-link" :to="{ name: 'doctor.appointment', params: { serialNumber: route.params.serialNumber } }"><Stethoscope :size="17" /> Consultation & Prescription</RouterLink>
        <button v-if="!isInvestigationPage" class="visit-page-link visit-tab-button" :class="{ active: activeClinicalTab === 'consultation' }" type="button" role="tab" :aria-selected="activeClinicalTab === 'consultation'" @click="activeClinicalTab = 'consultation'"><Stethoscope :size="17" /> Consultation (পরামর্শ)</button>
        <button v-if="!isInvestigationPage" class="visit-page-link visit-tab-button" :class="{ active: activeClinicalTab === 'prescription' }" type="button" role="tab" :aria-selected="activeClinicalTab === 'prescription'" @click="activeClinicalTab = 'prescription'"><Pill :size="17" /> Prescription</button>
        <RouterLink class="visit-page-link" :class="{ active: isInvestigationPage }" :to="{ name: 'doctor.appointment.investigations', params: { serialNumber: route.params.serialNumber } }"><FlaskConical :size="17" /> Investigation & follow-up</RouterLink>
      </nav>

      <template v-if="!isInvestigationPage">
      <section v-if="activeClinicalTab === 'consultation'" class="workspace-grid">
        <div class="card workspace-card">
          <div class="section-heading">
            <div class="section-icon blue"><Stethoscope :size="18" /></div>
          <div><h2>Consultation notes (পরামর্শের নোট)</h2><p>Record the patient’s symptoms and examination findings (রোগীর লক্ষণ ও পরীক্ষার পর্যবেক্ষণ লিখুন)।</p></div>
          </div>
          <div class="form-grid">
            <label class="field full"><span>Chief complaint (প্রধান অভিযোগ) <b>*</b></span><textarea v-model="notes.complaint" rows="3" placeholder="What problem brought the patient in today? (রোগী আজ কী সমস্যা নিয়ে এসেছেন?)"></textarea></label>
            <label class="field"><span>Affected eye (আক্রান্ত চোখ)</span><select v-model="notes.eye"><option value="Both">Both eyes (দুই চোখ)</option><option value="Right">Right eye (ডান চোখ)</option><option value="Left">Left eye (বাম চোখ)</option><option value="Not specified">Not specified (উল্লেখ নেই)</option></select></label>
            <label class="field"><span>Vision / visual acuity (দৃষ্টিশক্তি)</span><input v-model="notes.vision" placeholder="e.g. R 6/6 · L 6/9 (যেমন: ডান ৬/৬ · বাম ৬/৯)" /></label>
            <label class="field full"><span>Examination findings (পরীক্ষার পর্যবেক্ষণ)</span><textarea v-model="notes.examination" rows="4" placeholder="Enter relevant eye examination findings (চোখ পরীক্ষার পর্যবেক্ষণ লিখুন)"></textarea></label>
            <label class="field full"><span>Assessment / diagnosis (মূল্যায়ন / রোগ নির্ণয়)</span><textarea v-model="notes.assessment" rows="3" placeholder="Doctor’s assessment or diagnosis (ডাক্তারের মূল্যায়ন বা রোগ নির্ণয়)"></textarea></label>
            <label class="field full"><span>Additional notes (অতিরিক্ত নোট)</span><textarea v-model="notes.plan" rows="2" placeholder="Follow-up advice or other clinical notes (পরবর্তী পরামর্শ বা ক্লিনিক্যাল নোট)"></textarea></label>
          </div>
        </div>

        <aside class="side-column">
          <div class="card side-card">
            <div class="side-title"><HeartPulse :size="17" /><h2>Visit progress (ভিজিটের অগ্রগতি)</h2></div>
            <ol class="progress-list">
              <li class="current"><span>1</span><div><strong>Consultation (পরামর্শ)</strong><small>Symptoms and examination (লক্ষণ ও পরীক্ষা)</small></div></li>
              <li><span>2</span><div><strong>Prescription</strong><small>Medicine instructions</small></div></li>
              <li><span>3</span><div><strong>Investigation</strong><small>Tests and per-test discount</small></div></li>
              <li><span>4</span><div><strong>Review</strong><small>Reports and next treatment</small></div></li>
            </ol>
          </div>
          <div class="info-note"><FileText :size="17" /><p>Patient details were entered by the assistant (সহকারী রোগীর তথ্য দিয়েছেন)। Check them before saving clinical notes (নোট সংরক্ষণের আগে তথ্য যাচাই করুন)।</p></div>
        </aside>
      </section>

      <section v-else class="card workspace-card">
        <div class="section-heading prescription-heading">
          <div class="section-icon violet"><Pill :size="18" /></div>
          <div><h2>Prescription</h2><p>Select medicines and enter the patient’s instructions.</p></div>
          <label class="field stage-select"><span>Prescription stage</span><select v-model="prescriptionStage" @change="loadPrescriptionStage"><option value="initial">Initial prescription</option><option value="follow_up">After report review</option></select></label>
        </div>
        <div class="medicine-list">
          <article v-for="(row, index) in medicines" :key="row.key" class="medicine-row">
            <div class="medicine-row-head"><strong>Medicine {{ index + 1 }}</strong><button class="icon-button danger" type="button" aria-label="Remove medicine" @click="removeMedicine(row.key)"><Trash2 :size="16" /></button></div>
            <div class="medicine-fields">
              <label class="field medicine-name"><span>Medicine <b>*</b></span><select v-model="row.medicine_id" @change="medicineChanged(row)"><option value="">Select medicine</option><option v-for="medicine in medicineOptions" :key="medicine.id" :value="medicine.id">{{ medicine.name }} · {{ medicine.dosage_form }}</option></select></label>
              <label class="field"><span>Strength</span><input v-model="row.strength" placeholder="e.g. 0.5%" /></label>
              <label class="field"><span>Dose</span><input v-model="row.dose" placeholder="e.g. 1 drop" /></label>
              <label class="field"><span>Frequency</span><input v-model="row.frequency" placeholder="e.g. 4 times daily" /></label>
              <label class="field"><span>Duration</span><input v-model="row.duration" placeholder="e.g. 7 days" /></label>
              <label class="field"><span>Route</span><input v-model="row.route" placeholder="e.g. Ophthalmic, oral" /></label>
              <label class="field"><span>Eye side</span><select v-model="row.eye_side"><option value="">Not applicable</option><option>Both eyes</option><option>Right eye</option><option>Left eye</option></select></label>
              <label class="field medicine-instructions"><span>Instructions</span><input v-model="row.instructions" placeholder="e.g. Shake well before use" /></label>
            </div>
          </article>
        </div>
        <button class="btn btn-outline add-medicine" type="button" @click="addMedicine"><Plus :size="16" /> Add another medicine</button>
        <div class="form-grid followup-field"><label class="field full"><span>Prescription advice</span><textarea v-model="prescriptionAdvice" rows="3" placeholder="General advice for the patient"></textarea></label></div>
      </section>
      </template>

      <template v-else>
      <section class="workspace-grid">
        <div class="card workspace-card">
          <div class="section-heading">
            <div class="section-icon cyan"><FlaskConical :size="18" /></div>
            <div><h2>Investigation request</h2><p>Sample test orders and doctor-approved discounts.</p></div>
            <span class="stage-chip">Pending payment</span>
          </div>
          <div class="linked-receipt pending-order-note"><FileText :size="18" /><div><strong>Take this request to the cash counter</strong><span>Payment has not been collected. This document is not a money receipt.</span></div><span class="linked-tag">Not paid</span></div>
          <div class="investigation-preview">
            <label class="field"><span>Investigation</span><select v-model="investigationId"><option value="">Select from investigations</option><option v-for="investigation in investigationOptions" :key="investigation.id" :value="investigation.id">{{ investigation.name }}</option></select></label>
            <label class="field"><span>Price (BDT)</span><input :value="selectedInvestigation ? formatAmount(selectedInvestigation.price) : ''" placeholder="Select an investigation" readonly /></label>
            <label class="field discount-field"><span>Discount (BDT)</span><input v-model="investigationDiscount" type="number" min="0" placeholder="0.00" /></label>
            <button class="btn btn-outline add-investigation" type="button" @click="addInvestigation"><Plus :size="16" /> Add</button>
          </div>
          <div v-if="investigations.length" class="ordered-tests">
            <div v-for="(item, index) in investigations" :key="item.key" class="ordered-test-item">
              <div v-if="editingInvestigationKey === item.key" class="investigation-edit-row">
                <label class="field"><span>Investigation</span><select v-model="investigationEditDraft.investigation_id"><option value="">Select from investigations</option><option v-for="investigation in investigationOptions" :key="investigation.id" :value="investigation.id">{{ investigation.name }}</option></select></label>
                <label class="field"><span>Price (BDT)</span><input :value="selectedEditInvestigation ? formatAmount(selectedEditInvestigation.price) : ''" placeholder="Select an investigation" readonly /></label>
                <label class="field"><span>Discount (BDT)</span><input v-model="investigationEditDraft.discount" type="number" min="0" :max="selectedEditInvestigation?.price || 0" step="0.01" /></label>
                <div class="investigation-edit-actions"><button class="btn btn-outline btn-sm" type="button" @click="cancelEditInvestigation">Cancel</button><button class="btn btn-primary btn-sm" type="button" @click="applyInvestigationEdit(item)">Done</button></div>
              </div>
              <div v-else class="ordered-test">
                <div><strong>{{ item.name }}</strong><span>Fee {{ formatAmount(item.price) }} BDT</span></div>
                <div class="ordered-test-discount"><small>Doctor discount</small><strong>{{ formatAmount(item.discount) }}</strong></div>
                <div class="ordered-test-payable"><small>Payable</small><strong>{{ formatAmount(item.price - item.discount) }}</strong></div>
                <button v-if="item.status === 'pending' && item.is_paid === false" class="btn btn-outline btn-sm edit-investigation" type="button" :disabled="saving" @click="beginEditInvestigation(item)"><Pencil :size="14" /> Edit</button>
                <button v-if="item.status === 'pending' && item.is_paid === false" class="icon-button danger" type="button" aria-label="Remove investigation" :disabled="saving" @click="removeInvestigation(index)"><Trash2 :size="15" /></button>
              </div>
            </div>
          </div>
          <div v-else class="empty-tests">Investigation items will appear here when selected.</div>
          <div class="order-total-row"><span>Amount due at cash counter</span><strong>{{ formatAmount(investigationPayableTotal) }} BDT</strong></div>
        </div>
        <aside class="side-column">
          <div class="card side-card followup-card">
            <div class="side-title"><Activity :size="17" /><h2>After report review</h2></div>
            <p>Once tests are completed, reopen this visit and record the next treatment decision.</p>
            <label class="choice-card"><input v-model="followupPlan" type="radio" value="none" /><span><strong>No further treatment decision</strong><small>Choose a follow-up plan later</small></span></label>
            <label class="choice-card"><input v-model="followupPlan" type="radio" value="additional_prescription" /><span><strong>Additional prescription</strong><small>Add medicine after reviewing the report</small></span></label>
            <label class="choice-card"><input v-model="followupPlan" type="radio" value="operation" /><span><strong>Operation recommendation</strong><small>Record procedure and eye side</small></span></label>
            <template v-if="followupPlan === 'operation'">
              <label class="field followup-notes"><span>Recommended procedure</span><input v-model="operationProcedure" placeholder="Enter the recommended operation" /></label>
              <label class="field followup-notes"><span>Operation eye</span><select v-model="operationEyeSide"><option value="">Select eye</option><option>Both eyes</option><option>Right eye</option><option>Left eye</option></select></label>
            </template>
            <label class="field followup-notes"><span>Follow-up note</span><textarea v-model="followupNote" rows="3" placeholder="Optional note for report review"></textarea></label>
          </div>
        </aside>
      </section>
      </template>

      <footer class="workspace-footer">
        <span><span class="draft-dot" :class="{ saved: savedAt }"></span>{{ savedAt ? `Last saved ${savedAt} · save again after edits` : 'Changes are not saved automatically · click Save to persist' }}</span>
        <div><button class="btn btn-outline" type="button" @click="printPreviewOpen = true"><Printer :size="16" /> {{ isInvestigationPage ? 'Print order slip' : 'Print consultation & prescription' }}</button><button class="btn btn-primary" type="button" :disabled="saving" @click="saveCurrentSection"><LoaderCircle v-if="saving" :size="16" class="spin" /><Save v-else :size="16" /> {{ saving ? 'Saving…' : 'Save' }}</button></div>
      </footer>
    </template>
  </div>

  <Teleport to="body">
    <div v-if="printPreviewOpen" class="print-preview-root">
      <div class="print-preview-backdrop" @click.self="printPreviewOpen = false">
        <section class="print-preview-sheet" role="dialog" aria-modal="true" aria-labelledby="print-preview-title">
          <div class="print-preview-actions">
            <span>Print preview · Sample only</span>
            <div>
              <button class="btn btn-outline" type="button" @click="printPreviewOpen = false">Close preview</button>
              <button class="btn btn-primary" type="button" @click="printDocument"><Printer :size="16" /> Print</button>
            </div>
          </div>

          <article class="print-document" :class="{ 'investigation-print-document': isInvestigationPage }">
            <header class="print-document-header">
              <div class="print-brand-mark"><Eye :size="24" /></div>
              <div><h1>PARAMITA EYE HOSPITAL</h1><p>{{ isInvestigationPage ? 'Investigation Request / Payment Slip' : 'Consultation & Prescription' }}</p></div>
              <div class="print-sample-stamp">PREVIEW COPY</div>
            </header>

            <h2 id="print-preview-title" class="print-document-title">{{ isInvestigationPage ? 'Investigation Request' : 'Consultation & Prescription' }}</h2>
            <section class="print-patient-grid" aria-label="Patient details">
              <div><span>Patient</span><strong>{{ appointment?.name || '—' }}</strong></div>
              <div><span>Age / gender</span><strong>{{ appointment?.age || '—' }} years · {{ appointment?.gender || '—' }}</strong></div>
              <div><span>Phone</span><strong>{{ appointment?.phone || '—' }}</strong></div>
              <div><span>Visit date</span><strong>{{ formatDate(appointment?.date) }}</strong></div>
              <div><span>Serial</span><strong>{{ appointment?.serial_number || route.params.serialNumber }}</strong></div>
              <div v-if="isInvestigationPage"><span>Order number</span><strong>{{ investigationOrderNumber }}</strong></div>
            </section>

            <template v-if="!isInvestigationPage">
            <section class="print-section">
              <h3>Consultation (পরামর্শ)</h3>
              <div class="print-detail-grid">
                <div class="print-detail wide"><span>Chief complaint (প্রধান অভিযোগ)</span><p>{{ notes.complaint || '—' }}</p></div>
                <div class="print-detail"><span>Affected eye (আক্রান্ত চোখ)</span><p>{{ notes.eye === 'Both' ? 'Both eyes (দুই চোখ)' : notes.eye }}</p></div>
                <div class="print-detail"><span>Visual acuity (দৃষ্টিশক্তি)</span><p>{{ notes.vision || '—' }}</p></div>
                <div class="print-detail wide"><span>Examination findings (পরীক্ষার পর্যবেক্ষণ)</span><p>{{ notes.examination || '—' }}</p></div>
                <div class="print-detail wide"><span>Assessment / diagnosis (মূল্যায়ন / রোগ নির্ণয়)</span><p>{{ notes.assessment || '—' }}</p></div>
                <div class="print-detail wide"><span>Additional notes (অতিরিক্ত নোট)</span><p>{{ notes.plan || '—' }}</p></div>
              </div>
            </section>

            <section class="print-section">
              <h3>Prescription <small>{{ prescriptionStage === 'follow_up' ? 'After report review' : 'Initial' }}</small></h3>
              <table class="print-table">
                <thead><tr><th>#</th><th>Medicine</th><th>Strength</th><th>Dose & route</th><th>Frequency</th><th>Duration</th></tr></thead>
                <tbody>
                  <tr v-for="(row, index) in medicines" :key="row.id">
                    <td>{{ index + 1 }}</td><td>{{ medicineName(row.medicine_id) || '—' }}</td><td>{{ row.strength || '—' }}</td>
                    <td>{{ row.dose || '—' }}<br /><small>{{ [row.route, row.eye_side].filter(Boolean).join(' · ') || '—' }}</small></td>
                    <td>{{ row.frequency || '—' }}</td><td>{{ row.duration || '—' }}</td>
                  </tr>
                </tbody>
              </table>
              <div class="print-detail print-advice"><span>Advice</span><p>{{ prescriptionAdvice || '—' }}</p></div>
              <div v-for="(row, index) in medicines" :key="`instruction-${row.key}`" class="print-medicine-instruction"><strong>{{ index + 1 }}. {{ medicineName(row.medicine_id) || 'Medicine' }}:</strong> {{ row.instructions || '—' }}</div>
            </section>

            <footer class="print-document-footer">
              <div><span>Doctor’s signature</span><i></i></div>
              <div><span>Patient / guardian signature</span><i></i></div>
              <p>Preview copy — save the clinical record before using it for patient care.</p>
            </footer>
            </template>

            <template v-else>
              <section class="print-order-status">
                <div><span>Payment status</span><strong>Pending payment</strong></div>
                <div><span>Ordering doctor</span><strong>{{ appointment?.doctor?.name || appointment?.doctor_name || '—' }}</strong></div>
              </section>
              <section v-if="followupPlan === 'operation' && (operationProcedure || operationEyeSide)" class="print-order-status operation-recommendation">
                <div><span>Operation recommendation</span><strong>{{ operationProcedure || '—' }}</strong></div>
                <div><span>Eye</span><strong>{{ operationEyeSide || '—' }}</strong></div>
              </section>
              <section class="print-section">
                <h3>Requested investigations</h3>
                <table class="print-table investigation-print-table">
                  <thead><tr><th>#</th><th>Investigation</th><th>Fee (BDT)</th><th>Discount (BDT)</th><th>Payable (BDT)</th></tr></thead>
                  <tbody>
                    <tr v-for="(item, index) in investigations" :key="item.key">
                      <td>{{ index + 1 }}</td><td>{{ item.name }}</td><td>{{ formatAmount(item.price) }}</td><td>{{ formatAmount(item.discount) }}</td><td>{{ formatAmount(item.price - item.discount) }}</td>
                    </tr>
                    <tr v-if="!investigations.length"><td colspan="5">No investigations listed.</td></tr>
                  </tbody>
                  <tfoot v-if="investigations.length">
                    <tr><th colspan="2">Totals</th><th>{{ formatAmount(investigationFeeTotal) }}</th><th>{{ formatAmount(investigationDiscountTotal) }}</th><th>{{ formatAmount(investigationPayableTotal) }}</th></tr>
                  </tfoot>
                </table>
              </section>
              <div class="print-payment-instruction"><strong>Take this slip to the cash counter for payment.</strong><span>This is an investigation request only. It is not a money receipt and payment has not been collected. {{ savedAt ? '' : 'Save this order before taking it to the counter.' }}</span></div>
              <footer class="print-document-footer investigation-slip-footer">
                <div><span>Ordering doctor’s signature</span><i></i></div>
                <p>Preview copy — save this order before taking it to the counter; payment is still pending.</p>
              </footer>
            </template>
          </article>
        </section>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { Activity, ArrowLeft, Eye, FileCheck2, FilePlus2, FileText, FlaskConical, HeartPulse, LoaderCircle, Pencil, Pill, Plus, Printer, Save, Stethoscope, Trash2, UserRound } from '@lucide/vue'
import { toast } from 'vue-sonner'
import api from '../api/axios'

const route = useRoute()
const appointment = ref(null)
const loading = ref(false)
const starting = ref(false)
const errorMessage = ref('')
const printPreviewOpen = ref(false)
const isInvestigationPage = computed(() => route.name === 'doctor.appointment.investigations')
const activeClinicalTab = ref('consultation')
const notes = ref({ complaint: '', eye: '', vision: '', examination: '', assessment: '', plan: '' })
const prescriptionAdvice = ref('')
const medicines = ref([])
const medicineOptions = ref([])
const investigationOptions = ref([])
const prescriptionStage = ref('initial')
const investigationId = ref('')
const investigationDiscount = ref('0')
const investigations = ref([])
const editingInvestigationKey = ref(null)
const investigationEditDraft = ref({ investigation_id: '', discount: 0 })
const selectedInvestigation = computed(() => investigationOptions.value.find((item) => Number(item.id) === Number(investigationId.value)) || null)
const selectedEditInvestigation = computed(() => investigationOptions.value.find((item) => Number(item.id) === Number(investigationEditDraft.value.investigation_id)) || null)
const followupPlan = ref('none')
const followupNote = ref('')
const operationProcedure = ref('')
const operationEyeSide = ref('')
const saving = ref(false)
const savedAt = ref('')
const investigationFeeTotal = computed(() => investigations.value.reduce((total, item) => total + Number(item.price || 0), 0))
const investigationDiscountTotal = computed(() => investigations.value.reduce((total, item) => total + Number(item.discount || 0), 0))
const investigationPayableTotal = computed(() => investigationFeeTotal.value - investigationDiscountTotal.value)
const investigationOrderNumber = computed(() => {
  const year = String(appointment.value?.date || '').slice(0, 4) || '2026'
  const order = appointment.value?.consultation?.investigation_orders?.filter((item) => item.status === 'open').at(-1)
  return order ? `IO-${year}-${String(order.id).padStart(5, '0')}` : `Draft · ${year}-${String(appointment.value?.serial_number || route.params.serialNumber).padStart(4, '0')}`
})

onMounted(loadAppointment)

async function loadAppointment() {
  loading.value = true
  errorMessage.value = ''
  try {
    const [appointmentResponse, catalogResponse] = await Promise.all([
      api.get(`/doctor/appointments/${route.params.serialNumber}`),
      api.get('/doctor/clinical-catalogs'),
    ])
    appointment.value = appointmentResponse.data.data || appointmentResponse.data
    medicineOptions.value = catalogResponse.data.data?.medicines || []
    investigationOptions.value = catalogResponse.data.data?.investigations || []
    hydrateClinicalData()
  } catch (error) {
    errorMessage.value = error.response?.data?.message || 'This appointment could not be loaded.'
  } finally {
    loading.value = false
  }
}

async function startPrescription() {
  starting.value = true
  errorMessage.value = ''
  try {
    const { data } = await api.post(`/doctor/appointments/${route.params.serialNumber}/start-prescription`)
    appointment.value = { ...appointment.value, ...(data.data || data) }
    toast.success('Consultation started.')
  } catch (error) {
    errorMessage.value = error.response?.data?.message || 'The consultation could not be started.'
  } finally {
    starting.value = false
  }
}

function addMedicine() {
  medicines.value.push({ id: null, key: `new-${Date.now()}-${Math.random()}`, medicine_id: '', strength: '', dose: '', frequency: '', duration: '', route: '', eye_side: '', instructions: '' })
}

function removeMedicine(key) {
  medicines.value = medicines.value.filter((item) => item.key !== key)
}

function addInvestigation() {
  if (!investigationId.value) {
    toast('Select an investigation first.')
    return
  }
  const selectedInvestigation = investigationOptions.value.find((item) => Number(item.id) === Number(investigationId.value))
  if (!selectedInvestigation) return
  if (investigations.value.some((item) => Number(item.investigation_id) === Number(selectedInvestigation.id))) {
    toast('This investigation is already in the order.')
    return
  }
  const discount = Math.max(0, Math.min(Number(investigationDiscount.value) || 0, Number(selectedInvestigation.price)))
  investigations.value.push({ key: `new-${Date.now()}-${Math.random()}`, investigation_id: selectedInvestigation.id, name: selectedInvestigation.name, price: Number(selectedInvestigation.price), discount, id: null, status: 'pending', is_paid: false })
  investigationId.value = ''
  investigationDiscount.value = '0'
  savedAt.value = ''
}

function removeInvestigation(index) {
  investigations.value.splice(index, 1)
  savedAt.value = ''
}

function beginEditInvestigation(item) {
  if (item.status !== 'pending' || item.is_paid !== false || saving.value) return
  editingInvestigationKey.value = item.key
  investigationEditDraft.value = {
    investigation_id: item.investigation_id,
    discount: Number(item.discount) || 0,
  }
}

function cancelEditInvestigation() {
  editingInvestigationKey.value = null
  investigationEditDraft.value = { investigation_id: '', discount: 0 }
}

function applyInvestigationEdit(item) {
  if (item.status !== 'pending' || item.is_paid !== false) {
    toast.error('Only unpaid investigations can be edited.')
    cancelEditInvestigation()
    return
  }
  if (!selectedEditInvestigation.value) {
    toast.error('Select an investigation first.')
    return
  }
  const duplicate = investigations.value.some((row) => row.key !== item.key && Number(row.investigation_id) === Number(selectedEditInvestigation.value.id))
  if (duplicate) {
    toast.error('This investigation is already in the order.')
    return
  }
  const discount = Number(investigationEditDraft.value.discount) || 0
  if (discount < 0 || discount > Number(selectedEditInvestigation.value.price)) {
    toast.error('Discount cannot exceed the investigation fee.')
    return
  }
  Object.assign(item, {
    investigation_id: selectedEditInvestigation.value.id,
    name: selectedEditInvestigation.value.name,
    price: Number(selectedEditInvestigation.value.price),
    discount,
  })
  cancelEditInvestigation()
  savedAt.value = ''
}

function medicineChanged(row) {
  const medicine = medicineOptions.value.find((item) => Number(item.id) === Number(row.medicine_id))
  if (!medicine) return
  row.strength = medicine.strength || ''
  row.route = medicine.route || ''
}

function medicineName(id) {
  return medicineOptions.value.find((item) => Number(item.id) === Number(id))?.name
    || medicines.value.find((item) => Number(item.medicine_id) === Number(id))?.medicine_name
    || ''
}

function hydrateClinicalData() {
  const consultation = appointment.value?.consultation
  notes.value = {
    complaint: consultation?.chief_complaint || '',
    eye: consultation?.affected_eye || '',
    vision: consultation?.visual_acuity || '',
    examination: consultation?.examination_findings || '',
    assessment: consultation?.assessment || '',
    plan: consultation?.notes || '',
  }
  followupPlan.value = consultation?.follow_up_plan || 'none'
  followupNote.value = consultation?.follow_up_note || ''
  operationProcedure.value = consultation?.operation_procedure || ''
  operationEyeSide.value = consultation?.operation_eye_side || ''
  loadPrescriptionStage()
  const order = consultation?.investigation_orders?.filter((item) => item.status === 'open').at(-1)
  investigations.value = (order?.items || []).map((item) => ({
    key: `saved-${item.id}`,
    id: item.id,
    investigation_id: item.investigation_id,
    name: item.name,
    price: Number(item.price),
    discount: Number(item.doctor_discount),
    status: item.status,
    is_paid: item.is_paid === true,
  }))
}

function loadPrescriptionStage() {
  const consultation = appointment.value?.consultation
  const prescription = consultation?.prescriptions?.filter((item) => item.stage === prescriptionStage.value).at(-1)
  prescriptionAdvice.value = prescription?.notes || ''
  medicines.value = (prescription?.items || []).map((item) => ({
    id: item.id,
    key: `saved-${item.id}`,
    medicine_id: item.medicine_id,
    medicine_name: item.medicine_name,
    strength: item.strength || '',
    dose: item.dose || '',
    frequency: item.frequency || '',
    duration: item.duration || '',
    route: item.route || '',
    eye_side: item.eye_side || '',
    instructions: item.instructions || '',
    quantity: item.quantity,
  }))
}

async function saveCurrentSection() {
  if (isInvestigationPage.value && editingInvestigationKey.value !== null) {
    toast.error('Finish or cancel the investigation edit before saving.')
    return
  }
  if (isInvestigationPage.value) return saveInvestigationOrder()
  if (activeClinicalTab.value === 'prescription') return savePrescription()
  return saveConsultation()
}

async function saveConsultation() {
  if (!notes.value.complaint.trim()) {
    toast.error('Chief complaint is required.')
    return
  }
  await saveSection('consultation', {
    chief_complaint: notes.value.complaint,
    affected_eye: notes.value.eye || null,
    visual_acuity: notes.value.vision || null,
    examination_findings: notes.value.examination || null,
    assessment: notes.value.assessment || null,
    notes: notes.value.plan || null,
  }, 'Consultation saved.')
}

async function savePrescription() {
  if (!medicines.value.length || medicines.value.some((item) => !item.medicine_id)) {
    toast.error('Add at least one medicine and select it from the catalog.')
    return
  }
  const items = medicines.value.map((item) => ({
    ...(item.id ? { id: item.id } : {}),
    medicine_id: Number(item.medicine_id),
    strength: item.strength || null,
    route: item.route || null,
    dose: item.dose || null,
    frequency: item.frequency || null,
    duration: item.duration || null,
    quantity: item.quantity || null,
    eye_side: item.eye_side || null,
    instructions: item.instructions || null,
  }))
  await saveSection('prescription', { stage: prescriptionStage.value, notes: prescriptionAdvice.value || null, consultation: consultationPayload(), items }, 'Prescription saved.')
}

async function saveInvestigationOrder() {
  const items = investigations.value.map((item) => ({ investigation_id: Number(item.investigation_id), doctor_discount: Number(item.discount) || 0 }))
  await saveSection('investigation-order', {
    items,
    consultation: consultationPayload(),
    follow_up_plan: followupPlan.value,
    follow_up_note: followupNote.value || null,
    operation_procedure: operationProcedure.value || null,
    operation_eye_side: operationEyeSide.value || null,
  }, items.length ? 'Investigation order saved. No payment receipt was created.' : 'Follow-up decision saved. No investigation order was created.')
}

function consultationPayload() {
  return {
    chief_complaint: notes.value.complaint || null,
    affected_eye: notes.value.eye || null,
    visual_acuity: notes.value.vision || null,
    examination_findings: notes.value.examination || null,
    assessment: notes.value.assessment || null,
    notes: notes.value.plan || null,
  }
}

async function saveSection(section, payload, successMessage) {
  saving.value = true
  errorMessage.value = ''
  try {
    const { data } = await api.put(`/doctor/appointments/${route.params.serialNumber}/${section}`, payload)
    appointment.value = data.data || data
    hydrateClinicalData()
    savedAt.value = new Intl.DateTimeFormat('en-BD', { hour: 'numeric', minute: '2-digit' }).format(new Date())
    toast.success(successMessage)
  } catch (error) {
    const errors = error.response?.data?.errors
    const firstError = errors ? Object.values(errors).flat()[0] : null
    errorMessage.value = firstError || error.response?.data?.message || 'The clinical record could not be saved.'
    toast.error(errorMessage.value)
  } finally {
    saving.value = false
  }
}

function formatAmount(value) {
  return new Intl.NumberFormat('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(value) || 0)
}

function printDocument() {
  window.print()
}

function formatDate(value) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('en-BD', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(`${value}T00:00:00`))
}

function statusClass(status) {
  return { waiting: 'warning', in_progress: 'info', completed: 'success' }[status] || 'neutral'
}

function statusLabel(status) {
  return { waiting: 'Waiting', in_progress: 'In progress', completed: 'Completed' }[status] || 'Waiting'
}
</script>

<style scoped>
.doctor-consultation { display: grid; gap: 17px; padding-bottom: 8px; }
.doctor-consultation .page-head { margin: 0; align-items: center; }
.back-link { display: inline-flex; align-items: center; gap: 6px; margin-bottom: 7px; color: var(--primary); font-size: 13px; font-weight: 700; }
.page-title span { color: var(--primary); }
.head-actions { display: flex; align-items: center; gap: 12px; }
.detail-status { min-height: 40px; display: inline-flex; align-items: center; }
.patient-banner { display: flex; align-items: center; gap: 17px; padding: 17px 20px; }
.patient-avatar { width: 46px; height: 46px; flex: 0 0 auto; display: grid; place-items: center; border-radius: 14px; color: white; background: linear-gradient(135deg, #6366f1, #06b6d4); }
.patient-banner-name, .patient-banner-detail, .patient-serial { display: grid; gap: 4px; }
.patient-banner-name { min-width: 150px; }
.patient-banner-name span, .patient-banner-detail span, .patient-serial span { color: var(--muted); font-size: 11px; }
.patient-banner-name strong { font-size: 16px; text-transform: capitalize; }
.patient-banner-detail { padding-left: 18px; border-left: 1px solid var(--border); }
.patient-banner-detail strong, .patient-serial strong { color: var(--text); font-size: 13px; }
.patient-serial { margin-left: auto; text-align: right; }
.mock-data-note { display: flex; align-items: center; gap: 10px; padding: 12px 15px; border: 1px solid #fed7aa; border-radius: 12px; color: #c2410c; background: #fff7ed; font-size: 12px; }
.mock-data-note strong { margin-right: 4px; }
.print-preview-root { position: relative; z-index: 150; }
.print-preview-backdrop { position: fixed; inset: 0; display: grid; place-items: center; overflow: auto; padding: 20px; background: rgba(15, 23, 42, .64); }
.print-preview-sheet { width: min(940px, 100%); max-height: calc(100vh - 40px); overflow: auto; border-radius: 16px; background: #f1f5f9; box-shadow: 0 24px 80px #0f172a55; }
.print-preview-actions { position: sticky; top: 0; z-index: 2; display: flex; align-items: center; justify-content: space-between; gap: 14px; padding: 12px 16px; border-bottom: 1px solid var(--border); color: var(--muted); background: #fff; font-size: 12px; }
.print-preview-actions > div { display: flex; gap: 8px; }
.print-document { width: min(210mm, calc(100% - 40px)); min-height: 260mm; margin: 20px auto; padding: 18mm 15mm; color: #172033; background: #fff; box-shadow: 0 5px 22px #0f172a1c; font-family: Arial, sans-serif; font-size: 11px; line-height: 1.45; }
.print-document-header { display: grid; grid-template-columns: 42px 1fr auto; align-items: center; gap: 12px; padding-bottom: 15px; border-bottom: 2px solid #5b45e8; }
.print-brand-mark { display: grid; place-items: center; width: 40px; height: 40px; border-radius: 12px; color: #fff; background: linear-gradient(135deg, #5b45e8, #08a9d0); }
.print-document-header h1 { margin: 0; color: #172033; font-size: 17px; letter-spacing: .3px; }
.print-document-header p { margin: 3px 0 0; color: #64748b; font-size: 11px; }
.print-sample-stamp { padding: 6px 9px; border: 1px solid #ea580c; border-radius: 6px; color: #c2410c; font-size: 9px; font-weight: 800; letter-spacing: .5px; text-align: center; }
.print-document-title { margin: 17px 0 12px; font-size: 16px; }
.print-patient-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); border: 1px solid #dbe2ed; border-radius: 7px; }
.print-patient-grid > div { display: grid; gap: 3px; min-height: 52px; align-content: center; padding: 8px 10px; border-right: 1px solid #dbe2ed; border-bottom: 1px solid #dbe2ed; }
.print-patient-grid > div:nth-child(3n) { border-right: 0; }
.print-patient-grid > div:nth-last-child(-n + 2) { border-bottom: 0; }
.print-patient-grid span, .print-detail > span { color: #64748b; font-size: 9px; }
.print-patient-grid strong { font-size: 10px; }
.print-section { margin-top: 17px; break-inside: avoid; }
.print-section h3 { display: flex; align-items: center; justify-content: space-between; margin: 0 0 8px; padding-bottom: 5px; border-bottom: 1px solid #cbd5e1; color: #172033; font-size: 12px; }
.print-section h3 small { color: #7c3aed; font-size: 9px; font-weight: 700; }
.print-detail-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 7px 16px; }
.print-detail { min-width: 0; }
.print-detail.wide { grid-column: 1 / -1; }
.print-detail p { margin: 2px 0 0; white-space: pre-wrap; overflow-wrap: anywhere; }
.print-table { width: 100%; border-collapse: collapse; font-size: 9px; }
.print-table th, .print-table td { padding: 6px 5px; border: 1px solid #dbe2ed; text-align: left; vertical-align: top; }
.print-table th { color: #475569; background: #f8fafc; font-size: 8px; text-transform: uppercase; }
.print-table td small { color: #64748b; font-size: 8px; }
.print-advice { margin-top: 8px; }
.print-medicine-instruction { margin-top: 4px; font-size: 9px; }
.print-document-footer { display: grid; grid-template-columns: 1fr 1fr; gap: 22px 30px; margin-top: 27px; }
.print-document-footer > div { display: grid; gap: 22px; }
.print-document-footer > div span { color: #475569; font-size: 9px; }
.print-document-footer i { display: block; width: 75%; border-top: 1px solid #64748b; }
.print-document-footer p { grid-column: 1 / -1; margin: 0; padding-top: 8px; border-top: 1px solid #e2e8f0; color: #c2410c; font-size: 9px; font-weight: 700; text-align: center; }
.print-order-status { display: flex; justify-content: space-between; gap: 16px; margin-top: 14px; padding: 10px 12px; border: 1px solid #fed7aa; border-radius: 7px; background: #fff7ed; }
.print-order-status > div { display: grid; gap: 3px; }
.print-order-status span { color: #9a3412; font-size: 9px; }
.print-order-status strong { color: #c2410c; font-size: 10px; }
.print-payment-instruction { display: grid; gap: 5px; margin-top: 15px; padding: 11px 12px; border-left: 3px solid #ea580c; background: #fff7ed; }
.print-payment-instruction strong { color: #9a3412; font-size: 10px; }
.print-payment-instruction span { color: #7c2d12; font-size: 9px; }
.investigation-slip-footer { margin-top: 24px; }
.capitalize { text-transform: capitalize; }
.consultation-tabs { display: flex; align-items: center; gap: 5px; padding: 5px; border: 1px solid var(--border); border-radius: 14px; background: #fff; width: fit-content; max-width: 100%; }
.visit-page-link { display: inline-flex; align-items: center; gap: 8px; min-height: 40px; padding: 0 15px; border-radius: 10px; color: var(--muted); font-size: 13px; font-weight: 650; text-decoration: none; white-space: nowrap; }
.visit-tab-button { border: 0; background: transparent; cursor: pointer; font-family: inherit; }
.visit-page-link.active { color: var(--primary); background: #f0efff; }
.workspace-grid { display: grid; grid-template-columns: minmax(0, 1fr) 310px; align-items: start; gap: 17px; }
.workspace-card, .side-card { padding: 21px; }
.section-heading { display: flex; align-items: center; gap: 12px; margin-bottom: 21px; }
.section-heading h2, .side-title h2 { margin: 0; color: var(--text); font-size: 16px; }
.section-heading p { margin: 4px 0 0; color: var(--muted); font-size: 12px; }
.section-icon { width: 38px; height: 38px; flex: 0 0 auto; display: grid; place-items: center; border-radius: 12px; }
.section-icon.blue { color: #2563eb; background: #eff6ff; }
.section-icon.violet { color: #6d4aff; background: #f2efff; }
.section-icon.cyan { color: #0891b2; background: #ecfeff; }
.form-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 15px; }
.field { display: grid; gap: 7px; min-width: 0; }
.field > span { color: #475569; font-size: 12px; font-weight: 650; }
.field b { color: #dc2626; }
.field input, .field select, .field textarea { width: 100%; min-height: 42px; padding: 10px 12px; border: 1px solid var(--border); border-radius: 10px; outline: none; color: var(--text); background: #fff; font: inherit; font-size: 13px; }
.field textarea { min-height: 78px; resize: vertical; }
.field input:focus, .field select:focus, .field textarea:focus { border-color: #9384ff; box-shadow: 0 0 0 3px #6d4aff16; }
.field.full { grid-column: 1 / -1; }
.side-column { display: grid; gap: 14px; }
.side-card { padding: 18px; }
.side-title { display: flex; align-items: center; gap: 9px; color: var(--primary); }
.side-title h2 { font-size: 14px; }
.progress-list { display: grid; gap: 0; margin: 18px 0 0; padding: 0; list-style: none; }
.progress-list li { position: relative; display: flex; gap: 11px; min-height: 58px; color: #94a3b8; }
.progress-list li:not(:last-child)::after { position: absolute; top: 27px; left: 12px; width: 1px; height: 31px; background: #e2e8f0; content: ''; }
.progress-list li > span { width: 25px; height: 25px; flex: 0 0 auto; display: grid; place-items: center; border: 1px solid #dbe1ea; border-radius: 50%; background: white; font-size: 11px; font-weight: 700; }
.progress-list li.current { color: var(--primary); }
.progress-list li.current > span { border-color: var(--primary); color: white; background: var(--primary); }
.progress-list li div { display: grid; align-content: start; gap: 3px; padding-top: 2px; }
.progress-list strong { color: var(--text); font-size: 12px; }
.progress-list small { color: var(--muted); font-size: 11px; }
.info-note { display: flex; gap: 10px; padding: 13px; border: 1px solid #dbeafe; border-radius: 12px; color: #2563eb; background: #eff6ff; }
.info-note p { margin: 0; color: #475569; font-size: 11px; line-height: 1.55; }
.prescription-heading { margin-bottom: 18px; }
.stage-chip, .linked-tag { margin-left: auto; padding: 7px 10px; border-radius: 999px; color: #5b45d6; background: #f2efff; font-size: 11px; font-weight: 700; white-space: nowrap; }
.stage-select { min-width: 190px; margin-left: auto; }
.medicine-list { display: grid; gap: 12px; }
.medicine-row { padding: 15px; border: 1px solid var(--border); border-radius: 13px; background: #fcfcff; }
.medicine-row-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 13px; color: var(--text); font-size: 13px; }
.medicine-fields { display: grid; grid-template-columns: 1.7fr 1fr 1fr 1.3fr 1fr 1.2fr; gap: 12px; }
.medicine-name { grid-column: span 2; }
.medicine-instructions { grid-column: span 3; }
.icon-button { width: 31px; height: 31px; display: grid; place-items: center; border: 1px solid var(--border); border-radius: 9px; color: var(--muted); background: white; cursor: pointer; }
.icon-button.danger { color: #dc2626; }
.add-medicine { margin-top: 14px; }
.followup-field { margin-top: 20px; padding-top: 18px; border-top: 1px solid var(--border); }
.linked-receipt { display: flex; align-items: center; gap: 11px; padding: 13px; border: 1px solid #bae6fd; border-radius: 12px; color: #0284c7; background: #f0f9ff; }
.linked-receipt div { display: grid; gap: 3px; }
.linked-receipt strong { color: var(--text); font-size: 12px; }
.linked-receipt span:not(.linked-tag) { color: var(--muted); font-size: 11px; }
.linked-tag { color: #0369a1; background: #dff5ff; }
.investigation-preview { display: grid; grid-template-columns: minmax(200px, 2fr) minmax(120px, 1fr) minmax(120px, 1fr) auto; align-items: end; gap: 12px; margin: 18px 0 14px; }
.investigation-preview input[readonly] { color: #475569; background: #f8fafc; }
.add-investigation { min-height: 42px; }
.ordered-tests { display: grid; }
.ordered-test-item { border-top: 1px solid var(--border); }
.ordered-test { display: flex; align-items: center; gap: 12px; padding: 12px 2px; }
.ordered-test > div:first-child { display: grid; gap: 3px; }
.ordered-test > div:first-child strong { font-size: 12px; }
.ordered-test > div:first-child span, .ordered-test-discount small { color: var(--muted); font-size: 11px; }
.ordered-test-discount { display: grid; gap: 3px; margin-left: auto; text-align: right; }
.ordered-test-discount strong { font-size: 12px; }
.ordered-test-payable { display: grid; gap: 3px; min-width: 96px; text-align: right; }
.ordered-test-payable small { color: var(--muted); font-size: 11px; }
.ordered-test-payable strong { color: #059669; font-size: 12px; }
.edit-investigation { flex: 0 0 auto; }
.investigation-edit-row { display: grid; grid-template-columns: minmax(180px, 2fr) minmax(125px, 1fr) minmax(125px, 1fr) auto; align-items: end; gap: 10px; padding: 14px 2px; }
.investigation-edit-actions { display: flex; gap: 7px; }
.investigation-edit-actions .btn { white-space: nowrap; }
.order-total-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-top: 14px; padding: 15px; border: 1px solid #c7d2fe; border-radius: 12px; background: #f5f3ff; }
.order-total-row span { color: #475569; font-size: 12px; }
.order-total-row strong { color: #5b45e8; font-size: 18px; }
.pending-order-note { border-color: #fed7aa; color: #c2410c; background: #fff7ed; }
.empty-tests { padding: 20px; border: 1px dashed #cbd5e1; border-radius: 11px; color: var(--muted); text-align: center; font-size: 12px; }
.followup-card > p { margin: 12px 0; color: var(--muted); font-size: 12px; line-height: 1.55; }
.choice-card { display: flex; align-items: flex-start; gap: 10px; margin-top: 9px; padding: 12px; border: 1px solid var(--border); border-radius: 11px; cursor: pointer; }
.choice-card input { margin-top: 3px; accent-color: var(--primary); }
.choice-card span { display: grid; gap: 4px; }
.choice-card strong { font-size: 12px; }
.choice-card small { color: var(--muted); font-size: 11px; }
.followup-notes { margin-top: 15px; }
.workspace-footer { position: sticky; bottom: 0; z-index: 2; display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 12px 15px; border: 1px solid var(--border); border-radius: 13px; background: #ffffffed; box-shadow: 0 -5px 22px #1725540a; backdrop-filter: blur(8px); }
.workspace-footer > span { display: flex; align-items: center; gap: 8px; color: var(--muted); font-size: 11px; }
.workspace-footer > div { display: flex; gap: 9px; }
.draft-dot { width: 7px; height: 7px; border-radius: 50%; background: #f59e0b; }
.draft-dot.saved { background: #10b981; }
.detail-empty { min-height: 180px; display: grid; place-items: center; color: var(--muted); }
.appointment-error { display: flex; align-items: center; justify-content: space-between; gap: 14px; padding: 12px 15px; border: 1px solid #fecaca; border-radius: 12px; color: #991b1b; background: #fff7f7; }
.spin { animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
@media (max-width: 1080px) { .workspace-grid { grid-template-columns: minmax(0, 1fr) 275px; } .medicine-fields { grid-template-columns: repeat(3, minmax(0, 1fr)); } .medicine-name, .medicine-instructions { grid-column: span 2; } }
@media (max-width: 760px) { .patient-banner { flex-wrap: wrap; } .patient-banner-detail { padding-left: 10px; } .patient-serial { margin-left: 0; text-align: left; } .workspace-grid { grid-template-columns: 1fr; } .side-column { grid-template-columns: 1fr; } .workspace-footer { position: static; align-items: stretch; flex-direction: column; } .workspace-footer > div { justify-content: flex-end; } }
@media (max-width: 760px) { .investigation-edit-row { grid-template-columns: 1fr 1fr; } .investigation-edit-row .field:first-child { grid-column: 1 / -1; } .investigation-edit-actions { grid-column: 1 / -1; justify-content: flex-end; } }
@media (max-width: 560px) { .doctor-consultation .page-head { align-items: flex-start; flex-direction: column; } .head-actions { width: 100%; justify-content: space-between; } .consultation-tabs { width: 100%; overflow-x: auto; } .visit-page-link { padding: 0 10px; font-size: 12px; } .workspace-card { padding: 16px; } .form-grid, .medicine-fields { grid-template-columns: 1fr; } .medicine-name, .medicine-instructions { grid-column: auto; } .investigation-preview { grid-template-columns: 1fr 1fr; } .investigation-preview .field:first-child { grid-column: 1 / -1; } .add-investigation { grid-column: 1 / -1; } .stage-chip { display: none; } .ordered-test { flex-wrap: wrap; } .ordered-test-payable { margin-left: auto; } .investigation-edit-row { grid-template-columns: 1fr; } .investigation-edit-row .field:first-child, .investigation-edit-actions { grid-column: auto; } }
@media print {
  @page { size: A4; margin: 12mm; }
  :global(body) { background: #fff !important; }
  :global(body > *:not(.print-preview-root)) { display: none !important; }
  .print-preview-root { position: static; z-index: auto; display: block; }
  .print-preview-backdrop { position: static; display: block; overflow: visible; padding: 0; background: #fff; }
  .print-preview-sheet { width: auto; max-height: none; overflow: visible; border-radius: 0; background: #fff; box-shadow: none; }
  .print-preview-actions { display: none; }
  .print-document { width: auto; min-height: 0; margin: 0; padding: 0; box-shadow: none; }
  .print-section, .print-table tr, .print-patient-grid, .print-detail { break-inside: avoid; }
}
</style>
