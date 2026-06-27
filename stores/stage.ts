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

interface ActiveStageController {
  forward: () => boolean;
  backward: () => boolean;
}

let activeStageController: ActiveStageController | null = null;

export function advanceActiveStage() {
  return activeStageController?.forward() ?? false;
}

export function retreatActiveStage() {
  return activeStageController?.backward() ?? false;
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

async function waitForSlideContentAnimations() {
  await nextTick();
  await nextFrame();

  if (typeof document === "undefined") return;
  const root = document.querySelector("div#slide-content");
  if (!root) return;

  const activeAnimations = root.getAnimations?.({ subtree: true }) ?? [];
  const animations = activeAnimations.filter((animation) => {
    const timing = animation.effect?.getTiming();
    return timing?.iterations !== Infinity;
  });

  await Promise.allSettled(animations.map((animation) => animation.finished));
}

// Resolve once the slide transition has settled, i.e. the outgoing slide has
// finished animating away and is no longer visible. Used to defer a slide's
// stage reset so its revealed content isn't seen collapsing on the way out.
async function waitForSlideHidden() {
  await nextTick();
  await nextFrame();
  await nextFrame();

  if (typeof document === "undefined") return;
  const root = document.querySelector("#slideshow") ?? document.body;
  const animations = (root.getAnimations?.({ subtree: true }) ?? []).filter(
    (animation) => animation.effect?.getTiming().iterations !== Infinity,
  );

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
 * which also restores it on reload / deep link. Set `stage.busy = true` while
 * an animation runs to queue further arrow changes; queued Left/Right inputs
 * cancel each other through a signed counter. Optional boundary callbacks can
 * handle navigation after the first/last stage.
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
  const { navDirection } = useNav();
  const { $page, $renderContext } = useSlideContext();
  const slideNo = $page.value;
  const isActive = useIsSlideActive();
  const isPreview = computed(() => $renderContext.value === "overview");
  const busy = ref(false);
  const transientStages = new Set<number>();
  let pendingDelta = 0;
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
    pendingDelta = 0;
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

  const flushQueuedStep = () => {
    if (busy.value || pendingDelta === 0 || !isActive.value) return;

    const delta = Math.sign(pendingDelta) as -1 | 1;
    pendingDelta -= delta;
    applyStep(delta);
  };

  const requestStep = (delta: -1 | 1) => {
    if (busy.value) {
      pendingDelta += delta;
      return true;
    }

    return applyStep(delta);
  };

  const controller: ActiveStageController = {
    forward: () => requestStep(1),
    backward: () => requestStep(-1),
  };

  const scope = effectScope();
  scope.run(() => {
    watch(
      isActive,
      (active) => {
        if (active) {
          activeStageController = controller;
          resetRun += 1; // cancel any reset still pending from a prior exit
          clearSuspendedState();
          // `navDirection` is < 0 when this slide was reached by going backward.
          const enteredBackward = navDirection.value < 0;
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
            void waitForSlideHidden().then(() => {
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
      if (!value) queueMicrotask(flushQueuedStep);
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

    const hold = () => {
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
        stage.busy = true;

        void (async () => {
          try {
            await hold();
          } catch (error) {
            console.error(error);
          } finally {
            if (currentRun !== run) return;
            const stillTransient =
              stage.value === transientStage && isActive.value && !isPreview.value;
            stage.busy = false;
            if (stillTransient) stage.value = transientStage + direction;
          }
        })();
      },
      { immediate: true },
    );

    const stopActiveWatch = watch(isActive, (active) => {
      if (!active) {
        cancel();
        stage.busy = false;
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
