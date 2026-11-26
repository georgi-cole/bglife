import { useEffect, useRef, type RefObject } from "react";
import mark from "../public/art/kolequant-mark.webp";
import wordmark from "../public/art/kolequant-wordmark.webp";
import "./kolequant-splash.css";

const HOLD_MS = 700;
const LOAD_LIMIT_MS = 1700;
const MORPH_MS = 900;
const FADE_MS = 240;

type Point = { x: number; y: number };
type Props = {
  artwork: RefObject<HTMLImageElement | null>;
  flag: RefObject<HTMLSpanElement | null>;
  onFinish: () => void;
};

function sampleMark(image: HTMLImageElement): Point[][] {
  const sample = document.createElement("canvas");
  sample.width = 25;
  sample.height = 52;
  const context = sample.getContext("2d", { willReadFrequently: true });
  if (!context || !image.naturalWidth) return [];

  context.drawImage(image, 0, 0, sample.width, sample.height);
  const { data } = context.getImageData(0, 0, sample.width, sample.height);
  const bands: Point[][] = [[], [], []];

  for (let y = 0; y < sample.height; y++) {
    const band = bands[Math.floor(y * 3 / sample.height)];
    for (let x = 0; x < sample.width; x++) {
      if (data[(y * sample.width + x) * 4 + 3] > 100) {
        band.push({ x: (x + .5) / sample.width, y: (y + .5) / sample.height });
      }
    }
  }

  return bands;
}

function drawMorph({
  context, bands, colors, origin, target, elapsed,
}: {
  context: CanvasRenderingContext2D;
  bands: Point[][];
  colors: string[];
  origin: DOMRect;
  target: DOMRect;
  elapsed: number;
}) {
  const progress = Math.min(elapsed / MORPH_MS, 1);
  const travel = Math.max(0, (progress - .07) / .93);
  const t = travel * travel * (3 - 2 * travel);
  const arc = Math.sin(t * Math.PI);
  const bandHeight = target.height / 3;
  const size = origin.height / 52;

  context.globalAlpha = Math.min(progress / .12, 1);
  bands.forEach((points, band) => {
    context.fillStyle = colors[band];
    const columns = Math.ceil(Math.sqrt(points.length * target.width / bandHeight));
    const rows = Math.ceil(points.length / columns);
    const tileHeight = bandHeight / rows;

    points.forEach((point, index) => {
      const row = Math.floor(index / columns);
      const column = index % columns;
      const tileWidth = target.width / Math.min(columns, points.length - row * columns);
      const fromX = origin.left + point.x * origin.width;
      const fromY = origin.top + point.y * origin.height;
      const toX = target.left + (column + .5) * tileWidth;
      const toY = target.top + band * bandHeight + (row + .5) * tileHeight;
      const x = fromX + (toX - fromX) * t + arc * (point.x - .44 + .17 * (band - 1)) * 76;
      const y = fromY + (toY - fromY) * t - arc * (22 + (1 - point.y) * 34);
      const width = size + (tileWidth - size) * t;
      const height = size + (tileHeight - size) * t;
      context.fillRect(x - width / 2, y - height / 2, width + .15, height + .15);
    });
  });
  context.globalAlpha = 1;
}

export function KolequantSplash({ artwork, flag, onFinish }: Props) {
  const splash = useRef<HTMLDivElement>(null);
  const source = useRef<HTMLImageElement>(null);
  const symbol = useRef<HTMLSpanElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const overlay = splash.current;
    const image = source.current;
    const shape = symbol.current;
    const surface = canvas.current;
    const destination = flag.current;
    if (!overlay || !image || !shape || !surface || !destination) {
      onFinish();
      return;
    }

    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (motion.matches) {
      onFinish();
      return;
    }

    const context = surface.getContext("2d");
    const started = performance.now();
    let settled = false;
    let frame = 0;
    let morphStart: number | undefined;
    let duration = MORPH_MS;
    let bands: Point[][] = [];
    let colors: string[] = [];
    const cover = artwork.current;
    void Promise.allSettled([image.decode(), cover?.decode()]).then(() => { settled = true; });

    const tick = (now: number) => {
      if (now - started < HOLD_MS || (!settled && now - started < LOAD_LIMIT_MS)) {
        frame = requestAnimationFrame(tick);
        return;
      }

      if (morphStart === undefined) {
        morphStart = now;
        bands = context ? sampleMark(image) : [];
        const hasMark = bands.length === 3 && bands.every(points => points.length > 0);
        if (!hasMark) bands = [];
        duration = hasMark ? MORPH_MS : FADE_MS;
        const style = getComputedStyle(overlay);
        colors = ["--bg-white", "--bg-green", "--bg-red"].map(color => style.getPropertyValue(color).trim());
        overlay.style.setProperty("--splash-duration", String(duration) + "ms");
        overlay.dataset.phase = hasMark ? "morph" : "fade";
      }

      const elapsed = now - morphStart;
      if (elapsed >= duration) {
        onFinish();
        return;
      }

      if (context && bands.length) {
        const ratio = Math.min(window.devicePixelRatio || 1, 2);
        const width = Math.round(surface.clientWidth * ratio);
        const height = Math.round(surface.clientHeight * ratio);
        if (surface.width !== width) surface.width = width;
        if (surface.height !== height) surface.height = height;
        context.setTransform(ratio, 0, 0, ratio, 0, 0);
        context.clearRect(0, 0, width / ratio, height / ratio);
        drawMorph({ context, bands, colors, origin: shape.getBoundingClientRect(),
          target: destination.getBoundingClientRect(), elapsed });
      }

      frame = requestAnimationFrame(tick);
    };

    const reduceMotion = (event: MediaQueryListEvent) => {
      if (event.matches) onFinish();
    };
    frame = requestAnimationFrame(tick);
    const deadline = window.setTimeout(onFinish, LOAD_LIMIT_MS + MORPH_MS + 200);
    motion.addEventListener("change", reduceMotion);
    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(deadline);
      motion.removeEventListener("change", reduceMotion);
    };
  }, [artwork, flag, onFinish]);

  const maskImage = 'url("' + mark + '")';
  return <div ref={splash} className="kolequant-splash" role="status" aria-label="KoleQuant">
    <div className="kolequant-splash-backdrop" />
    <div className="kolequant-splash-brand" aria-hidden="true">
      <span ref={symbol} className="kolequant-splash-symbol" style={{ maskImage, WebkitMaskImage: maskImage }} />
      <img src={wordmark} className="kolequant-splash-wordmark" alt="" fetchPriority="high" />
    </div>
    <img ref={source} src={mark} hidden alt="" fetchPriority="high" />
    <canvas ref={canvas} className="kolequant-splash-canvas" aria-hidden="true" />
  </div>;
}
