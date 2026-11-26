import type { LifeActivityDefinition } from "./lifeActivities.ts";
import type { GameState } from "./engine.ts";

const text = (bg: string, en: string) => ({ bg, en });

function moderateFitness(s: GameState) {
  return s.stats.health < 40
    ? text("Трябва да се възстановиш преди натоварваща тренировка.", "Recover before taking on a strenuous workout.")
    : null;
}

function intenseFitness(s: GameState) {
  return s.stats.health < 58
    ? text("За тази тренировка са нужни поне 58% здраве.", "This workout requires at least 58% Health.")
    : null;
}

function electiveProcedure(s: GameState) {
  return s.lifeSystems.medicalIssue || s.stats.health < 60
    ? text("За процедурата са нужни поне 60% здраве и без текущ здравословен проблем.", "This procedure requires at least 60% Health and no active health issue.")
    : null;
}

export const lifeLeisure: LifeActivityDefinition[] = [
  {
    id: "fun.practice-music", category: "fun", minAge: 7,
    label: text("Свири или пей", "Practise music"),
    description: text("Упражни любима мелодия.", "Practise a favourite melody."),
    result: text("Изсвири мелодията от начало до край.", "You played the melody from start to finish."),
    stats: { joy: 3 }, visible: s => Boolean(s.profile),
  },
  {
    id: "fun.drawing", category: "fun", minAge: 7,
    label: text("Направи рисунка", "Draw something"),
    description: text("Нарисувай място, което познаваш.", "Draw a place you know."),
    result: text("Върна се към рисунката и добави детайл, който беше пропуснал.", "You went back to the drawing and added a detail you had missed."),
    stats: { joy: 3 }, visible: s => Boolean(s.profile),
  },
  {
    id: "fun.digital-project", category: "fun", minAge: 12,
    label: text("Направи дигитален проект", "Make a digital project"),
    description: text("Сглоби малък проект от идея до готов резултат.", "Take a small project from an idea to a working result."),
    result: text("Поправи първата грешка и успя да довършиш проекта.", "You fixed the first issue and finished the project."),
    stats: { brains: 3 }, visible: s => Boolean(s.profile),
  },
  {
    id: "fun.language-exchange", category: "fun", minAge: 12,
    label: text("Упражни чужд език", "Practise a language"),
    description: text("Избери тема и проведи кратък разговор.", "Pick a topic and have a short conversation."),
    result: text("Употреби две нови думи в разговор и ги запомни.", "You used two new words in conversation and remembered them."),
    stats: { brains: 3 }, visible: s => Boolean(s.profile),
  },
  {
    id: "gym.walk", category: "gym", minAge: 4,
    label: text("Излез на разходка", "Go for a walk"),
    description: text("Раздвижи се със свое темпо.", "Get moving at your own pace."),
    result: text("Избра познат маршрут и се прибра в по-добро настроение.", "You took a familiar route and came home feeling better."),
    stats: { health: 5, joy: 2 },
    visible: s => s.lifespanStart !== null,
  },
  {
    id: "fun.child-play", category: "fun", minAge: 4,
    label: text("Поиграй навън", "Play outside"),
    description: text("Излез на площадката и измислете игра.", "Go to the playground and make up a game."),
    result: text("Тръгна за малко, а се прибра чак когато започна да се стъмва.", "You went out for a little while and only came home as it got dark."),
    stats: { health: 3, joy: 5 },
    visible: s => s.lifespanStart !== null && s.age < 13,
  },
  {
    id: "hospital.gp", category: "hospital",
    label: text("Обади се на личния лекар", "Call your GP"),
    description: text("Обсъди как се чувстваш и уговори преглед при нужда.", "Talk about how you have been feeling and arrange a check-up if needed."),
    result: text("Говори с личния си лекар и си записа час за преглед.", "You spoke to your GP and booked a check-up."),
    stats: { brains: 2, joy: 2 },
  },
  {
    id: "hospital.grandma", category: "hospital",
    label: text("Обади се на баба", "Call your grandma"),
    description: text("Потърси подкрепа от човек, който те познава от дете.", "Get some support from someone who has known you since childhood."),
    result: text("Баба ти те изслуша. Преди да затвори, попита кога ще ѝ гостуваш.", "Grandma heard you out. Before hanging up, she asked when you would come to see her."),
    stats: { joy: 7 },
  },
  {
    id: "hospital.clinic", category: "hospital",
    label: text("Отиди в поликлиниката", "Visit the clinic"),
    description: text("Отиди на преглед за неспешен здравословен проблем.", "Get checked for a non-emergency health issue."),
    result: text("В поликлиниката те прегледаха. След прегледа успя да се върнеш към обичайното си ежедневие.", "You had a check-up at the clinic and were able to return to your usual routine."),
    cost: 2_000, stats: { health: 8 },
    walletDelta: s => s.lifespanStart !== null && s.age < 16 ? 0 : -2_000,
    requires: s => s.lifeSystems.medicalIssue === "urgent"
      ? text("Има спешен случай. Използвай „Обади се на 112“.", "There is an emergency. Use “Call 112”.")
      : null,
    resolvesMedicalIssue: true,
  },
  {
    id: "hospital.emergency", category: "hospital",
    label: text("Обади се на 112", "Call 112"),
    description: text("Потърси спешна помощ при сериозен инцидент в играта.", "Get emergency help when a serious incident occurs in the game."),
    result: text("Екип на спешна помощ пристигна и те откара за преглед. Състоянието ти се стабилизира.", "An emergency team arrived and took you in for assessment. Your condition stabilized."),
    stats: { health: 18, joy: -3 }, time: 0,
    requires: s => s.lifeSystems.medicalIssue !== "urgent"
      ? text("Достъпно само при спешен случай в историята.", "Available during an emergency in your story.")
      : null,
    resolvesMedicalIssue: true,
  },
  {
    id: "hospital.therapy", category: "hospital",
    label: text("Срещни се с психолог", "See a psychologist"),
    description: text("Отдели време за разговор за стреса и настроението.", "Make time to talk about stress and how you have been feeling."),
    result: text("Разказа какво ти тежи и излезе с по-ясна представа откъде да започнеш.", "You talked through what was weighing on you and left with a clearer sense of where to start."),
    cost: 5_000, stats: { joy: 8, brains: 2 },
  },
  {
    id: "hospital.psychiatrist", category: "hospital",
    label: text("Посети психиатър", "Visit a psychiatrist"),
    description: text("Запази консултация, ако стресът пречи на ежедневието ти.", "Book a consultation if stress is getting in the way of everyday life."),
    result: text("Разказа как се чувстваш напоследък и уговори последваща среща.", "You talked about how you have been feeling lately and arranged a follow-up."),
    cost: 8_000, stats: { joy: 6, health: 3 },
  },
  {
    id: "hospital.eyes", category: "hospital",
    label: text("Провери зрението си", "Get an eye exam"),
    description: text("Запази час за очен преглед.", "Make an appointment for an eye exam."),
    result: text("Мина очния преглед и разбра защо се уморяваш толкова бързо, когато четеш.", "You had an eye exam and found out why reading had been tiring you out so quickly."),
    cost: 3_500, stats: { health: 3, brains: 2 },
  },

  {
    id: "gym.run", category: "gym",
    label: text("Отиди да тичаш", "Go for a run"),
    description: text("Излез за спокойно бягане по маршрут близо до дома.", "Take an easy run along a route close to home."),
    result: text("Изтича познатия маршрут и се прибра в по-добро настроение.", "You ran your usual route and came home in a better mood."),
    stats: { health: 5, joy: 3 }, requires: moderateFitness,
  },
  {
    id: "gym.weights", category: "gym",
    label: text("Тренирай с тежести", "Lift weights"),
    description: text("Посети залата за силова тренировка.", "Head to the gym for a strength session."),
    result: text("Записа си резултатите след тренировката и си набеляза следващата цел.", "You logged your lifts and picked a goal for your next session."),
    cost: 1_200, stats: { health: 4, looks: 4 }, requires: moderateFitness,
  },
  {
    id: "gym.hiit", category: "gym",
    label: text("Направи HIIT тренировка", "Do a HIIT session"),
    description: text("Запиши се за интензивна групова тренировка.", "Sign up for a high-intensity group session."),
    result: text("Издържа до края на тренировката и си даде време за почивка след нея.", "You made it to the end of the session and took some time to rest afterward."),
    cost: 1_500, stats: { health: 6, looks: 2 }, requires: intenseFitness,
  },
  {
    id: "gym.crossfit", category: "gym",
    label: text("Отиди на CrossFit", "Try CrossFit"),
    description: text("Тренирай с група и се запознай с хората в залата.", "Train with a group and get to know people at the gym."),
    result: text("Завърши тренировката с групата. Разменихте си контакти за следващото занимание.", "You finished the workout with the group and swapped numbers for the next session."),
    cost: 2_200, stats: { health: 5, looks: 3, influence: 2 }, requires: intenseFitness,
  },

  {
    id: "holidays.weekend", category: "holidays",
    label: text("Планирай уикенд извън града", "Plan a weekend away"),
    description: text("Намери нощувка и прекарай два дни извън града.", "Book a place to stay and spend two days out of town."),
    result: text("Намери малка къща за гости и се върна с желание за още един такъв уикенд.", "You found a small guesthouse and came home already wanting another weekend like it."),
    cost: 14_000, stats: { joy: 7, brains: 2 }, minAge: 18,
  },
  {
    id: "holidays.picnic", category: "holidays",
    label: text("Направи си пикник", "Go on a picnic"),
    description: text("Покани Ели и вземете по нещо за хапване.", "Invite Eli and pick up something to eat."),
    result: text("Ели донесе одеяло. Останахте, докато слънцето се скри зад дърветата.", "Eli brought a blanket. You stayed until the sun fell behind the trees."),
    cost: 1_800, stats: { joy: 5, health: 2 }, trust: { friend: 4 },
  },
  {
    id: "holidays.local", category: "holidays",
    label: text("Разходи се из България", "Take a trip around Bulgaria"),
    description: text("Избери близък град и прекарай деня в разглеждане.", "Pick a nearby town and spend the day exploring."),
    result: text("Разходи се из непознати улици и си набеляза още едно място за следващия път.", "You explored unfamiliar streets and found another place to visit next time."),
    cost: 6_500, stats: { joy: 5, brains: 4 },
  },
  {
    id: "holidays.abroad", category: "holidays",
    label: text("Замини за далечна дестинация", "Visit a faraway destination"),
    description: text("Планирай по-дълго пътуване с полет и нощувки.", "Plan a longer trip with flights and accommodation."),
    result: text("След дългия полет най-сетне излезе на улицата и чу език, който досега познаваше само от записи.", "After the long flight you finally stepped outside and heard a language you had only known from recordings."),
    cost: 180_000, stats: { joy: 11, brains: 6, health: -2 }, minAge: 18, time: 2,
  },

  {
    id: "aesthetics.hair", category: "aesthetics",
    label: text("Отиди на фризьор", "Get your hair done"),
    description: text("Освежи прическата и естествения си цвят.", "Refresh your hairstyle and natural color."),
    result: text("Излезе от салона и се спря да видиш новата си прическа в една витрина.", "You left the salon and stopped at a shop window to see your new hair."),
    cost: 3_000, stats: { looks: 5, joy: 2 },
  },
  {
    id: "aesthetics.massage", category: "aesthetics",
    label: text("Отиди на масаж", "Get a massage"),
    description: text("Запази час за релаксиращ масаж.", "Book a relaxing massage."),
    result: text("Остави телефона настрани за час и след това се почувства по-спокойно.", "You put your phone away for an hour and felt more at ease afterward."),
    cost: 4_500, stats: { joy: 6, health: 2 },
  },
  {
    id: "aesthetics.facial", category: "aesthetics",
    label: text("Направи си терапия за лице", "Get a facial"),
    description: text("Посети козметичен салон за грижа за лицето.", "Visit a salon for a facial treatment."),
    result: text("Записа си кои продукти ти харесаха и остана доволна от резултата.", "You made a note of the products you liked and were pleased with the result."),
    cost: 4_000, stats: { looks: 4, joy: 2 },
  },
  {
    id: "aesthetics.nails", category: "aesthetics",
    label: text("Направи си маникюр и педикюр", "Get a manicure and pedicure"),
    description: text("Избери цвят и запази час в салона.", "Choose a colour and book a salon appointment."),
    result: text("Взе цвят, който обикновено подминаваш. На дневна светлина ти хареса още повече.", "You chose a colour you usually pass over. You liked it even more in daylight."),
    cost: 3_800, stats: { looks: 3, joy: 4 },
  },
  {
    id: "aesthetics.makeup", category: "aesthetics",
    label: text("Пробвай професионален грим", "Try professional make-up"),
    description: text("Направи пробен грим за снимки или повод.", "Try a make-up look for photos or an occasion."),
    result: text("Гримьорката ти показа два варианта. Запази снимка на този, който ти хареса.", "The make-up artist showed you two looks. You saved a picture of the one you liked."),
    cost: 5_000, stats: { looks: 5, joy: 2 },
  },
  {
    id: "aesthetics.barber", category: "aesthetics",
    label: text("Отиди в барбър салон", "Visit a barber"),
    description: text("Поискай къса прическа и оформяне.", "Ask for a short cut and a clean-up."),
    result: text("Избра къса прическа. От салона ти дадоха снимка, за да можеш да я покажеш следващия път.", "You went for a short cut. The salon gave you a photo to bring in next time."),
    cost: 2_200, stats: { looks: 4, joy: 1 },
  },
  {
    id: "aesthetics.botox", category: "aesthetics",
    label: text("Постави си ботокс", "Get Botox"),
    description: text("Обсъди естетична процедура в клиника и отдели време за възстановяване.", "Discuss a cosmetic procedure at a clinic and leave time to recover."),
    result: text("В клиниката обсъдихте какъв резултат очакваш. След посещението освободи останалата част от деня.", "You discussed the result you wanted at the clinic and kept the rest of the day clear afterward."),
    cost: 28_000, stats: { looks: 5, health: -2 }, minAge: 18, city: "sofia", requires: electiveProcedure,
  },
  {
    id: "aesthetics.filler", category: "aesthetics",
    label: text("Постави си филър", "Get filler"),
    description: text("Уговори естетична процедура и планирай възстановяването си.", "Book a cosmetic procedure and plan for recovery."),
    result: text("След посещението в клиниката отложи снимките, докато се възстановиш.", "After your clinic visit, you put off photos until you had recovered."),
    cost: 40_000, stats: { looks: 6, health: -3 }, minAge: 18, city: "sofia", requires: electiveProcedure,
  },
  {
    id: "aesthetics.liposuction", category: "aesthetics",
    label: text("Направи си липосукция", "Get liposuction"),
    description: text("Планирай операция и отдели време и пари за възстановяване.", "Plan the surgery and set aside time and money for recovery."),
    result: text("След операцията освободи графика си за почивка и последващи прегледи.", "After surgery, you cleared your schedule for rest and follow-up appointments."),
    cost: 260_000, stats: { looks: 8, health: -9, joy: -2 }, minAge: 18, city: "sofia", time: 2, requires: electiveProcedure,
  },
  {
    id: "aesthetics.augmentation", category: "aesthetics",
    label: text("Направи си операция за уголемяване на бюста", "Get breast augmentation"),
    description: text("Уговори консултация, операция и период за възстановяване.", "Plan for a consultation, surgery and time to recover."),
    result: text("След операцията помоли близките си за помощ, докато се върнеш към обичайното си ежедневие.", "After surgery you asked people close to you for help while you got back to your usual routine."),
    cost: 420_000, stats: { looks: 9, health: -10, joy: -2 }, minAge: 18, city: "sofia", time: 2, requires: electiveProcedure,
  },

  {
    id: "fun.club", category: "fun",
    label: text("Отиди на нощен клуб", "Go to a nightclub"),
    description: text("Излез да танцуваш до късно.", "Go out dancing late."),
    result: text("Танцува до последната песен. На сутринта ти се искаше да си тръгнала малко по-рано.", "You danced until the last song. The next morning you wished you had left a little earlier."),
    cost: 4_500, stats: { joy: 8, influence: 3, health: -4 }, minAge: 18, city: "sofia",
  },
  {
    id: "fun.bar", category: "fun",
    label: text("Отиди на бар", "Visit a bar"),
    description: text("Излез на питие с компания.", "Go out for a drink with company."),
    result: text("Приказките продължиха по-дълго от планираното и си тръгна с една нова покана.", "The conversation went longer than planned and you left with a new invitation."),
    cost: 2_500, stats: { joy: 5, influence: 2, health: -2 }, minAge: 18,
  },
  {
    id: "fun.dinner", category: "fun",
    label: text("Вечеряй в изискан ресторант", "Go out for a fancy dinner"),
    description: text("Резервирай маса за вечеря, за която ще си спомняш.", "Book a table for a memorable dinner."),
    result: text("Поръча ястие, което не беше опитвала. После записа името му, за да го потърсиш пак.", "You ordered something you had never tried and wrote down its name so you could find it again."),
    cost: 7_500, stats: { joy: 7 },
  },
  {
    id: "fun.cinema", category: "fun",
    label: text("Отиди на кино", "Go to the cinema"),
    description: text("Вземи билет за филм, който ти е любопитен.", "Get a ticket for a film you are curious about."),
    result: text("Финалът те изненада. На излизане чу, че и други зрители спорят за него.", "The ending surprised you. On your way out you heard other people arguing about it too."),
    cost: 1_400, stats: { joy: 5, brains: 1 },
  },
  {
    id: "fun.theatre", category: "fun",
    label: text("Отиди на театър", "Go to the theatre"),
    description: text("Избери постановка и си вземи билет.", "Choose a play and get a ticket."),
    result: text("Няколко реплики от постановката ти останаха в главата и след края.", "A few lines from the play stayed in your head long after it ended."),
    cost: 2_200, stats: { joy: 4, brains: 4 },
  },
  {
    id: "fun.concert", category: "fun",
    label: text("Отиди на концерт", "Go to a concert"),
    description: text("Чуй музика на живо с компания.", "Go out with friends to hear live music."),
    result: text("Публиката изпя последния припев заедно. После компанията си размени снимки от вечерта.", "The whole crowd sang the final chorus together. Later the group traded photos from the night."),
    cost: 3_800, stats: { joy: 7, influence: 2 },
  },
  {
    id: "fun.escape-room", category: "fun",
    label: text("Отиди в ескейп стая", "Try an escape room"),
    description: text("Събери отбор за час загадки.", "Get a team together for an hour of puzzles."),
    result: text("Намери последната подсказка навреме. Отборът вече спори коя стая да пробвате следващия път.", "You found the last clue in time. The team is already debating which room to try next."),
    cost: 2_600, stats: { joy: 4, brains: 5, influence: 2 }, city: "sofia",
  },
  {
    id: "fun.mall", category: "fun",
    label: text("Отиди в мола", "Go to the mall"),
    description: text("Разгледай магазините и си купи нещо за гардероба.", "Browse the shops and pick up something for your wardrobe."),
    result: text("Намери дреха, която се връзва с почти всичко, което вече имаш.", "You found something that goes with nearly everything you already own."),
    cost: 3_500, stats: { looks: 3, joy: 4 }, city: "sofia",
  },
];
