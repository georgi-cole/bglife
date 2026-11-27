# BgLife

BgLife follows one life from birth through age 131. Choose a birth city, make decisions between birthdays, and revisit the years in your journal. Lives born in Tryavna can follow the original age 16–26 storyline. The interface and story support Bulgarian and English.

## Play the game

[Play BgLife on GitHub Pages](https://georgi-cole.github.io/bglife/).

Open **BgLife-Playable.html** at the top of the downloaded ZIP in a browser. When building from source, the same file is generated under **release/**. The release file includes the game, styles and both location illustrations. It works without a server or network connection. Mobile file viewers sometimes show a document preview, so use a browser or the locally served web build for playtesting.

The game saves in browser storage on the current device. Keep the same browser and address to resume. File-URL storage behaviour varies between browsers. A private window or clearing site data may erase a life.

## Family play

Use **+1 year** to continue a life through childhood and adulthood. In an active save from the original chapter, the game resumes the life under the newer lifespan rules. Open a partner's profile in **People** for intimacy options. **Hospital → Fertility** offers consultations and treatments to adult female characters. **Love and family → Adoption** takes an application through assessment, the register and a match. A birth opens the naming form with a suggested Bulgarian name. Married biological parents use the father's surname, while unmarried parents in the game can choose either surname.

The conception curve uses [ACOG's per-cycle estimates](https://www.acog.org/womens-health/faqs/having-a-baby-after-age-35-how-aging-affects-fertility-and-pregnancy) as anchors. A single unprotected encounter is a fraction of a planned cycle in the game. Age points between the anchors and the small chance before menopause in later years are simulated, informed by [CDC guidance](https://www.cdc.gov/contraception/hcp/usspr/contraception-not-needed.html). The [Norwegian pregnancy register study](https://www.bmj.com/content/364/bmj.l869) supplies miscarriage age bands. IVF is based on pregnancy per embryo transfer data from the [HFEA](https://www.hfea.gov.uk/about-us/publications/research-and-data/fertility-treatment-2023-trends-and-figures). The [NSI birth statistics](https://www.nsi.bg/press-release/naselenie-i-demografski-procesi-9002) inform the frequency of multiple births. The game assigns its own procedure prices, eligibility and pacing.

The Bulgarian [Family Code](https://justice.government.bg/home/normdoc/2135637484) informs the adoption age gap and progression through assessment and matching. Suggested names combine traditional Bulgarian names with popular names from the [NSI](https://www.nsi.bg/news/imenata-v-balgariya-prez-2025-godina-9373). Family conversations are fictional, drawing on discussions of social pressure in Bulgaria reported by [BTA](https://www.bta.bg/bg/news/bulgaria/1205425-informiranostta-i-navremennata-grizha-sa-klyuchovi-za-reproduktivnoto-zdrave-po).

## Run the source

Install Node.js 24 or later. From this directory run

```sh
npm ci
npm run dev
```

Open **http://127.0.0.1:4187/**. Source changes rebuild automatically. Refresh the page to load them. Set the `PORT` environment variable to use another port.

```sh
npm test
npm run typecheck
npm run build
```

The production build creates **dist/** for static hosting, and **release/BgLife-Playable.html** for offline distribution. Serve the complete contents of `dist/` together. The local development server and a hosted deployment have separate saves. To create a ZIP containing the standalone game, compiled web build and complete source, run `python scripts/package.py` with Python 3.

Pull requests into `main` run TypeScript, the simulation regression suite, and mobile browser smoke tests against the production build. The smoke tests use Chromium and WebKit to exercise the GitHub Pages path and the offline playtest. To run them locally, build the game and install the Playwright browsers.

```sh
npm run build
npx playwright install chromium webkit
npm run test:browser
```

The GitHub Pages workflow checks and builds every push to `main`, then publishes `dist/`. Repository Settings → Pages uses **GitHub Actions** as the publishing source.

## Population data

- [NSI period life table, 2023–2025](https://www.nsi.bg/statistical-data/212/681) supplies the probability of death between consecutive birthdays by age and sex through age 99. The game extends the published 100+ group with a smooth curve and caps playable ages at 131.
- [NSI life expectancy by district and sex, 2023–2025](https://www.nsi.bg/statistical-data/212/678) calibrates adult hazards. The city catalog uses the [NSI settlement register](https://www.nsi.bg/nrnm/special/ekatte/regions). Sofia is the shared administrative centre of two districts. A life in Sofia uses the capital district, and Samokov gives Sofia Province its own playable location.
- [NSI cause-of-death rates, 2025](https://www.nsi.bg/statistical-data/236/765) provide the national mix of causes by age band and sex. Health and conditions adjust the corresponding hazards. The active character's hazard multiplier is 0.82.
- Retirement uses rounded ages and credited working years based on the [NSSI eligibility schedule](https://www.nssi.bg/fizicheski-lica/pensii-bg/trudova-deinost-pridobivane-pravo/pensii-za-osig-staj-v-namalen-razmer/). Pay, expenses and pensions are gameplay values.

New cities declare their oblast in `src/cities.ts`. Legacy saves replay their original years before the new rules take effect. An active save that closed the old chapter opens at 27.

## Family and city content

A new profile always starts at birth. Choose a name, sex, city and talent. The in-game VIP trial unlocks the wealthy heir start, newborn appearance editor and starting personality trait. The trial is stored on this device.

Birth families are generated from the seed before the first turn and continue aging in People. The [NSI 2025 population yearbook](https://www.nsi.bg/file/38429/DMGR2025.pdf) supplies birth-order weights and the [NSI 2025 maternal-age table](https://www.nsi.bg/statistical-data/217/692) supplies district averages at first birth. Shared households and the rare alternative-care arrangements use gameplay weights, informed by [Census 2021](https://www.nsi.bg/index.php/file/24384/Census2021_Families.pdf). Household structure at a census and care at the birth of a child measure different things.

Each playable city has cultural content in `src/cityCulture.ts` and school, study and work entries in `src/cityPaths.ts`. Add both records when you add a city. The [IBE–BAS dialect atlas](https://ibl.bas.bg/en/interaktivna-dialektna-karta-na-balgarskiya-ezik/) gives broad speech regions. Dialogue and habits are fictional examples. The [education register](https://ri.mon.bg/) and the [Economic Map of Bulgaria](https://map.mi.government.bg/) inform the catalog. Program examples, availability and salaries are adapted for the game.

Profiles saved before this update keep their original family and avatar data. The new family model applies when starting a new life.

### City life

Every playable city has a bilingual profile in `src/cityLifeData/<city-id>.ts`. Its first two places are used for childhood and outings. Add more places to the same list as the city grows. Population is the city proper on 31 December 2025 ([NSI table](https://www.nsi.bg/statistical-data/206/648)). `cityLifeModel.ts` records the population snapshot and the [IBE–BAS speech atlas](https://ibl.bas.bg/nova_dialektna_karta/) and [NIMH climate normals](https://meteo.bg/meteo7/en/node/776) used as references for fictional speech and game weather.

- Shared scenes in `src/lifeVignettes.ts` use the same saved event IDs. Give them age ranges and optional eligibility rules for facts such as a living sibling at home, current schooling or a player-selected talent. An empty choice list records a journal moment. The first birthday, preschool and first school day draw among variants of their own milestone. Shared scenes appear at most once per life across cities.
- Edit `occasion` for the local celebration. Store the organizer’s link and a date or plausible month window for editions that move. Write original BG/EN dialogue and explain which people and places are involved in the scene.
- Edit `story.opening` and `story.continuation` for the main two-part story. `from` and `through` control the opening’s ages. The first offer can arrive over a window of up to four ages from `from`. Step `months` can restrict it to the appropriate season. Amounts are in cents. Additional `events` can define age ranges, calendar windows, cooldowns, choices and follow-ups with `after: { action: "event-id.choice-id", years: 1 }`. The separate Surova visit in `pernik.ts` is an example.
- Keep released event and choice IDs stable. Each new-year command records the actual scene and date so adding entries does not redraw an old game. Keep old options and effects available to replay. Set `retired: true` on a custom event to stop future invitations while keeping saved years playable. Give a substantially different scene a new ID.
- Add a city in `cities.ts`, `cityCulture.ts`, `cityPaths.ts` and the `cityLifeData` index. Run `npm run typecheck` and `npm test` to check coverage, dates, option IDs, story links and saved games.

## Education, work, and social insurance

Every new life starts at birth. Education is available through childhood, with first-grade enrollment at age seven. From age 18, Career contains school, university, work, and social insurance. Annual outcomes appear in the journal and the wallet uses the same income and expenses as the yearly settlement.

- School preparation and assessments contribute to admission and graduation. University outcomes use diploma grades and, where applicable, entrance exams. Tuition and scholarships enter the annual budget.
- A local vacancy can lead to a callback, interview, and contract. Qualifications and, for some professions, registration affect eligibility. Contracts accumulate insured service for unemployment and retirement.
- Career uses the 29 playable cities listed in `src/cities.ts`. `src/cityPaths.ts` supplies local institutions and roles. `src/pathCatalog.ts` adds neighborhood detail, career requirements, university programs, and district wage benchmarks. Extend these catalogs together when adding a city. Keep IDs used in existing saves stable.
- Job offers, tuition, admission scores, and payments are game values. Salary bands use district averages from Q3 2026, and the insurance model uses the 2026 reference rules. [NSI district wages](https://www.nsi.bg/statistical-data/179/569) · [NSSI unemployment benefits](https://www.nssi.bg/fizicheski-lica/po-bg-zakonodatelstvo/pri-bezrabotitsa/) · [NSSI pension rules](https://www.nssi.bg/fizicheski-lica/pensii-bg/trudova-deinost-pridobivane-pravo/pensii-za-osig-staj-v-namalen-razmer/)
- Existing saves replay their previous decisions and balances before the career system activates. Recorded study, jobs, and pension service carry forward. In-progress university enrollments from the previous game keep their tuition-free terms.

## Native mobile playtest

BgLife Mobile uses Expo SDK 58 and React Native. It shares the TypeScript simulation, avatar drawing, and JSON backup format with the browser game. This first playtest includes HomeHub, new lives in all 29 cities, the VIP preview avatar editor, the Journal, the Album, and offline SQLite saves. To bring a browser life over, download its backup from the browser game, then choose it in the native game's Settings and confirm the restore.

```sh
cd mobile
npm ci
npm run android
```

The Android command requires Android Studio's SDK and a device or emulator. On a Mac with Xcode and an iOS device or simulator, use `npm run ios`. These commands generate the platform projects and compile the app locally.

The **BgLife native playtest** GitHub Actions workflow compiles an Android test APK and an iOS Simulator app. It verifies new-life creation, a birthday, and reopening the saved life, and exercises web backup import on Android in airplane mode. The test apps use `com.georgicole.bglife.playtest` as their identifier.
