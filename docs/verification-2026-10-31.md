# Deployment verification, 2026-10-31

## Delivered

- Fork. <https://github.com/BumpyClock/firecrawl-ui>.
- Branch. `feat/self-hosted-workspace`.
- Deployed source. `2754540eaca078c4ab4f73480a294e7268f95df0`.
- Live UI. <https://gateway-production-4753.up.railway.app>.
- Railway UI deployment. `363ac9d3-ac55-4fd9-9340-2a44cc22823a`, verified `SUCCESS`.
- Source archive SHA-256. `4c678643f0bd61400e720c190fd04c6793a9e3f119e8256d32e9a84f24bcdc23`, matched across two independent downloads and verified by the Docker build.

Only the UI service was uploaded. The six other services retained their exact deployment IDs, including the gateway and API. No backend source, credentials, provider configuration, or volumes were changed.

## Verified

Secret-free Boat Linux checks passed `npm ci`, Prettier, ESLint, nine component tests, TypeScript module checks, and the Vite production build. A second secret-free Boat run built the actual pinned Node 26/Nginx UI image and existing Caddy gateway image. Its authentication, protected-asset, bearer-routing, and blocked-admin tests all passed using temporary fixture credentials. No real credentials or scraped content were uploaded to Boat.

After deployment, the actual authenticated Chrome Scrape form submitted `https://developer.apple.com/videos/play/wwdc2026/250/` successfully. The default selected view was Preview. The UI displayed Success, the expected Apple title, and 39,486 characters of rendered preview text. Its reported request duration was 1.51 seconds. This is one functional check, not a latency comparison.

The newly deployed empty Scrape view was observed for five seconds at 1597 × 1183 CSS pixels, DPR 2, light theme. It had zero animations, zero backdrop-filter elements, zero new resource entries, zero app DOM mutations, and a stable 231-element app subtree. A comparable completed-result observation is still pending. See [the performance method and baseline](performance.md).

Local rendered inspection covered desktop dark/light and a 390 × 844 viewport. No horizontal document overflow was observed. Enter opened the native Scrape Options disclosure. The light-theme keyboard focus indicator was visible. Calculated token contrast was 5.53:1 for white primary-button labels, at least 5.01:1 for the checked secondary/muted text pairs, and at least 3.63:1 for checked input boundaries. These checks do not constitute a complete assistive-technology audit.

Public live HTTPS checks confirmed missing and incorrect UI logins return 401. Dependency audit advisories remain in the lockfile. This release did not attempt unrelated major dependency changes.

## Actual reference comparison

The logged-in Firecrawl cloud Scrape workspace and its successful Apple result were inspected in existing Chrome. The official interface used a 256-pixel sidebar, Suisse typography, neutral near-black surfaces, quiet borders, orange actions with 8-pixel radii, format controls, and Markdown/JSON result actions.

The fork uses a 224-pixel desktop sidebar and a system font stack rather than shipping cloud fonts. It adopts the reference’s neutral/orange hierarchy and purposeful controls. The self-hosted option set remains in a persistent request column, with the response alongside it, rather than copying the cloud’s top request bar. Native disclosures and direct format checkboxes replace inaccessible clickable legends and the Scrape multi-select. Cloud account, sharing, monitoring, and upgrade controls are not presented as working features. Billing is explicitly cloud-only.

## Recovery blocker

A negative-authentication probe incorrectly requested `/` from the authenticated UI tab with an explicit API Bearer header. That request hung on the UI’s separate HTTP Basic challenge. Reload cancelled the request, but normal navigation then showed `chrome-error://chromewebdata/`, not the application. It is not a recovered browser session.

The shared daemon and another target tab remained operational. No daemon restart or credential change was attempted. A process-scoped `OP_BIOMETRIC_UNLOCK_ENABLED=true` revealed the existing 1Password account without changing persistent configuration, but the actual password read timed out. The parent independently confirmed macOS’s active GUI session was locked and assumed sole ownership of desktop unlock, approval, and tab recovery. The password was not obtained, printed, or persisted by this thread.

Do not repeat negative UI-auth tests from the active authenticated browser. Use `verify_ui.py` with secrets supplied privately, or the existing secret-free container tests.

## Remaining checklist after explicit browser handback

- Confirm the actual redesigned UI renders in the restored comparison tab before claiming recovery.
- Re-run the Apple scrape. Select JSON and repeat the five-second idle probe at the baseline viewport/theme. Record output length and compare screenshot pairs without a caret or interaction.
- Inspect the same completed result in Preview, Markdown, Metadata, and JSON. Verify full JSON download and copy controls without exposing credentials or private clipboard content.
- Submit a bounded Map request. Check a successful empty map differs from an unsubmitted request.
- Submit a one-page Crawl. Check completion, History, resume/view, and polling termination without clearing existing history.
- If authorized provider access remains available, submit one small Example Domain Extract request with a title schema. Do not provision or change providers.
- Save the existing API settings unchanged, reload, and confirm persistence without printing values or taking screenshots of exposed credentials.
- Recheck mobile navigation, error recovery, and reduced motion on the deployed artifact.
- A non-emulated hidden-tab soak remains separate. Chrome MCP forces focused-page emulation, so tab switching did not produce valid hidden-page measurements. Component tests prove hidden polling behavior, not Chrome GPU utilization.

No measured GPU percentage, GPU-memory reduction, long-term memory-leak fix, or battery-life improvement is claimed. Temporary screenshots and generated test data remain untracked.
