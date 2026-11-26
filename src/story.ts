import type { Action, City, Condition, Effect, Option, PersonId, Scene, Text } from './engine';

function t(bg: string, en: string): Text { return { bg, en }; }

function choice(id: string, bg: string, en: string, bgResult: string, enResult: string, effect?: Effect, when?: Condition): Option {
  return { id, label: t(bg, en), result: t(bgResult, enResult), effect, when };
}

function scene(id: string, age: number, title: Text, body: Text, choices: Option[], when?: Condition, priority = 0): Scene {
  return { id, age, title, body, choices, when, priority };
}

export const personProfiles: Record<PersonId, { name: Text; role: Text; detail: Text; city: City }> = {
  rumi: {
    name: t('Леля Руми', 'Aunt Rumi'), role: t('Леля ти', 'Your aunt'), city: 'sofia',
    detail: t('Живее в Младост. Работи до късно и държи резервен ключ в син плик.', 'She lives in Mladost, works late and keeps a spare key in a blue envelope.'),
  },
  niki: {
    name: t('Ники', 'Niki'), role: t('Братовчед ти', 'Your cousin'), city: 'sofia',
    detail: t('Свири на ударни. По телефона упражнява ритъма върху кухненската маса.', 'He plays percussion. On the phone, you can hear him practising on the kitchen table.'),
  },
  mentor: {
    name: t('Майстор Стефан', 'Stefan'), role: t('Дърворезбар', 'Woodcarver'), city: 'tryavna',
    detail: t('Има малка работилница край реката. Пази моливите, докато станат колкото кибритена клечка.', 'He has a little workshop by the river. He keeps using his pencils until they are the length of a match.'),
  },
  friend: {
    name: t('Ели', 'Eli'), role: t('Приятелка от детството', 'Childhood friend'), city: 'tryavna',
    detail: t('В събота помага на семейната сергия. Може да познае редовните клиенти по стъпките.', 'She helps at the family stall on Saturdays. She knows her regulars by their footsteps.'),
  },
};

export const placeProfiles: Record<"sofia" | "tryavna", { name: Text; detail: Text; venues: Text[] }> = {
  tryavna: {
    name: t('Трявна', 'Tryavna'),
    detail: t('Работилницата, съботният пазар и читалището са на един разговор разстояние.', 'A workshop by the river, a Saturday market and a community arts centre where you know the faces.'),
    venues: [t('Работилницата на Стефан', 'Stefan’s workshop'), t('Съботният пазар', 'Saturday market'), t('Читалището', 'Community arts centre')],
  },
  sofia: {
    name: t('София', 'Sofia'),
    detail: t('В Младост има място за спане, обява за стаж и репетиция, която свършва точно в шест.', 'In Mladost, there’s a place to sleep, a trainee vacancy and a rehearsal that ends at six sharp.'),
    venues: [t('Апартаментът на Руми', 'Rumi’s flat'), t('Залата за репетиции', 'Rehearsal room'), t('Офисът в Младост', 'Mladost office')],
  },
};

const home: Condition = { housing: 'home' };
const aunt: Condition = { housing: 'rumi' };
const share: Condition = { housing: 'shared' };

export const scenes: Scene[] = [
  scene('one-saturday', 16, t('Една свободна събота', 'One free Saturday'),
    t('Ели те чака на пазара в осем. Пред работилницата майстор Стефан показва една недовършена рамка. „Още две ръце ми трябват.“ До читалищния концерт остават три часа.',
      'Eli is expecting you at the market at eight. Outside his workshop, Stefan holds up an unfinished frame. “I could use another pair of hands.” The concert starts in three hours.'), [
      choice('frame','Помогни с рамката','Help with the frame','До обяд рамката виси в читалището. Стефан ти дава молива си за надписа. Ели е прибрала сама сергията.','By noon the frame is up. Stefan hands you his pencil to sign it. Eli has packed the stall alone.',{flags:['frameSigned'],trust:{mentor:10,friend:-5},person:'mentor'}),
      choice('stall','Отиди при Ели','Keep your word to Eli','Двете връзвате сенника точно преди дъжда. Ели пъха в джоба ти първата череша за деня.','You tie the awning just before the rain. Eli slips the first cherry of the day into your pocket.',{flags:['stallFriend'],trust:{friend:10},person:'friend'}),
    ]),
  scene('pencil',17,t('Молив зад ухото','A pencil behind your ear'),
    t('Стефан те вика да надпишеш гърба на още една рамка. Ели минава покрай вратата с два празни кашона. Този път имаш време да я настигнеш.','Stefan wants you to sign another frame. Eli passes the door carrying two empty crates. This time you can catch her.'),[
      choice('learn','Остани да учиш резба','Stay for a carving lesson','Майсторът ти показва как се поправя изкривено листо. След третия опит ти оставя длетото.','He shows you how to fix a crooked leaf. On your third try he leaves the chisel with you.',{flags:['leafSkill'],trust:{mentor:6},person:'mentor'}),
      choice('catch-eli','Настигни Ели','Catch up with Eli','Поемаш единия кашон. Докато го носите, намираш точните думи за миналата събота.','You take a crate. Somewhere on the walk you find the words for that Saturday.',{flags:['marketBook'],trust:{friend:9},person:'friend'}),
    ],{flags:['frameSigned']}),
  scene('market-book',17,t('Тетрадката под кантара','The book under the scales'),
    t('Ели вади тетрадка с поръчки. „Пиши едро. Тате иначе носи десет кила вместо едно.“ Пред сергията Стефан избира круши.','Eli pulls out the order book. “Write big. Dad once delivered ten kilos instead of one.” Stefan is picking out pears at the stall.'),[
      choice('orders','Запиши поръчките','Take the orders','Накрая сумите излизат до стотинка. Ели оставя тетрадката при теб.','At closing time the figures balance to the cent. Eli leaves you in charge of the book.',{flags:['marketBook'],trust:{friend:6},person:'friend'}),
      choice('sketch','Нарисувай табелите','Draw the stall signs','Стефан харесва листата около цените. Уговаряте един следобед в работилницата.','Stefan likes the leaves you drew around the prices. You arrange an afternoon in his workshop.',{flags:['leafSkill'],trust:{mentor:7},person:'mentor'}),
    ],{without:['frameSigned']}),
  scene('graduation-table',18,t('Куверт за бала','A seat at the ball'),
    t('За бала сте повече хора, отколкото места на достъпна цена. След пазара Ели ти поверява списъка. Някой е писал „ще видим“ срещу шест имена.','There are more classmates than affordable seats at the graduation ball. Eli hands you the list. Six names have “we’ll see” beside them.'),[
      choice('second-table','Намери по-малка зала','Find a smaller venue','Хазяйката на една механа отстъпва целия салон. Шестте имена остават в списъка.','A local tavern offers its dining room. All six names stay on the list.',{flags:['organiser'],trust:{friend:6},person:'friend'}),
      choice('lend','Дай роклята си назаем','Lend your dress','Момичето от съседния чин обещава да я върне след химическото. На снимката и двете се смеете.','The girl from the next desk promises to have it cleaned. You are both laughing in the photo.',{flags:['gradPhoto'],trust:{friend:4},person:'friend'}),
    ],{flags:['marketBook']}),
  scene('graduation-frame',18,t('Снимка на стълбите','The photo on the steps'),
    t('Фотографът за бала е закъснял. Класът се разпилява, а Стефан е донесъл дървена рамка за общата ви снимка.','The graduation photographer is late. The class is drifting away. Stefan has brought a wooden frame for the group picture.'),[
      choice('gather','Събери всички отново','Round everyone up','Ели намира последните двама при баничарницата. Има снимка, преди да е заваляло.','Eli finds the last two at the bakery. You get your picture before the rain.',{flags:['gradPhoto'],trust:{friend:6},person:'friend'}),
      choice('finish','Довърши рамката','Finish the frame','На гърба изписваш годината и имената. Оставяш място за снимката.','You carve the year and the names on the back, leaving a space for the photograph.',{flags:['leafSkill'],trust:{mentor:6},person:'mentor'}),
    ],{without:['marketBook']}),
  scene('spare-key',19,t('Резервният ключ','The spare key'),
    t('В София има интервю за стаж в софтуерен екип. Руми предлага стая срещу 150 € месечно и петъчните репетиции на Ники. Съквартирантка иска 300 € на месец. В Трявна Стефан предлага чирашко място.',
      'A Sofia software team is interviewing trainees. Rumi offers a room for €150 a month if you collect Niki on Fridays. A flatmate wants €300 a month. Back in Tryavna, Stefan offers you an apprenticeship.'),[
      choice('rumi','Вземи ключа · 60 € за път','Take Rumi’s key · €60 move','Ключът тежи в джоба ти. На хладилника в Младост пише „Ники, петък, 18:00“. Започваш стажа.','The key is heavy in your pocket. The fridge reads “Niki, Friday, 6 pm.” You start the traineeship.',{city:'sofia',housing:'rumi',career:'qa',cash:-6000,flags:['fridays'],trust:{rumi:6},person:'rumi'}),
      choice('shared','Наеми стая · 460 € с депозита','Rent a room · €460 incl. deposit','Плащаш 60 € за преместване и 400 € депозит. В петък вечер можеш да си правиш свои планове. Започваш стажа.','€60 covers your move and €400 is held as a deposit. Friday nights are yours. You start the traineeship.',{city:'sofia',housing:'shared',career:'qa',cash:-46000,flags:['ownRoom']}),
      choice('stay','Остани при Стефан','Take Stefan’s apprenticeship','Прибираш дрехите обратно в гардероба. На другата сутрин в работилницата те чака престилка с твоето име.','You unpack. The next morning an apron with your name on it is waiting in the workshop.',{city:'tryavna',housing:'home',career:'woodcarver',flags:['apprentice'],trust:{mentor:6},person:'mentor'}),
    ]),
  scene('jars-at-rumi',20,t('Дванайсет буркана','Twelve jars'),
    t('„Нищо не ми пращайте“, каза по телефона. На автогарата в София те чака кашон лютеница. Руми отваря шкафа. Вътре има място за три буркана.','“Please don’t send anything,” you said. Twelve jars of lyutenitsa are waiting at Sofia bus station. Rumi opens her cupboard. There is room for three.'),[
      choice('stairs','Раздай част на съседите','Share some upstairs','С Ники обикаляте етажите. Връщате се с празен кашон и покана за съботен обяд.','You and Niki make the rounds. You come back with an empty box and a lunch invitation.',{flags:['jarsShared'],trust:{niki:6,rumi:4},person:'niki'}),
      choice('soup','Сготви с Руми','Cook with Rumi','Руми намира тава, ти намираш хляб. Ники преписва рецептата с огромни букви.','Rumi finds a tray, you find bread. Niki writes down the recipe in enormous letters.',{flags:['recipe'],trust:{rumi:7},person:'rumi'}),
    ],aunt),
  scene('jars-at-flat',20,t('Чий е този рафт?','Whose shelf is this?'),
    t('Кашонът с лютеницата ти заема половината обща кухня. Съквартирантката е надписала своя рафт. Твоят е колкото за две чаши.','Your crate of homemade lyutenitsa fills half the shared kitchen. Your flatmate has labelled her shelf. Yours is about two mugs wide.'),[
      choice('supper','Покани всички на вечеря','Host a kitchen supper','Вечерята свършва в единайсет. Руми си тръгва с два буркана и адреса на съквартирантката.','Supper lasts until eleven. Rumi leaves with two jars and your flatmate’s contact details.',{flags:['jarsShared'],trust:{rumi:7},person:'rumi'}),
      choice('keep','Запази бурканите за гости','Save the jars for visitors','Под леглото се събира целият кашон. Ели вече има повод да дойде.','The whole box fits under the bed. Eli now has a standing invitation.',{flags:['recipe'],trust:{friend:6},person:'friend'}),
    ],share),
  scene('workshop-sign',20,t('Първата табела','Your first sign'),
    t('Кафенето до моста иска табела, готова до понеделник. Стефан ти оставя ключа за работилницата. Ели познава собственичката.','The café by the bridge wants a sign by Monday. Stefan leaves you the workshop key. Eli knows the owner.'),[
      choice('lettering','Изрежи буквите на ръка','Carve the letters by hand','В неделя вечер пръстите ти болят. На сутринта взимаш първия си хонорар за надпис.','Your fingers ache on Sunday night. In the morning you collect your first lettering fee.',{cash:6000,flags:['firstSign'],trust:{mentor:5},person:'mentor'}),
      choice('design','Направи скица с Ели','Sketch it with Eli','Ели рисува чашата, ти оформяш буквите. В долния ъгъл оставяте два подписа.','Eli draws the cup and you shape the letters. Two signatures go in the corner.',{cash:3000,flags:['duoSign'],trust:{friend:8},person:'friend'}),
    ],home),
  scene('friday-promise',21,t('Точно в петък','Of course it’s Friday'),
    t('Платен пробен ден за новия екип. В петък до седем. Ники праща снимка на палките си с въпрос „В шест, нали?“. Руми вече е на смяна.','A paid trial with the new team runs until seven on Friday. Niki sends a picture of his drumsticks. “Six, right?” Rumi is already at work.'),[
      choice('keep','Вземи Ники, откажи пробата','Pick up Niki, decline the trial','Той репетира още пет минути, защото знае, че го чакаш. По пътя ти разказва за първото си соло.','He practises five minutes longer because he knows you are waiting. Walking home, he tells you about his first solo.',{flags:['keptFriday'],trust:{niki:12,rumi:7},person:'niki'}),
      choice('cover','Уговори смяна с Руми','Arrange cover with Rumi','Руми потвърждава с друга майка. Ти поемаш следващата репетиция и изкарваш 90 € на пробния ден.','Rumi confirms another parent can collect him. You take the next rehearsal and earn €90 at the trial.',{cash:9000,flags:['coveredFriday','qaTrial'],trust:{rumi:5},person:'rumi'}),
      choice('miss','Остани на пробата','Stay for the trial','Печелиш 90 €. Ники звъни от празното фоайе. Руми праща кола и повече не оставя петъка на теб.','You earn €90. Niki calls from an empty lobby. Rumi sends a car and takes Fridays off your hands.',{cash:9000,flags:['missedFriday','qaTrial'],removeFlags:['fridays'],trust:{rumi:-15,niki:-12},person:'niki'}),
    ],aunt),
  scene('free-friday',21,t('Свободен петък','A Friday of your own'),
    t('Пробният ден за новия екип е в петък. Можеш да останеш до седем. Ники свири първото си соло същата вечер и ти е запазил място.','The new team’s trial is on Friday and you can stay until seven. Niki has his first solo that evening and has saved you a seat.'),[
      choice('trial','Избери платената проба','Take the paid trial','Получаваш 90 € и покана за следващия проект. Ники ти праща запис от залата.','You earn €90 and an invitation to the next project. Niki sends a recording from the hall.',{cash:9000,flags:['qaTrial'],trust:{niki:1},person:'niki'}),
      choice('solo','Иди на първото соло','Go hear the solo','От задния ред виждаш как Ники търси лицето ти. В края получаваш едната му палка за спомен.','From the back row you see him searching the audience for you. Afterwards he gives you a drumstick.',{flags:['heardSolo'],trust:{niki:12},person:'niki'}),
    ],share),
  scene('second-bench',21,t('Вторият тезгях','The second workbench'),
    t('Стефан смята, че е време за твой тезгях. Първата поръчка е за читалището и плаща скромно. Ели има клиент с по-дебел портфейл.','Stefan thinks you are ready for your own bench. The first order is for the community centre and pays modestly. Eli knows a customer with deeper pockets.'),[
      choice('centre','Приеми поръчката за читалището','Take the community commission','Изкарваш 75 €. На премиерата организаторите споменават името ти.','You earn €75. On opening night the organisers thank you by name.',{cash:7500,flags:['centreWork'],trust:{mentor:7},person:'mentor'}),
      choice('private','Срещни се с клиента на Ели','Meet Eli’s customer','Работата носи 140 €. Ели донася касов ордер и две банички за отпразнуване.','The job pays €140. Eli brings a receipt and two cheese pastries to celebrate.',{cash:14000,flags:['privateWork'],trust:{friend:8},person:'friend'}),
    ],home),
  scene('lift-quotes',22,t('Кратко събрание','A quick meeting'),
    t('На бележката във входа пише „Кратко събрание“. Някой е донесъл стол. Асансьорът спира между етажите и трябват три оферти.','The notice downstairs promises a quick meeting. Someone has brought a chair. The lift keeps stopping between floors and the building needs three repair quotes.'),[
      choice('quotes','Събери офертите','Collect the quotes','Руми ти дава папка от миналогодишния ремонт. Вътре има фактури и рецепта за кекс.','Rumi gives you last year’s repair folder. It contains invoices and a recipe for sponge cake.',{flags:['liftQuotes'],trust:{rumi:5},person:'rumi'}),
      choice('notes','Води протокола','Take the minutes','Записваш кой какво е обещал. На следващата сутрин половината вход иска копие.','You record who promised what. By morning half the building wants a copy.',{flags:['liftMinutes'],trust:{rumi:4},person:'rumi'}),
    ],aunt),
  scene('deposit-tile',22,t('Пукнатата плочка','The cracked tile'),
    t('Наемодателят посочва пукнатата плочка в кухнята. Почти сигурно е, че я има на снимките от нанасянето. Съквартирантката бърза за работа.','The landlord points at a cracked kitchen tile. You are almost sure you photographed it on move-in day. Your flatmate is late for work.'),[
      choice('photo','Намери старата снимка','Find the move-in photo','Ето я плочката зад кашона с книгите. Почти нищо не се вижда, но пукнатината си личи. Депозитът е запазен.','There it is behind the box of books. The crack is just visible. The deposit stays intact.',{flags:['tilePhoto']}),
      choice('patch','Разделете малкия ремонт · 20 €','Split the small repair · €20','Двете взимате нова плочка. Старата пазиш за поставка под горещите тенджери.','You buy a replacement together. The old tile gets another life under hot pans.',{cash:-2000,flags:['tileCoaster']}),
    ],share),
  scene('borrowed-tool',22,t('Чуждото длето','A borrowed chisel'),
    t('Стефан е оставил любимото си длето на твоя тезгях. Острието е леко нащърбено. Утре ще му трябва за демонстрация.','Stefan’s favourite chisel is on your bench. There is a small nick in its edge. He needs it for a demonstration tomorrow.'),[
      choice('sharpen','Наточи го заедно със Стефан','Sharpen it together','Два часа по-късно острието реже хартия. Стефан ти подарява стария си камък.','Two hours later the edge slices paper. Stefan gives you his old sharpening stone.',{flags:['sharpeningStone'],trust:{mentor:8},person:'mentor'}),
      choice('find-backup','Донеси резервното на Ели','Bring Eli’s spare','Баща ѝ има цяло чекмедже с инструменти. Демонстрацията минава чудесно, а ти връщаш длетото лично.','Her dad has a whole drawer of tools. The demonstration goes smoothly and you deliver the chisel back yourself.',{flags:['toolReturned'],trust:{friend:6,mentor:2},person:'friend'}),
    ],home),
  scene('rhythm',23,t('На кухненската маса','On the kitchen table'),
    t('Ники барабани по масата, докато Руми точи кори. „Хайде поне в такт“, казва тя и тупва тестото. Изведнъж двамата звучат като репетиран дует.','Niki drums on the table while Rumi rolls pastry. “At least keep time,” she says, slapping down the dough. Suddenly they sound like a rehearsed duet.'),[
      choice('record','Запиши ги за семейния албум','Record it for the family album','Ники кръщава записа „Баница в седем осми“. Руми го праща само на три лели. За начало.','Niki names the recording “Banitsa in Seven-Eight”. Rumi sends it to just three aunts. To start with.',{flags:['familyTape'],trust:{niki:8,rumi:3},person:'niki'}),
      choice('learn-recipe','Научи се да точиш кори','Learn to roll the pastry','Първата кора прилича на картата на България. Руми я слага по средата. „Там никой няма да види.“','Your first sheet looks like a map of Bulgaria. Rumi hides it in the middle. “Nobody will see.”',{flags:['recipe'],trust:{rumi:8},person:'rumi'}),
    ],aunt),
  scene('two-train-seats',23,t('Мястото до прозореца','The window seat'),
    t('Отдавна каниш Ели на гости. Този уикенд тя най-после пристига. Написала е „Ще те позная ли на гарата?“ и осем смеещи се човечета.','You have invited Eli to visit for years. This weekend she finally comes. “Will I recognise you at the station?” she texts, followed by eight laughing faces.'),[
      choice('meet','Посрещни я с баничка','Meet her with a warm pastry','Тя познава първо гласа ти. Целият път до Младост минава в наваксване.','She recognises your voice first. You spend the whole ride to Mladost catching up.',{flags:['eliVisit'],trust:{friend:9},person:'friend'}),
      choice('invite-niki','Покани Ники да я посрещнете','Bring Niki to meet her','Ники носи табела „Официална делегация от Трявна“. Ели настоява да я вземе за спомен.','Niki brings a sign reading “Official delegation from Tryavna”. Eli insists on keeping it.',{flags:['eliVisit','stationSign'],trust:{niki:4,friend:6},person:'friend'}),
    ],share),
  scene('pepper-roast',23,t('Печените чушки','Roasted peppers'),
    t('Ели е донесла чувал с чушки и още топъл хляб. Дворът мирише на есен. Поръчката в работилницата може да изчака, но клиентът ще иска отстъпка.','Eli turns up with a sack of peppers and bread that’s still warm. The yard smells of autumn. Your commission can wait, although the customer will expect a discount.'),[
      choice('cook','Остани за лютеницата · 15 €','Stay for the lyutenitsa · €15','Покриваш отстъпката. На капачката на първия буркан пишете годината и двете си имена.','You cover the discount. On the first lid you write the year and both your names.',{cash:-1500,flags:['recipe'],trust:{friend:8},person:'friend'}),
      choice('deliver','Предай поръчката навреме','Deliver the commission on time','Клиентът плаща 65 €. Когато се връщаш, Ели ти е оставила хляб, буркан и огромна купчина тави за миене.','The customer pays €65. Back home you find bread, a jar and an enormous stack of trays Eli has left you to wash.',{cash:6500,flags:['orderKept'],trust:{mentor:4},person:'mentor'}),
    ],home),
  scene('empty-lobby',24,t('Пред същата врата','Outside the same door'),
    t('След онзи петък Ники сам си урежда прибирането. Днес те кани да го чуеш. „Само ако можеш, де.“ Залата е същата.','Since the Friday you missed, Niki has arranged his own way home. Today he asks you to hear him play. “Only if you can.” It is the same hall.'),[
      choice('early','Отиди половин час по-рано','Be there half an hour early','Когато поглежда към фоайето, вече си там. След концерта избирате заедно следващата дата.','When he looks towards the lobby you are already there. After the concert you pick another date together.',{flags:['fridayRepaired'],trust:{niki:12,rumi:4},person:'niki'}),
      choice('honest','Кажи кога наистина можеш','Offer a date you can keep','Петъкът остава негов. В неделя Ники идва за обяд и носи слушалки, за да чуеш цялото соло.','Friday stays his. On Sunday Niki brings headphones to lunch so you can hear the entire solo.',{flags:['sundayLunch'],trust:{niki:6},person:'niki'}),
    ],{housing:'rumi',flags:['missedFriday']},1),
  scene('lobby-keys',24,t('Вече има свой ключ','His own key now'),
    t('Ники завърта нов ключ на пръста си. Може вече сам да се прибира в петък. „Ама понякога пак може да идваш.“','Niki spins a new key around his finger. He can get home by himself on Fridays now. “You can still come sometimes, though.”'),[
      choice('listen','Запази вечер за концертите му','Keep an evening for his concerts','Обещанието за всяка седмица приключва. В календара на хладилника Ники огражда само концертите.','The weekly promise ends. Niki circles just the concerts on the fridge calendar.',{removeFlags:['fridays'],flags:['concertGuest'],trust:{niki:8},person:'niki'}),
      choice('give-space','Остави го да те кани сам','Let him invite you himself','На тръгване ти праща първия си собствен афиш. Името му е изписано по-едро от часа.','As you leave he sends you his first poster. His name is printed larger than the starting time.',{removeFlags:['fridays'],flags:['firstPoster'],trust:{niki:5},person:'niki'}),
    ],{housing:'rumi',without:['missedFriday']}),
  scene('share-lease',24,t('Място за още един стол','Room for one more chair'),
    t('Ели има обучение в София и пита дали може да спи три нощи при теб. Съквартирантката е на нощни смени, а диванът скърца като трамвай на завой.','Eli has a training course in Sofia and asks for three nights on your sofa. Your flatmate is working nights. The sofa sounds like a tram taking a corner.'),[
      choice('host','Дай ѝ своята стая','Give her your room','Ели спи спокойно, а ти откриваш точния ъгъл, под който диванът мълчи. Тя ти оставя бележка под възглавницата.','Eli sleeps well. You discover the exact angle at which the sofa stays quiet. She leaves a note under your pillow.',{flags:['hostedEli'],trust:{friend:10},person:'friend'}),
      choice('room','Помогни за стая наблизо · 30 €','Chip in for a room nearby · €30','Намирате място през две пресечки. Всяка вечер се виждате за по една разходка.','You find a place two streets away and go out walking together each evening.',{cash:-3000,flags:['helpedEli'],trust:{friend:6},person:'friend'}),
    ],share),
  scene('young-maker',24,t('Първото криво листо','A crooked first leaf'),
    t('Момиче от читалището е дошло да се учи. Първото ѝ дървено листо е криво, точно като твоето някога. Пита дали да започне отначало.','A girl from the community centre wants to learn. Her first wooden leaf is crooked, just as yours once was. She asks whether to start over.'),[
      choice('show','Покажи как се поправя','Show her how to mend it','До вечерта листото има собствена извивка. Тя идва пак следващата събота.','By evening the leaf has a curve of its own. She comes back the next Saturday.',{flags:['student'],trust:{mentor:8},person:'mentor'}),
      choice('invent','Измислете нов мотив','Invent a pattern together','От едно криво листо правите цяла върба. Ели иска такава табела за пазара.','One crooked leaf becomes a whole willow. Eli wants one for the market stall.',{flags:['willowDesign'],trust:{friend:6,mentor:3},person:'friend'}),
    ],home),
  scene('handover',25,t('Папката с офертите','The folder of quotes'),
    t('Асансьорът пак е спрял. Руми рови в един кашон. „Ти помниш ли колко ни взеха миналия път?“ Пред входа вече има три версии на сумата.','The lift is out again. Rumi goes through a box. “Do you remember what they charged last time?” Three different figures are circulating downstairs.'),[
      choice('records','Извади трите оферти','Bring out your three quotes','На твоята папка още стои петно от кекс. Трите цени най-после стават една проверена сметка.','There is still a cake stain on the folder. Three competing prices finally become one checked bill.',{flags:['buildingRepair'],trust:{rumi:10},person:'rumi'},{flags:['liftQuotes']}),
      choice('minutes','Прочети стария протокол','Read out your old minutes','В протокола е името на човека за поддръжката. Едно обаждане урежда огледа.','You wrote down the maintenance contact. One call gets an inspection booked.',{flags:['buildingRepair'],trust:{rumi:8},person:'rumi'},{flags:['liftMinutes']}),
      choice('neighbour','Питай съседа от първия етаж','Ask the downstairs neighbour','Той пази касовата бележка в кутия за локум. Карето на покривката е поизбеляло, сумата още се чете.','He keeps the receipt in a Turkish delight tin. The printed pattern has faded, but the total is legible.',{flags:['buildingWitness'],trust:{rumi:4},person:'rumi'}),
      choice('help','Поеми покупките на Руми','Carry Rumi’s shopping upstairs','Спорът за цената продължава. Руми се радва, че поне картофите са стигнали до шестия етаж.','The argument carries on. Rumi is glad the potatoes, at least, have made it up six floors.',{trust:{rumi:6},person:'rumi'}),
    ],aunt),
  scene('release-week',25,t('Преди последното метро','Before the last metro'),
    t('Пет минути преди края на смяната колежка открива грешка в приложението. Тя може да оправи описанието сама, но това ще ѝ струва вечерта.','Five minutes before the end of your shift a colleague spots a bug in the app. She can write it up herself, at the cost of her evening.'),[
      choice('pair','Довършете го двете','Finish it together','Снимате последния екран и хващате метрото. Тя те препоръчва за следващия проект.','You capture the last screen and catch the metro. She recommends you for the next project.',{flags:['teamLead'],cash:8000,person:'friend'}),
      choice('morning','Поеми утрешната проверка','Take the morning check','Оставяте ясно описание за сутринта. Тя си тръгва навреме, ти отменяш утрешното кафе.','You leave clear notes for the morning. She gets home on time. You give up tomorrow’s coffee break.',{flags:['handoverNote']}),
    ],share),
  scene('two-aprons',25,t('Още една престилка','A second apron'),
    t('Ученичката вече има свое длето. За първата ѝ поръчка искат твоя подпис. Стефан кима към празното място до твоето име.','Your apprentice now owns a chisel. Her first client asks for your signature. Stefan nods at the space beside your name.'),[
      choice('both','Подпишете се и двете','Sign both names','Клиентът плаща 95 €. Момичето копира подписа си още три пъти, за да го запомни.','The client pays €95. She copies her signature three more times so she will remember it.',{cash:9500,flags:['twoNames'],trust:{mentor:9},person:'mentor'}),
      choice('hers','Остави само нейното име','Leave just her name','Тя прибира първата си поръчка в портфолиото. Стефан ѝ намира кукичка за новата престилка.','She adds the first commission to her portfolio. Stefan finds a hook for the new apron.',{flags:['mentored'],trust:{mentor:10},person:'mentor'}),
    ],{housing:'home',flags:['student']}),
  scene('shop-front',25,t('Табела за твоята врата','A sign for your own door'),
    t('Намира се малко помещение за работа на двайсет крачки от пазара. Ели носи метър. Стефан е дошъл уж само за кафе.','A tiny workspace opens up twenty paces from the market. Eli brings a measuring tape. Stefan says he is only here for the coffee.'),[
      choice('lease','Запази помещението · 120 €','Reserve the space · €120','Вратата заяжда. Когато най-после я отваряш, и двамата ръкопляскат.','The door sticks. When you finally push it open, they both applaud.',{cash:-12000,flags:['ownStudio'],trust:{friend:5,mentor:3},person:'friend'}),
      choice('bench','Сподели тезгяха със Стефан','Keep sharing Stefan’s bench','Стефан изважда второ чекмедже. На табелката отпред е твоето име.','Stefan clears a second drawer. The nameplate on the front has your name on it.',{flags:['sharedBench'],trust:{mentor:8},person:'mentor'}),
    ],{housing:'home',without:['student']}),
  scene('key-homecoming',26,t('Ключът в синия плик','The key in its blue envelope'),
    t('Тръгваш за Трявна. Руми те изпраща на гарата. В ръката ти лежи ключът от първата стая в София. До него има място за още един спомен.','You are heading back to Tryavna for a visit. Rumi walks you to the station. In your hand is the key to your first room in Sofia. There is space beside it for one more memory.'),[
      choice('pass-key','Остави ключа за следващия гост','Leave the key for the next guest','Надписваш нов плик. Руми обещава, че първото кафе при следващото ти гостуване ще е от нея.','You label a fresh envelope. Rumi promises that on your next visit the first coffee is on her.',{flags:['keyPassed'],trust:{rumi:8},person:'rumi'}),
      choice('keep-key','Попитай дали да го запазиш','Ask to keep the key','Руми затваря пръстите ти около него. „И на гости да идваш, пак ще ти трябва.“','Rumi closes your fingers around it. “Even if you’re only visiting, you’ll still need it.”',{flags:['keyKept'],trust:{rumi:6},person:'rumi'}),
    ],aunt),
  scene('flat-homecoming',26,t('Обратният билет','The return ticket'),
    t('В Трявна Ели те чака на гарата. Минали са седем години от първия ти наем. Тя носи празна платнена чанта. „Да видим какво носиш този път.“','Eli meets you at Tryavna station. Seven years have passed since your first rent payment. She has brought an empty tote bag. “Let’s see what you’ve brought this time.”'),[
      choice('lunch','Покани я на обяд · 18 €','Buy her lunch · €18','Плащаш обяда. Ели прибира в чантата хартиената покривка, върху която начертахте стария си път от училище.','You pay for lunch. Eli folds up the paper tablecloth on which you sketched your old walk home from school.',{cash:-1800,flags:['tableclothMap'],trust:{friend:8},person:'friend'}),
      choice('walk','Минете пеша през пазара','Walk through the market','Познавате продавача по гласа. Ели прибира две череши в чантата. Едната е за теб.','You recognise the seller by his voice. Eli puts two cherries in the bag. One is yours.',{flags:['twoCherries'],trust:{friend:7},person:'friend'}),
    ],share),
  scene('frame-returns',26,t('Името на гърба','The name on the back'),
    t('В читалището свалят старата рамка за освежаване. Отзад още стои твоят подпис от шестнайсетата ти година. Стефан държи нов молив.','The community centre takes down an old frame for a touch-up. On the back is your signature from age sixteen. Stefan has brought a new pencil.'),[
      choice('trace','Запази стария подпис','Keep your first signature','Оставяш буквите криви, точно както си ги написала. Новата дата стои отдолу.','You leave the crooked letters just as you wrote them. Today’s date goes underneath.',{flags:['firstSignature'],trust:{mentor:8},person:'mentor'}),
      choice('eli','Покани Ели на откриването','Invite Eli to the reopening','Разказваш ѝ какво се случи онази събота. Днес сте пред рамката заедно.','You tell her where you were that Saturday. Today you stand in front of the frame together.',{flags:['openingTogether'],trust:{friend:10},person:'friend'}),
    ],{housing:'home',flags:['frameSigned']}),
  scene('market-returns',26,t('Сутринта на пазара','Morning at the market'),
    t('Ели изкарва сенника от същия стар кашон. Наблизо едно момиче се чуди как се вързва нестабилната стойка. Ти още помниш възела.','Eli unpacks the awning from the same old crate. A young stallholder struggles with a wobbly stand nearby. Your hands still remember the knot.'),[
      choice('teach','Покажи ѝ възела','Teach her the knot','Тя пробва два пъти. Сенникът издържа първия порив на вятъра, а Ели вече налива кафе за трима.','She tries twice. The awning holds against the first gust. Eli is already pouring coffee for three.',{flags:['marketKnot'],trust:{friend:9},person:'friend'}),
      choice('make','Направи стабилна подпора','Make a sturdy brace','Изрязваш малка подпора от остатъчно дърво. На пазара тя работи цял сезон.','You carve a brace from an offcut. It lasts a whole market season.',{flags:['marketBrace'],trust:{friend:7,mentor:3},person:'friend'}),
    ],{housing:'home',without:['frameSigned']}),
];

export const actions: Action[] = [
  {id:'market-morning',label:t('Помогни на сергията','Help at the market'),result:t('Ели ти отделя 12 € от днешния оборот. Прибирате сенника заедно.','Eli sets aside €12 from the day’s takings. You fold the awning together.'),effect:{cash:1200,trust:{friend:3},person:'friend'},when:{city:'tryavna'}},
  {id:'tea-with-stefan',label:t('Мини през работилницата','Visit the workshop'),result:t('Стефан оставя чайника на тезгяха. Половин час чертаете нови листа на амбалажна хартия.','Stefan sets the teapot on the bench. You spend half an hour sketching leaves on brown paper.'),effect:{trust:{mentor:4},person:'mentor'},when:{city:'tryavna'}},
  {id:'rehearsal',label:t('Чуй репетицията на Ники','Hear Niki rehearse'),result:t('Оставаш за последната песен. На излизане Ники пита коя част ти е харесала.','You stay for the last song. On the way out Niki asks which part you liked.'),effect:{trust:{niki:4},person:'niki'},when:{city:'sofia'}},
  {id:'extra-shift',label:t('Поеми допълнителна смяна','Pick up an extra shift'),result:t('Намираш пропуснат проблем и записваш стъпките. Допълнителната смяна носи 40 €.','You find a missed issue and write up the steps. The extra shift pays €40.'),effect:{cash:4000},when:{city:'sofia'},minAge:19},
  {id:'call-rumi',label:t('Звънни на леля Руми','Call Aunt Rumi'),result:t('Каза, че има само пет минути. След половин час още обсъждате коя тенджера загаря.','She said she had five minutes. Half an hour later you are still debating which pot burns at the bottom.'),effect:{trust:{rumi:3},person:'rumi'}},
  {id:'visit-home',label:t('Посети Трявна · 18 €','Visit Tryavna · €18'),result:t('Ели те изпраща с малък пакет за из път. Вечерта се прибираш отново в София.','Eli sends you off with a parcel for the journey. You return to Sofia that evening.'),effect:{cash:-1800,trust:{friend:5},person:'friend'},when:{city:'sofia'},minAge:19},
];

interface EndingState { housing: string; flags: string[] }
export function endingCopy(state: EndingState): {title: Text; body: Text} {
  if (state.housing === 'rumi') {
    const friday = state.flags.includes('fridayRepaired') ? t('Ники помни и празното фоайе, и деня, в който се върна по-рано.','Niki remembers both the empty lobby and the day you came back early.')
      : state.flags.includes('missedFriday') ? t('Петъците между теб и Ники се промениха. Останаха ви други дни за срещи.','Fridays changed for you and Niki. Other days still belonged to the two of you.')
      : state.flags.includes('coveredFriday') ? t('В една петъчна вечер намери място и за работата, и за обещанието си.','One Friday you found a way to keep a promise and take a chance at work.')
      : t('Ники още помни как го чакаше след първото му соло.','Niki still remembers you waiting for him after his first solo.');
    return { title:t('Стая назаем','A room of your own, borrowed'), body:t(friday.bg+' Ключът от Младост вече има своя история.',friday.en+' The Mladost key has a story now.') };
  }
  if (state.housing === 'shared') return {title:t('Свое място','A place of your own'),body:t('Първите 400 € останаха в депозита. Петъчните вечери останаха твои. След седем години самостоятелен живот отново си на гарата в Трявна, а Ели те чака.','The first €400 went into a deposit. Friday nights stayed yours. Seven years into your independent life, Eli is still waiting for you at Tryavna station.')};
  return state.flags.includes('frameSigned')
    ? {title:t('Първият подпис','Your first signature'),body:t('На шестнайсет остана в работилницата. Десет години по-късно името ти още стои на гърба на рамката. Стефан вече те пита как би я довършила ти.','At sixteen you stayed in the workshop. Ten years later your name is still on the frame. These days Stefan asks how you would finish it.') }
    : {title:t('Хората от пазара','The people at the market'),body:t('Една събота отиде при Ели, както беше обещала. Десет години по-късно още знаете как да вдигнете сергията заедно. Вече има на кого да покажете.','One Saturday you showed up for Eli as promised. Ten years later you still know how to put the stall up together. Now there is someone to teach.') };
}
