/* eslint-disable no-undef */
// Screenshots of the Storybook stories tagged 'screenshot', saved next to their story file in __screenshots__/.
// Storybook has to be running (npm run storybook).
//
//   npm run storybook:shots [-- <id part> ...]        save the screenshots (all, or the stories whose id has a part),
//                                                     each story in every theme of SCREENSHOT_THEMES
//   npm run storybook:shots:check [-- <id part> ...]  take them again and compare with the saved ones
//
// --url=http://localhost:6006 points to another Storybook. A failed check writes the new shot and a diff image
// (changed pixels in red) to storybook-shots/.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join, resolve } from 'path';
import { chromium } from 'playwright';
import { fileURLToPath } from 'url';

import {
  SCREENSHOT_DIR,
  SCREENSHOT_SCALE,
  SCREENSHOT_SIZE,
  SCREENSHOT_TAG,
  SCREENSHOT_THEMES,
} from '../src/[fsd]/stories/lib/screenshot.constants.js';
import { getBaselineFileName } from '../src/[fsd]/stories/lib/screenshotFile.helpers.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const REPORT_DIR = join(ROOT, 'storybook-shots');
const DONE_PHASES = ['finished', 'completed', 'errored', 'aborted'];
// Channel difference below this counts as the same pixel (anti-aliasing)
const PIXEL_TOLERANCE = 24;
const MAX_CHANGED_RATIO = 0.0005;
const SETTLE_MS = 800;
const SETTLE_TIMEOUT_MS = 20000;
const LOADING_SELECTOR = '.MuiSkeleton-root, .MuiCircularProgress-root, .MuiLinearProgress-root';

const [mode = 'update', ...args] = process.argv.slice(2);
const url = (args.find(arg => arg.startsWith('--url='))?.slice(6) || 'http://localhost:6006').replace(
  /\/$/,
  '',
);
const filters = args.filter(arg => !arg.startsWith('--'));

const loadStories = async () => {
  const response = await fetch(`${url}/index.json`).catch(() => null);
  if (!response?.ok) {
    console.error(`Storybook is not running at ${url}. Start it with: npm run storybook`);
    process.exit(1);
  }
  const { entries } = await response.json();
  return Object.values(entries).filter(
    entry =>
      entry.type === 'story' &&
      entry.tags?.includes(SCREENSHOT_TAG) &&
      (!filters.length || filters.some(part => entry.id.includes(part))),
  );
};

const baselinePath = (story, theme) =>
  join(ROOT, dirname(story.importPath), SCREENSHOT_DIR, getBaselineFileName(story.id, theme));

const shoot = async (page, story, theme) => {
  await page.goto(`${url}/iframe.html?id=${story.id}&viewMode=story&globals=theme:${theme}`);
  await page.waitForFunction(
    phases => phases.includes(window.__STORYBOOK_PREVIEW__?.currentRender?.phase),
    DONE_PHASES,
    { timeout: 30000 },
  );
  const phase = await page.evaluate(() => window.__STORYBOOK_PREVIEW__.currentRender.phase);
  if (phase !== 'finished' && phase !== 'completed') throw new Error(`story ${phase}`);
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => document.fonts.ready);
  const settled = await waitUntilSettled(page);
  if (!settled) console.log(`         still loading after ${SETTLE_TIMEOUT_MS / 1000}s, shot as is`);
  return page.screenshot({ animations: 'disabled', caret: 'hide' });
};

// Lazy pages and sample answers arrive after the story's render phase: wait until nothing loads and the DOM is quiet
const waitUntilSettled = page =>
  page.evaluate(
    ({ quietMs, timeoutMs, loadingSelector }) =>
      new Promise(resolveSettled => {
        let quietTimer;
        const isLoading = () => document.querySelector(loadingSelector);
        const finish = settled => {
          observer.disconnect();
          clearTimeout(quietTimer);
          clearTimeout(timeout);
          resolveSettled(settled);
        };
        const restart = () => {
          clearTimeout(quietTimer);
          quietTimer = setTimeout(() => (isLoading() ? restart() : finish(true)), quietMs);
        };
        const observer = new MutationObserver(restart);
        observer.observe(document.body, {
          subtree: true,
          childList: true,
          attributes: true,
          characterData: true,
        });
        const timeout = setTimeout(() => finish(false), timeoutMs);
        restart();
      }),
    { quietMs: SETTLE_MS, timeoutMs: SETTLE_TIMEOUT_MS, loadingSelector: LOADING_SELECTOR },
  );

// Pixel comparison on a canvas of the browser, so no image library is needed
const compare = (page, baseline, actual) =>
  page.evaluate(
    async ({ baselineSrc, actualSrc, tolerance }) => {
      const load = src =>
        new Promise((resolveImage, reject) => {
          const image = new Image();
          image.onload = () => resolveImage(image);
          image.onerror = reject;
          image.src = src;
        });
      const [a, b] = await Promise.all([load(baselineSrc), load(actualSrc)]);
      if (a.width !== b.width || a.height !== b.height) {
        return { changed: 1, total: 1, sizeChanged: `${a.width}×${a.height} → ${b.width}×${b.height}` };
      }
      const pixels = image => {
        const canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;
        const context = canvas.getContext('2d');
        context.drawImage(image, 0, 0);
        return context.getImageData(0, 0, image.width, image.height);
      };
      const before = pixels(a);
      const after = pixels(b).data;
      const diff = new ImageData(a.width, a.height);
      let changed = 0;
      for (let i = 0; i < after.length; i += 4) {
        const delta = Math.max(
          Math.abs(before.data[i] - after[i]),
          Math.abs(before.data[i + 1] - after[i + 1]),
          Math.abs(before.data[i + 2] - after[i + 2]),
        );
        const gray = (before.data[i] + before.data[i + 1] + before.data[i + 2]) / 12;
        const isChanged = delta > tolerance;
        if (isChanged) changed += 1;
        diff.data.set(isChanged ? [255, 0, 0, 255] : [gray, gray, gray, 255], i);
      }
      const canvas = document.createElement('canvas');
      canvas.width = a.width;
      canvas.height = a.height;
      canvas.getContext('2d').putImageData(diff, 0, 0);
      return { changed, total: a.width * a.height, diffDataUrl: canvas.toDataURL('image/png') };
    },
    {
      baselineSrc: `data:image/png;base64,${baseline.toString('base64')}`,
      actualSrc: `data:image/png;base64,${actual.toString('base64')}`,
      tolerance: PIXEL_TOLERANCE,
    },
  );

const run = async () => {
  if (!['update', 'check'].includes(mode)) {
    console.error(`Unknown mode "${mode}": use update or check`);
    process.exit(1);
  }
  const stories = await loadStories();
  if (!stories.length) {
    console.error(
      `No stories tagged '${SCREENSHOT_TAG}'${filters.length ? ` match ${filters.join(', ')}` : ''}`,
    );
    process.exit(1);
  }

  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: SCREENSHOT_SIZE,
    deviceScaleFactor: SCREENSHOT_SCALE,
    reducedMotion: 'reduce',
  });
  const page = await context.newPage();
  const comparePage = await context.newPage();
  const failures = [];

  const shots = stories.flatMap(story => SCREENSHOT_THEMES.map(theme => ({ story, theme })));

  for (const { story, theme } of shots) {
    const label = `${story.title} › ${story.name} (${theme})`;
    const name = getBaselineFileName(story.id, theme).replace(/\.png$/, '');
    try {
      const shot = await shoot(page, story, theme);
      const file = baselinePath(story, theme);

      if (mode === 'update') {
        mkdirSync(dirname(file), { recursive: true });
        writeFileSync(file, shot);
        console.log(`saved    ${label}`);
        continue;
      }

      if (!existsSync(file)) {
        failures.push(label);
        console.log(`MISSING  ${label}: run npm run storybook:shots -- ${story.id}`);
        continue;
      }

      const result = await compare(comparePage, readFileSync(file), shot);
      const ratio = result.changed / result.total;
      if (ratio <= MAX_CHANGED_RATIO) {
        console.log(`same     ${label}`);
        continue;
      }

      failures.push(label);
      mkdirSync(REPORT_DIR, { recursive: true });
      writeFileSync(join(REPORT_DIR, `${name}.actual.png`), shot);
      if (result.diffDataUrl) {
        writeFileSync(
          join(REPORT_DIR, `${name}.diff.png`),
          Buffer.from(result.diffDataUrl.split(',')[1], 'base64'),
        );
      }
      const detail = result.sizeChanged ?? `${(ratio * 100).toFixed(2)}% of pixels`;
      console.log(`CHANGED  ${label}: ${detail}`);
    } catch (error) {
      failures.push(label);
      console.log(`ERROR    ${label}: ${error.message.split('\n')[0]}`);
    }
  }

  await browser.close();

  if (failures.length) {
    console.log(`\n${failures.length} of ${shots.length} differ.`);
    if (mode === 'check') console.log(`New shots and diffs: ${REPORT_DIR}`);
    process.exit(1);
  }
  console.log(`\n${shots.length} ${mode === 'update' ? 'saved' : 'match'}.`);
};

run();
