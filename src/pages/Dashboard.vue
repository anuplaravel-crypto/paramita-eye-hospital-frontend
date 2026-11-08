<template>
  <div>
    <!-- ===== Hero ===== -->
    <section class="hero">
      <div style="position: relative; z-index: 2">
        <h1>Good morning, Tasnim! 👋</h1>
        <p>
          Here's what's happening at Paramita Eye Hospital today —
          32 appointments scheduled and 6 patients waiting for confirmation.
        </p>
      </div>
      <div class="hero-actions">
        <button class="btn btn-white" @click="toast.info('Report export started (demo)')">
          <Download :size="17" /> Export Report
        </button>
        <button class="btn" style="background: #fff; color: #4338ca" @click="toast.success('New appointment form opened (demo)')">
          <Plus :size="17" /> New Appointment
        </button>
      </div>
    </section>

    <!-- ===== Stats ===== -->
    <section class="stat-grid">
      <StatCard
        v-for="s in stats"
        :key="s.label"
        v-bind="s"
      />
    </section>

    <!-- ===== Chart + Departments ===== -->
    <section class="grid-2-1">
      <div class="card">
        <div class="card-head">
          <div>
            <div class="card-title">Appointments Overview</div>
            <div class="card-sub">Last 7 days · total 358 appointments</div>
          </div>
          <div class="legend"><span><i style="background: linear-gradient(135deg,#6366f1,#06b6d4)"></i>Appointments</span></div>
        </div>
        <div class="chart-body">
          <svg class="chart-svg" viewBox="0 0 640 250" preserveAspectRatio="xMidYMid meet">
            <defs>
              <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#6366f1" stop-opacity="0.35" />
                <stop offset="100%" stop-color="#6366f1" stop-opacity="0" />
              </linearGradient>
              <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stop-color="#6366f1" />
                <stop offset="100%" stop-color="#06b6d4" />
              </linearGradient>
            </defs>

            <!-- grid lines -->
            <line v-for="y in [50, 95, 140, 185, 230]" :key="y" x1="40" x2="610" :y1="y" :y2="y" stroke="#eef1f8" stroke-width="1.5" />
            <!-- y labels -->
            <text v-for="(lbl, i) in yLabels" :key="lbl" x="10" :y="230 - i * 45 + 4" fill="#94a3b8" font-size="11" font-weight="600">{{ lbl }}</text>

            <path :d="areaPath" fill="url(#areaFill)" />
            <path :d="linePath" fill="none" stroke="url(#lineGrad)" stroke-width="3.5" stroke-linecap="round" />

            <g v-for="(p, i) in points" :key="i">
              <circle :cx="p[0]" :cy="p[1]" r="5.5" fill="#fff" stroke="#6366f1" stroke-width="3" />
            </g>
          </svg>
          <div class="chart-days">
            <span v-for="d in weeklyAppointments" :key="d.day">{{ d.day }}</span>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-head">
          <div>
            <div class="card-title">Department Overview</div>
            <div class="card-sub">Share of total cases this month</div>
          </div>
        </div>
        <div class="card pad">
          <div v-for="d in departments" :key="d.name" class="dept-row">
            <div class="dept-top">
              <span>{{ d.name }}</span>
              <span>{{ d.count }} cases · {{ d.value }}%</span>
            </div>
            <div class="bar"><i :style="{ width: d.value + '%' }"></i></div>
          </div>
        </div>
      </div>
    </section>

    <!-- ===== Recent appointments ===== -->
    <section class="card">
      <div class="card-head">
        <div>
          <div class="card-title">Recent Appointments</div>
          <div class="card-sub">Latest bookings across all departments</div>
        </div>
        <router-link to="/admin/appointments" class="btn btn-soft btn-sm">
          View All <ChevronRight :size="15" />
        </router-link>
      </div>
      <div class="table-wrap">
        <table class="table">
          <thead>
            <tr>
              <th>Token</th>
              <th>Patient</th>
              <th>Doctor</th>
              <th>Date & Time</th>
              <th>Fee</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="a in appointments.slice(0, 6)" :key="a.token">
              <td><span class="badge primary plain">{{ a.token }}</span></td>
              <td>
                <div class="cell-user">
                  <div class="avatar sm" :style="{ background: grad(a.patient) }">{{ initials(a.patient) }}</div>
                  <div>
                    <strong>{{ a.patient }}</strong>
                    <span>{{ a.age }} yrs</span>
                  </div>
                </div>
              </td>
              <td>
                <strong style="font-size: 13px">{{ a.doctor }}</strong>
                <div style="font-size: 11.5px; color: var(--muted)">{{ a.dept }}</div>
              </td>
              <td>{{ a.date }} · <strong>{{ a.time }}</strong></td>
              <td><strong>BDT {{ a.fee }}</strong></td>
              <td><span class="badge" :class="statusClass(a.status)">{{ statusLabel(a.status) }}</span></td>
              <td style="text-align: right">
                <button class="icon-btn" style="width: 34px; height: 34px; display: inline-grid" @click="toast.info(`Opening ${a.patient}'s appointment (demo)`)">
                  <Eye :size="16" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { toast } from 'vue-sonner'
import { Plus, Download, ChevronRight, Eye } from '@lucide/vue'
import StatCard from '../components/StatCard.vue'
import { stats, appointments, departments, weeklyAppointments, initials, grad } from '../data/mock'

const statusClass = (s) => ({ confirmed: 'info', pending: 'warning', completed: 'success', cancelled: 'danger' }[s])
const statusLabel = (s) => s.charAt(0).toUpperCase() + s.slice(1)

// ---- Chart geometry ----
const chartData = weeklyAppointments.map((d) => d.value)
const maxVal = Math.max(...chartData)
const points = chartData.map((v, i) => [55 + i * 92, 230 - (v / maxVal) * 180])

const linePath = computed(() => {
  let d = `M ${points[0][0]},${points[0][1]}`
  for (let i = 1; i < points.length; i++) {
    const [x0, y0] = points[i - 1]
    const [x1, y1] = points[i]
    const cx = (x0 + x1) / 2
    d += ` C ${cx},${y0} ${cx},${y1} ${x1},${y1}`
  }
  return d
})

const areaPath = computed(() => `${linePath.value} L ${points[points.length - 1][0]},230 L ${points[0][0]},230 Z`)

const yLabels = ['0', '20', '40', '60', '80']
</script>
