import { assetShops, goods, goodIds, HOME_VALUE, houseListings, type Good, type HouseListing } from "./assetCatalog.ts";
import { isKin } from "./birthFamily.ts";
import type { GameState, Memory, Text } from "./engine.ts";
import type { LifeActivityDefinition, LifeSystems } from "./lifeActivities.ts";
import { lifeDraw } from "./mortality.ts";
import { isContactId, isKnownPerson, personAge, personName, storyPeople, type PeopleId } from "./peopleIdentity.ts";

const t = (bg: string, en: string): Text => ({ bg, en });
export { assetShops, goods, goodIds, type AssetShop, type Good } from "./assetCatalog.ts";

export const funds = {
  bonds: {
    title: t("Облигационен фонд", "Bond fund"), contribution: 20_000, low: -3, high: 7, stream: 0xc0d6b403,
    description: t("По-малки колебания при годишната преоценка.", "Smaller swings at the yearly revaluation."),
  },
  equities: {
    title: t("Фонд от акции", "Equity fund"), contribution: 50_000, low: -18, high: 23, stream: 0xa1965e21,
    description: t("По-големи колебания при годишната преоценка.", "Larger swings at the yearly revaluation."),
  },
};
export type Fund = keyof typeof funds;
export const fundIds = Object.keys(funds) as Fund[];

type Holding = { contributed: number; value: number };
type Pledge = { redeemFor: number; expiresAt: number };
type ItemHolding = {
  purchasedAt: number;
  paid: number;
  servicedAt?: number;
  upgraded?: true;
  pledge?: Pledge;
};
type HomeHolding = ItemHolding & { listing?: HouseListing; mortgagePayment?: number };
export type OwnedAsset = Good | "home";
export type LifeAssets = {
  goods: Partial<Record<Good, ItemHolding>>;
  funds: Partial<Record<Fund, Holding>>;
  home?: HomeHolding;
  transfers?: { recipient: PeopleId; item: Text; age: number }[];
};

export const isHomePurchase = (id: string) => id === "bank.mortgage" || id === "asset.home.buy"
  || id.startsWith("asset.realty.");

export function assetPurchase(s: GameState, id: OwnedAsset): Memory | undefined {
  for (let i = s.history.length - 1; i >= 0; i--) {
    const entry = s.history[i];
    if (entry.kind === "action" && (id === "home" ? isHomePurchase(entry.id) : entry.id === "asset.buy." + id)) return entry;
  }
}

export function ownedAssets(s: GameState): OwnedAsset[] {
  return [...(s.lifeSystems.bank.ownsHome ? ["home" as const] : []),
    ...goodIds.filter(id => s.lifeSystems.assets.goods[id])];
}

const houseDefaults = { title: t("Собствено жилище", "Owned home"), condition: 85 };

function itemTitle(s: GameState, id: OwnedAsset): Text {
  if (id !== "home") return goods[id].title;
  const listing = s.lifeSystems.assets.home?.listing;
  return listing ? houseListings[listing].title : houseDefaults.title;
}

function itemHolding(s: GameState, id: OwnedAsset): ItemHolding | undefined {
  if (id !== "home") return s.lifeSystems.assets.goods[id];
  if (!s.lifeSystems.bank.ownsHome) return;
  return s.lifeSystems.assets.home ?? {
    paid: HOME_VALUE,
    purchasedAt: assetPurchase(s, "home")?.age ?? s.age,
  };
}

export function ownedAssetDetails(s: GameState, id: OwnedAsset) {
  const item = itemHolding(s, id);
  if (!item) return;
  const listing = s.lifeSystems.assets.home?.listing;
  const product = id === "home" ? (listing ? houseListings[listing] : houseDefaults) : goods[id];
  const wear = id === "home" ? 3 : assetShops[goods[id].shop].wear;
  const years = s.age - item.purchasedAt;
  const initial = product.condition ?? 100;
  const unserviced = Math.max(20, initial - wear * years);
  const condition = item.servicedAt === undefined ? unserviced : Math.max(20, 100 - wear * (s.age - item.servicedAt));
  let estimated = item.paid;
  if (id !== "home") {
    const { resale, yearlyLoss } = goods[id];
    estimated = item.paid * Math.max(0.2, resale * (1 - yearlyLoss) ** years);
  } else if (listing) {
    estimated *= .9 + unserviced / 1000;
  }
  estimated += item.paid * ((condition - unserviced) / 400 + (item.upgraded ? .07 : 0));
  return { ...item, title: product.title, condition, value: Math.round(estimated) };
}

export function resaleValue(s: GameState, id: OwnedAsset): number {
  return ownedAssetDetails(s, id)?.value ?? 0;
}

export function assetValues(s: GameState) {
  let belongings = 0;
  let pledgedDebt = 0;
  let homeValue = 0;
  for (const id of ownedAssets(s)) {
    const item = ownedAssetDetails(s, id)!;
    if (id === "home") homeValue = item.value;
    else belongings += item.value;
    pledgedDebt += item.pledge?.redeemFor ?? 0;
  }
  const investments = fundIds.reduce((sum, id) => sum + (s.lifeSystems.assets.funds[id]?.value ?? 0), 0);
  return { homeValue, belongings, investments, pledgedDebt };
}

function revalueInvestments(s: GameState): LifeAssets {
  const assets = s.lifeSystems.assets;
  if (Object.keys(assets.funds).length === 0) return assets;
  const holdings: LifeAssets["funds"] = {};
  for (const id of fundIds) {
    const holding = assets.funds[id];
    if (!holding) continue;
    const fund = funds[id];
    const rate = fund.low + Math.floor(lifeDraw(s.seed, s.age, fund.stream) * (fund.high - fund.low + 1));
    holdings[id] = { ...holding, value: Math.round(holding.value * (1 + rate / 100)) };
  }
  return { ...assets, funds: holdings };
}

function setAssets(s: GameState, update: Partial<LifeAssets>): LifeSystems {
  return { ...s.lifeSystems, assets: { ...s.lifeSystems.assets, ...update } };
}

function saveItem(s: GameState, id: OwnedAsset, item: ItemHolding): LifeSystems {
  return id === "home" ? setAssets(s, { home: { ...s.lifeSystems.assets.home, ...item } })
    : setAssets(s, { goods: { ...s.lifeSystems.assets.goods, [id]: item } });
}

function removeItem(systems: LifeSystems, id: OwnedAsset): LifeSystems {
  if (id === "home") {
    const { home, ...assets } = systems.assets;
    return { ...systems, assets, bank: { ...systems.bank, ownsHome: false, mortgage: 0, homeCity: undefined } };
  }
  const owned = { ...systems.assets.goods };
  delete owned[id];
  return { ...systems, assets: { ...systems.assets, goods: owned } };
}

export function settleAssets(s: GameState, systems: LifeSystems, finished: boolean) {
  let lifeSystems = { ...systems, assets: revalueInvestments(s) };
  const events: Memory[] = [];
  if (finished) return { lifeSystems, events };
  for (const id of ownedAssets(s)) {
    const item = itemHolding(s, id);
    if (!item?.pledge || item.pledge.expiresAt > s.age + 1) continue;
    const title = itemTitle(s, id);
    events.push({
      id: "asset.forfeit." + id, kind: "event", age: s.age + 1, city: s.city, witnesses: [], cashDelta: 0,
      title: t("Изтекъл залог", "Pledge expired"),
      text: t("Срокът за откупуване изтече. Загуби „" + title.bg + "“.", "The redemption deadline passed. You lost " + title.en + "."),
    });
    lifeSystems = removeItem(lifeSystems, id);
  }
  return { lifeSystems, events };
}

function buyGood(id: Good): LifeActivityDefinition {
  const good = goods[id];
  return {
    id: "asset.buy." + id, category: "assets", minAge: assetShops[good.shop].minAge, cost: good.price,
    label: t("Купи", "Buy"), historyTitle: good.title, description: good.description,
    result: t("Добави покупката към притежанията си.", "You added the purchase to your belongings."),
    requires: s => s.lifeSystems.assets.goods[id] ? t("Вече го притежаваш.", "You already own this.") : null,
    update: s => saveItem(s, id, { purchasedAt: s.age, paid: good.price }),
  };
}

function assetBlocker(s: GameState, id: OwnedAsset): Text | null {
  const item = itemHolding(s, id);
  if (!item) return t("Вече не го притежаваш.", "You no longer own this.");
  return item.pledge ? t("Първо откупи залога.", "Redeem the pledge first.") : null;
}

function freeTitleBlocker(s: GameState, id: OwnedAsset): Text | null {
  return assetBlocker(s, id) ?? (id === "home" && s.lifeSystems.bank.mortgage > 0
    ? t("Първо изплати ипотеката.", "Pay off the mortgage first.") : null);
}

function usesRegistration(id: OwnedAsset) {
  return id === "home" || goods[id].shop === "vehicles";
}

function ownerAge(id: OwnedAsset) {
  return id === "home" ? 18 : assetShops[goods[id].shop].minAge;
}

function repairLabel(id: OwnedAsset): Text {
  if (id !== "home") {
    switch (goods[id].shop) {
      case "art": return t("Реставрирай", "Restore");
      case "jewelry": return t("Почисти и полирай", "Clean and polish");
      case "luxury": return t("Сервизирай", "Service");
    }
  }
  return t("Ремонтирай", "Repair");
}

export function canUpgradeAsset(id: OwnedAsset) {
  return id === "home" || goods[id].shop === "vehicles" || goods[id].shop === "tech" || goods[id].shop === "music";
}

function serviceCost(s: GameState, id: OwnedAsset): number {
  const item = ownedAssetDetails(s, id);
  return item ? Math.round(item.paid * (100 - item.condition) / 240) : 0;
}

function manageAsset(id: OwnedAsset): LifeActivityDefinition[] {
  const common = { category: "assets" as const, minAge: ownerAge(id) };
  const home = id === "home";
  const title = home ? houseDefaults.title : goods[id].title;
  const upgradeDescription = t("Еднократно подобрение, което повишава оценката.", "A one-time improvement that increases the appraised value.");
  return [
    {
      ...common, id: home ? "asset.home.sell" : "asset.sell." + id,
      label: home ? t("Продай жилището", "Sell the home") : t("Продай", "Sell"),
      historyTitle: home ? undefined : t("Продажба · " + title.bg, "Sold · " + title.en),
      description: home ? t("При продажбата се погасява остатъкът по ипотеката.", "The remaining mortgage is settled on sale.")
        : t("Сумата от продажбата влиза в портфейла.", "The sale proceeds go into your wallet."),
      result: home ? t("Продаде жилището и уреди плащането.", "You sold the home and settled the payment.")
        : t("Получи сумата от продажбата.", "You received the sale proceeds."),
      requires: s => assetBlocker(s, id),
      walletDelta: s => resaleValue(s, id) - (home ? s.lifeSystems.bank.mortgage : 0),
      update: s => removeItem(s.lifeSystems, id),
    },
    {
      ...common, id: "asset.pawn." + id, minAge: 18,
      label: home ? t("Заложи жилището", "Pledge the home") : t("Заложи", "Pawn"),
      historyTitle: t("Залог · " + title.bg, "Pledged · " + title.en),
      description: t("Получаваш 50% от оценката. За да си го върнеш, плати сумата плюс 10% преди да минат две години.",
        "Receive 50% of the appraised value. Redeem it before two years pass by repaying the advance plus 10%."),
      result: t("Получената сума влезе в портфейла. Срокът за откупуване е в притежанието.", "The advance went into your wallet. The redemption deadline is on the asset."),
      requires: s => freeTitleBlocker(s, id),
      walletDelta: s => Math.floor(resaleValue(s, id) / 2),
      update: s => {
        const item = itemHolding(s, id)!;
        const advance = Math.floor(resaleValue(s, id) / 2);
        return saveItem(s, id, { ...item, pledge: { redeemFor: Math.ceil(advance * 11 / 10), expiresAt: s.age + 2 } });
      },
    },
    {
      ...common, id: "asset.release." + id, minAge: 18,
      label: t("Откупи", "Redeem"),
      historyTitle: t("Откупуване · " + title.bg, "Redeemed · " + title.en),
      description: t("Плащаш дължимото и отново можеш да ползваш вещта.", "Pay the balance to regain use of the asset."),
      result: t("Погаси залога.", "You redeemed the pledge."),
      requires: s => itemHolding(s, id)?.pledge ? null : t("Няма активен залог.", "There is no active pledge."),
      walletDelta: s => -(itemHolding(s, id)?.pledge?.redeemFor ?? 0),
      update: s => saveItem(s, id, { ...itemHolding(s, id)!, pledge: undefined }),
    },
    {
      ...common, id: "asset.repair." + id,
      label: repairLabel(id),
      historyTitle: t("Поддръжка · " + title.bg, "Serviced · " + title.en),
      description: t("Връщаш състоянието на 100% и повишаваш текущата оценка.", "Restore condition to 100% and improve the appraised value."),
      result: t("Състоянието вече е 100%.", "Condition is now 100%."),
      requires: s => assetBlocker(s, id) ?? (ownedAssetDetails(s, id)?.condition === 100
        ? t("В отлично състояние е.", "It’s in excellent condition.") : null),
      walletDelta: s => -serviceCost(s, id),
      update: s => saveItem(s, id, { ...itemHolding(s, id)!, servicedAt: s.age }),
    },
    ...(canUpgradeAsset(id) ? [{
      ...common, id: "asset.upgrade." + id, label: t("Обнови", "Upgrade"), description: upgradeDescription,
      historyTitle: t("Подобрение · " + title.bg, "Upgraded · " + title.en),
      result: t("Подобрението повиши оценката.", "The upgrade increased the appraised value."),
      requires: (s: GameState) => assetBlocker(s, id) ?? (itemHolding(s, id)?.upgraded
        ? t("Вече е обновено.", "It’s already upgraded.") : null),
      walletDelta: (s: GameState) => -Math.round((itemHolding(s, id)?.paid ?? 0) * .12),
      update: (s: GameState) => saveItem(s, id, { ...itemHolding(s, id)!, upgraded: true }),
    }] : []),
  ];
}

export function transferRecipients(s: GameState, id: OwnedAsset): PeopleId[] {
  if (freeTitleBlocker(s, id)) return [];
  const { partner, childProfiles } = s.lifeSystems.family;
  const contacts = new Set<PeopleId>([
    ...(partner ? [partner] : []),
    ...childProfiles.map((_, index) => `child-${index}` as const),
    ...(s.birthFamily?.relatives.map(relative => relative.id) ?? []),
    ...storyPeople,
  ]);
  return [...contacts].filter(contact => isKnownPerson(s, contact) && !s.deceased[contact]
    && (!usesRegistration(id) || (personAge(s, contact) ?? 0) >= 18));
}

export function assetTransferDefinition(id: string): LifeActivityDefinition | undefined {
  const parts = id.split(".");
  const [scope, action, asset, recipient] = parts;
  if (scope !== "asset" || action !== "transfer" || parts.length !== 4) return;
  if (asset !== "home" && !Object.hasOwn(goods, asset)) return;
  if (!isKin(recipient) && !isContactId(recipient)) return;
  const owned = asset as OwnedAsset;
  return {
    id, category: "assets", minAge: ownerAge(owned), label: t("Прехвърли", "Transfer"),
    historyTitle: t("Прехвърляне на имущество", "Asset transfer"),
    description: t("Собствеността минава на този човек.", "Ownership passes to this person."),
    result: t("Прехвърли собствеността.", "You transferred ownership."),
    requires: s => freeTitleBlocker(s, owned) ?? (transferRecipients(s, owned).includes(recipient)
      ? null : t("Този човек не може да получи вещта.", "This person can’t receive the asset.")),
    resolve: s => {
      const item = itemTitle(s, owned);
      const person = personName(s, recipient);
      const systems = removeItem(s.lifeSystems, owned);
      const transfers = [...(systems.assets.transfers ?? []), { recipient, item, age: s.age }];
      return {
        result: t("Прехвърли „" + item.bg + "“ на " + person.bg + ".", "You transferred " + item.en + " to " + person.en + "."),
        lifeSystems: { ...systems, assets: { ...systems.assets, transfers } },
      };
    },
  };
}

function fundActions(id: Fund): LifeActivityDefinition[] {
  const fund = funds[id];
  return [
    {
      id: "asset.invest." + id, category: "assets", minAge: 18, cost: fund.contribution,
      label: t("Вложи", "Invest"), historyTitle: t("Инвестиция · " + fund.title.bg, "Invested · " + fund.title.en),
      description: fund.description,
      result: t("Прехвърли сумата от портфейла във фонда.", "You transferred the amount from your wallet into the fund."),
      update: s => {
        const holding = s.lifeSystems.assets.funds[id];
        return setAssets(s, {
          funds: {
            ...s.lifeSystems.assets.funds,
            [id]: { contributed: (holding?.contributed ?? 0) + fund.contribution, value: (holding?.value ?? 0) + fund.contribution },
          },
        });
      },
    },
    {
      id: "asset.redeem." + id, category: "assets", minAge: 18,
      label: t("Продай всички дялове", "Sell all holdings"),
      historyTitle: t("Продажба · " + fund.title.bg, "Sold · " + fund.title.en),
      description: t("Текущата стойност се прехвърля в портфейла.", "The current value moves into your wallet."),
      result: t("Продаде всички дялове в този фонд.", "You sold all of your holdings in this fund."),
      requires: s => s.lifeSystems.assets.funds[id] ? null : t("Нямаш дялове в този фонд.", "You have no holdings in this fund."),
      walletDelta: s => s.lifeSystems.assets.funds[id]?.value ?? 0,
      update: s => {
        const holdings = { ...s.lifeSystems.assets.funds };
        delete holdings[id];
        return setAssets(s, { funds: holdings });
      },
    },
  ];
}

export const assetActivities = [...goodIds.map(buyGood), ...["home" as const, ...goodIds].flatMap(manageAsset), ...fundIds.flatMap(fundActions)];
