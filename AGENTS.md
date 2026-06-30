# Agent Instructions

## What This Is

A [Slidev](https://sli.dev/) presentation: "FoveaCam Duo: Foveated Stereo for Standoff Depth Sensing". Content is authored in `slides.md`, styled with UnoCSS utility classes, and enhanced with embedded Vue components. There is no application code to test; the deliverable is the rendered slide deck.

## Commands

The project uses **pnpm**; see `pnpm-workspace.yaml`. Install dependencies with `pnpm install`.

- `pnpm run dev` starts the dev server at http://localhost:3030 with hot reload and opens the browser.
- `pnpm run build` builds a static SPA into `dist/`.
- `pnpm run export` exports to PDF/PNG/PPTX and requires `playwright-chromium`, allowlisted in `pnpm-workspace.yaml`.

## Verification

- Do not verify edits with Slidev commands such as `slidev`, `npm run dev`, `npm run build`, or `npm run export`.
- After changes that affect slides or visual behavior, ask the user to verify the result in their browser instead.

## Authoring Model

- `slides.md` is the single source of the deck. Slides are separated by `---` on their own line; per-slide frontmatter (`layout`, `class`, `transition`, etc.) goes in a `---`-fenced block at the top of a slide.
- The deck headmatter, the first frontmatter block in `slides.md`, sets `theme`, `title`, `transition`, `duration`, `comark: true` for [Comark](https://comark.dev/), and related deck-level options.
- Figures live in `assets/`, not `public/`. The `scripts/svg-loader.ts` Vite plugin compiles imported `.svg` files into inline, style-scoped Vue components and bundles their relative raster refs. `import Foo from "assets/foo.svg"` is aliased in `vite.config.ts` and `tsconfig.json`, then renders as `<Foo />`. All raster imports are WebP q90.
- Raster images and videos that are URL-imported from JS get a `<link rel="preload">` injected into the emitted HTML; this is implemented by `scripts/preload-assets.ts`. It is **build-only** (`apply: "build"`): in `transformIndexHtml` (post) it scans the finished bundle (`ctx.bundle`) and preloads every emitted asset whose hashed file name appears in a JS chunk, then injects the tags into the HTML with jsdom (no-op in dev — there is no bundle). Assets referenced only from CSS (e.g. KaTeX fonts) are intentionally skipped, since the stylesheet already requests them. Preload `href`s are formed as `base` + file name, honoring Vite's resolved `base` (or an explicit `preloadAssets({ base })` override) for subpath deploys. SVG imports are excluded because `scripts/svg-loader.ts` turns them into Vue components.
- Keep local reference symlinks under `references/`. `references/` is ignored by git and is local per user/computer, so available references differ by environment. When the user mentions a related project or external reference, look into `references/`.
- `components/*.vue` are auto-imported as global components and can be used in any slide by tag name with no import. `components.d.ts` is generated and should not be hand-edited.
- Components in `pages/` should be named with the slide index prefix, such as `01-cover.vue` where `01` is the slide index. If a slide needs multiple page components, suffix the index with letters: `01A-...vue`, `01B-...vue`, etc.
- When inserting, deleting, or moving slides in `slides.md`, check all subsequent imports from `pages/` and rename/reindex affected page components so their numeric prefixes still match their slide positions.
- The last HTML comment (`<!-- ... -->`) on a slide becomes the presenter-mode speaker notes.
- Styling is UnoCSS utility classes inline in Markdown plus Slidev built-in classes such as `abs-br` and `slidev-icon-btn`.
- Camera identity colors must come from `styles/theme.css`: use `--camera-left`, `--camera-center`, and `--camera-right` instead of hardcoded per-camera red/green/blue values.
- Graphical components should use CSS `currentColor` as their default accent color for frame boundaries, annotation lines, and related strokes/fills. Allow explicit bypass with a `color` or `fill` attribute/prop when a caller needs to override the inherited accent.
- Coordinated element transitions (e.g. a chart's moving point, its rays and dimension lines) share `--transition-duration` and `--transition-curve`, defaulted in `styles/animation.css` (`0.7s` / `ease-in-out`). Write them as `transition: <prop> var(--transition-duration) var(--transition-curve)` rather than hardcoding a duration/curve, so subcomponents stay in sync; a parent can override either on its subtree (e.g. `.dragging { --transition-duration: 0s }` for instant tracking). The `.transition` helper class (in `animation.css`) applies this to *all* animatable properties — add it to an element instead of writing a per-property `transition` when you want everything eased on the shared timing. These are distinct from Slidev's slide-to-slide `--slidev-transition-duration` (also in `animation.css`). When a value is animated by these transitions but a JS computation needs its live mid-transition position (e.g. a highlight that must follow the eased motion), read it from the DOM per frame with `getScreenCTM()` — the SVG `transform`/`d` attributes and `getCTM()` don't reflect in-flight CSS transitions.

## Stage API

- Use `useStage(n, options?)` from `stores/stage` for intra-slide reveal state. The second argument is the `UseStageOptions` config object only — there is no positional boolean. It returns a Vue `Ref<number>` augmented with a writable `busy` boolean.
- `useStage` keeps its stage in a local `ref`, independent of Slidev's clicks. The active slide's stage is mirrored to `location.hash` as a bare number (`#2`, cleared at `0`) for a stable URL that survives reload / deep-link; per-slide state is also held in memory so navigating away and back restores it. There is no viewer/presenter sync.
- Because stages are independent of Slidev clicks, Left/Right (remapped by the deck) drive stages only, while `v-click`/`v-after` reveals run on their own separate click timeline.
- Call `stage.transient(n, param?)` on the `useStage` result to make a stage a pass-through the deck never rests on. `n` is a single stage number or an array of them (batch), and the call returns the `StageRef` so calls can be dot-chained (`useStage(7).transient([2, 4]).transient(6, 600)`). On entering a transient stage, it holds `busy`, then steps once more in the entry direction. It is bidirectional (`3→4→5` forward, `5→4→3` back); a deep link / reload that lands directly on the transient stage passes through forward. Adjacent transient stages chain. It is inert in overview preview and on inactive slides. `param` may be a duration in ms or a callback/promise (applied to every stage in a batch). If omitted, it waits for finite Web Animations / CSS transitions in `div#slide-content` to settle. Marking the same stage transient twice throws.
- Stage value is `0` while inactive when non-persistent reset behavior applies. Once active, stages are 1-indexed and clamped to `[1, n]`; stage `1` is the initial view, stage `2` is the first reveal, etc.
- `presist` (misspelled in the implementation) is an option on the config object that controls stage persistence across navigation: `true` always restores the last stage on re-entry; `false` always restarts at stage `1` (and resets to `0` once the slide is hidden); `"back"` (the **default**) restores only when entering the slide backward from a later slide, and restarts at `1` on a forward entry. Backward direction comes from Slidev's `navDirection` (`< 0`).
- Options currently supported by `UseStageOptions` are `presist?: boolean | "back"`, `preview?: number`, `onAfterLast?: () => void | Promise<void>`, and `onBeforeFirst?: () => void | Promise<void>`. Avoid inventing unsupported options such as `resetOnEnter` unless the implementation is updated too.
- In Slidev's overview/grid preview render context, `useStage` exposes `options.preview ?? 1` instead of the live stage. Negative preview values count backward from `n` (`-1` means the last stage), and overflow is clamped into `[0, n]` rather than wrapped.
- Left/Right arrow keys are handled by `useStage` only while the slide is active. Right advances one stage; Left retreats one stage. The deck masks Slidev's default `next_right` and `prev_left` shortcuts in `setup/shortcuts.ts`.
- Space shortcuts are wired in `setup/shortcuts.ts`: Space calls `advanceActiveStage(() => nav.next())`, while Shift+Space calls `retreatActiveStage(() => nav.prev())`, so slide navigation is used only when the active stage reaches a boundary.
- `advanceActiveStage(fallback?)` and `retreatActiveStage(fallback?)` operate on the currently active `useStage` controller and return `true` when they handled the request. The optional fallback runs only when the request reaches beyond the last/first stage; if the stage is busy, the fallback is queued with the surviving direction and can run after `busy` clears. Use these helpers for autoplay or custom controls that should drive the active slide's stage.
- Set `stage.busy = true` while async transitions or media segments are running. Additional Left/Right requests are queued as a signed delta; queued Space / Shift+Space requests can also carry their slide-navigation fallback. Set `stage.busy = false` when the animation can accept the next step.
- Use `onAfterLast` / `onBeforeFirst` when reaching beyond the last or first stage should trigger custom behavior such as slide navigation.

## Code Hygiene

- Slide visuals accrete tweaks quickly. Every few iterations, stop and refactor for conciseness and readability before adding more: collapse duplicated left/right (or per-item) blocks with `v-for` over a small data array, hoist repeated inline expressions into helpers (e.g. `pathStyle(d)`), delete dead code (unused imports/vars/CSS, vestigial reactive state), and prefer short, non-wordy names.
