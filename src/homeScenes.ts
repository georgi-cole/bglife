import staraPlanina from "../public/art/home-stara-planina.webp";
import dunav from "../public/art/home-dunav.webp";
import trakiya from "../public/art/home-trakiya.webp";
import pirin from "../public/art/home-pirin.webp";
import asparuh from "../public/art/home-asparuh.webp";

const scenes = [
  { id: "stara-planina", art: staraPlanina, bg: "Горда Стара планина", en: "Proud Balkan Mountains" },
  { id: "dunav", art: dunav, bg: "До ней Дунава синей", en: "Beside it, the Danube runs blue" },
  { id: "trakiya", art: trakiya, bg: "Слънце Тракия огрява", en: "Sunlight bathes Thrace" },
  { id: "pirin", art: pirin, bg: "Над Пирина пламеней", en: "It glows above Pirin" },
  { id: "asparuh", art: asparuh, bg: "Хан Аспарух", en: "Khan Asparuh" },
] as const;

const SCENE_KEY = "bglife:home-scene";
type HomeScene = typeof scenes[number];

export function pickHomeScene(): HomeScene {
  let previous: string | null = null;
  try {
    previous = localStorage.getItem(SCENE_KEY);
  } catch {
    // A blocked store still allows a random scene on each visit.
  }
  const options = scenes.filter(scene => scene.id !== previous);
  return options[Math.floor(Math.random() * options.length)];
}

export function rememberHomeScene(scene: HomeScene) {
  try {
    localStorage.setItem(SCENE_KEY, scene.id);
  } catch {
    // Scene memory is optional.
  }
}
