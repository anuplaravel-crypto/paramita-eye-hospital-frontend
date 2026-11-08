<!-- ============================================================
     Master layout, similar to a Blade @extends layout.
     Sidebar + Header + Content(@router-view) + Footer
     ============================================================ -->
<template>
  <div class="app-shell">
    <!-- ===== Section: Sidebar ===== -->
    <Sidebar :open="mobileOpen" @close="mobileOpen = false" />

    <div v-if="mobileOpen" class="sidebar-overlay" @click="mobileOpen = false"></div>

    <!-- ===== Main column ===== -->
    <div class="main">
      <!-- ===== Section: Header ===== -->
      <Header :mobile-open="mobileOpen" @toggle="mobileOpen = !mobileOpen" />

      <!-- ===== Section: Page Content (yield) ===== -->
      <main class="content" :key="$route.fullPath">
        <router-view />
      </main>

      <!-- ===== Section: Footer ===== -->
      <Footer />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import Sidebar from '../components/layout/Sidebar.vue'
import Header from '../components/layout/Header.vue'
import Footer from '../components/layout/Footer.vue'

const mobileOpen = ref(false)
</script>
