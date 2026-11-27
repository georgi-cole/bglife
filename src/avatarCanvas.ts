import { drawAvatar, type AvatarPaint, type PortraitRegion } from "./avatarArt.ts";
import type { AvatarLook } from "./avatar.ts";

export function paintAvatar(canvas: HTMLCanvasElement, look: AvatarLook, region: PortraitRegion) {
  const context = canvas.getContext("2d");
  if (!context) return;
  const ctx = context;

  function paint(style: AvatarPaint): string | CanvasGradient {
    if (typeof style === "string") return style;
    const gradient = style.kind === "linear"
      ? ctx.createLinearGradient(style.x1, style.y1, style.x2, style.y2)
      : ctx.createRadialGradient(style.x, style.y, 0, style.x, style.y, style.radius);
    style.colors.forEach((color, index) => gradient.addColorStop(index / (style.colors.length - 1), color));
    return gradient;
  }

  ctx.resetTransform();
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.lineJoin = "round";
  ctx.lineCap = "round";

  drawAvatar({
    save: () => ctx.save(),
    restore: () => ctx.restore(),
    translate: (x, y) => ctx.translate(x, y),
    scale: (x, y) => ctx.scale(x, y),
    setOpacity: opacity => { ctx.globalAlpha = opacity; },
    clip: shape => ctx.clip(new Path2D(shape)),
    fillPath: (shape, style) => {
      ctx.fillStyle = paint(style);
      ctx.fill(new Path2D(shape));
    },
    strokePath: (shape, style, width) => {
      ctx.strokeStyle = paint(style);
      ctx.lineWidth = width;
      ctx.stroke(new Path2D(shape));
    },
    fillEllipse: (x, y, rx, ry, style) => {
      const shape = new Path2D();
      shape.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
      ctx.fillStyle = paint(style);
      ctx.fill(shape);
    },
    fillRect: (x, y, width, height, style) => {
      ctx.fillStyle = paint(style);
      ctx.fillRect(x, y, width, height);
    },
  }, look, region, canvas.width);
}
