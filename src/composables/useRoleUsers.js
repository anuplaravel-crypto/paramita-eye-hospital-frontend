import { computed, onMounted, ref } from 'vue'
import api from '../api/axios'

export function useRoleUsers(roleName) {
  const users = ref([])
  const search = ref('')
  const loading = ref(true)
  const error = ref('')

  const filteredUsers = computed(() => {
    const query = search.value.trim().toLowerCase()

    return users.value.filter((user) => {
      const matchesRole = user.role?.name?.toLowerCase() === roleName.toLowerCase()
      const matchesSearch = [user.name, user.email, user.phone || '']
        .some((value) => value.toLowerCase().includes(query))

      return matchesRole && matchesSearch
    })
  })

  async function loadUsers() {
    loading.value = true
    error.value = ''

    try {
      const response = await api.get('/admin/users')
      users.value = response.data.data || []
    } catch (requestError) {
      const status = requestError.response?.status
      error.value = status === 403
        ? 'You are not authorized to view this list.'
        : status
          ? 'The user list could not be loaded (HTTP ' + status + '). Try again.'
          : 'The API did not respond. Check that Laravel is running, then try again.'
    } finally {
      loading.value = false
    }
  }

  onMounted(loadUsers)

  return { filteredUsers, search, loading, error, loadUsers }
}
