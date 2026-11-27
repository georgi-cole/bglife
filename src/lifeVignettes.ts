import { t, type CityEvent } from "./cityLifeModel.ts";
import type { GameState, Text } from "./engine.ts";

type SceneDetails = Pick<CityEvent, "months" | "milestone" | "when"> & { choices?: CityEvent["choices"] };

function vignette(id: string, ages: CityEvent["ages"], title: Text, body: Text, details: SceneDetails = {}): CityEvent {
  return { id: "life-" + id, ages, title, body, nationwide: true, choices: [], ...details };
}

const birthday = t("Първи рожден ден", "First birthday");
const preschool = t("Предучилищна група", "Preschool");
const firstGrade = t("Първи учебен ден", "First day of school");
const siblingAtHome = (s: GameState) => s.birthFamily?.relatives.some(relative =>
  relative.role === "sibling" && relative.household && !s.deceased[relative.id]) ?? false;
const atSchool = (s: GameState) => !!s.path?.school && s.path.school.grade !== null && !s.path.school.left;

export const lifeVignettes: readonly CityEvent[] = [
  vignette("birthday-paper", [1, 1], birthday, t(
    "Снимаха те до тортата. На снимката държиш парче опаковъчна хартия като най-хубавия подарък.",
    "They took a photo of you by the cake. In the picture you’re holding a scrap of wrapping paper like it was the best present."),
    { milestone: true }),
  vignette("birthday-song", [1, 1], birthday, t(
    "Възрастните почнаха да пеят, а ти ги прекъсна с пляскане. Наложи се песента да започне отначало.",
    "The grown-ups started to sing and you interrupted them by clapping. They had to start the song again."),
    { milestone: true }),
  vignette("birthday-nap", [1, 1], birthday, t(
    "Заспа точно преди снимката. Като се събуди, всички още те чакаха. Свещичката беше единствената, която си беше тръгнала.",
    "You fell asleep just before the photo. Everyone waited for you to wake up. Only the candle was gone."),
    { milestone: true }),
  vignette("birthday-helper", [1, 1], birthday, t(
    "По-голямото дете вкъщи ти показа как се духа свещичката. Двамата се оказахте по-нетърпеливи от всички възрастни.",
    "Your older sibling showed you how to blow out the candle. The two of you turned out to be more impatient than any of the grown-ups."),
    { milestone: true, when: siblingAtHome }),

  vignette("preschool-cubby", [4, 4], preschool, t(
    "Намери шкафчето си по рисунката на листо. Името отдолу още не можеше да прочетеш, но листото го знаеше.",
    "You found your cubby by the picture of a leaf. You couldn’t read the name underneath yet, but you knew the leaf by heart."),
    { milestone: true, months: [9] }),
  vignette("preschool-puzzle", [4, 4], preschool, t(
    "Първата сутрин седна до дете, което беше намерило две парчета от един пъзел. Сложихте ги заедно и поискахте още.",
    "On the first morning you sat beside a child who’d found two pieces of a puzzle. You joined them together and asked for more."),
    { milestone: true, months: [9] }),
  vignette("preschool-window", [4, 4], preschool, t(
    "В групата закъсня за първата игра и трябваше да попиташ как се играе. След малко вече показваше правилата на следващото дете.",
    "You missed the start of the first game and had to ask how to play. A minute later you were teaching the next child the rules."),
    { milestone: true, months: [9] }),

  vignette("first-class-flowers", [7, 7], firstGrade, t(
    "Влезе в първи клас с цветя. Докато намериш на кого да ги дадеш, цялата раница беше пълна с листенца.",
    "You arrived in first grade with flowers. By the time you found who to give them to, your backpack was full of petals."),
    { milestone: true, months: [9] }),
  vignette("first-class-neighbour", [7, 7], firstGrade, t(
    "В първи клас седна до човек, който познаваше същата пряка улица до училище. На връщане вече бяхте трима по този път.",
    "In first grade you sat next to someone who knew the same shortcut to school. On the way back there were three of you taking it."),
    { milestone: true, months: [9] }),
  vignette("first-class-desk", [7, 7], firstGrade, t(
    "На първия чин намери забравен молив. Учителката те остави да попиташ на кого е, така че се запозна с половината клас наведнъж.",
    "You found a pencil someone had left on your first desk. The teacher let you ask whose it was, so you met half the class in one go."),
    { milestone: true, months: [9] }),

  vignette("lid-orchestra", [2, 3], t("Оркестър с капаци", "The lid orchestra"), t(
    "Откри, че всеки капак звучи различно върху пода. Вкъщи научиха всички звуци по-бързо, отколкото им се искаше.",
    "You discovered that every lid sounds different on the floor. Everyone at home learned the sounds faster than they would have liked.")),
  vignette("toddler-shoes", [2, 3], t("Две леви обувки", "Two left shoes"), t(
    "Настоя да обуеш обувките без помощ. Малко по-късно по коридора имаше свидетели, че и наобратно могат да те заведат до вратата.",
    "You insisted on putting on your shoes by yourself. Soon there were witnesses that they could get you to the door even the wrong way round.")),
  vignette("toddler-name", [2, 3], t("Една дума за всичко", "One word for everything"), t(
    "Даде едно и също име на гълъбите, автобуса и съседския звънец. Седмица наред възрастните гадаеха кое сочиш.",
    "You gave the pigeons, the bus and the neighbour’s doorbell the same name. For a week the grown-ups had to guess what you were pointing at.")),
  vignette("toddler-book", [2, 3], t("Книжката наопаки", "The book upside down"), t(
    "Поиска приказката да се прочете още веднъж, този път с книжката наопаки. На последната страница поправи разказвача.",
    "You asked to hear the story again, this time with the book upside down. On the last page you corrected the storyteller.")),
  vignette("toddler-buttons", [2, 3], t("Главен оператор на асансьора", "In charge of the lift"), t(
    "Позволиха ти да натиснеш копчето в асансьора. На следващото качване вече искаше да поздравиш всички на всеки етаж.",
    "You were allowed to press the lift button. On the next ride you wanted to say hello to everyone on every floor.")),
  vignette("toddler-box", [2, 3], t("Кашон за двама", "A box for two"), t(
    "По-голямото дете вкъщи нарисува прозорец на един кашон. Настанихте се вътре и почнахте да приемате гости през него.",
    "Your older sibling drew a window on a cardboard box. You moved in together and started greeting visitors through it."),
    { when: siblingAtHome }),
  vignette("toddler-puddle", [2, 3], t("Проверка на локвите", "Checking the puddles"), t(
    "Преброи локвите по тротоара с двайсет повторения на „едно“. Към вкъщи останаха само половината и една доста мокра обувка.",
    "You counted the puddles with twenty repetitions of ‘one’. On the way home only half were left, along with one very wet shoe."),
    { months: [3, 4, 10, 11] }),

  vignette("chalk-map", [5, 6], t("Карта с тебешир", "A chalk map"), t(
    "Пред блока нарисува карта, на която пейката е гара, а входът е планина. Съседка те попита къде да остави колелото си.",
    "You drew a map where a bench was a station and the front door was a mountain. A neighbour asked where she could leave her bike.")),
  vignette("market-list", [5, 6], t("Списък за пазара", "A market list"), t(
    "Дадоха ти да пазиш списъка за пазара. Добави нарисуван сладолед и го представи като последна точка.",
    "You were put in charge of the market list. You drew an ice cream at the bottom and presented it as the final item.")),
  vignette("block-library", [5, 6], t("Библиотека на стъпалото", "A library on the step"), t(
    "Остави две книжки на най-долното стъпало с нарисувана табелка за размяна. На другия ден едната беше станала комикс.",
    "You left two books on the bottom step with a hand-drawn swap sign. The next day, one had turned into a comic.")),
  vignette("window-gardener", [5, 6], t("Градина на прозореца", "A windowsill garden"), t(
    "Поиска да посадиш бобче в стара кофичка от кисело мляко. Първото листо се появи точно в деня, когато беше решил да погледнеш за последно.",
    "You wanted to plant a bean in an old yoghurt pot. The first leaf appeared on the day you’d decided to look one last time."),
    { months: [3, 4, 5] }),
  vignette("paper-tram", [5, 6], t("Билет от тетрадка", "A ticket from a notebook"), t(
    "Покри две столчета с одеяло и отвори линия за пътуване по коридора. Касата разполагаше само с три билета и едно копче за ресто.",
    "You put a blanket over two chairs and opened a transport line down the corridor. The ticket office had three tickets and one button for change.")),
  vignette("sibling-secret", [5, 6], t("Тайно място за бележки", "A secret place for notes"), t(
    "С по-голямото дете вкъщи си измислихте пощенска кутия зад една саксия. Първото писмо беше покана за закуска, написана много тържествено.",
    "You and your older sibling invented a postbox behind a plant pot. The first letter was a very solemn invitation to breakfast."),
    { when: siblingAtHome }),

  vignette("class-notebook", [8, 12], t("Две еднакви тетрадки", "Two identical notebooks"), t(
    "Съученик е взел твоята тетрадка по погрешка. В неговата има рисунки в полетата, а прекъснатата рисунка изглежда като недовършена история.",
    "A classmate took your notebook by mistake. Their notebook has drawings in the margins, and the unfinished one looks like the start of a story."),
    { when: atSchool, months: [2, 3, 4, 10, 11], choices: [
      { id: "ask", label: t("Попитай за рисунката", "Ask about the drawing"),
        outcome: t("Разменихте си тетрадките и се уговорихте да довършите историята в междучасието.",
          "You traded notebooks and agreed to finish the story at break."), stats: { joy: 2, brains: 1 } },
      { id: "return", label: t("Остави бележка", "Leave a note"),
        outcome: t("Написа къде да си размените тетрадките. В отговор получи листче с нарисувана стрелка към правилния чин.",
          "You wrote down where to swap notebooks. In reply you got a slip of paper with an arrow to the right desk."), stats: { brains: 2 } },
    ] }),
  vignette("school-shortcut", [8, 12], t("Другият път за вкъщи", "The other way home"), t(
    "По пътя от училище пробвахте една пресечка, която все подминавате. Намерихте двор, от който се чуваше пиано.",
    "On the way home from school you tried the side street you always pass. You found a courtyard where someone was playing piano."),
    { when: atSchool, months: [3, 4, 5, 9, 10] }),
  vignette("library-request", [8, 12], t("Една книга трябва да изчака", "A book has to wait"), t(
    "В библиотеката двама поискахте последния екземпляр. Взехте да сравнявате кой първи може да се върне и се оказа, че живеете на една спирка разстояние.",
    "Two of you asked for the last copy at the library. Comparing who could return it first, you discovered you lived a stop apart.")),
  vignette("rain-stand", [8, 12], t("Дъжд над импровизирания щанд", "Rain over the makeshift stall"), t(
    "Разпънахте щанд за размяна на играчки, но над улицата се събраха облаци. Един вход има сухо стъпало, друг е по-широк.",
    "You set up a toy swap stall, then clouds gathered above the street. One doorway has a dry step and another has more room."),
    { months: [4, 5, 6, 9, 10], choices: [
      { id: "move", label: t("Преместете щанда", "Move the stall"),
        outcome: t("Прибра се само една играчка. Другите намериха нови собственици под козирката.",
          "Only one toy went home. The rest found new owners under the awning."), stats: { influence: 2 } },
      { id: "reschedule", label: t("Уговорете нов ден", "Set another day"),
        outcome: t("На следващата среща хората дойдоха с чанти и написани имена. Този път знаехте какво очаквате.",
          "At the next meet-up people came with bags and labels. This time you knew what to expect."), stats: { joy: 2, brains: 1 } },
    ] }),
  vignette("lost-glove", [8, 12], t("Ръкавицата на прозореца", "The glove in the window"), t(
    "Търси си ръкавицата три дни. Накрая я видя на прозореца на съседен вход с бележка, че още чака другарката си.",
    "You searched for your glove for three days. You finally saw it in a nearby entrance window with a note saying it was still waiting for its partner."),
    { months: [12, 1, 2] }),
  vignette("neighbour-recipe", [8, 12], t("Рецепта на листче", "A recipe on a slip of paper"), t(
    "Съседка ви даде рецепта и обясни, че брашното е „колкото поеме“. Направихте първата доза на око и после измерихте втората.",
    "A neighbour gave you a recipe and said to use as much flour as the mixture would take. You guessed the first batch and measured the second.")),
  vignette("practice-song", [8, 16], t("Репетиция на стълбите", "A rehearsal on the stairs"), t(
    "Пробва да повториш мелодия в стълбището, защото там се чува по-силно. Някой от горния етаж отговори със същите три ноти.",
    "You tried repeating a tune in the stairwell where it carried farther. Someone upstairs answered with the same three notes."),
    { when: s => s.profile?.talent === "music" }),
  vignette("first-scorebook", [8, 16], t("Тефтер за мачовете", "A notebook for the matches"), t(
    "Записа резултатите от игрите в квартала. След седмица спорехте повече за точността на тефтера, отколкото за самите мачове.",
    "You wrote down the scores from the neighbourhood games. A week later you argued more about the notebook’s accuracy than the matches."),
    { when: s => s.profile?.talent === "sport" }),

  vignette("teen-plans", [13, 17], t("Две уговорки за събота", "Two plans for Saturday"), t(
    "В събота има и среща с приятели, и занимание, за което чакаш отдавна. Двата часа са един след друг, с цял град между тях.",
    "On Saturday there’s a meet-up with friends and a session you’ve been waiting for. The two times are back to back, with a whole town between them."),
    { choices: [
      { id: "choose-one", label: t("Избери едното", "Pick one"),
        outcome: t("Остана до края и не следи часовника. Хората от другата уговорка намериха време да се видите следващия уикенд.",
          "You stayed until the end without watching the clock. The other group found time for you the following weekend."), stats: { joy: 3 } },
      { id: "coordinate", label: t("Предложи обща среща", "Suggest meeting together"),
        outcome: t("Надраска два маршрута и смени часа. На финала на масата се оказаха хора, които дотогава само бяха чували едни за други.",
          "You sketched two routes and changed the time. The table ended up full of people who’d only heard about one another before."), stats: { influence: 2, brains: 1 } },
    ] }),
  vignette("teen-field-photo", [13, 17], t("Снимка от друг ъгъл", "A photograph from another angle"), t(
    "За малка изложба ти дават един лист. Можеш да снимаш позната улица през деня или да изчакаш хората да се приберат.",
    "For a small exhibition you get one page. You can photograph a familiar street by day or wait for people to come home."),
    { choices: [
      { id: "day", label: t("Снимай следобед", "Take a photograph in the afternoon"),
        outcome: t("Запази снимка с пет различни разговора по тротоара. Едва на изложбата забеляза, че двама души се смеят на една и съща шега.",
          "You captured five conversations on one pavement. At the exhibition you finally noticed two people laughing at the same joke."), stats: { influence: 1, brains: 2 } },
      { id: "evening", label: t("Изчакай вечерта", "Wait until evening"),
        outcome: t("Снима прозорците един по един. Съсед пази листа и поиска да види как изглежда улицата през пролетта.",
          "You photographed the windows one by one. A neighbour kept the page and asked how the street looked in spring."), stats: { joy: 2, brains: 1 } },
    ] }),
  vignette("teen-workshop", [13, 17], t("Час в работилницата", "An hour in the workshop"), t(
    "В читалището има свободна маса за проби. Сглоби предмет от две изрезки и го остави за човека след теб с бележка какво би променил.",
    "There’s a spare experiment bench at the community centre. You built something from two offcuts and left a note for the next person about what you’d change."),
    { when: s => s.profile?.talent === "craft" }),
  vignette("teen-timetable", [13, 17], t("Разписание в чат", "A timetable in the group chat"), t(
    "В чата имате три снимки на едно разписание и всяка е от различна година. Събра ги на едно място и отбеляза кой час сте проверили на спирката.",
    "The group chat has three photos of the timetable and each is from a different year. You put them together and marked which departure you’d checked at the stop."),
    { when: s => s.profile?.talent === "technology" }),
  vignette("teen-translation", [13, 17], t("Табела с две версии", "A sign in two versions"), t(
    "Гост на групата не разбра табелата за залата. Помогна да я напишете така, че насоките и в двете версии да водят към една и съща врата.",
    "A visitor couldn’t understand the sign for the hall. You helped rewrite it so the directions in both versions led to the same door."),
    { when: s => s.profile?.talent === "languages" }),
  vignette("teen-coat", [13, 17], t("Яке в чужда раница", "A jacket in the wrong bag"), t(
    "Приятел ти върна якето, което беше останало у него. В джоба намери билет от деня, в който още сте се познавали само от една среща.",
    "A friend returned the jacket you’d left with them. In the pocket you found a ticket from the day you’d only met once.")),
  vignette("teen-quiet", [13, 17], t("Един тих следобед", "A quiet afternoon"), t(
    "Нямаше уговорки и за пръв път от седмици остана на пейката, докато стане хладно. Като се прибра, си спомни три почвани неща, които искаш да довършиш.",
    "You had no plans and for the first time in weeks stayed on a bench until it cooled down. At home you remembered three things you wanted to finish."),
    { months: [5, 6, 7, 8, 9] }),

  vignette("adult-move-first-walk", [18, 131], t("Позната улица в нов град", "A familiar street in a new town"), t(
    "Прибра се по различен път и за пръв път позна отбивката, преди да погледнеш телефона. На ъгъла те поздравиха по име.",
    "You walked home a different way and recognized the turn without checking your phone. Someone on the corner greeted you by name."),
    { when: s => s.city !== s.birthCity }),
  vignette("adult-shift-window", [18, 80], t("Ден без смяна", "A day off work"), t(
    "Освободи се половин ден и го прекара на пазар, на който обикновено пристигаш късно. На същата улица откри два магазина, които все затварят преди теб.",
    "You had half a day free and spent it at a market you usually reach too late. On the same street you found two shops that always close before you get there."),
    { when: s => !!s.path?.work.job }),
  vignette("adult-staircase", [18, 131], t("Бележка във входа", "A note in the entrance"), t(
    "Някой е оставил бележка за разхлабения парапет. Съседите започват да се подписват под нея. Един добавя предложение за събота сутрин.",
    "Someone left a note about a loose handrail. Neighbours start signing it and one adds a suggestion for Saturday morning."),
    { choices: [
      { id: "join", label: t("Помогни с организацията", "Help organize"),
        outcome: t("Събра часовете, в които хората са вкъщи. За половин час успяхте да се разберете за ремонт и ключ.",
          "You found out when people would be home. In half an hour you’d agreed on a repair and who had the key."), stats: { influence: 2 } },
      { id: "ask", label: t("Поговори със съседите", "Talk to the neighbours"),
        outcome: t("Научи защо парапетът е особено важен за един от съседите. После допълни бележката с малка стрелка към другия вход.",
          "You learned why the handrail mattered so much to one neighbour. Then you added a small arrow to the other entrance."), stats: { joy: 2, brains: 1 } },
    ] }),
  vignette("adult-market", [18, 131], t("Буркан за връщане", "A jar to bring back"), t(
    "Човек от квартала ти даде буркан с думите да го върнеш празен. Накрая го върна пълен с нещо твое и започнахте размяна.",
    "Someone from the neighbourhood gave you a jar and said to bring it back empty. You returned it full of something of your own and started a swap.")),
  vignette("adult-spare-seat", [18, 131], t("Последното свободно място", "The last free seat"), t(
    "На квартално събитие остави едно място свободно за закъснелите. На него седна човек, с когото иначе все се разминавате на спирката.",
    "At a neighbourhood event you saved a seat for a latecomer. The person who sat there was someone you usually pass at the stop.")),
  vignette("adult-quiet-gift", [18, 131], t("Една година с малки ремонти", "A year of small repairs"), t(
    "Оправи няколко дреболии, които отлагаше. Най-тържествено вкъщи отбелязахте чекмеджето, което най-после се затваря.",
    "You fixed several small things you’d put off. The biggest celebration at home was for the drawer that finally shut.")),
  vignette("adult-library", [55, 131], t("Писмо между две страници", "A letter between two pages"), t(
    "Докато подреждаше книги, намери плик без марка. Вътре имаше списък с хора, с които отдавна искаш да се чуеш.",
    "Tidying books, you found an envelope without a stamp. Inside was a list of people you’d been meaning to call.")),
  vignette("adult-bench", [65, 131], t("Смяна на пейката", "A change of bench"), t(
    "Пейката, на която сядате, беше заета. Намерихте друга и открихте, че оттам се вижда повече от улицата и по-малко от слънцето.",
    "Your usual bench was taken. You found another and discovered you could see more of the street and less of the sun.")),
];
