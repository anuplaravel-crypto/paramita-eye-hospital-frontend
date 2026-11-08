import { defineStore } from 'pinia'
import api from '../api/axios'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: JSON.parse(localStorage.getItem('auth_user') || 'null'),
    token: localStorage.getItem('auth_token') || null,
  }),

  getters: {
    isAuthenticated: (state) => !!state.token && !!state.user,
    role: (state) => state.user?.roles?.[0] || null,
    roles: (state) => state.user?.roles || [],
    permissions: (state) => state.user?.permissions || [],

    /** Return the dashboard path for the active role. */
    homePath() {
      return (
        {
          admin: '/admin/dashboard',
          staff: '/staff/appointments',
          doctor: '/doctor/dashboard',
        }[this.role] || '/dashboard'
      )
    },
  },

  actions: {
    /** Sign in through the shared endpoint for all roles. */
    async login(credentials) {
      const { data } = await api.post('/login', credentials)
      this.setSession(data)
      return data.user
    },

    setSession({ user, token }) {
      this.user = user
      this.token = token
      localStorage.setItem('auth_user', JSON.stringify(user))
      localStorage.setItem('auth_token', token)
    },

    async logout() {
      try {
        if (this.token) await api.post('/logout')
      } catch {
        // Ignore tokens that have already expired or been revoked.
      } finally {
        this.clearSession()
      }
    },

    clearSession() {
      this.user = null
      this.token = null
      localStorage.removeItem('auth_user')
      localStorage.removeItem('auth_token')
    },

    /** Check whether the user has one of the specified roles. */
    hasRole(...roles) {
      return roles.includes(this.role)
    },

    /** Check whether the user has every specified permission. */
    can(...permissions) {
      return permissions.every((p) => this.permissions.includes(p))
    },
  },
})
