import { cities } from "./cities.ts";
import { annualBudget, getEstate, type GameState, type Memory, type Text } from "./engine.ts";
import { getLifeActivityDefinition, lifeActivityOption, type LifeActivityOption } from "./lifeActivities.ts";
import { assetShops, fundIds, funds, goodIds, goods, resaleValue, type AssetShop, type Fund, type Good } from "./lifeAssets.ts";
import { HOME_VALUE } from "./lifeEconomy.ts";
import { pathBudget } from "./lifePath.ts";

const t = (bg: string, en: string): Text => ({ bg, en });

type Menu = "overview" | "finances" | "funds" | "bank" | "investments" | "acquisitions"
  | "property" | "real-estate" | "realtor" | "other";
export type AssetPage = { kind: Menu } | { kind: "collection" | "shop"; shop: AssetShop }
  | { kind: "good"; good: Good; offer: boolean } | { kind: "fund"; fund: Fund };

export type AssetIcon = "assets" | "wallet" | "bank" | "trend" | "journal" | "home" | "car" | "laptop" | "photo" | "bag";
type Field = { label: Text; value: number; change?: boolean };
export type AssetRow = { label: Text; icon: AssetIcon; page: AssetPage; hint?: Text; value?: number };
type AssetPageData = {
  title: Text;
  summary?: Field;
  groups?: { title?: Text; fields: Field[] }[];
  rows?: AssetRow[];
  shop?: AssetRow;
  actions?: LifeActivityOption[];
  history?: Memory[];
  note?: Text;
};

const sections = {
  overview: t("Състояние", "Assets"),
  finances: t("Финанси", "Finances"),
  funds: t("Средства", "Funds"),
  bank: t("Банка", "Bank"),
  investments: t("Инвестиции", "Investments"),
  acquisitions: t("Придобивки", "Acquisitions"),
  property: t("Имоти", "Property"),
  "real-estate": t("Недвижими имоти", "Real estate"),
  realtor: t("Агенция за имоти", "Real estate agency"),
  other: t("Други", "Other"),
};
export const assetTitle = sections.overview;
const shopIcons: Record<AssetShop, AssetIcon> = { vehicles: "car", tech: "laptop", art: "photo" };
const inWallet = t("В портфейла", "In your wallet");
const savings = t("Спестявания", "Savings");
const valuation = t("Текуща стойност", "Current value");
const mortgage = t("Остатък по ипотеката", "Mortgage balance");

function menuRow(kind: Menu, icon: AssetIcon, details?: { hint?: Text; value?: number }): AssetRow {
  return { page: { kind }, label: sections[kind], icon, ...details };
}

function collectionRow(shop: AssetShop): AssetRow {
  return { page: { kind: "collection", shop }, label: assetShops[shop].collection, icon: shopIcons[shop] };
}

function actions(s: GameState, ids: readonly string[]): LifeActivityOption[] {
  return ids.map(id => lifeActivityOption(s, getLifeActivityDefinition(id)!));
}

function walletGroups(s: GameState): AssetPageData["groups"] {
  const { bank } = s.lifeSystems;
  const budget = annualBudget(s);
  const path = s.path && pathBudget(s, s.path);
  const balances: Field[] = [];
  if (bank.accountOpen) balances.push({ label: savings, value: bank.balance });
  if (s.deposit) balances.push({ label: t("Депозит за квартира", "Rental deposit"), value: s.deposit });
  if (bank.loan) balances.push({ label: t("Остатък по личния заем", "Personal loan balance"), value: bank.loan });
  if (bank.mortgage) balances.push({ label: mortgage, value: bank.mortgage });

  const incomeParts: Field[] = path ? [
    { label: t("Джобни", "Pocket money"), value: path.pocket },
    { label: t("Нетна заплата", "Take-home pay"), value: path.wage },
    { label: t("Стипендия", "Scholarship"), value: path.scholarship },
    { label: t("Обезщетение за безработица", "Unemployment benefit"), value: path.benefit },
    { label: t("Пенсия", "Pension"), value: path.pension },
    { label: t("Такса за обучение", "Tuition"), value: -path.tuition },
    { label: t("Лични здравни вноски", "Health contributions"), value: -path.health },
  ].filter(field => field.value !== 0) : [];
  const expenses: Field[] = [
    { label: t("Всекидневни разходи", "Living costs"), value: -budget.essentials },
    { label: t("Жилище", "Housing"), value: -budget.housing },
    { label: t("Годишни вноски и грижи", "Yearly payments and care"), value: -budget.obligations },
  ];
  return [
    ...(balances.length ? [{ fields: balances }] : []),
    { title: t("Годишен бюджет", "Annual budget"), fields: [
      { label: t("Доход", "Income"), value: budget.pay },
      ...incomeParts, ...expenses.filter(field => field.value !== 0),
      { label: t("Остатък за годината", "Net for the year"), value: budget.net, change: true },
    ] },
  ];
}

export function assetParent(page: AssetPage): AssetPage | undefined {
  switch (page.kind) {
    case "overview": return undefined;
    case "funds": case "investments": case "acquisitions": return { kind: "finances" };
    case "bank": return { kind: "funds" };
    case "fund": return { kind: "investments" };
    case "real-estate": return { kind: "property" };
    case "realtor": return { kind: "real-estate" };
    case "collection": return { kind: page.shop === "vehicles" ? "property" : "other" };
    case "shop": return { kind: "collection", shop: page.shop };
    case "good": return { kind: page.offer ? "shop" : "collection", shop: goods[page.good].shop };
    default: return { kind: "overview" };
  }
}

export function acquiredHome(entry: Memory): boolean {
  return entry.id === "bank.mortgage" || entry.id === "asset.home.buy";
}

export function assetPageData(s: GameState, page: AssetPage): AssetPageData {
  const { bank, assets } = s.lifeSystems;
  switch (page.kind) {
    case "overview": {
      const estate = getEstate(s);
      return {
        title: sections.overview, summary: { label: t("Нетно състояние", "Net worth"), value: estate.net },
        groups: [{ fields: [
          { label: inWallet, value: s.cash },
          ...(estate.debt ? [{ label: t("Задължения", "Debt"), value: estate.debt }] : []),
        ] }],
        rows: [
          menuRow("finances", "wallet", { hint: t("Средства, инвестиции и придобивки", "Funds, investments and acquisitions") }),
          menuRow("property", "home", { hint: t("Жилища и превозни средства", "Homes and vehicles") }),
          menuRow("other", "bag", { hint: t("Техника и изкуство", "Electronics and art") }),
        ],
      };
    }
    case "finances":
      return { title: sections.finances, rows: [
        menuRow("funds", "wallet", { value: s.cash + bank.balance }),
        menuRow("investments", "trend", { value: getEstate(s).investments }),
        menuRow("acquisitions", "journal"),
      ] };
    case "funds":
      return {
        title: sections.funds, summary: { label: inWallet, value: s.cash }, groups: walletGroups(s),
        rows: [menuRow("bank", "bank")],
      };
    case "bank":
      return {
        title: sections.bank,
        summary: bank.accountOpen ? { label: savings, value: bank.balance } : undefined,
        actions: actions(s, [
          bank.accountOpen ? "bank.deposit" : "bank.open",
          ...(bank.accountOpen ? ["bank.withdraw", "bank.loan"] : []),
          ...(bank.loan ? ["bank.pay-loan"] : []),
          ...(bank.mortgage ? ["bank.pay-mortgage"] : []),
        ]),
      };
    case "investments":
      return {
        title: sections.investments,
        summary: { label: t("Стойност на портфейла", "Portfolio value"), value: getEstate(s).investments },
        rows: fundIds.map(id => ({
          label: funds[id].title, icon: "trend", page: { kind: "fund", fund: id },
          value: assets.funds[id]?.value, hint: funds[id].description,
        })),
      };
    case "fund": {
      const holding = assets.funds[page.fund];
      return {
        title: funds[page.fund].title, note: funds[page.fund].description,
        summary: holding && { label: valuation, value: holding.value },
        groups: holding && [{ fields: [
          { label: t("Вложени средства", "Amount invested"), value: holding.contributed },
          { label: t("Печалба или загуба", "Gain or loss"), value: holding.value - holding.contributed, change: true },
        ] }],
        actions: actions(s, [
          "asset.invest." + page.fund, ...(holding ? ["asset.redeem." + page.fund] : []),
        ]),
      };
    }
    case "acquisitions": {
      const history = s.history.filter(entry => entry.kind === "action" && (acquiredHome(entry) || entry.id.startsWith("asset.buy."))).reverse();
      return { title: sections.acquisitions, history, note: history.length ? undefined : t("Още нямаш покупки.", "You have no purchases yet.") };
    }
    case "property":
      return { title: sections.property, rows: [menuRow("real-estate", "home"), collectionRow("vehicles")] };
    case "real-estate":
      return {
        title: sections["real-estate"],
        summary: bank.ownsHome ? { label: cities[bank.homeCity ?? "tryavna"].name, value: HOME_VALUE } : undefined,
        groups: bank.mortgage ? [{ fields: [
          { label: mortgage, value: bank.mortgage },
          { label: t("Твоят дял", "Your equity"), value: HOME_VALUE - bank.mortgage },
        ] }] : undefined,
        note: bank.ownsHome ? t("Собствено жилище", "Owned home") : t("Още нямаш собствено жилище.", "You don’t own a home yet."),
        shop: bank.ownsHome ? undefined : menuRow("realtor", "bag"),
        actions: bank.ownsHome ? actions(s, [...(bank.mortgage ? ["bank.pay-mortgage"] : []), "asset.home.sell"]) : undefined,
      };
    case "realtor":
      return {
        title: sections.realtor,
        summary: { label: cities[s.city].name, value: HOME_VALUE },
        note: t("Малък апартамент", "Small apartment"),
        actions: actions(s, ["asset.home.buy", "bank.mortgage"]),
      };
    case "other":
      return { title: sections.other, rows: [collectionRow("tech"), collectionRow("art")] };
    case "collection":
    case "shop": {
      const shop = assetShops[page.shop];
      const offer = page.kind === "shop";
      const items = goodIds.filter(id => goods[id].shop === page.shop && Boolean(assets.goods[id]) !== offer);
      return {
        title: offer ? shop.title : shop.collection,
        rows: items.map(id => ({
          label: goods[id].title, icon: shopIcons[page.shop], value: offer ? goods[id].price : resaleValue(s, id),
          page: { kind: "good", good: id, offer },
        })),
        note: items.length ? undefined : offer ? t("Вече притежаваш всичко от този магазин.", "You already own everything in this store.")
          : t("Още нямаш притежания тук.", "You don’t own anything here yet."),
        shop: offer ? undefined : { label: shop.title, icon: "bag", page: { kind: "shop", shop: page.shop } },
      };
    }
    case "good": {
      const good = goods[page.good];
      const owned = assets.goods[page.good];
      return {
        title: good.title, note: good.description,
        summary: page.offer && !owned ? { label: t("Цена", "Price"), value: good.price }
          : owned ? { label: valuation, value: resaleValue(s, page.good) } : undefined,
        groups: owned && [{ fields: [{ label: t("Платена цена", "Price paid"), value: owned.paid }] }],
        rows: page.offer && owned ? [{
          label: t("Виж в притежанията", "View in your belongings"),
          icon: shopIcons[good.shop], page: { ...page, offer: false },
        }] : undefined,
        actions: page.offer && !owned ? actions(s, ["asset.buy." + page.good])
          : !page.offer && owned ? actions(s, ["asset.sell." + page.good]) : undefined,
      };
    }
  }
}
