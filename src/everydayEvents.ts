import { currentCaregiver } from "./birthFamily.ts";
import { placeAfterPreposition } from "./cities.ts";
import { cityCulture } from "./cityCulture.ts";
import type { GameState, Memory, Text } from "./engine.ts";
import { lifeDraw } from "./mortality.ts";
import { isKnownPerson, personAge, personName, type PeopleId } from "./peopleIdentity.ts";

const t = (bg: string, en: string): Text => ({ bg, en });
type Episode = readonly [id: string, bg: string, en: string];

const toddlers: Episode[] = [
  ["blanket", "Одеялото ми вече идва с мен навсякъде. Опитаха се да го изперат, без да забележа. Забелязах.", "My blanket started coming everywhere with me. Someone tried to wash it without me noticing. I noticed."],
  ["spoon", "Настоях да държа лъжицата. Половината закуска стигна до мен, другата половина до масата.", "I insisted on holding the spoon. Half my breakfast made it to me. The table got the rest."],
  ["photo", "За семейната снимка всички гледаха към фотоапарата. Аз гледах човека, който се опитваше да ме разсмее отстрани.", "Everyone looked at the camera for the family photo. I looked at the person trying to make me laugh from the side."],
  ["drawer", "Открих чекмеджето с тенджерите. Стана ясно, че две капачета са напълно достатъчни за концерт.", "I discovered the pan drawer. It turns out two lids are enough to put on a concert."],
  ["puddle", "Навън открих една локва. Вкъщи откриха колко вода се събира в две малки обувки.", "Outside I discovered a puddle. At home they discovered how much water two little shoes could hold."],
  ["song", "Запомних края на една песничка. Вече се включвам всеки път, малко преди края.", "I learned the end of a song. I join in slightly before the ending every time now."],
  ["book", "Харесах си една страница от книжката. Вкъщи я отварят направо там, когато имаме малко време.", "I picked a favourite page in my picture book. At home they open straight to it when there's only a little time."],
  ["hide", "За първи път се скрих зад пердето и зачаках. Разсмяха се точно когато си помислих, че от мен няма и следа.", "I hid behind the curtain and waited. They laughed just as I thought I'd disappeared from the world."],
];

const childhood: Episode[] = [
  ["chalk", "Нарисувахме град с тебешир на тротоара. До вечерта имаше две улици, три пекарни и един светофар със собствен пазач.", "We drew a town in chalk on the pavement. By evening it had two streets, three bakeries and a traffic light with its own guard."],
  ["shop", "За първи път преброих рестото от магазина. Запомних колко струва хлябът, а стотинката запазих за късмет.", "I counted the change from the shop for the first time. I remembered the price of bread and kept the small coin for luck."],
  ["kite", "Направих хвърчило от каквото намерих вкъщи. Излетя чак когато престанах да тичам след него.", "I made a kite out of things I found at home. It took off only when I stopped running after it."],
  ["cake", "Помогнах с тестото вкъщи и получих право да обера купата. Май това беше истинската ми причина да помагам.", "I helped with the batter and got to scrape the bowl. That might have been my reason for helping all along."],
  ["trade", "Размених две картинки от албума за тази, която търсех. После открих, че я има и в джоба на якето ми.", "I traded two stickers for the one I wanted. Later I found another copy in my coat pocket."],
  ["snow", "Първият сняг затрупа стъпките ни. Излязохме пак, за да оставим нови.", "The first snow covered our footsteps. We went out again to leave new ones."],
  ["library-card", "В читалището си избрах книжка само по корицата. Наложи се да я върна, преди да си дочета последната глава.", "I picked a book at the community library just by its cover. I had to return it before I got to the last chapter."],
  ["lost-ball", "Топката се озова зад ограда. Намерихме кой има ключа и се оказа, че утре и той иска да играе.", "Our ball ended up behind a fence. We found the person with the key, and he wanted to play the next day too."],
  ["bus", "В автобуса отстъпих мястото си. Жената ми показа през прозореца къде е била старата спирка.", "I gave up my seat on the bus. The woman pointed out where the old stop used to be."],
  ["radio", "Опитах да запиша любимата си песен от радиото. В началото се чува как някой вика, че вечерята е готова.", "I tried recording a favourite song off the radio. At the beginning you can hear someone calling that dinner is ready."],
  ["garage", "Събрахме части от два счупени комплекта. От тях излезе машина, която никой от нас не може да обясни.", "We joined parts from two broken sets. We made a machine that none of us can explain."],
  ["seed", "Посадих семка в саксия и я проверявах всяка сутрин. Поникна точно когато се отказах да я гледам.", "I planted a seed in a pot and checked it every morning. It came up just when I gave up watching it."],
];

const teens: Episode[] = [
  ["chat", "Изпратих съобщение в грешния групов чат. Вече имаме нова вътрешна шега, макар че още ми е малко неудобно.", "I posted a message in the wrong group chat. We have a new running joke now, though I'm still a little embarrassed."],
  ["playlist", "Направих плейлист за разходките си и го пратих на приятели. Три дни по-късно ми върнаха същия списък с двойно повече песни.", "I made a playlist for my walks and shared it. Three days later it came back with twice as many songs."],
  ["rain", "Намокрих се до кости, защото обещах, че съм на две минути. По пътя разбрах колко разтегливо понятие са две минути.", "I got soaked after promising I was two minutes away. I found out just how flexible two minutes can be."],
  ["first-style", "Пробвах прическа, която изглеждаше чудесно на снимка. Прекарах сутринта в търсене на подходяща шапка.", "I tried a haircut that looked great in the picture. I spent the morning looking for the right hat."],
  ["market-help", "Помогнах да приберат щанд преди дъжда. Следващия път ме познаха и ми оставиха да избера първо.", "I helped pack up a stall before the rain. Next time they recognised me and let me pick first."],
  ["show", "Излязох да видя местна група. Певецът забрави един куплет и публиката му го припомни.", "I went to see a local band. The singer forgot a verse and the crowd sang it back to him."],
  ["dinner", "Обещах да направя вечерята самостоятелно. Първата палачинка се разпадна, но останалите стигнаха до масата.", "I offered to make dinner myself. The first pancake fell apart. The rest made it to the table."],
  ["plans", "Разговорът за бъдещето започна с големи планове. На финала единственото сигурно решение беше къде ще ядем дюнери.", "The conversation about the future started with big plans. The only thing we decided for sure was where to get a döner."],
  ["pitch", "Уговорих се да гледам мач и накрая ме сложиха на вратата. Справих се до последната минута.", "I turned up to watch a match and ended up in goal. I did all right until the last minute."],
  ["volunteer", "Занесох стари книги за размяна. Прибрах се с три, които изобщо не търсех.", "I took some old books to a swap. I came home with three I hadn't gone looking for."],
];

const youngAdults: Episode[] = [
  ["receipt", "Започнах да пазя касовите бележки за месеца. Оказа се, че най-много ми струват дребните покупки по пътя.", "I started keeping receipts for a month. It was the little purchases on the way home I'd underestimated most."],
  ["keys", "Изгубих ключовете и извървях целия си маршрут наобратно. Бяха в другото отделение на чантата.", "I lost my keys and retraced my whole route. They were in the other pocket of my bag."],
  ["potluck", "Занесох домашно ядене на обща вечеря. Един човек поиска рецептата, друг поиска направо останалото.", "I brought a homemade dish to dinner. One person asked for the recipe. Another asked for the leftovers."],
  ["ride", "На връщане с автобуса се заговорих с човека до мен. Слязох една спирка по-късно, за да чуя края на историята.", "I got talking to the person beside me on the bus. I went a stop too far to hear the end of their story."],
  ["letter", "Намерих бележка от преди няколко години с планове за бъдещето. Най-добре се е сбъднал този, който тогава изглеждаше най-лесен.", "I found an old note with my plans for the future. The one that seemed easiest back then has worked out best."],
  ["repair", "Отворих уреда, за да видя защо не тръгва. Сглобих го обратно, а на масата остана един винт за спомен.", "I opened up an appliance to see why it wouldn't start. I put it back together and had one screw left over."],
  ["flat", "Пренаредих стаята, за да има място за маса. Оказа се, че всичко може, стига вратата да се отваря само наполовина.", "I rearranged the room to fit a table. It all worked if I only opened the door halfway."],
  ["borough", "Спрях за кафе в квартал, през който обикновено само минавам. Записах си мястото, защото ми се иска пак да имам повод да спра.", "I stopped for coffee in a neighbourhood I normally pass through. I saved the spot so I'd have a reason to stop again."],
  ["meet", "Уговорих се да видя приятели след повече от година. Говорихме си сякаш последно сме се видели вчера.", "I arranged to see some friends after more than a year. We talked as if we'd last met yesterday."],
  ["photo-album", "Извадих снимка от телефона и я сложих в рамка. Оказа се, че цяла вечер се връщам към нея.", "I took a photo off my phone and put it in a frame. I kept going back to it all evening."],
];

const adults: Episode[] = [
  ["building", "На събранието на входа започнахме с въпрос за лампата. Два часа по-късно лампата още не светеше, но вече знаех историите на половината съседи.", "The building meeting started with a question about the hallway light. Two hours later the light still didn't work, but I knew half my neighbours' stories."],
  ["recipe", "Възстанових една стара рецепта по бележки от тетрадка. По телефона разбрах, че „малко“ при нас означава поне двойно повече.", "I pieced together an old recipe from a notebook. A phone call confirmed that in our house, 'a little' means at least twice as much."],
  ["wrong-bag", "Прибрах се с торбата на друг човек от пазара. Разменихме си покупките и си казахме откъде е най-хубавото сирене.", "I came home with someone else's bag from the market. We swapped groceries and traded tips on where to get the best cheese."],
  ["door", "Помогнах на съсед да пренесе една маса. На последния завой се сетихме, че краката ѝ се свалят.", "I helped a neighbour carry a table. At the last corner we remembered that the legs come off."],
  ["box", "Разчистих една кутия с документи. Хвърлих гаранция от отдавна счупен уред и запазих билета от едно пътуване.", "I cleared out a box of paperwork. I threw away a warranty for something long broken and kept a ticket from a trip."],
  ["market-list", "Влязох на пазара за две неща. Навън проверих списъка. Имах всичко освен точно тези две неща.", "I went to the market for two things. Outside I realised I'd bought pretty much everything except those two things."],
  ["plant", "Реших да гледам домати на терасата. Досега най-добре се развива колчето, което купих да ги подпира.", "I tried growing tomatoes on the balcony. So far the stake I bought to support them is doing best."],
  ["walk-home", "Тръгнах пеша до вкъщи и хванах залеза между две сгради. Оттогава понякога нарочно пропускам автобуса.", "I walked home and caught the sunset between two buildings. Since then I sometimes skip the bus on purpose."],
  ["evening", "Изключих телефона за една вечер. На сутринта почти всичко се оказа също толкова спешно, колкото и преди.", "I turned my phone off for one evening. In the morning almost everything was exactly as urgent as before."],
  ["neighbourhood-sign", "Забелязах стара табела зад витрината на един магазин. Собственикът ми показа снимка как е изглеждала улицата преди ремонта.", "I noticed an old sign behind a shop window. The owner showed me a photo of the street before it was redone."],
  ["umbrella", "Дадох чадъра си на човек на спирката. След седмица той ме позна и ми го върна с картичка отвътре.", "I lent my umbrella to someone at the bus stop. A week later they recognised me and returned it with a card tucked inside."],
  ["club", "Влязох в читалището да видя една изложба. Останах да помогна да окачат последната рамка.", "I went into the community centre to see an exhibition. I stayed to help hang the last frame."],
];

const laterYears: Episode[] = [
  ["old-map", "Докато преглеждах стари снимки, се сетих за улица, която вече изглежда съвсем различно. Излязох да видя дали ще позная мястото.", "Looking through old photos reminded me of a street that looks completely different now. I went out to see if I still recognised it."],
  ["jam", "Направих сладко и надписах бурканите с годината. Един буркан изчезна, преди да успея да го надпиша.", "I made jam and marked the jars with the year. One disappeared before I could label it."],
  ["bench", "На пейката се заговорих с човек, когото все срещам на същото място. Чак сега научих как се казва.", "I got talking to someone on a bench whom I always see in the same spot. Only now did I learn their name."],
  ["shortcuts", "Показах на съсед по-късия път до пазара. На връщане той ми показа още по-къс.", "I showed a neighbour the short way to the market. On the way back they showed me a shorter one."],
  ["recording", "Записах две истории от семейството, докато още ги помня ясно. Вторият запис завършва със звънеца и разговор за вечерята.", "I recorded two family stories while I still remembered them clearly. The second recording ends with the doorbell and a discussion about dinner."],
  ["bread", "Извадих старата тава и опекох хляб. Някой почука точно навреме за първата топла филия.", "I got out the old tin and baked bread. Someone knocked just in time for the first warm slice."],
  ["heard", "През прозореца чух песен от едно време. Цял следобед си спомнях къде я чух за първи път.", "I recognised a song out of the window that I hadn't heard in years. I spent the afternoon remembering where I'd first heard it."],
  ["letters", "Подредих стари писма. Почеркът ми от едно време ми се стори по-четлив от този на бележката, която написах сутринта.", "I sorted some old letters. My handwriting from years ago seemed neater than the note I wrote this morning."],
  ["bird", "Една птица каца всяка сутрин на перваза. Оказа се, че като закъснее, я чакам.", "A bird lands on my sill every morning. I discovered that when it's late, I wait for it."],
  ["trolley", "Видях, че продават същите чаши, каквито имах вкъщи преди години. Купих една и пак я сложих на старото място.", "I saw the same cups I used to have at home years ago. I bought one and put it back in its old spot."],
];

const schoolNotes: Episode[] = [
  ["chalkboard", "Излязох на дъската и забравих първата дума. После видях, че половината клас ми я подсказва с устни.", "I went up to the board and forgot the first word. Then I saw half the class mouthing it to me."],
  ["lost-homework", "Домашното ми беше в другата тетрадка. За пръв път това беше вярно и точно тогава никой не повярва.", "My homework was in my other notebook. For once it was true, and of course no one believed me."],
  ["recess", "В междучасието довършихме играта отпреди звънеца. Утре ще започнем от мястото, където спряхме.", "At break we finished the game we'd started before the bell. Tomorrow we'll pick up where we left off."],
];

const shared: Episode[] = [
  ["wind", "Един порив размяташе торбите на пазара. Събрахме ги с хората от съседния щанд, преди дъждът да ни разпръсне.", "A gust scattered bags round the market. We gathered them with the next stall just before the rain scattered us."],
  ["local-window", "На улична сергия намерих стара пощенска картичка от собствения си град. Наум отбелязах кое още изглежда същото.", "I found an old postcard of my own town at a stall. I made a mental note of what still looked the same."],
  ["shared-food", "Вкъщи опитахме да приготвим нещо по рецепта на съседите. Те ни показаха на другия ден как става по-лесно.", "We tried making one of the neighbours' recipes at home. They showed us an easier way the next day."],
];

function stageEpisodes(age: number): Episode[] {
  if (age < 4) return toddlers;
  if (age < 13) return childhood;
  if (age < 19) return teens;
  if (age < 30) return youngAdults;
  if (age < 65) return adults;
  return laterYears;
}

function personalEpisodes(s: GameState): Episode[] {
  const out: Episode[] = [];
  const caregiver = s.age < 8 ? currentCaregiver(s) : undefined;
  if (caregiver) {
    const bg = caregiver.name.bg.split(" ")[0], en = caregiver.name.en.split(" ")[0];
    out.push(["caregiver-book", bg + " ми чете приказка, докато заспя. На другата вечер поисках да я започнем от същото място.",
      en + " read me a story until I fell asleep. The next evening I asked to start from the same page."]);
  }
  const friend: PeopleId = "friend";
  if (s.age >= 7 && isKnownPerson(s, friend) && !s.deceased[friend]) {
    const name = personName(s, friend);
    out.push(["friend-call", name.bg + " се обади уж за малко. Когато затворихме, вече имахме две идеи за среща.",
      name.en + " called for a quick chat. By the time we hung up, we had two ideas for meeting up."]);
  }
  const partner = s.lifeSystems.family.partner;
  if (partner && !s.deceased[partner]) {
    const name = personName(s, partner);
    out.push(["partner-box", "С " + name.bg + " намерихме снимка от първите ни срещи. Помнехме вечерта по два съвсем различни начина.",
      "I found a photo from our first dates with " + name.en + ". We remembered the evening completely differently."]);
    out.push(["partner-dinner", "Уговорихме се с " + name.bg + " да приготвим вечерята заедно. Поръчахме пица едва след втория опит.",
      name.en + " and I tried to make dinner together. We only ordered pizza after the second attempt."]);
  }
  for (let index = 0; index < s.lifeSystems.family.childProfiles.length; index++) {
    const id = "child-" + index as PeopleId;
    const age = personAge(s, id);
    if (age !== null && age >= 4 && age <= 11 && !s.deceased[id]) {
      const name = personName(s, id);
      out.push(["child-drawing", name.bg + " ми подари рисунка за хладилника. След кратко обяснение разбрах, че къщата на нея е нашата.",
        name.en + " gave me a drawing for the fridge. After a quick explanation, I learned the house in it was ours."]);
      break;
    }
  }
  if (s.age >= 7 && (s.path ? s.path.school.grade !== null && s.path.school.enrolled && !s.path.school.left
    : s.enrollment && s.age < s.enrollment.graduationAge)) out.push(...schoolNotes);
  if (s.path?.work.job || s.localJob || (s.career !== "student" && !s.retirement && !s.path)) {
    out.push(["work-day", "На работа показах на колега как правя една досадна задача. След час ми показа как става с наполовина по-малко стъпки.",
      "I showed a colleague how I do an annoying task at work. An hour later they showed me how to do it in half as many steps."]);
  }
  const place = cityCulture[s.city].places[Math.floor(lifeDraw(s.seed, s.age, 0x184bf5d9) * cityCulture[s.city].places.length)];
  if (s.age >= 4 && place) {
    out.push(["place-" + s.city, "Минахме покрай " + placeAfterPreposition(place.bg) + " и спряхме да снимаме. На снимката остана и едно куче, което реши да застане отпред.",
      "We stopped for a picture near " + place.en + ". A dog decided to stand in front and made it into the photo."]);
    if (s.age >= 7) out.push(["food-" + s.city, "Опитах " + cityCulture[s.city].food.bg + " на гости. На тръгване ми показаха откъде си вземат продуктите.",
      "I tried " + cityCulture[s.city].food.en + " while visiting someone. On the way out they showed me where they buy the ingredients."]);
  }
  return out;
}

export function everydayEvents(s: GameState, opening: Memory[]): Memory[] {
  if (opening.some(event => /^(health-|loss-|caregiver-|pregnancy-loss$)/.test(event.id))) return [];
  const lostSomeone = s.age >= 6 && s.history.some(event => event.age === s.age - 1 && event.id.startsWith("loss-"));
  if (lostSomeone && !opening.length) return [{
    age: s.age, city: s.city, kind: "event", id: "diary-remembrance", title: t("Спомени", "Remembering"),
    text: t("Прегледах старите снимки. Записах си една история, която все си обещавам да не забравям.",
      "I looked through some old photos and wrote down a story I've been promising myself I'd remember."),
    witnesses: [], cashDelta: 0,
  }];
  if (lostSomeone) return [];
  const hasStory = Boolean(s.sceneId && s.choiceId === null);
  const roll = lifeDraw(s.seed, s.age, 0xd99cc41f);
  if (s.age > 1 && !opening.length && !hasStory && roll < .065) return [];
  const desired = roll < .8 ? 2 : 1;
  const count = Math.max(0, desired - opening.length);
  const recent = new Set(s.history.filter(event => event.age >= s.age - 8).map(event => event.id));
  const stage = stageEpisodes(s.age);
  const personal = personalEpisodes(s);
  const pools = [s.age >= 4 && lifeDraw(s.seed, s.age, 0xd44b23da) < .45 ? [...personal, ...stage] : stage,
    [...personal, ...stage, ...(s.age >= 7 ? shared : [])]];
  const notes: Memory[] = [];
  for (let i = 0; i < count; i++) {
    const candidates = pools[i].filter(([id]) => !recent.has("diary-" + id));
    const available = [...personal, ...stage].filter(([id]) => !notes.some(note => note.id === "diary-" + id));
    const pool = candidates.length ? candidates : available;
    const selected = pool[Math.floor(lifeDraw(s.seed, s.age, 0x1fbc0af7 + i * 73) * pool.length)];
    if (!selected) continue;
    const [key, bg, en] = selected;
    const id = "diary-" + key;
    notes.push({ age: s.age, city: s.city, kind: "event", id, title: t("Случка", "A moment"), text: t(bg, en), witnesses: [], cashDelta: 0 });
    recent.add(id);
  }
  return notes;
}

const quietLines = [
  t("Най-голямото събитие беше, че се сетих защо влязох в стаята. Веднъж от цялата година.", "The high point was remembering why I'd walked into a room. Once all year."),
  t("Годината ми остави само една загадка. Къде отива другият чорап?", "The year left me one mystery. Where does the other sock go?"),
  t("Тази година и съседите нямаха какво да разкажат. Това вече си е събитие.", "Even the neighbours had nothing to report this year. That was an event in itself."),
  t("Най-дългият ми спор беше дали да изляза с яке. Якето спечели.", "My longest debate was whether to take a jacket. The jacket won."),
  t("Най-големият обрат беше, че автобусът дойде точно когато стигнах до спирката.", "The biggest twist was that the bus arrived just as I reached the stop."),
];
const littleQuietLines = [
  t("Тази година беше тиха. Поне докато не се чу песничката за лягане.", "A quiet year. At least until the bedtime song started."),
  t("Най-голямата драма беше изчезналият чорап. За щастие другият си беше тук.", "The year's biggest drama was a missing sock. The other one was still here, fortunately."),
  t("По-спокойна година. Любимата ми играчка още държи първото място.", "A quieter year. My favourite toy is still in first place."),
];

export function quietYear(seed: number, age: number): Text {
  const pool = age < 5 ? littleQuietLines : quietLines;
  return pool[Math.floor(lifeDraw(seed, age, 0xc6c897b1) * pool.length)];
}
