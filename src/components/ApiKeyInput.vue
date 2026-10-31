<script setup lang="ts">
/** Browser-local API settings. Credentials are never included in exported results. */
import { ref } from 'vue';
import { refreshApiClients } from '@/plugins/api';
import { getApiConfig } from '@/config/api';
import { normalizeFirecrawlBaseUrl } from '@/services/firecrawl';

const config = getApiConfig();
const apiKey = ref<string>(config.apiKey);
const baseUrl = ref<string>(config.basePath);
const error = ref<string>('');
const success = ref<boolean>(false);

/** Validate the connection URL and persist the existing settings keys without reloading. */
const saveApiConfig = (): void => {
  success.value = false;
  error.value = '';
  try {
    const normalized = normalizeFirecrawlBaseUrl(baseUrl.value);
    const parsed = new URL(normalized);
    if (!['http:', 'https:'].includes(parsed.protocol))
      throw new Error('Use an HTTP or HTTPS API URL.');
    if (!apiKey.value.trim() && parsed.hostname === 'api.firecrawl.dev')
      throw new Error('Firecrawl Cloud requires an API key.');
    refreshApiClients(normalized, apiKey.value.trim());
    baseUrl.value = normalized;
    success.value = true;
  } catch (reason: unknown) {
    error.value = reason instanceof Error ? reason.message : 'Unable to save API settings.';
  }
};
</script>

<template>
  <form class="api-key-input" @submit.prevent="saveApiConfig">
    <div class="form-group">
      <label for="apiKey">Firecrawl API Key</label>
      <input
        id="apiKey"
        v-model="apiKey"
        type="password"
        placeholder="Enter your API key"
        autocomplete="off"
        spellcheck="false"
        aria-describedby="key-help"
        @input="success = false"
      />
      <small id="key-help"
        >Use your instance’s API key, not its web UI password. Optional only when your server does
        not require a key.</small
      >
    </div>
    <div class="form-group">
      <label for="baseUrl">Firecrawl API base URL</label>
      <input
        id="baseUrl"
        v-model="baseUrl"
        type="url"
        placeholder="https://api.firecrawl.dev"
        aria-describedby="url-help"
        @input="success = false"
      />
      <small id="url-help"
        >Use the service root, without /v1 or /v2. Leave blank for Firecrawl Cloud.</small
      >
    </div>
    <div class="settings-privacy">
      Saved in this browser’s local storage. Use a trusted browser profile.
    </div>
    <div v-if="error" class="error-message" role="alert">{{ error }}</div>
    <div v-if="success" class="success-message" role="status">Connection settings saved.</div>
    <button type="submit" class="btn btn-primary">Save connection</button>
  </form>
</template>

<style scoped>
.api-key-input {
  display: flex;
  flex-direction: column;
  gap: 24px;
}
label {
  display: block;
  font-size: 12px;
  font-weight: 550;
  margin-bottom: 8px;
}
input {
  width: 100%;
  background: var(--color-background);
}
small {
  display: block;
  font-size: 11px;
  line-height: 1.7;
  color: var(--color-text-soft);
  margin-top: 8px;
}
.settings-privacy {
  color: var(--color-text-soft);
  font-size: 12px;
  padding: 12px;
  background: var(--color-background-mute);
  border-radius: 6px;
}
button {
  align-self: flex-start;
}
.success-message {
  font-size: 12px;
  color: var(--hue-success);
}
</style>
