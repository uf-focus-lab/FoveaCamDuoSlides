import type { Segment } from "./frameClip";

export interface ClipSpec {
  url: string;
  fps: number;
  width?: number;
}

type FrameCallback = (frame: number) => void;

// One playable clip on the shared canvas, addressed by id.
interface Impl {
  load(id: string): void;
  draw(id: string, frame: number): Promise<void>;
  play(id: string, segment: Segment, onFrame?: FrameCallback): Promise<void>;
  stopAll(): Promise<void>;
  dispose(): void;
}

/**
 * Drives the turntable clips, keeping the 4K VP9 decode + per-frame blit off the
 * main thread by transferring the canvas to a worker-owned {@link OffscreenCanvas}.
 * Where `transferControlToOffscreen` is unavailable it transparently falls back
 * to running the same {@link FrameClip} logic on the main thread.
 *
 * The public methods mirror {@link FrameClip} but address a clip by id ("forward"
 * / "reverse") instead of taking a context, since the player owns the canvas.
 */
export class TurntablePlayer implements Impl {
  private impl: Promise<Impl>;

  constructor(canvas: HTMLCanvasElement, clips: Record<string, ClipSpec>) {
    this.impl = createImpl(canvas, clips);
  }

  load(id: string) {
    void this.impl.then((impl) => impl.load(id));
  }

  async draw(id: string, frame: number) {
    await (await this.impl).draw(id, frame);
  }

  async play(id: string, segment: Segment, onFrame?: FrameCallback) {
    await (await this.impl).play(id, segment, onFrame);
  }

  async stopAll() {
    await (await this.impl).stopAll();
  }

  dispose() {
    void this.impl.then((impl) => impl.dispose());
  }
}

async function createImpl(
  canvas: HTMLCanvasElement,
  clips: Record<string, ClipSpec>,
): Promise<Impl> {
  if (
    typeof Worker !== "undefined" &&
    typeof canvas.transferControlToOffscreen === "function"
  ) {
    try {
      return new WorkerImpl(canvas, clips);
    } catch {
      // Fall through to the main-thread path below.
    }
  }
  return createMainThreadImpl(canvas, clips);
}

// Resolve each clip URL against the document so a relative asset path still
// fetches correctly from inside the worker (its base URL differs).
function absolute(url: string) {
  return new URL(url, location.href).href;
}

class WorkerImpl implements Impl {
  private worker: Worker;
  private reqId = 0;
  private pending = new Map<number, { resolve: () => void; reject: (e: Error) => void }>();
  private frameHandlers = new Map<string, FrameCallback>();

  constructor(canvas: HTMLCanvasElement, clips: Record<string, ClipSpec>) {
    this.worker = new Worker(new URL("./frameClip.worker.ts", import.meta.url), {
      type: "module",
    });
    this.worker.onmessage = (event) => this.onMessage(event.data);

    const offscreen = canvas.transferControlToOffscreen();
    const resolved = Object.fromEntries(
      Object.entries(clips).map(([id, spec]) => [
        id,
        { url: absolute(spec.url), fps: spec.fps, width: spec.width },
      ]),
    );
    this.worker.postMessage({ type: "init", canvas: offscreen, clips: resolved }, [
      offscreen,
    ]);
  }

  private onMessage(message: {
    type: string;
    reqId?: number;
    id?: string;
    frame?: number;
    message?: string;
  }) {
    if (message.type === "frame") {
      this.frameHandlers.get(message.id!)?.(message.frame!);
      return;
    }
    const entry = this.pending.get(message.reqId!);
    if (!entry) return;
    this.pending.delete(message.reqId!);
    if (message.type === "error") entry.reject(new Error(message.message));
    else entry.resolve();
  }

  private request(message: Record<string, unknown>) {
    const reqId = ++this.reqId;
    return new Promise<void>((resolve, reject) => {
      this.pending.set(reqId, { resolve, reject });
      this.worker.postMessage({ ...message, reqId });
    });
  }

  load(id: string) {
    this.worker.postMessage({ type: "load", id });
  }

  draw(id: string, frame: number) {
    return this.request({ type: "draw", id, frame });
  }

  play(id: string, segment: Segment, onFrame?: FrameCallback) {
    if (onFrame) this.frameHandlers.set(id, onFrame);
    else this.frameHandlers.delete(id);
    return this.request({ type: "play", id, segment, report: !!onFrame }).finally(
      () => this.frameHandlers.delete(id),
    );
  }

  stopAll() {
    return this.request({ type: "stop" });
  }

  dispose() {
    this.worker.terminate();
    this.pending.clear();
    this.frameHandlers.clear();
  }
}

async function createMainThreadImpl(
  canvas: HTMLCanvasElement,
  clips: Record<string, ClipSpec>,
): Promise<Impl> {
  // Dynamic import keeps mediabunny out of the initial main-thread chunk; it is
  // only pulled in when the OffscreenCanvas worker path is unavailable.
  const { FrameClip } = await import("./frameClip");
  const ctx = canvas.getContext("2d", { alpha: false });
  const map = new Map(
    Object.entries(clips).map(([id, spec]) => [
      id,
      new FrameClip(spec.url, { fps: spec.fps, width: spec.width }),
    ]),
  );

  return {
    load: (id) => void map.get(id)?.load(),
    draw: (id, frame) =>
      ctx ? map.get(id)!.drawFrame(ctx, frame) : Promise.resolve(),
    play: (id, segment, onFrame) =>
      ctx ? map.get(id)!.playSegment(ctx, segment, onFrame) : Promise.resolve(),
    stopAll: () =>
      Promise.all([...map.values()].map((clip) => clip.stop())).then(() => {}),
    dispose: () => {},
  };
}
