import type { AvatarLook, AvatarStage, AvatarTraits } from "./avatar.ts";

type Painter = CanvasRenderingContext2D;
type Paint = string | CanvasGradient;
export type PortraitRegion = "portrait" | "badge" | "face" | "hair" | "eyes" | "brows" | "lips";

export const portraitPixels: Record<PortraitRegion, readonly [number, number]> = {
  portrait: [360, 408],
  badge: [152, 152],
  face: [144, 144],
  hair: [144, 144],
  eyes: [160, 100],
  brows: [160, 100],
  lips: [160, 100],
};

const poses = {
  baby:       { top: 44, x: 1.02, y: .86, eyes: 60, mouth: 85, eyeSize: 1.07, clothing: "#7e9b91" },
  toddler:    { top: 38, x: 1.01, y: .95, eyes: 58, mouth: 87, eyeSize: 1.1, clothing: "#b57463" },
  child:      { top: 35, x: .94, y: 1.02, eyes: 56, mouth: 88, eyeSize: 1.12, clothing: "#bf9658" },
  teen:       { top: 31, x: .97, y: 1.08, eyes: 54, mouth: 89, eyeSize: 1.06, clothing: "#77799e" },
  youngAdult: { top: 27, x: 1, y: 1.13, eyes: 53, mouth: 89, eyeSize: 1, clothing: "#659288" },
  adult:      { top: 25, x: 1.02, y: 1.16, eyes: 53, mouth: 90, eyeSize: .97, clothing: "#a16b77" },
  elder:      { top: 27, x: 1, y: 1.15, eyes: 54, mouth: 91, eyeSize: .94, clothing: "#637d99" },
} satisfies Record<AvatarStage["id"], { top: number; x: number; y: number; eyes: number; mouth: number; eyeSize: number; clothing: string }>;

type Pose = typeof poses[keyof typeof poses];

const faces = {
  round:   { cheeks: 45, jaw: 34, chin: 17, length: 108 },
  oval:    { cheeks: 42, jaw: 30, chin: 13, length: 113 },
  heart:   { cheeks: 42, jaw: 23, chin: 9, length: 111 },
  square:  { cheeks: 43, jaw: 38, chin: 19, length: 110 },
  long:    { cheeks: 39, jaw: 29, chin: 13, length: 118 },
  diamond: { cheeks: 47, jaw: 25, chin: 11, length: 115 },
} satisfies Record<AvatarTraits["face"], { cheeks: number; jaw: number; chin: number; length: number }>;

const haircuts = {
  crop: {
    front: "M-43 55C-54 45-56 27-48 14Q-53 3-40 0Q-43-12-25-12Q-14-23-1-15Q10-26 22-15Q37-20 40-7Q54-9 51 8Q60 25 44 52L39 39Q40 21 30 14Q15 29 4 21Q-7 32-19 20Q-34 35-35 47L-41 55Z",
    strands: ["M-42 30Q-37 11-21 7", "M-19 16Q-16 1 1-6", "M3 17Q13 8 23 2", "M33 7Q45 7 44 27"],
  },
  part: {
    front: "M-43 62Q-58 37-49 14Q-43-8-14-13Q14-21 31-6Q51-3 54 20Q57 41 43 60L39 45Q44 25 32 11Q13 29-28 32Q-39 39-43 62Z",
    strands: ["M-46 34Q-30 23-13 13Q6 2 16-7", "M-37 29Q1 20 25 0", "M36 4Q52 19 47 37"],
  },
  bob: {
    back: "M-49 18Q-57 41-55 79Q-55 102-46 121Q-20 129 7 113Q30 130 56 112Q50 99 56 71L52 25Z",
    front: "M-47 102Q-59 82-55 47Q-59 7-38-8Q-4-30 26-11Q57-7 57 32Q60 67 50 108L36 115Q44 86 41 51Q41 23 27 10Q9 31-32 35Q-39 50-37 77Q-35 91-47 102Z",
    strands: ["M-49 81Q-51 33-28 19Q-2 11 14-7", "M-39 29Q-15 25 22 4", "M38 10Q54 29 49 86"],
  },
  curls: {
    back: "M-48 15Q-72 16-68 46Q-82 62-68 77Q-80 91-63 105Q-67 128-42 133Q-24 149-9 134Q7 145 21 133Q45 146 52 128Q75 130 73 108Q87 90 72 76Q86 58 68 44Q74 23 53 15Z",
    front: "M-42 108Q-62 110-58 90Q-75 78-63 64Q-74 50-61 37Q-68 17-50 11Q-57-7-37-9Q-32-25-13-18Q-2-32 14-19Q32-28 42-11Q63-12 62 9Q79 18 67 39Q80 54 67 68Q80 86 62 97Q65 112 44 114Q53 97 47 82Q52 68 44 57Q49 41 39 35Q35 25 40 16Q22 28 15 17Q7 40-10 25Q-20 37-34 28Q-43 34-39 48Q-51 56-43 71Q-52 82-42 108Z",
    strands: ["M-52 18C-36 10-33 33-46 30", "M-25-7C-14-17-3-2-14 7Q-21 13-23 7", "M10-10Q27-10 25 3Q23 13 17 10", "M47 13Q65 13 59 27Q53 35 49 27", "M57 57Q68 57 62 67", "M-57 71Q-66 82-53 85", "M56 93Q64 93 56 104"],
  },
  ponytail: {
    back: "M-36 9Q-48-2-60 8Q-78 14-72 63Q-83 94-58 131Q-61 106-46 88Q-27 62-39 39Z",
    front: "M-44 58Q-56 38-46 12Q-34-15-2-15Q31-18 46 4Q58 21 44 56Q37 42 42 26Q26 20 10 8Q-22 28-38 32Z",
    strands: ["M-63 17Q-52 42-67 80", "M-41 33Q-36 5-4-8", "M-29 21Q-16 14 1 2", "M24 1Q43 12 49 33"],
  },
  waves: {
    back: "M-41 7Q-63 16-61 56Q-56 76-67 102Q-79 129-65 157Q-41 166-18 149L37 154Q70 160 74 130Q81 112 67 83Q56 59 60 35Q60 12 39 4Z",
    front: "M-45 145Q-70 129-58 101Q-47 81-54 60Q-66 14-38-5Q-12-24 9-12Q33-22 52 4Q67 23 59 51Q52 73 65 102Q79 131 58 153Q68 126 50 111Q35 94 44 66Q48 44 37 32Q22 25 12 4Q-3 26-28 33Q-45 43-38 67Q-28 90-42 111Q-53 129-45 145Z",
    strands: ["M-50 125Q-56 113-47 97Q-38 79-48 58Q-59 26-36 12Q-9 4 4-8", "M-43 41Q-26 24-11 19Q3 13 9 2", "M19-8Q36-2 48 23Q58 39 53 63", "M50 60Q45 86 58 106Q67 121 63 137"],
  },
  bangs: {
    back: "M-50 17Q-60 37-53 71Q-60 99-51 134Q-30 145-8 126L30 132Q58 146 64 117Q56 88 60 60Q62 25 49 16Z",
    front: "M-49 119Q-64 85-53 63Q-64 33-49 6Q-37-18-2-17Q32-23 49 2Q63 22 55 55Q62 84 53 123L40 127Q46 85 40 52L35 35L20 40L19 29L9 39L-9 40L-8 32L-20 39L-32 38Q-41 51-36 76Q-35 98-49 119Z",
    strands: ["M-46 98Q-51 74-43 47", "M-37 28Q-25 4-10-8", "M-13 31Q-7 16 0 7", "M14 28Q18 14 10 0", "M36 28Q37 13 27 2", "M48 53Q53 76 49 104"],
  },
  bun: {
    back: "M21-4Q17-22 35-20Q57-23 63-7Q69 7 53 14Q36 19 27 9Z",
    front: "M-43 57Q-56 35-47 16Q-41-9-12-14Q23-21 43 1Q60 24 43 53Q34 40 40 26Q24 16 19 5Q-1 24-37 32Z",
    strands: ["M31-17Q49-20 56-9", "M39-13Q51-13 54-5", "M-43 27Q-34 9-10 0", "M-32 22Q0 20 15 1", "M28 3Q40 12 46 28"],
  },
  slick: {
    front: "M-42 57Q-51 43-49 24Q-60 15-53 6Q-55-5-40-5Q-33-17-16-12Q5-21 19-13Q39-17 48-3Q59 8 47 24Q48 45 42 56L38 38Q37 24 34 20Q20 10 4 18Q-22 15-37 32Z",
    strands: ["M-43 20Q-27 6-6 6Q27 5 39-6", "M-40 7Q-22-6 2-2Q26-1 34-11", "M3 14Q27 14 43 2"],
  },
  buzz: {
    front: "M-44 51Q-49 31-44 14Q-37-6-13-8Q5-11 27-3Q51 5 48 34L44 51L40 43L39 29Q28 15 6 14Q-19 14-37 30L-40 46Z",
    strands: ["M-39 21Q-23 2 2 0", "M-24 12Q0 3 25 9", "M27 6Q39 11 42 23"],
  },
} satisfies Record<AvatarTraits["hair"], { front: string; back?: string; strands: string[] }>;

const babyHair = {
  crop: {
    front: "M-15 8Q-16-3-7-3Q-4-12 4-8Q9-8 9-1Q20-2 19 6Q15 10 7 8Q-1 14-6 8Q-13 12-15 8Z",
    strands: ["M-6 5Q-6-2 1-5", "M6 6Q11 1 16 3"],
  },
  part: {
    front: "M-22 12Q-21-3-6-6Q9-10 24 0Q24 8 12 4Q-4 8-8 13Q-13 15-11 9Z",
    strands: ["M-15 8Q-9 0 7-3"],
  },
};

type Haircut = { front: string; back?: string; strands: string[] };

const eyes = {
  round:     { lid: "M-10 0C-5-9 5-9 10 0", bottom: "C5 7-5 7-10 0Z" },
  almond:    { lid: "M-11 0Q-1-10 11-1", bottom: "Q1 8-11 0Z" },
  upturned:  { lid: "M-11 1Q-2-8 11-3", bottom: "Q4 7-11 1Z" },
  hooded:    { lid: "M-11 0Q-2-6 11-1", bottom: "Q1 7-11 0Z" },
  downturned:{ lid: "M-11-1Q0-10 11 2", bottom: "Q1 7-11-1Z" },
  narrow:    { lid: "M-11 0Q0-7 11-1", bottom: "Q1 5-11 0Z" },
} satisfies Record<AvatarTraits["eyes"], { lid: string; bottom: string }>;

const brows = {
  soft:     { line: "M-10 1Q-1-4 4-3Q9-2 12 0", weight: 2.6 },
  straight: { line: "M-10 0Q0-1 7-1L12 .8", weight: 2.8 },
  full:     { line: "M-10 0Q-2-3 5-3Q9-3 12 .4", weight: 4.1 },
  angled:   { line: "M-10 1.4 4-4 12-.2", weight: 2.9 },
  fine:     { line: "M-10 1Q-1-5 5-4Q10-3 12-1", weight: 1.5 },
} satisfies Record<AvatarTraits["brows"], { line: string; weight: number }>;

const mouths = {
  soft: { outline: "M-10 0Q-4-4 0-2Q5-4 10 0Q2 8-6 3Z", seam: "M-10 0Q-1 2 3 .9L10 0" },
  full: { outline: "M-12 0Q-5-7 0-4Q6-7 12 0Q1 12-9 4Z", seam: "M-12 0Q-3 2 2 2L12 0" },
  bow:  { outline: "M-11 0Q-7-2-4-5Q-2-6 0-3Q3-6 5-5Q8-2 11 0Q1 9-7 3Z", seam: "M-11 0Q-1 3 5 1L11 0" },
  wide: { outline: "M-14-1Q-6-3 0-2Q6-3 14-1Q2 9-9 3Z", seam: "M-14-1Q0 4 14-1" },
  fine: { outline: "M-12-.5Q-6-3 0-1.8Q5-3.5 12-.5Q0 6-8 2Z", seam: "M-12-.5Q0 2 12-.5" },
} satisfies Record<AvatarTraits["lips"], { outline: string; seam: string }>;

function mix(from: string, to: string, strength: number): string {
  const a = Number.parseInt(from.slice(1), 16);
  const b = Number.parseInt(to.slice(1), 16);
  const channels = [16, 8, 0].map(shift => {
    const depth = (a >> shift) & 255;
    return Math.round(depth + (((b >> shift) & 255) - depth) * strength).toString(16).padStart(2, "0");
  });
  return "#" + channels.join("");
}

function gradient(ctx: Painter, x1: number, y1: number, x2: number, y2: number, ...colors: string[]) {
  const paint = ctx.createLinearGradient(x1, y1, x2, y2);
  colors.forEach((color, index) => paint.addColorStop(index / (colors.length - 1), color));
  return paint;
}

function fill(ctx: Painter, shape: string | Path2D, color: Paint) {
  ctx.fillStyle = color;
  ctx.fill(typeof shape === "string" ? new Path2D(shape) : shape);
}

function line(ctx: Painter, shape: string, color: Paint, width = 1) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.stroke(new Path2D(shape));
}

function ellipse(ctx: Painter, x: number, y: number, rx: number, ry: number, color: Paint) {
  const shape = new Path2D();
  shape.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  fill(ctx, shape, color);
}

function glow(ctx: Painter, x: number, y: number, radius: number, color: string, opacity: number) {
  const paint = ctx.createRadialGradient(x, y, 0, x, y, radius);
  paint.addColorStop(0, color + Math.round(opacity * 255).toString(16).padStart(2, "0"));
  paint.addColorStop(1, color + "00");
  ellipse(ctx, x, y, radius, radius, paint);
}

function drawBackdrop(ctx: Painter) {
  ctx.fillStyle = gradient(ctx, 0, 0, 180, 204, "#49635e", "#2c4648", "#263241");
  ctx.fillRect(-8, -8, 196, 220);
  glow(ctx, 92, 86, 100, "#b2ad83", .34);
  ellipse(ctx, 90, 93, 59, 68, "#e5be8c17");
  line(ctx, "M31 93a59 68 0 1 1 118 0 59 68 0 1 1-118 0Z", "#d9bd9546", .7);
  line(ctx, "M13 112Q15 57 47 34M167 161Q153 178 130 183M19 123v20m-5-10h10m136-72v20m-5-10h10", "#ebcfa757", .75);
}

function drawClothing(ctx: Painter, look: AvatarLook, pose: Pose, chin: number) {
  const cloth = pose.clothing;
  const seam = mix(cloth, "#d9c9ac", .48);
  const shadow = mix(look.skin, "#4a272e", .4);
  if (look.stage.id === "baby") {
    fill(ctx, "M32 210Q29 160 59 143Q90 133 119 143Q151 154 153 210Z",
      gradient(ctx, 54, 143, 121, 213, seam, cloth, "#38565d"));
    line(ctx, "M48 153Q71 183 125 207M131 151Q96 179 68 204", seam, 1.6);
    line(ctx, "M44 157Q60 179 101 196M132 158Q111 175 96 185", "#1e424746", .8);
    return;
  }

  const shoulder = look.stage.tier < 3 ? 33 : 19;
  fill(ctx, "M71 " + (chin - 14) + "Q76 " + (chin + 3) + " 68 172Q90 190 112 172Q104 "
    + (chin + 3) + " 109 " + (chin - 14) + "Z", gradient(ctx, 84, chin - 13, 86, 181, shadow, look.skin));
  fill(ctx, "M" + shoulder + " 208Q" + (shoulder + 3)
    + " 180 49 175L70 166Q90 188 110 166L131 175Q" + (177 - shoulder) + " 180 "
    + (180 - shoulder) + " 208Z", gradient(ctx, 25, 169, 144, 216, seam, cloth, mix(cloth, "#202933", .53)));
  line(ctx, "M69 167Q89 191 111 167", seam, 2.5);
  line(ctx, "M43 181Q45 192 43 207M137 181Q135 192 137 207", mix(cloth, "#263340", .5));
  if (look.stage.tier < 3) {
    fill(ctx, "M69 167Q80 177 90 184Q80 195 69 186L60 172ZM111 167Q100 177 90 184Q100 195 111 186L120 172Z",
      mix(seam, "#fff0d6", .65));
  } else {
    line(ctx, "M90 190v15", seam, .8);
    ellipse(ctx, 90, 197, 1.3, 1.3, seam);
  }
}

function drawEye(ctx: Painter, look: AvatarLook) {
  const eye = eyes[look.traits.eyes];
  const aperture = new Path2D(eye.lid + eye.bottom);
  fill(ctx, aperture, gradient(ctx, 0, -5, 0, 6, "#e0c9b9", "#fff1da"));
  ctx.save();
  ctx.clip(aperture);
  ellipse(ctx, -.8, -.2, 5.4, 5.4, mix(look.iris, "#292229", .46));
  ellipse(ctx, -.8, -.2, 4.4, 4.4, look.iris);
  ellipse(ctx, -.8, -.5, 2.4, 2.55, "#27202a");
  ellipse(ctx, -2.35, -2.5, 1.3, 1.3, "#fff7e2");
  ellipse(ctx, 1.3, 1.1, .65, .65, "#e2d9c6");
  ctx.restore();
  line(ctx, eye.lid, mix(look.skin, "#30222a", .83), look.makeup ? 1.95 : 1.4);
  line(ctx, eye.lid + eye.bottom, mix(look.skin, "#43252e", .66), .65);
  if (look.traits.eyes === "hooded") line(ctx, "M-8-3Q0-8 8-4", mix(look.skin, "#613336", .42), .7);
}

function drawFace(ctx: Painter, look: AvatarLook, pose: Pose) {
  const { cheeks, jaw, chin, length } = faces[look.traits.face];
  const mature = look.cheekAge;
  const cheek = cheeks - mature * 2.2;
  const shadow = mix(look.skin, "#663b3b", .37);
  const contour = mix(look.skin, "#41282d", .5);
  const face = new Path2D("M0-3C-26-5-45 10-44 38L-43 60Q-" + cheek + " 82-" + jaw + " 96Q-"
    + chin + " " + length + " 0 " + length + "Q" + chin + " " + length + " " + jaw + " 96Q"
    + cheek + " 82 43 60L44 38C45 10 26-5 0-3Z");

  for (const side of [-1, 1]) {
    ellipse(ctx, side * 43, pose.eyes + 12, 8.1, 12.8, shadow);
    ellipse(ctx, side * 44, pose.eyes + 12.5, 5.3, 8.7, mix(shadow, "#ac6263", .35));
  }
  fill(ctx, face, gradient(ctx, -36, 18, 47, 108, mix(look.skin, "#fff1ce", .28), look.skin, shadow));
  ctx.save();
  ctx.clip(face);
  glow(ctx, -12, 44, 37, "#fff3ce", look.radiance ? .28 : .16);
  glow(ctx, 23, 76, 26, contour, .14 + mature * .18);
  for (const side of [-1, 1]) {
    glow(ctx, side * 29, pose.eyes + 17, 17, "#c25b69", look.makeup ? .57 : look.stage.tier < 2 ? .44 : .31);
  }
  glow(ctx, -7, 97, 17, "#ffebc9", .13);

  const brow = brows[look.traits.brows];
  const browColor = mix(mix(look.hair, "#39252a", .36), "#aba5a5", look.gray * .42);
  for (const side of [-1, 1]) {
    ctx.save();
    ctx.translate(side * 19, pose.eyes);
    ctx.scale(side * pose.eyeSize, pose.eyeSize);
    drawEye(ctx, look);
    ctx.translate(0, look.stage.id === "baby" ? -10 : -13);
    ctx.globalAlpha = look.stage.id === "baby" ? .48 : .96;
    line(ctx, brow.line, browColor, look.stage.tier < 2 ? brow.weight * .62 : brow.weight);
    ctx.restore();
  }

  ctx.save();
  ctx.translate(0, pose.eyes + (pose.mouth - pose.eyes) * .59);
  fill(ctx, "M-2-8Q-2-2-5 1Q-7 5-2 6L3 6Q7 4 5 1Q2-2 2-8Z",
    gradient(ctx, -5, 0, 6, 6, mix(look.skin, "#fff2d1", .19), look.skin, shadow));
  line(ctx, "M-4.2 3.8q1.1-1.3 2.6-.1m3.6.1q1.5-1.4 2.6-.2", contour, .65);
  ctx.restore();

  const mouth = mouths[look.traits.lips];
  ctx.save();
  ctx.translate(0, pose.mouth);
  ctx.scale(look.stage.id === "baby" ? .82 : 1, look.lipVolume);
  const lip = mix(look.skin, look.makeup ? "#b65366" : "#be6971", look.makeup ? .71 : .43);
  fill(ctx, mouth.outline, gradient(ctx, 0, -6, 0, 8, mix(lip, "#63383e", .22), lip, mix(lip, "#f2b0a0", .43)));
  line(ctx, mouth.seam, mix(lip, "#442834", .57), .92);
  ctx.restore();

  if (look.upperLines > 0) {
    ctx.globalAlpha = look.upperLines * .58;
    const y = pose.eyes;
    line(ctx, "M-17 29q16-4 33-1m-25-4q9-2 18-1M30 " + (y + 1)
      + "q5 1 8 4m-9 0 6 4M-30 " + (y + 1) + "q-5 1-8 4m9 0-6 4", contour, .9);
  }
  if (look.lowerLines > 0) {
    ctx.globalAlpha = look.lowerLines * .5;
    line(ctx, "M-27 61q6 3 14 1m26 0q8 2 14-1M-10 77q-7 6-7 12m27-12q7 6 7 12M-9 99q9 4 18 0",
      contour, 1.05);
  }
  ctx.restore();
  ctx.strokeStyle = contour;
  ctx.lineWidth = 1.1;
  ctx.stroke(face);
}

function drawPortrait(ctx: Painter, look: AvatarLook) {
  const pose = poses[look.stage.id];
  const chin = pose.top + faces[look.traits.face].length * pose.y;
  const hair = mix(look.hair, "#c6bbb6", look.gray * .78);
  const shadedHair = mix(hair, "#28242a", .61);
  const litHair = mix(hair, "#f1d1a9", look.gloss ? .38 : .28);
  const style: Haircut = look.stage.id === "baby"
    ? look.traits.hair === "part" ? babyHair.part : babyHair.crop
    : haircuts[look.traits.hair];

  drawBackdrop(ctx);
  ctx.save();
  ctx.translate(90, pose.top);
  ctx.scale(pose.x, pose.y);
  if (style.back) fill(ctx, style.back, gradient(ctx, -38, 2, 39, 124, hair, shadedHair));
  ctx.restore();

  drawClothing(ctx, look, pose, chin);
  ctx.save();
  ctx.translate(90, pose.top);
  ctx.scale(pose.x, pose.y);
  drawFace(ctx, look, pose);
  fill(ctx, style.front, gradient(ctx, -45, -17, 49, 98, litHair, hair, shadedHair));
  line(ctx, style.front, mix(hair, "#2b2128", .68), 1.2);
  for (const strand of style.strands) {
    line(ctx, strand, mix(litHair, "#e3d8cc", look.gray * .68), look.gloss ? 1.4 : 1.05);
  }
  ctx.restore();
}

export function paintAvatar(canvas: HTMLCanvasElement, look: AvatarLook, region: PortraitRegion) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const pose = poses[look.stage.id];
  const eye = pose.top + pose.eyes * pose.y;
  const mouth = pose.top + pose.mouth * pose.y;
  const crops: Record<PortraitRegion, readonly [number, number, number]> = {
    portrait: [0, 0, 180],
    badge: [14, 1, 152],
    face: [12, 9, 156],
    hair: [0, 0, 180],
    eyes: [40, eye - 27, 100],
    brows: [40, eye - 38, 100],
    lips: [56, mouth - 16, 68],
  };
  const [left, top, width] = crops[region];
  const scale = canvas.width / width;
  ctx.resetTransform();
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.setTransform(scale, 0, 0, scale, -left * scale, -top * scale);
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  drawPortrait(ctx, look);
}
