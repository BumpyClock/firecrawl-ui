<script setup lang="ts">
/** Connection settings for the existing self-hosted or cloud API. */
import ApiKeyInput from '@/components/ApiKeyInput.vue';
import { RouterLink } from 'vue-router';
</script>

<template>
  <section class="settings-page">
    <header>
      <h1>API Configuration</h1>
      <p>Connect this workspace to your Firecrawl instance.</p>
    </header>
    <div class="settings-panel">
      <h2>Connection</h2>
      <ApiKeyInput />
    </div>
    <RouterLink to="/scrape" class="back-to-tool"
      >Continue to Scrape <span aria-hidden="true">→</span></RouterLink
    >
  </section>
</template>

<style scoped>
.settings-page {
  width: 100%;
  max-width: 760px;
  margin: 0 auto;
}
h1 {
  font-size: 24px;
}
header p {
  font-size: 13px;
  color: var(--color-text-soft);
  margin-top: 6px;
}
.settings-panel {
  margin-top: 28px;
  padding: 28px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-background-soft);
}
h2 {
  font-size: 15px;
  margin-bottom: 24px;
}
.back-to-tool {
  display: inline-block;
  margin-top: 24px;
  font-size: 13px;
}
.back-to-tool span {
  margin-left: 8px;
}
@media (max-width: 640px) {
  .settings-panel {
    padding: 20px;
  }
}
</style>
