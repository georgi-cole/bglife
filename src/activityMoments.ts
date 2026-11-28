import { cityPlaces } from "./cityLife.ts";
import type { Memory, Text } from "./engine.ts";

const t = (bg: string, en: string): Text => ({ bg, en });

// These are possible in-game memories. Named works are not tied to an airing schedule.
const moments: Readonly<Record<string, readonly Text[]>> = {
  takeaway: [
    t("Поръчахме дюнери{with} и си пуснахме „Ергенът“. От дивана и двамата бяхме големи разбирачи.", "We ordered döners{with} and put on The Bachelor. From the couch, we were both experts."),
    t("Пуснахме си „Ергенът: Любов в рая“{with} и спорихме за двойките, докато вечерята изстина.", "We watched The Bachelor: Love in Paradise{with} and debated the couples until dinner went cold."),
    t("Вечеряхме{with} пред „Вяра, надежда, любов“. Обещахме си един епизод и пуснахме втори.", "We ate dinner{with} while watching Faith, Hope, Love. We said one episode and started a second."),
    t("Пуснахме си „Под прикритие“{with} и чакахме поръчката, без да станем от дивана.", "We put on Undercover{with} and waited for the takeaway without leaving the couch."),
    t("Гледах „Игри на волята“{with} над кутия пица. Лесно е да даваш тактически съвети от дивана.", "I watched Games of Will{with} over a box of pizza. Tactical advice comes easily from a sofa."),
  ],
  cinema: [
    t("Гледах „Гунди – Легенда за любовта“{with}. На излизане още говорехме за филма.", "I watched Gundi: Legend of Love{with}. We were still talking about the film on the way out."),
    t("Взех билет за български филм{with}. На финала залата остана тиха, докато тръгнаха надписите.", "I got a ticket to a Bulgarian film{with}. The room stayed quiet until the credits rolled."),
    t("Гледах прожекция на „Вчера“{with}. Историята за училището ни върна към наши случки.", "I saw a screening of Yesterday{with}. The school story brought back stories of our own."),
  ],
  theatre: [
    t("Гледах постановка по „Опит за летене“. После ми се прииска пак да чета Радичков.", "I saw a staging of An Attempt to Fly and wanted to read Radichkov again afterwards."),
    t("На „Балкански синдром“ се засмях малко по-силно, отколкото смятах.", "I laughed a bit louder than I meant to at Balkan Syndrome."),
  ],
  concert: [
    t("Слушах Любо Киров на живо{with}. Последния припев го довърши публиката.", "I heard Lyubo Kirov live{with}. The audience finished the last chorus."),
    t("Отидох на концерт на „Молец“{with}. На тръгване си запазих една песен за пътя.", "I went to a Molec concert{with} and saved a song for the ride home."),
    t("Слушах джаз на живо{with}. Останахме и за последното парче.", "I heard some live jazz{with}. We stayed for the last number."),
  ],
  "conversation.music": [
    t("Размених си препоръки{with}. Запазих си епизод на „Говори ѝнтернет“ за път.", "I swapped recommendations{with} and saved an episode of Govori Internet for the road."),
    t("Обсъдих епизод от Ratio Podcast{with}. Накрая си изпратихме още два линка.", "I discussed an episode of Ratio Podcast{with}. By the end we had sent each other two more links."),
    t("Поговорих{with} за „Игри на волята“. Никой от нас нямаше да избере същата стратегия.", "I talked about Games of Will{with}. Neither of us would have picked the same strategy."),
  ],
  gaming: [
    t("Играх онлайн белот{with}. До третата ръка всеки вече обясняваше как се играе правилно.", "I played Bulgarian belote online{with}. By the third hand everyone was explaining the proper way to play."),
    t("Пуснахме онлайн мач{with}. Някой от отбора поиска пауза за вечеря точно когато започнахме да печелим.", "I played an online match{with}. Someone asked for a dinner break just as we started winning."),
  ],
  coffee: [
    t("Пих кафе{with} и си взех топла баница със сирене. Поприказвахме и след като кафето изстина.", "I had coffee{with} and got a warm cheese banitsa. We kept talking after the coffee went cold."),
    t("Закусих{with} с баница и айрян. За следващата среща си харесахме друга пекарна.", "I had banitsa and ayran for breakfast{with}. We picked another bakery for next time."),
  ],
  "fun.dinner": [
    t("Поръчах бавно печено агнешко с булгур. Записах си какво сложиха към него, за да го пробвам у дома.", "I ordered slow-roasted lamb with bulgur and made a note of the side so I could try it at home."),
    t("Опитах ресторантска версия на пататник. Спорът дали е по-хубав с джоджен остана за друг път.", "I tried a restaurant take on patatnik, the potato dish. The debate about mint can wait for another day."),
    t("Взех си лозови сарми и домашно кисело мляко. Не остана нищо за опаковане.", "I ordered stuffed vine leaves and homemade yoghurt. There was nothing left to take home."),
  ],
  "fun.bar": [
    t("Взех си крафт бира от българска пивоварна. Обсъждахме етикета почти колкото вкуса.", "I tried a craft beer from a Bulgarian brewery. We discussed the label almost as much as the taste."),
    t("Поръчах лимонада с бъз. На съседната маса играеха табла и брояха кой черпи следващия път.", "I ordered an elderflower lemonade. At the next table, they played backgammon to decide who would treat everyone next time."),
  ],
  "fun.club": [
    t("Диджеят смеси хаус с български фолклорен семпъл. Реших да остана за още едно парче.", "The DJ mixed house with a Bulgarian folk sample. I decided to stay for one more track."),
    t("Попаднах на вечер с български поп хитове от 2000-те. Някои още ги знаех наизуст.", "I ended up at a night of Bulgarian pop from the 2000s. I still knew some of the songs by heart."),
  ],
  "holidays.picnic": [
    t("Взехме питка, лютеница и шарена сол за пикника. Първо изчезна питката.", "We brought bread, lyutenitsa and Bulgarian herb salt to the picnic. The bread disappeared first."),
    t("Напълних термоса с домашен айрян. На одеялото имаше и череши, които се оказаха най-добрата идея.", "I filled a flask with homemade ayran. The cherries on the picnic blanket turned out to be the best idea."),
  ],
  "holidays.weekend": [
    t("Намерих къща за гости с двор, а стопаните оставиха домашни мекици за закуска.", "I found a guesthouse with a courtyard. The hosts left homemade mekitsi for breakfast."),
    t("Сутринта в къщата за гости имаше топла питка и буркан сладко от смокини.", "There was warm bread and a jar of fig jam at the guesthouse in the morning."),
  ],
  "holidays.local": [
    t("Влязох в малък етнографски музей и на излизане си взех картичка от града.", "I stopped at a small ethnographic museum and took a town postcard home."),
    t("Спрях на пазара в града, в който се разхождах. Прибрах се с домашен мед и идея за следващия маршрут.", "I stopped at the market in the town I visited and came home with local honey and an idea for the next trip."),
  ],
  "holidays.abroad": [
    t("От пътуването донесох магнит за хладилника и снимка на менюто, в което открих нещо като нашата баница.", "I brought back a fridge magnet and a photo of the menu where I found something like Bulgarian banitsa."),
    t("Отворих снимките от пътуването още по пътя към вкъщи. Половината бяха на улични табели и пекарни.", "I opened my travel photos on the way home. Half were street signs and bakeries."),
  ],
  "gym.walk": [
    t("Разходих се в района около „{place}“. По обратния път минах през пекарната.", "I went for a walk near {place} and passed the bakery on the way home."),
    t("Излязох на обиколка край „{place}“. Хареса ми колко е спокойно сутринта.", "I took a loop near {place}. I liked how quiet it was in the morning."),
  ],
  "gym.run": [
    t("На бягането си пуснах Ratio Podcast. Епизодът свърши точно с последната обиколка.", "I put on Ratio Podcast for my run. The episode finished on my last lap."),
    t("Тичах в района около „{place}“. Накрая успях да не спирам на баира.", "I ran near {place}. This time I managed not to stop on the hill."),
  ],
  "gym.weights": [
    t("В кварталната зала си записах сериите в тефтер. Накрая ми показаха как да си наглася лежанката.", "I logged my sets in a notebook at the neighbourhood gym. Someone showed me how to set up the bench."),
    t("Направих последната серия на българския плейлист на залата. Записах си килограмите за следващия път.", "I finished my last set to the gym's Bulgarian playlist and wrote down the weights for next time."),
  ],
  "gym.hiit": [
    t("На интервалите треньорът все викаше „айде, още малко“. От последното „малко“ мина цяла минута.", "During intervals the coach kept calling 'come on, a little more.' The last little bit lasted a whole minute."),
    t("Съседът ми по постелка водеше със секунди. След тренировката сравнихме пулса, а не резултата.", "My neighbour on the mat was ahead by seconds. After the workout we compared our pulse, not our scores."),
  ],
  "gym.crossfit": [
    t("Тренирах с хора от квартала. След финала някой донесе айрян и най-после спряхме да броим повторения.", "I trained with people from the neighbourhood. Afterwards someone brought ayran and we finally stopped counting reps."),
    t("Последното предизвикателство беше със скачане на въже. За секунди се върнах в училищния двор.", "The last challenge was skipping rope. For a moment I was back in the schoolyard."),
  ],
  "fun.practice-music": [
    t("Опитах да изсвиря „Хубава си, моя горо“ без да гледам нотите. Втория път се получи.", "I tried playing Fair Is My Forest without looking at the notes. The second try went better."),
    t("Упражнявах ритъма на ръченица. Първо го плясках с ръце, после се върнах към инструмента.", "I practised a rachenitsa rhythm. I clapped it first, then went back to my instrument."),
  ],
  "fun.drawing": [
    t("Нарисувах покривите и улиците около „{place}“ по памет. Накрая добавих куче, което не беше там.", "I drew the roofs and streets around {place} from memory. At the end I added a dog that wasn't there."),
    t("Пробвах да измисля шарка като на стара българска престилка. Получи ми се само средната ивица.", "I tried designing a pattern like one on an old Bulgarian apron. I only got the middle stripe right."),
  ],
  "fun.child-play": [
    t("Играх на народна топка. Оказа се, че всички знаем различни правила.", "I played Bulgarian dodgeball. It turned out everyone knew different rules."),
    t("Чертахме дама с тебешир пред блока, докато не свърши и последното парче.", "We drew hopscotch outside the block until the last piece of chalk was gone."),
  ],
  "fun.digital-project": [
    t("Сглобих кратко видео със снимки от „{place}“. Най-много време ми отне да избера музиката.", "I made a short video with photos from {place}. The soundtrack took the longest."),
    t("Направих малка карта на квартала за проекта. Добавих пекарната, която всеки използва вместо ориентир.", "I made a little neighbourhood map for my project, including the bakery everyone uses as a landmark."),
  ],
  "fun.language-exchange": [
    t("Обясних какво е „айляк“. После опитахме да го преведем, без да използваме думата „релакс“.", "I explained the Bulgarian idea of aylyak. Then we tried to translate it without using the word 'relax'."),
    t("Показах как се произнася „чушка“. След третия опит вече си говорехме за рецепти.", "I showed how to pronounce the Bulgarian word for pepper. By the third attempt we were talking about recipes."),
  ],
  "fun.escape-room": [
    t("В една ескейп стая в София разчетохме последната подсказка по старо разписание на трамваите.", "In a Sofia escape room, we worked out the final clue from an old tram timetable."),
    t("Изходът се оказа скрит зад шкаф с буркани. От всичко в стаята точно там никой не погледна първо.", "The exit was hidden behind a cupboard of jars. It was the one place nobody thought to check first."),
  ],
  "fun.mall": [
    t("Отидох до мола за една блуза. Намерих я, чак след като се върнах в първия магазин.", "I went to the mall for one top. I finally found it when I went back to the first shop."),
    t("Харесах си дреха на българска марка. Накрая премерих два цвята и си тръгнах с първия.", "I found something from a Bulgarian label. I tried two colours and left with the first one."),
  ],
  bedtime: [
    t("Четох „Патиланско царство“{with}. Решихме сами какво ще стане на другата сутрин.", "I read Patilan Kingdom{with}. We made up what would happen the next morning."),
    t("Преди лягане прочетох „Ян Бибиян“{with}. Преместихме отметката чак на следващата глава.", "I read Yan Bibiyan{with} before bed. We moved the bookmark all the way to the next chapter."),
  ],
  "board-game": [
    t("Играх „Не се сърди, човече“{with}. Едно пулче се върна в началото точно преди финала.", "I played Ludo{with}. One piece went back to the start just before the finish."),
    t("Извадих таблата{with}. Вторият мач се оказа доста по-оспорван от първия.", "I got the backgammon board out{with}. The second game was much closer than the first."),
  ],
  "gift.book": [
    t("Избрах книга от български автор{for}. Пъхнах картичка от книжарницата между страниците.", "I chose a book by a Bulgarian author{for} and tucked a card from the bookshop between the pages."),
    t("Намерих точното заглавие{for} при щанда с българска литература. Опаковаха го в крафт хартия.", "I found just the right title{for} at the Bulgarian fiction table. They wrapped it in kraft paper."),
  ],
  "family-time": [
    t("Прекарах време{with}. Извадихме стария албум и спорихме от коя година е една снимка от морето.", "I spent time{with}. We got out an old album and argued about the year of a seaside photo."),
    t("Поговорих{with} над домашна баница. Рецептата пак беше „на око“, както винаги.", "I talked over homemade banitsa{with}. The recipe was a little of this and a little of that, as usual."),
  ],
  "family.time-together": [
    t("Споделихме една порция мекици и си поговорихме на спокойствие. Последната я разделихме на око.", "We shared a plate of mekitsi and had a quiet talk. We split the last one by eye."),
    t("Спряхме за кафе близо до „{place}“. После останахме още малко само заради разговора.", "We stopped for coffee near {place} and stayed a little longer for the conversation."),
  ],
  playground: [
    t("Излязох на площадката{with}. Прекосихме целия пясъчник по мост от клечки.", "I went to the playground{with}. We crossed the whole sandbox on a bridge made of sticks."),
    t("Отидох до площадката пред блока{with}. Преди да си тръгнем, начертахме едно последно поле за дама.", "I visited the playground by the block{with}. Before leaving we drew one last hopscotch grid."),
  ],
  basketball: [
    t("Играх баскетбол{with} на площадката до блока. За последния кош всички искаха видеоповторение.", "I played basketball{with} on the court by the block. Everyone wanted a video replay of the last basket."),
    t("Събрахме се за баскетбол{with} в училищния двор. Играта свърши чак когато спря да се вижда таблото.", "We played basketball{with} in the schoolyard until it was too dark to see the backboard."),
  ],
  "aesthetics.hair": [
    t("Отидох при кварталния фризьор със снимка в телефона. Излязох с по-лек бретон и записан следващ час.", "I took a reference photo to the neighbourhood salon and left with a lighter fringe and another appointment."),
    t("Подстригах се в квартала. Докато чаках, салонът обсъждаше вчерашния епизод на „Игри на волята“.", "I got a haircut locally. While I waited, the salon was discussing the previous episode of Games of Will."),
  ],
  "aesthetics.nails": [
    t("Пробвах лак в цвета на розов локум. На дневна светлина се оказа по-нежен, отколкото в салона.", "I tried nail polish the colour of rose Turkish delight. In daylight it turned out softer than it looked at the salon."),
    t("Избрах тънка шарка, вдъхновена от шевица. После снимах ноктите на светло до прозореца.", "I picked a fine design inspired by Bulgarian embroidery and photographed my nails by the window."),
  ],
};

const aliases: Readonly<Record<string, string>> = {
  "fun.cinema": "cinema",
  "fun.theatre": "theatre",
  "fun.concert": "concert",
  game: "gaming",
};

function mixText(seed: number, value: string) {
  return Array.from(value).reduce((hash, char) => Math.imul(hash ^ char.charCodeAt(0), 16777619), seed) >>> 0;
}

export function activityMoment(event: Memory, seed: number, includeContact = true, contact?: Text): Text | undefined {
  if (event.kind !== "action") return;
  const person = event.id.startsWith("people.");
  const action = person ? event.id.split(".").slice(2).join(".") : event.id;
  const key = aliases[action] ?? action;
  const variants = moments[key];
  if (!variants) return;

  // One position per rotation keeps the original generic copy in circulation.
  const offset = mixText(seed, event.city + "/" + event.id);
  const selected = variants[(offset + event.age) % (variants.length + 1)];
  if (!selected) return;
  const places = cityPlaces(event.city);
  const place = places[mixText(offset, String(event.age)) % places.length];
  const name = (lang: keyof Text) => person && includeContact
    ? contact?.[lang] ?? (event.text[lang].includes(" · ") ? event.text[lang].split(" · ", 1)[0] : "") : "";
  const bg = name("bg");
  const en = name("en");
  return {
    bg: selected.bg.replace("{place}", place.bg).replace("{with}", bg ? (/^[сз]/iu.test(bg) ? " със " : " с ") + bg : "")
      .replace("{for}", bg ? " за " + bg : ""),
    en: selected.en.replace("{place}", place.en).replace("{with}", en ? " with " + en : "")
      .replace("{for}", en ? " for " + en : ""),
  };
}
