<template>
  <section>
    <header class="page-head">
      <div>
        <h1 class="page-title">User Management</h1>
        <p class="page-sub">Create user accounts and assign a role.</p>
      </div>
      <button class="btn btn-primary" type="button" @click="openUserDialog()">
        <UserPlus :size="17" /> Add User
      </button>
    </header>

    <div class="toolbar">
      <label class="search-inline">
        <Search :size="17" />
        <input v-model="search" type="search" placeholder="Search users..." aria-label="Search users" />
      </label>
      <span class="spacer"></span>
      <span class="user-total">{{ filteredUsers.length }} users</span>
    </div>

    <div v-if="pageError" class="page-error" role="alert">
      <span>{{ pageError }}</span>
      <button class="btn btn-outline btn-sm" type="button" @click="loadData">Try again</button>
    </div>

    <div class="card user-card">
      <div v-if="loading" class="empty" role="status">Loading users...</div>
      <div v-else-if="!filteredUsers.length" class="empty">
        <Users :size="30" />
        <h4>{{ search ? 'No matching users' : 'No users found' }}</h4>
        <p>{{ search ? 'Try a different search.' : 'Add a user account to get started.' }}</p>
      </div>
      <div v-else class="table-wrap">
        <table class="table user-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Contact</th>
              <th>Role</th>
              <th>Status</th>
              <th class="actions-heading">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in filteredUsers" :key="user.id">
              <td>
                <div class="user-name">
                  <span class="user-avatar">{{ initials(user.name) }}</span>
                  <span>
                    <strong>{{ user.name }}</strong>
                    <small>{{ user.email }}</small>
                  </span>
                </div>
              </td>
              <td>{{ user.phone || '—' }}</td>
              <td>
                <span v-if="user.role" class="badge primary plain role-badge">{{ user.role.name }}</span>
                <span v-else class="muted">No role</span>
              </td>
              <td>
                <span class="badge plain" :class="user.is_active ? 'success' : 'neutral'">
                  {{ user.is_active ? 'Active' : 'Inactive' }}
                </span>
              </td>
              <td>
                <div class="user-actions">
                  <button class="btn btn-outline btn-sm user-action-btn" type="button" @click="openUserDialog(user, 'view')">
                    <Eye :size="15" /> View
                  </button>
                  <button class="btn btn-outline btn-sm user-action-btn" type="button" @click="openUserDialog(user, 'edit')">
                    <Pencil :size="15" /> Edit
                  </button>
                  <button
                    class="icon-btn danger-action"
                    type="button"
                    title="Delete user"
                    :aria-label="'Delete ' + user.name"
                    :disabled="user.id === auth.user?.id"
                    @click="deleteUser(user)"
                  >
                    <Trash2 :size="16" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <Teleport to="body">
      <div v-if="dialogOpen" class="dialog-backdrop" @click.self="closeDialog">
        <section class="user-dialog card" role="dialog" aria-modal="true" aria-labelledby="user-dialog-title">
          <header class="dialog-head">
            <div>
              <h2 id="user-dialog-title">{{ dialogTitle }}</h2>
              <p>{{ dialogDescription }}</p>
            </div>
            <button class="icon-btn" type="button" aria-label="Close dialog" @click="closeDialog">
              <X :size="18" />
            </button>
          </header>

          <form @submit.prevent="saveUser">
            <div class="dialog-body">
              <div class="field">
                <label for="user-name">Full name <span class="required">*</span></label>
                <input
                  id="user-name"
                  v-model.trim="form.name"
                  class="input"
                  :class="{ 'input-invalid': fieldErrors.name }"
                  type="text"
                  maxlength="255"
                  autocomplete="name"
                  :readonly="readOnly"
                  :aria-invalid="Boolean(fieldErrors.name)"
                  :aria-describedby="fieldErrors.name ? 'user-name-error' : undefined"
                />
                <small v-if="fieldErrors.name" id="user-name-error" class="field-error">{{ fieldErrors.name }}</small>
              </div>

              <div class="field">
                <label for="user-email">Email address <span class="required">*</span></label>
                <input
                  id="user-email"
                  v-model.trim="form.email"
                  class="input"
                  :class="{ 'input-invalid': fieldErrors.email }"
                  type="email"
                  maxlength="255"
                  autocomplete="email"
                  :readonly="readOnly"
                  :aria-invalid="Boolean(fieldErrors.email)"
                  :aria-describedby="fieldErrors.email ? 'user-email-error' : undefined"
                />
                <small v-if="fieldErrors.email" id="user-email-error" class="field-error">{{ fieldErrors.email }}</small>
              </div>

              <div class="field">
                <label for="user-phone">Phone number</label>
                <input
                  id="user-phone"
                  v-model.trim="form.phone"
                  class="input"
                  :class="{ 'input-invalid': fieldErrors.phone }"
                  type="tel"
                  maxlength="30"
                  autocomplete="tel"
                  :readonly="readOnly"
                  :aria-invalid="Boolean(fieldErrors.phone)"
                  :aria-describedby="fieldErrors.phone ? 'user-phone-error' : undefined"
                />
                <small v-if="fieldErrors.phone" id="user-phone-error" class="field-error">{{ fieldErrors.phone }}</small>
              </div>

              <div class="field">
                <label for="user-role">Role <span class="required">*</span></label>
                <select
                  id="user-role"
                  v-model.number="form.role_id"
                  class="input"
                  :class="{ 'input-invalid': fieldErrors.role_id }"
                  :disabled="readOnly"
                  :aria-invalid="Boolean(fieldErrors.role_id)"
                  :aria-describedby="fieldErrors.role_id ? 'user-role-error' : undefined"
                >
                  <option value="" disabled>Select a role</option>
                  <option v-for="role in roles" :key="role.id" :value="role.id">
                    {{ role.name }}
                  </option>
                </select>
                <small v-if="fieldErrors.role_id" id="user-role-error" class="field-error">{{ fieldErrors.role_id }}</small>
              </div>

              <div v-if="!readOnly" class="field">
                <label for="user-password">
                  Password <span v-if="!editingUser" class="required">*</span>
                </label>
                <input
                  id="user-password"
                  v-model="form.password"
                  class="input"
                  :class="{ 'input-invalid': fieldErrors.password }"
                  type="password"
                  autocomplete="new-password"
                  :placeholder="editingUser ? 'Leave blank to keep the current password' : 'At least 8 characters'"
                  :aria-invalid="Boolean(fieldErrors.password)"
                  :aria-describedby="fieldErrors.password ? 'user-password-error' : 'user-password-hint'"
                />
                <small v-if="fieldErrors.password" id="user-password-error" class="field-error">{{ fieldErrors.password }}</small>
                <small v-else-if="editingUser" id="user-password-hint" class="field-hint">Leave blank to keep the current password.</small>
              </div>

              <div v-if="!readOnly" class="field status-field">
                <label for="user-status">Account status</label>
                <select id="user-status" v-model="form.is_active" class="input">
                  <option :value="true">Active</option>
                  <option :value="false">Inactive</option>
                </select>
              </div>
              <div v-else class="field">
                <label>Account status</label>
                <span class="badge plain" :class="form.is_active ? 'success' : 'neutral'">
                  {{ form.is_active ? 'Active' : 'Inactive' }}
                </span>
              </div>
            </div>

            <footer class="dialog-actions">
              <button class="btn btn-outline" type="button" :disabled="saving" @click="closeDialog">
                {{ readOnly ? 'Close' : 'Cancel' }}
              </button>
              <button v-if="!readOnly" class="btn btn-primary" type="submit" :disabled="saving">
                {{ saving ? 'Saving...' : editingUser ? 'Save Changes' : 'Create User' }}
              </button>
            </footer>
          </form>
        </section>
      </div>
    </Teleport>
  </section>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { toast } from 'vue-sonner'
import { Eye, Pencil, Search, Trash2, UserPlus, Users, X } from '@lucide/vue'
import api from '../api/axios'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const users = ref([])
const roles = ref([])
const loading = ref(true)
const saving = ref(false)
const pageError = ref('')
const search = ref('')
const dialogOpen = ref(false)
const dialogMode = ref('create')
const editingUser = ref(null)
const fieldErrors = ref({})
const form = reactive({
  name: '',
  email: '',
  phone: '',
  role_id: '',
  password: '',
  is_active: true,
})

const filteredUsers = computed(() => {
  const query = search.value.trim().toLowerCase()
  return users.value.filter((user) =>
    [user.name, user.email, user.phone || '', user.role?.name || '']
      .some((value) => value.toLowerCase().includes(query))
  )
})

const readOnly = computed(() => dialogMode.value === 'view')
const dialogTitle = computed(() => {
  if (readOnly.value) return 'View User'
  return editingUser.value ? 'Edit User' : 'Create User'
})
const dialogDescription = computed(() => {
  if (readOnly.value) return 'Review this account and its assigned role.'
  return editingUser.value ? 'Update the account details or assigned role.' : 'Enter account details and assign a role.'
})

function initials(name) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase()
}

async function loadData() {
  loading.value = true
  pageError.value = ''
  try {
    const [userResponse, roleResponse] = await Promise.all([
      api.get('/admin/users'),
      api.get('/admin/roles'),
    ])
    users.value = userResponse.data.data
    roles.value = roleResponse.data.data
  } catch (error) {
    const status = error.response?.status
    pageError.value = status === 401
      ? 'Your session has expired. Sign in again and reload this page.'
      : status === 403
        ? 'Your account is not authorized to manage users.'
        : status
          ? 'Users could not be loaded (HTTP ' + status + '). Select Try again.'
          : 'The API did not respond. Check that Laravel is running, then select Try again.'
  } finally {
    loading.value = false
  }
}

function resetForm() {
  form.name = ''
  form.email = ''
  form.phone = ''
  form.role_id = ''
  form.password = ''
  form.is_active = true
}

async function openUserDialog(user = null, mode = 'create') {
  dialogMode.value = mode
  editingUser.value = null
  fieldErrors.value = {}
  resetForm()

  if (user) {
    try {
      const response = await api.get('/admin/users/' + user.id)
      editingUser.value = response.data.data
      form.name = response.data.data.name
      form.email = response.data.data.email
      form.phone = response.data.data.phone || ''
      form.role_id = response.data.data.role?.id || ''
      form.is_active = response.data.data.is_active
    } catch {
      toast.error('The user could not be loaded.')
      return
    }
  }

  dialogOpen.value = true
}

function closeDialog() {
  if (saving.value) return
  dialogOpen.value = false
}

async function saveUser() {
  fieldErrors.value = {}
  saving.value = true

  try {
    const payload = {
      name: form.name,
      email: form.email,
      phone: form.phone || null,
      role_id: form.role_id,
      is_active: form.is_active,
    }

    if (form.password) payload.password = form.password

    if (editingUser.value) {
      await api.put('/admin/users/' + editingUser.value.id, payload)
      toast.success('User updated successfully.')
    } else {
      payload.password = form.password
      await api.post('/admin/users', payload)
      toast.success('User created successfully.')
    }

    dialogOpen.value = false
    await loadData()
  } catch (error) {
    const response = error.response?.data
    if (response?.errors) {
      fieldErrors.value = Object.fromEntries(
        Object.entries(response.errors).map(([key, messages]) => [key, messages[0]])
      )
      if (fieldErrors.value.user) toast.error(fieldErrors.value.user)
    } else {
      toast.error(response?.message || 'The user could not be saved.')
    }
  } finally {
    saving.value = false
  }
}

async function deleteUser(user) {
  if (!window.confirm('Delete user "' + user.name + '"?')) return

  try {
    await api.delete('/admin/users/' + user.id)
    toast.success('User deleted successfully.')
    await loadData()
  } catch (error) {
    toast.error(error.response?.data?.errors?.user?.[0] || error.response?.data?.message || 'The user could not be deleted.')
  }
}

onMounted(loadData)
</script>

<style scoped>
.user-card { overflow: hidden; }
.user-table { min-width: 860px; }
.actions-heading { text-align: right; }
.user-name { display: flex; align-items: center; gap: 11px; }
.user-name strong { display: block; }
.user-name small { display: block; margin-top: 2px; color: var(--muted); font-size: 11.5px; }
.user-avatar { display: grid; place-items: center; width: 38px; height: 38px; border-radius: 12px; color: #fff; background: linear-gradient(135deg, var(--primary), var(--accent)); font-size: 12px; font-weight: 800; }
.role-badge { text-transform: capitalize; }
.muted { color: var(--muted); font-size: 12px; }
.user-total { color: var(--muted); font-size: 12px; }
.user-actions { display: flex; justify-content: flex-end; align-items: center; gap: 6px; }
.user-action-btn { padding: 7px 10px; gap: 6px; }
.user-actions .icon-btn { width: 34px; height: 34px; }
.user-actions .icon-btn:disabled { opacity: 0.35; cursor: not-allowed; transform: none; }
.danger-action { color: #dc2626; }
.danger-action:hover { background: #fef2f2; color: #b91c1c; }
.page-error { display: flex; align-items: center; justify-content: space-between; gap: 14px; padding: 14px 17px; margin-bottom: 16px; border: 1px solid #fecaca; border-radius: 13px; background: #fef2f2; color: #b91c1c; }
.dialog-backdrop { position: fixed; inset: 0; z-index: 100; display: grid; place-items: center; overflow-y: auto; padding: 24px; background: rgba(15, 23, 42, 0.56); }
.user-dialog { display: flex; flex-direction: column; width: min(620px, 100%); max-height: min(850px, calc(100vh - 48px)); overflow: hidden; }
.user-dialog > form { display: flex; flex: 1; flex-direction: column; min-height: 0; overflow: hidden; }
.dialog-head { display: flex; flex: 0 0 auto; align-items: flex-start; justify-content: space-between; gap: 16px; padding: 22px 24px; border-bottom: 1px solid var(--border); }
.dialog-head h2 { font-size: 19px; }
.dialog-head p { margin-top: 3px; color: var(--muted); font-size: 12.5px; }
.dialog-body { flex: 1; min-height: 0; overflow-y: auto; overscroll-behavior: contain; padding: 22px 24px 8px; }
.dialog-body .field { margin-bottom: 20px; }
.required { color: #dc2626; font-weight: 800; }
.input-invalid { border-color: #dc2626; }
.input-invalid:focus { box-shadow: 0 0 0 4px rgba(220, 38, 38, 0.12); }
.field-error { display: block; margin-top: 6px; color: #dc2626; font-size: 12px; }
.field-hint { display: block; margin-top: 6px; color: var(--muted); font-size: 12px; }
.dialog-actions { display: flex; flex: 0 0 auto; justify-content: flex-end; gap: 10px; padding: 17px 24px 22px; border-top: 1px solid var(--border); }
.dialog-actions button:disabled { opacity: 0.65; cursor: wait; }
@media (max-width: 600px) {
  .dialog-backdrop { padding: 12px; }
  .dialog-head, .dialog-body { padding-right: 17px; padding-left: 17px; }
  .dialog-actions { padding-right: 17px; padding-left: 17px; }
  .page-error { align-items: flex-start; flex-direction: column; }
}
</style>
