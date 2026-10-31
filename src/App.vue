<script setup lang="ts">
/** Persistent workspace navigation and browser-local color preference. */
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { RouterLink, useRoute } from 'vue-router';

const route = useRoute();
const storedTheme = localStorage.getItem('theme');
const theme = ref<'dark' | 'light'>(
  storedTheme === 'dark' || storedTheme === 'light'
    ? storedTheme
    : window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light',
);
const menuOpen = ref(false);

/** Pause task animations while hidden. No rendering loop or timer is needed. */
const updateVisibility = (): void => {
  document.documentElement.toggleAttribute('data-page-hidden', document.hidden);
};
onMounted(() => {
  updateVisibility();
  document.addEventListener('visibilitychange', updateVisibility);
});
onUnmounted(() => document.removeEventListener('visibilitychange', updateVisibility));

watch(
  theme,
  (value) => {
    document.documentElement.setAttribute('data-theme', value);
    localStorage.setItem('theme', value);
  },
  { immediate: true },
);
watch(
  () => route.path,
  () => {
    menuOpen.value = false;
  },
);

/** A real tool supported by the connected Firecrawl API, not a cloud product shortcut. */
interface ToolLink {
  to: string;
  label: string;
  icon: string;
  endpoint: string;
}

const tools: ToolLink[] = [
  {
    to: '/scrape',
    label: 'Scrape',
    icon: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M8 13h8 M8 17h5',
    endpoint: '/scrape',
  },
  {
    to: '/crawl',
    label: 'Crawl',
    icon: 'M12 3v6 M5 21v-6h14v6 M12 15V9 M8 3h8v6H8z M2 21h6 M16 21h6',
    endpoint: '/crawl',
  },
  {
    to: '/map',
    label: 'Map',
    icon: 'm9 3-7 3v15l7-3 6 3 7-3V3l-7 3-6-3z M9 3v15 M15 6v15',
    endpoint: '/map',
  },
  {
    to: '/extract',
    label: 'Extract',
    icon: 'm12 3 9 5v8l-9 5-9-5V8l9-5z M3 8l9 5 9-5 M12 13v8',
    endpoint: '/extract',
  },
  {
    to: '/batch-scrape',
    label: 'Batch Scrape',
    icon: 'M9 8h11v13H9z M15 4V2H3v14h2',
    endpoint: '/batch',
  },
  {
    to: '/search',
    label: 'Search',
    icon: 'M21 21l-5-5 M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0',
    endpoint: '/search',
  },
];
const extraTools: ToolLink[] = [
  {
    to: '/research',
    label: 'Research',
    icon: 'M21 21l-5-5 M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0 M10 6v8 M6 10h8',
    endpoint: '/deep-research',
  },
  {
    to: '/llmstxt',
    label: 'LLMs.txt',
    icon: 'M14 2H4v20h16V8l-6-6z M14 2v6h6 m-10 5-3 3 3 3 m4-6 3 3-3 3',
    endpoint: '/llmstxt',
  },
];
const currentPage = computed<string>(
  () =>
    [...tools, ...extraTools].find((t) => t.to === route.path)?.label ??
    {
      '/': 'Overview',
      '/api-config': 'API Configuration',
      '/about': 'About',
      '/billing': 'Billing',
    }[route.path] ??
    'Workspace',
);

/** Toggle the persisted theme without animating the workspace background. */
const toggleTheme = (): void => {
  theme.value = theme.value === 'dark' ? 'light' : 'dark';
};
</script>

<template>
  <div class="app-shell">
    <a class="skip-link" href="#main-content">Skip to workspace</a>
    <aside class="sidebar" :class="{ 'sidebar--open': menuOpen }" aria-label="Workspace">
      <RouterLink to="/" class="brand" aria-label="Firecrawl UI home">
        <img alt="" src="@/assets/logo.png" width="30" height="30" />
        <span>Firecrawl<span class="brand-tag">UI</span></span>
      </RouterLink>
      <div class="workspace-label">
        <span class="instance-dot" aria-hidden="true"></span>Self-hosted workspace
      </div>
      <nav aria-label="Main navigation">
        <RouterLink to="/" class="nav-link" exact-active-class="nav-link--active">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="m3 10 9-7 9 7v11H3V10z M9 21v-8h6v8" />
          </svg>
          Overview
        </RouterLink>
        <p class="nav-label">Playground</p>
        <RouterLink
          v-for="tool in tools"
          :key="tool.to"
          :to="tool.to"
          class="nav-link"
          active-class="nav-link--active"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true"><path :d="tool.icon" /></svg>
          <span>{{ tool.label }}</span
          ><code>{{ tool.endpoint }}</code>
        </RouterLink>
        <p class="nav-label">More tools</p>
        <RouterLink
          v-for="tool in extraTools"
          :key="tool.to"
          :to="tool.to"
          class="nav-link"
          active-class="nav-link--active"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true"><path :d="tool.icon" /></svg>{{ tool.label }}
        </RouterLink>
        <p class="provider-note">Search and AI tools need configured backend providers.</p>
      </nav>
      <nav class="sidebar-bottom" aria-label="Workspace settings">
        <RouterLink to="/api-config" class="nav-link" active-class="nav-link--active">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M15 7a5 5 0 1 1-3 9l-5 5H3v-4l5-5a5 5 0 0 1 7-5z M16 10h.01" /></svg
          >API Configuration
        </RouterLink>
        <RouterLink to="/billing" class="nav-link" active-class="nav-link--active">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4 20V4 M4 20h16 M8 16v-5 M13 16V7 M18 16v-8" /></svg
          >Billing
          <span class="nav-caption">Cloud API</span>
        </RouterLink>
        <RouterLink to="/about" class="nav-link" active-class="nav-link--active">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 11v6 M12 7h.01" /></svg
          >About
        </RouterLink>
        <div class="local-note">Your instance. Your data.</div>
      </nav>
    </aside>
    <button
      v-if="menuOpen"
      class="nav-scrim"
      aria-label="Close navigation"
      @click="menuOpen = false"
    ></button>
    <div class="workspace-main">
      <header class="workspace-bar">
        <button
          type="button"
          class="icon-btn mobile-menu"
          aria-label="Toggle navigation"
          :aria-expanded="menuOpen"
          @click="menuOpen = !menuOpen"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16 M4 12h16 M4 18h16" /></svg>
        </button>
        <div class="breadcrumb">
          <span>Workspace</span><span aria-hidden="true">/</span><strong>{{ currentPage }}</strong>
        </div>
        <div class="bar-actions">
          <button
            type="button"
            class="icon-btn"
            :aria-label="`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`"
            @click="toggleTheme"
          >
            <svg v-if="theme === 'dark'" viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="12" cy="12" r="4" />
              <path
                d="M12 2v2 M12 20v2 M2 12h2 M20 12h2 M5 5l1 1 M18 18l1 1 M19 5l-1 1 M6 18l-1 1"
              />
            </svg>
            <svg v-else viewBox="0 0 24 24" aria-hidden="true">
              <path d="M21 13A9 9 0 0 1 11 3a9 9 0 1 0 10 10z" />
            </svg>
          </button>
          <a
            href="https://docs.firecrawl.dev/"
            target="_blank"
            rel="noopener noreferrer"
            class="docs-link"
            >Docs <span aria-hidden="true">↗</span></a
          >
        </div>
      </header>
      <main id="main-content" class="app-main" tabindex="-1"><router-view /></main>
    </div>
  </div>
</template>

<style>
#app {
  font-family: var(--font-sans);
}
.app-shell {
  display: flex;
  min-height: 100dvh;
}
.sidebar {
  width: 224px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  position: fixed;
  inset: 0 auto 0 0;
  background: var(--color-sidebar);
  border-right: 1px solid var(--color-border);
  padding: 0 12px 16px;
  overflow-y: auto;
  z-index: 30;
}
.brand {
  height: 64px;
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 0 12px;
  color: var(--color-heading);
  font-size: 21px;
  font-weight: 650;
  letter-spacing: -0.8px;
}
.brand:hover {
  color: var(--color-heading);
}
.brand > span {
  font-weight: inherit;
}
.brand img {
  object-fit: contain;
}
.brand-tag {
  display: inline-block;
  font-size: 10px;
  letter-spacing: 0.5px;
  color: var(--color-text-soft);
  border: 1px solid var(--color-border);
  border-radius: 4px;
  padding: 0 4px;
  margin-left: 7px;
  vertical-align: middle;
}
.workspace-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  color: var(--color-text-soft);
  padding: 12px;
  margin: 4px 0 16px;
  border: 1px solid var(--color-border);
  border-radius: 7px;
}
.instance-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--brand);
}
.nav-link {
  min-height: 40px;
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--color-text-soft);
  padding: 8px 10px;
  border-radius: 6px;
  font-size: 13px;
  margin-bottom: 3px;
}
.nav-link svg,
.icon-btn svg {
  width: 17px;
  height: 17px;
  flex-shrink: 0;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.6;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.nav-link code {
  margin-left: auto;
  font-size: 10px;
  color: var(--color-text-mute);
}
.nav-link:hover {
  color: var(--color-heading);
  background: var(--color-background-mute);
}
.nav-link--active {
  color: var(--brand-strong);
  background: var(--brand-soft);
}
.nav-link--active code {
  color: var(--brand-strong);
}
.nav-label {
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  padding: 24px 10px 9px;
  color: var(--color-text-mute);
}
.provider-note {
  padding: 12px 10px;
  font-size: 11px;
  line-height: 1.6;
  color: var(--color-text-mute);
}
.sidebar-bottom {
  margin-top: auto;
  padding-top: 28px;
}
.nav-caption {
  margin-left: auto;
  font-size: 10px;
}
.local-note {
  margin-top: 16px;
  padding: 16px 10px 0;
  border-top: 1px solid var(--color-border);
  font-size: 11px;
  color: var(--color-text-mute);
}
.workspace-main {
  flex: 1;
  min-width: 0;
  margin-left: 224px;
}
.workspace-bar {
  height: 64px;
  padding: 0 32px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-background);
}
.breadcrumb {
  display: flex;
  gap: 12px;
  align-items: center;
  font-size: 12px;
  color: var(--color-text-mute);
}
.breadcrumb strong {
  font-weight: 500;
  color: var(--color-text);
}
.bar-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-left: auto;
}
.icon-btn {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  background: transparent;
  color: var(--color-text-soft);
  border: 1px solid var(--color-border);
  border-radius: 6px;
}
.icon-btn:hover {
  background: var(--color-background-mute);
  color: var(--color-heading);
}
.docs-link {
  font-size: 12px;
  color: var(--color-text);
  padding: 8px 12px;
  border: 1px solid var(--color-border);
  border-radius: 6px;
}
.docs-link span {
  margin-left: 8px;
  color: var(--color-text-mute);
}
.app-main {
  padding: 32px;
  min-width: 0;
}
.mobile-menu,
.nav-scrim {
  display: none;
}
.skip-link {
  position: fixed;
  top: -80px;
  left: 16px;
  z-index: 100;
  padding: 12px;
  background: var(--color-background);
  border: 2px solid var(--brand);
  border-radius: 6px;
}
.skip-link:focus {
  top: 8px;
}
@media (max-width: 1100px) {
  .sidebar {
    width: 200px;
  }
  .workspace-main {
    margin-left: 200px;
  }
  .app-main {
    padding: 24px;
  }
  .workspace-bar {
    padding: 0 24px;
  }
  .nav-link code {
    display: none;
  }
}
@media (max-width: 760px) {
  .sidebar {
    display: none;
    width: 224px;
  }
  .sidebar--open {
    display: flex;
    top: 64px;
  }
  .workspace-main {
    margin-left: 0;
  }
  .workspace-bar {
    padding: 0 16px;
    position: relative;
    z-index: 40;
  }
  .mobile-menu {
    display: grid;
  }
  .breadcrumb > span {
    display: none;
  }
  .app-main {
    padding: 24px 16px;
  }
  .nav-scrim {
    display: block;
    position: fixed;
    inset: 64px 0 0;
    background: #0008;
    border: 0;
    z-index: 20;
  }
}
</style>
