import assert from "node:assert/strict";
import test from "node:test";
import { avatarPresets, avatarStages, defaultAvatar, defaultMaleAvatar, getAvatarLook, getAvatarName, getAvatarStage, getAvatarTreatments } from "../src/avatar.ts";
import { advance, choose, continueLife, decodeSave, doLifeActivity, encodeSave, getChoices, newChapterLife as newLife } from "../src/engine.ts";
import { personAge, personAvatarTraits, personGender } from "../src/peopleIdentity.ts";
import { deserialize, serialize } from "../src/session.ts";

const custom = {
  ...defaultAvatar, face: "diamond", hair: "slick", eyes: "narrow", brows: "angled", lips: "full",
  skin: "deep", hairColor: "copper", eyeColor: "green",
};

test("people's portraits draw their traits from the character's gender across saves", () => {
  const contacts = { rumi: "female", niki: "male", mentor: "male", friend: "female", appMatch: "male", serviceMatch: "female" };
  const styles = { female: ["bob", "curls", "ponytail", "waves", "bangs", "bun"], male: ["crop", "part", "slick", "buzz"] };
  for (const seed of [0, 108, 0xffffffff]) {
    const life = newLife(seed);
    const restored = decodeSave(encodeSave(life));
    const older = advance(choose(restored, getChoices(restored)[0].id));
    for (const [id, gender] of Object.entries(contacts)) {
      const traits = personAvatarTraits(life, id);
      assert.equal(personGender(life, id), gender);
      assert.equal(traits.presentation, gender);
      assert.ok(styles[gender].includes(traits.hair), id);
      assert.deepEqual(personAvatarTraits(older, id), traits);
      const look = getAvatarLook(traits, personAge(older, id));
      assert.equal(look.traits.presentation, gender);
      if (gender === "male") assert.ok(styles.male.includes(look.traits.hair), id);
    }
  }
});

test("the male avatar retains his identity across age presets and replay", () => {
  const avatar = { ...defaultMaleAvatar, hair: "slick", eyeColor: "green" };
  let life = newLife(108, avatar);
  life = advance(choose(life, getChoices(life)[0].id));
  life = advance(choose(life, getChoices(life)[0].id));
  const restored = decodeSave(encodeSave(life));
  assert.deepEqual(restored, life);
  assert.equal(getAvatarName(restored.avatar).en, "Milen Nikolov");
  for (const stage of avatarStages) {
    const look = getAvatarLook(restored.avatar, stage.previewAge);
    assert.equal(look.traits.presentation, "male");
    assert.equal(look.traits.eyeColor, "green");
  }
  assert.equal(getAvatarLook(restored.avatar, 17).traits.hair, "part");
  assert.equal(getAvatarLook(restored.avatar, 18).traits.hair, "slick");
  const malformed = JSON.parse(encodeSave(life));
  malformed.avatar.presentation = "unknown";
  assert.equal(decodeSave(JSON.stringify(malformed)), null);
});

test("each preset has an age-appropriate variant and each age preserves natural colors", () => {
  for (const stage of avatarStages) {
    assert.equal(getAvatarStage(stage.from).id, stage.id);
    if (stage.from > 0) assert.notEqual(getAvatarStage(stage.from - 1).id, stage.id);
    for (const [part, options] of Object.entries(avatarPresets)) {
      for (const choice of options) {
        const traits = { ...custom, [part]: choice.id };
        const fitted = getAvatarLook(traits, stage.previewAge).traits;
        assert.ok(options.some(option => option.id === fitted[part] && option.tier <= stage.tier));
        if (choice.tier <= stage.tier) assert.equal(fitted[part], choice.id);
        for (const color of ["skin", "hairColor", "eyeColor"]) assert.equal(fitted[color], traits[color]);
        assert.equal(traits[part], choice.id);
      }
    }
  }
  assert.deepEqual(getAvatarLook(custom, 18).traits, custom);
  assert.deepEqual(getAvatarLook(custom, 80).traits, custom);
});

test("a birthday changes the fitted avatar while a save and its album retain the starting traits", () => {
  let teenageLife = newLife(108, custom);
  teenageLife = advance(choose(teenageLife, getChoices(teenageLife)[0].id));
  const adultLife = advance(choose(teenageLife, getChoices(teenageLife)[0].id));

  assert.equal(teenageLife.age, 17);
  assert.equal(getAvatarLook(teenageLife.avatar, teenageLife.age).traits.hair, "part");
  assert.equal(adultLife.age, 18);
  assert.equal(getAvatarLook(adultLife.avatar, adultLife.age).traits.hair, "slick");
  assert.deepEqual(adultLife.avatar, custom);
  assert.deepEqual(deserialize(serialize({ life: adultLife, album: [teenageLife] })), {
    life: continueLife(adultLife), album: [teenageLife],
  });

  const legacy = JSON.parse(encodeSave(adultLife));
  delete legacy.avatar;
  const restored = decodeSave(JSON.stringify(legacy));
  assert.deepEqual(restored, { ...adultLife, avatar: null });
  assert.deepEqual(getAvatarLook(restored.avatar, 18).traits, defaultAvatar);
  assert.equal(decodeSave(JSON.stringify({ ...legacy, avatar: { ...custom, eyes: "unknown" } })), null);
});

test("salon effects respect activity rules, replay and expire without changing the underlying avatar", () => {
  const fresh = newLife(108, custom);
  assert.equal(doLifeActivity(fresh, "aesthetics.hair"), fresh);
  const chosen = choose(fresh, getChoices(fresh)[0].id);
  const treated = doLifeActivity(doLifeActivity(chosen, "aesthetics.hair"), "aesthetics.makeup");
  const restored = decodeSave(encodeSave(treated));
  assert.deepEqual(restored, treated);
  const effects = age => getAvatarTreatments(restored.history, age);
  assert.equal(effects(15).length, 0);
  assert.equal(getAvatarLook(restored.avatar, 16, effects(16)).makeup, true);
  assert.equal(getAvatarLook(restored.avatar, 17, effects(17)).gloss, true);
  assert.equal(getAvatarLook(restored.avatar, 17, effects(17)).makeup, false);
  assert.equal(effects(18).length, 0);

  // The current chapter ends at 26, so test the same treatment rules against an elder portrait directly.
  const visit = id => ({ kind: "action", id: "aesthetics." + id, age: 70 });
  const older = getAvatarLook(custom, 70);
  const adjusted = getAvatarLook(custom, 70, getAvatarTreatments(
    [visit("botox"), visit("facial"), visit("filler"), visit("hair")], 70,
  ));
  assert.deepEqual(adjusted.traits, custom);
  assert.ok(adjusted.gray > 0 && adjusted.gray < older.gray);
  assert.ok(adjusted.upperLines > 0 && adjusted.upperLines < older.upperLines);
  assert.ok(adjusted.lowerLines > 0 && adjusted.lowerLines < older.lowerLines);
  assert.ok(adjusted.lipVolume > older.lipVolume);
  assert.equal(adjusted.stage.id, "elder");
});
