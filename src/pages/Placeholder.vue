<template>
  <div class="soon-shell">
    <div class="soon-card card">
      <div class="brand-logo" style="width: 62px; height: 62px; border-radius: 20px">
        <Eye :size="32" />
      </div>

      <span class="badge primary plain" style="text-transform: capitalize; margin-top: 18px">
        🔐 {{ auth.role }} Panel
      </span>

      <h1>Coming Soon 🚀</h1>
      <p>{{ description }}</p>

      <div class="soon-actions">
        <button class="btn btn-outline" @click="toast.info('Public website coming soon!')">
          <Globe :size="17" /> Visit Website
        </button>
        <button class="btn btn-primary" @click="logout">
          <LogOut :size="17" /> Sign Out
        </button>
      </div>

      <div class="demo-note">
        Logged in as <strong>{{ auth.user?.name }}</strong> ({{ auth.role }})<br />
        <span style="opacity: 0.8">Full panel will be available in the next phase.</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import { Eye, LogOut, Globe } from '@lucide/vue'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const auth = useAuthStore()

const description = computed(
  () =>
    ({
      staff: 'Staff panel is under construction — appointments, patients and daily tasks will live here.',
      doctor: 'Doctor panel is under construction — my patients, schedule and prescriptions will live here.',
    }[auth.role] || 'This panel is under construction.')
)

async function logout() {
  await auth.logout()
  toast.success('Signed out successfully')
  router.push('/login')
}
</script>

<style scoped>
.soon-shell {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 30px;
  background:
    radial-gradient(600px 300px at 15% 10%, rgba(99, 102, 241, 0.14), transparent),
    radial-gradient(600px 300px at 85% 90%, rgba(6, 182, 212, 0.14), transparent),
    var(--bg);
}

.soon-card {
  max-width: 480px;
  width: 100%;
  padding: 40px 34px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.soon-card h1 {
  font-size: 27px;
  font-weight: 800;
  letter-spacing: -0.03em;
  margin: 12px 0 8px;
}

.soon-card p {
  color: var(--muted);
  font-size: 14px;
  max-width: 360px;
}

.soon-actions {
  display: flex;
  gap: 11px;
  margin: 24px 0 20px;
  flex-wrap: wrap;
  justify-content: center;
}
</style>
