import type { GameState, Text } from "./engine.ts";
import type { Heir, LifeActivityDefinition, LifeSystems } from "./lifeActivities.ts";

const txt = (bg: string, en: string): Text => ({ bg, en });
const HOME_VALUE = 3_000_000;
const HOME_DOWN_PAYMENT = 300_000;
const LOAN_PRINCIPAL = 60_000;
const LOAN_INSTALLMENT = 23_000;
const MORTGAGE_INSTALLMENT = 150_000;

type Bank = LifeSystems["bank"];
function setBank(s: GameState, changes: Partial<Bank>): LifeSystems {
  return { ...s.lifeSystems, bank: { ...s.lifeSystems.bank, ...changes } };
}
function accountRequired(s: GameState): Text | null {
  return s.lifeSystems.bank.accountOpen ? null : txt("Първо открий сметка.", "Open an account first.");
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
    requires: s => accountRequired(s) ?? (s.career === "student"
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
    description: txt("Купуваш малко жилище в Трявна с 3 000 € самоучастие. Плащаш ипотеката годишно и запазваш местоживеенето си.", "Buy a small home in Tryavna with a €3,000 down payment. Pay the mortgage annually and keep your current residence."),
    result: txt("Подписа покупката на жилище в Трявна. То влиза в имуществото ти, а ипотеката – в годишния бюджет.", "You bought a home in Tryavna. It becomes part of your estate, and the mortgage enters your yearly budget."),
    requires: s => accountRequired(s) ?? (s.lifeSystems.bank.ownsHome
      ? txt("Вече имаш жилище.", "You already own a home.")
      : s.career === "student" || s.housing === "shared" || s.lifeSystems.bank.loan > 0
        ? txt("Нужни са стабилна работа, достатъчен доход след наема и изплатен личен заем.", "You need stable work, sufficient income after rent, and a paid-off personal loan.")
        : null),
    stats: { influence: 2, joy: 4 },
    update: s => setBank(s, { mortgage: HOME_VALUE - HOME_DOWN_PAYMENT, ownsHome: true }),
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
  const careDue = (Number(adopted) + Number(rescued)) * 24_000 + s.lifeSystems.family.children * 84_000;
  const loan = bank.loan + Math.ceil(bank.loan * 0.05);
  const mortgage = bank.mortgage + Math.ceil(bank.mortgage * 0.027);
  const loanDue = Math.min(LOAN_INSTALLMENT, loan);
  const mortgageDue = Math.min(MORTGAGE_INSTALLMENT, mortgage);

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
  const homeValue = bank.ownsHome ? HOME_VALUE : 0;
  const homeEquity = homeValue - bank.mortgage;
  const debt = bank.loan + bank.mortgage;
  const rentalDeposit = s.deposit;
  const net = s.cash + bank.balance + homeValue + rentalDeposit - debt;
  const heirs = legacy.prepared ? legacy.heirs.filter(heir => (
    heir !== "partner" || family.partner !== null
  ) && (heir !== "children" || family.children > 0)) : [];
  const distributable = Math.max(net, 0);
  const share = heirs.length === 0 ? 0 : Math.floor(distributable / heirs.length);
  const remaining = distributable - share * heirs.length;
  return {
    cash: s.cash, bankBalance: bank.balance, homeValue, homeEquity, rentalDeposit, debt, net,
    shares: heirs.map((heir: Heir, i: number) => ({ heir, amount: share + Number(i < remaining) })),
  };
}
