import { cities, inCityBg } from "./cities.ts";
import { HOME_VALUE, houseIds, houseListings, listingPrice, type HouseListing } from "./assetCatalog.ts";
import { hasSteadyIncome } from "./lifePath.ts";
import type { GameState, Text } from "./engine.ts";
import { hasLivingChildren } from "./peopleIdentity.ts";
import { assetValues } from "./lifeAssets.ts";
import type { Heir, LifeActivityDefinition, LifeSystems } from "./lifeActivities.ts";

const txt = (bg: string, en: string): Text => ({ bg, en });
export { HOME_VALUE } from "./assetCatalog.ts";
const HOME_DOWN_PAYMENT = 300_000;
const LOAN_PRINCIPAL = 60_000;
const LOAN_INSTALLMENT = 23_000;
const MORTGAGE_INSTALLMENT = 150_000;
const MORTGAGE_RATE = .027;

type Bank = LifeSystems["bank"];
function setBank(s: GameState, changes: Partial<Bank>): LifeSystems {
  return { ...s.lifeSystems, bank: { ...s.lifeSystems.bank, ...changes } };
}
function accountRequired(s: GameState): Text | null {
  return s.lifeSystems.bank.accountOpen ? null : txt("Първо открий сметка.", "Open an account first.");
}

function homeAvailable(s: GameState): Text | null {
  return s.lifeSystems.bank.ownsHome ? txt("Вече имаш жилище.", "You already own a home.") : null;
}

function mortgageRequired(s: GameState): Text | null {
  return accountRequired(s) ?? homeAvailable(s) ?? (!hasSteadyIncome(s) || s.housing === "shared" || s.lifeSystems.bank.loan > 0
    ? txt("Нужни са стабилна работа, достатъчен доход след наема и изплатен личен заем.", "You need stable work, sufficient income after rent, and a paid-off personal loan.")
    : null);
}

export function mortgageQuote(price: number) {
  const downPayment = Math.ceil(price * .2);
  const principal = price - downPayment;
  const installment = Math.ceil(principal * MORTGAGE_RATE / (1 - (1 + MORTGAGE_RATE) ** -25));
  return { downPayment, principal, installment };
}

export function mortgageYear(s: GameState) {
  const balance = s.lifeSystems.bank.mortgage;
  const withInterest = balance + Math.ceil(balance * MORTGAGE_RATE);
  return { withInterest, due: Math.min(s.lifeSystems.assets.home?.mortgagePayment ?? MORTGAGE_INSTALLMENT, withInterest) };
}

function homeOfferActions(listing: HouseListing): LifeActivityDefinition[] {
  const offer = houseListings[listing];
  return [false, true].map(financed => ({
    id: "asset.realty." + (financed ? "mortgage." : "cash.") + listing,
    category: "assets",
    minAge: financed ? 21 : 18,
    label: financed ? txt("Купи с ипотека", "Buy with a mortgage") : txt("Купи в брой", "Buy with cash"),
    historyTitle: offer.title,
    description: financed
      ? txt("Плащаш 20% самоучастие. Годишната вноска влиза в бюджета ти.", "Pay 20% upfront. The annual payment goes into your budget.")
      : txt("Плащаш цялата цена от портфейла си.", "Pay the full price from your wallet."),
    result: txt("Вече имаш собствено жилище.", "You now own a home."),
    requires: financed ? mortgageRequired : homeAvailable,
    walletDelta: s => {
      const price = listingPrice(s.city, listing);
      return -(financed ? mortgageQuote(price).downPayment : price);
    },
    resolve: s => {
      const price = listingPrice(s.city, listing);
      const quote = financed ? mortgageQuote(price) : null;
      const systems = setBank(s, { ownsHome: true, homeCity: s.city, mortgage: quote?.principal ?? 0 });
      return {
        result: txt("Купи жилище " + inCityBg(s.city) + ".", "You bought a home in " + cities[s.city].name.en + "."),
        lifeSystems: {
          ...systems,
          assets: { ...systems.assets, home: { purchasedAt: s.age, paid: price, listing, mortgagePayment: quote?.installment } },
        },
      };
    },
  }));
}

export const lifeBank: LifeActivityDefinition[] = [
  {
    id: "bank.open", category: "bank", minAge: 18,
    label: txt("Открий сметка", "Open a bank account"),
    description: txt("Получаваш сметка за спестявания и достъп до заемите в играта.", "Get a savings account and access to the game’s loans."),
    result: txt("Откри сметка. Вече можеш да заделяш пари отделно от портфейла.", "You opened a bank account and can now set money aside from your wallet."),
    stats: { brains: 1 },
    requires: s => s.lifeSystems.bank.accountOpen ? txt("Вече имаш сметка.", "You already have an account.") : null,
    update: s => setBank(s, { accountOpen: true }),
  },
  {
    id: "bank.deposit", category: "bank", minAge: 18, cost: 20_000,
    label: txt("Задели 200 €", "Save €200"),
    description: txt("Прехвърляш 200 € от портфейла в спестовната сметка.", "Move €200 from your wallet into your savings account."),
    result: txt("Прехвърли 200 € в спестяванията.", "You moved €200 to savings."),
    requires: accountRequired,
    update: s => setBank(s, { balance: s.lifeSystems.bank.balance + 20_000 }),
  },
  {
    id: "bank.withdraw", category: "bank", minAge: 18,
    label: txt("Изтегли от спестяванията", "Withdraw from savings"),
    description: txt("Връщаш до 200 € от сметката в портфейла.", "Move up to €200 from savings back to your wallet."),
    result: txt("Изтегли пари от сметката. Сумата вече е в портфейла.", "You withdrew money from the account. It’s now in your wallet."),
    requires: s => accountRequired(s) ?? (s.lifeSystems.bank.balance > 0 ? null : txt("Сметката е празна.", "The savings account is empty.")),
    walletDelta: s => Math.min(20_000, s.lifeSystems.bank.balance),
    update: s => setBank(s, { balance: s.lifeSystems.bank.balance - Math.min(20_000, s.lifeSystems.bank.balance) }),
  },
  {
    id: "bank.loan", category: "bank", minAge: 19,
    label: txt("Вземи личен заем", "Take a personal loan"),
    description: txt("Получаваш 600 €. Вноските и лихвата влизат в годишния бюджет.", "Receive €600. Instalments and interest go into the annual budget."),
    result: txt("Получи 600 € срещу годишни вноски. Остатъкът по заема е в „Банка“.", "You received €600 in exchange for annual repayments. The remaining loan appears in Bank."),
    requires: s => accountRequired(s) ?? (!hasSteadyIncome(s)
      ? txt("Нужна е работа със заплата.", "You need a salaried job.")
      : s.lifeSystems.bank.loan > 0
        ? txt("Изплати активния заем.", "Pay off the active loan first.")
        : null),
    walletDelta: () => LOAN_PRINCIPAL,
    update: s => setBank(s, { loan: LOAN_PRINCIPAL }),
  },
  {
    id: "bank.pay-loan", category: "bank", minAge: 19,
    label: txt("Внеси по личния заем", "Pay down the personal loan"),
    description: txt("Плащаш до 200 € от главницата преди края на годината.", "Pay up to €200 of principal before the year closes."),
    result: txt("Намали остатъка по личния заем с предсрочна вноска.", "An early repayment reduced your personal loan balance."),
    requires: s => s.lifeSystems.bank.loan > 0 ? null : txt("Нямаш активен личен заем.", "You don’t have a personal loan."),
    walletDelta: s => -Math.min(20_000, s.lifeSystems.bank.loan),
    update: s => setBank(s, { loan: s.lifeSystems.bank.loan - Math.min(20_000, s.lifeSystems.bank.loan) }),
  },
  {
    id: "bank.mortgage", category: "bank", minAge: 21, cost: HOME_DOWN_PAYMENT,
    label: txt("Купи жилище с ипотека", "Buy a home with a mortgage"),
    description: txt("Купуваш малко жилище с 3 000 € самоучастие. Вноските по ипотеката влизат в годишния бюджет.", "Buy a small home with a €3,000 down payment. Mortgage payments count towards your annual budget."),
    result: txt("Подписа покупката на жилище в Трявна. То влиза в имуществото ти, а ипотеката – в годишния бюджет.", "You bought a home in Tryavna. It becomes part of your estate, and the mortgage enters your yearly budget."),
    requires: mortgageRequired,
    stats: { influence: 2, joy: 4 },
    resolve: s => {
      const original = s.lifespanStart === null;
      const city = original ? "tryavna" : s.city;
      const name = cities[city].name;
      return {
        result: txt("Подписа покупката на жилище " + inCityBg(city) + ". То влиза в имуществото ти, а ипотеката – в годишния бюджет.",
          "You bought a home in " + name.en + ". It becomes part of your estate, and the mortgage enters your yearly budget."),
        lifeSystems: setBank(s, { mortgage: HOME_VALUE - HOME_DOWN_PAYMENT, ownsHome: true,
          ...(!original && { homeCity: city }) }),
      };
    },
  },
  {
    id: "bank.pay-mortgage", category: "bank", minAge: 21,
    label: txt("Направи вноска по ипотеката", "Pay down the mortgage"),
    description: txt("До 500 € от портфейла отиват директно за ипотечната главница.", "Put up to €500 from your wallet directly towards the mortgage principal."),
    result: txt("Внесе допълнително по ипотеката. Стойността на твоя дял в жилището нарасна.", "You made an extra mortgage payment, increasing the equity in your home."),
    requires: s => s.lifeSystems.bank.mortgage > 0 ? null : txt("Нямаш активна ипотека.", "You don’t have an active mortgage."),
    walletDelta: s => -Math.min(50_000, s.lifeSystems.bank.mortgage),
    update: s => setBank(s, { mortgage: s.lifeSystems.bank.mortgage - Math.min(50_000, s.lifeSystems.bank.mortgage) }),
  },
  {
    id: "asset.home.buy", category: "assets", minAge: 18, cost: HOME_VALUE,
    label: txt("Купи в брой", "Buy with cash"),
    historyTitle: txt("Покупка на жилище", "Bought a home"),
    description: txt("Плащаш цялата цена от портфейла си.", "Pay the full price from your wallet."),
    result: txt("Купи жилище в града, в който живееш.", "You bought a home in the city where you live."),
    requires: homeAvailable,
    update: s => setBank(s, { ownsHome: true, homeCity: s.city }),
  },
  {
    id: "asset.home.payoff", category: "assets", minAge: 21,
    label: txt("Изплати ипотеката", "Pay off the mortgage"),
    description: txt("Погасяваш целия остатък по ипотеката.", "Pay the entire remaining mortgage balance."),
    result: txt("Жилището вече е без ипотека.", "The home no longer has a mortgage."),
    requires: s => s.lifeSystems.bank.mortgage > 0 ? null : txt("Нямаш активна ипотека.", "You don’t have an active mortgage."),
    walletDelta: s => -s.lifeSystems.bank.mortgage,
    update: s => setBank(s, { mortgage: 0 }),
  },
  ...houseIds.flatMap(homeOfferActions),
];

const formatBG = new Intl.NumberFormat("bg-BG", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
const formatEN = new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });

export function billText(obligations: number): Text {
  return txt(`Годишни вноски и грижи: ${formatBG.format(obligations / 100)}.`,
    `Yearly repayments and care: ${formatEN.format(obligations / 100)}.`);
}

export function settleFinances(s: GameState, baseNet: number) {
  const bank = s.lifeSystems.bank;
  const { adopted, rescued } = s.lifeSystems.pets;
  const { family } = s.lifeSystems;
  const dependants = s.lifespanStart === null ? family.children : family.childProfiles.filter((child, index) =>
    !s.deceased[`child-${index}`] && child.ageAtJoin + s.age - child.joinedAt < 18).length;
  const careDue = (Number(adopted) + Number(rescued)) * 24_000 + dependants * 84_000;
  const loan = bank.loan + Math.ceil(bank.loan * 0.05);
  const { withInterest: mortgage, due: mortgageDue } = mortgageYear(s);
  const loanDue = Math.min(LOAN_INSTALLMENT, loan);

  // Pay the actual amounts while keeping at least the free story route available.
  // Unpaid debt stays on the relevant balance and unmet care changes next year's well-being.
  const available = Math.max(0, s.cash + baseNet);
  const carePaid = Math.min(careDue, available);
  const mortgagePaid = Math.min(mortgageDue, available - carePaid);
  const loanPaid = Math.min(loanDue, available - carePaid - mortgagePaid);
  const obligations = carePaid + mortgagePaid + loanPaid;
  return {
    obligations,
    unpaidCare: careDue > carePaid,
    unpaidDebt: mortgageDue > mortgagePaid || loanDue > loanPaid,
    bank: {
      ...bank,
      balance: bank.balance + Math.floor(bank.balance / 100),
      loan: loan - loanPaid,
      mortgage: mortgage - mortgagePaid,
    },
  };
}

export function getEstate(s: GameState) {
  const { bank, legacy, family } = s.lifeSystems;
  const { investments, belongings, homeValue, pledgedDebt } = assetValues(s);
  const homePledge = s.lifeSystems.assets.home?.pledge?.redeemFor ?? 0;
  const homeEquity = homeValue - bank.mortgage - homePledge;
  const debt = bank.loan + bank.mortgage + pledgedDebt;
  const rentalDeposit = s.deposit;
  const net = s.cash + bank.balance + homeValue + rentalDeposit + investments + belongings - debt;
  const heirs = legacy.prepared ? legacy.heirs.filter(heir => (
    heir !== "partner" || family.partner !== null
  ) && (heir !== "children" || hasLivingChildren(s))
    && ((heir !== "friend" && heir !== "rumi") || !s.deceased[heir])) : [];
  const distributable = Math.max(net, 0);
  const share = heirs.length === 0 ? 0 : Math.floor(distributable / heirs.length);
  const remaining = distributable - share * heirs.length;
  return {
    cash: s.cash, bankBalance: bank.balance, homeValue, homeEquity, rentalDeposit, investments, belongings, debt, net,
    shares: heirs.map((heir: Heir, i: number) => ({ heir, amount: share + Number(i < remaining) })),
  };
}
