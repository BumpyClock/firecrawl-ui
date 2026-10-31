/** Inspect one existing Chrome page without collecting content, credentials, or request URLs. */
import { execFileSync } from 'node:child_process';

const pageId = Number(process.argv[2]);
if (!Number.isSafeInteger(pageId) || pageId < 1) {
  throw new Error('Usage: node scripts/inspect-idle.mjs <Chrome pageId>');
}

const probe = `async () => {
  const root = document.querySelector('#app');
  if (!root) throw new Error('Expected the Firecrawl Vue application');
  let mutations = 0;
  const observer = new MutationObserver(records => { mutations += records.length; });
  observer.observe(root, { subtree: true, childList: true, attributes: true, characterData: true });
  const animations = () => document.getAnimations().map(animation => ({
    name: animation.animationName, state: animation.playState, time: animation.currentTime,
    transform: getComputedStyle(animation.effect.target).transform,
  }));
  const start = animations();
  const visibilityStart = document.visibilityState;
  const resources = performance.getEntriesByType('resource').length;
  const elementsStart = root.querySelectorAll('*').length;
  const started = performance.now();
  await new Promise(resolve => setTimeout(resolve, 5000));
  observer.disconnect();
  const elements = [...root.querySelectorAll('*')];
  return {
    viewport: { width: innerWidth, height: innerHeight, dpr: devicePixelRatio },
    theme: document.documentElement.dataset.theme,
    visibilityStart, visibilityEnd: document.visibilityState,
    elapsedMs: Math.round(performance.now() - started),
    animationsStart: start, animationsEnd: animations(), mutations,
    resourceDelta: performance.getEntriesByType('resource').length - resources,
    elementsStart, elementsEnd: elements.length,
    backdropElements: elements.filter(element => getComputedStyle(element).backdropFilter !== 'none').length,
    renderedBackdropElements: elements.filter(element => element.getClientRects().length && getComputedStyle(element).backdropFilter !== 'none').length,
    canvasElements: root.querySelectorAll('canvas').length,
    resultChars: root.querySelector('.pg-result')?.textContent.length ?? 0,
  };
}`;

try {
  const output = execFileSync(
    'mcporter',
    [
      'call',
      'chrome-devtools.evaluate_script',
      '--args',
      JSON.stringify({ pageId, function: probe }),
      '--output',
      'text',
    ],
    { encoding: 'utf8', timeout: 20000 },
  );
  const match = output.match(/```json\s*([\s\S]*?)\s*```/);
  if (!match) throw new Error('Chrome did not return probe measurements');
  console.log(JSON.stringify(JSON.parse(match[1]), null, 2));
} catch {
  console.error('Idle probe failed. Confirm the page ID and mcporter Chrome attachment.');
  process.exitCode = 1;
}
