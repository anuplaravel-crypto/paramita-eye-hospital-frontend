<template>
  <header class="topbar">
    <button class="hamburger" @click="$emit('toggle')">
      <Menu v-if="!mobileOpen" :size="20" />
      <X v-else :size="20" />
    </button>

    <div>
      <div class="crumb">Paramita / Admin</div>
      <h2>{{ pageTitle }}</h2>
    </div>

    <label class="top-search">
      <Search :size="17" />
      <input v-model="search" placeholder="Search patients, doctors, appointments..." />
    </label>

    <button class="icon-btn" title="Notifications" @click="toast.info('You have 6 new notifications')">
      <Bell :size="19" />
      <span class="dot"></span>
    </button>

    <div class="user-chip" @click.stop="userMenu = !userMenu">
      <div class="avatar" :style="{ background: grad(userName) }">{{ initials(userName) }}</div>
      <div class="user-meta">
        <strong>{{ userName }}</strong>
        <span style="text-transform: capitalize">{{ auth.role }}</span>
      </div>
      <ChevronDown :size="16" />

      <div v-if="userMenu" class="dropdown">
        <a href="#" @click.prevent="toast.info('Profile page coming soon!')">
          <UserRound :size="17" /> My Profile
        </a>
        <a href="#" @click.prevent="toast.info('Settings coming soon!')">
          <Settings :size="17" /> Account Settings
        </a>
        <hr />
        <button class="danger" @click="logout">
          <LogOut :size="17" /> Sign Out
        </button>
      </div>
    </div>
  </header>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import {
  Menu, X, Search, Bell, ChevronDown, UserRound, Settings, LogOut,
} from '@lucide/vue'
import { initials, grad } from '../../data/mock'
import { useAuthStore } from '../../stores/auth'

const props = defineProps({
  mobileOpen: { type: Boolean, default: false },
})
defineEmits(['toggle'])

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const userMenu = ref(false)
const search = ref('')

const userName = computed(() => auth.user?.name || 'User')

const pageTitle = computed(() => route.meta.title || 'Dashboard')

async function logout() {
  userMenu.value = false
  await auth.logout()
  toast.success('Signed out successfully', { description: 'See you again soon!' })
  router.push('/login')
}

function closeMenu(e) {
  if (userMenu.value && !e.target.closest('.user-chip')) userMenu.value = false
}

onMounted(() => document.addEventListener('click', closeMenu))
onBeforeUnmount(() => document.removeEventListener('click', closeMenu))
</script>
