/// <reference lib="webworker" />
import { FrameClip, type Segment } from "./frameClip";

// Worker that owns a transferred OffscreenCanvas and runs the VP9 decode + blit
// entirely off the main thread. It manages one FrameClip per named id (e.g.
// "forward" / "reverse") that all paint to the single shared canvas context —
// only one plays at a time, matching the on-screen turntable.

interface InitMessage {
  type: "init";
  canvas: OffscreenCanvas;
  clips: Record<string, { url: string; fps: number; width?: number }>;
}
interface LoadMessage {
  type: "load";
  id: string;
}
interface DrawMessage {
  type: "draw";
  reqId: number;
  id: string;
  frame: number;
}
interface PlayMessage {
  type: "play";
  reqId: number;
  id: string;
  segment: Segment;
  report: boolean;
}
interface StopMessage {
  type: "stop";
  reqId: number;
}

type InMessage =
  | InitMessage
  | LoadMessage
  | DrawMessage
  | PlayMessage
  | StopMessage;

type OutMessage =
  | { type: "done"; reqId: number }
  | { type: "error"; reqId: number; message: string }
  | { type: "frame"; id: string; frame: number };

const scope = self as unknown as DedicatedWorkerGlobalScope;
const clips = new Map<string, FrameClip>();
let ctx: OffscreenCanvasRenderingContext2D | null = null;

function post(message: OutMessage) {
  scope.postMessage(message);
}

async function settle(reqId: number, work: Promise<void>) {
  try {
    await work;
    post({ type: "done", reqId });
  } catch (error) {
    post({ type: "error", reqId, message: String(error) });
  }
}

scope.onmessage = (event: MessageEvent<InMessage>) => {
  const message = event.data;

  switch (message.type) {
    case "init": {
      ctx = message.canvas.getContext("2d", { alpha: false });
      for (const [id, spec] of Object.entries(message.clips)) {
        clips.set(id, new FrameClip(spec.url, { fps: spec.fps, width: spec.width }));
      }
      break;
    }
    case "load": {
      void clips.get(message.id)?.load();
      break;
    }
    case "draw": {
      const clip = clips.get(message.id);
      if (!clip || !ctx) return;
      void settle(message.reqId, clip.drawFrame(ctx, message.frame));
      break;
    }
    case "play": {
      const clip = clips.get(message.id);
      if (!clip || !ctx) return;
      const onFrame = message.report
        ? (frame: number) => post({ type: "frame", id: message.id, frame })
        : undefined;
      void settle(message.reqId, clip.playSegment(ctx, message.segment, onFrame));
      break;
    }
    case "stop": {
      void settle(
        message.reqId,
        Promise.all([...clips.values()].map((clip) => clip.stop())).then(() => {}),
      );
      break;
    }
  }
};
