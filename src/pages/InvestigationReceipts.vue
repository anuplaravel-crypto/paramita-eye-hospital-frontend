<template>
  <section>
    <header class="page-head">
      <div>
        <h1 class="page-title">Investigation Receipts</h1>
        <p class="page-sub">Create patient receipts with investigation-specific prices, discounts, and commissions.</p>
      </div>
      <button class="btn btn-primary" type="button" @click="openDialog()">
        <Plus :size="17" /> Create Receipt
      </button>
      <button class="btn btn-outline" type="button" @click="togglePendingOrders">
        <FileText :size="17" /> Pending Orders <span v-if="pendingOrders.length" class="pending-count">{{ pendingOrders.length }}</span>
      </button>
    </header>

    <div class="toolbar">
      <label class="search-inline">
        <Search :size="17" />
        <input v-model="search" type="search" placeholder="Search receipts or patients..." aria-label="Search receipts or patients" />
      </label>
      <label class="date-filter">
        <span>From date</span>
        <input v-model="fromDate" type="date" aria-label="Select start date" />
      </label>
      <label class="date-filter">
        <span>To date</span>
        <input v-model="toDate" type="date" aria-label="Select end date" />
      </label>
      <select v-model="investigationFilter" class="input receipt-investigation-filter" aria-label="Filter receipts by investigation">
        <option value="all">All investigations</option>
        <option v-for="investigation in investigationOptions" :key="investigation.id" :value="String(investigation.id)">{{ investigation.name }}</option>
      </select>
      <select v-model="investigationTypeFilter" class="input receipt-type-filter" aria-label="Filter receipts by investigation type">
        <option value="all">All types</option>
        <option value="indoor">Indoor</option>
        <option value="outdoor">Outdoor</option>
      </select>
      <span class="spacer"></span>
      <span class="receipt-total-count">{{ filteredReceipts.length }} receipts</span>
    </div>

    <section v-if="pendingOrdersOpen" class="card pending-orders-panel" aria-labelledby="pending-orders-title">
      <header class="pending-orders-head">
        <div><h2 id="pending-orders-title">Pending doctor investigation orders</h2><p>Search by patient name, phone, appointment serial, or order number. Select tests to receive payment.</p></div>
        <button class="icon-btn" type="button" aria-label="Close pending orders" @click="pendingOrdersOpen = false"><X :size="17" /></button>
      </header>
      <div class="pending-orders-filters">
        <label class="pending-order-search">
          <span class="pending-search-icon"><Search :size="19" /></span>
          <span class="pending-search-content"><small>FIND A PATIENT</small><input v-model="pendingSearch" type="search" placeholder="Name, phone, appointment serial, or order number" aria-label="Search pending investigation orders" /></span>
          <span class="pending-search-chip">Search</span>
        </label>
        <label class="date-filter"><span>Order date</span><input v-model="pendingDate" type="date" aria-label="Filter pending orders by order date" /></label>
        <select v-model="pendingType" class="input" aria-label="Filter pending orders by type"><option value="all">All types</option><option value="indoor">Indoor</option><option value="outdoor">Outdoor</option></select>
        <span class="spacer"></span><span>{{ pendingOrders.length }} pending investigations</span>
      </div>
      <div v-if="pendingOrdersLoading" class="empty" role="status">Loading unpaid investigation orders...</div>
      <div v-else-if="pendingOrdersError" class="page-error" role="alert"><span>{{ pendingOrdersError }}</span><button class="btn btn-outline btn-sm" type="button" @click="loadPendingOrders">Try again</button></div>
      <div v-else-if="!pendingOrderGroups.length" class="empty"><h4>No unpaid doctor orders found</h4><p>Try another search or create a receipt for a walk-in patient.</p></div>
      <div v-else class="pending-order-list">
        <details v-for="(group, index) in pendingOrderGroups" :key="group.order_id" class="pending-order-card" :open="index === 0">
          <summary class="pending-order-patient">
            <span class="pending-patient-chevron"><ChevronDown :size="17" /></span>
            <span class="pending-patient-main"><strong>{{ capitalizeWords(group.patient_name) }}</strong><small>{{ group.contact_number || 'No phone' }} · Appointment #{{ group.appointment_serial_number }} · {{ formatDate(group.appointment_date) }}</small></span>
            <span class="pending-order-doctor"><small>{{ formatInvestigationType(group.investigation_type) }}</small><strong>{{ group.doctor_name }}</strong></span>
          </summary>
          <div class="pending-order-body">
            <div class="pending-order-table-wrap">
              <table class="table pending-order-table">
                <thead><tr><th aria-label="Select"></th><th>Investigation</th><th>Actual fees</th><th>Discount</th><th>Due</th></tr></thead>
                <tbody>
                  <tr v-for="item in group.items" :key="item.order_item_id">
                    <td><input type="checkbox" :checked="isPendingItemSelected(group.order_id, item.order_item_id)" :aria-label="'Select ' + item.investigation_name" @change="setPendingItemSelected(group.order_id, item.order_item_id, $event.target.checked)" /></td>
                    <td class="pending-investigation-name">{{ item.investigation_name }}</td>
                    <td>{{ formatAmount(item.price) }}</td>
                    <td>{{ formatAmount(item.doctor_discount) }}</td>
                    <td class="pending-due-cell">{{ formatAmount(item.payable_amount) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <footer class="pending-order-footer"><span>Select one or more investigations for this payment.</span><button class="btn btn-primary btn-sm" type="button" :disabled="!selectedPendingCount(group.order_id)" @click="receivePendingOrder(group)">Receive payment · {{ formatAmount(selectedPendingTotal(group.order_id, group)) }}</button></footer>
          </div>
        </details>
      </div>
    </section>

    <div v-if="dateRangeError" class="summary-error" role="alert">{{ dateRangeError }}</div>
    <section class="daily-summary-grid" aria-label="Investigation collection summary" aria-live="polite" :aria-busy="summaryLoading">
      <article class="daily-summary-card">
        <span>Total investigation collection</span>
        <strong>{{ formatAmount(dailySummary.total_investigation_collection) }}</strong>
      </article>
      <article class="daily-summary-card commission-summary-card">
        <span>Total agent commission</span>
        <strong>{{ formatAmount(dailySummary.total_agent_commission) }}</strong>
      </article>
      <article class="daily-summary-card customer-discount-summary-card">
        <span>Customer request discount</span>
        <strong>{{ formatAmount(dailySummary.total_customer_requested_discount) }}</strong>
      </article>
      <article class="daily-summary-card cash-summary-card">
        <span>Cash in hand</span>
        <strong>{{ formatAmount(dailySummary.cash_in_hand) }}</strong>
        <small>Collection less agent commission and customer discount</small>
      </article>
      <article class="daily-summary-card investigation-count-summary-card">
        <span>Investigation count</span>
        <strong>{{ dailySummary.total_investigation_count }}</strong>
        <small>Matching selected date range, investigation, and type</small>
      </article>
    </section>
    <div v-if="summaryError" class="summary-error" role="alert">
      <span>{{ summaryError }}</span>
      <button class="btn btn-outline btn-sm" type="button" @click="loadDailySummary">Try again</button>
    </div>

    <div v-if="pageError" class="page-error" role="alert">
      <span>{{ pageError }}</span>
      <button class="btn btn-outline btn-sm" type="button" @click="loadData">Try again</button>
    </div>

    <div class="card receipt-card">
      <div v-if="loading" class="empty" role="status">Loading receipts...</div>
      <div v-else-if="!filteredReceipts.length" class="empty">
        <FileText :size="30" />
        <h4>{{ hasActiveReceiptFilters ? 'No matching receipts' : 'No receipts found' }}</h4>
        <p>{{ hasActiveReceiptFilters ? 'Adjust the date range, search, investigation, or type filter to see other receipts.' : 'Create a receipt to get started.' }}</p>
      </div>
      <div v-else class="table-wrap">
        <table class="table receipt-table">
          <thead>
            <tr>
              <th>Sl</th>
              <th :aria-sort="sortAria('date')"><button class="sort-button" :class="{ 'sort-active': sortKey === 'date' }" type="button" :aria-label="sortButtonLabel('date', 'Date')" @click="toggleReceiptSort('date')">Date <span class="sort-indicator" aria-hidden="true">{{ sortIndicator('date') }}</span></button></th>
              <th :aria-sort="sortAria('receipt_number')"><button class="sort-button" :class="{ 'sort-active': sortKey === 'receipt_number' }" type="button" :aria-label="sortButtonLabel('receipt_number', 'Receipt')" @click="toggleReceiptSort('receipt_number')">Receipt <span class="sort-indicator" aria-hidden="true">{{ sortIndicator('receipt_number') }}</span></button></th>
              <th :aria-sort="sortAria('patient_name')"><button class="sort-button" :class="{ 'sort-active': sortKey === 'patient_name' }" type="button" :aria-label="sortButtonLabel('patient_name', 'Patient name')" @click="toggleReceiptSort('patient_name')">Patient Name <span class="sort-indicator" aria-hidden="true">{{ sortIndicator('patient_name') }}</span></button></th>
              <th :aria-sort="sortAria('investigations')"><button class="sort-button" :class="{ 'sort-active': sortKey === 'investigations' }" type="button" :aria-label="sortButtonLabel('investigations', 'Investigations')" @click="toggleReceiptSort('investigations')">Investigations <span class="sort-indicator" aria-hidden="true">{{ sortIndicator('investigations') }}</span></button></th>
              <th>Doctor</th>
              <th :aria-sort="sortAria('actual_fees')"><button class="sort-button" :class="{ 'sort-active': sortKey === 'actual_fees' }" type="button" :aria-label="sortButtonLabel('actual_fees', 'Fees')" @click="toggleReceiptSort('actual_fees')">Fees <span class="sort-indicator" aria-hidden="true">{{ sortIndicator('actual_fees') }}</span></button></th>
              <th :aria-sort="sortAria('discount')"><button class="sort-button" :class="{ 'sort-active': sortKey === 'discount' }" type="button" :aria-label="sortButtonLabel('discount', 'Discount')" @click="toggleReceiptSort('discount')">Discount <span class="sort-indicator" aria-hidden="true">{{ sortIndicator('discount') }}</span></button></th>
              <th :aria-sort="sortAria('agent_commission')"><button class="sort-button" :class="{ 'sort-active': sortKey === 'agent_commission' }" type="button" :aria-label="sortButtonLabel('agent_commission', 'Agent commission')" @click="toggleReceiptSort('agent_commission')">Agent Com <span class="sort-indicator" aria-hidden="true">{{ sortIndicator('agent_commission') }}</span></button></th>
              <th :aria-sort="sortAria('customer_requested_discount')"><button class="sort-button" :class="{ 'sort-active': sortKey === 'customer_requested_discount' }" type="button" :aria-label="sortButtonLabel('customer_requested_discount', 'Requested discount')" @click="toggleReceiptSort('customer_requested_discount')">Discount(Req) <span class="sort-indicator" aria-hidden="true">{{ sortIndicator('customer_requested_discount') }}</span></button></th>
              <th :aria-sort="sortAria('payable_amount')"><button class="sort-button" :class="{ 'sort-active': sortKey === 'payable_amount' }" type="button" :aria-label="sortButtonLabel('payable_amount', 'Payable amount')" @click="toggleReceiptSort('payable_amount')">Payable <span class="sort-indicator" aria-hidden="true">{{ sortIndicator('payable_amount') }}</span></button></th>
              <th class="actions-heading">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(receipt, index) in sortedReceipts" :key="receipt.id">
              <td>{{ index + 1 }}</td>
              <td>{{ formatDate(receipt.receipt_date) }}</td>
              <td><strong>{{ receipt.receipt_number }}</strong></td>
              <td>{{ capitalizeWords(receipt.patient_name) || '—' }}</td>
              <td class="investigations-cell">{{ receiptInvestigationNames(receipt) }}</td>
              <td>{{ receipt.doctor_name || '—' }}</td>
              <td class="price-cell">{{ formatAmount(receiptDisplayAmount(receipt, 'price', 'actual_fees')) }}</td>
              <td class="price-cell">{{ formatAmount(receiptDisplayAmount(receipt, 'discount', 'discount')) }}</td>
              <td class="price-cell">{{ formatAmount(receiptDisplayAmount(receipt, 'agent_commission', 'agent_commission')) }}</td>
              <td class="price-cell">{{ formatAmount(receiptDisplayAmount(receipt, 'customer_requested_discount', 'customer_requested_discount')) }}</td>
              <td class="price-cell payable-cell">{{ formatAmount(receiptDisplayPayable(receipt)) }}</td>
              <td>
                <div class="receipt-actions">
                  <button class="btn btn-outline btn-sm" type="button" @click="openDialog(receipt, 'view')">
                    <Eye :size="15" /> View
                  </button>
                  <button class="btn btn-outline btn-sm" type="button" @click="openDialog(receipt, 'edit')">
                    <Pencil :size="15" /> Edit
                  </button>
                  <button class="btn btn-outline btn-sm mr-action" type="button" @click="openMoneyReceipt(receipt)">
                    <Printer :size="15" /> MR
                  </button>
                  <button
                    v-if="!receiptHasLinkedOrderItems(receipt)"
                    class="icon-btn danger-action"
                    type="button"
                    title="Delete receipt"
                    :aria-label="'Delete receipt ' + receipt.receipt_number"
                    @click="deleteReceipt(receipt)"
                  >
                    <Trash2 :size="16" />
                  </button>
                  <span v-else class="linked-receipt-lock" :title="'Doctor-order receipts are protected from deletion'">Order linked</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <Teleport to="body">
      <div v-if="dialogOpen" class="dialog-backdrop" @click.self="closeDialog">
        <section class="receipt-dialog card" role="dialog" aria-modal="true" aria-labelledby="receipt-dialog-title">
          <header class="dialog-head">
            <div>
              <h2 id="receipt-dialog-title">{{ dialogTitle }}</h2>
              <p>{{ dialogDescription }}</p>
            </div>
            <button class="icon-btn" type="button" aria-label="Close dialog" @click="closeDialog">
              <X :size="18" />
            </button>
          </header>

          <form novalidate @submit.prevent="saveReceipt">
            <div v-if="hasLinkedOrderItems" class="linked-order-note" role="status"><strong>Doctor order selected.</strong> Confirm the payment was received before creating this receipt. Only the selected investigations will be billed; the remaining order items stay pending.</div>
            <div v-if="readOnly" class="dialog-body receipt-view-body">
              <div class="receipt-view">
                <header class="receipt-view-banner">
                  <div class="view-banner-icon"><FileText :size="22" /></div>
                  <div class="view-banner-title"><span>Investigation receipt</span><strong>#{{ form.receipt_number || '—' }}</strong></div>
                  <span class="view-type-badge">{{ formatInvestigationType(form.investigation_type) }}</span>
                </header>
                <div class="view-meta-grid">
                  <article class="view-meta-card"><span>Receipt date</span><strong>{{ formatDate(form.receipt_date) }}</strong></article>
                  <article class="view-meta-card"><span>Receipt number</span><strong>{{ form.receipt_number || '—' }}</strong></article>
                </div>
                <section class="view-section">
                  <header class="view-section-heading"><div class="view-section-icon patient-icon"><Eye :size="17" /></div><div><h3>Patient details</h3><p>Patient and referring doctor information</p></div></header>
                  <div class="patient-view-grid">
                    <div class="view-detail"><span>Patient name</span><strong>{{ capitalizeWords(form.patient_name) || '—' }}</strong></div>
                    <div class="view-detail"><span>Contact number</span><strong>{{ form.contact_number || '—' }}</strong></div>
                    <div class="view-detail"><span>Doctor name</span><strong>{{ form.doctor_name || '—' }}</strong></div>
                  </div>
                </section>
                <section class="view-section">
                  <header class="view-section-heading"><div class="view-section-icon investigation-icon"><FileText :size="17" /></div><div><h3>Investigations</h3><p>{{ form.items.length }} {{ form.items.length === 1 ? 'investigation' : 'investigations' }} on this receipt</p></div></header>
                  <div v-if="form.cancelled_item_count" class="cancelled-items-note" role="status">{{ form.cancelled_item_count }} removed {{ form.cancelled_item_count === 1 ? 'investigation is' : 'investigations are' }} retained as cancelled history.</div>
                  <div class="view-investigation-list">
                    <article v-for="(item, index) in form.items" :key="item.key" class="view-investigation-card">
                      <header class="view-investigation-head">
                        <div><span class="view-item-number">{{ String(index + 1).padStart(2, '0') }}</span><h4>{{ investigationNameFor(item) }}</h4></div>
                        <div class="view-item-fee"><span>Actual fee</span><strong>{{ formatAmount(priceFor(item)) }}</strong></div>
                      </header>
                      <div class="view-item-details">
                        <div class="view-detail"><span>Discount</span><strong>{{ formatAmount(item.discount) }}</strong></div>
                        <div v-if="hasDoctorCommission" class="view-detail"><span>Doctor commission</span><strong>{{ formatAmount(item.doctor_commission) }}</strong></div>
                        <div class="view-detail"><span>Agent commission</span><strong>{{ formatAmount(item.agent_commission) }}</strong></div>
                        <div class="view-detail"><span>Discount(Req)</span><strong>{{ formatAmount(item.customer_requested_discount) }}</strong></div>
                        <div class="view-detail"><span>Investigation done by</span><strong>{{ technicianNameFor(item) }}</strong></div>
                      </div>
                    </article>
                  </div>
                  <div v-if="form.cancelled_items.length" class="cancelled-history-list">
                    <h4>Cancelled investigation history</h4>
                    <article v-for="(item, index) in form.cancelled_items" :key="item.key" class="cancelled-history-card">
                      <div><strong>{{ investigationNameFor(item) }}</strong><span>Cancelled {{ formatDate(item.cancelled_at) }}</span></div>
                      <span class="cancelled-history-badge">Cancelled</span>
                    </article>
                  </div>
                </section>
                <section class="view-totals" aria-label="Receipt totals">
                  <div class="view-total-row"><span>Actual Fees</span><strong>{{ formatAmount(actualFeesTotal) }}</strong></div>
                  <div class="view-total-row"><span>Discount</span><strong>{{ formatAmount(discountTotal) }}</strong></div>
                  <div v-if="hasDoctorCommission" class="view-total-row"><span>Doctor Commission</span><strong>{{ formatAmount(doctorCommissionTotal) }}</strong></div>
                  <div class="view-total-row"><span>Agent Commission</span><strong>{{ formatAmount(agentCommissionTotal) }}</strong></div>
                  <div class="view-total-row"><span>Discount(Req)</span><strong>{{ formatAmount(customerRequestedDiscountTotal) }}</strong></div>
                  <div class="view-total-row view-payable-row"><span>Payable Amount</span><strong>{{ formatAmount(formTotal) }}</strong></div>
                </section>
              </div>
            </div>
            <div v-else class="dialog-body">
              <div class="receipt-fields">
                <div class="field">
                  <label for="receipt-date">Receipt date <span class="required">*</span></label>
                  <input
                    id="receipt-date"
                    v-model="form.receipt_date"
                    class="input"
                    :class="{ 'input-invalid': fieldErrors.receipt_date }"
                    type="date"
                    required
                    :disabled="readOnly"
                    :aria-invalid="Boolean(fieldErrors.receipt_date)"
                    :aria-describedby="fieldErrors.receipt_date ? 'receipt-date-error' : undefined"
                  />
                  <small v-if="fieldErrors.receipt_date" id="receipt-date-error" class="field-error">{{ fieldErrors.receipt_date }}</small>
                </div>
                <div class="field">
                  <label for="investigation-type">Investigation type <span class="required">*</span></label>
                  <select
                    id="investigation-type"
                    v-model="form.investigation_type"
                    class="input"
                    :class="{ 'input-invalid': fieldErrors.investigation_type }"
                    required
                    :disabled="readOnly || hasLinkedOrderItems"
                    @change="handleInvestigationTypeChange"
                    :aria-invalid="Boolean(fieldErrors.investigation_type)"
                    :aria-describedby="fieldErrors.investigation_type ? 'investigation-type-error' : undefined"
                  >
                    <option value="" disabled>Select a type</option>
                    <option value="indoor">Indoor</option>
                    <option value="outdoor">Outdoor</option>
                  </select>
                  <small v-if="fieldErrors.investigation_type" id="investigation-type-error" class="field-error">{{ fieldErrors.investigation_type }}</small>
                </div>
                <div class="field">
                  <label for="receipt-number">Receipt number <span class="required">*</span></label>
                  <input
                    id="receipt-number"
                    v-model.trim="form.receipt_number"
                    class="input"
                    :class="{ 'input-invalid': fieldErrors.receipt_number }"
                    type="text"
                    maxlength="255"
                    :readonly="readOnly || hasLinkedOrderItems"
                    :aria-invalid="Boolean(fieldErrors.receipt_number)"
                    :aria-describedby="fieldErrors.receipt_number ? 'receipt-number-error' : undefined"
                  />
                  <small v-if="fieldErrors.receipt_number" id="receipt-number-error" class="field-error">{{ fieldErrors.receipt_number }}</small>
                </div>

                <div class="field">
                  <label for="patient-name">Patient name <span class="required">*</span></label>
                  <input
                    id="patient-name"
                    v-model.trim="form.patient_name"
                    class="input"
                    :class="{ 'input-invalid': fieldErrors.patient_name }"
                    type="text"
                    maxlength="255"
                    :readonly="readOnly || hasLinkedOrderItems"
                    :aria-invalid="Boolean(fieldErrors.patient_name)"
                    :aria-describedby="fieldErrors.patient_name ? 'patient-name-error' : undefined"
                  />
                  <small v-if="fieldErrors.patient_name" id="patient-name-error" class="field-error">{{ fieldErrors.patient_name }}</small>
                </div>

                <div class="field">
                  <label for="contact-number">Patient contact number <span class="required">*</span></label>
                  <input
                    id="contact-number"
                    v-model.trim="form.contact_number"
                    class="input"
                    :class="{ 'input-invalid': fieldErrors.contact_number }"
                    type="tel"
                    maxlength="255"
                    required
                    :readonly="readOnly || hasLinkedOrderItems"
                    :aria-invalid="Boolean(fieldErrors.contact_number)"
                    :aria-describedby="fieldErrors.contact_number ? 'contact-number-error' : undefined"
                  />
                  <small v-if="fieldErrors.contact_number" id="contact-number-error" class="field-error">{{ fieldErrors.contact_number }}</small>
                </div>

                <div class="field">
                  <label for="doctor-name">Doctor name <span class="required">*</span></label>
                  <select
                    id="doctor-name"
                    v-model="form.doctor_name"
                    class="input"
                    :class="{ 'input-invalid': fieldErrors.doctor_name }"
                    :disabled="readOnly || hasLinkedOrderItems"
                    required
                    :aria-invalid="Boolean(fieldErrors.doctor_name)"
                    :aria-describedby="fieldErrors.doctor_name ? 'doctor-name-error' : undefined"
                  >
                    <option value="" disabled>{{ availableDoctors.length ? 'Select a doctor' : 'No doctors configured for this type' }}</option>
                    <option v-for="doctor in availableDoctors" :key="doctor.id ?? doctor.name" :value="doctor.name">{{ doctor.name }}</option>
                  </select>
                  <small v-if="fieldErrors.doctor_name" id="doctor-name-error" class="field-error">{{ fieldErrors.doctor_name }}</small>
                </div>
              </div>

              <div ref="itemsHeadingRef" class="items-heading">
                <div>
                  <h3>Investigation items <span class="required">*</span></h3>
                  <p>Each item has its own discount and commission values.</p>
                </div>
                <div class="items-total-inline" aria-live="polite">
                  <span>Receipt total</span>
                  <strong>{{ formatPrice(formTotal) }}</strong>
                </div>
                <button v-if="!readOnly && !hasLinkedOrderItems" class="btn btn-outline btn-sm" type="button" @click="addItem">
                  <Plus :size="15" /> Add item
                </button>
              </div>
              <p v-if="fieldErrors.items" class="field-error items-error" role="alert">{{ fieldErrors.items }}</p>

              <article v-for="(item, index) in form.items" :key="item.key" class="item-panel" :class="{ 'item-panel-open': expandedItemKey === item.key }">
                <header class="item-panel-head">
                  <button
                    class="item-accordion-toggle"
                    type="button"
                    :aria-expanded="expandedItemKey === item.key"
                    @click="toggleItem(item)"
                  >
                    <span class="accordion-chevron" :class="{ expanded: expandedItemKey === item.key }"><ChevronDown :size="17" /></span>
                    <span class="accordion-title">Investigation {{ item.number }}</span>
                    <span class="accordion-summary">{{ item.investigation_id ? investigationNameFor(item) : 'Select an investigation' }}</span>
                    <strong v-if="item.investigation_id" class="accordion-price">{{ formatAmount(priceFor(item)) }}</strong>
                  </button>
                  <button
                    v-if="!readOnly && !hasLinkedOrderItems && form.items.length > 1"
                    class="icon-btn danger-action"
                    type="button"
                    :aria-label="'Remove investigation ' + item.number"
                    @click="removeItem(index)"
                  >
                    <Trash2 :size="15" />
                  </button>
                </header>

                <div v-show="expandedItemKey === item.key" class="item-fields">
                  <div class="field">
                    <label :for="'item-investigation-' + index">Investigation <span class="required">*</span></label>
                    <select
                      :id="'item-investigation-' + index"
                      v-model.number="item.investigation_id"
                      class="input"
                      :class="{ 'input-invalid': itemError(index, 'investigation_id') }"
                    :disabled="readOnly || Number(item.investigation_order_item_id) > 0"
                    required
                      :aria-invalid="Boolean(itemError(index, 'investigation_id'))"
                    >
                      <option value="" disabled>Select an investigation</option>
                      <option
                        v-for="investigation in investigations"
                        :key="investigation.id"
                        :value="investigation.id"
                        :disabled="isInvestigationSelected(investigation.id, item)"
                      >
                        {{ investigation.name }}
                      </option>
                    </select>
                    <small v-if="itemError(index, 'investigation_id')" class="field-error">{{ itemError(index, 'investigation_id') }}</small>
                  </div>

                  <div class="field">
                    <label :for="'item-price-' + index">Price (BDT)</label>
                    <input :id="'item-price-' + index" class="input readonly-price" :value="priceFor(item) ? formatPrice(priceFor(item)) : 'Select an investigation'" readonly />
                  </div>

                  <div class="field">
                    <label :for="'item-discount-' + index">Discount (BDT)</label>
                    <input
                      :id="'item-discount-' + index"
                      v-model="item.discount"
                      class="input"
                      :class="{ 'input-invalid': itemError(index, 'discount') }"
                      type="number"
                      min="0"
                      step="0.01"
                      :disabled="readOnly || Number(item.investigation_order_item_id) > 0"
                    required
                      :aria-invalid="Boolean(itemError(index, 'discount'))"
                    />
                    <small v-if="itemError(index, 'discount')" class="field-error">{{ itemError(index, 'discount') }}</small>
                  </div>




                  <div class="field">
                    <label :for="'item-agent-commission-' + index">Agent commission (BDT)</label>
                    <input
                      :id="'item-agent-commission-' + index"
                      v-model="item.agent_commission"
                      class="input"
                      :class="{ 'input-invalid': itemError(index, 'agent_commission') }"
                      type="number"
                      min="0"
                      step="0.01"
                      :disabled="readOnly"
                    required
                    />
                    <small v-if="itemError(index, 'agent_commission')" class="field-error">{{ itemError(index, 'agent_commission') }}</small>
                  </div>
                  <div v-if="form.investigation_type === 'outdoor'" class="field">
                    <label :for="'item-doctor-commission-' + index">Doctor commission (BDT)</label>
                    <input
                      :id="'item-doctor-commission-' + index"
                      v-model="item.doctor_commission"
                      class="input"
                      :class="{ 'input-invalid': itemError(index, 'doctor_commission') }"
                      type="number"
                      min="0"
                      step="0.01"
                      :disabled="readOnly"
                    required
                    />
                    <small v-if="itemError(index, 'doctor_commission')" class="field-error">{{ itemError(index, 'doctor_commission') }}</small>
                  </div>

                  <div class="field">
                    <label :for="'item-done-by-' + index">Investigation done by</label>
                    <select
                      :id="'item-done-by-' + index"
                      v-model="item.investigation_done_by_user_id"
                      class="input"
                      :class="{ 'input-invalid': itemError(index, 'investigation_done_by_user_id') }"
                      :disabled="readOnly"
                    required
                    >
                      <option value="">Select a technician</option>
                      <option v-for="technician in technicians" :key="technician.id" :value="technician.id">{{ technician.name }}</option>
                    </select>
                    <small v-if="itemError(index, 'investigation_done_by_user_id')" class="field-error">{{ itemError(index, 'investigation_done_by_user_id') }}</small>
                  </div>
                  <div class="field">
                    <label :for="'item-customer-discount-' + index">Discount requested by customer (BDT)</label>
                    <input
                      :id="'item-customer-discount-' + index"
                      v-model="item.customer_requested_discount"
                      class="input"
                      :class="{ 'input-invalid': itemError(index, 'customer_requested_discount') }"
                      type="number"
                      min="0"
                      step="0.01"
                      :disabled="readOnly"
                    required
                      :aria-invalid="Boolean(itemError(index, 'customer_requested_discount'))"
                    />
                    <small v-if="itemError(index, 'customer_requested_discount')" class="field-error">{{ itemError(index, 'customer_requested_discount') }}</small>
                  </div>
                </div>
              </article>

              <div v-if="form.items.length" class="receipt-summary">
                <span>Receipt total</span>
                <strong>{{ formatPrice(formTotal) }}</strong>
              </div>
            </div>

            <footer class="dialog-actions">
              <button class="btn btn-outline" type="button" :disabled="saving" @click="closeDialog">
                {{ readOnly ? 'Close' : 'Cancel' }}
              </button>
              <button v-if="!readOnly" class="btn btn-primary" type="submit" :disabled="saving">
                {{ saving ? 'Saving...' : editingReceipt ? 'Save Changes' : 'Create Receipt' }}
              </button>
            </footer>
          </form>
        </section>
      </div>
    </Teleport>

    <Teleport to="body">
      <div v-if="moneyReceiptOpen && selectedMoneyReceipt" class="money-receipt-backdrop" @click.self="closeMoneyReceipt">
        <section class="money-receipt-modal card" role="dialog" aria-modal="true" aria-labelledby="money-receipt-title">
          <header class="money-modal-topbar">
            <div><h2>Money Receipt</h2><p>Print-ready patient receipt</p></div>
            <div class="money-modal-actions">
              <button class="btn btn-primary" type="button" @click="printMoneyReceipt"><Printer :size="16" /> Print</button>
              <button class="icon-btn" type="button" aria-label="Close money receipt" @click="closeMoneyReceipt"><X :size="18" /></button>
            </div>
          </header>

          <article class="money-receipt-paper">
            <header class="money-paper-header">
              <div class="money-hospital-mark"><Eye :size="29" /></div>
              <div class="money-hospital-name">
                <h1 id="money-receipt-title">PARAMITA EYE HOSPITAL (PVT.)</h1>
                <p>Govt. Registered No: 406</p>
                <strong>325, Charpara, Mymensingh.</strong>
              </div>
              <div class="money-office-contact">
                <span>Serial: 01301-206481</span>
                <span>Office: 01956-534302</span>
              </div>
            </header>

            <div class="money-paper-title">
              <strong>MONEY RECEIPT</strong>
              <div><span><b>Date:</b> {{ formatDate(selectedMoneyReceipt.receipt_date) }}</span><span><b>Receipt No:</b> {{ selectedMoneyReceipt.receipt_number }}</span></div>
            </div>

            <section class="money-patient-details" aria-label="Patient details">
              <div><span>Patient name</span><strong>{{ capitalizeWords(selectedMoneyReceipt.patient_name) || '—' }}</strong></div>
              <div><span>Contact number</span><strong>{{ selectedMoneyReceipt.contact_number || '—' }}</strong></div>
              <div><span>Doctor name</span><strong>{{ selectedMoneyReceipt.doctor_name || '—' }}</strong></div>
              <div><span>Investigation type</span><strong>{{ formatInvestigationType(selectedMoneyReceipt.investigation_type) }}</strong></div>
            </section>

            <div class="money-items-wrap">
              <table class="money-items-table">
                <thead><tr><th>#</th><th>Investigation</th><th>Fee</th><th>Discount</th><th>Discount (Req)</th><th>Amount</th></tr></thead>
                <tbody>
                  <tr v-for="(item, index) in selectedMoneyReceipt.items" :key="item.id || index">
                    <td>{{ index + 1 }}</td>
                    <td>{{ moneyInvestigationName(item) }}</td>
                    <td>{{ formatAmount(item.price) }}</td>
                    <td>{{ Number(item.discount || 0) > 0 ? formatAmount(item.discount) : '—' }}</td>
                    <td>{{ Number(item.customer_requested_discount || 0) > 0 ? formatAmount(item.customer_requested_discount) : '—' }}</td>
                    <td class="money-amount-cell">{{ formatAmount(moneyItemAmount(item)) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <section class="money-totals" aria-label="Receipt amount summary">
              <div><span>Actual Fees</span><strong>{{ formatAmount(moneyActualFees) }}</strong></div>
              <div><span>Discount</span><strong>{{ formatAmount(moneyDiscount) }}</strong></div>
              <div><span>Discount (Req)</span><strong>{{ formatAmount(moneyRequestedDiscount) }}</strong></div>
              <div class="money-payable"><span>Payable Amount</span><strong>BDT {{ formatAmount(moneyPayable) }}</strong></div>
            </section>

            <footer class="money-paper-signatures">
              <div><span>Patient / Guardian signature</span></div>
              <div><span>Authorized signature</span></div>
            </footer>
            <p class="money-paper-note">Thank you for choosing Paramita Eye Hospital.</p>
          </article>
        </section>
      </div>
    </Teleport>
  </section>
</template>

<script setup>
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue'
import { toast } from 'vue-sonner'
import { ChevronDown, Eye, FileText, Pencil, Plus, Printer, Search, Trash2, X } from '@lucide/vue'
import api from '../api/axios'

let nextItemKey = 0
let nextItemNumber = 1
let receiptNumberRequestId = 0
let dailySummaryRequestId = 0
let pendingOrderRequestId = 0
let pendingSearchTimer = null
const receipts = ref([])
const investigations = ref([])
const technicians = ref([])
const doctors = ref([])
const loading = ref(true)
const saving = ref(false)
const pageError = ref('')
const search = ref('')
const fromDate = ref(currentDate())
const toDate = ref(currentDate())
const investigationFilter = ref('all')
const investigationTypeFilter = ref('all')
const sortKey = ref('')
const sortDirection = ref('asc')
const summaryLoading = ref(false)
const summaryError = ref('')
const dailySummary = ref({
  total_investigation_collection: '0.00',
  total_agent_commission: '0.00',
  total_customer_requested_discount: '0.00',
  cash_in_hand: '0.00',
  total_investigation_count: 0,
})
const dialogOpen = ref(false)
const pendingOrdersOpen = ref(false)
const pendingOrders = ref([])
const pendingSearch = ref('')
const pendingDate = ref(currentDate())
const pendingType = ref('all')
const pendingOrdersLoading = ref(false)
const pendingOrdersError = ref('')
const selectedPendingByOrder = ref({})
const pendingReceiptOrderId = ref(null)
const moneyReceiptOpen = ref(false)
const selectedMoneyReceipt = ref(null)
const dialogMode = ref('create')
const editingReceipt = ref(null)
const fieldErrors = ref({})
const expandedItemKey = ref(null)
const itemsHeadingRef = ref(null)
const form = reactive({ receipt_date: '', investigation_type: 'indoor', receipt_number: '', patient_name: '', doctor_name: '', contact_number: '', cancelled_item_count: 0, cancelled_items: [], items: [] })

const investigationOptions = computed(() => [...investigations.value]
  .sort((first, second) => first.name.localeCompare(second.name)))
const pendingOrderGroups = computed(() => {
  const groups = new Map()
  for (const item of pendingOrders.value) {
    const key = Number(item.appointment_serial_number || item.order_id)
    if (!groups.has(key)) groups.set(key, { ...item, order_id: key, items: [] })
    groups.get(key).items.push(item)
  }
  return [...groups.values()]
})
watch(pendingOrderGroups, (groups) => {
  const selections = { ...selectedPendingByOrder.value }
  let changed = false
  for (const group of groups) {
    if (!Object.prototype.hasOwnProperty.call(selections, group.order_id)) {
      selections[group.order_id] = group.items.map((item) => Number(item.order_item_id))
      changed = true
    }
  }
  if (changed) selectedPendingByOrder.value = selections
})
const dateRangeError = computed(() => {
  if (!fromDate.value || !toDate.value) return 'Select both a from date and a to date.'
  return fromDate.value > toDate.value ? 'From date must be on or before the to date.' : ''
})
const hasActiveReceiptFilters = computed(() => Boolean(fromDate.value || toDate.value || search.value.trim()) || investigationFilter.value !== 'all' || investigationTypeFilter.value !== 'all')
const filteredReceipts = computed(() => {
  const query = search.value.trim().toLowerCase()
  return receipts.value.filter((receipt) => {
    if (dateRangeError.value) return false
    const receiptDate = receipt.receipt_date || ''
    const matchesDate = (!fromDate.value || receiptDate >= fromDate.value) && (!toDate.value || receiptDate <= toDate.value)
    const matchesSearch = [receipt.receipt_number, receipt.patient_name, receipt.contact_number || '', receipt.investigation_type || '']
      .some((value) => String(value).toLowerCase().includes(query))
    const matchesInvestigation = investigationFilter.value === 'all'
      || (receipt.items || []).some((item) => String(item.investigation_id) === investigationFilter.value)
    const matchesType = investigationTypeFilter.value === 'all'
      || receipt.investigation_type === investigationTypeFilter.value
    return matchesDate && matchesSearch && matchesInvestigation && matchesType
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
const availableDoctors = computed(() => doctors.value.filter((doctor) => doctor.type?.toLowerCase() === form.investigation_type))
const readOnly = computed(() => dialogMode.value === 'view')
const hasLinkedOrderItems = computed(() => form.items.some((item) => Number(item.investigation_order_item_id) > 0))
const dialogTitle = computed(() => readOnly.value ? 'View Investigation Receipt' : editingReceipt.value ? 'Edit Investigation Receipt' : 'Create Investigation Receipt')
const dialogDescription = computed(() => readOnly.value ? 'Review patient and investigation details.' : editingReceipt.value ? 'Update the receipt and its investigation items.' : 'Enter patient details and add one or more investigations.')
const actualFeesTotal = computed(() => form.items.reduce((total, item) => total + Number(priceFor(item) || 0), 0))
const discountTotal = computed(() => form.items.reduce((total, item) => total + Number(item.discount || 0), 0))
const doctorCommissionTotal = computed(() => form.items.reduce((total, item) => total + Number(item.doctor_commission || 0), 0))
const agentCommissionTotal = computed(() => form.items.reduce((total, item) => total + Number(item.agent_commission || 0), 0))
const customerRequestedDiscountTotal = computed(() => form.items.reduce((total, item) => total + Number(item.customer_requested_discount || 0), 0))
const hasDoctorCommission = computed(() => form.investigation_type === 'outdoor' && form.items.some((item) => item.doctor_commission !== '' && item.doctor_commission !== null && item.doctor_commission !== undefined))
const formTotal = computed(() => form.items.reduce((total, item) => total + Math.max(0, Number(priceFor(item) || 0) - Number(item.discount || 0) - Number(item.customer_requested_discount || 0)), 0))
const moneyActualFees = computed(() => (selectedMoneyReceipt.value?.items || []).reduce((total, item) => total + Number(item.price || 0), 0))
const moneyDiscount = computed(() => (selectedMoneyReceipt.value?.items || []).reduce((total, item) => total + Number(item.discount || 0), 0))
const moneyRequestedDiscount = computed(() => (selectedMoneyReceipt.value?.items || []).reduce((total, item) => total + Number(item.customer_requested_discount || 0), 0))
const moneyPayable = computed(() => (selectedMoneyReceipt.value?.items || []).reduce((total, item) => total + moneyItemAmount(item), 0))

function capitalizeWords(value) {
  return String(value || '').trim().toLocaleLowerCase('en').replace(/(^|\s)(\p{L})/gu, (_, space, letter) => space + letter.toLocaleUpperCase('en'))
}

function formatPrice(price) {
  return new Intl.NumberFormat('en-BD', { style: 'currency', currency: 'BDT', minimumFractionDigits: 2 }).format(Number(price || 0))
}

function formatAmount(amount) {
  return new Intl.NumberFormat('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(amount || 0))
}

function formatDate(value) {
  if (!value) return '—'
  const [year, month, day] = String(value).slice(0, 10).split('-').map(Number)
  if (!year || !month || !day) return '—'
  return new Date(year, month - 1, day).toLocaleDateString('en-BD', { year: 'numeric', month: 'short', day: 'numeric' })
}

function investigationNameFor(item) {
  return investigations.value.find((investigation) => investigation.id === Number(item.investigation_id))?.name
    || item.investigation?.name
    || 'Investigation'
}

function technicianNameFor(item) {
  return technicians.value.find((technician) => technician.id === Number(item.investigation_done_by_user_id))?.name
    || item.investigation_done_by?.name
    || '—'
}

function formatInvestigationType(value) {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : '—'
}

function receiptHasLinkedOrderItems(receipt) {
  return [...(receipt.items || []), ...(receipt.cancelled_items || [])]
    .some((item) => Number(item.investigation_order_item_id) > 0)
}

function itemError(index, field) {
  return fieldErrors.value['items.' + index + '.' + field] || ''
}

function handleInvestigationTypeChange() {
  form.doctor_name = availableDoctors.value.some((doctor) => doctor.name === form.doctor_name)
    ? form.doctor_name
    : availableDoctors.value[0]?.name || ''

  if (editingReceipt.value) {
    if (form.investigation_type === editingReceipt.value.investigation_type) {
      receiptNumberRequestId += 1
      form.receipt_number = editingReceipt.value.receipt_number
    } else {
      void loadNextReceiptNumber(form.investigation_type)
    }
  } else if (dialogMode.value === 'create') {
    void loadNextReceiptNumber(form.investigation_type)
  }
}

function defaultTechnicianId() {
  return technicians.value.find((user) => user.name?.trim().toLowerCase().replaceAll('.', '') === 'mr khakon')?.id ?? ''
}

function makeItem(item = {}, number = nextItemNumber++) {
  return {
    key: nextItemKey++,
    number,
    investigation_id: item.investigation_id ?? '',
    investigation_order_item_id: item.investigation_order_item_id ?? null,
    originalInvestigationId: item.investigation_id ?? null,
    originalPrice: item.price ?? null,
    discount: item.discount ?? 0,
    customer_requested_discount: item.customer_requested_discount ?? 0,
    agent_commission: item.agent_commission ?? '',
    doctor_commission: item.doctor_commission ?? '',
    investigation_done_by_user_id: item.investigation_done_by_user_id ?? defaultTechnicianId(),
  }
}

function nextReceiptNumberFromLoadedReceipts(investigationType) {
  const latestReceipt = receipts.value.find((receipt) => receipt.investigation_type === investigationType)
  const lastNumber = String(latestReceipt?.receipt_number || '')
  const match = lastNumber.match(/^(.*?)(\d+)$/)
  if (!match) return '1'
  return match[1] + String(Number(match[2]) + 1).padStart(match[2].length, '0')
}

async function loadNextReceiptNumber(investigationType) {
  const requestId = ++receiptNumberRequestId
  try {
    const response = await api.get('/admin/investigation-receipts/next-number', {
      params: { investigation_type: investigationType },
    })
    if (requestId === receiptNumberRequestId) {
      form.receipt_number = response.data.data.receipt_number
    }
  } catch {
    if (requestId === receiptNumberRequestId) {
      form.receipt_number = nextReceiptNumberFromLoadedReceipts(investigationType)
    }
  }
}

function currentDate() {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  return year + '-' + month + '-' + day
}

function resetForm() {
  receiptNumberRequestId += 1
  form.receipt_date = currentDate()
  form.investigation_type = 'indoor'
  form.receipt_number = ''
  form.patient_name = ''
  form.doctor_name = availableDoctors.value[0]?.name || ''
  form.contact_number = ''
  form.cancelled_item_count = 0
  form.cancelled_items = []
  nextItemNumber = 1
  form.items = [makeItem()]
  expandedItemKey.value = form.items[0].key
}

function addItem() {
  const item = makeItem()
  form.items.unshift(item)
  expandedItemKey.value = item.key
  nextTick(() => itemsHeadingRef.value?.scrollIntoView({ block: 'start', behavior: 'smooth' }))
}

function toggleItem(item) {
  expandedItemKey.value = expandedItemKey.value === item.key ? null : item.key
}

function removeItem(index) {
  const [removedItem] = form.items.splice(index, 1)
  if (expandedItemKey.value === removedItem?.key) expandedItemKey.value = form.items[0]?.key ?? null
}

function priceFor(item) {
  const selectedId = Number(item.investigation_id)
  if (!selectedId) return ''
  if (item.originalInvestigationId === selectedId && item.originalPrice !== null) return item.originalPrice
  return investigations.value.find((investigation) => investigation.id === selectedId)?.price || ''
}

function isInvestigationSelected(investigationId, currentItem) {
  return form.items.some((item) => item !== currentItem && Number(item.investigation_id) === investigationId)
}

async function loadData() {
  loading.value = true
  pageError.value = ''
  try {
    const [receiptResponse, investigationResponse, userResponse] = await Promise.all([
      api.get('/admin/investigation-receipts'),
      api.get('/admin/investigations'),
      api.get('/admin/users'),
    ])
    receipts.value = receiptResponse.data.data
    investigations.value = investigationResponse.data.data
    const activeUsers = userResponse.data.data.filter((user) => user.is_active)
    doctors.value = userResponse.data.data.filter((user) => user.role?.name?.toLowerCase() === 'doctor')
    technicians.value = activeUsers.filter((user) => ['technishian', 'technician'].includes(user.role?.name?.toLowerCase()))
    if (dialogOpen.value && !editingReceipt.value) {
      form.items.forEach((item) => {
        if (!item.investigation_done_by_user_id) item.investigation_done_by_user_id = defaultTechnicianId()
      })
    }
    await loadDailySummary()
    if (pendingOrdersOpen.value) await loadPendingOrders()
  } catch (error) {
    const status = error.response?.status
    pageError.value = status === 401
      ? 'Your session has expired. Sign in again and reload this page.'
      : status === 403
        ? 'Your account is not authorized to manage investigation receipts.'
        : status
          ? 'Investigation receipts could not be loaded (HTTP ' + status + '). Select Try again.'
          : 'The API did not respond. Check that Laravel is running, then select Try again.'
  } finally {
    loading.value = false
  }
}

async function togglePendingOrders() {
  pendingOrdersOpen.value = !pendingOrdersOpen.value
  if (pendingOrdersOpen.value) await loadPendingOrders()
}

async function loadPendingOrders() {
  const requestId = ++pendingOrderRequestId
  pendingOrdersLoading.value = true
  pendingOrdersError.value = ''
  try {
    const params = {}
    if (pendingSearch.value.trim()) params.search = pendingSearch.value.trim()
    if (pendingDate.value) params.date = pendingDate.value
    if (pendingType.value !== 'all') params.investigation_type = pendingType.value
    const response = await api.get('/admin/investigation-receipts/pending-orders', { params })
    if (requestId === pendingOrderRequestId) pendingOrders.value = response.data.data || []
  } catch (error) {
    if (requestId === pendingOrderRequestId) {
      pendingOrdersError.value = error.response?.data?.message || 'Pending investigation orders could not be loaded.'
    }
  } finally {
    if (requestId === pendingOrderRequestId) pendingOrdersLoading.value = false
  }
}

function isPendingItemSelected(orderId, itemId) {
  return (selectedPendingByOrder.value[orderId] || []).includes(Number(itemId))
}

function setPendingItemSelected(orderId, itemId, selected) {
  const current = new Set(selectedPendingByOrder.value[orderId] || [])
  if (selected) current.add(Number(itemId))
  else current.delete(Number(itemId))
  selectedPendingByOrder.value = { ...selectedPendingByOrder.value, [orderId]: [...current] }
}

function selectedPendingCount(orderId) {
  return (selectedPendingByOrder.value[orderId] || []).length
}

function selectedPendingItems(group) {
  const selectedIds = new Set(selectedPendingByOrder.value[group.order_id] || [])
  return group.items.filter((item) => selectedIds.has(Number(item.order_item_id)))
}

function selectedPendingTotal(orderId, group) {
  const selectedIds = new Set(selectedPendingByOrder.value[orderId] || [])
  return group.items.filter((item) => selectedIds.has(Number(item.order_item_id)))
    .reduce((total, item) => total + Number(item.payable_amount || 0), 0)
}

async function receivePendingOrder(group) {
  const selectedItems = selectedPendingItems(group)
  if (!selectedItems.length) return

  await openDialog(null, 'create')
  if (!dialogOpen.value) return
  pendingReceiptOrderId.value = Number(group.order_id)
  form.investigation_type = group.investigation_type || 'indoor'
  form.patient_name = group.patient_name || ''
  form.contact_number = group.contact_number || ''
  form.doctor_name = group.doctor_name || ''
  nextItemNumber = 1
  form.items = selectedItems.map((item) => makeItem({
    investigation_id: item.investigation_id,
    investigation_order_item_id: item.order_item_id,
    discount: item.doctor_discount,
    price: item.price,
  }))
  form.items.forEach((item, index) => { item.number = index + 1 })
  expandedItemKey.value = form.items[0]?.key ?? null
  void loadNextReceiptNumber(form.investigation_type)
}

watch([pendingSearch, pendingDate, pendingType], () => {
  if (!pendingOrdersOpen.value) return
  clearTimeout(pendingSearchTimer)
  pendingSearchTimer = setTimeout(() => void loadPendingOrders(), 250)
})

async function loadDailySummary() {
  if (dateRangeError.value) {
    dailySummaryRequestId += 1
    summaryLoading.value = false
    summaryError.value = ''
    dailySummary.value = {
      total_investigation_collection: '0.00',
      total_agent_commission: '0.00',
      total_customer_requested_discount: '0.00',
      cash_in_hand: '0.00',
      total_investigation_count: 0,
    }
    return
  }
  const requestId = ++dailySummaryRequestId
  summaryLoading.value = true
  summaryError.value = ''

  try {
    const params = { from_date: fromDate.value, to_date: toDate.value }
    if (investigationFilter.value !== 'all') params.investigation_id = Number(investigationFilter.value)
    if (investigationTypeFilter.value !== 'all') params.investigation_type = investigationTypeFilter.value
    const response = await api.get('/admin/investigation-receipts/report-summary', {
      params,
    })
    if (requestId === dailySummaryRequestId) {
      dailySummary.value = response.data.data
    }
  } catch (error) {
    if (requestId === dailySummaryRequestId) {
      summaryError.value = error.response?.status
        ? 'Receipt totals could not be loaded (HTTP ' + error.response.status + ').'
        : 'Receipt totals could not be loaded. Check that Laravel is running.'
    }
  } finally {
    if (requestId === dailySummaryRequestId) {
      summaryLoading.value = false
    }
  }
}

async function openDialog(receipt = null, mode = 'create') {
  dialogMode.value = mode
  editingReceipt.value = null
  pendingReceiptOrderId.value = null
  fieldErrors.value = {}
  resetForm()

  if (!receipt && mode === 'create') {
    await loadNextReceiptNumber(form.investigation_type)
  }

  if (receipt) {
    try {
      const response = await api.get('/admin/investigation-receipts/' + receipt.id)
      const data = response.data.data
      editingReceipt.value = data
      form.receipt_date = data.receipt_date
      form.investigation_type = data.investigation_type || 'indoor'
      form.receipt_number = data.receipt_number
      form.patient_name = data.patient_name
      form.doctor_name = availableDoctors.value.some((doctor) => doctor.name === data.doctor_name)
        ? data.doctor_name
        : availableDoctors.value[0]?.name || ''
      form.contact_number = data.contact_number || ''
      form.cancelled_item_count = Number(data.cancelled_item_count || 0)
      form.cancelled_items = (data.cancelled_items || []).map((item, index) => ({
        ...makeItem(item, index + 1),
        cancelled_at: item.cancelled_at,
      }))
      form.items = data.items.map((item, index) => makeItem(item, index + 1))
      nextItemNumber = form.items.length + 1
      expandedItemKey.value = form.items[0]?.key ?? null
    } catch {
      toast.error('The receipt could not be loaded.')
      return
    }
  }

  dialogOpen.value = true
}

function closeDialog() {
  if (saving.value) return
  receiptNumberRequestId += 1
  dialogOpen.value = false
}

async function saveReceipt() {
  fieldErrors.value = {}
  const requiredErrors = {}

  if (!form.contact_number.trim()) {
    requiredErrors.contact_number = 'The patient contact number field is required.'
  }
  if (!form.doctor_name.trim()) {
    requiredErrors.doctor_name = 'The doctor name field is required.'
  }

  if (Object.keys(requiredErrors).length > 0) {
    fieldErrors.value = requiredErrors
    return
  }

  saving.value = true

  const payload = {
    receipt_date: form.receipt_date,
    investigation_type: form.investigation_type,
    receipt_number: form.receipt_number,
    patient_name: form.patient_name,
    doctor_name: form.doctor_name || null,
    contact_number: form.contact_number || null,
    items: form.items.map((item) => ({
      investigation_id: Number(item.investigation_id),
      investigation_order_item_id: item.investigation_order_item_id ? Number(item.investigation_order_item_id) : null,
      discount: item.discount === '' ? 0 : Number(item.discount),
      customer_requested_discount: item.customer_requested_discount === '' ? 0 : Number(item.customer_requested_discount),
      agent_commission: item.agent_commission === '' ? null : Number(item.agent_commission),
      doctor_commission: form.investigation_type === 'outdoor' && item.doctor_commission !== '' ? Number(item.doctor_commission) : null,
      investigation_done_by_user_id: item.investigation_done_by_user_id ? Number(item.investigation_done_by_user_id) : null,
    })),
  }

  try {
    if (editingReceipt.value) {
      await api.put('/admin/investigation-receipts/' + editingReceipt.value.id, payload)
      toast.success('Investigation receipt updated successfully.')
    } else {
      await api.post('/admin/investigation-receipts', payload)
      toast.success('Investigation receipt created successfully.')
    }

    dialogOpen.value = false
    if (pendingReceiptOrderId.value !== null) {
      const selections = { ...selectedPendingByOrder.value }
      delete selections[pendingReceiptOrderId.value]
      selectedPendingByOrder.value = selections
      pendingReceiptOrderId.value = null
    }
    resetForm()
    editingReceipt.value = null
    fieldErrors.value = {}
    await loadData()
  } catch (error) {
    const response = error.response?.data
    if (response?.errors) {
      fieldErrors.value = Object.fromEntries(
        Object.entries(response.errors).map(([key, messages]) => [key, messages[0]])
      )
    } else {
      toast.error(response?.message || 'The receipt could not be saved.')
    }
  } finally {
    saving.value = false
  }
}

async function openMoneyReceipt(receipt) {
  try {
    const response = await api.get('/admin/investigation-receipts/' + receipt.id)
    selectedMoneyReceipt.value = response.data.data
    moneyReceiptOpen.value = true
  } catch {
    toast.error('The money receipt could not be loaded.')
  }
}

function closeMoneyReceipt() {
  moneyReceiptOpen.value = false
  selectedMoneyReceipt.value = null
}

function moneyInvestigationName(item) {
  return item.investigation?.name
    || investigations.value.find((investigation) => investigation.id === Number(item.investigation_id))?.name
    || 'Investigation'
}

function moneyItemAmount(item) {
  return Math.max(0, Number(item.price || 0) - Number(item.discount || 0) - Number(item.customer_requested_discount || 0))
}

function visibleReceiptItems(receipt) {
  const items = receipt.items || []
  if (investigationFilter.value === 'all') return items
  return items.filter((item) => String(item.investigation_id) === investigationFilter.value)
}

function receiptInvestigationNames(receipt) {
  const names = [...new Set(visibleReceiptItems(receipt)
    .map((item) => item.investigation?.name || investigationNameFor(item))
    .filter(Boolean))]
  return names.join(', ') || '—'
}

function receiptDisplayAmount(receipt, itemField, receiptField) {
  if (investigationFilter.value === 'all') return receipt[receiptField]
  return visibleReceiptItems(receipt).reduce((total, item) => total + Number(item[itemField] || 0), 0)
}

function receiptDisplayPayable(receipt) {
  if (investigationFilter.value === 'all') return receipt.payable_amount
  return visibleReceiptItems(receipt).reduce((total, item) => total + moneyItemAmount(item), 0)
}

function receiptSortValue(receipt, key) {
  switch (key) {
    case 'date': return receipt.receipt_date || ''
    case 'receipt_number': return receipt.receipt_number || ''
    case 'patient_name': return receipt.patient_name || ''
    case 'investigations': return receiptInvestigationNames(receipt)
    case 'actual_fees': return Number(receiptDisplayAmount(receipt, 'price', 'actual_fees') || 0)
    case 'discount': return Number(receiptDisplayAmount(receipt, 'discount', 'discount') || 0)
    case 'agent_commission': return Number(receiptDisplayAmount(receipt, 'agent_commission', 'agent_commission') || 0)
    case 'customer_requested_discount': return Number(receiptDisplayAmount(receipt, 'customer_requested_discount', 'customer_requested_discount') || 0)
    case 'payable_amount': return Number(receiptDisplayPayable(receipt) || 0)
    default: return ''
  }
}

function toggleReceiptSort(key) {
  if (sortKey.value === key) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
    return
  }
  sortKey.value = key
  sortDirection.value = 'asc'
}

function sortAria(key) {
  return sortKey.value === key ? (sortDirection.value === 'asc' ? 'ascending' : 'descending') : 'none'
}

function sortIndicator(key) {
  if (sortKey.value !== key) return '↕'
  return sortDirection.value === 'asc' ? '↑' : '↓'
}

function sortButtonLabel(key, label) {
  if (sortKey.value !== key) return 'Sort by ' + label + ' ascending'
  return 'Sort by ' + label + (sortDirection.value === 'asc' ? ' descending' : ' ascending')
}

function printMoneyReceipt() {
  document.body.classList.add('printing-money-receipt')
  window.addEventListener('afterprint', () => document.body.classList.remove('printing-money-receipt'), { once: true })
  window.print()
}
async function deleteReceipt(receipt) {
  if (!window.confirm('Delete receipt "' + receipt.receipt_number + '" and all its investigation items?')) return

  try {
    await api.delete('/admin/investigation-receipts/' + receipt.id)
    toast.success('Investigation receipt deleted successfully.')
    await loadData()
  } catch (error) {
    toast.error(error.response?.data?.errors?.receipt?.[0] || error.response?.data?.message || 'The receipt could not be deleted.')
  }
}

watch(availableDoctors, (matchingDoctors) => {
  if (!matchingDoctors.some((doctor) => doctor.name === form.doctor_name)) {
    form.doctor_name = matchingDoctors[0]?.name || ''
  }
})

watch([fromDate, toDate, investigationFilter, investigationTypeFilter], loadDailySummary)
onMounted(loadData)
</script>

<style scoped>
.receipt-card { overflow: hidden; }
.linked-receipt-lock { align-self: center; padding: 5px 7px; border-radius: 8px; color: #64748b; background: #f1f5f9; font-size: 10px; font-weight: 650; white-space: nowrap; }
.pending-count { display: inline-grid; min-width: 21px; height: 21px; place-items: center; margin-left: 3px; padding: 0 5px; border-radius: 999px; color: #5b45e8; background: #efedff; font-size: 11px; font-weight: 700; }
.pending-orders-panel { margin: 0 0 18px; padding: 18px; }
.pending-orders-head { display: flex; justify-content: space-between; gap: 16px; align-items: flex-start; margin-bottom: 16px; }
.pending-orders-head h2 { margin: 0 0 5px; font-size: 16px; }
.pending-orders-head p { margin: 0; color: var(--muted); font-size: 12px; }
.pending-orders-filters { display: flex; align-items: center; gap: 12px; margin: 14px 0 18px; }
.pending-order-search { display: flex; min-width: 280px; min-height: 58px; flex: 1 1 460px; align-items: center; gap: 12px; padding: 7px 12px 7px 8px; border: 1px solid #c7d2fe; border-radius: 15px; background: linear-gradient(110deg, #f5f3ff 0%, #fff 48%); box-shadow: 0 4px 12px rgba(79, 70, 229, .08); transition: border-color .18s ease, box-shadow .18s ease, transform .18s ease; }
.pending-order-search:focus-within { transform: translateY(-1px); border-color: #7c6cf2; box-shadow: 0 0 0 4px rgba(99, 102, 241, .13), 0 8px 20px rgba(79, 70, 229, .12); }
.pending-search-icon { display: grid; width: 40px; height: 40px; flex: 0 0 auto; place-items: center; border-radius: 11px; color: #fff; background: linear-gradient(140deg, #6154eb, #8b5cf6); box-shadow: 0 4px 9px rgba(99, 102, 241, .24); }
.pending-search-content { display: grid; min-width: 0; flex: 1; gap: 2px; }
.pending-search-content small { color: #6759dc; font-size: 9px; font-weight: 800; letter-spacing: .09em; }
.pending-search-content input { width: 100%; min-width: 0; padding: 0; border: 0; outline: 0; color: #172033; background: transparent; font: inherit; font-size: 13px; }
.pending-search-content input::placeholder { color: #94a3b8; }
.pending-search-chip { padding: 5px 9px; border: 1px solid #e4e2ff; border-radius: 8px; color: #6657db; background: #fff; font-size: 10px; font-weight: 700; }
.pending-orders-filters > select { width: 150px; }
.pending-orders-filters > span:not(.spacer) { color: var(--muted); font-size: 12px; white-space: nowrap; }
.pending-order-list { display: grid; gap: 12px; }
.pending-order-card { overflow: hidden; border: 1px solid var(--border); border-radius: 14px; background: #fff; }
.pending-order-patient { display: flex; width: 100%; min-height: 68px; align-items: center; gap: 12px; padding: 12px 15px; background: #f8faff; cursor: pointer; list-style: none; }
.pending-order-patient::-webkit-details-marker { display: none; }
.pending-order-patient::marker { content: ''; }
.pending-patient-chevron { display: grid; width: 29px; height: 29px; flex: 0 0 auto; place-items: center; border-radius: 9px; color: #5b45e8; background: #efedff; transition: transform .18s ease; }
.pending-order-card[open] > .pending-order-patient { border-bottom: 1px solid var(--border); }
.pending-order-card[open] .pending-patient-chevron { transform: rotate(180deg); }
.pending-patient-main, .pending-order-doctor { display: grid; gap: 4px; }
.pending-patient-main { min-width: 0; flex: 1; }
.pending-patient-main strong { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.pending-order-patient small { color: var(--muted); font-size: 11px; font-weight: 400; }
.pending-order-doctor { text-align: right; }
.pending-order-doctor small { justify-self: end; width: fit-content; padding: 3px 8px; border-radius: 999px; color: #5b45e8; background: #efedff; font-size: 10px; }
.pending-order-body { padding: 0 14px 12px; }
.pending-order-table-wrap { overflow-x: auto; }
.pending-order-table { width: 100%; min-width: 560px; }
.pending-order-table th, .pending-order-table td { padding: 10px 12px; }
.pending-order-table th:first-child, .pending-order-table td:first-child { width: 42px; text-align: center; }
.pending-order-table th:nth-child(n+3), .pending-order-table td:nth-child(n+3) { text-align: right; white-space: nowrap; }
.pending-order-table input[type="checkbox"] { width: 16px; height: 16px; accent-color: #5b45e8; }
.pending-investigation-name { font-weight: 650; }
.pending-due-cell { color: #059669; font-weight: 700; }
.pending-order-footer { display: flex; justify-content: space-between; align-items: center; gap: 14px; padding: 12px 14px; }
.pending-order-footer > span { color: var(--muted); font-size: 11px; }
.linked-order-note { margin: 14px 24px 0; padding: 11px 13px; border: 1px solid #bfdbfe; border-radius: 11px; color: #1e40af; background: #eff6ff; font-size: 12px; }
.linked-order-note strong { margin-right: 4px; }
@media (max-width: 760px) {
  .pending-orders-filters { align-items: stretch; flex-wrap: wrap; }
  .pending-order-search { flex-basis: 100%; }
  .pending-order-patient { align-items: flex-start; }
  .pending-order-doctor { max-width: 130px; }
  .pending-order-footer { align-items: stretch; flex-direction: column; }
}
@media (max-width: 480px) {
  .pending-orders-panel { padding: 13px; }
  .pending-order-patient { flex-direction: column; }
  .pending-order-doctor { text-align: left; }
  .pending-order-doctor > span { justify-self: start; }
}
.date-filter { display: inline-flex; align-items: center; gap: 9px; color: var(--muted); font-size: 12px; }
.date-filter input { min-height: 40px; padding: 0 11px; border: 1px solid var(--border); border-radius: 12px; color: #172033; background: #fff; font: inherit; }
.date-filter { gap: 6px; }
.date-filter input { width: 145px; }
.receipt-investigation-filter { width: auto; min-width: 205px; }
.receipt-type-filter { width: auto; min-width: 145px; }
.daily-summary-grid { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 14px; margin: 0 0 18px; }
.daily-summary-card { display: flex; min-height: 98px; flex-direction: column; justify-content: center; gap: 8px; padding: 17px 20px; border: 1px solid var(--border); border-radius: 17px; background: #fff; box-shadow: 0 5px 16px rgba(27, 42, 74, .045); }
.daily-summary-card > span { color: var(--muted); font-size: 12px; font-weight: 600; }
.daily-summary-card > strong { color: #172033; font-size: 22px; line-height: 1.15; }
.daily-summary-card > small { color: var(--muted); font-size: 11px; }
.commission-summary-card { border-left: 4px solid #f59e0b; }
.customer-discount-summary-card { border-left: 4px solid #6366f1; }
.cash-summary-card { border-left: 4px solid #10b981; }
.cash-summary-card > strong { color: #059669; }
.investigation-count-summary-card { border-left: 4px solid #0ea5e9; }
.summary-error { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin: -6px 0 16px; padding: 10px 13px; border: 1px solid #fecaca; border-radius: 12px; color: #b91c1c; background: #fef2f2; font-size: 12px; }
.receipt-table { width: 100%; min-width: 1180px; table-layout: fixed; }
.receipt-table th, .receipt-table td { padding-left: 10px; padding-right: 10px; }
.sort-button { display: inline-flex; align-items: center; gap: 4px; padding: 0; border: 0; color: inherit; background: transparent; font: inherit; text-align: left; text-transform: inherit; cursor: pointer; }
.sort-button:hover, .sort-button:focus-visible { color: #475569; }
.sort-button:focus-visible { outline: 2px solid var(--primary); outline-offset: 3px; border-radius: 3px; }
.sort-indicator { color: #94a3b8; font-size: 13px; line-height: 1; }
.sort-active .sort-indicator { color: var(--primary); }
.receipt-table th:nth-child(1) { width: 3%; }
.receipt-table th:nth-child(2) { width: 7%; }
.receipt-table th:nth-child(3) { width: 6%; }
.receipt-table th:nth-child(4) { width: 10%; }
.receipt-table th:nth-child(5) { width: 12%; }
.receipt-table th:nth-child(6) { width: 9%; }
.receipt-table th:nth-child(7) { width: 8%; }
.receipt-table th:nth-child(8) { width: 7%; }
.receipt-table th:nth-child(9) { width: 8%; }
.receipt-table th:nth-child(10) { width: 9%; }
.receipt-table th:nth-child(11) { width: 9%; }
.receipt-table th:nth-child(12) { width: 12%; }
.actions-heading { text-align: right; }
.receipt-actions { display: grid; grid-template-columns: repeat(2, max-content); justify-content: end; gap: 6px; }
.receipt-actions .icon-btn { width: 34px; height: 34px; }
.danger-action { color: #dc2626; }
.danger-action:hover { background: #fef2f2; color: #b91c1c; }
.receipt-total-count { color: var(--muted); font-size: 12px; }
@media (max-width: 850px) {
  .daily-summary-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (max-width: 1200px) and (min-width: 851px) {
  .daily-summary-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
}
@media (max-width: 600px) {
  .receipt-investigation-filter, .receipt-type-filter { width: 100%; }
  .daily-summary-grid { grid-template-columns: 1fr; }
  .date-filter { width: 100%; justify-content: space-between; }
  .date-filter input { width: auto; flex: 1; }
  .summary-error { align-items: flex-start; flex-direction: column; }
}
.price-cell { font-weight: 600; white-space: nowrap; }
.investigations-cell { min-width: 0; white-space: normal; overflow-wrap: anywhere; }
.payable-cell { font-weight: 800; color: var(--primary); }
.item-count { display: inline-flex; min-width: 25px; justify-content: center; padding: 3px 7px; border-radius: 99px; background: #f1f5f9; font-weight: 700; }
.receipt-view { display: grid; gap: 18px; max-width: 920px; margin: 0 auto; }
.receipt-view-banner { display: flex; align-items: center; gap: 13px; padding: 18px 20px; border-radius: 16px; color: #fff; background: linear-gradient(120deg, #4f46e5, #7c3aed 58%, #0891b2); box-shadow: 0 10px 22px rgba(79, 70, 229, 0.18); }
.view-banner-icon { display: grid; width: 46px; height: 46px; flex: 0 0 auto; place-items: center; border: 1px solid rgba(255,255,255,.3); border-radius: 14px; background: rgba(255,255,255,.16); }
.view-banner-title { display: grid; gap: 2px; }
.view-banner-title span { color: rgba(255,255,255,.78); font-size: 12px; }
.view-banner-title strong { font-size: 20px; letter-spacing: .02em; }
.view-type-badge { margin-left: auto; padding: 6px 11px; border: 1px solid rgba(255,255,255,.32); border-radius: 999px; background: rgba(255,255,255,.15); font-size: 12px; font-weight: 700; }
.view-meta-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
.view-meta-card, .view-detail { display: grid; gap: 5px; min-width: 0; }
.view-meta-card { padding: 14px 16px; border: 1px solid var(--border); border-radius: 13px; background: #fff; }
.view-meta-card span, .view-detail span, .view-item-fee span { color: var(--muted); font-size: 11px; font-weight: 600; }
.view-meta-card strong, .view-detail strong { overflow-wrap: anywhere; color: #172033; font-size: 13px; }
.view-section { padding: 17px; border: 1px solid var(--border); border-radius: 16px; background: #fff; }
.view-section-heading { display: flex; align-items: center; gap: 10px; margin-bottom: 15px; }
.view-section-heading h3 { color: #172033; font-size: 14px; }
.view-section-heading p { margin-top: 2px; color: var(--muted); font-size: 11px; }
.view-section-icon { display: grid; width: 34px; height: 34px; flex: 0 0 auto; place-items: center; border-radius: 11px; }
.patient-icon { color: #4f46e5; background: #eef2ff; }
.investigation-icon { color: #0891b2; background: #ecfeff; }
.patient-view-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; }
.view-investigation-list { display: grid; gap: 10px; }
.cancelled-items-note { margin: -5px 0 13px; padding: 10px 12px; border: 1px solid #fed7aa; border-radius: 10px; color: #9a3412; background: #fff7ed; font-size: 12px; }
.cancelled-history-list { display: grid; gap: 8px; margin-top: 15px; }
.cancelled-history-list h4 { color: #7f1d1d; font-size: 12px; }
.cancelled-history-card { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 11px 12px; border: 1px solid #fee2e2; border-radius: 11px; background: #fffafa; }
.cancelled-history-card > div { display: grid; gap: 3px; }
.cancelled-history-card strong { color: #334155; font-size: 12px; }
.cancelled-history-card span { color: var(--muted); font-size: 11px; }
.cancelled-history-card .cancelled-history-badge { padding: 5px 8px; border-radius: 999px; color: #991b1b; background: #fef2f2; font-weight: 700; }
.view-investigation-card { padding: 14px; border: 1px solid #e8edf5; border-radius: 13px; background: #fbfcff; }
.view-investigation-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding-bottom: 12px; border-bottom: 1px solid #e8edf5; }
.view-investigation-head > div:first-child { display: flex; align-items: center; gap: 9px; min-width: 0; }
.view-item-number { display: grid; width: 28px; height: 28px; flex: 0 0 auto; place-items: center; border-radius: 9px; color: #4f46e5; background: #eef2ff; font-size: 10px; font-weight: 800; }
.view-investigation-head h4 { overflow-wrap: anywhere; color: #172033; font-size: 13px; }
.view-item-fee { display: grid; justify-items: end; gap: 2px; flex: 0 0 auto; }
.view-item-fee strong { color: #4f46e5; font-size: 14px; }
.view-item-details { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 13px 18px; padding-top: 12px; }
.view-totals { display: grid; gap: 0; padding: 7px 18px; border: 1px solid var(--border); border-radius: 16px; background: #fff; }
.view-total-row { display: flex; justify-content: space-between; gap: 12px; padding: 10px 2px; border-bottom: 1px solid #edf0f5; color: #526078; font-size: 12px; }
.view-total-row strong { color: #172033; font-size: 13px; }
.view-total-row:last-child { border-bottom: 0; }
.view-payable-row { align-items: center; margin: 3px -6px 0; padding: 13px 10px; border: 0; border-radius: 11px; color: #312e81; background: #eef2ff; font-size: 13px; font-weight: 700; }
.view-payable-row strong { color: #4f46e5; font-size: 19px; }
.dialog-backdrop { position: fixed; inset: 0; z-index: 100; display: grid; place-items: center; overflow-y: auto; padding: 20px; background: rgba(15, 23, 42, 0.56); }
.receipt-dialog { display: flex; flex-direction: column; width: min(980px, 100%); max-height: min(940px, calc(100vh - 40px)); overflow: hidden; }
.receipt-dialog > form { display: flex; flex: 1; flex-direction: column; min-height: 0; overflow: hidden; }
.dialog-head { display: flex; flex: 0 0 auto; align-items: flex-start; justify-content: space-between; gap: 16px; padding: 20px 24px; border-bottom: 1px solid var(--border); }
.dialog-head h2 { font-size: 19px; }
.dialog-head p { margin-top: 3px; color: var(--muted); font-size: 12.5px; }
.dialog-body { flex: 1; min-height: 0; overflow-y: auto; overscroll-behavior: contain; padding: 20px 24px; }
.receipt-fields { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; }
.items-heading { position: sticky; top: 0; z-index: 5; display: flex; align-items: center; justify-content: space-between; gap: 16px; margin: 8px -24px 14px; padding: 12px 24px; border-bottom: 1px solid var(--border); background: #fff; }
.items-heading h3 { font-size: 15px; }
.items-heading p { margin-top: 3px; color: var(--muted); font-size: 12px; }
.items-total-inline { display: flex; align-items: baseline; gap: 8px; margin-left: auto; padding: 7px 11px; border-radius: 10px; color: var(--muted); background: #eef2ff; font-size: 11px; white-space: nowrap; }
.items-total-inline strong { color: var(--primary); font-size: 13px; }
.item-panel { padding: 15px; margin-bottom: 12px; border: 1px solid var(--border); border-radius: 13px; background: #fbfcff; transition: border-color .18s ease, box-shadow .18s ease; }
.item-panel.item-panel-open { border-color: #c7d2fe; box-shadow: 0 5px 14px rgba(79, 70, 229, .07); }
.item-panel-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 0; }
.item-accordion-toggle { display: flex; flex: 1; min-width: 0; align-items: center; gap: 10px; padding: 4px 0; border: 0; color: inherit; background: transparent; text-align: left; cursor: pointer; }
.accordion-chevron { display: grid; width: 30px; height: 30px; flex: 0 0 auto; place-items: center; border-radius: 9px; color: #526078; background: #f1f5f9; transition: transform .18s ease, background .18s ease; }
.accordion-chevron.expanded { transform: rotate(180deg); color: #4f46e5; background: #eef2ff; }
.accordion-title { flex: 0 0 auto; color: #172033; font-size: 13px; font-weight: 700; }
.accordion-summary { overflow: hidden; color: var(--muted); font-size: 12px; text-overflow: ellipsis; white-space: nowrap; }
.accordion-price { margin-left: auto; color: #4f46e5; font-size: 12px; white-space: nowrap; }
.item-fields { padding-top: 14px; }
.item-panel-head h4 { font-size: 13px; }
.item-fields { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 13px 16px; }
.item-fields .field { min-width: 0; }
.readonly-price { background: #f8fafc; color: #475569; }
.checkbox-field { display: flex; align-items: center; gap: 8px; align-self: center; min-height: 40px; color: #334155; font-size: 13px; }
.checkbox-field input { accent-color: var(--primary); }
.required { color: #dc2626; font-weight: 800; }
.input-invalid { border-color: #dc2626; }
.field-error { display: block; margin-top: 5px; color: #dc2626; font-size: 12px; }
.items-error { margin: -4px 0 12px; }
.receipt-summary { display: flex; justify-content: flex-end; align-items: center; gap: 15px; padding: 12px 0 0; color: #334155; }
.receipt-summary strong { font-size: 17px; color: var(--primary); }
.dialog-actions { display: flex; flex: 0 0 auto; justify-content: flex-end; gap: 10px; padding: 15px 24px 19px; border-top: 1px solid var(--border); }
.dialog-actions button:disabled { opacity: 0.65; cursor: wait; }
@media (max-width: 850px) {
  .receipt-fields { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .patient-view-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (max-width: 600px) {
  .receipt-fields { grid-template-columns: 1fr; }
  .patient-view-grid, .view-item-details, .view-meta-grid { grid-template-columns: 1fr; }
  .view-section { padding: 14px; }
  .view-investigation-head { align-items: flex-start; }
  .view-item-fee strong { font-size: 13px; }
}
@media (max-width: 850px) {
  .item-fields { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (max-width: 600px) {
  .dialog-backdrop { padding: 10px; }
  .dialog-head, .dialog-body { padding-right: 15px; padding-left: 15px; }
  .items-heading { margin-right: -15px; margin-left: -15px; padding-right: 15px; padding-left: 15px; }
  .accordion-summary { display: none; }
  .dialog-actions { padding-right: 15px; padding-left: 15px; }
  .item-fields { grid-template-columns: 1fr; }
  .items-heading { align-items: flex-start; flex-wrap: wrap; }
  .items-heading > div:first-child { flex: 1 0 100%; }
  .items-total-inline { margin-left: 0; }
}
.mr-action { color: #b45309; }
.mr-action:hover { color: #92400e; background: #fffbeb; }
.money-receipt-backdrop { position: fixed; inset: 0; z-index: 110; display: flex; align-items: center; justify-content: center; overflow: auto; padding: 18px; background: rgba(15, 23, 42, .62); }
.money-receipt-modal { display: flex; flex-direction: column; width: min(900px, 100%); max-height: calc(100vh - 36px); overflow: hidden; }
.money-modal-topbar { display: flex; flex: 0 0 auto; align-items: center; justify-content: space-between; gap: 14px; padding: 15px 20px; border-bottom: 1px solid var(--border); }
.money-modal-topbar h2 { color: #172033; font-size: 17px; }
.money-modal-topbar p { margin-top: 2px; color: var(--muted); font-size: 12px; }
.money-modal-actions { display: flex; align-items: center; gap: 9px; }
.money-modal-actions .btn { display: inline-flex; align-items: center; gap: 7px; }
.money-receipt-paper { width: 100%; max-width: 820px; align-self: center; overflow: auto; padding: 28px 34px 24px; color: #1f2937; background: #fff; }
.money-paper-header { display: grid; grid-template-columns: 54px minmax(0, 1fr) auto; align-items: center; gap: 13px; padding-bottom: 16px; border-bottom: 3px solid #b9382e; }
.money-hospital-mark { display: grid; width: 52px; height: 52px; place-items: center; border: 2px solid #bf3e35; border-radius: 50%; color: #a62e28; }
.money-hospital-name h1 { color: #b9382e; font-size: clamp(16px, 2.2vw, 22px); font-weight: 800; line-height: 1.15; }
.money-hospital-name p { margin-top: 4px; color: #46515e; font-size: 11px; }
.money-hospital-name strong { display: inline-block; margin-top: 5px; padding: 4px 8px; color: #fff; background: #283747; font-size: 12px; }
.money-office-contact { display: grid; gap: 5px; padding: 9px 11px; border-radius: 7px; color: #fff; background: #b9382e; font-size: 10px; font-weight: 700; white-space: nowrap; }
.money-paper-title { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin: 17px 0 13px; }
.money-paper-title > strong { padding: 6px 16px; border-radius: 999px; color: #fff; background: #bd3b31; font-family: Georgia, serif; font-size: 17px; font-style: italic; }
.money-paper-title > div { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 10px 18px; color: #384454; font-size: 11px; }
.money-patient-details { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0 18px; margin-bottom: 15px; border: 1px solid #d7dde4; border-radius: 8px; }
.money-patient-details > div { display: grid; grid-template-columns: 112px minmax(0, 1fr); gap: 8px; padding: 9px 11px; border-bottom: 1px solid #e7ebef; font-size: 11px; }
.money-patient-details > div:nth-last-child(-n+2) { border-bottom: 0; }
.money-patient-details span { color: #647184; }
.money-patient-details strong { overflow-wrap: anywhere; color: #1d2938; }
.money-items-wrap { overflow-x: auto; }
.money-items-table { width: 100%; min-width: 590px; border-collapse: collapse; font-size: 11px; }
.money-items-table th { padding: 8px 9px; border: 1px solid #cfd5dc; color: #fff; background: #b9382e; text-align: left; white-space: nowrap; }
.money-items-table td { padding: 8px 9px; border: 1px solid #d8dde3; }
.money-items-table th:first-child, .money-items-table td:first-child { width: 34px; text-align: center; }
.money-items-table th:nth-child(n+3), .money-items-table td:nth-child(n+3) { text-align: right; white-space: nowrap; }
.money-items-table .money-amount-cell { font-weight: 700; }
.money-totals { display: grid; width: min(350px, 100%); gap: 0; margin: 15px 0 0 auto; }
.money-totals > div { display: flex; justify-content: space-between; gap: 14px; padding: 7px 9px; border-bottom: 1px solid #e3e7eb; font-size: 11px; }
.money-totals strong { white-space: nowrap; }
.money-totals .money-payable { margin-top: 4px; border: 0; border-radius: 5px; color: #fff; background: #293848; font-size: 13px; font-weight: 700; }
.money-payable strong { color: #fff; font-size: 15px; }
.money-paper-signatures { display: flex; justify-content: space-between; gap: 30px; margin-top: 42px; }
.money-paper-signatures div { width: 190px; padding-top: 7px; border-top: 1px solid #46515e; text-align: center; }
.money-paper-signatures span { color: #536071; font-size: 10px; }
.money-paper-note { margin-top: 18px; color: #7a8490; font-size: 9px; text-align: center; }
@media (max-width: 650px) {
  .money-receipt-backdrop { align-items: flex-start; padding: 8px; }
  .money-receipt-modal { max-height: calc(100vh - 16px); }
  .money-modal-topbar { padding: 12px; }
  .money-receipt-paper { padding: 20px 14px; }
  .money-paper-header { grid-template-columns: 42px minmax(0, 1fr); gap: 9px; }
  .money-hospital-mark { width: 40px; height: 40px; }
  .money-hospital-mark svg { width: 23px; }
  .money-office-contact { grid-column: 1 / -1; grid-template-columns: 1fr 1fr; }
  .money-paper-title { align-items: flex-start; flex-direction: column; }
  .money-paper-title > div { justify-content: flex-start; }
  .money-patient-details { grid-template-columns: 1fr; }
  .money-patient-details > div:nth-last-child(2) { border-bottom: 1px solid #e7ebef; }
  .money-paper-signatures { gap: 20px; margin-top: 32px; }
}
@page { size: A4 portrait; margin: 12mm; }
@media print {
  :global(body.printing-money-receipt *) { visibility: hidden !important; }
  :global(body.printing-money-receipt .money-receipt-paper),
  :global(body.printing-money-receipt .money-receipt-paper *) { visibility: visible !important; }
  .money-receipt-backdrop { position: static; display: block; overflow: visible; padding: 0; background: transparent; }
  .money-receipt-modal { display: block; width: 100%; max-height: none; overflow: visible; border: 0; box-shadow: none; }
  .money-modal-topbar { display: none !important; }
  .money-receipt-paper { position: absolute; top: 0; left: 0; width: 100%; max-width: none; max-height: none; margin: 0; padding: 0; overflow: visible; border: 0; border-radius: 0; box-shadow: none; }
  .money-paper-header, .money-patient-details, .money-items-table, .money-totals, .money-paper-signatures { break-inside: avoid; }
  .money-paper-note { margin-top: 12px; }
}
</style>
