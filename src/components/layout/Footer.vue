<template>
  <footer class="footer">
    <div>
      © {{ year }} <strong>Paramita Eye Hospital</strong> — {{ panelLabel }} Panel
    </div>
    <div class="footer-meta">
      v1.0.0 · Built with <strong>Vue 3</strong> + <strong>Laravel API</strong>
      <span class="badge success plain" style="margin-left: 10px">
        <span style="width: 6px; height: 6px; border-radius: 50%; background: currentColor; display: inline-block"></span>
        Server Online
      </span>
    </div>
  </footer>
</template>

<script setup>
import { computed } from 'vue'
import { useAuthStore } from '../../stores/auth'

const year = new Date().getFullYear()
const auth = useAuthStore()
const panelLabel = computed(() => auth.role ? auth.role.charAt(0).toUpperCase() + auth.role.slice(1) : 'User')
</script>
