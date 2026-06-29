import { ALL_FORMATS, BlobSource, CanvasSink, Input } from "mediabunny";

export interface FrameClipOptions {
  /** Frames per second of the source clip, for frame ↔ timestamp mapping. */
  fps: number;
  /**
   * Output canvas width in pixels; height is derived from the source aspect
   * ratio. The source still decodes at native resolution — this only caps the
   * rasterized canvas. 2560 stays crisp through 1440p while roughly halving the
   * per-frame blit cost of full 4K.
   */
  width?: number;
}

export interface Segment {
  startFrame: number;
  endFrame: number;
}

/**
 * Frame-accurate playback of a VP9/WebM clip onto a 2D canvas via WebCodecs.
 *
 * mediabunny's {@link CanvasSink} owns a `VideoDecoder` internally: it demuxes
 * the container, decodes packets, and rasterizes frames to canvases. We pull
 * those canvases and blit them onto the target context, pacing each paint to
 * its exact presentation moment. Because the source is 4K (one decoded frame is
 * ~33 MB), frames are streamed and never cached — the sink pre-decodes a few
 * ahead and reuses a small canvas pool, keeping VRAM constant.
 *
 * Every operation is serialized: a new draw/playback aborts the previous one
 * and waits for its async iterator to run cleanup (closing the decoder) before
 * starting, so a single sink never has two decode loops in flight at once.
 */
export class FrameClip {
  private readonly fps: number;
  private readonly width: number;
  private sink: CanvasSink | null = null;
  private loadPromise: Promise<void> | null = null;

  private controller: AbortController | null = null;
  private running: Promise<void> = Promise.resolve();

  constructor(
    private readonly url: string,
    options: FrameClipOptions,
  ) {
    this.fps = options.fps;
    this.width = options.width ?? 2560;
  }

  /** Frame number (1-based) → its start presentation timestamp, in seconds. */
  private frameTime(frame: number) {
    return (frame - 1) / this.fps;
  }

  /** Begin fetching and demuxing. Idempotent; the work runs at most once. */
  load() {
    if (!this.loadPromise) this.loadPromise = this.init();
    return this.loadPromise;
  }

  private async init() {
    const response = await fetch(this.url);
    const blob = await response.blob();
    const input = new Input({
      source: new BlobSource(blob),
      formats: ALL_FORMATS,
    });
    const track = await input.getPrimaryVideoTrack();
    if (!track) throw new Error(`No video track found in ${this.url}`);
    this.sink = new CanvasSink(track, {
      width: this.width,
      fit: "contain",
      // Reuse two backing canvases round-robin so VRAM stays constant.
      poolSize: 2,
    });
  }

  /** Abort any in-flight draw/playback on this clip and await its unwind. */
  async stop() {
    this.controller?.abort();
    this.controller = null;
    await this.running;
  }

  // Serialize operations: cancel the previous one, wait for its iterator to run
  // cleanup, then start fresh under a new abort signal.
  private run(fn: (signal: AbortSignal) => Promise<void>): Promise<void> {
    const controller = new AbortController();
    const task = (async () => {
      await this.stop();
      this.controller = controller;
      await this.load();
      if (controller.signal.aborted) return;
      await fn(controller.signal);
    })();
    this.running = task.catch((error) => {
      if (!controller.signal.aborted) console.error(error);
    });
    return this.running;
  }

  /** Decode and paint exactly `frame` (1-based), then leave it on screen. */
  drawFrame(ctx: CanvasRenderingContext2D, frame: number) {
    return this.run(async (signal) => {
      // Sample mid-frame so getCanvas (last frame ≤ t) lands unambiguously.
      const t = this.frameTime(frame) + 0.5 / this.fps;
      const wrapped = await this.sink!.getCanvas(t);
      if (!signal.aborted && wrapped) this.blit(ctx, wrapped.canvas);
    });
  }

  /**
   * Play frames [startFrame, endFrame] in real time, painting each at its exact
   * wall-clock moment. The final frame is left on screen. Resolves when the
   * segment finishes or is aborted.
   */
  playSegment(ctx: CanvasRenderingContext2D, segment: Segment) {
    return this.run((signal) => this.playLoop(ctx, segment, signal));
  }

  private async playLoop(
    ctx: CanvasRenderingContext2D,
    { startFrame, endFrame }: Segment,
    signal: AbortSignal,
  ) {
    // Half-open [start, end) over frame-start timestamps, nudged by ±half a
    // frame so frames startFrame..endFrame are yielded inclusively despite
    // floating-point rounding of the container timecodes.
    const start = this.frameTime(startFrame) - 0.5 / this.fps;
    const end = this.frameTime(endFrame) + 0.5 / this.fps;

    // Anchor wall-clock time to the first frame actually presented, so paints
    // track real time exactly without ever rewinding (no freeze-frame bounce).
    let clockStart = -1;
    let firstTs = 0;
    for await (const { canvas, timestamp } of this.sink!.canvases(start, end)) {
      if (signal.aborted) return;
      if (clockStart < 0) {
        clockStart = performance.now();
        firstTs = timestamp;
      }
      await waitUntil(clockStart + (timestamp - firstTs) * 1000, signal);
      if (signal.aborted) return;
      this.blit(ctx, canvas);
    }
  }

  private blit(
    ctx: CanvasRenderingContext2D,
    source: HTMLCanvasElement | OffscreenCanvas,
  ) {
    if (ctx.canvas.width !== source.width || ctx.canvas.height !== source.height) {
      ctx.canvas.width = source.width;
      ctx.canvas.height = source.height;
    }
    ctx.drawImage(source, 0, 0);
  }
}

/**
 * Resolve once `performance.now()` reaches `targetMs`, pacing on rAF so the
 * paint lands on a display refresh; returns early if `signal` aborts.
 */
function waitUntil(targetMs: number, signal: AbortSignal) {
  return new Promise<void>((resolve) => {
    const tick = () => {
      if (signal.aborted || performance.now() >= targetMs - 0.5) {
        resolve();
        return;
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
}
