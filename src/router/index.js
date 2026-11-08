import { createRouter, createWebHistory } from 'vue-router'
import { toast } from 'vue-sonner'
import { useAuthStore } from '../stores/auth'

const routes = [
  /* Shared login page and API endpoint for all roles. */
  { path: '/login', name: 'login', component: () => import('../pages/Login.vue'), meta: { expectedRole: null, public: true } },
  { path: '/admin/login', name: 'admin.login', component: () => import('../pages/Login.vue'), meta: { expectedRole: 'admin', public: true } },
  { path: '/staff/login', name: 'staff.login', component: () => import('../pages/Login.vue'), meta: { expectedRole: 'staff', public: true } },
  { path: '/doctor/login', name: 'doctor.login', component: () => import('../pages/Login.vue'), meta: { expectedRole: 'doctor', public: true } },

  { path: '/', redirect: '/admin/dashboard' },

  /* Admin panel */
  {
    path: '/admin',
    component: () => import('../layouts/AdminLayout.vue'),
    meta: { roles: ['admin'] },
    children: [
      { path: '', redirect: '/admin/dashboard' },
      { path: 'dashboard', name: 'admin.dashboard', component: () => import('../pages/Dashboard.vue'), meta: { title: 'Dashboard' } },
      { path: 'appointments', name: 'admin.appointments', component: () => import('../pages/Appointments.vue'), meta: { title: 'Appointments' } },
      { path: 'doctors', name: 'admin.doctors', component: () => import('../pages/Doctors.vue'), meta: { title: 'Doctors' } },
      { path: 'staff', name: 'admin.staff', component: () => import('../pages/Staff.vue'), meta: { title: 'Staff' } },
      { path: 'users', name: 'admin.users', component: () => import('../pages/Users.vue'), meta: { title: 'User Management' } },
      { path: 'patients', name: 'admin.patients', component: () => import('../pages/Patients.vue'), meta: { title: 'Patients' } },
      { path: 'roles', name: 'admin.roles', component: () => import('../pages/Roles.vue'), meta: { title: 'Roles & Permissions' } },
      { path: 'investigations', name: 'admin.investigations', component: () => import('../pages/Investigations.vue'), meta: { title: 'Investigations' } },
      { path: 'investigation-receipts', name: 'admin.investigation-receipts', component: () => import('../pages/InvestigationReceipts.vue'), meta: { title: 'Investigation Receipts' } },
      { path: 'technician-commission-rates', name: 'admin.technician-commission-rates', component: () => import('../pages/TechnicianCommissionRates.vue'), meta: { title: 'Technician Commission Rates' } },
      { path: 'technician-commissions', name: 'admin.technician-commissions', component: () => import('../pages/TechnicianCommissions.vue'), meta: { title: 'Technician Commissions' } },
    ],
  },

  /* Staff and doctor panels will receive their full layouts in a later phase. */
  { path: '/staff/dashboard', name: 'staff.dashboard', component: () => import('../pages/Placeholder.vue'), meta: { title: 'Staff Panel', roles: ['staff'] } },
  { path: '/doctor/dashboard', name: 'doctor.dashboard', component: () => import('../pages/Placeholder.vue'), meta: { title: 'Doctor Panel', roles: ['doctor'] } },
  { path: '/dashboard', name: 'role.dashboard', component: () => import('../pages/Placeholder.vue'), meta: { title: 'Dashboard' } },

  { path: '/staff', redirect: '/staff/dashboard' },
  { path: '/doctor', redirect: '/doctor/dashboard' },
  { path: '/:pathMatch(.*)*', redirect: () => '/login' },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 }),
})

router.beforeEach((to) => {
  const auth = useAuthStore()

  // Login pages are public.
  if (to.meta.public) {
    // Redirect authenticated users to their own panels.
    if (auth.isAuthenticated && (!to.meta.expectedRole || to.meta.expectedRole === auth.role)) {
      return { path: auth.homePath }
    }
    document.title = 'Login — Paramita Eye Hospital'
    return true
  }

  // Require authentication for protected pages.
  if (!auth.isAuthenticated) {
    return { path: '/login', query: { redirect: to.fullPath } }
  }

  // Prevent users from entering a panel assigned to another role.
  if (to.meta.roles && !auth.hasRole(...to.meta.roles)) {
    toast.error('You do not have permission to access this panel', {
      description: `Your role is ${auth.role}. Redirecting you to your panel.`,
    })
    return { path: auth.homePath }
  }

  // Check page-level permissions.
  if (to.meta.permissions?.length && !auth.can(...to.meta.permissions)) {
    toast.error('You do not have permission to perform this action.')
    return { path: auth.homePath }
  }

  if (to.meta.title) document.title = `${to.meta.title} — Paramita Eye Hospital`
})

export default router
