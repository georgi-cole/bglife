import type { Text } from "./engine.ts";
import type { StatDelta } from "./lifeStats.ts";

type Moment = { text: Text; stats?: StatDelta };

const moment = (bg: string, en: string, stats?: StatDelta): Moment => ({ text: { bg, en }, stats });

export const trimesterMoments = {
  1: [
    moment("Миризмата на сутрешното кафе изведнъж стана непоносима. Отвори прозореца и закуси с препечена филийка.",
      "The smell of morning coffee suddenly turned your stomach. You opened the window and had toast instead.", { health: -2 }),
    moment("Планираше само да седнеш за минута. Събуди се на дивана точно преди вечеря.",
      "You meant to sit down for a minute. You woke up on the sofa just before dinner.", { health: -1 }),
    moment("Поиска кисели краставички в десет вечерта. Някой отвори буркана и реши, че и на него му се ядат.",
      "You craved pickles at ten at night. Someone opened the jar and decided they wanted some too.", { joy: 2 }),
    moment("Заплака на реклама с куче. След пет минути се разсмя, защото преди това изобщо не гледаше телевизора.",
      "You cried at an advert with a dog. Five minutes later you laughed because you hadn’t even been watching the TV.", { joy: -1 }),
    moment("Гаденето идваше вечер. Премести плановете си за по-ранен час и си остави време за почивка.",
      "The nausea came in the evenings. You moved your plans earlier and left yourself time to rest.", { health: -1 }),
    moment("Минаха няколко спокойни седмици. Запази снимката от прегледа в плика, с който ти я дадоха.",
      "A few quiet weeks passed. You kept the scan photo in the envelope it came in.", { joy: 2 }),
    moment("В супермаркета ароматът на топъл хляб ти хареса толкова много, че взе втори и го занесе на съседите.",
      "You loved the smell of warm bread at the supermarket so much you bought a second loaf for the neighbours.", { joy: 2 }),
    moment("Решихте да запазите подробностите от прегледа за вас двамата. На другите казахте само кога е следващият.",
      "You kept the details from the appointment between you. You told everyone else only when the next one was.", { joy: 1 }),
  ],
  2: [
    moment("За пръв път от седмици се събуди с енергия. Закуската навън отново звучеше като хубава идея.",
      "For the first time in weeks you woke up with energy. Going out for breakfast sounded good again.", { health: 2 }),
    moment("В тишината усети нещо като леко пърхане. Двамата останахте на дивана и чакахте да се повтори.",
      "In the quiet you felt a little flutter. You stayed on the sofa together and waited for it to happen again.", { joy: 3 }),
    moment("Дънките вече стягаха. Намери една удобна дреха и почти цяла седмица отказа да я смениш.",
      "Your jeans were getting tight. You found one outfit that felt comfortable and wore it for most of the week."),
    moment("Една баница с айрян се оказа точната закуска. Повтори я три сутрини подред.",
      "Banitsa and ayran turned out to be the perfect breakfast. You had it three mornings in a row.", { joy: 1 }),
    moment("Първият списък с имена беше на гърба на касова бележка. До едно име има три въпросителни.",
      "Your first shortlist of names went on the back of a receipt. One name has three question marks beside it.", { joy: 2 }),
    moment("В автобуса ти отстъпиха място. Когато слезе, осъзна колко много ти е помогнало.",
      "Someone gave you their seat on the bus. On getting off, you realised how much it had helped.", { joy: 1 }),
    moment("Апетитът се върна, но миризмата на любимия ти парфюм още те дразнеше. Банята постепенно се напълни с продукти без аромат.",
      "Your appetite came back, but your favourite perfume still bothered you. Unscented products slowly took over the bathroom."),
    moment("Тази част от бременността мина спокойно. Разходките привечер станаха навик.",
      "This part of the pregnancy was uneventful. Evening walks became a habit.", { health: 1 }),
  ],
  3: [
    moment("Нареди три възглавници, за да ти е удобно. Точно когато заспа, пак се наложи да ставаш.",
      "You arranged three pillows to get comfortable. Just as you fell asleep, you had to get up again.", { health: -1 }),
    moment("Краката се уморяваха по-бързо. Избра по-къс път до магазина и спря за почивка под дърветата.",
      "Your legs tired more quickly. You chose a shorter route to the shop and sat under the trees for a break.", { health: -1 }),
    moment("Сакът за болницата стоеше до вратата. Двамата го отворихте поне три пъти, за да проверите една и съща вещ.",
      "The hospital bag sat by the door. You opened it at least three times to check for the same thing.", { joy: 1 }),
    moment("Вечерта усети ритници точно когато пусна любимата си песен. Записа си коя беше.",
      "You felt kicks just as your favourite song came on. You wrote down which one it was.", { joy: 2 }),
    moment("Някой донесе кутия с дрешки. Оказа се, че най-малкото чорапче трудно се намира дори на дъното на кутията.",
      "Someone brought over a box of clothes. The tiniest sock was hard to find even at the bottom of the box.", { joy: 2 }),
    moment("В един напрегнат ден напрежението в корема отмина. На контролния преглед поговорихте какво да очаквате около термина.",
      "On a stressful day the tight feeling in your belly passed. At the next checkup you talked about what to expect near the due date."),
    moment("Последният месец мина по-спокойно от очакваното. Намери време да подредиш снимките от трите прегледа.",
      "The last stretch was calmer than you expected. You found time to put the scan photos in order.", { joy: 2 }),
    moment("Вкъщи се оформи спор дали да сложите кошарата до прозореца. Останахте на компромиса с мястото до леглото.",
      "You had a debate about putting the cot by the window. The spot beside the bed won.", { joy: 1 }),
  ],
} as const;

export const partnerTrimesterMoments = {
  1: [
    moment("Гаденето се появи точно преди излизане. Променихте плановете и направи закуска вкъщи.",
      "Nausea struck just before you were due to go out. You changed plans and made breakfast at home.", { joy: 1 }),
    moment("Вечерта получи съобщение с молба за кисели краставички. Донесе и резервен буркан.",
      "An evening text asked for pickles. You brought a spare jar too.", { joy: 2 }),
    moment("Умората промени общите ви планове. Оставихте един уикенд без уговорки.",
      "Tiredness changed your plans together. You kept a whole weekend free."),
    moment("На снимката от първия преглед веднага позна какво ти показват. Двамата се засмяхте, защото преди минута си гледал наобратно.",
      "You finally recognised what you were being shown on the first scan. You both laughed because you’d been looking at it upside down.", { joy: 2 }),
  ],
  2: [
    moment("Чу, че бебето се е размърдало. Докато сложиш ръка, вече беше спокойно.",
      "You heard the baby had moved. By the time you reached out, everything was quiet again.", { joy: 2 }),
    moment("Написахте имена на гърба на касова бележка. За две от тях най-после сте на едно мнение.",
      "You wrote names on the back of a receipt. You finally agreed on two of them.", { joy: 2 }),
    moment("Апетитът се върна и си уговорихте баница за закуска след прегледа.",
      "Appetite returned, and you made plans for banitsa after the appointment."),
  ],
  3: [
    moment("Помогна да подредите сака за болницата. Никой не можа да си обясни защо вътре вече имаше четири чифта чорапи.",
      "You helped pack the hospital bag. Nobody could explain why there were already four pairs of socks in it.", { joy: 1 }),
    moment("Сложихте кошарата до леглото и за пръв път стаята изглеждаше готова.",
      "You set the cot by the bed, and for the first time the room looked ready.", { joy: 2 }),
    moment("С наближаването на термина отменихте едно дълго пътуване. Вечеряхте наблизо и си направихте план за деня на раждането.",
      "As the due date approached, you cancelled a long trip. You had dinner nearby and made a plan for the birth."),
  ],
} as const;
