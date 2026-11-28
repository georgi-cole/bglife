import type { City, Text } from "./engine.ts";

const t = (bg: string, en: string): Text => ({ bg, en });

export const assetShops = {
  vehicles: { title: t("Автокъща", "Car dealership"), collection: t("Движимо имущество", "Vehicles"), minAge: 18, wear: 6 },
  jewelry: { title: t("Бижутерски магазин", "Jewelry store"), collection: t("Бижута", "Jewelry"), minAge: 14, wear: 1 },
  music: { title: t("Музикален магазин", "Music store"), collection: t("Музикални инструменти", "Musical instruments"), minAge: 12, wear: 3 },
  luxury: { title: t("Луксозни стоки", "Luxury goods"), collection: t("Луксозни вещи", "Luxury items"), minAge: 16, wear: 2 },
  tech: { title: t("Магазин за техника", "Electronics store"), collection: t("Техника", "Electronics"), minAge: 14, wear: 7 },
  art: { title: t("Галерия и занаяти", "Gallery and crafts"), collection: t("Изкуство и занаяти", "Art and crafts"), minAge: 16, wear: 2 },
};
export type AssetShop = keyof typeof assetShops;
export const shopIds = Object.keys(assetShops) as AssetShop[];

type GoodSpec = {
  shop: AssetShop; title: Text; description: Text; price: number; resale: number; yearlyLoss: number;
  condition?: number; legacy?: boolean; branded?: boolean;
};

// Saves replay purchases by ID. Keep the original merchandise and its prices available to the engine.
const catalog = {
  "city-car": {
    shop: "vehicles", title: t("Градски автомобил", "City car"), price: 360_000, resale: .85, yearlyLoss: .10, condition: 77, legacy: true,
    description: t("Малък автомобил втора употреба.", "A small second-hand car."),
  },
  "family-car": {
    shop: "vehicles", title: t("Семеен автомобил", "Family car"), price: 840_000, resale: .85, yearlyLoss: .10, condition: 81, legacy: true,
    description: t("Употребявано комби с повече място за багаж.", "A used estate car with extra luggage space."),
  },
  "golf-vi": {
    shop: "vehicles", title: t("Volkswagen Golf VI", "Volkswagen Golf VI"), price: 495_000, resale: .86, yearlyLoss: .08, condition: 72, branded: true,
    description: t("Употребяван хечбек. Удобен за града и лесен за обслужване.", "Used hatchback for city driving and straightforward servicing."),
  },
  "octavia-combi": {
    shop: "vehicles", title: t("Škoda Octavia Combi", "Škoda Octavia Combi"), price: 1_140_000, resale: .88, yearlyLoss: .09, condition: 84, branded: true,
    description: t("Употребявано семейно комби с голям багажник.", "Used family estate with a large boot."),
  },
  "duster": {
    shop: "vehicles", title: t("Dacia Duster", "Dacia Duster"), price: 2_130_000, resale: .82, yearlyLoss: .09, branded: true,
    description: t("Нов SUV с висок просвет за извънградски пътища.", "New SUV with extra clearance for country roads."),
  },
  "corolla-hybrid": {
    shop: "vehicles", title: t("Toyota Corolla Hybrid", "Toyota Corolla Hybrid"), price: 2_760_000, resale: .83, yearlyLoss: .09, branded: true,
    description: t("Нов хибриден седан.", "New hybrid saloon."),
  },
  "silver-ring": {
    shop: "jewelry", title: t("Сребърен пръстен", "Sterling silver ring"), price: 7_900, resale: .68, yearlyLoss: .01,
    description: t("Семпла халка от сребро 925.", "A plain sterling silver band."),
  },
  "gold-chain": {
    shop: "jewelry", title: t("Златна верижка 14K", "14K gold chain"), price: 42_000, resale: .80, yearlyLoss: 0,
    description: t("Тънка верижка от жълто злато.", "A fine yellow-gold chain."),
  },
  "diamond-ring": {
    shop: "jewelry", title: t("Годежен пръстен с диамант", "Diamond engagement ring"), price: 149_000, resale: .72, yearlyLoss: 0,
    description: t("Бяло злато 14K с диамант 0,40 карата.", "14K white gold with a 0.40-carat diamond."),
  },
  "yamaha-c40": {
    shop: "music", title: t("Китара Yamaha C40", "Yamaha C40 guitar"), price: 14_900, resale: .78, yearlyLoss: .04,
    description: t("Класическа китара с найлонови струни за първите уроци.", "A nylon-string classical guitar for first lessons."),
  },
  "casio-cts1": {
    shop: "music", title: t("Клавир Casio CT-S1", "Casio CT-S1 keyboard"), price: 22_900, resale: .76, yearlyLoss: .06,
    description: t("Компактен клавир с 61 динамични клавиша.", "A portable keyboard with 61 touch-sensitive keys."),
  },
  "kremona-s65c": {
    shop: "music", title: t("Китара Kremona S65C", "Kremona S65C guitar"), price: 48_900, resale: .84, yearlyLoss: .025,
    description: t("Класическа китара от Казанлък с масивен кедров плот.", "A classical guitar from Kazanlak with a solid cedar top."),
  },
  "tissot-prx": {
    shop: "luxury", title: t("Часовник Tissot PRX", "Tissot PRX watch"), price: 45_000, resale: .74, yearlyLoss: .03,
    description: t("Швейцарски часовник със стоманена верижка.", "A Swiss watch with a steel bracelet."),
  },
  "montblanc-meisterstuck": {
    shop: "luxury", title: t("Писалка Montblanc Meisterstück", "Montblanc Meisterstück pen"), price: 89_000, resale: .77, yearlyLoss: .02,
    description: t("Класическа писалка с перо за мастило и калъф.", "A classic fountain pen with a case."),
  },
  "longines-conquest": {
    shop: "luxury", title: t("Часовник Longines Conquest", "Longines Conquest watch"), price: 227_000, resale: .79, yearlyLoss: .025,
    description: t("Швейцарски автоматичен часовник със сапфирено стъкло.", "A Swiss automatic watch with sapphire crystal."),
  },
  laptop: {
    shop: "tech", title: t("Лаптоп", "Laptop"), price: 69_000, resale: .75, yearlyLoss: .18,
    description: t("Лек лаптоп за учене и работа.", "A light laptop for study and work."),
  },
  camera: {
    shop: "tech", title: t("Фотоапарат", "Camera"), price: 48_000, resale: .80, yearlyLoss: .12,
    description: t("Компактен цифров фотоапарат.", "A compact digital camera."),
  },
  "ideapad-slim": {
    shop: "tech", title: t("Lenovo IdeaPad Slim 3", "Lenovo IdeaPad Slim 3"), price: 78_000, resale: .74, yearlyLoss: .17, branded: true,
    description: t("Лаптоп със SSD за работа, учене и всекидневна употреба.", "An SSD laptop for work, study and everyday use."),
  },
  "galaxy-a56": {
    shop: "tech", title: t("Samsung Galaxy A56", "Samsung Galaxy A56"), price: 39_000, resale: .72, yearlyLoss: .19, branded: true,
    description: t("Смартфон от среден клас с OLED екран.", "A midrange smartphone with an OLED screen."),
  },
  painting: {
    shop: "art", title: t("Картина „Родопска утрин“", "Painting · Rhodope Morning"), price: 16_000, resale: .90, yearlyLoss: 0,
    description: t("Малък пейзаж с маслени бои от местен художник.", "A small oil landscape by a local artist."),
  },
  ceramics: {
    shop: "art", title: t("Керамична ваза", "Ceramic vase"), price: 9_500, resale: .80, yearlyLoss: 0,
    description: t("Ръчно изработена ваза с троянска шарка.", "A handmade vase with a Troyan pattern."),
  },
  "chiprovtsi-rug": {
    shop: "art", title: t("Чипровски килим", "Chiprovtsi rug"), price: 64_000, resale: .87, yearlyLoss: .01,
    description: t("Ръчно тъкан вълнен килим с геометричен мотив.", "A handwoven wool rug with a geometric motif."),
  },
} satisfies Record<string, GoodSpec>;
export type Good = keyof typeof catalog;
export const goods: Record<Good, GoodSpec> = catalog;
export const goodIds = Object.keys(goods) as Good[];

export const HOME_VALUE = 3_000_000;
export const houseListings = {
  studio: { title: t("Едностаен апартамент", "Studio flat"),
    description: t("38 м² · Малко жилище за един човек или двойка.", "38 m² · A compact home for one person or a couple."), price: 3_600_000, condition: 83 },
  panel: { title: t("Двустаен панелен апартамент", "One-bedroom panel flat"),
    description: t("59 м² · Отделна кухня и остъклен балкон.", "59 m² · Separate kitchen and glazed balcony."), price: 5_400_000, condition: 70 },
  brick: { title: t("Тристаен тухлен апартамент", "Two-bedroom brick flat"),
    description: t("86 м² · Две спални и дневна.", "86 m² · Two bedrooms and a living room."), price: 8_600_000, condition: 92 },
  house: { title: t("Къща с двор", "House with a garden"),
    description: t("112 м² · Самостоятелна къща с малък двор.", "112 m² · Detached house with a small garden."), price: 10_800_000, condition: 78 },
};
export type HouseListing = keyof typeof houseListings;
export const houseIds = Object.keys(houseListings) as HouseListing[];
const cityPrices: Partial<Record<City, number>> = {
  sofia: 2.55, varna: 1.88, plovdiv: 1.76, burgas: 1.7, "veliko-tarnovo": 1.22, "stara-zagora": 1.16,
  blagoevgrad: 1.12, ruse: 1.08, samokov: 1.07,
};

export function listingPrice(city: City, listing: HouseListing) {
  return Math.round(houseListings[listing].price * (cityPrices[city] ?? 1) / 10_000) * 10_000;
}
