import type { AvatarPresentation } from "./avatar.ts";
import type { GameState, Text } from "./engine.ts";
import { lossSupport, pregnancyMoment } from "./familyMoments.ts";
import { birthCount, familyRoll, miscarriageChance, type ConceptionMethod } from "./fertilityModel.ts";
import { markMaternityYear } from "./maternity.ts";
import { trimesterMoments, partnerTrimesterMoments } from "./pregnancyMoments.ts";
import {
  deliverPregnancy, familyEvent, familyPlayEnabled, updateReproduction,
  type Parent, type Parents, type Pregnancy, type PregnancyNotice, type Reproduction, type Trimester,
} from "./reproduction.ts";

const t = (bg: string, en: string): Text => ({ bg, en });
const motherKey = (mother: Parent) => mother.id + "." + mother.name.bg;
const draw = (s: GameState, key: string, result: string) => familyRoll(s.seed, s.age, key + "." + result);

function withReproduction(s: GameState, changes: Partial<Reproduction>): GameState {
  return { ...s, lifeSystems: updateReproduction(s, changes) };
}

function withGestation(s: GameState, pregnancy: Pregnancy, key: string): Pregnancy {
  const count = birthCount(pregnancy.mother.age, pregnancy.method, draw(s, key, "count"));
  const babies: AvatarPresentation[] = Array.from({ length: count }, (_, i) =>
    draw(s, key, "sex." + i) < 0.488 ? "female" : "male");
  return { ...pregnancy, gestation: { key, trimester: 0, babies, knownSexes: babies.map(() => null) } };
}

export function startPregnancyPlay(s: GameState): GameState {
  if (s.finished || familyPlayEnabled(s)) return s;
  const { pregnancy } = s.lifeSystems.reproduction;
  return markMaternityYear(withReproduction(s, {
    familyPlayFrom: s.commands.length,
    pregnancy: pregnancy && !pregnancy.gestation
      ? withGestation(s, pregnancy, "ongoing." + motherKey(pregnancy.mother)) : pregnancy,
  }));
}

export function conceptionRoll(s: GameState, mother: Parent, chance: number, key: string): boolean {
  const recovery = s.lifeSystems.reproduction.recoveries[motherKey(mother)];
  if (recovery?.age !== s.age) return draw(s, key, "conception") < chance;
  // One stable same-year draw per mother. More encounters cannot reroll it.
  return !recovery.retried && draw(s, "after-loss." + motherKey(mother), "conception") < Math.min(chance, 0.01);
}

export function offerPregnancyCheck(s: GameState, parents: Parents, method: ConceptionMethod, positive: boolean, key: string) {
  const id = motherKey(parents.mother);
  const previous = s.lifeSystems.reproduction.recoveries;
  const retry = positive && previous[id]?.age === s.age;
  const candidate = positive ? withGestation(s, { ...parents, method, dueAge: s.age + 1 }, key) : null;
  const clinical = method === "iui" || method === "ivf" || method === "donor-ivf";
  const result = clinical ? t("Клиниката се свърза с теб за тест след опита.", "The clinic contacted you about a test after the attempt.")
    : parents.mother.id === "player"
      ? t("Забеляза закъснение. Предстои тест за бременност.", "Your period is late. It’s time for a pregnancy test.")
      : t("Получаваш новина за закъснение. Ще разберете повече след теста.", "You hear that her period is late. A test will tell you more.");
  return {
    result,
    lifeSystems: updateReproduction(s, {
      notice: { kind: "test", mother: parents.mother, candidate, clinical },
      ...(retry && { recoveries: { ...previous, [id]: { age: s.age, retried: true } } }),
    }),
  };
}

export function resolvePregnancyCheck(s: GameState): GameState {
  const { notice } = s.lifeSystems.reproduction;
  if (s.finished || notice?.kind !== "test") return s;
  const pregnancy = notice.candidate;
  const title = pregnancy ? t("Бременността е потвърдена", "Pregnancy confirmed") : t("Тестът е отрицателен", "The test is negative");
  const result = pregnancy
    ? notice.mother.id === "player"
      ? t("Тестът е положителен. Уговори първи преглед.", "The test is positive. You arrange a first appointment.")
      : t(notice.mother.name.bg + " сподели, че тестът е положителен.", notice.mother.name.en + " tells you that the test is positive.")
    : notice.clinical ? t("Тестът след опита не установи бременност.", "The test after the attempt did not detect a pregnancy.")
      : t("Закъснението се оказа фалшива тревога. Тестът не установи бременност.",
        "The late period was a false alarm. The test did not detect a pregnancy.");
  const reaction = pregnancy && pregnancyMoment(s, pregnancy.mother.age);
  const text = reaction ? t(result.bg + " " + reaction.bg, result.en + " " + reaction.en) : result;
  const next = withReproduction(s, { pregnancy, notice: { kind: pregnancy ? "confirmed" : "negative", title, text: result } });
  return familyEvent(next, pregnancy ? "pregnancy-confirmed" : "pregnancy-negative", title, text);
}

export function pregnancyNoticeCopy(notice: PregnancyNotice): { title: Text; text: Text; action: Text } {
  if (notice.kind !== "test") return { ...notice, action: t("Продължи", "Continue") };
  const own = notice.mother.id === "player";
  return {
    title: t("Тест за бременност", "Pregnancy test"),
    text: notice.clinical ? t("Клиниката предлага да проверите резултата след опита.", "The clinic is ready to check the result of the attempt.")
      : own ? t("Цикълът ти закъснява. Има смисъл да провериш.", "Your period is late. You decide to check.")
      : t(notice.mother.name.bg + " сподели, че цикълът ѝ закъснява.", notice.mother.name.en + " tells you that her period is late."),
    action: own ? t("Направи тест", "Take the test") : t("Виж резултата", "See the result"),
  };
}

export function dismissPregnancyNotice(s: GameState): GameState {
  const { notice } = s.lifeSystems.reproduction;
  return s.finished || !notice || notice.kind === "test" ? s : withReproduction(s, { notice: null });
}

export function canEndPregnancy(s: GameState): boolean {
  const { pregnancy, notice } = s.lifeSystems.reproduction;
  return !s.finished && !notice && pregnancy?.mother.id === "player"
    && !!pregnancy.gestation && pregnancy.gestation.trimester < 2;
}

function finishPregnancy(s: GameState, pregnancy: Pregnancy, outcome: "miscarriage" | "late-loss" | "termination"): GameState {
  const { mother } = pregnancy;
  const id = motherKey(mother);
  const { recoveries } = s.lifeSystems.reproduction;
  const recovery = { age: s.age, retried: recoveries[id]?.age === s.age && recoveries[id].retried };
  const termination = outcome === "termination";
  const late = outcome === "late-loss";
  const support = lossSupport(s);
  const title = termination ? t("Прекъсване на бременността", "Pregnancy ended")
    : late ? t("Късна загуба на бременността", "Late pregnancy loss") : t("Загуба на бременността", "Pregnancy loss");
  const text = termination
    ? t("След консултация прекъсна бременността по свое желание. Следва време за възстановяване.",
      "After a consultation, you chose to end the pregnancy. You take time to recover.")
    : late
      ? t("Контролният преглед установи загуба на бременността. " + support.bg,
        "A follow-up appointment confirmed a pregnancy loss. " + support.en)
      : t("Бременността приключи със спонтанен аборт. " + support.bg,
        "The pregnancy ended in miscarriage. " + support.en);
  const next = withReproduction(s, {
    pregnancy: null, recoveries: { ...recoveries, [id]: recovery },
    notice: { kind: termination ? "termination" : "loss", title, text },
  });
  return familyEvent(next, termination ? "pregnancy-termination" : "pregnancy-loss", title, text,
    { ...(!termination && { joy: -7 }), ...(mother.id === "player" && { health: -2 }) });
}

export function terminatePregnancy(s: GameState): GameState {
  const { pregnancy } = s.lifeSystems.reproduction;
  return pregnancy && canEndPregnancy(s) ? finishPregnancy(s, pregnancy, "termination") : s;
}

export function pregnancyTurnLabel(s: GameState): Text | null {
  const gestation = s.lifeSystems.reproduction.pregnancy?.gestation;
  if (!gestation || s.finished) return null;
  return gestation.trimester === 3 ? t("Раждане", "Birth")
    : t("Триместър " + (gestation.trimester + 1), "Trimester " + (gestation.trimester + 1));
}

const pregnancyTitles: Record<Trimester, Text> = {
  1: t("Първи триместър", "First trimester"),
  2: t("Втори триместър", "Second trimester"),
  3: t("Трети триместър", "Third trimester"),
};

function scanResult(s: GameState, pregnancy: Pregnancy, stage: Trimester): GameState {
  const gestation = pregnancy.gestation!;
  const { babies, key } = gestation;
  if (stage === 1) {
    const text = babies.length === 1 ? t("На първия ехограф се видя едно бебе и уточнихте термина.",
      "The dating scan showed one baby and gave you a better idea of the due date.")
      : babies.length === 2 ? t("Първият ехограф показа, че очаквате близнаци.", "The first ultrasound showed you’re expecting twins.")
      : t("На ехографа видяхте три бебета. Уговорихте по-чести прегледи.", "You saw three babies on the ultrasound. More frequent appointments were arranged.");
    return familyEvent(s, "pregnancy-dating-scan", t("Първи ехограф", "Dating scan"), text);
  }
  const knownSexes = gestation.knownSexes.map((sex, i) => sex ?? (draw(s, key, "scan." + stage + "." + i) < 0.82 ? babies[i] : null));
  if (stage === 3 && knownSexes.every((sex, i) => sex === gestation.knownSexes[i])) return s;
  const label = (sex: AvatarPresentation | null) => sex === "female" ? t("момиче", "girl")
    : sex === "male" ? t("момче", "boy") : t("още не се вижда", "not visible yet");
  const rows = knownSexes.map((sex, i) => babies.length === 1 ? label(sex)
    : t("Бебе " + (i + 1) + " · " + label(sex).bg, "Baby " + (i + 1) + " · " + label(sex).en));
  const text = knownSexes.every(sex => sex === null)
    ? t("Положението на бебето засега не позволява да се види полът на ехографа.",
      "The position on the scan means the sex isn’t visible yet.")
    : t(rows.map(row => row.bg).join(" / ") + ".", rows.map(row => row.en).join(" / ") + ".");
  return familyEvent(withReproduction(s, { pregnancy: { ...pregnancy, gestation: { ...gestation, knownSexes } } }),
    "pregnancy-scan-" + stage, stage === 2 ? t("Фетална морфология", "Anatomy scan") : t("Контролен ехограф", "Follow-up ultrasound"), text);
}

export function advancePregnancy(s: GameState): GameState {
  const { pregnancy, notice, naming } = s.lifeSystems.reproduction;
  if (s.finished || notice || naming || !pregnancy?.gestation) return s;
  const { gestation, mother, method } = pregnancy;
  const { key, babies } = gestation;
  if (gestation.trimester === 3) return deliverPregnancy(s, pregnancy, babies, key);
  const stage = (gestation.trimester + 1) as Trimester;
  const pregnancyLoss = draw(s, key, "loss") < miscarriageChance(mother.age, method);
  const lossStage = draw(s, key, "loss-stage") < 0.8 ? 1 : 2;
  if (pregnancyLoss && stage === lossStage) return finishPregnancy(s, pregnancy, "miscarriage");
  // A separate, rare late-loss event for the game’s third trimester.
  if (stage === 3 && draw(s, key, "late-loss") < (mother.age >= 40 ? 0.005 : 0.002)) return finishPregnancy(s, pregnancy, "late-loss");

  const moved = { ...pregnancy, gestation: { ...gestation, trimester: stage } };
  const choices = mother.id === "player" ? trimesterMoments[stage] : partnerTrimesterMoments[stage];
  const story = choices[Math.floor(draw(s, key, "moment." + stage) * choices.length)];
  const next = familyEvent(withReproduction(s, { pregnancy: moved }), "pregnancy-trimester-" + stage,
    pregnancyTitles[stage], story.text, story.stats);
  return scanResult(next, moved, stage);
}
