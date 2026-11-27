import type { GameState, Text } from "./engine.ts";
import type { LifeActivityDefinition, LifeSystems } from "./lifeActivities.ts";
import { lifeDraw } from "./mortality.ts";

const t = (bg: string, en: string): Text => ({ bg, en });

export const assetShops = {
  vehicles: { title: t("Автокъща", "Car dealership"), collection: t("Движимо имущество", "Vehicles"), minAge: 18 },
  tech: { title: t("Магазин за техника", "Electronics store"), collection: t("Техника", "Electronics"), minAge: 14 },
  art: { title: t("Галерия", "Art gallery"), collection: t("Изкуство", "Art"), minAge: 16 },
};
export type AssetShop = keyof typeof assetShops;

export const goods = {
  "city-car": {
    shop: "vehicles", title: t("Градски автомобил", "City car"), price: 360_000, resale: 0.85, yearlyLoss: 0.10,
    description: t("Малък автомобил втора употреба.", "A small second-hand car."),
  },
  "family-car": {
    shop: "vehicles", title: t("Семеен автомобил", "Family car"), price: 840_000, resale: 0.85, yearlyLoss: 0.10,
    description: t("Употребявано комби с повече място за багаж.", "A used estate car with extra luggage space."),
  },
  laptop: {
    shop: "tech", title: t("Лаптоп", "Laptop"), price: 69_000, resale: 0.75, yearlyLoss: 0.18,
    description: t("Лек лаптоп за учене и работа.", "A light laptop for study and work."),
  },
  camera: {
    shop: "tech", title: t("Фотоапарат", "Camera"), price: 48_000, resale: 0.80, yearlyLoss: 0.12,
    description: t("Компактен цифров фотоапарат.", "A compact digital camera."),
  },
  painting: {
    shop: "art", title: t("Картина „Родопска утрин“", "Painting · Rhodope Morning"), price: 16_000, resale: 0.90, yearlyLoss: 0,
    description: t("Малък пейзаж с маслени бои от местен художник.", "A small oil landscape by a local artist."),
  },
  ceramics: {
    shop: "art", title: t("Керамична ваза", "Ceramic vase"), price: 9_500, resale: 0.80, yearlyLoss: 0,
    description: t("Ръчно изработена ваза с троянска шарка.", "A handmade vase with a Troyan pattern."),
  },
} satisfies Record<string, {
  shop: AssetShop; title: Text; description: Text; price: number; resale: number; yearlyLoss: number;
}>;
export type Good = keyof typeof goods;
export const goodIds = Object.keys(goods) as Good[];

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
export type LifeAssets = {
  goods: Partial<Record<Good, { purchasedAt: number; paid: number }>>;
  funds: Partial<Record<Fund, Holding>>;
};

export function resaleValue(s: GameState, id: Good): number {
  const purchase = s.lifeSystems.assets.goods[id];
  if (!purchase) return 0;
  const { resale, yearlyLoss } = goods[id];
  const age = s.age - purchase.purchasedAt;
  return Math.round(purchase.paid * Math.max(0.2, resale * (1 - yearlyLoss) ** age));
}

export function assetValues(s: GameState) {
  const belongings = goodIds.reduce((sum, id) => sum + resaleValue(s, id), 0);
  const investments = fundIds.reduce((sum, id) => sum + (s.lifeSystems.assets.funds[id]?.value ?? 0), 0);
  return { belongings, investments };
}

export function revalueInvestments(s: GameState): LifeAssets {
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

function goodActions(id: Good): LifeActivityDefinition[] {
  const good = goods[id];
  const minAge = assetShops[good.shop].minAge;
  return [
    {
      id: "asset.buy." + id, category: "assets", minAge, cost: good.price,
      label: t("Купи", "Buy"), historyTitle: good.title, description: good.description,
      result: t("Добави покупката към притежанията си.", "You added the purchase to your belongings."),
      requires: s => s.lifeSystems.assets.goods[id] ? t("Вече го притежаваш.", "You already own this.") : null,
      update: s => setAssets(s, {
        goods: { ...s.lifeSystems.assets.goods, [id]: { purchasedAt: s.age, paid: good.price } },
      }),
    },
    {
      id: "asset.sell." + id, category: "assets", minAge,
      label: t("Продай", "Sell"), historyTitle: t("Продажба · " + good.title.bg, "Sold · " + good.title.en),
      description: t("Сумата от продажбата влиза в портфейла.", "The sale proceeds go into your wallet."),
      result: t("Получи сумата от продажбата.", "You received the sale proceeds."),
      requires: s => s.lifeSystems.assets.goods[id] ? null : t("Вече не е твое.", "You no longer own this."),
      walletDelta: s => resaleValue(s, id),
      update: s => {
        const owned = { ...s.lifeSystems.assets.goods };
        delete owned[id];
        return setAssets(s, { goods: owned });
      },
    },
  ];
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

export const assetActivities = [...goodIds.flatMap(goodActions), ...fundIds.flatMap(fundActions)];
