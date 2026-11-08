<template>
  <div class="stat-card" :style="{ '--glow': tones[tone].glow }">
    <div class="stat-icon" :style="{ background: tones[tone].bg }">
      <component :is="iconComponent" :size="23" />
    </div>
    <div>
      <div class="stat-label">{{ label }}</div>
      <div class="stat-value">{{ value }}</div>
      <span class="trend" :class="up ? 'up' : 'down'">
        <TrendingUp v-if="up" :size="13" />
        <TrendingDown v-else :size="13" />
        {{ trend }} <small>{{ note }}</small>
      </span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { Users, CalendarDays, Stethoscope, Wallet, TrendingUp, TrendingDown } from '@lucide/vue'

const props = defineProps({
  label: String,
  value: String,
  trend: String,
  note: String,
  up: { type: Boolean, default: true },
  tone: { type: String, default: 'indigo' },
  icon: String,
})

const iconMap = {
  users: Users,
  calendar: CalendarDays,
  stethoscope: Stethoscope,
  revenue: Wallet,
}

const iconComponent = computed(() => iconMap[props.icon] || Users)

const tones = {
  indigo: { bg: 'linear-gradient(135deg,#6366f1,#8b5cf6)', glow: 'rgba(99,102,241,.14)' },
  cyan: { bg: 'linear-gradient(135deg,#06b6d4,#3b82f6)', glow: 'rgba(6,182,212,.14)' },
  emerald: { bg: 'linear-gradient(135deg,#10b981,#06b6d4)', glow: 'rgba(16,185,129,.14)' },
  amber: { bg: 'linear-gradient(135deg,#f59e0b,#f43f5e)', glow: 'rgba(245,158,11,.16)' },
}
</script>
