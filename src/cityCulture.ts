import type { City } from "./cities.ts";
import type { Text } from "./engine.ts";

const t = (bg: string, en: string): Text => ({ bg, en });
function pair(raw: string): Text {
  const [bg, en] = raw.split("|");
  return t(bg, en);
}

// Speech registers are optional lines for individual characters. The dialect zones
// follow the IBE–BAS map in broad outline, including cities with mixed speech.
export const voices = {
  capital: { region: t("Смесен столичен говор", "Mixed Sofia speech"), phrase: t("Айде, ще се видим на спирката.", "See you at the stop.") },
  shop: { region: t("Шопски говори", "Shop dialects"), phrase: t("Дека че се видиме?", "Where shall we meet?") },
  northwest: { region: t("Северозападни говори", "Northwestern dialects"), phrase: t("Те тука ще седнем.", "Let’s sit right here.") },
  balkan: { region: t("Балкански говори", "Balkan dialects"), phrase: t("Туй тука ли е?", "Is it this one here?") },
  eastern: { region: t("Североизточни говори", "Northeastern dialects"), phrase: t("Отде идеш сега?", "Where are you coming from?") },
  dobrudja: { region: t("Добруджански говори", "Dobruja dialects"), phrase: t("Туй е от нашта нива.", "This came from our field.") },
  thracian: { region: t("Тракийски говори", "Thracian dialects"), phrase: t("Туй е за тебе.", "This is for you.") },
  southwest: { region: t("Югозападни говори", "Southwestern dialects"), phrase: t("Оти бързаш толкоз?", "Why are you in such a hurry?") },
  rhodopes: { region: t("Родопски и съседни рупски говори", "Rhodope and nearby Rup dialects"), phrase: t("Сабале ще идем.", "We’ll go in the morning.") },
} as const;

type Culture = {
  voice: keyof typeof voices;
  places: readonly Text[];
  festival: Text;
  food: Text;
  habit: Text;
  style: Text;
};

function culture(voice: Culture["voice"], first: string, second: string, festival: string, food: string, habit: string, style: string): Culture {
  return { voice, places: [pair(first), pair(second)], festival: pair(festival), food: pair(food), habit: pair(habit), style: pair(style) };
}

export const cityCulture: Record<City, Culture> = {
  "blagoevgrad": culture("southwest", "Регионалният исторически музей|Regional History Museum", "парк „Бачиново“|Bachinovo Park", "Празник на Благоевград|Blagoevgrad City Day", "баница със сирене|cheese banitsa", "Съботна разходка край Благоевградска Бистрица|A Saturday walk along the Bistritsa", "Студентски кафенета и възрожденски дворове|Student cafés and Revival-era courtyards"),
  "burgas": culture("thracian", "Морското казино|Sea Casino", "Пристанище Бургас|Port of Burgas", "Никулден в Бургас|St Nicholas Day in Burgas", "рибена чорба|fish soup", "Разходка от центъра до Моста|Walk from the centre to the pier", "Морски алеи и летни сцени|Seaside promenades and summer stages"),
  "varna": culture("eastern", "Римските терми|Roman Baths", "Морска гара|Marine Station", "„Варненско лято“|Varna Summer Festival", "пържена цаца|fried sprats", "Среща до входа на Морската градина|Meet by the entrance to the Sea Garden", "Курортни тераси и пристанищни улици|Resort terraces and port streets"),
  "veliko-tarnovo": culture("balkan", "Царевец|Tsarevets Fortress", "улица „Гурко“|Gurko Street", "Празник на Велико Търново|Veliko Tarnovo City Day", "гювеч в глинен съд|clay-pot gyuvech", "Слизане по стъпалата към Янтра|Take the steps down towards the Yantra", "Каменни стълби и надвесени къщи|Stone stairways and overhanging houses"),
  "vidin": culture("northwest", "Кръстатата казарма|Cross-Shaped Barracks", "крайдунавският парк|Danube riverside park", "Видинският панаир|Vidin Fair", "дунавска рибена чорба|Danube fish soup", "Вечерна разходка по кея|Evening walk on the quay", "Крепостни стени и широк речен хоризонт|Fortress walls and a broad river horizon"),
  "vratsa": culture("northwest", "Регионалният исторически музей|Regional History Museum", "площад „Христо Ботев“|Hristo Botev Square", "Ботевите дни|Botev Days", "пълнени чушки|stuffed peppers", "Разходка към прохода на почивен ден|A day-off walk towards the gorge", "Скалите на Балкана над града|Balkan cliffs above the city"),
  "gabrovo": culture("balkan", "Интерактивният музей на индустрията|Interactive Museum of Industry", "Етъра|Etar open-air museum", "Габровският карнавал|Gabrovo Carnival", "балканска баница|Balkan-style banitsa", "Неделно ходене до Етъра|A Sunday trip to Etar", "Промишлени сгради и занаятчийски дворове|Industrial buildings and craft courtyards"),
  "dobrich": culture("dobrudja", "Градският парк „Св. Георги“|St George City Park", "Художествената галерия|Art Gallery", "Празник на Добрич|Dobrich City Day", "добруджанска кавърма|Dobruja-style layered pastry", "Съботни покупки на пазара|Saturday shopping at the market", "Широки улици и добруджански двор|Broad streets and Dobruja courtyards"),
  "kardzhali": culture("rhodopes", "Регионалният исторически музей|Regional History Museum", "Перперикон край Кърджали|Perperikon near Kardzhali", "Празник на Кърджали|Kardzhali City Day", "родопски клин|Rhodope rice pastry", "Следобедна разходка край Арда|Afternoon walk by the Arda", "Речни алеи и родопски пейзаж|Riverside paths and Rhodope scenery"),
  "kyustendil": culture("southwest", "галерията на Майстора|Vladimir Dimitrov Art Gallery", "Римските терми|Roman Baths", "Празникът на черешата|Cherry Festival", "кюстендилски череши|Kyustendil cherries", "Кошница с череши от пазара|A basket of cherries from the market", "Овощни градини и минерални извори|Orchards and mineral springs"),
  "lovech": culture("balkan", "квартал „Вароша“|Varosha quarter", "Хисарската крепост|Hisarya Fortress", "Цветница в Ловеч|Palm Sunday in Lovech", "домашна пита|homemade round bread", "Минаване по Покрития мост за покупки|Shopping across the Covered Bridge", "Дървени дюкяни край Осъм|Wooden shops by the Osam"),
  "montana": culture("northwest", "площад „Жеравица“|Zheravitsa Square", "язовир „Огоста“ край Монтана|Ogosta reservoir near Montana", "Празниците на духовите оркестри „Дико Илиев“|Diko Iliev Wind Band Festival", "качамак със сирене|cornmeal with cheese", "Разходка край Огоста през уикенда|A weekend walk by Ogosta", "Градски площади и открита сцена|City squares and outdoor stages"),
  "pazardzhik": culture("thracian", "Регионалният исторически музей|Regional History Museum", "площад „Константин Величков“|Konstantin Velichkov Square", "Празник на Пазарджик|Pazardzhik City Day", "печени чушки|roasted peppers", "Колело по алеите на Острова|A bike ride along the paths of Ostrova Park", "Речен парк и оживени пазарни улици|Riverside park and busy market lanes"),
  "pernik": culture("shop", "Подземният минен музей|Underground Mining Museum", "Дворецът на културата|Palace of Culture", "Международният фестивал „Сурва“|Surva International Festival", "зелник|greens and cheese pastry", "Разговори за маските преди „Сурва“|Talking about masks before Surva", "Минно наследство и сурвакарски маски|Mining heritage and Surva masks"),
  "pleven": culture("northwest", "Панорамата „Плевенска епопея“|Pleven Panorama", "Скобелевият парк|Skobelev Park", "Празник на Плевен|Pleven City Day", "пиле с ориз|chicken and rice", "Носене на сандвичи за пикник в Кайлъка|Packing sandwiches for a Kaylaka picnic", "Лозови склонове и големи зелени паркове|Vineyard slopes and spacious parks"),
  "plovdiv": culture("thracian", "Артистичният квартал „Капана“|Kapana arts quarter", "Главната улица и Римският стадион|High Street and Roman Stadium", "Есенните празници на изкуствата|Autumn Arts Festival", "катми с мед|yeast pancakes with honey", "Среща на Главната след работа|Meeting on High Street after work", "Тепета, калдъръм и ателиета|Hills, cobbles and studios"),
  "razgrad": culture("eastern", "Абритус|Abritus", "Етнографският музей|Ethnographic Museum", "Панаирът на киселото мляко|Yogurt Fair", "кисело мляко|Bulgarian yogurt", "Посещение на пазара преди обяд|A morning market visit", "Зелени площади и лудогорски пейзаж|Green squares and Ludogorie scenery"),
  "ruse": culture("eastern", "Доходното здание|Revenue Building", "Пантеонът на възрожденците|Pantheon of National Revival Heroes", "„Мартенски музикални дни“|March Music Days", "рибена чорба от речна риба|river fish soup", "Среща на площада преди концерт|Meeting in the square before a concert", "Европейски фасади и дунавски кей|European-style façades and the Danube quay"),
  "silistra": culture("dobrudja", "Меджиди табия|Medzhidi Tabia Fortress", "Дуросторум и крайдунавските разкопки|Durostorum and riverside excavations", "Празник на Силистра|Silistra City Day", "добруджанска баница|Dobruja-style banitsa", "Седене край реката по залез|Sitting by the river at sunset", "Дунавски гледки и добруджански колорит|Danube views and Dobruja character"),
  "sliven": culture("balkan", "Националният музей на текстилната индустрия|National Museum of the Textile Industry", "Хаджидимитровата къща|Hadzhidimitrov House Museum", "Димитровден в Сливен|St Demetrius Day in Sliven", "плодове от Сливенския край|fruit from around Sliven", "Излизане към Сините камъни|A trip towards the Blue Rocks", "Планински склонове и стари текстилни работилници|Mountain slopes and old textile workshops"),
  "smolyan": culture("rhodopes", "Планетариумът|Planetarium", "Старият център в Райково|The old centre of Raykovo", "Роженският събор край Смолян|Rozhen gathering near Smolyan", "пататник|Rhodope potato dish", "Да занесеш топло ядене на гости|Bringing a hot dish when you visit", "Каменни къщи и планински квартали|Stone houses and mountain neighbourhoods"),
  "sofia": culture("capital", "площад „Славейков“|Slaveykov Square", "пазар „Иван Вазов“|Ivan Vazov Market", "Денят на София|Sofia City Day", "баничка с айрян|banitsa with ayran", "Уговаряне на среща до метрото|Arranging to meet by the metro", "Булеварди, квартални пазари и Витоша на хоризонта|Boulevards, neighbourhood markets and Vitosha in the distance"),
  "stara-zagora": culture("thracian", "Античният форум на Августа Траяна|Augusta Traiana Roman Forum", "Неолитните жилища|Neolithic Dwellings Museum", "Празник на Стара Загора|Stara Zagora City Day", "печена тиква|roast pumpkin", "Сутрешно ходене по алеите на Аязмото|An early walk through Ayazmoto", "Прави улици и сянка от липи|Straight streets and linden shade"),
  "targovishte": culture("eastern", "квартал „Вароша“|Varosha quarter", "езерото „Борово око“|Borovo Oko Lake", "Пролетният панаир|Spring Fair", "домашни сиренки|homemade cheese biscuits", "Пазаруване на пролетния панаир|Shopping at the spring fair", "Озеленени улици и стар градски квартал|Leafy streets and an old-town quarter"),
  "haskovo": culture("thracian", "Монументът „Света Богородица“|Holy Virgin monument", "площад „Свобода“|Svoboda Square", "Празник на Хасково|Haskovo City Day", "гювеч със зеленчуци|vegetable gyuvech", "Неделна разходка в Кенана|A Sunday walk through Kenana", "Хълм над центъра и широки паркови алеи|A hill above the centre and broad park paths"),
  "shumen": culture("eastern", "Шуменската крепост|Shumen Fortress", "Томбул джамия|Tombul Mosque", "Друмевите театрални празници|Drumev Theatre Festival", "гюзлеме|pan-cooked filled flatbread", "Излет до платото след училище|An after-school trip to the plateau", "Исторически квартали и горско плато|Historic quarters and a wooded plateau"),
  "yambol": culture("thracian", "парк „Боровец“|Borovets Park", "градският парк край Тунджа|City park by the Tundzha", "„Кукерландия“|Kukerlandia Festival", "тиквеник|pumpkin pastry", "Гледане на кукерите от първия ред|Watching the kukeri from up front", "Кукерски костюми и речни алеи|Kukeri costumes and riverside paths"),
  "samokov": culture("shop", "Историческият музей|History Museum", "Боровец край Самоков|Borovets near Samokov", "Празник на Самоков|Samokov City Day", "самоковски картофи|Samokov potatoes", "Пазаруване на картофи преди зимата|Stocking up on potatoes before winter", "Рилски хоризонт и възрожденско изкуство|Rila views and Revival-era art"),
  "tryavna": culture("balkan", "Старата школа|Old School Museum", "Даскаловата къща|Daskalov House", "Славейковите празници|Slaveykov Festival", "боб в гърне|clay-pot beans", "Гледане на дърворезба през отворената врата на ателието|Watching woodcarving through an open studio door", "Дървени стрехи, резбовани тавани и каменни мостове|Wooden eaves, carved ceilings and stone bridges"),
};
