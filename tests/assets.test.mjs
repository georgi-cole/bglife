import assert from "node:assert/strict";
import test from "node:test";
import { assetPageData } from "../src/assetMenu.ts";
import { defaultAvatar } from "../src/avatar.ts";
import { choose, decodeSave, doLifeActivity, encodeSave, getChoices, getEstate, newChapterLife, newProfileLife, playYear } from "../src/engine.ts";
import { goods, resaleValue } from "../src/lifeAssets.ts";
import { HOME_VALUE } from "../src/lifeEconomy.ts";

function wealthyLife(age) {
  let life = newProfileLife({ seed: 108, city: "plovdiv", presentation: "female", avatar: defaultAvatar,
    profile: { name: "Лора Иванова", talent: "none", vip: true, wealthy: true, disposition: null } });
  for (let year = 0; year < age; year++) life = playYear(life);
  assert.equal(life.age, age);
  return life;
}

test("purchases move between shop, possessions and the journal with a single wallet charge", () => {
  const child = wealthyLife(13);
  assert.equal(doLifeActivity(child, "asset.buy.laptop"), child);
  const adult = wealthyLife(18);
  const withLaptop = doLifeActivity(adult, "asset.buy.laptop");
  assert.equal(withLaptop.cash, adult.cash - goods.laptop.price);
  assert.equal(doLifeActivity(withLaptop, "asset.buy.laptop"), withLaptop);
  const tech = assetPageData(withLaptop, { kind: "collection", shop: "tech" });
  assert.deepEqual(tech.rows.map(row => row.page.good), ["laptop"]);
  assert.deepEqual(assetPageData(withLaptop, { kind: "shop", shop: "tech" }).rows.map(row => row.page.good), ["camera"]);

  const withPainting = doLifeActivity(withLaptop, "asset.buy.painting");
  const withCar = doLifeActivity(withPainting, "asset.buy.city-car");
  assert.equal(withCar.cash, adult.cash - goods.laptop.price - goods.painting.price - goods["city-car"].price);
  const yearLater = playYear(withCar);
  assert.ok(resaleValue(yearLater, "laptop") < resaleValue(withCar, "laptop"));
  const sold = doLifeActivity(yearLater, "asset.sell.laptop");
  assert.equal(sold.cash, yearLater.cash + resaleValue(yearLater, "laptop"));
  assert.equal(sold.lifeSystems.assets.goods.laptop, undefined);
  assert.equal(getEstate(sold).belongings, resaleValue(sold, "city-car") + resaleValue(sold, "painting"));
  assert.deepEqual(assetPageData(sold, { kind: "acquisitions" }).history.map(entry => entry.id),
    ["asset.buy.city-car", "asset.buy.painting", "asset.buy.laptop"]);
  assert.deepEqual(decodeSave(encodeSave(sold)), sold);
});

test("investments revalue on birthdays and sell for the saved portfolio value", () => {
  const adult = wealthyLife(18);
  const funded = doLifeActivity(adult, "asset.invest.equities");
  const initial = funded.lifeSystems.assets.funds.equities;
  assert.ok(initial.value > 0);
  assert.equal(initial.value, adult.cash - funded.cash);
  assert.equal(getEstate(funded).net, getEstate(adult).net);
  const yearLater = playYear(funded);
  const value = yearLater.lifeSystems.assets.funds.equities.value;
  assert.notEqual(value, initial.value);
  assert.deepEqual(decodeSave(encodeSave(yearLater)), yearLater);
  const sold = doLifeActivity(yearLater, "asset.redeem.equities");
  assert.equal(sold.cash, yearLater.cash + value);
  assert.equal(getEstate(sold).investments, 0);
  assert.deepEqual(decodeSave(encodeSave(sold)), sold);
});

test("the original mortgage appears in property and selling it pays off its balance", () => {
  let life = newChapterLife(108);
  while (life.age < 21) {
    const choices = getChoices(life);
    life = playYear(choose(life, (choices.find(option => option.id === "stay") ?? choices[0]).id));
  }
  life = doLifeActivity(choose(life, getChoices(life)[0].id), "bank.open");
  const legacy = doLifeActivity(life, "bank.mortgage");
  assert.equal(legacy.lifeSystems.bank.ownsHome, true);
  assert.equal(JSON.parse(encodeSave(legacy)).version, 1);
  const restored = decodeSave(encodeSave(legacy));
  assert.deepEqual(restored, legacy);
  assert.equal(assetPageData(restored, { kind: "real-estate" }).summary.label.bg, "Трявна");
  assert.equal(assetPageData(restored, { kind: "acquisitions" }).history[0].id, "bank.mortgage");
  assert.equal(doLifeActivity(restored, "asset.home.buy"), restored);
  const sold = doLifeActivity(restored, "asset.home.sell");
  assert.equal(sold.lifeSystems.bank.ownsHome, false);
  assert.equal(sold.lifeSystems.bank.mortgage, 0);
  assert.equal(sold.cash, restored.cash + HOME_VALUE - restored.lifeSystems.bank.mortgage);
  assert.deepEqual(decodeSave(encodeSave(sold)), sold);

  const adult = wealthyLife(18);
  const paid = doLifeActivity(adult, "asset.home.buy");
  assert.equal(paid.cash, adult.cash - HOME_VALUE);
  assert.equal(paid.lifeSystems.bank.homeCity, "plovdiv");
  assert.equal(paid.lifeSystems.bank.mortgage, 0);
  assert.deepEqual(decodeSave(encodeSave(paid)), paid);
});
