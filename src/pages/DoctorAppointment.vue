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
      <div v-if="catalogError" class="appointment-error" role="alert"><span>{{ catalogError }}</span><button class="btn btn-outline btn-sm" type="button" @click="loadClinicalCatalogs">Retry catalog</button></div>

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
            <label class="field full"><span>Chief complaint (প্রধান অভিযোগ) <b>*</b></span><textarea v-model="notes.complaint" rows="3" placeholder="What problem brought the patient in today?"></textarea></label>
            <div class="clinical-vision-row">
              <label class="field"><span>Affected eye (আক্রান্ত চোখ)</span><select v-model="notes.eye"><option value="Both">Both eyes</option><option value="Right">Right eye</option><option value="Left">Left eye</option><option value="Not specified">Not specified</option></select></label>
              <label class="field">
                <span>Right eye (R / OD)</span>
                <select v-model="visualAcuity.right">
                  <option value="">Not recorded</option><option value="6/3">6/3</option><option value="6/4">6/4</option><option value="6/5">6/5</option><option value="6/6">6/6</option><option value="6/9">6/9</option><option value="6/12">6/12</option><option value="6/18">6/18</option><option value="6/24">6/24</option><option value="6/36">6/36</option><option value="6/60">6/60</option><option value="6/120">6/120</option><option value="CF">CF (count fingers)</option><option value="HM">HM (hand motion)</option><option value="LP">LP (light perception)</option><option value="NLP">NLP (no light perception)</option><option value="custom">Custom notation</option>
                </select>
                <input v-if="visualAcuity.right === 'custom'" v-model="visualAcuity.rightCustom" aria-label="Custom right eye visual acuity" placeholder="e.g. CF at 1 m or logMAR" />
              </label>
              <label class="field">
                <span>Left eye (L / OS)</span>
                <select v-model="visualAcuity.left">
                  <option value="">Not recorded</option><option value="6/3">6/3</option><option value="6/4">6/4</option><option value="6/5">6/5</option><option value="6/6">6/6</option><option value="6/9">6/9</option><option value="6/12">6/12</option><option value="6/18">6/18</option><option value="6/24">6/24</option><option value="6/36">6/36</option><option value="6/60">6/60</option><option value="6/120">6/120</option><option value="CF">CF (count fingers)</option><option value="HM">HM (hand motion)</option><option value="LP">LP (light perception)</option><option value="NLP">NLP (no light perception)</option><option value="custom">Custom notation</option>
                </select>
                <input v-if="visualAcuity.left === 'custom'" v-model="visualAcuity.leftCustom" aria-label="Custom left eye visual acuity" placeholder="e.g. CF at 1 m or logMAR" />
              </label>
            </div>
            <label class="field full visual-acuity-note"><span>Correction / extra note</span><input v-model="visualAcuity.additional" placeholder="Optional: with glasses, without correction, pinhole, etc." /></label>
            <label class="field full"><span>Examination findings (পরীক্ষার পর্যবেক্ষণ)</span><textarea v-model="notes.examination" rows="4" placeholder="Enter relevant eye examination findings"></textarea></label>
            <label class="field full"><span>Assessment / diagnosis (মূল্যায়ন / রোগ নির্ণয়)</span><textarea v-model="notes.assessment" rows="3" placeholder="Doctor assessment or diagnosis"></textarea></label>
            <label class="field full"><span>Additional notes (অতিরিক্ত নোট)</span><textarea v-model="notes.plan" rows="2" placeholder="Follow-up advice or other clinical notes"></textarea></label>
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
              <div class="medicine-primary-fields">
              <div class="field medicine-name">
                <span>Medicine <b>*</b></span>
                <div class="medicine-combobox">
                  <div class="medicine-combobox-control">
                    <Search :size="16" aria-hidden="true" />
                    <input
                      v-model="row.medicineSearch"
                      type="search"
                      role="combobox"
                      aria-autocomplete="list" aria-label="Medicine"
                      :aria-expanded="row.medicineSearchOpen ? 'true' : 'false'"
                      :disabled="catalogLoading"
                      :placeholder="catalogLoading ? 'Loading medicines…' : medicineOptions.length ? 'Search or select a medicine' : 'No active medicines in catalog'"
                      @focus="openMedicineSearch(row)"
                      @input="filterMedicineSearch(row)"
                      @keydown.enter.prevent="selectFirstMedicine(row)"
                      @keydown.esc="row.medicineSearchOpen = false"
                      @blur="closeMedicineSearch(row)"
                    />
                    <button class="medicine-combobox-toggle" type="button" :disabled="catalogLoading || !medicineOptions.length" :aria-label="row.medicineSearchOpen ? 'Close medicine list' : 'Open medicine list'" @mousedown.prevent @click="toggleMedicineSearch(row)">
                      <ChevronDown :size="16" />
                    </button>
                  </div>
                  <div v-if="row.medicineSearchOpen" class="medicine-combobox-options">
                    <div role="listbox">
                      <div v-if="!filteredMedicineOptions(row).length" class="medicine-combobox-empty">{{ catalogLoading ? 'Loading medicines…' : row.medicineSearch.trim() ? 'No medicines match your search.' : 'Type a medicine name to search.' }}</div>
                      <button v-for="medicine in filteredMedicineOptions(row)" :key="medicine.id" class="medicine-combobox-option" type="button" role="option" :aria-selected="Number(row.medicine_id) === Number(medicine.id)" @pointerdown.prevent="selectMedicine(row, medicine)">
                        {{ medicine.name }}
                      </button>
                    </div>
                    <button v-if="row.medicineSearch.trim() && !filteredMedicineOptions(row).length && !catalogLoading" class="medicine-combobox-create" type="button" @pointerdown.prevent="startMedicineCreate(row)">
                      <Plus :size="15" /> Add “{{ row.medicineSearch.trim() }}” to medicine catalog
                    </button>
                  </div>
                </div>
              </div>
              <label class="field"><span>Strength</span><input v-model="row.strength" placeholder="e.g. 0.5%" /></label>
              <label v-if="showEyeSide(row)" class="field"><span>Eye Side</span><select v-model="row.eye_side"><option value="">Select eye side</option><option>Both eyes</option><option>Right eye</option><option>Left eye</option></select></label>
              <label class="field"><span>Dose</span><select v-model="row.dose" :disabled="!selectedMedicine(row) || !doseOptionsFor(row).length"><option value="">{{ selectedMedicine(row) ? (doseOptionsFor(row).length ? 'Select dose' : 'No dose options configured') : 'Select a medicine first' }}</option><option v-if="row.dose && !hasDoseOption(row)" :value="row.dose">{{ row.dose }} (current)</option><option v-for="option in doseOptionsFor(row)" :key="option.id" :value="option.dose">{{ option.dose }}</option></select></label>
              <label class="field"><span>Frequency</span><select v-model="row.frequency" :disabled="!frequencyOptions.length"><option value="">{{ frequencyOptions.length ? 'Select frequency' : 'No frequency options configured' }}</option><option v-if="row.frequency && !frequencyOptions.some((option) => option.frequency === row.frequency)" :value="row.frequency">{{ row.frequency }} (current)</option><option v-for="option in frequencyOptions" :key="option.id" :value="option.frequency">{{ option.frequency }}</option></select></label>
              <label class="field"><span>Duration</span><select v-model="row.duration" :disabled="!durationOptions.length"><option value="">{{ durationOptions.length ? 'Select duration' : 'No duration options configured' }}</option><option v-if="row.duration && !durationOptions.some((option) => option.duration === row.duration)" :value="row.duration">{{ row.duration }} (current)</option><option v-for="option in durationOptions" :key="option.id" :value="option.duration">{{ option.duration }}</option></select></label>
              <label v-if="showMealTiming(row)" class="field meal-timing-field"><span>Meal Time</span><select v-model="row.meal_timing" :disabled="!mealTimingOptionsFor(row).length"><option value="">{{ mealTimingOptionsFor(row).length ? 'Select meal timing' : 'No meal timing options configured' }}</option><option v-for="option in mealTimingOptionsFor(row)" :key="option.id" :value="option.meal_timing">{{ mealTimingOptionLabel(option.meal_timing) }}</option></select></label>
              </div>
              <div class="medicine-secondary-fields">
              <label class="field"><span>Route</span><input v-model="row.route" placeholder="e.g. Ophthalmic, oral" /></label>
              <label class="field medicine-instructions"><span>Instructions</span><input v-model="row.instructions" placeholder="Enter instructions" /></label>
              </div>
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
    <div v-if="medicineCreateOpen" class="medicine-create-backdrop" @click.self="closeMedicineCreate">
      <section class="medicine-create-modal" role="dialog" aria-modal="true" aria-labelledby="medicine-create-title">
        <header class="medicine-create-header">
          <div><h2 id="medicine-create-title">Add medicine to catalog</h2><p>Save it to the medicine catalog and use it in this prescription.</p></div>
          <button class="icon-button" type="button" aria-label="Close" :disabled="medicineCreateSaving" @click="closeMedicineCreate"><X :size="17" /></button>
        </header>
        <form class="medicine-create-form" @submit.prevent="createMedicineFromPrescription">
          <div class="medicine-create-fields">
            <label class="field">
              <span>Medicine name <b>*</b></span>
              <input id="new-medicine-name" v-model="newMedicineForm.name" required maxlength="255" :aria-invalid="medicineCreateErrors.name ? 'true' : 'false'" :aria-describedby="medicineCreateErrors.name ? 'new-medicine-name-error' : undefined" />
              <small v-if="medicineCreateErrors.name" id="new-medicine-name-error" class="medicine-create-error">{{ medicineCreateErrors.name }}</small>
            </label>
            <label class="field"><span>Generic name</span><input id="new-medicine-generic" v-model="newMedicineForm.generic_name" maxlength="255" :aria-invalid="medicineCreateErrors.generic_name ? 'true' : 'false'" :aria-describedby="medicineCreateErrors.generic_name ? 'new-medicine-generic-error' : undefined" /><small v-if="medicineCreateErrors.generic_name" id="new-medicine-generic-error" class="medicine-create-error">{{ medicineCreateErrors.generic_name }}</small></label>
            <label class="field"><span>Brand name</span><input id="new-medicine-brand" v-model="newMedicineForm.brand_name" maxlength="255" :aria-invalid="medicineCreateErrors.brand_name ? 'true' : 'false'" :aria-describedby="medicineCreateErrors.brand_name ? 'new-medicine-brand-error' : undefined" /><small v-if="medicineCreateErrors.brand_name" id="new-medicine-brand-error" class="medicine-create-error">{{ medicineCreateErrors.brand_name }}</small></label>
            <label class="field"><span>Strength</span><input id="new-medicine-strength" v-model="newMedicineForm.strength" maxlength="100" placeholder="e.g. 0.5% or 250 mg" :aria-invalid="medicineCreateErrors.strength ? 'true' : 'false'" :aria-describedby="medicineCreateErrors.strength ? 'new-medicine-strength-error' : undefined" /><small v-if="medicineCreateErrors.strength" id="new-medicine-strength-error" class="medicine-create-error">{{ medicineCreateErrors.strength }}</small></label>
            <label class="field">
              <span>Dosage form <b>*</b></span>
              <select id="new-medicine-dosage-form" v-model="newMedicineForm.dosage_form" required :aria-invalid="medicineCreateErrors.dosage_form ? 'true' : 'false'" :aria-describedby="medicineCreateErrors.dosage_form ? 'new-medicine-dosage-form-error' : undefined">
                <option value="">Select dosage form</option><option v-for="dosage in dosageOptions" :key="dosage.id" :value="dosage.name">{{ dosage.name }}</option>
              </select>
              <small v-if="medicineCreateErrors.dosage_form" id="new-medicine-dosage-form-error" class="medicine-create-error">{{ medicineCreateErrors.dosage_form }}</small>
            </label>
            <label class="field"><span>Category</span><input id="new-medicine-category" v-model="newMedicineForm.category" maxlength="60" placeholder="e.g. Antibiotic" :aria-invalid="medicineCreateErrors.category ? 'true' : 'false'" :aria-describedby="medicineCreateErrors.category ? 'new-medicine-category-error' : undefined" /><small v-if="medicineCreateErrors.category" id="new-medicine-category-error" class="medicine-create-error">{{ medicineCreateErrors.category }}</small></label>
            <label class="field"><span>Route</span><select id="new-medicine-route" v-model="newMedicineForm.route" :aria-invalid="medicineCreateErrors.route ? 'true' : 'false'" :aria-describedby="medicineCreateErrors.route ? 'new-medicine-route-error' : undefined"><option value="">Select route</option><option>Ophthalmic</option><option>Oral</option><option>Topical</option><option>Other</option></select><small v-if="medicineCreateErrors.route" id="new-medicine-route-error" class="medicine-create-error">{{ medicineCreateErrors.route }}</small></label>
          </div>
          <p v-if="medicineCreateError" class="medicine-create-error-summary" role="alert">{{ medicineCreateError }}</p>
          <footer class="medicine-create-footer">
            <button class="btn btn-outline" type="button" :disabled="medicineCreateSaving" @click="closeMedicineCreate">Cancel</button>
            <button class="btn btn-primary" type="submit" :disabled="medicineCreateSaving"><LoaderCircle v-if="medicineCreateSaving" :size="16" class="spin" /><Plus v-else :size="16" />{{ medicineCreateSaving ? 'Saving…' : 'Save and select' }}</button>
          </footer>
        </form>
      </section>
    </div>
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
                <div class="print-detail"><span>Affected eye (আক্রান্ত চোখ)</span><p>{{ notes.eye === 'Both' ? 'Both eyes' : notes.eye }}</p></div>
                <div class="print-detail"><span>Visual acuity (দৃষ্টিশক্তি)</span><p>{{ visualAcuityText || '—' }}</p></div>
                <div class="print-detail wide"><span>Examination findings (পরীক্ষার পর্যবেক্ষণ)</span><p>{{ notes.examination || '—' }}</p></div>
                <div class="print-detail wide"><span>Assessment / diagnosis (মূল্যায়ন / রোগ নির্ণয়)</span><p>{{ notes.assessment || '—' }}</p></div>
                <div class="print-detail wide"><span>Additional notes (অতিরিক্ত নোট)</span><p>{{ notes.plan || '—' }}</p></div>
              </div>
            </section>

            <section class="print-section">
              <h3>Prescription <small>{{ prescriptionStage === 'follow_up' ? 'After report review' : 'Initial' }}</small></h3>
              <table class="print-table">
                <thead><tr><th>#</th><th>Medicine</th><th>Strength</th><th>মাত্রা / চোখ</th><th>ব্যবহারের সময়</th><th>মেয়াদ</th><th>খাবারের সময়</th></tr></thead>
                <tbody>
                  <template v-for="(row, index) in medicines" :key="row.key">
                    <tr>
                      <td>{{ index + 1 }}</td><td>{{ medicineName(row.medicine_id) || '—' }}</td><td>{{ row.strength || '—' }}</td>
                      <td>{{ formatBanglaDose(row.dose) || '—' }}<br /><small>{{ [formatBanglaRoute(row.route), formatBanglaEyeSide(row.eye_side)].filter(Boolean).join(' · ') || '—' }}</small></td>
                      <td>{{ formatBanglaFrequency(row.frequency) || '—' }}</td><td>{{ formatBanglaDuration(row.duration) || '—' }}</td><td>{{ formatBanglaMealTiming(row.meal_timing) || '—' }}</td>
                    </tr>
                    <tr v-if="row.instructions" class="print-instruction-row">
                      <td colspan="7"><strong>নির্দেশনা:</strong> {{ formatBanglaInstruction(row.instructions) }}</td>
                    </tr>
                  </template>
                  <tr v-if="!medicines.length"><td colspan="7">No medicines listed.</td></tr>
                </tbody>
              </table>
              <div class="print-detail print-advice"><span>Advice</span><p>{{ prescriptionAdvice || '—' }}</p></div>
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
import { Activity, ArrowLeft, ChevronDown, Eye, FileCheck2, FilePlus2, FileText, FlaskConical, HeartPulse, LoaderCircle, Pencil, Pill, Plus, Printer, Save, Search, Stethoscope, Trash2, UserRound, X } from '@lucide/vue'
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
const notes = ref({ complaint: '', eye: '', examination: '', assessment: '', plan: '' })
const visualAcuity = ref({ right: '', left: '', rightCustom: '', leftCustom: '', additional: '' })
const visualAcuityText = computed(() => {
  const right = visualAcuity.value.right === 'custom' ? visualAcuity.value.rightCustom.trim() : visualAcuity.value.right
  const left = visualAcuity.value.left === 'custom' ? visualAcuity.value.leftCustom.trim() : visualAcuity.value.left
  return [right ? `R ${right}` : '', left ? `L ${left}` : '', visualAcuity.value.additional.trim()].filter(Boolean).join(', ')
})
const prescriptionAdvice = ref('')
const medicines = ref([])
const medicineOptions = ref([])
const dosageOptions = ref([])
const prescriptionInstructionOptions = ref([])
const frequencyOptions = computed(() => prescriptionInstructionOptions.value.filter((option) => option.option_type === 'frequency'))
const durationOptions = computed(() => prescriptionInstructionOptions.value.filter((option) => option.option_type === 'duration'))
const mealTimingOptions = computed(() => prescriptionInstructionOptions.value.filter((option) => option.option_type === 'meal_timing'))
const medicineCreateOpen = ref(false)
const medicineCreateSaving = ref(false)
const medicineCreateError = ref('')
const medicineCreateErrors = ref({})
const medicineCreateRow = ref(null)
const newMedicineForm = ref({ name: '', generic_name: '', brand_name: '', strength: '', dosage_form: '', category: '', route: '' })
const investigationOptions = ref([])
const catalogLoading = ref(false)
const catalogError = ref('')
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

onMounted(() => {
  loadAppointment()
  loadClinicalCatalogs()
})

async function loadAppointment() {
  loading.value = true
  errorMessage.value = ''
  try {
    const { data: appointmentResponse } = await api.get(`/doctor/appointments/${route.params.serialNumber}`)
    appointment.value = appointmentResponse.data || appointmentResponse
    hydrateClinicalData()
  } catch (error) {
    errorMessage.value = error.response?.data?.message || 'This appointment could not be loaded.'
  } finally {
    loading.value = false
  }
}

async function loadClinicalCatalogs() {
  catalogLoading.value = true
  catalogError.value = ''
  try {
    const { data: catalogResponse } = await api.get('/doctor/clinical-catalogs')
    medicineOptions.value = catalogResponse.data?.medicines || []
    dosageOptions.value = catalogResponse.data?.dosages || []
    prescriptionInstructionOptions.value = catalogResponse.data?.prescription_instruction_options || []
    investigationOptions.value = catalogResponse.data?.investigations || []
  } catch (error) {
    medicineOptions.value = []
    dosageOptions.value = []
    prescriptionInstructionOptions.value = []
    investigationOptions.value = []
    catalogError.value = error.response?.data?.message || 'Medicine and investigation catalogs could not be loaded.'
  } finally {
    catalogLoading.value = false
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
  medicines.value.push({ id: null, key: `new-${Date.now()}-${Math.random()}`, medicine_id: '', medicineSearch: '', medicineSearchOpen: false, strength: '', dose: '', frequency: '', duration: '', meal_timing: '', route: '', eye_side: '', instructions: '' })
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

function selectedMedicine(row) {
  return medicineOptions.value.find((item) => Number(item.id) === Number(row.medicine_id)) || null
}

function doseOptionsFor(row) {
  const dosageFormId = selectedMedicine(row)?.dosage_form_id
  if (!dosageFormId) return []
  return prescriptionInstructionOptions.value.filter((option) => option.option_type === 'dose' && Number(option.dosage_form_id) === Number(dosageFormId))
}

function showMealTiming(row) {
  const medicine = selectedMedicine(row)
  const dosageFormId = medicine?.dosage_form_id
  const dosageName = dosageOptions.value.find((dosage) => Number(dosage.id) === Number(dosageFormId))?.name?.trim().toLowerCase()
  if (['tablet', 'capsule', 'syrup'].includes(dosageName)) return true
  const route = String(medicine?.route || '').trim().toLowerCase()
  return ['suspension', 'powder for suspension'].includes(dosageName) && route === 'oral'
}

function showEyeSide(row) {
  const medicine = selectedMedicine(row)
  const dosageFormId = medicine?.dosage_form_id
  const dosageName = dosageOptions.value.find((dosage) => Number(dosage.id) === Number(dosageFormId))?.name?.trim().toLowerCase()
  const route = String(medicine?.route || '').trim().toLowerCase()
  if (['suspension', 'powder for suspension'].includes(dosageName) && route === 'oral') return false
  return ['eye drops', 'eye drop', 'eye gel', 'eye ointment', 'suspension', 'powder for suspension'].includes(dosageName)
}

function mealTimingOptionsFor(row) {
  const dosageFormId = selectedMedicine(row)?.dosage_form_id
  if (!dosageFormId) return []
  return mealTimingOptions.value.filter((option) => Number(option.dosage_form_id) === Number(dosageFormId) && mealTimingOptionLabel(option.meal_timing))
}

function mealTimingOptionLabel(value) {
  const normalized = String(value || '').trim().toLowerCase().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ')
  if (['before meal', 'before food', 'খাবার আগে', 'খাবারের আগে'].includes(normalized)) return 'খাবার আগে'
  if (['after meal', 'after food', 'খাবার পরে', 'খাবারের পরে'].includes(normalized)) return 'খাবার পরে'
  return ''
}

function hasDoseOption(row) {
  return doseOptionsFor(row).some((option) => option.dose === row.dose)
}

function openMedicineSearch(row) {
  row.medicineSearchOpen = true
  if (selectedMedicine(row)) row.medicineSearch = ''
}

function filterMedicineSearch(row) {
  const selected = selectedMedicine(row)
  if (selected && row.medicineSearch.trim() !== selected.name) {
    row.medicine_id = ''
    row.strength = ''
    row.route = ''
  }
  row.medicineSearchOpen = true
}

function filteredMedicineOptions(row) {
  const query = String(row.medicineSearch || '').trim().toLowerCase()
  return medicineOptions.value.filter((medicine) => String(medicine.name || '').toLowerCase().includes(query))
}

function startMedicineCreate(row) {
  medicineCreateRow.value = row
  medicineCreateError.value = ''
  medicineCreateErrors.value = {}
  newMedicineForm.value = {
    name: String(row.medicineSearch || '').trim(),
    generic_name: '',
    brand_name: '',
    strength: '',
    dosage_form: '',
    category: '',
    route: '',
  }
  row.medicineSearchOpen = false
  medicineCreateOpen.value = true
}

function closeMedicineCreate() {
  if (medicineCreateSaving.value) return
  medicineCreateOpen.value = false
  medicineCreateRow.value = null
}

async function createMedicineFromPrescription() {
  medicineCreateSaving.value = true
  medicineCreateError.value = ''
  medicineCreateErrors.value = {}
  try {
    const { data } = await api.post('/doctor/medicines', { ...newMedicineForm.value, is_active: true })
    const medicine = data.data || data
    medicineOptions.value = [...medicineOptions.value.filter((item) => Number(item.id) !== Number(medicine.id)), medicine]
      .sort((first, second) => String(first.name || '').localeCompare(String(second.name || '')))
    if (medicineCreateRow.value) selectMedicine(medicineCreateRow.value, medicine)
    savedAt.value = ''
    medicineCreateOpen.value = false
    medicineCreateRow.value = null
    toast.success('Medicine added to catalog and selected for this prescription.')
  } catch (error) {
    const errors = error.response?.data?.errors || {}
    medicineCreateErrors.value = Object.fromEntries(Object.entries(errors).map(([field, messages]) => [field, Array.isArray(messages) ? messages[0] : String(messages)]))
    medicineCreateError.value = Object.keys(errors).length ? '' : error.response?.data?.message || 'The medicine could not be saved. Please try again.'
  } finally {
    medicineCreateSaving.value = false
  }
}

function selectMedicine(row, medicine) {
  row.medicine_id = medicine.id
  row.medicineSearch = medicine.name || ''
  row.medicineSearchOpen = false
  medicineChanged(row)
}

function selectFirstMedicine(row) {
  const first = filteredMedicineOptions(row)[0]
  if (first) selectMedicine(row, first)
}

function closeMedicineSearch(row) {
  window.setTimeout(() => {
    row.medicineSearchOpen = false
    const selected = selectedMedicine(row)
    if (selected && !row.medicineSearch.trim()) row.medicineSearch = selected.name || ''
  }, 120)
}

function toggleMedicineSearch(row) {
  if (row.medicineSearchOpen) {
    row.medicineSearchOpen = false
    return
  }
  openMedicineSearch(row)
}

function medicineChanged(row) {
  const medicine = medicineOptions.value.find((item) => Number(item.id) === Number(row.medicine_id))
  if (!medicine) return
  row.strength = medicine.strength || ''
  row.route = medicine.route || ''
  if (row.dose && !doseOptionsFor(row).some((option) => option.dose === row.dose)) row.dose = ''
  if (!showMealTiming(row)) row.meal_timing = ''
  else if (row.meal_timing && !mealTimingOptionsFor(row).some((option) => option.meal_timing === row.meal_timing)) row.meal_timing = ''
  if (!showEyeSide(row)) row.eye_side = ''
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
    examination: consultation?.examination_findings || '',
    assessment: consultation?.assessment || '',
    plan: consultation?.notes || '',
  }
  hydrateVisualAcuity(consultation?.visual_acuity || '')
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

function hydrateVisualAcuity(value) {
  const acuity = { right: '', left: '', rightCustom: '', leftCustom: '', additional: '' }
  const source = String(value || '').trim()
  const segments = source.split(/[,;|]|\s+(?=(?:right|left|od|os|r|l)\b)/i)
  let parsedEye = false

  for (const segment of segments) {
    const match = segment.trim().match(/^(right|left|od|os|r|l)\b\s*[:=]?\s*(.+)$/i)
    if (!match) {
      if (segment.trim()) acuity.additional = [acuity.additional, segment.trim()].filter(Boolean).join('; ')
      continue
    }

    parsedEye = true
    const side = ['right', 'od', 'r'].includes(match[1].toLowerCase()) ? 'right' : 'left'
    const reading = match[2].trim()
    if (['6/3', '6/4', '6/5', '6/6', '6/9', '6/12', '6/18', '6/24', '6/36', '6/60', '6/120', 'CF', 'HM', 'LP', 'NLP'].includes(reading.toUpperCase())) {
      acuity[side] = reading.toUpperCase() === 'CF' || reading.toUpperCase() === 'HM' || reading.toUpperCase() === 'LP' || reading.toUpperCase() === 'NLP' ? reading.toUpperCase() : reading
    } else if (reading) {
      acuity[side] = 'custom'
      acuity[`${side}Custom`] = reading
    }
  }

  if (!parsedEye && source) acuity.additional = source
  visualAcuity.value = acuity
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
    medicineSearch: item.medicine_name || '',
    medicineSearchOpen: false,
    strength: item.strength || '',
    dose: item.dose || '',
    frequency: item.frequency || '',
    duration: item.duration || '',
    meal_timing: item.meal_timing || '',
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
    visual_acuity: visualAcuityText.value || null,
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
    meal_timing: item.meal_timing || null,
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
    visual_acuity: visualAcuityText.value || null,
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

function toBanglaDigits(value) {
  return String(value ?? '').replace(/[0-9]/g, (digit) => '০১২৩৪৫৬৭৮৯'[Number(digit)])
}

function formatBanglaDose(value) {
  const text = String(value || '').trim()
  if (!text) return ''
  const match = text.match(/^(\d+(?:\.\d+)?)\s*(drops?|ফোঁটা|tablets?|tabs?|capsules?|caps?|ml|millilit(?:er|re)s?|mg|milligrams?|g|grams?|ribbons?|applications?|puffs?|times?)(.*)$/i)
  if (!match) {
    const normalized = text.toLowerCase().replace(/\s+/g, ' ')
    const phrases = {
      'one drop': '১ ফোঁটা',
      'two drops': '২ ফোঁটা',
      'one tablet': '১ ট্যাবলেট',
      'one capsule': '১ ক্যাপসুল',
      'small ribbon': 'অল্প পরিমাণ মলম',
      'thin ribbon': 'পাতলা ফিতা পরিমাণ',
    }
    return phrases[normalized] || (/[\u0980-\u09FF]/.test(text) ? toBanglaDigits(text) : 'বাংলায় মাত্রা লিখুন')
  }
  const unit = match[2].toLowerCase()
  const banglaUnit = /^(drops?|ফোঁটা)$/i.test(unit) ? 'ফোঁটা'
    : /^(tablets?|tabs?)$/i.test(unit) ? 'ট্যাবলেট'
      : /^(capsules?|caps?)$/i.test(unit) ? 'ক্যাপসুল'
        : /^(ml|millilit(?:er|re)s?)$/i.test(unit) ? 'মি.লি.'
          : /^(mg|milligrams?)$/i.test(unit) ? 'মি.গ্রা.'
            : /^(g|grams?)$/i.test(unit) ? 'গ্রাম'
              : /^(ribbons?)$/i.test(unit) ? 'পাতলা ফিতা'
                : /^(applications?)$/i.test(unit) ? 'বার প্রয়োগ'
                  : /^(puffs?)$/i.test(unit) ? 'পাফ'
                    : 'বার'
  const suffix = match[3].trim().toLowerCase()
  const banglaSuffix = suffix === 'in both eyes' || suffix === 'both eyes' ? ' দুই চোখে'
    : suffix === 'in affected eye' || suffix === 'in affected eyes' ? ' আক্রান্ত চোখে'
      : suffix === 'in each eye' ? ' প্রতি চোখে'
        : suffix && /[\u0980-\u09FF]/.test(match[3]) ? ` ${match[3].trim()}`
          : ''
  return `${toBanglaDigits(match[1])} ${banglaUnit}${banglaSuffix}`
}

function formatBanglaFrequency(value) {
  const text = String(value || '').trim()
  if (!text) return ''
  const normalized = text.toLowerCase().replace(/\s+/g, ' ').replace(/tim+es?/g, 'times')
  const wordCounts = { once: '১', twice: '২', thrice: '৩' }
  if (wordCounts[normalized] && normalized !== 'once') return `দিনে ${wordCounts[normalized]} বার`
  if (normalized === 'once daily' || normalized === 'once a day') return 'দিনে ১ বার'
  if (normalized === 'twice daily' || normalized === 'twice a day') return 'দিনে ২ বার'
  if (/^(three|3) times? (daily|a day)$/.test(normalized)) return 'দিনে ৩ বার'
  if (/^(four|4) times? (daily|a day)$/.test(normalized)) return 'দিনে ৪ বার'
  if (/^(five|5) times? (daily|a day)$/.test(normalized)) return 'দিনে ৫ বার'
  if (/^(six|6) times? (daily|a day)$/.test(normalized)) return 'দিনে ৬ বার'
  if (/^(one|1) times? (daily|a day)$/.test(normalized)) return 'দিনে ১ বার'
  if (/^(two|2) times? (daily|a day)$/.test(normalized)) return 'দিনে ২ বার'
  if (normalized === 'every hour' || normalized === 'hourly') return 'প্রতি ঘণ্টায় ১ বার'
  if (normalized === 'at bedtime' || normalized === 'every night') return 'রাতে ঘুমানোর আগে ১ বার'
  if (normalized === 'as needed' || normalized === 'when required' || normalized === 'prn' || normalized === 'sos') return 'প্রয়োজন অনুযায়ী'
  if (['od', 'qd', 'once daily'].includes(normalized)) return 'দিনে ১ বার'
  if (['bd', 'bid'].includes(normalized)) return 'দিনে ২ বার'
  if (['tds', 'tid'].includes(normalized)) return 'দিনে ৩ বার'
  if (['qid'].includes(normalized)) return 'দিনে ৪ বার'
  if (['hs'].includes(normalized)) return 'রাতে ঘুমানোর আগে ১ বার'
  if (['q2h', 'q4h', 'q6h', 'q8h', 'q12h'].includes(normalized)) {
    const hours = normalized.match(/\d+/)?.[0]
    return `প্রতি ${toBanglaDigits(hours)} ঘণ্টা পরপর`
  }
  const interval = normalized.match(/^(?:every|each)\s+(\d+)\s+hours?$/)
  if (interval) return `প্রতি ${toBanglaDigits(interval[1])} ঘণ্টা পরপর`
  const timesDaily = normalized.match(/^(\d+)\s*times?\s*(?:a\s+day|daily)$/)
  if (timesDaily) return `দিনে ${toBanglaDigits(timesDaily[1])} বার`
  const shorthand = normalized.match(/^(\d+)\s*[x×]\s*(?:daily|a day)$/)
  if (shorthand) return `দিনে ${toBanglaDigits(shorthand[1])} বার`
  if (/[\u0980-\u09FF]/.test(text)) return toBanglaDigits(text)
  return 'বাংলায় ব্যবহারের সময় লিখুন'
}

function formatBanglaDuration(value) {
  const text = String(value || '').trim()
  if (!text) return ''
  const match = text.match(/^(\d+(?:\.\d+)?)\s*(days?|weeks?|months?)$/i)
  if (!match) return toBanglaDigits(text)
  const unit = match[2].toLowerCase().replace(/s$/, '')
  const banglaUnit = unit === 'day' ? 'দিন' : unit === 'week' ? 'সপ্তাহ' : 'মাস'
  return `${toBanglaDigits(match[1])} ${banglaUnit}`
}

function formatBanglaMealTiming(value) {
  const text = String(value || '').trim()
  if (!text) return ''
  const label = mealTimingOptionLabel(text)
  if (label) return label
  const normalized = text.toLowerCase().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ')
  if (['with meal', 'with food', 'খাবারের সঙ্গে', 'খাবার সঙ্গে'].includes(normalized)) return 'খাবার সঙ্গে'
  if (/[\u0980-\u09FF]/.test(text)) return toBanglaDigits(text)
  return 'খাবারের সময় নির্দেশনা'
}

function formatBanglaRoute(value) {
  const text = String(value || '').trim()
  const route = text.toLowerCase()
  if (route === 'ophthalmic') return 'চোখে'
  if (route === 'oral') return 'মুখে'
  if (route === 'topical') return 'ত্বকে'
  return text
}

function formatBanglaEyeSide(value) {
  const side = String(value || '').trim().toLowerCase()
  if (side === 'both eyes') return 'দুই চোখে'
  if (side === 'right eye') return 'ডান চোখে'
  if (side === 'left eye') return 'বাম চোখে'
  return String(value || '').trim()
}

function formatBanglaInstruction(value) {
  const text = String(value || '').trim()
  if (!text) return ''
  const normalized = text.toLowerCase().replace(/[.!\s]+$/g, '').replace(/\s+/g, ' ')
  const translations = {
    'shake well before use': 'ব্যবহারের আগে ভালোভাবে ঝাঁকিয়ে নিন।',
    'wash hands before use': 'ব্যবহারের আগে হাত ধুয়ে নিন।',
    'do not touch the dropper tip': 'ড্রপারের মুখে স্পর্শ করবেন না।',
    'do not touch the tip of the dropper': 'ড্রপারের মুখে স্পর্শ করবেন না।',
    'close eyes for 1 minute after use': 'ব্যবহারের পর ১ মিনিট চোখ বন্ধ রাখুন।',
    'wait 5 minutes between eye drops': 'একাধিক চোখের ড্রপ ব্যবহারের মাঝে ৫ মিনিট অপেক্ষা করুন।',
    'keep refrigerated': 'ফ্রিজে রাখুন।',
    'for external use only': 'শুধুমাত্র বাহ্যিক ব্যবহারের জন্য।',
    'use at bedtime': 'রাতে ঘুমানোর আগে ব্যবহার করুন।',
    'apply at bedtime': 'রাতে ঘুমানোর আগে প্রয়োগ করুন।',
    'instill one drop': '১ ফোঁটা দিন।',
    'instill 1 drop': '১ ফোঁটা দিন।',
    'instill one drop in affected eye': 'আক্রান্ত চোখে ১ ফোঁটা দিন।',
    'instill one drop in both eyes': 'দুই চোখে ১ ফোঁটা দিন।',
    'apply a small ribbon': 'অল্প পরিমাণ মলম প্রয়োগ করুন।',
    'apply a thin ribbon': 'পাতলা ফিতা পরিমাণ মলম প্রয়োগ করুন।',
    'close the eye gently after use': 'ব্যবহারের পর চোখ আলতো করে বন্ধ রাখুন।',
    'wait 5 minutes between medicines': 'একাধিক ওষুধ ব্যবহারের মাঝে ৫ মিনিট অপেক্ষা করুন।',
    'wait 10 minutes between medicines': 'একাধিক ওষুধ ব্যবহারের মাঝে ১০ মিনিট অপেক্ষা করুন।',
    'remove contact lenses before use': 'ব্যবহারের আগে কন্টাক্ট লেন্স খুলে ফেলুন।',
    'do not drive after use': 'ব্যবহারের পর গাড়ি চালাবেন না।',
  }
  if (translations[normalized]) return translations[normalized]
  if (/[\u0980-\u09FF]/.test(text)) return text
  return 'নির্দেশনাটি বাংলায় লিখুন।'
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
.print-instruction-row td { padding-top: 2px; border-top: 0; color: #334155; font-size: 8px; }
.print-instruction-row strong { color: #475569; }
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
.clinical-vision-row { grid-column: 1 / -1; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); align-items: start; gap: 12px; }
.visual-acuity-note { grid-column: 1 / -1; }

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
.medicine-fields { display: grid; gap: 12px; }
.medicine-primary-fields { display: grid; grid-template-columns: minmax(220px, 2.2fr) minmax(82px, .8fr) minmax(145px, 1.1fr) minmax(100px, .9fr) minmax(100px, .9fr) minmax(90px, .8fr) minmax(200px, 1.5fr); gap: 12px; }
.medicine-primary-fields > .field { min-width: 0; }
.medicine-primary-fields > .meal-timing-field { min-width: 200px; }
.meal-timing-field select { padding-right: 26px; font-size: 12px; }
.medicine-secondary-fields { display: grid; grid-template-columns: minmax(180px, .9fr) minmax(280px, 2fr); gap: 12px; }
.medicine-name { min-width: 0; }
.medicine-combobox { position: relative; }
.medicine-combobox-control { position: relative; display: flex; align-items: center; }
.medicine-combobox-control > svg { position: absolute; left: 12px; z-index: 1; color: var(--muted); pointer-events: none; }
.medicine-combobox-control input { padding-right: 38px; padding-left: 36px; }
.medicine-combobox-toggle { position: absolute; right: 5px; display: grid; place-items: center; width: 32px; height: 32px; border-radius: 8px; color: var(--muted); background: transparent; }
.medicine-combobox-toggle:hover:not(:disabled) { color: var(--primary); background: #f5f3ff; }
.medicine-combobox-toggle:disabled { cursor: not-allowed; opacity: .5; }
.medicine-combobox-options { position: absolute; top: calc(100% + 5px); left: 0; right: 0; z-index: 20; max-height: 240px; overflow-y: auto; padding: 5px; border: 1px solid var(--border); border-radius: 11px; background: #fff; box-shadow: 0 12px 30px rgba(15, 23, 42, .14); }
.medicine-combobox-option { display: block; width: 100%; padding: 10px 11px; border-radius: 7px; color: var(--text); background: #fff; font: inherit; font-size: 13px; text-align: left; }
.medicine-combobox-option:hover, .medicine-combobox-option[aria-selected="true"] { color: var(--primary); background: #f5f3ff; }
.medicine-combobox-empty { padding: 12px 11px; color: var(--muted); font-size: 12px; }
.medicine-combobox-create { display: flex; align-items: center; gap: 8px; width: 100%; margin-top: 4px; padding: 10px 11px; border-top: 1px solid var(--border); border-radius: 7px; color: var(--primary); background: #fff; font: inherit; font-size: 12px; font-weight: 650; text-align: left; cursor: pointer; }
.medicine-combobox-create:hover { background: #f5f3ff; }
.medicine-create-backdrop { position: fixed; inset: 0; z-index: 1000; display: grid; place-items: center; overflow-y: auto; padding: 24px; background: rgba(15, 23, 42, .55); }
.medicine-create-modal { width: min(680px, 100%); overflow: hidden; border: 1px solid var(--border); border-radius: 18px; background: #fff; box-shadow: 0 24px 80px rgba(15, 23, 42, .25); }
.medicine-create-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; padding: 21px 24px; border-bottom: 1px solid var(--border); }
.medicine-create-header h2 { margin: 0; color: var(--text); font-size: 18px; }
.medicine-create-header p { margin: 5px 0 0; color: var(--muted); font-size: 12px; }
.medicine-create-form { padding: 20px 24px 22px; }
.medicine-create-fields { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 15px; }
.medicine-create-error { color: #b91c1c; font-size: 11px; }
.medicine-create-error-summary { margin: 14px 0 0; padding: 10px 12px; border: 1px solid #fecaca; border-radius: 9px; color: #991b1b; background: #fff7f7; font-size: 12px; }
.medicine-create-footer { display: flex; justify-content: flex-end; gap: 9px; margin-top: 20px; padding-top: 16px; border-top: 1px solid var(--border); }
.medicine-instructions { min-width: 0; }
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
@media (max-width: 1080px) { .workspace-grid { grid-template-columns: minmax(0, 1fr) 275px; } .medicine-primary-fields { grid-template-columns: repeat(4, minmax(0, 1fr)); } .medicine-name { grid-column: span 2; } }
@media (max-width: 760px) { .patient-banner { flex-wrap: wrap; } .patient-banner-detail { padding-left: 10px; } .patient-serial { margin-left: 0; text-align: left; } .workspace-grid { grid-template-columns: 1fr; } .side-column { grid-template-columns: 1fr; } .workspace-footer { position: static; align-items: stretch; flex-direction: column; } .workspace-footer > div { justify-content: flex-end; } }
@media (max-width: 760px) { .investigation-edit-row { grid-template-columns: 1fr 1fr; } .investigation-edit-row .field:first-child { grid-column: 1 / -1; } .investigation-edit-actions { grid-column: 1 / -1; justify-content: flex-end; } }
@media (max-width: 560px) { .medicine-create-backdrop { align-items: start; padding: 12px; } .medicine-create-header, .medicine-create-form { padding-right: 17px; padding-left: 17px; } .medicine-create-fields { grid-template-columns: 1fr; } }
@media (max-width: 560px) { .clinical-vision-row { grid-template-columns: 1fr; } }
@media (max-width: 560px) { .doctor-consultation .page-head { align-items: flex-start; flex-direction: column; } .head-actions { width: 100%; justify-content: space-between; } .consultation-tabs { width: 100%; overflow-x: auto; } .visit-page-link { padding: 0 10px; font-size: 12px; } .workspace-card { padding: 16px; } .form-grid, .medicine-primary-fields, .medicine-secondary-fields { grid-template-columns: 1fr; } .medicine-name, .medicine-instructions { grid-column: auto; } .investigation-preview { grid-template-columns: 1fr 1fr; } .investigation-preview .field:first-child { grid-column: 1 / -1; } .add-investigation { grid-column: 1 / -1; } .stage-chip { display: none; } .ordered-test { flex-wrap: wrap; } .ordered-test-payable { margin-left: auto; } .investigation-edit-row { grid-template-columns: 1fr; } .investigation-edit-row .field:first-child, .investigation-edit-actions { grid-column: auto; } }
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
