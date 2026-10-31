# Idle rendering and background work

## Investigation

The deployed baseline was upstream revision `995151411e0b0d26c2cc57dde978c7bf1ccd51b3`. Existing Chrome ran at 1597 × 1183 CSS pixels and DPR 2. Measurements used the light theme, no CPU/network throttling, and a completed Markdown scrape of `https://developer.apple.com/videos/play/wwdc2026/250/` displayed as JSON. The rendered result contained 47,881 characters.

The baseline ran four infinite CSS aurora animations with 26, 30, 34, and 38-second durations. Each animated surface measured 958 × 958 CSS pixels, with `blur(110px)` in light mode and permanent `will-change: transform`. The result route had 27 computed backdrop-filter elements, including hidden option controls. This count is not a count of rendered layers. The home had nine computed backdrop-filter elements. Neither route contained canvas.

A five-second completed-result observation recorded zero Vue DOM mutations, zero new resource entries, unchanged element counts, and changing animation transforms. Two viewport screenshots around that observation changed at 16.55% of pixels, with mean absolute RGB delta 0.114 out of 255. Slow drift makes individual color changes small. Pausing only those four animations through the browser made a second five-second screenshot pair pixel-identical. This ablation supports continuous decorative rendering as an unnecessary cost. It does not measure GPU utilization or prove a memory leak.

The redesign removes the animated layer, permanent promotion hints, and backdrop filters at their CSS owners. Surfaces are opaque. Only in-flight request spinners animate. Reduced-motion disables them, and a visibility-change listener pauses CSS animations while hidden. No rendering loop or heartbeat timer was added.

Crawl, Batch Scrape, Research, and LLMs.txt interval callbacks skip network polls while `document.hidden`. Their existing intervals resume on the next scheduled tick after the page becomes visible. Terminal cancellation now stops Crawl and Batch polling, including cancelled jobs loaded from crawl history. Completed results do not poll. Server-side jobs continue while their browser tab is hidden.

## Reproduce

Use the existing Chrome profile and identify only the intended Firecrawl page. Do not copy request bodies, authorization headers, storage values, or unrelated tab lists into evidence.

```sh
node scripts/inspect-idle.mjs <pageId> > /tmp/firecrawl-idle.json
```

The probe observes five seconds and emits only viewport, theme, visibility, animation state, DOM counts/mutations, resource-count deltas, and output length. It adds a temporary MutationObserver and one timeout, then removes the observer. It does not count frame callbacks, sample GPU utilization, or persist scraped content.

Check these states on the same browser and viewport:

1. Overview after settling.
2. Empty Scrape request.
3. Completed long result in the JSON view, without scrolling or a focused text caret.
4. The same completed result in Preview, then scroll it.
5. Actual hidden tab, if the browser attachment allows it.
6. In-flight request, reduced motion, and post-completion state.

Capture viewport image pairs without an intervening interaction. Compare rendered pixels, not just animation declarations. A static completed view should have zero animations, zero backdrop-filter elements, no resource growth, and no app DOM growth. Count differences are observations, not utilization percentages.

## Measurement limits

Chrome MCP enables focused-page emulation for every attached page (`McpPage.initFocusEmulationNoThrow` calls `emulateFocusedPage(true)`). Selecting a different tab during this investigation therefore left the target’s reported visibility as `visible`, with no visibility-change events. Those attempted hidden observations are **not valid background measurements**. Component tests instead verify hidden polling and visible resumption with a controlled visibility value. A manual, non-emulated background-tab soak is still needed to characterize Chrome’s real hidden-page behavior.

A five-second idle Performance trace was captured without reload and with 1× CPU/no network throttling. It reported zero CLS, but this is not evidence of reduced GPU work. Raw trace export was denied by the MCP workspace-root policy. No GPU percentage, GPU memory figure, compositor layer count, CPU speedup, long-term leak fix, or battery-life improvement is claimed. Other Chrome tabs, extensions, and drivers remain possible contributors to the user’s original report.

## Tests

`npm test` checks task feedback, cancellation, hidden polling/resumption, and the absence of backdrop filters, `will-change`, and retired aurora keyframes in actual source styles. These guards protect the measured mechanism without depending on screenshot colors or component internals.
