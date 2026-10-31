<script setup lang="ts">
/** Workspace overview. Starts real requests and links to existing browser-local crawl history. */
import { computed, ref } from 'vue';
import { RouterLink, useRouter } from 'vue-router';
import { getApiConfig } from '../config/api';

const router = useRouter();
const config = getApiConfig();
const action = ref<string>('scrape');
const url = ref<string>('');
const error = ref<string>('');
const actions = ['Scrape', 'Crawl', 'Map', 'Extract'];
const descriptions: Record<string, string> = {
  scrape: 'Turn a single page into Markdown, HTML, or structured data.',
  crawl: 'Follow links and collect content across an entire website.',
  map: 'Discover a website’s URLs before choosing what to scrape.',
  extract: 'Extract structured data using a prompt or JSON schema.',
};
const isConfigured = computed<boolean>(
  () => Boolean(config.apiKey?.trim()) || !config.basePath.includes('api.firecrawl.dev'),
);
const apiHost = computed<string>(() => {
  try {
    return new URL(config.basePath).host;
  } catch {
    return 'Not configured';
  }
});

/** Validate and open the selected tool. No backend work starts until its form is submitted. */
const launch = (): void => {
  error.value = '';
  if (!isConfigured.value) {
    void router.push('/api-config');
    return;
  }
  const value = url.value.trim();
  try {
    const parsed = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`);
    if (!parsed.hostname.includes('.') || !['http:', 'https:'].includes(parsed.protocol))
      throw new Error('Invalid URL');
    void router.push({ path: `/${action.value}`, query: { url: parsed.href } });
  } catch {
    error.value = 'Enter a website URL, such as https://example.com.';
  }
};
</script>

<template>
  <section class="overview">
    <header class="overview-head">
      <div>
        <h1>Overview</h1>
        <p>Your self-hosted web data workspace.</p>
      </div>
      <span class="badge badge--brand">Self-hosted</span>
    </header>
    <RouterLink v-if="!isConfigured" to="/api-config" class="setup-notice"
      >Configure your API connection to start a request. <span>Open settings →</span></RouterLink
    >
    <section class="start-panel" aria-labelledby="start-title">
      <div class="start-heading">
        <h2 id="start-title">Start a request</h2>
        <code>FIRECRAWL API</code>
      </div>
      <div class="launch-actions" role="group" aria-label="Action">
        <button
          v-for="name in actions"
          :key="name"
          type="button"
          :aria-pressed="action === name.toLowerCase()"
          @click="action = name.toLowerCase()"
        >
          {{ name }}
        </button>
      </div>
      <form @submit.prevent="launch">
        <label for="launch-url">Website URL</label>
        <div class="launch-input">
          <input
            id="launch-url"
            v-model="url"
            type="text"
            placeholder="https://example.com"
            spellcheck="false"
            autocapitalize="off"
            required
            :aria-invalid="!!error"
            aria-describedby="launch-error"
          /><button class="btn btn-primary" type="submit">
            Open {{ actions.find((name) => name.toLowerCase() === action) }}
            <span aria-hidden="true">→</span>
          </button>
        </div>
        <p id="launch-error" role="alert" class="error-message">{{ error }}</p>
      </form>
      <p class="action-description">{{ descriptions[action] }}</p>
    </section>
    <div class="overview-grid">
      <section class="overview-card">
        <div class="card-symbol" aria-hidden="true">↗</div>
        <h2>API connection</h2>
        <p class="connection-host">{{ apiHost }}</p>
        <p>Credentials stay in this browser. Requests go to your configured API.</p>
        <RouterLink to="/api-config"
          >Manage connection <span aria-hidden="true">→</span></RouterLink
        >
      </section>
      <section class="overview-card">
        <div class="card-symbol" aria-hidden="true">↺</div>
        <h2>Crawl history</h2>
        <p>Resume a crawl, inspect its pages, or download previous results.</p>
        <p>History is saved locally in this browser.</p>
        <RouterLink to="/crawl">Open crawl history <span aria-hidden="true">→</span></RouterLink>
      </section>
    </div>
    <aside class="workspace-note">
      <strong>Built for your instance.</strong>
      <p>
        Scrape, Crawl, and Map use your Firecrawl server. AI extraction and search need backend
        providers. Cloud billing and other cloud-only options are not included with self-hosting.
      </p>
      <a
        href="https://docs.firecrawl.dev/contributing/self-host"
        target="_blank"
        rel="noopener noreferrer"
        >Self-hosting docs ↗</a
      >
    </aside>
  </section>
</template>

<style scoped>
.overview {
  max-width: 1120px;
  margin: 0 auto;
}
.overview-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 32px;
  gap: 16px;
}
h1 {
  font-size: 24px;
}
.overview-head p {
  color: var(--color-text-soft);
  font-size: 13px;
  margin-top: 6px;
}
.start-panel {
  padding: 28px;
  background: var(--color-background-soft);
  border: 1px solid var(--color-border);
  border-radius: 10px;
}
.start-heading {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}
h2 {
  font-size: 15px;
  letter-spacing: -0.01em;
}
.start-heading code {
  font-size: 10px;
  letter-spacing: 0.06em;
  color: var(--color-text-mute);
}
.launch-actions {
  display: flex;
  gap: 4px;
  border-bottom: 1px solid var(--color-border);
  margin: 20px 0 24px;
}
.launch-actions button {
  padding: 10px 14px;
  color: var(--color-text-soft);
  background: transparent;
  border: 0;
  border-bottom: 2px solid transparent;
  font-size: 13px;
}
.launch-actions button[aria-pressed='true'] {
  border-color: var(--brand);
  color: var(--brand-strong);
}
label {
  display: block;
  font-size: 12px;
  font-weight: 550;
  margin-bottom: 8px;
}
.launch-input {
  display: flex;
  gap: 12px;
}
.launch-input input {
  flex: 1;
  min-width: 0;
  font-size: 14px;
  padding: 12px;
  background: var(--color-background);
}
.launch-input button {
  flex-shrink: 0;
}
.action-description {
  font-size: 12px;
  color: var(--color-text-soft);
  margin-top: 12px;
}
.error-message:empty {
  display: none;
}
.error-message {
  margin-top: 8px;
}
.overview-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  margin-top: 24px;
  gap: 24px;
}
.overview-card {
  padding: 24px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
}
.card-symbol {
  width: 32px;
  height: 32px;
  display: grid;
  place-items: center;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  font-size: 20px;
  color: var(--color-text-soft);
  margin-bottom: 16px;
}
.overview-card p {
  color: var(--color-text-soft);
  font-size: 12px;
  line-height: 1.7;
  margin-top: 8px;
}
.overview-card .connection-host {
  color: var(--color-text);
  font-family: var(--font-mono);
  font-size: 11px;
  overflow-wrap: anywhere;
}
.overview-card a {
  display: inline-block;
  font-size: 12px;
  margin-top: 20px;
}
.overview-card a span {
  margin-left: 8px;
}
.workspace-note {
  margin-top: 32px;
  border-top: 1px solid var(--color-border);
  padding-top: 24px;
  color: var(--color-text-soft);
  font-size: 12px;
}
.workspace-note strong {
  font-weight: 550;
  color: var(--color-text);
}
.workspace-note p {
  margin: 8px 0 12px;
  max-width: 700px;
  line-height: 1.7;
}
.setup-notice {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  padding: 16px;
  background: var(--hue-warning-soft);
  color: var(--hue-warning);
  border: 1px solid var(--hue-warning);
  border-radius: 6px;
  font-size: 13px;
  margin-bottom: 24px;
}
@media (max-width: 640px) {
  .start-panel {
    padding: 20px;
  }
  .launch-input {
    flex-direction: column;
  }
  .overview-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  .start-heading code {
    display: none;
  }
  .launch-actions button {
    flex: 1;
    padding: 10px 6px;
  }
}
</style>
