import { limit, pathRoll, type PathEvent } from "./pathActions.ts";
import { pathText as t } from "./pathCatalog.ts";
import { platforms } from "./specialCareerCatalog.ts";
import {
  action, change, euros, independentPay, needsAdult, noIndependentPay, range,
  type Channel, type Niche, type Platform, type SpecialAction, type SpecialCard, type SpecialContext,
} from "./specialCareerTypes.ts";

const niches = {
  culture: t("Култура и образование", "Culture and education"),
  sport: t("Спорт", "Sports"),
  everyday: t("Ежедневие и хумор", "Everyday life and comedy"),
};
const audience = t("Последователи", "Followers");
const trust = t("Доверие", "Trust");
const partners = t("Партньорства", "Partnerships");
const earnings = t("Монетизация", "Monetization");
const platformIds = Object.keys(platforms) as Platform[];

function newChannel(platform: Platform): Channel {
  return { platform, niche: "everyday", followers: 0, trust: 60, views: 0, watchHours: 0, shorts: 0,
    posts: 0, verified: false, monetized: false };
}

function post(ctx: SpecialContext, channel: Channel, format: "long" | "short" | "collab") {
  const { life, progress } = ctx;
  const platform = platforms[channel.platform];
  const source = channel.niche === "culture" ? life.stats.brains : channel.niche === "sport" ? life.stats.health : life.stats.joy;
  const roll = pathRoll(life, "creator." + platform.title.en + "." + format);
  const viral = roll > .94;
  const baseline = 90 + source * 7 + life.stats.influence * 9 + progress.fame * 30 + channel.followers * (format === "collab" ? 1.45 : .52);
  const views = Math.round(baseline * platform.reach * (.66 + roll * .75) * (format === "short" ? 1.5 : 1) * (viral ? 4.8 : 1));
  const gained = Math.round(views * (.025 + channel.trust * .00046));
  const next: Channel = {
    ...channel, followers: channel.followers + gained, views: channel.views + views,
    watchHours: channel.watchHours + (channel.platform === "youtube" && format === "long" ? Math.round(views * .095) : 0),
    shorts: channel.shorts + (channel.platform === "youtube" && format === "short" ? views : 0),
    trust: range(channel.trust + (format === "long" ? 3 : format === "collab" ? 4 : 1)), posts: channel.posts + 1,
  };
  return change(ctx, { channel: next, fame: range(progress.fame + (viral ? 4 : gained >= 250 ? 2 : 0)) },
    viral ? t("Клипът се завъртя извън обичайната ми публика. +" + gained + " последователи.",
      "My post broke out beyond its usual audience. +" + gained + " followers.")
      : t("Качих ново съдържание. +" + gained + " последователи.", "I posted new content. +" + gained + " followers."),
    { stats: { influence: gained >= 100 ? 2 : 1 } });
}

function partnershipActions(ctx: SpecialContext, channel: Channel): SpecialAction[] {
  const { life, progress } = ctx;
  const agreement = channel.sponsor?.age === life.age ? channel.sponsor : undefined;
  const publicOffice = ctx.path.work.job?.special?.kind === "politics";
  const blocked = life.age < 18 ? needsAdult : publicOffice
    ? t("В играта платените партньорства се паузират по време на мандат.", "Paid partnerships pause while holding office in the game.") : undefined;
  if (agreement) {
    const pay = independentPay(agreement.gross);
    return [action("creator", "sponsor.publish", t("Публикувай с обозначение „Реклама“", "Publish with a paid-ad label"),
      () => change(ctx, {
        channel: { ...channel, sponsor: undefined, trust: range(channel.trust + 2) },
        independentGross: progress.independentGross + pay.gross, careerReceipts: progress.careerReceipts + pay.net,
      }, t("Обозначих рекламата. Партньорът плати договорения хонорар.", "I labelled the advertisement. The partner paid the agreed fee."), { cash: pay.net }), blocked),
    action("creator", "sponsor.cancel", t("Откажи кампанията", "Decline the campaign"),
      () => change(ctx, { channel: { ...channel, sponsor: undefined } },
        t("Отказах рекламната кампания.", "I declined the paid campaign.")))];
  }
  if (channel.sponsorAge === life.age) return [];
  return [action("creator", "sponsor.book", t("Договори партньорство", "Book a partnership"), () => {
    const gross = euros(Math.round(limit(60 + channel.followers * .028 + channel.trust * 3, 90, 6400)));
    return change(ctx, { channel: { ...channel, sponsorAge: life.age, sponsor: { age: life.age, gross } } },
      t("Договорих реклама с български бранд. Плащането е след публикацията.",
        "I agreed a campaign with a Bulgarian brand. Payment is due when the post goes live."));
  }, blocked ?? (channel.followers < 1500 || channel.trust < 48 || channel.posts === 0
    ? t("Трябват 1 500 последователи, 48% доверие и публикация тази година.", "Requires 1,500 followers, 48% trust and a post this year.") : undefined))];
}

export function creatorView(ctx: SpecialContext): SpecialCard[] {
  const { life, progress: { channel } } = ctx;
  if (!channel) return [{
    id: "platforms", title: t("Създай канал", "Open a channel"),
    detail: t("Избери формат, който искаш да развиваш. Каналът може да върви успоредно с работа.", "Choose a format to build around. A channel can run alongside your job."),
    actions: platformIds.map(id => action("creator", "open." + id, platforms[id].title, () =>
      change(ctx, { channel: newChannel(id) }, t("Създадох канал в " + platforms[id].title.bg + ".", "I opened a channel on " + platforms[id].title.en + ".")))),
  }];
  const platform = platforms[channel.platform];
  const paid = channel.sponsor?.age === life.age ? channel.sponsor.gross : undefined;
  const allowedAds = channel.followers >= 1000 && (channel.watchHours >= 4000 || channel.shorts >= 10_000_000);
  const publicOffice = ctx.path.work.job?.special?.kind === "politics";
  const channelActions: SpecialAction[] = [
    action("creator", "publish.long", platform.format, () => post(ctx, channel, "long")),
    action("creator", "publish.short", platform.short, () => post(ctx, channel, "short")),
    action("creator", "collab", t("Колаборация с друг автор", "Collaborate with another creator"), () => post(ctx, channel, "collab"),
      channel.followers < 600 ? t("Трябват 600 последователи.", "Requires 600 followers.") : undefined),
    action("creator", "engage", t("Отговори на аудиторията", "Answer your audience"), () =>
      change(ctx, { channel: { ...channel, trust: range(channel.trust + 7) } },
        t("Отговорих на коментарите си. Доверието в канала се вдигна.", "I answered comments. Audience trust grew."))),
  ];
  const verificationMin = channel.platform === "youtube" ? 100_000 : 25_000;
  if (!channel.verified) channelActions.push(action("creator", "verify", t("Поискай потвърждение", "Request verification"), () =>
    change(ctx, { channel: { ...channel, verified: true } }, t("Профилът ми получи знак за потвърждение.", "My profile received a verification badge.")),
    channel.followers < verificationMin || channel.trust < 65 ? t("В играта трябват " + verificationMin + " последователи и 65% доверие.",
      "The game requires " + verificationMin + " followers and 65% trust.") : undefined));
  return [{
    id: "channel", title: platform.title, detail: niches[channel.niche],
    facts: [
      { label: audience, value: channel.followers }, { label: t("Гледания тази година", "Views this year"), value: channel.views },
      ...(channel.verified ? [{ label: t("Профил", "Profile"), value: t("Потвърден", "Verified") }] : []),
    ], meters: [{ label: trust, value: channel.trust }], actions: channelActions,
  }, {
    id: "topic", title: t("Тема на канала", "Channel topic"), fold: true,
    actions: (Object.keys(niches) as Niche[]).filter(niche => niche !== channel.niche).map(niche => action("creator", "topic." + niche, niches[niche],
      () => change(ctx, { channel: { ...channel, niche } }, t("Смених темата на канала.", "I changed the topic of my channel.")),
      ctx.path.used.some(id => id.startsWith("special.creator.topic.")) ? t("Вече смени темата тази година.", "You already changed topic this year.") : undefined)),
  }, {
    id: "partners", title: partners,
    detail: t("Отбелязвай платените публикации. Хонорарите влизат в годишния отчет.",
      "Disclose paid posts. Fees appear in the annual ledger."),
    facts: paid === undefined ? undefined : [{ label: t("Договорен хонорар", "Agreed gross fee"), value: paid, money: true }],
    actions: partnershipActions(ctx, channel),
  }, ...(channel.platform === "youtube" ? [{
    id: "monetization", title: earnings,
    detail: channel.monetized ? t("Рекламните приходи се отчитат в края на годината.", "Ad revenue is settled at year-end.")
      : t("1 000 абонати и 4 000 часа гледане или 10 млн. Shorts гледания. Играта отчита целите на годишен ход.",
        "1,000 subscribers plus 4,000 watch hours or 10 million Shorts views. The game tracks both on annual turns."),
    facts: [
      { label: t("Часове гледане", "Watch hours"), value: channel.watchHours },
      { label: t("Shorts гледания", "Shorts views"), value: channel.shorts },
    ],
    actions: channel.monetized ? [] : [action("creator", "monetize", t("Активирай рекламите", "Enable advertising"),
      () => change(ctx, { channel: { ...channel, monetized: true } }, t("Каналът ми влезе в партньорската програма.", "My channel joined the partner programme.")),
      life.age < 18 ? needsAdult : publicOffice ? t("Монетизацията е паузирана по време на мандата.", "Monetization is paused while in office.")
        : !allowedAds ? t("Първо покрий целите за гледания.", "Meet the audience and watch targets first.") : undefined)],
  } satisfies SpecialCard] : [])];
}

export function closeCreatorYear(ctx: SpecialContext) {
  const { channel } = ctx.progress;
  if (!channel) return { channel, pay: noIndependentPay, events: [] as PathEvent[] };
  const { life } = ctx;
  const publicOffice = ctx.path.work.job?.special?.kind === "politics";
  const pay = channel.monetized && !publicOffice ? independentPay(euros(Math.round(channel.views / 1000 * 2.4))) : noIndependentPay;
  const followers = channel.posts || !channel.followers ? channel.followers : Math.floor(channel.followers * .96);
  return {
    channel: { ...channel, followers, views: 0, watchHours: 0, shorts: 0, posts: 0, sponsor: undefined }, pay,
    events: pay.gross ? [{ id: "special.creator.payout", title: earnings,
      note: t("Рекламните приходи от канала влязоха в годишния бюджет.", "My channel's ad revenue went into the annual budget.") }] : [],
  };
}
