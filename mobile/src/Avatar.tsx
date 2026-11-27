import { useMemo } from "react";
import {
  Canvas, ClipOp, PaintStyle, Picture, Skia, StrokeCap, StrokeJoin, TileMode,
} from "@shopify/react-native-skia";
import { drawAvatar, type AvatarPaint, type PortraitRegion } from "../../src/avatarArt.ts";
import { type AvatarLook } from "../../src/avatar.ts";

function makePortrait(look: AvatarLook, region: PortraitRegion, width: number, height: number) {
  const recorder = Skia.PictureRecorder();
  const canvas = recorder.beginRecording(Skia.XYWHRect(0, 0, width, height));
  const brush = Skia.Paint();
  brush.setAntiAlias(true);
  brush.setStrokeJoin(StrokeJoin.Round);
  brush.setStrokeCap(StrokeCap.Round);
  let opacity = 1;
  const opacities: number[] = [];

  function path(shape: string) {
    const result = Skia.Path.MakeFromSVGString(shape);
    if (!result) throw new Error("Invalid BgLife avatar path");
    return result;
  }

  function paint(style: AvatarPaint, strokeWidth?: number) {
    brush.setStyle(strokeWidth === undefined ? PaintStyle.Fill : PaintStyle.Stroke);
    if (strokeWidth !== undefined) brush.setStrokeWidth(strokeWidth);
    if (typeof style === "string") {
      const color = Skia.Color(style);
      brush.setShader(null);
      brush.setColor(color);
      brush.setAlphaf(color[3] * opacity);
    } else {
      const colors = style.colors.map(color => Skia.Color(color));
      const shader = style.kind === "linear"
        ? Skia.Shader.MakeLinearGradient(Skia.Point(style.x1, style.y1), Skia.Point(style.x2, style.y2), colors, null, TileMode.Clamp)
        : Skia.Shader.MakeRadialGradient(Skia.Point(style.x, style.y), style.radius, colors, null, TileMode.Clamp);
      brush.setColor(Skia.Color("#FFFFFF"));
      brush.setShader(shader);
      brush.setAlphaf(opacity);
    }
    return brush;
  }

  drawAvatar({
    save: () => {
      opacities.push(opacity);
      canvas.save();
    },
    restore: () => {
      opacity = opacities.pop() ?? 1;
      canvas.restore();
    },
    translate: (x, y) => canvas.translate(x, y),
    scale: (x, y) => canvas.scale(x, y),
    setOpacity: value => { opacity = value; },
    clip: shape => canvas.clipPath(path(shape), ClipOp.Intersect, true),
    fillPath: (shape, style) => canvas.drawPath(path(shape), paint(style)),
    strokePath: (shape, style, width) => canvas.drawPath(path(shape), paint(style, width)),
    fillEllipse: (x, y, rx, ry, style) => canvas.drawOval(Skia.XYWHRect(x - rx, y - ry, rx * 2, ry * 2), paint(style)),
    fillRect: (x, y, w, h, style) => canvas.drawRect(Skia.XYWHRect(x, y, w, h), paint(style)),
  }, look, region, width);
  return recorder.finishRecordingAsPicture();
}

export function Avatar({ look, size, label, full }: {
  look: AvatarLook;
  size: number;
  label: string;
  full?: boolean;
}) {
  const height = full ? Math.round(size * 408 / 360) : size;
  const region = full ? "portrait" : "badge";
  const picture = useMemo(() => makePortrait(look, region, size, height), [look, region, size, height]);
  return (
    <Canvas accessible accessibilityRole="image" accessibilityLabel={label} style={{ width: size, height }}>
      <Picture picture={picture} />
    </Canvas>
  );
}
