#!/usr/bin/env node
// Headless screenshot helper for verifying slides without a display.
//
//   pnpm run snap <slide> [stage...] [--wait ms] [--out dir] [--port n]
//
// Examples:
//   pnpm run snap 21              # slide 21, initial stage
//   pnpm run snap 21 1 3 4 5 6    # slide 21 at each listed stage
//
// Requires the dev server (`pnpm run dev`) to be running already.
// Screenshots land in `.snap/` (git-ignored) unless --out is given.

import { mkdir } from "node:fs/promises";
import { chromium } from "playwright-chromium";

const args = process.argv.slice(2);
const opts = { wait: 2500, out: ".snap", port: 3030 };
const positional = [];
for (let i = 0; i < args.length; i += 1) {
  const arg = args[i];
  if (arg === "--wait") opts.wait = Number(args[++i]);
  else if (arg === "--out") opts.out = args[++i];
  else if (arg === "--port") opts.port = Number(args[++i]);
  else positional.push(arg);
}

const [slide, ...stages] = positional;
if (!slide) {
  console.error("usage: pnpm run snap <slide> [stage...] [--wait ms] [--out dir] [--port n]");
  process.exit(1);
}
if (stages.length === 0) stages.push("");

await mkdir(opts.out, { recursive: true });

const browser = await chromium.launch({
  args: ["--autoplay-policy=no-user-gesture-required"],
});
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
page.on("console", (msg) => {
  if (msg.type() === "error") console.error(`[console] ${msg.text()}`);
});
page.on("pageerror", (err) => console.error(`[pageerror] ${err.message}`));

for (const stage of stages) {
  const hash = stage && stage !== "0" && stage !== "1" ? `#${stage}` : "";
  const url = `http://localhost:${opts.port}/${slide}${hash}`;
  // Full reload per stage so useStage's hash deep-linking takes effect.
  // (networkidle never settles under the dev server's HMR socket, so use
  // "load" plus the fixed --wait delay.)
  await page.goto(url, { waitUntil: "load" }).catch((err) => {
    console.error(`goto ${url} failed: ${err.message}`);
    process.exit(1);
  });
  await page.waitForTimeout(opts.wait);
  const file = `${opts.out}/slide-${slide}${stage ? `-stage-${stage}` : ""}.png`;
  await page.screenshot({ path: file });
  // Components exposing data-stage report where the slide actually landed
  // (deep links pass through transient stages, so this can lag the hash).
  const liveStage = await page.evaluate(
    (n) => document.querySelector(`.slidev-page-${n} [data-stage]`)?.getAttribute("data-stage") ?? "-",
    slide,
  );
  console.log(`${url} -> ${file} (data-stage: ${liveStage})`);
}

await browser.close();
