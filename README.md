# Firecrawl UI

A self-hosted Vue workspace for the [Firecrawl API](https://www.firecrawl.dev/). This fork builds on [obeone/firecrawl-ui](https://github.com/obeone/firecrawl-ui), under the original [MIT license](LICENSE).

## Workspace

- Persistent sidebar for Scrape, Crawl, Map, Extract, Batch Scrape, Search, Research, and LLMs.txt.
- Request and response panes, readable Markdown preview, raw output, copy, and downloads.
- Browser-local crawl history and API connection settings. Existing routes and storage keys are preserved.
- Neutral light and dark themes with orange actions. Theme follows the system until you choose one.
- Keyboard-accessible options, status announcements, mobile navigation, and reduced motion.
- Static idle surfaces. No aurora loops, backdrop blur, canvas, or permanent compositor hints.

The visual reference is Firecrawl’s actual cloud dashboard. This is an independent community UI, not the cloud product. Cloud account management, sharing, monitoring, and subscriptions are not implemented. Search and AI tools require providers configured on your backend. Cloud-only request options remain marked. Dedicated Extract is retained, but its API is deprecated in favor of Scrape’s JSON format.

## Run locally

```sh
git clone https://github.com/BumpyClock/firecrawl-ui.git
cd firecrawl-ui
npm ci
npm run dev
```

Open the Vite URL, then use **API Configuration** to set the service root and API key. The API must permit requests from your UI origin, or be served behind the same-origin gateway.

## Connection settings

Settings use the existing `firecrawl_api_key`, `firecrawl_base_url`, and `theme` localStorage keys. Saving refreshes API clients without reloading. The service root is normalized to remove a trailing `/v1` or `/v2`. A custom self-hosted server can use an empty key only if its own authentication permits it. Firecrawl Cloud requires a key.

The key stays in browser storage and is sent to the configured API for authentication. Scraped content is processed by that server. AI extraction can send content to its configured provider. A web UI login password is separate from the API bearer key.

`VITE_FIRECRAWL_API_BASE_URL` can set the build’s default API root. Do not put private credentials into `VITE_FIRECRAWL_API_KEY` for a shared build. All `VITE_*` values are embedded in downloadable JavaScript. Use runtime browser settings for your key and a trusted browser profile.

## Verify

Use Node 26.12.1 from `.node-version` and prepared npm 11.12.0.

```sh
npm ci
npx prettier --check .
npx eslint .
npm test
npm run typecheck
npm run build
```

`npm test` compiles and mounts real Vue components in JSDOM. Tests cover response states, default preview, sanitized Markdown, duplicate-submit prevention, settings persistence, hidden polling, terminal cancellation, and removal of costly idle CSS. `typecheck` checks TypeScript modules and tests. Vite compiles Vue templates during the build.

`npm run typecheck:vue` adds pinned Vue SFC/template diagnostics. It currently reports preexisting errors and is deliberately not a required CI/hook gate until that baseline is repaired. Generic Vue shims and the Vite build do not replace those diagnostics.

Compatible Linux workflow jobs select Boat. Owner-only execution is approved; outside contributors and bots remain blocked by account policy. Pages ownership and inherited registry/signing namespaces still require review before activation. Runner selection does not authorize publication. For manual validation, use a secret-free `--no-env` Boat sandbox, upload only reviewed source/tooling files, and prepare the same pinned runtime before running these gates. Never upload `.env`, credentials, browser state or generated recordings.

### Opt-in pre-push

After `npm ci`, run `sh scripts/install-hooks.sh` explicitly. This installs no tools and refuses an unrelated active hook/config. Git for Windows supplies the required `sh`. The hook requires a clean checkout of the exact pushed commit and prepared pinned tools; it never stashes edits. All non-deletion updates run full Prettier, ESLint, project TypeScript and component tests. New/unknown bases use those same full checks; deletion-only pushes need no checks. Distinct pushed commits require separate checkouts. Existing CI/build and deployment gates remain authoritative.

Run `python3 scripts/test-hooks.py` for disposable hook/installer fixtures. Stubs test command failures and ref handling, not native platform acceptance. The hook does not install dependencies, write formatting, build/deploy containers or contact Firecrawl/providers.

See [idle performance verification](docs/performance.md) for the browser probe, measured mechanism, and limits. Screenshots and generated scraping outputs are local evidence, not versioned fixtures.

## Build a container

```sh
docker build -t firecrawl-ui .
docker run -p 8080:8080 firecrawl-ui
```

The repository Dockerfile builds static assets and serves them with unprivileged Nginx. Deploy behind your own authentication gateway. A UI build does not provision a Firecrawl server, API credentials, or providers.

## Contributing

Use English names and documentation. Preserve API payload contracts, hash routes, and browser storage keys. Run the checks above. PR titles follow `[firecrawl-ui] <Title>`.

Original project by **Grégoire Compagnon (obeone)**. Powered by Firecrawl. Released under the [MIT license](LICENSE).
