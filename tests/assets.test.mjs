import assert from "node:assert/strict";
import test from "node:test";
import { listingPrice } from "../src/assetCatalog.ts";
import { assetPageData } from "../src/assetMenu.ts";
import { defaultAvatar } from "../src/avatar.ts";
import { choose, decodeSave, doLifeActivity, encodeSave, getChoices, getEstate, newChapterLife, newProfileLife, playYear } from "../src/engine.ts";
import { goods, ownedAssetDetails, resaleValue, transferRecipients } from "../src/lifeAssets.ts";
import { HOME_VALUE, mortgageQuote } from "../src/lifeEconomy.ts";

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
  assert.deepEqual(assetPageData(withLaptop, { kind: "shop", shop: "tech" }).rows.map(row => row.page.good),
    ["camera", "ideapad-slim", "galaxy-a56"]);

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
    ["asset.buy.city-car", "asset.buy.painting"]);
  assert.deepEqual(decodeSave(encodeSave(sold)), sold);
});

test("investments revalue on birthdays and sell for the saved portfolio value", () => {
  const adult = wealthyLife(18);
  assert.deepEqual(assetPageData(adult, { kind: "finances" }).rows.map(row => row.page.kind), ["funds"]);
  const funded = doLifeActivity(adult, "asset.invest.equities");
  const initial = funded.lifeSystems.assets.funds.equities;
  assert.ok(initial.value > 0);
  assert.equal(initial.value, adult.cash - funded.cash);
  assert.equal(getEstate(funded).net, getEstate(adult).net);
  assert.deepEqual(assetPageData(funded, { kind: "investments" }).rows.map(row => row.page.fund), ["equities"]);
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
  assert.equal(assetPageData(restored, { kind: "real-estate" }).note.bg, "Трявна");
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

test("repair, upgrade, pledge, redeem and transfer update the owned vehicle atomically", () => {
  const adult = wealthyLife(18);
  assert.equal(doLifeActivity(adult, "asset.repair.golf-vi"), adult);
  const car = doLifeActivity(adult, "asset.buy.golf-vi");
  const initial = ownedAssetDetails(car, "golf-vi");
  assert.equal(initial.condition, 72);
  const repaired = doLifeActivity(car, "asset.repair.golf-vi");
  assert.equal(ownedAssetDetails(repaired, "golf-vi").condition, 100);
  assert.ok(repaired.cash < car.cash);
  assert.ok(resaleValue(repaired, "golf-vi") > initial.value);
  const upgraded = doLifeActivity(repaired, "asset.upgrade.golf-vi");
  assert.ok(ownedAssetDetails(upgraded, "golf-vi").upgraded);
  assert.ok(resaleValue(upgraded, "golf-vi") > resaleValue(repaired, "golf-vi"));
  assert.equal(doLifeActivity(upgraded, "asset.upgrade.golf-vi"), upgraded);

  const pledged = doLifeActivity(upgraded, "asset.pawn.golf-vi");
  const advance = Math.floor(resaleValue(upgraded, "golf-vi") / 2);
  const { redeemFor } = ownedAssetDetails(pledged, "golf-vi").pledge;
  assert.equal(pledged.cash, upgraded.cash + advance);
  assert.equal(getEstate(pledged).debt, redeemFor);
  assert.ok(ownedAssetDetails(pledged, "golf-vi"));
  assert.equal(doLifeActivity(pledged, "asset.sell.golf-vi"), pledged);
  assert.equal(doLifeActivity(pledged, "asset.transfer.golf-vi.friend"), pledged);
  assert.deepEqual(decodeSave(encodeSave(pledged)), pledged);

  const redeemed = doLifeActivity(pledged, "asset.release.golf-vi");
  assert.equal(redeemed.cash, pledged.cash - redeemFor);
  assert.equal(getEstate(redeemed).debt, 0);
  assert.equal(ownedAssetDetails(redeemed, "golf-vi").pledge, undefined);
  assert.equal(doLifeActivity(redeemed, "asset.transfer.golf-vi.child-999"), redeemed);
  assert.ok(transferRecipients(redeemed, "golf-vi").includes("friend"));
  const given = doLifeActivity(redeemed, "asset.transfer.golf-vi.friend");
  assert.equal(given.cash, redeemed.cash);
  assert.equal(ownedAssetDetails(given, "golf-vi"), undefined);
  assert.deepEqual(given.lifeSystems.assets.transfers.at(-1), { recipient: "friend", item: goods["golf-vi"].title, age: 18 });
  assert.deepEqual(decodeSave(encodeSave(given)), given);
});

test("an unredeemed pledge removes the asset and balance at the deadline", () => {
  const purchased = doLifeActivity(wealthyLife(18), "asset.buy.silver-ring");
  const pledged = doLifeActivity(purchased, "asset.pawn.silver-ring");
  const firstYear = playYear(pledged);
  assert.ok(ownedAssetDetails(firstYear, "silver-ring")?.pledge);
  const expired = playYear(firstYear);
  assert.equal(ownedAssetDetails(expired, "silver-ring"), undefined);
  assert.equal(getEstate(expired).debt, 0);
  assert.equal(expired.history.find(entry => entry.id === "asset.forfeit.silver-ring")?.age, expired.age);
  assert.deepEqual(decodeSave(encodeSave(expired)), expired);
});

test("a catalog mortgage has the quoted principal and an amortizing payment", () => {
  let life = newChapterLife(108);
  for (let age = 16; age <= 23; age++) {
    const choices = getChoices(life);
    life = choose(life, (choices.find(option => option.id === "stay") ?? choices[0]).id);
    if (age < 23) life = playYear(life);
  }
  life = doLifeActivity(life, "bank.open");
  const price = listingPrice(life.city, "studio");
  const quote = mortgageQuote(price);
  const financed = doLifeActivity(life, "asset.realty.mortgage.studio");
  assert.equal(financed.cash, life.cash - quote.downPayment);
  assert.equal(financed.lifeSystems.bank.mortgage, quote.principal);
  assert.equal(financed.lifeSystems.assets.home.paid, price);
  assert.equal(financed.lifeSystems.assets.home.mortgagePayment, quote.installment);
  assert.equal(doLifeActivity(financed, "asset.pawn.home"), financed);
  assert.equal(doLifeActivity(financed, "asset.transfer.home.friend"), financed);
  const next = playYear(financed);
  assert.ok(next.lifeSystems.bank.mortgage < quote.principal);
  assert.deepEqual(decodeSave(encodeSave(next)), next);

  const buyer = wealthyLife(21);
  const home = doLifeActivity(buyer, "asset.realty.cash.brick");
  assert.equal(home.cash, buyer.cash - listingPrice("plovdiv", "brick"));
  const given = doLifeActivity(home, "asset.transfer.home.friend");
  assert.equal(given.lifeSystems.bank.ownsHome, false);
  assert.equal(given.lifeSystems.assets.home, undefined);
  assert.equal(given.lifeSystems.assets.transfers[0].recipient, "friend");
  assert.deepEqual(decodeSave(encodeSave(given)), given);
});
