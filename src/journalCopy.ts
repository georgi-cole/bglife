import { activityMoment } from "./activityMoments.ts";
import { relativeLabel, type BirthFamily } from "./birthFamily.ts";
import { cities, inCityBg, placeAfterPreposition } from "./cities.ts";
import { cityCulture, voices } from "./cityCulture.ts";
import { cityPaths, jobTypes, type JobId } from "./cityPaths.ts";
import type { GameState, Memory, Text } from "./engine.ts";
import { fundIds, funds, goodIds, goods } from "./lifeAssets.ts";
import type { Language } from "./session.ts";

const t = (bg: string, en: string): Text => ({ bg, en });

const diaryLines: Readonly<Partial<Record<string, Text>>> = {
  "first-birthday": t("На тортата ми имаше една свещичка. Всички се събраха за снимка.", "There was one candle on my cake. Everyone squeezed into the photo."),
  preschool: t("Започнах предучилищна. Вече имам свое шкафче.", "I started preschool. I have my own cubby now."),
  "first-grade": t("Тръгнах в първи клас.", "I started first grade."),
  "after-seventh": t("Явих се на НВО след седми клас. Вкъщи обсъждаме гимназиите.", "I sat the national assessments. We’re talking about high schools at home."),
  adulthood: t("Навърших 18. Вече решавам къде да живея и какво да правя след училище.", "I turned 18. I get to decide where to live and what to do after school."),
  "adult-years": t("Училищните години са зад гърба ми. Време е за нови планове.", "My school years are behind me. Time for new plans."),
  "later-years": t("Тази година все по-често говорим за стаж, пенсия и планове.", "This year we’ve talked more about work, retirement and what comes next."),
  centenary: t("Навърших 100. Прелистих стари снимки и писма.", "I turned 100. I looked through old photos and letters."),
  "131st-birthday": t("Навърших 131 години.", "I turned 131."),
  martenitsa: t("Вързаха ми мартеница. Започнах да гледам за цъфнали дървета.", "I got a martenitsa and started looking for trees in bloom."),
  reader: t("Взех книжка от читалището. Рисунките ми харесаха най-много.", "I borrowed a book from the community library. The drawings were my favourite part."),
  surva: t("Направихме сурвачка и упражнихме наричането за Нова година.", "We made a traditional dogwood branch and practised the New Year’s blessing."),
  "may-24": t("С класа ми излязохме на шествието за 24 май.", "My class joined the parade on 24 May."),
  "school-project": t("Разпитах близките си за квартала за един училищен проект.", "I asked my family about the neighbourhood for a school project."),
  "life.work": t("Приех предложение за работа в града.", "I accepted a job offer in town."),
  "life.retire": t("Пенсионирах се след последната си смяна.", "I retired after my last shift."),
  "family.tinder": t("Запознах се с Алекс в Tinder. Уговорихме се да се видим пак.", "I met Alex on Tinder. We agreed to meet again."),
  "family.dating-service": t("Излязох на среща с Дани. Уговорихме се да се видим отново.", "I went on a date with Dani. We made plans to meet again."),
  "family.casual": t("Излязох на среща. Уговорката беше да остане еднократна.", "I went on a date. We agreed to leave it at that."),
  "family.date-eli": t("Ели прие поканата ми и предложи да се видим пак.", "Eli said yes and suggested we meet again."),
  "family.time-together": t("Оставихме телефоните и си поговорихме на спокойствие.", "We put our phones away and had a proper talk."),
  "family.commit": t("Решихме да сме двойка.", "We agreed to be a couple."),
  "family.engage": t("Сгодихме се. Първо се обадихме на най-близките си.", "We got engaged and called the people closest to us."),
  "family.marry": t("Сключихме брак пред най-близките си.", "We got married with the people closest to us there."),
  "family.baby": t("Очакваме дете.", "We’re expecting a child."),
  "family.adopt": t("Осинових дете.", "I adopted a child."),
  "family.break-up": t("Разделихме се след спокоен разговор.", "We talked it through and split up."),
  "pets.adopt": t("Прибрах куче от приюта.", "I brought a dog home from the shelter."),
  "pets.rescue": t("Прибрах бездомна котка, след като не намерих стопанина ѝ.", "I took in a stray cat after looking for its owner."),
  "pets.play": t("Поиграх с любимеца си.", "I played with my pet."),
  "pets.vet": t("Заведох любимеца си на преглед при ветеринар.", "I took my pet to the vet for a checkup."),
  "bank.open": t("Открих банкова сметка.", "I opened a bank account."),
  "bank.deposit": t("Заделих 200 € в спестовната си сметка.", "I moved €200 into savings."),
  "bank.withdraw": t("Изтеглих пари от спестяванията си.", "I withdrew money from savings."),
  "bank.loan": t("Взех заем от 600 €.", "I took out a €600 loan."),
  "bank.pay-loan": t("Внесох допълнителна сума по заема си.", "I made an extra payment on my loan."),
  "bank.pay-mortgage": t("Направих допълнителна вноска по ипотеката.", "I made an extra mortgage payment."),
  "asset.home.sell": t("Продадох жилището си.", "I sold my home."),
  "legacy.prepare": t("Уредих наследството си.", "I made plans for my estate."),
  "hospital.gp": t("Говорих с личния си лекар и си записах час за преглед.", "I spoke to my GP and booked a checkup."),
  "hospital.grandma": t("Обадих се на баба. Попита кога ще ѝ гостувам.", "I called Grandma. She asked when I would come to visit."),
  "hospital.clinic": t("Минах на преглед в поликлиниката и се върнах към ежедневието си.", "I had a checkup at the clinic and got back to my usual routine."),
  "hospital.emergency": t("Заведоха ме в спешното и състоянието ми се стабилизира.", "I was taken in for emergency care and my condition stabilized."),
  "hospital.therapy": t("Поговорих с терапевт за това, което ми тежи.", "I talked to a therapist about what was weighing on me."),
  "hospital.psychiatrist": t("Отидох на психиатър и уговорих следващ преглед.", "I saw a psychiatrist and booked a follow-up."),
  "hospital.eyes": t("Минах очен преглед и разбрах защо четенето ме изморява.", "I had an eye exam and found out why reading was tiring me out."),
  "gym.walk": t("Разходих се по познат маршрут и се прибрах в по-добро настроение.", "I took a familiar walk and came home feeling better."),
  "gym.run": t("Тичах по обичайния си маршрут.", "I ran my usual route."),
  "gym.weights": t("Тренирах с тежести и си записах резултатите.", "I lifted weights and wrote down my results."),
  "gym.hiit": t("Изкарах цялата интервална тренировка.", "I made it through the whole interval workout."),
  "gym.crossfit": t("Тренирах с групата и разменихме контакти за следващия път.", "I trained with the group and we swapped numbers for next time."),
  "fun.child-play": t("Излязох да играя и се прибрах чак по здрач.", "I went out to play and came home at dusk."),
  "fun.practice-music": t("Изсвирих мелодията от начало до край.", "I played the tune from start to finish."),
  "fun.drawing": t("Довърших един детайл от рисунката си.", "I finished a detail on my drawing."),
  "fun.digital-project": t("Поправих грешката и довърших проекта си.", "I fixed the issue and finished my project."),
  "fun.language-exchange": t("Използвах две нови думи в разговор и ги запомних.", "I used two new words in conversation and remembered them."),
  "fun.club": t("Танцувах в клуба до последната песен.", "I danced at the club until the last song."),
  "fun.bar": t("Излязох на бар и си тръгнах с покана за следващото излизане.", "I went out for a drink and left with another invitation."),
  "fun.dinner": t("На вечеря опитах ново ястие и си записах името му.", "I tried a new dish at dinner and wrote down its name."),
  "fun.cinema": t("Отидох на кино. Финалът на филма ме изненада.", "I went to the cinema. The ending surprised me."),
  "fun.theatre": t("Отидох на театър. Няколко реплики ми останаха в главата.", "I went to the theatre. A few lines stayed with me."),
  "fun.concert": t("На концерта пяхме последния припев с цялата публика.", "At the concert, the whole crowd sang the last chorus together."),
  "fun.escape-room": t("Намерих последната подсказка навреме в ескейп стаята.", "I found the last clue in the escape room just in time."),
  "fun.mall": t("Намерих дреха в мола, която върви с почти всичко в гардероба ми.", "I found something at the mall that goes with almost everything I own."),
  "aesthetics.hair": t("Смених прическата си. Огледах я във витрината на излизане.", "I got my hair done and checked it in a shop window on the way out."),
  "aesthetics.massage": t("Отидох на масаж и се почувствах по-спокойно.", "I got a massage and felt more at ease afterward."),
  "aesthetics.facial": t("Отидох на козметик и си записах кои продукти ми харесаха.", "I got a facial and wrote down the products I liked."),
  "aesthetics.nails": t("Пробвах необичаен за мен цвят на маникюра.", "I tried a manicure colour I would usually pass over."),
  "aesthetics.makeup": t("Пробвах два вида грим. Запазих снимка на любимия.", "I tried two make-up looks and kept a photo of my favourite."),
  "aesthetics.barber": t("Подстригах се късо и запазих снимка за следващия път.", "I got a short cut and kept a photo for next time."),
  "holidays.weekend": t("Прекарах уикенда в малка къща за гости.", "I spent the weekend at a small guesthouse."),
  "holidays.picnic": t("С Ели бяхме на пикник до залез.", "Eli and I stayed at the picnic until sunset."),
  "holidays.local": t("Разходих се по непознати улици и си набелязах място за следващия път.", "I explored unfamiliar streets and picked a place to visit next time."),
  "holidays.abroad": t("Пътувах в чужбина и за пръв път чух на живо езика от записите.", "I travelled abroad and heard the language from my recordings in person."),
  "market-morning": t("Помогнах на Ели на пазара. Тя ми даде 12 €.", "I helped Eli at the market. She gave me €12."),
  "tea-with-stefan": t("Със Стефан пихме чай и рисувахме в работилницата.", "I had tea with Stefan and sketched in the workshop."),
  rehearsal: t("Останах за последната песен на репетицията на Ники.", "I stayed for the last song at Niki’s rehearsal."),
  "extra-shift": t("Взех допълнителна смяна и спечелих 40 €.", "I took an extra shift and earned €40."),
  "call-rumi": t("Чух се с леля Руми. Пет минути се оказаха половин час.", "I called Aunt Rumi. Five minutes turned into half an hour."),
  "visit-home": t("Отидох до Трявна. Ели ми даде пакет за обратния път.", "I visited Tryavna. Eli gave me a parcel for the way home."),
};

const milestoneIds = new Set([
  "birth", "first-grade", "after-seventh", "adulthood", "local-graduation", "centenary", "131st-birthday",
  "life.work", "life.retire", "family.commit", "family.engage", "family.marry", "family.break-up", "family.baby",
  "child-birth", "family.adopt", "adoption.accept", "adoption-offer", "pets.adopt", "hospital.emergency",
  "bank.mortgage", "asset.home.buy", "asset.home.sell", "insurance.pension",
]);
const milestonePrefixes = [
  "loss-", "caregiver-", "health-", "pregnancy-", "life.study.", "life.work.", "bank.mortgage.",
  "school.enroll.", "school-diploma-", "university.enroll.", "degree-", "work.accept.", "work-end-", "scholarship-",
];

export function isJournalMilestone(event: Memory): boolean {
  return event.kind === "end" || Boolean(event.movedTo || event.startedCareer) || milestoneIds.has(event.id)
    || milestonePrefixes.some(prefix => event.id.startsWith(prefix));
}

function sentence(value: string): string {
  return /[.!?…][“”’"]?$/u.test(value) ? value : value + ".";
}

function lowerInitial(value: string): string {
  return value.charAt(0).toLowerCase() + value.slice(1);
}

function cityLine(event: Memory, l: Language): string | undefined {
  const prefix = "city-" + event.city + "-";
  if (!event.id.startsWith(prefix)) return;
  const { food, habit, voice } = cityCulture[event.city];
  const title = event.title[l];

  switch (event.id.slice(prefix.length)) {
    case "festival":
      return l === "bg" ? "Срещнах хора от квартала, докато течеше " + title + "."
        : "I ran into people from the neighbourhood at " + title + ".";
    case "food":
      return l === "bg" ? "Опитах " + food.bg + " и си поисках още."
        : "I tried " + food.en + " and asked for seconds.";
    case "place":
      return l === "bg" ? "Минах покрай " + placeAfterPreposition(title) + " и ми се прииска да се върна."
        : "I saw " + title + " with fresh eyes. I’d like to go back.";
    case "voice": {
      const phrase = voices[voice].phrase;
      return l === "bg" ? "В квартала чух „" + phrase.bg + "“"
        : "I overheard someone in the neighbourhood. “" + phrase.en + "”";
    }
    case "habit":
      return sentence(habit[l]);
  }
}

const walkPlaces: Readonly<Partial<Record<string, Text>>> = {
  "south-park": t("в Южния парк", "in South Park"),
  borisova: t("в Борисовата градина", "in Borisova Garden"),
  ariana: t("край езерото Ариана", "by Lake Ariana"),
  popa: t("около Попа", "near Popa"),
  vitoshka: t("по Витошка", "along Vitosha Boulevard"),
  "tryavna-centre": t("до Часовниковата кула в Трявна", "by Tryavna’s Clock Tower"),
  "tryavna-river": t("край реката в Трявна", "by the river in Tryavna"),
};

export function familyActivityLine(event: Memory, l: Language, life: GameState): string | undefined {
  if (event.kind !== "action" || !event.id.startsWith("people.")) return;
  const [, id, activity] = event.id.split(".");
  const relative = life.birthFamily?.relatives.find(member => member.id === id);
  const child = id.startsWith("child-") ? life.lifeSystems.family.childProfiles[Number(id.slice(6))] : undefined;
  const role = relative ? relativeLabel(relative)
    : child ? child.gender === "male" ? t("Син", "Son") : t("Дъщеря", "Daughter")
    : id === "rumi" ? t("Леля", "Aunt")
    : id === "niki" ? t("Братовчед", "Cousin") : null;
  if (!role || !event.text.bg.includes(" · ") || !event.text.en.includes(" · ")) return;
  const firstName = (lang: Language) => event.text[lang].split(/\s+/u)[0];
  const contact = t(role.bg.toLocaleLowerCase("bg") + " ми " + firstName("bg"), "my " + role.en.toLowerCase() + " " + firstName("en"));
  const moment = activityMoment(event, life.seed, true, contact);
  if (moment) return moment[l];
  if (activity === "family-story") {
    const city = life.birthCity;
    const withContact = (/^[сз]/iu.test(contact.bg) ? "със " : "с ") + contact.bg;
    const quote = l === "bg" ? event.text.bg.match(/„[^“]+“$/u)?.[0] : event.text.en.match(/“[^”]+”$/u)?.[0];
    const story = l === "bg" ? "Поговорих " + withContact + " за живота " + inCityBg(city) + " преди години."
      : "I talked with " + contact.en + " about what " + cities[city].name.en + " was like years ago.";
    return quote ? story + " " + sentence((l === "bg" ? "Остана ми в главата едно " : "I can still hear ") + quote) : story;
  }
  return personLine(event, l, contact[l]);
}

function personLine(event: Memory, l: Language, contactOverride?: string): string | undefined {
  if (event.kind !== "action" || !event.id.startsWith("people.")) return;
  const separator = " · ";
  const original = event.text[l];
  const contactEnd = original.indexOf(separator);
  if (contactEnd <= 0) return;

  // These action results start with the name as it was when the action happened.
  const contact = contactOverride ?? original.slice(0, contactEnd);
  const withContact = l === "bg" ? (/^[сз]/iu.test(contact) ? "със " : "с ") + contact : "with " + contact;
  const [, , activity, choice] = event.id.split(".");
  const option = event.title[l].split(separator).slice(1).join(separator);

  switch (activity) {
    case "walk": {
      const place = walkPlaces[choice]?.[l];
      if (place) return (l === "bg" ? "Разходих се " : "I went for a walk ") + withContact + " " + place + ".";
      if (choice === "local-" + event.city && option) {
        return l === "bg" ? "Разходих се " + withContact + " край " + placeAfterPreposition(option) + "."
          : "I went for a walk " + withContact + " near " + option + ".";
      }
      break;
    }
    case "gift":
      if (option) return l === "bg" ? "Подарих " + lowerInitial(option) + " на " + contact + "."
        : "I gave " + contact + " " + lowerInitial(option) + ".";
      break;
    case "give-money":
      if (/^\d+$/.test(choice) && option) return l === "bg" ? "Дадох " + option + " на " + contact + "."
        : "I gave " + contact + " " + option + ".";
      if (choice === "billa-voucher") return l === "bg" ? "Дадох ваучер за BILLA на " + contact + "."
        : "I gave " + contact + " a BILLA voucher.";
      if (choice === "old-leva") return l === "bg" ? "Подарих стари левове на " + contact + " за спомен."
        : "I gave " + contact + " some old leva as a keepsake.";
      break;
    case "ask-money":
      if (!option) break;
      if (event.cashDelta > 0) {
        const subject = contact.charAt(0).toUpperCase() + contact.slice(1);
        return l === "bg" ? subject + " ми даде " + option + "." : subject + " gave me " + option + ".";
      }
      return l === "bg" ? "Поисках пари от " + contact + ". Получих отказ."
        : "I asked " + contact + " for money and was turned down.";
    case "conversation":
      if (choice === "doner") return l === "bg" ? "Обсъдих " + withContact + " кой е правилният сос за дюнер."
        : "I debated the right döner sauce " + withContact + ".";
      if (choice === "week") return l === "bg" ? "Поговорих " + withContact + " за това как е минал денят ни."
        : "I talked " + withContact + " about how our day went.";
      if (choice === "music") return l === "bg" ? "Размених си препоръки за музика и сериали " + withContact + "."
        : "I swapped music and TV recommendations " + withContact + ".";
      if (choice === "plans") return l === "bg" ? "Обсъдих плановете за уикенда " + withContact + "."
        : "I discussed weekend plans " + withContact + ".";
      return (l === "bg" ? "Поговорих си " : "I caught up ") + withContact + ".";
    case "compliment":
      if (choice === "style") return l === "bg" ? "Похвалих стила на " + contact + "."
        : "I complimented " + contact + " on their style.";
      if (option) return l === "bg" ? "Похвалих " + contact + " " + lowerInitial(option) + "."
        : "I complimented " + contact + " on " + lowerInitial(option) + ".";
      break;
    case "insult":
      if (option) return l === "bg" ? sentence("Казах на " + contact + " " + option)
        : sentence("I told " + contact + " " + option);
      break;
    case "argue":
      return sentence((l === "bg" ? "Поспорих " : "I had an argument ") + withContact + (option ? " " + lowerInitial(option) : ""));
    case "fitness":
      if (choice === "outdoor") return l === "bg" ? "Тренирах на лостовете в квартала " + withContact + "."
        : "I worked out on the neighbourhood bars " + withContact + ".";
      if (option) return l === "bg" ? "Тренирах " + withContact + " в " + option + "."
        : "I worked out " + withContact + " at " + option + ".";
      break;
    case "family-time":
      return (l === "bg" ? "Прекарах време " : "I spent time ") + withContact + ".";
    case "family-story":
      return l === "bg" ? "Поговорих " + withContact + " за родния ми град."
        : "I talked " + withContact + " about my hometown.";
    case "cinema":
      return (l === "bg" ? "Отидох на кино " : "I went to the cinema ") + withContact + ".";
    case "coffee":
      return (l === "bg" ? "Хапнах баница и пих кафе " : "I had coffee and banitsa ") + withContact + ".";
    case "game":
    case "gaming":
      return (l === "bg" ? "Поиграх онлайн " : "I played online ") + withContact + ".";
    case "basketball":
      return (l === "bg" ? "Играх баскетбол " : "I played basketball ") + withContact + ".";
    case "park":
      return (l === "bg" ? "Разходих се в парка " : "I went for a walk in the park ") + withContact + ".";
    case "playground":
      return (l === "bg" ? "Отидох на площадката " : "I went to the playground ") + withContact + ".";
    case "board-game":
      return (l === "bg" ? "Играх настолна игра " : "I played a board game ") + withContact + ".";
    case "skate":
      return (l === "bg" ? "Карах колело " : "I went for a bike ride ") + withContact + ".";
    case "voice-note":
      return l === "bg" ? "Пратих гласово съобщение на " + contact + "."
        : "I sent " + contact + " a voice note.";
    case "bedtime":
      return l === "bg" ? "Прочетох приказка на " + contact + " преди лягане."
        : "I read " + contact + " a bedtime story.";
  }
}

export function journalLine(event: Memory, l: Language, family?: BirthFamily | null): string {
  const original = event.text[l];
  const town = cities[event.city].name.en;
  if (event.id === "birth" && event.age === 0) return original;
  if (event.id.startsWith("loss-")) {
    const relative = family?.relatives.find(person => "loss-" + person.id === event.id);
    if (!relative) return sentence(event.title[l]);
    const labels = relativeLabel(relative);
    return sentence((l === "bg" ? labels.bg + " ми " : "My " + labels.en.toLowerCase() + " ") + event.title[l]);
  }
  if (event.id === "death") return l === "bg" ? "Животът ми приключи." : "My life ended.";
  if (event.movedTo && (event.id.startsWith("move.") || event.id.startsWith("path.move."))) {
    return l === "bg" ? "Преместих се " + inCityBg(event.movedTo) + "."
      : "I moved to " + cities[event.movedTo].name.en + ".";
  }
  if (event.id === "first-grade") {
    const school = cityPaths[event.city].schools[0]?.name[l];
    if (school && original.includes(school)) return l === "bg" ? "Тръгнах в първи клас в " + school + "."
      : "I started first grade at " + school + ".";
  }
  if (event.id === "local-graduation") return l === "bg" ? original.replace(/^Завърши обучението си/, "Завърших обучението си")
    : original.replace(/^You graduated/, "I graduated");
  if (event.id.startsWith("life.study.")) return l === "bg" ? original.replace(/^Записа се/, "Записах се")
    : original.replace(/^You enrolled/, "I enrolled");
  if (event.id.startsWith("life.work.")) {
    const job = jobTypes[event.id.slice("life.work.".length) as JobId]?.label[l];
    if (job) return l === "bg" ? "Започнах работа на позиция „" + job + "“ " + inCityBg(event.city) + "."
      : "I started a new job in " + town + " as a " + lowerInitial(job) + ".";
  }
  if (event.id === "bank.mortgage" || event.id.startsWith("bank.mortgage.")) {
    const [purchase] = original.split(l === "bg" ? ". То влиза" : ". It becomes");
    return sentence(l === "bg" ? purchase.replace(/^Подписа покупката на жилище/, "Купих жилище с ипотека")
      : purchase.replace(/^You bought a home/, "I bought a home with a mortgage"));
  }
  if (event.id === "asset.home.buy") {
    return l === "bg" ? "Купих жилище " + inCityBg(event.city) + "." : "I bought a home in " + town + ".";
  }
  if (event.id.startsWith("asset.realty.")) {
    const financing = event.id.startsWith("asset.realty.mortgage.");
    return l === "bg" ? "Купих " + lowerInitial(event.title.bg) + (financing ? " с ипотека " : " ") + inCityBg(event.city) + "."
      : "I bought a " + lowerInitial(event.title.en) + (financing ? " with a mortgage in " : " in ") + town + ".";
  }
  if (event.id.startsWith("asset.transfer.")) {
    return l === "bg" ? original.replace(/^Прехвърли /u, "Прехвърлих ") : original.replace(/^You transferred /u, "I transferred ");
  }
  if (event.id.startsWith("asset.")) {
    const [, action, id] = event.id.split(".");
    const good = goodIds.find(key => key === id);
    if (good || id === "home") {
      const label = good ? (goods[good].branded ? goods[good].title[l] : lowerInitial(goods[good].title[l]))
        : l === "bg" ? "жилището си" : "my home";
      if (action === "buy") return (l === "bg" ? "Купих " : "I bought a ") + label + ".";
      if (action === "sell") return (l === "bg" ? "Продадох " : "I sold my ") + label + ".";
      if (action === "pawn") return (l === "bg" ? "Заложих " : "I pledged ") + label + ".";
      if (action === "release") return (l === "bg" ? "Откупих " : "I redeemed ") + label + ".";
      if (action === "repair") return (l === "bg" ? "Поддържах " : "I serviced ") + label + ".";
      if (action === "upgrade") return (l === "bg" ? "Обнових " : "I upgraded ") + label + ".";
      if (action === "forfeit") return (l === "bg" ? "Изпуснах срока и загубих " : "The pledge expired and I lost ") + label + ".";
    }
    const fund = fundIds.find(key => key === id);
    if (fund) {
      const label = lowerInitial(funds[fund].title[l]);
      if (action === "invest") return (l === "bg" ? "Вложих средства в " : "I invested in the ") + label + ".";
      if (action === "redeem") return (l === "bg" ? "Продадох дяловете си от " : "I sold my holdings in the ") + label + ".";
    }
  }
  if (event.id === "local-walk") {
    const landmark = cities[event.city].landmark[l];
    return l === "bg" ? "Разходих се без план и стигнах до " + placeAfterPreposition(landmark) + "."
      : "I went out for a walk and ended up near " + landmark + ".";
  }

  if (event.id.startsWith("social.") && event.id.endsWith(".register")) {
    const platform = event.title[l].split(" · ").at(-1);
    if (platform) return l === "bg" ? "Направих си профил в " + platform + "."
      : "I set up a profile on " + platform + ".";
  }

  return diaryLines[event.id]?.[l] ?? cityLine(event, l) ?? personLine(event, l) ?? original;
}
