import { useIsSlideActive, useNav, useSlideContext } from "@slidev/client";
import {
  computed,
  effectScope,
  nextTick,
  onScopeDispose,
  ref,
  watch,
  type Ref,
} from "vue";

interface UseStageOptions {
  /**
   * Stage persistence across navigation:
   * - `true` — always restore the last stage on re-entry.
   * - `false` — always restart at stage `1` (and reset to `0` once hidden).
   * - `"back"` (default) — restore only when entering the slide backward (from a
   *   later slide); a forward re-entry restarts at stage `1`.
   */
  presist?: boolean | "back";
  preview?: number;
  onAfterLast?: () => void | Promise<void>;
  onBeforeFirst?: () => void | Promise<void>;
}

export interface StageRef extends Ref<number> {
  busy: boolean;
  /**
   * Make one stage, or a batch of stages, a pass-through. `param` can be a fixed
   * duration in ms or a callback/promise; omitted waits for finite animations
   * under div#slide-content. Returns the StageRef for chaining.
   */
  transient: (n: number | number[], param?: number | (() => any)) => StageRef;
}

type StageBoundaryFallback = () => void | Promise<void>;

interface ActiveStageController {
  forward: (fallback?: StageBoundaryFallback) => boolean;
  backward: (fallback?: StageBoundaryFallback) => boolean;
}

let activeStageController: ActiveStageController | null = null;

export function advanceActiveStage(fallback?: StageBoundaryFallback) {
  return activeStageController?.forward(fallback) ?? false;
}

export function retreatActiveStage(fallback?: StageBoundaryFallback) {
  return activeStageController?.backward(fallback) ?? false;
}

// The active slide's stage is mirrored into `location.hash` as a bare number
// (`#2`), and the hash is cleared whenever the stage is 0. The deck runs in
// history mode, so vue-router owns the path/query and ignores the hash — it is
// free for the stage. The hash only holds one slide's stage at a time, so
// per-slide state is also kept in memory (below) for in-session navigation.
function readHashStage(): number | null {
  if (typeof window === "undefined") return null;
  const raw = window.location.hash.replace(/^#/, "");
  if (!/^[0-9]+$/.test(raw)) return null;
  const value = Number.parseInt(raw, 10);
  return value > 0 ? value : null;
}

function writeHashStage(stage: number) {
  if (typeof window === "undefined") return;
  const { pathname, search, hash } = window.location;
  const next = stage > 0 ? `#${stage}` : "";
  if (hash === next) return;
  // replaceState (rather than assigning location.hash) so stepping through
  // stages doesn't pile up browser-history entries.
  window.history.replaceState(window.history.state, "", `${pathname}${search}${next}`);
}

// Per-slide stage, keyed by slide number, kept across remounts so navigating
// away and back restores the stage (the hash can only describe one slide). The
// initial hash is consumed once, by whichever slide is active at page load.
const persistedStage = new Map<number, number>();
let initialHashConsumed = false;

function persistedOrInitial(slideNo: number): number {
  const value = persistedStage.get(slideNo);
  return value && value > 0 ? value : 1;
}

function clampStage(value: number, max: number) {
  return Math.min(Math.max(Math.round(value), 0), max);
}

function normalizePreviewStage(value: number, max: number) {
  return clampStage(value < 0 ? max + value + 1 : value, max);
}

function wait(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

function nextFrame() {
  if (typeof requestAnimationFrame === "undefined") return Promise.resolve();
  return new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
}

function getSlideContentRoot() {
  if (typeof document === "undefined") return null;
  return (
    document.querySelector("div#slide-content") ??
    document.querySelector(".slidev-layout") ??
    document.body
  );
}

function finiteAnimations(root: Element | Document) {
  return (root.getAnimations?.({ subtree: true }) ?? []).filter((animation) => {
    const timing = animation.effect?.getTiming();
    return (
      timing?.iterations !== Infinity &&
      animation.playState !== "finished" &&
      animation.playState !== "idle"
    );
  });
}

function watchAnimationEvents(root: Element) {
  let pending = 0;
  let observed = false;
  let resolveSettled = () => {};
  const settled = new Promise<void>((resolve) => {
    resolveSettled = resolve;
  });

  const includesTarget = (target: EventTarget | null) =>
    target instanceof Node && root.contains(target);
  const maybeSettle = () => {
    if (observed && pending === 0) resolveSettled();
  };
  const start = (event: Event) => {
    if (!includesTarget(event.target)) return;
    observed = true;
    pending += 1;
  };
  const finish = (event: Event) => {
    if (!includesTarget(event.target) || pending === 0) return;
    pending -= 1;
    maybeSettle();
  };

  root.addEventListener("transitionrun", start, true);
  root.addEventListener("animationstart", start, true);
  root.addEventListener("transitionend", finish, true);
  root.addEventListener("transitioncancel", finish, true);
  root.addEventListener("animationend", finish, true);
  root.addEventListener("animationcancel", finish, true);

  return {
    get observed() {
      return observed;
    },
    get settled() {
      return settled;
    },
    stop() {
      root.removeEventListener("transitionrun", start, true);
      root.removeEventListener("animationstart", start, true);
      root.removeEventListener("transitionend", finish, true);
      root.removeEventListener("transitioncancel", finish, true);
      root.removeEventListener("animationend", finish, true);
      root.removeEventListener("animationcancel", finish, true);
    },
  };
}

async function waitForSlideContentAnimations() {
  const root = getSlideContentRoot();
  if (!root) return;

  const eventWatch = watchAnimationEvents(root);
  try {
    await nextTick();
    // SVG/CSS transitions created by class changes may not appear in
    // getAnimations() until the browser has performed style and animation
    // updates. Two frames keeps transient stages from sampling too early.
    await nextFrame();
    await nextFrame();

    let animations = finiteAnimations(root);
    while (animations.length > 0) {
      await Promise.allSettled(animations.map((animation) => animation.finished));
      await nextFrame();
      animations = finiteAnimations(root);
    }

    if (eventWatch.observed) await eventWatch.settled;
  } finally {
    eventWatch.stop();
  }
}

// Resolve once the current slide transition has settled — the finite animations
// under #slideshow have finished. Slidev runs the slide transition on the
// SlideWrapper (an ancestor of #slide-content), so it is observed here, not
// under #slide-content. Used both to hold `busy` through a slide's entrance and
// to defer its stage reset so revealed content isn't seen collapsing on the way
// out.
async function waitForSlideTransition() {
  await nextTick();
  await nextFrame();
  await nextFrame();

  if (typeof document === "undefined") return;
  const root = document.querySelector("#slideshow") ?? document.body;
  const animations = finiteAnimations(root);

  await Promise.allSettled(animations.map((animation) => animation.finished));
}

/**
 * Intra-slide stage tracker driven by the Left/Right arrow keys.
 *
 * The deck masks Slidev's default `next_right` / `prev_left` shortcuts (see
 * `setup/shortcuts.ts`), so Left/Right advance a manual "stage" counter within a
 * single slide instead of navigating between slides.
 *
 * Stage is `0` while the calling slide is inactive when `presist` resets it.
 * Once active, it is 1-indexed and clamped to `[1, n]`: stage `1` is the
 * initial view, stage `2` the first reveal, and so on. Right increments, Left
 * decrements. The active slide's stage is reflected in `location.hash` (`#2`),
 * which also restores it on reload / deep link. Set `stage.busy = true` while an
 * animation runs; Left/Right/Space that arrive while `busy` is dropped, not
 * queued, so a rapid keypress can't skip past a mid-transition stage. The
 * entrance (inactive -> initial stage) is itself held `busy` until the slide has
 * animated in, so `0 -> 1` is uninterruptable.
 * Optional boundary callbacks can handle navigation after the first/last stage.
 *
 * The listeners live in an {@link effectScope} attached to the calling
 * component's scope, so they auto-unregister on unmount.
 *
 * @param n Total number of stages (the maximum stage value).
 * @param options Optional config. `presist` controls persistence across
 * navigation (`true` / `false` / `"back"`, default `"back"`); `preview` is the
 * stage shown in Slidev's overview grid (negative values count backward from
 * `n`, overflow clamped to `[0, n]`); plus `onAfterLast` / `onBeforeFirst`.
 * @returns A ref holding the current stage, with a writable `busy` flag.
 */
export function useStage(n: number, options: UseStageOptions = {}): StageRef {
  const persistMode = options.presist ?? "back";
  // Whether the last stage is stored for a later restore (true + back both do).
  const persistsValue = persistMode !== false;
  const previewStage = normalizePreviewStage(options.preview ?? 1, n);
  // `next`/`prev` are the same adjacent-slide nav the Space boundary fallback
  // uses (setup/shortcuts.ts), so a transient boundary crosses slides uniformly.
  const { currentSlideNo, next: goNext, prev: goPrev } = useNav();
  const { $page, $renderContext } = useSlideContext();
  const slideNo = $page.value;
  const isActive = useIsSlideActive();
  const isPreview = computed(() => $renderContext.value === "overview");
  const busy = ref(false);
  // Resolves when the slide's current entering transition has settled. Set at
  // activation (before the stage is assigned) and awaited by transient stages, so
  // a transient initial stage doesn't step through until the slide has animated
  // in. Stays resolved between entrances, so mid-slide transients await nothing.
  let entering: Promise<void> = Promise.resolve();
  const transientStages = new Set<number>();
  // Bumped on every (de)activation; a deferred reset only fires if its token is
  // still current, so navigating back before the slide hides cancels it.
  let resetRun = 0;

  // Clamp on write so direct assignments (restore, transient stages) stay in
  // range; `0` is allowed to mark the inactive state.
  const raw = ref(0);
  const stage = computed({
    get: () => (isPreview.value ? previewStage : raw.value),
    set: (value) => {
      raw.value = clampStage(value, n);
    },
  });

  const clearSuspendedState = () => {
    busy.value = false;
  };

  const applyStep = (delta: -1 | 1) => {
    if (delta > 0) {
      if (stage.value < n) {
        stage.value += 1;
        return true;
      }

      void options.onAfterLast?.();
      return !!options.onAfterLast;
    } else if (stage.value > 1) {
      stage.value -= 1;
      return true;
    } else {
      void options.onBeforeFirst?.();
      return !!options.onBeforeFirst;
    }
  };

  // While a transition is running the stage is `busy`; drop the incoming step so
  // rapid key/space presses can't skip past a (transient) stage mid-animation.
  // Return `true` so a Space boundary fallback treats the input as consumed.
  const requestStep = (delta: -1 | 1, fallback?: StageBoundaryFallback) => {
    if (busy.value) return true;

    const handled = applyStep(delta);
    if (!handled && fallback) {
      void fallback();
      return true;
    }

    return handled;
  };

  const controller: ActiveStageController = {
    forward: (fallback) => requestStep(1, fallback),
    backward: (fallback) => requestStep(-1, fallback),
  };

  const scope = effectScope();
  scope.run(() => {
    // Watch `currentSlideNo` (not `isActive`) so the entry direction can be read
    // from the transition's own `to`/`from`. A shared `navDirection` ref lags a
    // navigation behind by the time this watcher runs, which would flip `back`
    // persistence (a forward re-entry would wrongly restore the saved stage).
    watch(
      currentSlideNo,
      (to, from) => {
        const active = to === slideNo;
        const wasActive = from === slideNo;
        if (active === wasActive) return; // this slide's activity is unchanged

        if (active) {
          activeStageController = controller;
          resetRun += 1; // cancel any reset still pending from a prior exit
          clearSuspendedState();
          // Start of the slide switch: hold `busy` at once so keys drop from the
          // `0 -> 1` entrance on, and capture the entering-transition settle
          // promise *before* assigning the stage — a transient initial stage's
          // hold awaits `entering`, so its `1 -> 2` pass-through can't fire until
          // the slide has finished animating in.
          busy.value = true;
          const token = resetRun; // already bumped at the top of this branch
          entering = waitForSlideTransition();

          // Backward entry = arriving from a later slide. `back` restores only
          // then; a forward entry (from an earlier slide, or first load) restarts.
          const enteredBackward = from !== undefined && to < from;
          if (!initialHashConsumed) {
            // The slide active at load restores its stage from the hash.
            initialHashConsumed = true;
            const fromHash = readHashStage();
            stage.value = fromHash ?? persistedOrInitial(slideNo);
          } else if (
            persistMode === true ||
            (persistMode === "back" && enteredBackward)
          ) {
            stage.value = persistedOrInitial(slideNo);
          } else {
            stage.value = 1;
          }

          // A transient initial stage owns `busy` and steps itself once `entering`
          // settles (via its hold); otherwise release `busy` when the entrance
          // transition ends, keeping `0 -> 1` uninterruptable until the slide has
          // animated in. Guarded by the activation token so a quick exit cancels.
          if (!transientStages.has(raw.value)) {
            void entering.finally(() => {
              if (token === resetRun && isActive.value) busy.value = false;
            });
          }
        } else {
          if (activeStageController === controller) activeStageController = null;
          clearSuspendedState();
          if (persistMode === true && raw.value > 0) {
            persistedStage.set(slideNo, raw.value);
          } else {
            // `false` and `"back"` both reset to 0 so a forward re-entry is
            // fresh; `"back"` already saved its value (mirror watch below) for a
            // backward re-entry to restore. Defer until the slide has animated
            // away so the revealed content isn't seen collapsing on the way out.
            const token = ++resetRun;
            void waitForSlideTransition().then(() => {
              if (token === resetRun && !isActive.value) stage.value = 0;
            });
          }
        }
      },
      { immediate: true },
    );

    // Mirror the active slide's stage into the hash (and the in-memory store).
    watch(
      [raw, isActive] as const,
      ([value, active]) => {
        if (!active) return;
        if (persistsValue && value > 0) persistedStage.set(slideNo, value);
        writeHashStage(value);
      },
      { immediate: true },
    );

    const onKeydown = (event: KeyboardEvent) => {
      if (!isActive.value) return;

      switch (event.key) {
        case "ArrowRight":
          requestStep(1);
          break;
        case "ArrowLeft":
          requestStep(-1);
          break;
        default:
          return;
      }
      event.preventDefault();
    };

    window.addEventListener("keydown", onKeydown);
    onScopeDispose(() => {
      if (activeStageController === controller) activeStageController = null;
      clearSuspendedState();
      window.removeEventListener("keydown", onKeydown);
    });
  });

  const exposed = stage as unknown as StageRef;
  Object.defineProperty(exposed, "busy", {
    get: () => busy.value,
    set: (value: boolean) => {
      busy.value = value;
    },
  });

  const registerTransient = (
    transientStage: number,
    param?: number | (() => any),
  ) => {
    if (transientStages.has(transientStage)) {
      throw new Error(`Stage ${transientStage} is already marked transient.`);
    }
    transientStages.add(transientStage);

    let run = 0;

    const cancel = () => {
      run += 1;
    };

    const hold = async () => {
      // Wait out any in-progress slide-entrance transition first, so a transient
      // initial stage doesn't step through before the slide has finished entering
      // (mid-slide steps see an already-resolved `entering`, so this is a no-op).
      await entering;
      if (typeof param === "number") return wait(param);
      if (typeof param === "function") return Promise.resolve(param());
      return waitForSlideContentAnimations();
    };

    const stopStageWatch = watch(
      stage,
      (value: number, previous: number | undefined) => {
        const direction = previous === undefined ? 1 : Math.sign(value - previous);
        if (
          direction === 0 ||
          value !== transientStage ||
          !isActive.value ||
          isPreview.value
        ) {
          return;
        }

        const currentRun = ++run;
        exposed.busy = true;

        void (async () => {
          try {
            await hold();
          } catch (error) {
            console.error(error);
          } finally {
            if (currentRun !== run) return;
            const stillTransient =
              stage.value === transientStage && isActive.value && !isPreview.value;
            exposed.busy = false;
            if (stillTransient) {
              // Pass through to the next stage in the entry direction. When that
              // target falls outside `[1, n]` — a transient first stage stepped
              // backward, or a transient last stage stepped forward — there is no
              // stage to land on, so cross to the adjacent slide instead.
              const target = transientStage + direction;
              if (target < 1) {
                void goPrev();
              } else if (target > n) {
                void goNext();
              } else {
                stage.value = target;
              }
            }
          }
        })();
      },
      // `flush: "sync"` so landing on a transient stage sets `busy` in the same
      // tick as the stage change — before any queued/rapid key can be handled.
      { immediate: true, flush: "sync" },
    );

    const stopActiveWatch = watch(isActive, (active) => {
      if (!active) {
        cancel();
        exposed.busy = false;
      }
    });

    onScopeDispose(() => {
      cancel();
      stopStageWatch();
      stopActiveWatch();
      transientStages.delete(transientStage);
    });
  };

  exposed.transient = (stages, param) => {
    for (const s of Array.isArray(stages) ? stages : [stages]) {
      registerTransient(s, param);
    }
    return exposed;
  };

  return exposed;
}
