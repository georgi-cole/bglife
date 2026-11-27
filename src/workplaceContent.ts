
import type { Text } from "./engine.ts";
import type { StatDelta } from "./lifeStats.ts";
import { pathText as t, type Job } from "./pathCatalog.ts";

export type WorkContactId = "boss" | "colleague-1" | "colleague-2";
export type WorkEffect = {
  performance?: number;
  contact?: WorkContactId;
  relationship?: number;
  stats?: StatDelta;
  cash?: number;
};

type Task = WorkEffect & { label: Text; outcome: Text };
type ScenarioChoice = Task & { id: string };
export type WorkScenario = { id: string; title: Text; situation: Text; choices: ScenarioChoice[] };
type Track = { boss: Text; colleague: Text; tasks: [Task, Task]; scenario: WorkScenario };

const task = (label: Text, outcome: Text, effect: WorkEffect): Task => ({ label, outcome, ...effect });

function scenario(id: string, title: Text, situation: Text, choices: [Task, Task]): WorkScenario {
  return { id, title, situation, choices: choices.map((choice, i) => ({ ...choice, id: i === 0 ? "first" : "second" })) };
}

const workTracks = {
  qa: {
    boss: t("Ръководител на QA екипа", "QA lead"), colleague: t("QA екип", "QA team"),
    tasks: [
      task(t("Тествай новата версия", "Test the new release"), t("Хванах срив преди версията да стигне до клиентите.", "I caught a crash before the release reached customers."), { performance: 9, stats: { brains: 1 } }),
      task(t("Автоматизирай проверките", "Automate a set of checks"), t("Автоматизирах проверка, която дотогава правехме на ръка.", "I automated a check the team used to run by hand."), { performance: 7, stats: { brains: 2 } }),
    ],
    scenario: scenario("qa-release", t("Бъг в петък", "A Friday bug"),
      t("Час преди пускането намираш бъг, при който поръчките се дублират.", "An hour before release, you find a bug that duplicates orders."), [
        task(t("Поискай да спрем пускането", "Ask to hold the release"), t("Спряхме пускането и оправихме бъга преди клиентите да го видят.", "We held the release and fixed the bug before customers saw it."), { performance: 10, contact: "boss", relationship: 6, stats: { joy: -2 } }),
        task(t("Пусни само готовата част", "Release the unaffected features"), t("Пуснахме само готовите промени. Екипът довърши поправката в понеделник.", "We shipped the unaffected changes. The team finished the fix on Monday."), { performance: 5, contact: "colleague-1", relationship: 4 }),
      ]),
  },
  software: {
    boss: t("Технически ръководител", "Engineering lead"), colleague: t("Разработка", "Engineering team"),
    tasks: [
      task(t("Поправи бавния екран", "Fix a slow screen"), t("Ускорих най-бавния екран и спряхме да получаваме оплаквания за него.", "I sped up our slowest screen and the complaints stopped."), { performance: 9, stats: { brains: 1 } }),
      task(t("Направи преглед на кода", "Review a teammate’s code"), t("Открих проблем в кода, докато още можехме да го поправим лесно.", "I spotted a problem while it was still easy to fix."), { performance: 6, contact: "colleague-1", relationship: 5 }),
    ],
    scenario: scenario("software-outage", t("Понеделник без достъп", "Monday outage"),
      t("След обновяване клиентите не могат да влязат в профилите си. Колегите чакат решение.", "After an update, customers can’t sign in. The team is waiting for a decision."), [
        task(t("Върни последната стабилна версия", "Restore the last stable version"), t("Върнах стабилната версия и клиентите отново получиха достъп.", "I restored the stable version and customers could sign in again."), { performance: 8, contact: "boss", relationship: 4 }),
        task(t("Отстрани проблема с екипа", "Fix the issue with the team"), t("Намерихме причината заедно. Системата заработи към края на смяната.", "We found the cause together. The system was back by the end of the shift."), { performance: 5, contact: "colleague-1", relationship: 8, stats: { joy: -2 } }),
      ]),
  },
  health: {
    boss: t("Ръководител на отделението", "Ward lead"), colleague: t("Екип в отделението", "Ward team"),
    tasks: [
      task(t("Подреди предаването на смяната", "Organise the shift handover"), t("Подредих предаването на смяната. Следващият екип започна спокойно.", "I organised the handover so the next team could start smoothly."), { performance: 9, contact: "colleague-1", relationship: 4 }),
      task(t("Обнови графика за прием", "Update the admissions schedule"), t("Освободих място в графика и хората на регистратурата си поеха дъх.", "I made room in the schedule and reception finally caught its breath."), { performance: 7, stats: { influence: 1 } }),
    ],
    scenario: scenario("health-handover", t("Натоварена смяна", "A packed shift"),
      t("В края на смяната чакалнята е пълна. Колега се опитва да подреди приема сам.", "The waiting room is still full at closing time. A colleague is organising admissions alone."), [
        task(t("Остани да помогнеш с графика", "Stay to help with the schedule"), t("Останах и подредихме приема заедно. Прибрах се по-късно.", "I stayed and sorted the admissions schedule with my colleague. I got home late."), { performance: 7, contact: "colleague-1", relationship: 8, stats: { joy: -2 } }),
        task(t("Поискай помощ от ръководителя", "Ask the lead for cover"), t("Ръководителят намери свободен човек и предадох смяната навреме.", "The lead found cover, and I handed over my shift on time."), { performance: 4, contact: "boss", relationship: 5 }),
      ]),
  },
  retail: {
    boss: t("Управител", "Store manager"), colleague: t("Обслужване", "Customer service"),
    tasks: [
      task(t("Подреди стоката и наличностите", "Organise stock and inventory"), t("Изравних наличностите и улесних следващата смяна.", "I reconciled stock and made the next shift’s job easier."), { performance: 8, contact: "colleague-1", relationship: 3 }),
      task(t("Поеми натоварения час", "Cover the rush"), t("Поех опашката. Успяхме да обслужим всички преди края на смяната.", "I took the queue and we served everyone before the shift ended."), { performance: 9, stats: { joy: -2, influence: 1 } }),
    ],
    scenario: scenario("retail-rush", t("Опашка до входа", "The queue reaches the door"),
      t("Точно преди обяд терминалът спира. От опашката вече питат дали има смисъл да чакат.", "Just before lunch the card terminal goes down. People are asking whether they should wait."), [
        task(t("Организирай обслужването с колега", "Organise service with a coworker"), t("Разделихме задачите и обслужихме опашката, докато техникът оправяше терминала.", "We split the work and served the queue while the terminal was fixed."), { performance: 8, contact: "colleague-1", relationship: 6, stats: { joy: -2 } }),
        task(t("Извикай управителя", "Call the store manager"), t("Управителят пусна резервния терминал и опашката тръгна.", "The manager set up the backup terminal and the queue moved again."), { performance: 4, contact: "boss", relationship: 4 }),
      ]),
  },
  hospitality: {
    boss: t("Управител на обекта", "Venue manager"), colleague: t("Прием и обслужване", "Reception and service"),
    tasks: [
      task(t("Потвърди резервациите", "Confirm the bookings"), t("Хванах двойна резервация, преди гостите да пристигнат.", "I caught a double booking before the guests arrived."), { performance: 9, stats: { influence: 1 } }),
      task(t("Подготви посрещането на група", "Prepare a group arrival"), t("Посрещнахме групата навреме и получихме добра обратна връзка.", "We got the group settled on time and received good feedback."), { performance: 7, contact: "colleague-1", relationship: 4 }),
    ],
    scenario: scenario("hospitality-booking", t("Две резервации", "A double booking"),
      t("Две групи са с една и съща резервация, а едната вече пристига.", "Two groups have the same booking, and one is already arriving."), [
        task(t("Намери вариант на място", "Find room on site"), t("Пренаредих графика и намерих място за двете групи.", "I rearranged the schedule and found room for both groups."), { performance: 9, contact: "boss", relationship: 4 }),
        task(t("Уреди алтернатива наблизо", "Arrange a place nearby"), t("Намерих място наблизо и колега придружи гостите.", "I found a place nearby, and a coworker helped the guests get there."), { performance: 5, contact: "colleague-1", relationship: 7 }),
      ]),
  },

  cafe: {
    boss: t("Управител на кафенето", "Café manager"), colleague: t("Бар", "Coffee bar"),
    tasks: [
      task(t("Подготви бара за сутринта", "Set up the coffee bar"), t("Подготвих бара и сутрешната опашка тръгна бързо.", "I set up the bar and the morning queue moved quickly."), { performance: 8, contact: "colleague-1", relationship: 4 }),
      task(t("Настрой машината и мелачката", "Tune the coffee machine and grinder"), t("След настройката кафето излизаше по-постоянно през цялата смяна.", "Once I adjusted the equipment, the coffee stayed consistent through the shift."), { performance: 8, stats: { brains: 1 } }),
    ],
    scenario: scenario("cafe-shortage", t("Кафе без кафе", "Out of the house blend"),
      t("В сутрешния наплив свършва любимото кафе на редовните клиенти.", "During the morning rush, you run out of the regulars’ favourite coffee."), [
        task(t("Предложи наличната алтернатива", "Offer an alternative from stock"), t("Предложих друг сорт. Няколко редовни клиенти си намериха ново любимо кафе.", "I offered a different blend. A few regulars found a new favourite."), { performance: 8, contact: "boss", relationship: 4, stats: { influence: 1 } }),
        task(t("Уреди доставка с колега", "Arrange a delivery with a coworker"), t("Колегата пое бара, докато намерих кафе от партньорски обект.", "My coworker took over the bar while I found coffee from a partner café."), { performance: 6, contact: "colleague-1", relationship: 7 }),
      ]),
  },
  service: {
    boss: t("Ръководител обслужване", "Customer service lead"), colleague: t("Клиентски център", "Customer support team"),
    tasks: [
      task(t("Приключи отворените запитвания", "Follow up on open enquiries"), t("Приключих запитвания, които се въртяха между два екипа.", "I closed enquiries that had been bouncing between teams."), { performance: 9, stats: { influence: 1 } }),
      task(t("Обнови отговорите на чести въпроси", "Update the common answers"), t("Обнових отговорите и колегите започнаха да решават случаите по-бързо.", "I updated the answers so the team could solve cases faster."), { performance: 7, contact: "colleague-1", relationship: 5 }),
    ],
    scenario: scenario("service-callback", t("Трето обаждане", "The third call"),
      t("Клиент звъни за трети път за същия проблем. Досега са го препращали между два отдела.", "A customer calls a third time about the same issue. Two departments have already passed them around."), [
        task(t("Поеми случая до край", "Own the case until it’s resolved"), t("Останах по случая, докато клиентът получи отговор.", "I stayed on the case until the customer got an answer."), { performance: 9, contact: "boss", relationship: 5, stats: { joy: -2 } }),
        task(t("Организирай общ разговор с отдела", "Arrange a joint call with the other team"), t("Включих правилния човек и решихме случая в едно обаждане.", "I brought in the right person and resolved the case in one call."), { performance: 6, contact: "colleague-1", relationship: 5 }),
      ]),
  },
  logistics: {
    boss: t("Отговорник на смяната", "Shift supervisor"), colleague: t("Логистика", "Logistics team"),
    tasks: [
      task(t("Провери пратките и документите", "Check shipments and paperwork"), t("Хванах разменен етикет, преди пратката да потегли.", "I caught a swapped label before the shipment left."), { performance: 8, stats: { brains: 1 } }),
      task(t("Пренареди графика на товаренето", "Rework the loading schedule"), t("Пренаредих графика и спестих чакане на следващата смяна.", "I cut the next shift’s waiting time by reworking the loading schedule."), { performance: 7, contact: "colleague-1", relationship: 5 }),
    ],
    scenario: scenario("logistics-delivery", t("Последният курс", "The last run"),
      t("Една пратка още не е готова, а последният курс потегля след 20 минути.", "One shipment isn’t ready, and the last run leaves in 20 minutes."), [
        task(t("Премести я на следващия курс", "Rebook it for the next run"), t("Организирах следващ курс и предупредих клиента.", "I rebooked the shipment and let the customer know."), { performance: 5, contact: "boss", relationship: 3 }),
        task(t("Помогни на колегите да я подготвят", "Help the team get it ready"), t("Подготвихме пратката заедно и тя замина навреме.", "We got the shipment ready together and it left on time."), { performance: 8, contact: "colleague-1", relationship: 6, stats: { joy: -2 } }),
      ]),
  },
  craft: {
    boss: t("Ръководител на ателието", "Studio lead"), colleague: t("Ателие", "Studio team"),
    tasks: [
      task(t("Направи пробна изработка", "Build a sample"), t("Направих пробна изработка и клиентът одобри идеята.", "I made a sample and the customer approved the design."), { performance: 9, stats: { brains: 1 } }),
      task(t("Подготви материалите за поръчката", "Prepare materials for the order"), t("Подготвих материалите и ателието приключи поръчката навреме.", "I prepared the materials and the studio finished the order on time."), { performance: 7, contact: "colleague-1", relationship: 4 }),
    ],
    scenario: scenario("craft-order", t("Поръчка за вчера", "A rush order"),
      t("Клиент иска промяна по поръчката в деня преди предаване.", "A customer asks for a design change the day before delivery."), [
        task(t("Предложи промяна с нов срок", "Offer a change with a new deadline"), t("Договорих нов срок и запазих поръчката.", "I agreed on a new deadline and kept the order."), { performance: 7, contact: "boss", relationship: 5 }),
        task(t("Довърши с помощ от ателието", "Finish it with the studio team"), t("Останахме след работа и успяхме да предадем поръчката.", "We stayed late and delivered the order on time."), { performance: 9, contact: "colleague-1", relationship: 7, stats: { joy: -3 } }),
      ]),
  },
  industry: {
    boss: t("Ръководител на участъка", "Operations supervisor"), colleague: t("Технически екип", "Technical team"),
    tasks: [
      task(t("Провери качеството на партидата", "Check batch quality"), t("Отделих дефектните бройки, преди партидата да замине.", "I set aside defective items before the batch shipped."), { performance: 9, stats: { brains: 1 } }),
      task(t("Подреди дневника на смяната", "Update the shift log"), t("Обнових дневника и следващата смяна знаеше откъде да започне.", "I updated the log so the next shift knew where to start."), { performance: 6, contact: "colleague-1", relationship: 5 }),
    ],
    scenario: scenario("industry-check", t("Бракувана партида", "A failed batch check"),
      t("При проверка откриваш дефекти. Началникът пита как да наваксате поръчката.", "You find defects during a check. The supervisor asks how you can still make the order."), [
        task(t("Отдели партидата и провери причината", "Set the batch aside and review the cause"), t("Отделих дефектната партида. Намерихме проблема, преди да се повтори.", "I isolated the defective batch. We found the cause before it happened again."), { performance: 9, contact: "boss", relationship: 6, stats: { joy: -2 } }),
        task(t("Премести поръчката към следващата партида", "Move the order to the next batch"), t("Пренасочих поръчката и клиентът прие краткото закъснение.", "I moved the order to the next batch, and the customer accepted the short delay."), { performance: 5, contact: "colleague-1", relationship: 4 }),
      ]),
  },
  culture: {
    boss: t("Ръководител на програмата", "Programme lead"), colleague: t("Екип на програмата", "Programme team"),
    tasks: [
      task(t("Подготви материалите за посетители", "Prepare visitor materials"), t("Обнових материалите и посетителите намираха всичко по-лесно.", "I updated the materials so visitors could find their way more easily."), { performance: 8, stats: { brains: 1 } }),
      task(t("Организирай посещение на група", "Organise a group visit"), t("Подредих посещението на групата и програмата мина по план.", "I organised the group visit and the programme ran on schedule."), { performance: 7, contact: "colleague-1", relationship: 5 }),
    ],
    scenario: scenario("culture-visit", t("Група без записване", "An unscheduled visit"),
      t("Учител води цял клас, но резервацията им е за следващата седмица.", "A teacher arrives with a whole class, but their booking is for next week."), [
        task(t("Подготви кратка обиколка", "Put together a short tour"), t("Направих кратка обиколка и класът си тръгна с история за разказване.", "I put together a short tour and the class left with a story to tell."), { performance: 8, contact: "boss", relationship: 4, stats: { joy: 1 } }),
        task(t("Потърси свободно място с колега", "Look for an opening with a coworker"), t("Намерихме свободен час и колегата прие групата.", "We found an open slot and my coworker welcomed the group."), { performance: 5, contact: "colleague-1", relationship: 6 }),
      ]),
  },
  office: {
    boss: t("Ръководител на екипа", "Team lead"), colleague: t("Екип", "Team member"),
    tasks: [
      task(t("Прегледай документите по проекта", "Review project documents"), t("Намерих разминаване в документите и го изчистих преди крайния срок.", "I caught a discrepancy in the documents and cleared it up before the deadline."), { performance: 8, stats: { brains: 1 } }),
      task(t("Подготви седмичния отчет", "Prepare the weekly report"), t("Подготвих отчета и помогнах на екипа да си подреди приоритетите.", "I prepared the report and helped the team set its priorities."), { performance: 7, contact: "colleague-1", relationship: 4 }),
    ],
    scenario: scenario("office-deadline", t("Два срока наведнъж", "Two deadlines at once"),
      t("Две задачи са за днес. Колега казва, че ще успеете с едната, ако си разделите работата.", "Two tasks are due today. A coworker says you can finish one if you split the work."), [
        task(t("Договори кой срок е с приоритет", "Agree on which deadline comes first"), t("Подредихме приоритетите и предадохме важната задача навреме.", "We agreed on priorities and delivered the important task on time."), { performance: 7, contact: "boss", relationship: 6 }),
        task(t("Раздели задачата с колегата", "Split the work with your coworker"), t("Предадохме задачата заедно. Другият срок се премести за утре.", "We delivered the task together. The other deadline moved to tomorrow."), { performance: 5, contact: "colleague-1", relationship: 8 }),
      ]),
  },
} satisfies Record<string, Track>;

type TrackId = keyof typeof workTracks;
const legacyTracks: Partial<Record<string, TrackId>> = {
  software: "qa", electronics: "industry", agronomy: "industry", agriculture: "industry", food: "industry",
  building: "industry", machine: "industry", machinery: "industry", energy: "industry", glass: "industry",
  textiles: "industry", laboratory: "industry", orchard: "industry", clinic: "health", animal: "health",
  port: "logistics", shipping: "logistics", rail: "logistics", metro: "logistics", border: "logistics", warehousing: "logistics",
  craft: "craft", studio: "craft", woodcarving: "craft", hotel: "hospitality", spa: "hospitality", events: "hospitality",
  outdoors: "hospitality", trade: "retail", "become-guide": "culture", university: "culture", heritage: "culture",
  publishing: "culture", education: "culture",
};

export function workTrack(job: Job): Track & { id: TrackId } {
  const id = job.id;
  let track: TrackId;
  if (id.startsWith("local-")) track = legacyTracks[id.slice(6)] ?? "office";
  else if (job.requirement === "medicine" || job.requirement === "nursing") track = "health";
  else if (id.startsWith("sofia-qa")) track = "qa";
  else if (id === "sofia-developer") track = "software";
  else if (/warehouse/.test(id)) track = "logistics";
  else if (/cafe/.test(id)) track = "cafe";
  else if (/hotel|reception/.test(id)) track = "hospitality";
  else if (/support/.test(id)) track = "service";
  else if (/library|museum/.test(id)) track = "culture";
  else if (/workshop|carver|design/.test(id)) track = "craft";
  else if (/shop/.test(id)) track = "retail";
  else track = "office";
  return { id: track, ...workTracks[track] };
}

export const workScenarios: WorkScenario[] = [
  scenario("cover-shift", t("Смяна в последния момент", "A last-minute shift"),
    t("Колега отсъства, а ръководителят търси човек за допълнителна платена смяна.", "A coworker is away, and the manager needs someone to cover an extra paid shift."), [
      task(t("Поеми смяната за 60 €", "Cover the shift for €60"), t("Поех допълнителната смяна и получих уговорените 60 €.", "I covered the shift and received the agreed €60."), { performance: 5, contact: "boss", relationship: 5, stats: { joy: -3 }, cash: 6000 }),
      task(t("Запази свободния си ден", "Keep your day off"), t("Запазих свободния си ден и си починах.", "I kept my day off and got some rest."), { stats: { joy: 2 } }),
    ]),
  scenario("credit", t("Чия беше идеята?", "Whose idea was it?"),
    t("Ръководителят хвали твоя принос, а идеята всъщност е на колега от екипа.", "The manager praises you for an idea that came from someone else on the team."), [
      task(t("Отдай заслуженото на колегата", "Give your coworker credit"), t("Казах чия беше идеята. Колегата оцени, че го споменах.", "I said whose idea it was, and my coworker appreciated the recognition."), { contact: "colleague-1", relationship: 10, stats: { influence: 1 } }),
      task(t("Приеми похвалата", "Accept the praise"), t("Приех похвалата. Колегата остана настрана след срещата.", "I accepted the praise. My coworker kept their distance after the meeting."), { performance: 5, contact: "colleague-1", relationship: -9 }),
    ]),
  scenario("new-teammate", t("Първа седмица в екипа", "First week on the team"),
    t("Нов колега има нужда от помощ, а твоята задача е със срок до края на деня.", "A new coworker needs help, and your own assignment is due by the end of the day."), [
      task(t("Отдели време да помогнеш", "Make time to help"), t("Помогнах на новия колега и довърших задачата си в последния момент.", "I helped the new coworker and finished my own work just in time."), { performance: 3, contact: "colleague-2", relationship: 9, stats: { joy: 1 } }),
      task(t("Довърши задачата си навреме", "Finish your own assignment on time"), t("Предадох задачата рано. Друг колега пое въвеждането.", "I handed my work in early. Another coworker took over the onboarding."), { performance: 7 }),
    ]),
];
