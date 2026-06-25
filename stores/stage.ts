import { useIsSlideActive } from "@slidev/client";
import { effectScope, onScopeDispose, ref, watch, type Ref } from "vue";

interface UseStageOptions {
  presist?: boolean;
  onAfterLast?: () => void | Promise<void>;
  onBeforeFirst?: () => void | Promise<void>;
}

export interface StageRef extends Ref<number> {
  busy: boolean;
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

/**
 * Intra-slide stage tracker driven by the Left/Right arrow keys.
 *
 * The deck masks Slidev's default `next_right` / `prev_left` shortcuts (see
 * `setup/shortcuts.ts`), so Left/Right are free to advance a manual "stage"
 * counter within a single slide instead of navigating between slides.
 *
 * Stage is `0` while the calling slide is inactive unless `presist` is false.
 * Once active, it is 1-indexed and clamped to `[1, n]`: stage `1` is the
 * initial view, stage `2` the first reveal, and so on. Right increments, Left
 * decrements. Set
 * `stage.busy = true` while an animation is running to queue further arrow
 * changes; queued Left/Right inputs cancel each other through a signed counter.
 * Optional boundary callbacks can handle navigation after the first/last stage.
 *
 * The keydown listener lives in its own {@link effectScope}, which attaches to
 * the calling component's scope and is disposed with it — so the listener
 * auto-unregisters on unmount (e.g. when navigating away from the slide).
 *
 * @param n Total number of stages (the maximum stage value).
 * @param presist Keep the stage value when navigating away. Defaults to false.
 * @returns A ref holding the current stage, with a writable `busy` flag.
 */
export function useStage(
  n: number,
  presist: boolean | UseStageOptions = true,
  maybeOptions: UseStageOptions = {},
): StageRef {
  const options = typeof presist === "boolean" ? maybeOptions : presist;
  const shouldPresist = typeof presist === "boolean" ? presist : true;
  const stage = ref(0);
  const busy = ref(false);
  const isActive = useIsSlideActive();
  let pendingDelta = 0;

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
          clearSuspendedState();
          if (options.presist === false || stage.value === 0) stage.value = 1;
        } else {
          if (activeStageController === controller)
            activeStageController = null;
          clearSuspendedState();
          if (!shouldPresist) stage.value = 0;
        }
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

  const exposed = stage as StageRef;
  Object.defineProperty(exposed, "busy", {
    get: () => busy.value,
    set: (value: boolean) => {
      busy.value = value;
      if (!value) queueMicrotask(flushQueuedStep);
    },
  });

  return exposed;
}
