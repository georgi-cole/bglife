import { assetShops, goods, goodIds, houseIds, houseListings, listingPrice, shopIds,
  type AssetShop, type Good, type HouseListing } from "./assetCatalog.ts";
import { cities } from "./cities.ts";
import { annualBudget, type GameState, type Memory, type Text } from "./engine.ts";
import { getLifeActivityDefinition, lifeActivityOption, type LifeActivityOption } from "./lifeActivities.ts";
import { assetPurchase, assetValues, canUpgradeAsset, fundIds, funds, isHomePurchase, ownedAssetDetails, ownedAssets,
  transferRecipients, type Fund, type OwnedAsset } from "./lifeAssets.ts";
import { mortgageQuote, mortgageYear } from "./lifeEconomy.ts";
import { pathBudget } from "./lifePath.ts";
import { personName } from "./peopleIdentity.ts";

const t = (bg: string, en: string): Text => ({ bg, en });

type Menu = "overview" | "finances" | "funds" | "bank" | "investments" | "acquisitions"
  | "property" | "real-estate" | "realtor" | "other" | "spend" | "fund-market";
export type AssetPage = { kind: Menu } | { kind: "collection" | "shop"; shop: AssetShop }
  | { kind: "good"; good: Good; offer: boolean } | { kind: "fund"; fund: Fund; offer?: true }
  | { kind: "house-offer"; listing: HouseListing } | { kind: "recipients"; item: OwnedAsset };

export type AssetIcon = "assets" | "wallet" | "bank" | "trend" | "journal" | "home" | "car" | "laptop"
  | "photo" | "bag" | "ring" | "music" | "sparkle" | "people";
type Field = { label: Text; value: number; change?: boolean };
export type AssetRow = { label: Text; icon: AssetIcon; page: AssetPage; hint?: Text; value?: number };
type AssetPageData = {
  title: Text;
  summary?: Field;
  condition?: number;
  groups?: { title?: Text; fields: Field[] }[];
  rows?: AssetRow[];
  banner?: AssetRow;
  actions?: LifeActivityOption[];
  history?: Memory[];
  note?: Text;
  status?: Text;
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
  spend: t("Харчи кинти", "Go shopping"),
  "fund-market": t("Инвестиционни фондове", "Investment funds"),
};
export const assetTitle = sections.overview;
const shopIcons: Record<AssetShop, AssetIcon> = {
  vehicles: "car", jewelry: "ring", music: "music", luxury: "sparkle", tech: "laptop", art: "photo",
};
const savings = t("Спестявания", "Savings");
const valuation = t("Оценка", "Appraised value");
const priceLabel = t("Цена", "Price");
const paidLabel = t("Платена цена", "Price paid");
const mortgage = t("Остатък по ипотеката", "Mortgage balance");
const annualMortgage = t("Годишна вноска по ипотеката", "Annual mortgage payment");

function menuRow(kind: Menu, icon: AssetIcon, details?: { label?: Text; hint?: Text; value?: number }): AssetRow {
  return { page: { kind }, label: sections[kind], icon, ...details };
}

function goodsRow(shop: AssetShop, offer: boolean): AssetRow {
  return { page: { kind: offer ? "shop" : "collection", shop },
    label: offer ? assetShops[shop].title : assetShops[shop].collection, icon: shopIcons[shop] };
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
  const { pledgedDebt } = assetValues(s);
  if (pledgedDebt) balances.push({ label: t("Дължимо по залози", "Due on pledges"), value: pledgedDebt });

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

function assetOwnedPage(id: OwnedAsset): AssetPage {
  return id === "home" ? { kind: "real-estate" } : { kind: "good", good: id, offer: false };
}

export function assetParent(page: AssetPage): AssetPage | undefined {
  switch (page.kind) {
    case "overview": return undefined;
    case "funds": case "investments": case "acquisitions": return { kind: "finances" };
    case "bank": return { kind: "funds" };
    case "fund": return { kind: page.offer ? "fund-market" : "investments" };
    case "real-estate": return { kind: "property" };
    case "realtor": case "shop": case "fund-market": return { kind: "spend" };
    case "house-offer": return { kind: "realtor" };
    case "collection": return { kind: page.shop === "vehicles" ? "property" : "other" };
    case "good": return { kind: page.offer ? "shop" : "collection", shop: goods[page.good].shop };
    case "recipients": return assetOwnedPage(page.item);
    default: return { kind: "overview" };
  }
}

export function acquiredHome(entry: Memory): boolean {
  return isHomePurchase(entry.id);
}

export function paidDeposit(entry: Memory): boolean {
  return entry.id === "bank.mortgage" || entry.id.startsWith("asset.realty.mortgage.");
}

function currentAcquisitions(s: GameState): Memory[] {
  const purchases = ownedAssets(s).map(id => assetPurchase(s, id));
  const current = new Set(purchases);
  return s.history.filter(entry => current.has(entry)).reverse();
}

function ownershipData(s: GameState, id: OwnedAsset, title: Text): AssetPageData {
  const owned = ownedAssetDetails(s, id);
  if (!owned) return { title, note: t("Няма притежание тук.", "You no longer own this asset.") };
  const isHome = id === "home";
  const debt = isHome ? s.lifeSystems.bank.mortgage : 0;
  const fields: Field[] = [{ label: paidLabel, value: owned.paid }];
  if (debt) fields.push({ label: mortgage, value: debt }, { label: annualMortgage, value: mortgageYear(s).due });

  const { pledge } = owned;
  const status = pledge ? t("Залог · Откупи преди " + pledge.expiresAt + " г.", "Pledged · Redeem before age " + pledge.expiresAt)
    : owned.upgraded ? t("Обновено", "Upgraded") : undefined;
  const ids = pledge ? ["asset.release." + id] : ["asset.repair." + id,
    ...(canUpgradeAsset(id) && !owned.upgraded ? ["asset.upgrade." + id] : []),
    ...(debt ? ["bank.pay-mortgage", "asset.home.payoff"] : ["asset.pawn." + id]),
    isHome ? "asset.home.sell" : "asset.sell." + id];
  return {
    title, summary: { label: valuation, value: owned.value }, condition: owned.condition, status,
    note: isHome ? cities[s.lifeSystems.bank.homeCity ?? "tryavna"].name : goods[id].description,
    groups: [{ fields }], actions: actions(s, ids),
    rows: !pledge && !debt && !s.finished && transferRecipients(s, id).length ? [{
      label: t("Прехвърли на човек", "Transfer to someone"), icon: "people", page: { kind: "recipients", item: id },
    }] : undefined,
  };
}

export function assetPageData(s: GameState, page: AssetPage): AssetPageData {
  const { bank, assets } = s.lifeSystems;
  const ownedGoodIds = goodIds.filter(id => assets.goods[id]);
  switch (page.kind) {
    case "overview":
      return { title: sections.overview, rows: [menuRow("finances", "wallet"), menuRow("property", "home"), menuRow("other", "bag")],
        banner: menuRow("spend", "bag") };
    case "spend":
      return { title: sections.spend, rows: [menuRow("realtor", "home", { hint: cities[s.city].name }),
        ...shopIds.map(shop => goodsRow(shop, true)), menuRow("fund-market", "trend")] };
    case "finances":
      return { title: sections.finances, rows: [
        menuRow("funds", "wallet"),
        ...(fundIds.some(id => assets.funds[id]) ? [menuRow("investments", "trend", { value: assetValues(s).investments })] : []),
        ...(bank.ownsHome || ownedGoodIds.length ? [menuRow("acquisitions", "journal")] : []),
      ] };
    case "funds":
      return { title: sections.funds, groups: walletGroups(s), rows: [menuRow("bank", "bank")] };
    case "bank":
      return { title: sections.bank, summary: bank.accountOpen ? { label: savings, value: bank.balance } : undefined,
        actions: actions(s, [
          bank.accountOpen ? "bank.deposit" : "bank.open",
          ...(bank.accountOpen ? ["bank.withdraw", "bank.loan"] : []),
          ...(bank.loan ? ["bank.pay-loan"] : []),
          ...(bank.mortgage ? ["bank.pay-mortgage"] : []),
        ]) };
    case "investments":
    case "fund-market": {
      const offer = page.kind === "fund-market";
      return {
        title: sections[page.kind],
        rows: fundIds.filter(id => offer || assets.funds[id]).map(id => ({
          label: funds[id].title, icon: "trend", page: { kind: "fund", fund: id, ...(offer && { offer: true }) },
          value: offer ? funds[id].contribution : assets.funds[id]?.value,
          hint: funds[id].description,
        })),
      };
    }
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
          ...(page.offer || holding ? ["asset.invest." + page.fund] : []),
          ...(!page.offer && holding ? ["asset.redeem." + page.fund] : []),
        ]),
      };
    }
    case "acquisitions": {
      const history = currentAcquisitions(s);
      return { title: sections.acquisitions, history, note: history.length ? undefined : t("Още нямаш придобивки.", "You have no acquisitions yet.") };
    }
    case "property": {
      const home = ownedAssetDetails(s, "home");
      const rows = [
        ...(home ? [menuRow("real-estate", "home", { hint: home.title, value: home.value })] : []),
        ...(ownedGoodIds.some(id => goods[id].shop === "vehicles") ? [goodsRow("vehicles", false)] : []),
      ];
      return { title: sections.property, rows, note: rows.length ? undefined : t("Още нямаш жилище или автомобил.", "You don’t own a home or vehicle yet.") };
    }
    case "real-estate":
      return ownershipData(s, "home", ownedAssetDetails(s, "home")?.title ?? sections["real-estate"]);
    case "realtor":
      return { title: sections.realtor, note: cities[s.city].name, rows: houseIds.map(listing => ({
        label: houseListings[listing].title, icon: "home", value: listingPrice(s.city, listing), page: { kind: "house-offer", listing },
      })) };
    case "house-offer": {
      const price = listingPrice(s.city, page.listing);
      const offer = houseListings[page.listing];
      const bought = bank.ownsHome && bank.homeCity === s.city && assets.home?.listing === page.listing;
      const quote = mortgageQuote(price);
      return {
        title: offer.title, condition: offer.condition, note: offer.description,
        summary: { label: priceLabel, value: price },
        groups: bought ? undefined : [{ fields: [
          { label: t("Самоучастие", "Down payment"), value: quote.downPayment },
          { label: annualMortgage, value: quote.installment },
        ] }],
        rows: bought ? [menuRow("real-estate", "home", { label: t("Виж жилището", "View your home") })] : undefined,
        actions: bought ? undefined : actions(s, ["asset.realty.cash." + page.listing, "asset.realty.mortgage." + page.listing]),
      };
    }
    case "other": {
      const rows = shopIds.filter(shop => shop !== "vehicles" && ownedGoodIds.some(id => goods[id].shop === shop))
        .map(shop => goodsRow(shop, false));
      return { title: sections.other, rows, note: rows.length ? undefined : t("Още нямаш вещи.", "You don’t own any items yet.") };
    }
    case "collection":
    case "shop": {
      const shop = assetShops[page.shop];
      const offer = page.kind === "shop";
      const pool = offer ? goodIds.filter(id => !goods[id].legacy && !assets.goods[id]) : ownedGoodIds;
      const items = pool.filter(id => goods[id].shop === page.shop);
      return {
        title: offer ? shop.title : shop.collection,
        rows: items.map(id => ({
          label: goods[id].title, icon: shopIcons[page.shop],
          value: offer ? goods[id].price : ownedAssetDetails(s, id)?.value,
          hint: assets.goods[id]?.pledge ? t("Заложено", "Pledged") : undefined,
          page: { kind: "good", good: id, offer },
        })),
        note: items.length ? undefined : offer ? t("Няма други предложения в момента.", "There are no other offers right now.")
          : t("Още нямаш притежания тук.", "You don’t own anything here yet."),
      };
    }
    case "good": {
      const good = goods[page.good];
      if (!page.offer) return ownershipData(s, page.good, good.title);
      const owned = assets.goods[page.good];
      return {
        title: good.title, note: good.description, condition: good.condition ?? 100,
        summary: { label: priceLabel, value: good.price },
        rows: owned ? [{
          label: t("Виж в притежанията", "View in your belongings"), icon: shopIcons[good.shop], page: assetOwnedPage(page.good),
        }] : undefined,
        actions: owned ? undefined : actions(s, ["asset.buy." + page.good]),
      };
    }
    case "recipients": {
      const item = ownedAssetDetails(s, page.item);
      const recipients = transferRecipients(s, page.item);
      return {
        title: t("На кого?", "Choose a recipient"),
        note: item && (recipients.length ? item.title : t("Няма подходящ получател.", "There is no eligible recipient.")),
        actions: recipients.map(person => ({
          ...actions(s, ["asset.transfer." + page.item + "." + person])[0], label: personName(s, person),
        })),
      };
    }
  }
}
