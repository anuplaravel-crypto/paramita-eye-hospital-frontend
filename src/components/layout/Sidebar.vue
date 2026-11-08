<template>
  <aside class="sidebar" :class="{ open }">
    <div class="brand">
      <div class="brand-logo"><Eye :size="24" /></div>
      <div>
        <div class="brand-name">Paramita</div>
        <div class="brand-sub">Eye Hospital</div>
      </div>
    </div>

    <div class="nav-label">Main Menu</div>
    <nav>
      <router-link
        v-for="item in mainMenu"
        :key="item.to"
        :to="item.to"
        class="nav-item"
        @click="$emit('close')"
      >
        <component :is="item.icon" :size="19" />
        {{ item.label }}
        <span v-if="item.badge" class="nav-badge">{{ item.badge }}</span>
      </router-link>
    </nav>

    <div class="nav-label">Management</div>
    <nav>
      <router-link
        v-for="item in manageMenu"
        :key="item.to"
        :to="item.to"
        class="nav-item"
        @click="$emit('close')"
      >
        <component :is="item.icon" :size="19" />
        {{ item.label }}
      </router-link>
    </nav>

    <div class="nav-label">System</div>
    <nav>
      <router-link to="/admin/roles" class="nav-item" @click="$emit('close')">
        <Shield :size="19" /> Roles & Permissions
      </router-link>
      <button class="nav-item" style="width: 100%" @click="toast.info('Settings coming soon!')">
        <Settings :size="19" /> Settings
      </button>
      <button class="nav-item" style="width: 100%" @click="toast.info('Reports coming soon!')">
        <FileText :size="19" /> Reports
      </button>
    </nav>

    <div class="sidebar-foot">
      <div class="help-card">
        <h5>🏥 Reception Desk</h5>
        <p>Helpline: +880 1711-000000<br />Sat–Thu · 8:00 AM – 9:00 PM</p>
      </div>
    </div>
  </aside>
</template>

<script setup>
import { toast } from 'vue-sonner'
import {
  Eye, LayoutDashboard, CalendarDays, Stethoscope, Users, UserRound, UserPlus,
  Settings, FileText, Shield, BadgeDollarSign, HandCoins,
} from '@lucide/vue'

defineProps({
  open: { type: Boolean, default: false },
})
defineEmits(['close'])

const mainMenu = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/appointments', label: 'Appointments', icon: CalendarDays, badge: 6 },
]

const manageMenu = [
  { to: '/admin/doctors', label: 'Doctors', icon: Stethoscope },
  { to: '/admin/patients', label: 'Patients', icon: Users },
  { to: '/admin/staff', label: 'Staff', icon: UserRound },
  { to: '/admin/users', label: 'Users', icon: UserPlus },
  { to: '/admin/investigations', label: 'Investigations', icon: FileText },
  { to: '/admin/investigation-receipts', label: 'Investigation Receipts', icon: FileText },
  { to: '/admin/technician-commission-rates', label: 'Technician Commission Rates', icon: BadgeDollarSign },
  { to: '/admin/technician-commissions', label: 'Technician Commissions', icon: HandCoins },
]
</script>
