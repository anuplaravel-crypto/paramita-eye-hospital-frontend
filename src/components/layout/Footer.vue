<template>
  <footer class="footer">
    <div>
      © {{ year }} <strong>Paramita Eye Hospital</strong> — Admin Panel
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
const year = new Date().getFullYear()
</script>
