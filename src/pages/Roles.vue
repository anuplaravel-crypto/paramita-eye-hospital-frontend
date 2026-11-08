<template>
  <section>
    <header class="page-head">
      <div>
        <h1 class="page-title">Roles & Permissions</h1>
        <p class="page-sub">Use View to inspect a role and its permissions, or Edit to change them.</p>
      </div>
      <div class="role-header-actions">
        <button class="btn btn-outline" type="button" @click="openPermissionDialog">
          <KeyRound :size="16" /> Add Permission
        </button>
        <button class="btn btn-primary" type="button" @click="openRoleDialog()">
          <Plus :size="17" /> Add Role
        </button>
      </div>
    </header>

    <div class="toolbar">
      <label class="search-inline">
        <Search :size="17" />
        <input v-model="search" type="search" placeholder="Search roles..." aria-label="Search roles" />
      </label>
      <span class="spacer"></span>
      <span class="role-total">{{ filteredRoles.length }} roles</span>
    </div>

    <div v-if="pageError" class="page-error" role="alert">
      <span>{{ pageError }}</span>
      <button class="btn btn-outline btn-sm" type="button" @click="loadData">Try again</button>
    </div>

    <div class="card role-card">
      <div v-if="loading" class="empty" role="status">Loading roles...</div>
      <div v-else-if="!filteredRoles.length" class="empty">
        <Shield :size="30" />
        <h4>{{ search ? 'No matching roles' : 'No roles created yet' }}</h4>
        <p>{{ search ? 'Try a different search.' : 'Add a role to organize user permissions.' }}</p>
      </div>
      <div v-else class="table-wrap">
        <table class="table role-table">
          <thead>
            <tr>
              <th>Role</th>
              <th>Permissions</th>
              <th>Assigned Users</th>
              <th class="actions-heading">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="role in filteredRoles" :key="role.id">
              <td>
                <div class="role-name">
                  <span class="role-icon"><Shield :size="17" /></span>
                  <span>
                    <strong>{{ role.name }}</strong>
                    <small>{{ role.guard_name }} guard</small>
                  </span>
                </div>
              </td>
              <td>
                <div class="permission-summary">
                  <span v-for="permission in role.permissions.slice(0, 3)" :key="permission" class="permission-chip">
                    {{ permission }}
                  </span>
                  <span v-if="role.permissions.length > 3" class="permission-extra">
                    +{{ role.permissions.length - 3 }} more
                  </span>
                  <span v-if="!role.permissions.length" class="muted">No permissions</span>
                </div>
              </td>
              <td><span class="user-count">{{ role.users_count }}</span></td>
              <td>
                <div class="role-actions">
                  <button class="btn btn-outline btn-sm role-action-btn" type="button" @click="openRoleDialog(role, 'view')">
                    <Eye :size="15" /> View
                  </button>
                  <button class="btn btn-outline btn-sm role-action-btn" type="button" :disabled="role.name === 'admin'" @click="openRoleDialog(role, 'edit')">
                    <Pencil :size="15" /> Edit
                  </button>
                  <button class="icon-btn danger-action" type="button" title="Delete role" :aria-label="'Delete ' + role.name" :disabled="role.name === 'admin' || role.users_count > 0" @click="deleteRole(role)">
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
      <section class="role-dialog card" role="dialog" aria-modal="true" aria-labelledby="role-dialog-title">
        <header class="dialog-head">
          <div>
            <h2 id="role-dialog-title">{{ dialogTitle }}</h2>
            <p>{{ dialogDescription }}</p>
          </div>
          <button class="icon-btn" type="button" aria-label="Close dialog" @click="closeDialog">
            <X :size="18" />
          </button>
        </header>

        <form @submit.prevent="saveRole">
          <div class="dialog-body">
            <div class="field">
              <label for="role-name">Role name <span class="required">*</span></label>
              <input
                id="role-name"
                v-model.trim="form.name"
                class="input"
                :class="{ 'input-invalid': fieldErrors.name }"
                type="text"
                maxlength="255"
                placeholder="For example, receptionist"
                :readonly="readOnly || form.name === 'admin'"
                :aria-invalid="Boolean(fieldErrors.name)"
                :aria-describedby="fieldErrors.name ? 'role-name-error' : undefined"
              />
              <small v-if="fieldErrors.name" id="role-name-error" class="field-error">{{ fieldErrors.name }}</small>
              <small v-else-if="form.name === 'admin'" class="field-hint">The admin role is protected.</small>
            </div>

            <fieldset class="permission-fieldset" :disabled="readOnly || form.name === 'admin'" :aria-invalid="Boolean(fieldErrors.permissions)" :aria-describedby="fieldErrors.permissions ? 'permissions-error' : undefined">
              <legend>Permissions</legend>
              <p class="field-hint">Choose the actions users assigned to this role can perform.</p>
              <div v-if="!permissionGroups.length" class="field-hint">No permissions are available.</div>
              <div v-for="group in permissionGroups" :key="group.name" class="permission-group">
                <h3>{{ group.label }}</h3>
                <label v-for="permission in group.items" :key="permission.name" class="permission-option">
                  <input v-model="form.permissions" type="checkbox" :value="permission.name" />
                  <span>{{ permission.name }}</span>
                </label>
              </div>
              <small v-if="fieldErrors.permissions" id="permissions-error" class="field-error">{{ fieldErrors.permissions }}</small>
            </fieldset>
          </div>

          <footer class="dialog-actions">
            <button class="btn btn-outline" type="button" @click="closeDialog">{{ readOnly ? 'Close' : 'Cancel' }}</button>
            <button v-if="!readOnly" class="btn btn-primary" type="submit" :disabled="saving">
              {{ saving ? 'Saving...' : editingRole ? 'Save Changes' : 'Create Role' }}
            </button>
          </footer>
        </form>
      </section>
      </div>
    </Teleport>

    <Teleport to="body">
      <div v-if="permissionDialogOpen" class="dialog-backdrop" @click.self="closePermissionDialog">
        <section class="role-dialog card permission-dialog" role="dialog" aria-modal="true" aria-labelledby="permission-dialog-title">
          <header class="dialog-head">
            <div>
              <h2 id="permission-dialog-title">Add Permission</h2>
              <p>Create a permission that can be assigned to roles.</p>
            </div>
            <button class="icon-btn" type="button" aria-label="Close dialog" @click="closePermissionDialog">
              <X :size="18" />
            </button>
          </header>

          <form @submit.prevent="savePermission">
            <div class="dialog-body">
              <div class="field">
                <label for="permission-name">Permission name <span class="required">*</span></label>
                <input
                  id="permission-name"
                  v-model.trim="permissionName"
                  class="input"
                  :class="{ 'input-invalid': permissionNameError }"
                  type="text"
                  maxlength="255"
                  placeholder="For example, investigation.create"
                  :aria-invalid="Boolean(permissionNameError)"
                  :aria-describedby="permissionNameError ? 'permission-name-error' : 'permission-name-hint'"
                />
                <small v-if="permissionNameError" id="permission-name-error" class="field-error" role="alert">
                  {{ permissionNameError }}
                </small>
                <small v-else id="permission-name-hint" class="field-hint">
                  Use the module.action format, such as investigation.create.
                </small>
              </div>
            </div>

            <footer class="dialog-actions">
              <button class="btn btn-outline" type="button" :disabled="savingPermission" @click="closePermissionDialog">Cancel</button>
              <button class="btn btn-primary" type="submit" :disabled="savingPermission">
                {{ savingPermission ? 'Saving...' : 'Save Permission' }}
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
import { Eye, KeyRound, Pencil, Plus, Search, Shield, Trash2, X } from '@lucide/vue'
import api from '../api/axios'

const roles = ref([])
const permissions = ref([])
const loading = ref(true)
const saving = ref(false)
const pageError = ref('')
const search = ref('')
const dialogOpen = ref(false)
const permissionDialogOpen = ref(false)
const savingPermission = ref(false)
const permissionName = ref('')
const permissionNameError = ref('')
const dialogMode = ref('create')
const editingRole = ref(null)
const fieldErrors = ref({})
const form = reactive({ name: '', permissions: [] })

const filteredRoles = computed(() => {
  const query = search.value.trim().toLowerCase()
  return roles.value.filter((role) => role.name.toLowerCase().includes(query))
})

const permissionGroups = computed(() => {
  const groups = new Map()
  for (const permission of permissions.value) {
    const [groupName] = permission.name.split('.')
    if (!groups.has(groupName)) groups.set(groupName, [])
    groups.get(groupName).push(permission)
  }
  return [...groups.entries()].map(([name, items]) => ({
    name,
    label: name.charAt(0).toUpperCase() + name.slice(1),
    items,
  }))
})

const readOnly = computed(() => dialogMode.value === 'view')
const dialogTitle = computed(() => {
  if (readOnly.value) return 'View Role'
  return editingRole.value ? 'Edit Role' : 'Create Role'
})
const dialogDescription = computed(() => {
  if (readOnly.value) return 'Review this role and its assigned permissions.'
  return editingRole.value ? 'Update the role name or its permissions.' : 'Set a role name and choose its permissions.'
})

async function loadData() {
  loading.value = true
  pageError.value = ''
  try {
    const [roleResponse, permissionResponse] = await Promise.all([
      api.get('/admin/roles'),
      api.get('/admin/permissions'),
    ])
    roles.value = roleResponse.data.data
    permissions.value = permissionResponse.data.data
  } catch (error) {
    const status = error.response?.status
    if (status === 401) {
      pageError.value = 'Your session has expired. Sign in again and reload this page.'
    } else if (status === 403) {
      pageError.value = 'Your account is not authorized to manage roles.'
    } else if (status) {
      pageError.value = 'Roles could not be loaded (HTTP ' + status + '). Select Try again.'
    } else {
      pageError.value = 'The API did not respond. Check that Laravel is running, then select Try again.'
    }
  } finally {
    loading.value = false
  }
}

async function openRoleDialog(role = null, mode = 'create') {
  dialogMode.value = mode
  editingRole.value = null
  fieldErrors.value = {}
  form.name = ''
  form.permissions = []

  if (role) {
    try {
      const response = await api.get('/admin/roles/' + role.id)
      editingRole.value = response.data.data
      form.name = response.data.data.name
      form.permissions = [...response.data.data.permissions]
    } catch {
      toast.error('The role could not be loaded.')
      return
    }
  }

  dialogOpen.value = true
}

function closeDialog() {
  if (saving.value) return
  dialogOpen.value = false
}

function openPermissionDialog() {
  permissionName.value = ''
  permissionNameError.value = ''
  permissionDialogOpen.value = true
}

function closePermissionDialog() {
  if (savingPermission.value) return
  permissionDialogOpen.value = false
}

async function saveRole() {
  fieldErrors.value = {}
  saving.value = true
  try {
    const payload = { name: form.name, permissions: form.permissions }
    if (editingRole.value) {
      await api.put('/admin/roles/' + editingRole.value.id, payload)
      toast.success('Role updated successfully.')
    } else {
      await api.post('/admin/roles', payload)
      toast.success('Role created successfully.')
    }
    dialogOpen.value = false
    await loadData()
  } catch (error) {
    const response = error.response?.data
    if (response?.errors) {
      const permissionError = Object.entries(response.errors)
        .find(([key]) => key.startsWith('permissions.'))?.[1]?.[0]
      fieldErrors.value = {
        name: response.errors.name?.[0],
        permissions: response.errors.permissions?.[0] || permissionError,
        role: response.errors.role?.[0],
      }
      if (fieldErrors.value.role) toast.error(fieldErrors.value.role)
    } else {
      toast.error(response?.message || 'The role could not be saved.')
    }
  } finally {
    saving.value = false
  }
}

async function savePermission() {
  permissionNameError.value = ''
  savingPermission.value = true

  try {
    const response = await api.post('/admin/permissions', { name: permissionName.value })
    permissions.value = [...permissions.value, response.data.data]
      .sort((left, right) => left.name.localeCompare(right.name))
    permissionDialogOpen.value = false
    toast.success('Permission saved successfully. It is now available when editing roles.')
  } catch (error) {
    const response = error.response?.data
    if (response?.errors?.name?.[0]) {
      permissionNameError.value = response.errors.name[0]
    } else {
      toast.error(response?.message || 'The permission could not be saved.')
    }
  } finally {
    savingPermission.value = false
  }
}

async function deleteRole(role) {
  if (!window.confirm('Delete the "' + role.name + '" role?')) return
  try {
    await api.delete('/admin/roles/' + role.id)
    toast.success('Role deleted successfully.')
    await loadData()
  } catch (error) {
    toast.error(error.response?.data?.errors?.role?.[0] || error.response?.data?.message || 'The role could not be deleted.')
  }
}

onMounted(loadData)
</script>

<style scoped>
.role-header-actions { display: flex; gap: 10px; flex-wrap: wrap; }
.role-card { overflow: hidden; }
.role-table { min-width: 760px; }
.actions-heading { text-align: right; }
.role-name { display: flex; align-items: center; gap: 11px; }
.role-name strong { display: block; text-transform: capitalize; }
.role-name small { display: block; margin-top: 2px; color: var(--muted); font-size: 11px; }
.role-icon { display: grid; place-items: center; width: 38px; height: 38px; border-radius: 12px; color: var(--primary); background: #eef2ff; }
.permission-summary { display: flex; flex-wrap: wrap; gap: 5px; max-width: 430px; }
.permission-chip, .permission-extra { border-radius: 7px; padding: 3px 7px; background: #f1f5f9; color: #475569; font-size: 11px; }
.permission-extra { color: var(--primary); background: #eef2ff; font-weight: 700; }
.muted { color: var(--muted); font-size: 12px; }
.user-count { display: inline-flex; min-width: 28px; justify-content: center; padding: 3px 8px; border-radius: 99px; background: #f1f5f9; font-weight: 700; }
.role-actions { display: flex; justify-content: flex-end; gap: 6px; }
.role-action-btn { padding: 7px 10px; gap: 6px; }
.role-actions .icon-btn:disabled { opacity: 0.35; cursor: not-allowed; transform: none; }
.danger-action { color: #dc2626; }
.danger-action:hover { background: #fef2f2; color: #b91c1c; }
.role-total { color: var(--muted); font-size: 12px; }
.page-error { display: flex; align-items: center; justify-content: space-between; gap: 14px; padding: 14px 17px; margin-bottom: 16px; border: 1px solid #fecaca; border-radius: 13px; background: #fef2f2; color: #b91c1c; }
.dialog-backdrop { position: fixed; inset: 0; z-index: 100; display: grid; place-items: center; overflow-y: auto; padding: 24px; background: rgba(15, 23, 42, 0.56); }
.role-dialog { display: flex; flex-direction: column; width: min(680px, 100%); max-height: min(850px, calc(100vh - 48px)); overflow: hidden; }
.role-dialog > form { display: flex; flex: 1; flex-direction: column; min-height: 0; overflow: hidden; }
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
.permission-fieldset { min-width: 0; border: 0; }
.permission-fieldset legend { font-size: 13px; font-weight: 700; color: #334155; }
.permission-fieldset:disabled { opacity: 0.72; }
.permission-group { padding: 14px 0; border-top: 1px solid var(--border); }
.permission-group h3 { margin-bottom: 9px; font-size: 12px; text-transform: capitalize; color: var(--muted); }
.permission-option { display: inline-flex; align-items: center; gap: 7px; margin: 0 14px 9px 0; font-size: 12px; cursor: pointer; }
.permission-option input { accent-color: var(--primary); }
.dialog-actions { display: flex; flex: 0 0 auto; justify-content: flex-end; gap: 10px; padding: 17px 24px 22px; border-top: 1px solid var(--border); }
.dialog-actions button:disabled { opacity: 0.65; cursor: wait; }
@media (max-width: 600px) {
  .dialog-backdrop { padding: 12px; }
  .dialog-head, .dialog-body { padding-right: 17px; padding-left: 17px; }
  .dialog-actions { padding-right: 17px; padding-left: 17px; }
  .page-error { align-items: flex-start; flex-direction: column; }
}
</style>







