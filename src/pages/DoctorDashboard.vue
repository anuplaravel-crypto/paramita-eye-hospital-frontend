<template>
  <div class="doctor-dashboard">
    <section class="page-head">
      <div>
        <h1 class="page-title">Doctor Dashboard</h1>
        <p class="page-sub">Your clinical workspace at Paramita Eye Hospital.</p>
      </div>
      <span class="badge primary plain today-badge"><CalendarDays :size="15" /> {{ todayLabel }}</span>
    </section>

    <section class="hero doctor-hero">
      <div class="hero-copy">
        <span class="doctor-eyebrow"><Stethoscope :size="15" /> DOCTOR WORKSPACE</span>
        <h2>Welcome, {{ doctorName }}</h2>
        <p>Review the patient, examination, and treatment steps for your clinic day.</p>
      </div>
      <div class="hero-mark" aria-hidden="true"><Eye :size="34" /></div>
    </section>

    <section class="card workflow-card">
      <div class="card-head">
        <div>
          <h2 class="card-title">Clinical workflow</h2>
          <p class="card-sub">A clear path from patient intake to an eye care plan.</p>
        </div>
      </div>

      <div class="workflow-grid">
        <article v-for="(step, index) in workflow" :key="step.title" class="workflow-step">
          <div class="step-icon" :class="`step-${index + 1}`"><component :is="step.icon" :size="20" /></div>
          <span class="step-number">STEP {{ index + 1 }}</span>
          <h3>{{ step.title }}</h3>
          <p>{{ step.description }}</p>
        </article>
      </div>
    </section>

    <section class="card schedule-card">
      <div class="card-head">
        <div>
          <h2 class="card-title">Today’s schedule</h2>
          <p class="card-sub">Your appointments will appear here.</p>
        </div>
        <span class="badge neutral plain">{{ todayLabel }}</span>
      </div>
      <div class="empty schedule-empty">
        <div class="empty-icon"><CalendarDays :size="22" /></div>
        <h3>No schedule to show</h3>
        <p>Open your appointment list to review patients assigned to you.</p>
        <RouterLink class="btn btn-outline btn-sm" :to="{ name: 'doctor.appointments' }">View My Appointments</RouterLink>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { CalendarDays, ClipboardList, Eye, Stethoscope } from '@lucide/vue'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const doctorName = computed(() => auth.user?.name || 'Doctor')
const todayLabel = new Intl.DateTimeFormat('en-BD', {
  weekday: 'long',
  day: 'numeric',
  month: 'short',
  year: 'numeric',
}).format(new Date())

const workflow = [
  {
    title: 'Patient intake',
    description: 'The assistant records the patient’s name, age, gender, and phone number.',
    icon: ClipboardList,
  },
  {
    title: 'Eye examination',
    description: 'Review the patient’s concerns and record examination findings.',
    icon: Eye,
  },
  {
    title: 'Care plan',
    description: 'Document medicines, eye drops, investigations, or an operation plan.',
    icon: Stethoscope,
  },
]
</script>

<style scoped>
.doctor-dashboard { display: grid; gap: 20px; }
.doctor-dashboard .page-head { margin-bottom: 0; }
.today-badge { display: inline-flex; align-items: center; gap: 7px; padding: 9px 12px; }
.doctor-hero { margin: 0; min-height: 150px; }
.hero-copy { position: relative; z-index: 2; }
.doctor-eyebrow { display: inline-flex; align-items: center; gap: 7px; font-size: 10px; font-weight: 800; letter-spacing: .12em; opacity: .85; margin-bottom: 9px; }
.doctor-hero h2 { font-size: 24px; font-weight: 800; letter-spacing: -.03em; }
.hero-mark { position: relative; z-index: 2; width: 72px; height: 72px; display: grid; place-items: center; border-radius: 22px; color: #fff; background: rgba(255,255,255,.16); border: 1px solid rgba(255,255,255,.28); }
.workflow-card, .schedule-card { overflow: hidden; }
.workflow-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 0; padding: 6px 22px 22px; }
.workflow-step { padding: 20px 20px 8px; min-width: 0; }
.workflow-step + .workflow-step { border-left: 1px solid var(--border); }
.step-icon { width: 44px; height: 44px; border-radius: 14px; display: grid; place-items: center; color: #fff; margin-bottom: 16px; box-shadow: 0 9px 20px -10px rgba(15,23,42,.45); }
.step-1 { background: linear-gradient(135deg, #6366f1, #818cf8); }
.step-2 { background: linear-gradient(135deg, #0891b2, #22d3ee); }
.step-3 { background: linear-gradient(135deg, #059669, #34d399); }
.step-number { color: var(--muted-2); font-size: 10px; font-weight: 800; letter-spacing: .1em; }
.workflow-step h3 { margin: 6px 0 5px; font-size: 15px; font-weight: 700; }
.workflow-step p, .schedule-empty p { color: var(--muted); font-size: 12.5px; line-height: 1.6; }
.schedule-empty { padding: 30px 20px 36px; }
.empty-icon { width: 48px; height: 48px; margin: 0 auto 12px; display: grid; place-items: center; color: var(--primary); background: #eef2ff; border-radius: 15px; }
.schedule-empty h3 { font-size: 15px; font-weight: 700; margin-bottom: 4px; color: var(--text); }
@media (max-width: 760px) {
  .workflow-grid { grid-template-columns: 1fr; padding: 0 20px 16px; }
  .workflow-step { padding: 18px 4px; }
  .workflow-step + .workflow-step { border-left: 0; border-top: 1px solid var(--border); }
  .hero-mark { width: 56px; height: 56px; }
  .doctor-hero h2 { font-size: 21px; }
}
</style>
