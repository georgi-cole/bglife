import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
import { defaultMaleAvatar } from "../../src/avatar.ts";
import { newProfileLife, playYear, startCareerLife } from "../../src/engine.ts";
import { serialize } from "../../src/session.ts";

const output = process.argv[2];
if (!output) throw new Error("Provide the path for the web backup");

let life = startCareerLife(newProfileLife({
  seed: 314,
  city: "varna",
  presentation: "male",
  avatar: defaultMaleAvatar,
  profile: { name: "Nikolay Iliev", talent: "music", vip: false, wealthy: false, disposition: null },
}));
for (let age = 0; age < 3; age++) life = playYear(life);
assert.equal(life.age, 3);
await writeFile(output, serialize({ life, album: [] }));
