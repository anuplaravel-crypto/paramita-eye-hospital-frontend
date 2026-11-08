<template>
  <router-view />
  <Toaster position="top-right" richColors :toastOptions="{ style: { fontFamily: 'Inter, sans-serif' } }" />
</template>

<script setup>
import { Toaster } from 'vue-sonner'
</script>
