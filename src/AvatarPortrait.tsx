import { useLayoutEffect, useRef } from "react";
import { getAvatarLook, getAvatarTreatments, type AvatarLook } from "./avatar.ts";
import { portraitPixels, type PortraitRegion } from "./avatarArt.ts";
import { paintAvatar } from "./avatarCanvas.ts";
import type { GameState } from "./engine.ts";

type PortraitProps = { region?: PortraitRegion; className?: string; label?: string };

export function AvatarPortrait({ look, region = "portrait", className, label }: PortraitProps & { look: AvatarLook }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [width, height] = portraitPixels[region];

  useLayoutEffect(() => {
    if (ref.current) paintAvatar(ref.current, look, region);
  }, [look, region]);

  return <canvas ref={ref} className={className} width={width} height={height} data-avatar-stage={look.stage.id}
    role={label ? "img" : undefined} aria-label={label} aria-hidden={!label || undefined} />;
}

export function LifePortrait({ life, ...props }: PortraitProps & { life: GameState }) {
  return <AvatarPortrait {...props} look={getAvatarLook(life.avatar, life.age, getAvatarTreatments(life.history, life.age))} />;
}
