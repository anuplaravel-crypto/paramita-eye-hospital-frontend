<template>
  <div class="auth-shell">
    <!-- ===== Brand panel ===== -->
    <aside class="auth-brand">
      <div style="position: relative; z-index: 2; display: flex; align-items: center; gap: 13px">
        <div class="brand-logo" style="width: 50px; height: 50px"><Eye :size="26" /></div>
        <div>
          <div style="font-size: 20px; font-weight: 800">Paramita</div>
          <div style="font-size: 12.5px; opacity: 0.85">Eye Hospital & Laser Center</div>
        </div>
      </div>

      <div>
        <h2>Caring for your vision<br />with excellence 👁️</h2>
        <p>
          <template v-if="expectedRole">
            Exclusive <strong>{{ expectedRole }}</strong> portal — sign in with your
            {{ expectedRole }} credentials to continue.
          </template>
          <template v-else>
            Admin, Staff and Doctors — one login for everyone. You'll be redirected
            to your own panel automatically.
          </template>
        </p>
      </div>

      <div class="auth-features">
        <div class="auth-feature">
          <ShieldCheck :size="22" />
          <div>
            <strong>Role Based Access</strong>
            <span>Separate secure panel for each role</span>
          </div>
        </div>
        <div class="auth-feature">
          <CalendarCheck :size="22" />
          <div>
            <strong>Smart Appointments</strong>
            <span>Token system with real-time schedule</span>
          </div>
        </div>
        <div class="auth-feature">
          <HeartPulse :size="22" />
          <div>
            <strong>Full Patient Records</strong>
            <span>History, prescriptions & reports in one place</span>
          </div>
        </div>
      </div>

      <div style="position: relative; z-index: 2; font-size: 12.5px; opacity: 0.75">
        © {{ year }} Paramita Eye Hospital · Dhaka, Bangladesh
      </div>
    </aside>

    <!-- ===== Form panel ===== -->
    <main class="auth-form-side">
      <div class="auth-card">
        <template v-if="expectedRole">
          <span class="badge primary plain" style="font-size: 12.5px; text-transform: capitalize">
            🔐 {{ expectedRole }} Portal
          </span>
          <h1 style="margin-top: 10px">Welcome back 👋</h1>
          <p class="sub">Sign in to the {{ expectedRole }} panel</p>
        </template>
        <template v-else>
          <h1>Welcome back 👋</h1>
          <p class="sub">Sign in with your account — you'll be redirected to your panel</p>
        </template>

        <form class="auth-form" novalidate @submit.prevent="handleLogin">
          <!-- Portal selector -->
          <div class="role-tags">
            <button
              v-for="r in roles"
              :key="r"
              type="button"
              class="role-tag"
              :class="{ active: expectedRole === r }"
              @click="goPortal(r)"
            >
              {{ r }}
            </button>
          </div>

          <div class="field">
            <label for="email">Email address <span class="required-mark" aria-hidden="true">*</span></label>
            <input
              id="email"
              v-model="form.email"
              type="email"
              class="input"
              placeholder="you@paramita.com"
              autocomplete="email"
              required
              aria-required="true"
              :aria-invalid="Boolean(fieldErrors.email)"
              :aria-describedby="fieldErrors.email ? 'email-error' : undefined"
              @input="clearFieldError('email')"
            />
            <p v-if="fieldErrors.email" id="email-error" class="field-error" role="alert">
              {{ fieldErrors.email }}
            </p>
          </div>

          <div class="field">
            <label for="password">Password <span class="required-mark" aria-hidden="true">*</span></label>
            <input
              id="password"
              v-model="form.password"
              type="password"
              class="input"
              placeholder="••••••••"
              autocomplete="current-password"
              required
              aria-required="true"
              :aria-invalid="Boolean(fieldErrors.password)"
              :aria-describedby="fieldErrors.password ? 'password-error' : undefined"
              @input="clearFieldError('password')"
            />
            <p v-if="fieldErrors.password" id="password-error" class="field-error" role="alert">
              {{ fieldErrors.password }}
            </p>
          </div>

          <p v-if="formError" class="form-error" role="alert">{{ formError }}</p>

          <button class="btn btn-primary" style="width: 100%; padding: 13px" :disabled="loading">
            <Loader2 v-if="loading" :size="17" class="spin" />
            <LogIn v-else :size="17" />
            {{ loading ? 'Signing in...' : 'Sign In' }}
          </button>

          <div class="auth-links">
            <label style="display: flex; gap: 7px; align-items: center; color: var(--muted); font-size: 13px">
              <input type="checkbox" checked /> Remember me
            </label>
            <a href="#" @click.prevent="toast.info('Password reset link sent (demo)')">Forgot password?</a>
          </div>

          <div class="demo-note">
            <strong>Demo accounts</strong> · click to fill<br />
            <a href="#" @click.prevent="fillDemo('admin@paramita.com', 'admin123')">admin@paramita.com · admin123</a><br />
            <a href="#" @click.prevent="fillDemo('staff@paramita.com', 'staff123')">staff@paramita.com · staff123</a><br />
            <a href="#" @click.prevent="fillDemo('doctor@paramita.com', 'doctor123')">doctor@paramita.com · doctor123</a>
          </div>
        </form>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import { Eye, CalendarCheck, HeartPulse, ShieldCheck, LogIn, Loader2 } from '@lucide/vue'
import { useAuthStore } from '../stores/auth'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const year = new Date().getFullYear()
const roles = ['admin', 'staff', 'doctor']

const expectedRole = computed(() => route.meta.expectedRole ?? null)

const form = ref({
  email: expectedRole.value ? `${expectedRole.value}@paramita.com` : '',
  password: expectedRole.value ? `${expectedRole.value}123` : '',
})

const loading = ref(false)

/** Navigate to the selected role's login page. */
function goPortal(role) {
  if (expectedRole.value === role) return
  router.push(`/${role}/login`)
}

function fillDemo(email, password) {
  form.value = { email, password }
  fieldErrors.value = { email: '', password: '' }
  formError.value = ''
}

const fieldErrors = ref({ email: '', password: '' })
const formError = ref('')

function clearFieldError(field) {
  if (fieldErrors.value[field]) {
    fieldErrors.value = { ...fieldErrors.value, [field]: '' }
  }

  formError.value = ''
}

function validateForm() {
  const email = form.value.email.trim()
  const errors = { email: '', password: '' }

  form.value.email = email

  if (!email) {
    errors.email = 'Email address is required.'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = 'Enter a valid email address.'
  }

  if (!form.value.password.trim()) {
    errors.password = 'Password is required.'
  }

  fieldErrors.value = errors

  return !Object.values(errors).some(Boolean)
}

async function handleLogin() {
  formError.value = ''

  if (!validateForm()) return

  loading.value = true
  try {
    const user = await auth.login(form.value)
    const role = user.roles?.[0]

    // Reject users who try to sign in through a portal for another role.
    if (expectedRole.value && role !== expectedRole.value) {
      await auth.logout()
      toast.error(`Only ${expectedRole.value.toUpperCase()} accounts can sign in through this portal`, {
        description: `Your account role is ${role}. Please use the correct portal.`,
      })
      return
    }

    // Redirect to the user's panel, or to a valid requested destination.
    const redirect = route.query.redirect?.toString()
    const target = redirect && redirect.startsWith(`/${role}`) ? redirect : auth.homePath

    toast.success(`Welcome, ${user.name}!`, {
      description: `Redirecting to the ${role} dashboard...`,
    })
    router.push(target)
  } catch (error) {
    const data = error.response?.data
    const errors = data?.errors || {}

    fieldErrors.value = {
      email: errors.email?.[0] || '',
      password: errors.password?.[0] || '',
    }

    if (!fieldErrors.value.email && !fieldErrors.value.password) {
      formError.value = data?.message || 'Login failed. Please check your internet connection.'
    }
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.spin { animation: rot 0.9s linear infinite; }
@keyframes rot { to { transform: rotate(360deg); } }
.demo-note a { color: #4338ca; text-decoration: underline; text-underline-offset: 2px; }
.required-mark { color: #dc2626; font-weight: 800; margin-left: 2px; }
.field-error { color: #dc2626; font-size: 12px; line-height: 1.4; margin: 6px 0 0; }
.form-error { color: #b91c1c; background: #fef2f2; border: 1px solid #fecaca; border-radius: 10px; padding: 10px 12px; font-size: 13px; margin: 0 0 14px; }
.input[aria-invalid="true"] { border-color: #dc2626; }
.input[aria-invalid="true"]:focus { box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.12); }
</style>
