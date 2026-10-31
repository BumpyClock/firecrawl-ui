/** User-visible request, response, settings, and polling contracts. No live APIs or credentials. */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import { createMemoryHistory, createRouter } from 'vue-router';
import PlaygroundLayout from '../src/components/playground/PlaygroundLayout.vue';
import ScrapeView from '../src/views/ScrapeView.vue';
import ApiKeyInput from '../src/components/ApiKeyInput.vue';
import BatchScrapeView from '../src/views/BatchScrapeView.vue';
import CrawlView from '../src/views/CrawlView.vue';
import MapView from '../src/components/MapView.vue';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

/** Create an initialized router so tools exercise their normal query and navigation behavior. */
const toolRouter = async () => {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/scrape', name: 'scrape', component: ScrapeView },
      { path: '/api-config', name: 'api-config', component: ApiKeyInput },
    ],
  });
  await router.push('/scrape');
  await router.isReady();
  return router;
};

beforeEach(() => {
  localStorage.clear();
  vi.spyOn(document, 'hidden', 'get').mockReturnValue(false);
});
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('response workspace', () => {
  it('opens the useful first result view, retains selectable views, and hides empty copy actions', async () => {
    const view = mount(PlaygroundLayout, {
      props: { tabs: [{ key: 'json', label: 'JSON' }] },
      slots: { 'response-actions': '<button>Download</button>', response: '<p>Example Domain</p>' },
    });
    expect(view.text()).not.toContain('Download');
    expect(view.text()).toContain('Your results will appear here');
    await view.setProps({
      hasResult: true,
      tabs: [
        { key: 'preview', label: 'Preview' },
        { key: 'json', label: 'JSON' },
      ],
      status: 'Success',
      duration: 1520,
    });
    expect(view.get('button[aria-pressed="true"]').text()).toBe('Preview');
    await view.findAll('.pg-tab')[1].trigger('click');
    expect(view.get('button[aria-pressed="true"]').text()).toBe('JSON');
    expect(view.text()).toContain('1.52 s');
    expect(view.text()).toContain('Download');
    view.unmount();
  });
  it('announces loading and errors, and removes task animation after completion', async () => {
    const view = mount(PlaygroundLayout, { props: { running: true } });
    expect(view.get('[aria-label="Response"]').attributes('aria-busy')).toBe('true');
    expect(view.find('.pg-spinner').exists()).toBe(true);
    await view.setProps({ running: false, error: 'Backend is unavailable' });
    expect(view.get('[role="alert"]').text()).toContain('Backend is unavailable');
    expect(view.find('.pg-spinner').exists()).toBe(false);
    view.unmount();
  });
});

describe('scrape', () => {
  it('submits once, uses keyboard-accessible options, and safely previews returned Markdown', async () => {
    let resolveRequest!: (value: unknown) => void;
    const scrape = vi.fn(
      (_payload: Record<string, unknown>): Promise<unknown> =>
        new Promise((resolve) => {
          resolveRequest = resolve;
        }),
    );
    const router = await toolRouter();
    const view = mount(ScrapeView, {
      global: {
        plugins: [router],
        provide: { api: { scraping: { scrapeAndExtractFromUrl: scrape } } },
      },
    });
    expect(view.findAll('details > summary').map((summary) => summary.text())).toContain(
      'Scrape Options',
    );
    await view.get('#url').setValue('https://example.com');
    await view.get('form').trigger('submit');
    expect(view.get('button[type="submit"]').attributes('disabled')).toBeDefined();
    await view.get('form').trigger('submit');
    expect(scrape).toHaveBeenCalledTimes(1);
    expect(scrape.mock.calls[0][0]).toMatchObject({
      url: 'https://example.com',
      formats: ['markdown'],
    });
    resolveRequest({
      data: {
        success: true,
        data: {
          markdown: '# Example Domain\n\n<img src="x" onerror="alert(1)">',
          metadata: { statusCode: 200 },
        },
      },
    });
    await flushPromises();
    expect(view.get('.markdown-body').text()).toContain('Example Domain');
    expect(view.find('.markdown-body [onerror]').exists()).toBe(false);
    expect(view.get('button[aria-pressed="true"]').text()).toBe('Preview');
    expect(view.find('.pg-spinner').exists()).toBe(false);
    view.unmount();
  });
  it('shows a recoverable request error without a perpetual loading state', async () => {
    const router = await toolRouter();
    const view = mount(ScrapeView, {
      global: {
        plugins: [router],
        provide: {
          api: {
            scraping: {
              scrapeAndExtractFromUrl: vi.fn().mockRejectedValue(new Error('Rate limit reached')),
            },
          },
        },
      },
    });
    await view.get('#url').setValue('https://example.com');
    await view.get('form').trigger('submit');
    await flushPromises();
    expect(view.get('[role="alert"]').text()).toContain('Rate limit reached');
    expect(view.get('button[type="submit"]').attributes('disabled')).toBeUndefined();
    view.unmount();
  });
});

it('distinguishes an empty successful map from an unsubmitted request', async () => {
  const router = await toolRouter();
  const view = mount(MapView, {
    global: {
      plugins: [router],
      provide: {
        api: { mapping: { mapUrls: vi.fn().mockResolvedValue({ data: { links: [] } }) } },
      },
    },
  });
  await view.get('#baseUrl').setValue('https://example.com');
  await view.get('form').trigger('submit');
  await flushPromises();
  expect(view.text()).toContain('0 links');
  expect(view.text()).toContain('No URLs found');
  expect(view.text()).not.toContain('Your results will appear here');
  view.unmount();
});

describe('connection persistence', () => {
  it('retains existing storage keys and supports a self-hosted server without a mandatory key', async () => {
    const view = mount(ApiKeyInput);
    await view.get('#apiKey').setValue('');
    await view.get('#baseUrl').setValue('https://selfhost.example/v2');
    await view.get('form').trigger('submit');
    expect(localStorage.getItem('firecrawl_base_url')).toBe('https://selfhost.example');
    expect(localStorage.getItem('firecrawl_api_key')).toBe('');
    expect(view.get('[role="status"]').text()).toContain('saved');
    expect(view.get('#apiKey').attributes('type')).toBe('password');
    view.unmount();
  });
});

describe('background and terminal polling', () => {
  it('skips hidden batch polls, resumes when visible, and stops on server cancellation', async () => {
    vi.useFakeTimers();
    const poll = vi.fn().mockResolvedValue({
      data: { status: 'cancelled', completed: 0, total: 1, creditsUsed: 0, data: [] },
    });
    const view = mount(BatchScrapeView, {
      global: {
        provide: {
          api: {
            batchScraping: {
              batchScrape: vi.fn().mockResolvedValue({ data: { id: 'test-batch' } }),
              getBatchScrapeStatus: poll,
            },
          },
        },
      },
    });
    await view.get('#urls').setValue('https://example.com');
    await view.get('form').trigger('submit');
    await flushPromises();
    vi.spyOn(document, 'hidden', 'get').mockReturnValue(true);
    await vi.advanceTimersByTimeAsync(9000);
    expect(poll).not.toHaveBeenCalled();
    vi.spyOn(document, 'hidden', 'get').mockReturnValue(false);
    await vi.advanceTimersByTimeAsync(3000);
    expect(poll).toHaveBeenCalledTimes(1);
    expect(view.text()).toContain('cancelled');
    await vi.advanceTimersByTimeAsync(9000);
    expect(poll).toHaveBeenCalledTimes(1);
    view.unmount();
  });
  it('does not keep polling a cancelled crawl loaded from existing history', async () => {
    vi.useFakeTimers();
    localStorage.setItem(
      'crawlHistory',
      JSON.stringify([
        {
          id: 'test-crawl',
          url: 'https://example.com',
          status: 'cancelled',
          scrapeOptions: { formats: ['markdown'] },
        },
      ]),
    );
    const poll = vi
      .fn()
      .mockResolvedValue({ data: { status: 'cancelled', completed: 0, total: 1, data: [] } });
    const router = await toolRouter();
    const view = mount(CrawlView, {
      global: {
        plugins: [router],
        provide: {
          api: {
            crawling: {
              getCrawlStatus: poll,
              getActiveCrawls: vi.fn().mockResolvedValue({ data: { crawls: [] } }),
            },
          },
        },
      },
    });
    await flushPromises();
    expect(poll).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(15000);
    expect(poll).toHaveBeenCalledTimes(1);
    view.unmount();
  });
});

/** Collect the actual CSS delivered by source views to prevent retired compositor work returning. */
const sourceCss = (directory: string): string =>
  readdirSync(directory, { withFileTypes: true })
    .map((entry) => {
      const file = join(directory, entry.name);
      if (entry.isDirectory()) return sourceCss(file);
      const text = readFileSync(file, 'utf8');
      return file.endsWith('.css')
        ? text
        : file.endsWith('.vue')
          ? [...text.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)]
              .map((match) => match[1])
              .join('\n')
          : '';
    })
    .join('\n');

it('ships no background blur, permanent layer promotion, or retired aurora animation', () => {
  const css = sourceCss('src');
  expect(css).not.toMatch(/backdrop-filter\s*:/);
  expect(css).not.toMatch(/will-change\s*:/);
  expect(css).not.toContain('aurora-drift');
  const roles = new Set([...css.matchAll(/(--[\w-]+)\s*:/g)].map((match) => match[1]));
  for (const reference of css.matchAll(/var\((--[\w-]+)\s*\)/g)) {
    expect(roles.has(reference[1]), `Undefined CSS role ${reference[1]}`).toBe(true);
  }
  expect(css).toContain('prefers-reduced-motion: reduce');
  expect(css).toContain('animation-play-state: paused');
});
