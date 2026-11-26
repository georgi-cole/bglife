# BgLife

Start in first grade or at age 16 in Tryavna or Sofia. The first Tryavna chapter follows the original story from 16 through 26. The career system continues through adult life and retirement. The interface and story support Bulgarian and English.

## Play BgLife

[Play BgLife on GitHub Pages](https://georgi-cole.github.io/bglife/).

Open **BgLife-Playable.html** at the top of the downloaded ZIP in a browser. When building from source, the same file is generated under **release/**. The release file includes the game, styles and both location illustrations. It works without a server or network connection. Mobile file viewers sometimes show a document preview, so use a browser or the locally served web build for playtesting.

The game saves in browser storage on the current device. Keep the same browser and address to resume. File-URL storage behaviour varies between browsers. A private window or clearing site data may erase a life.

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

The production build creates **dist/** for static hosting or native wrapping, and **release/BgLife-Playable.html** for offline distribution. Serve the complete contents of `dist/` together. The local development server and a hosted deployment have separate saves. To create a ZIP containing the standalone game, compiled web build and complete source, run `python scripts/package.py` with Python 3.

The GitHub Pages workflow checks and builds every push to `main`, then publishes `dist/`. Repository Settings → Pages uses **GitHub Actions** as the publishing source.

## Schools, work and social insurance

Education appears in the bottom navigation before age 18. Career takes its place at 18 and keeps school and university available. The journal stays one tap away from the back button. Use **+1 year** to close classes, settle income and expenses, and record school and employment outcomes.

| Stage | Decisions that shape the next year |
| --- | --- |
| Primary and secondary school | Choose a first-grade catchment school. Prepare by subject and take assessments. Use the grade VII results to apply to high schools. Pass the required state exams to earn a diploma or vocational qualification. |
| University | Apply by city and program. The program decides which diploma marks or entrance exams to weigh. Compare state-funded and tuition-funded places. Pay tuition, complete finals, and apply for a merit scholarship after a successful year on a state-funded place. |
| Employment | Prepare a CV, apply to local vacancies, select an interview approach, and sign an offer. Qualifications and professional registration can unlock additional roles. A full-time shift reduces study preparation. Youth vacancies are limited to light seasonal work and include the required employer permission. |
| Social insurance | Formal contracts add insurance service. Recent insured months determine access to unemployment benefits. Health coverage follows school, study, work, benefit or retirement status. Your age, service and recorded earnings determine pension eligibility and simulated payments. |

The game uses annual turns. Tuition, admission cutoffs, wage offers and awards are balancing values. The economic preset uses 2026 rules and district-level gross wages from Q3 2026. Contributions, pensions and benefits use gameplay approximations, including typical shifts and whole-year birthdays. A save made before Career keeps its previous decisions and balances on replay. Active chapters pick up the career system at the current age, with initial school grades or qualifying work service estimated from the chapter.

### Adding a city

Extend the `City` type and add one entry to `pathCities` in [src/pathCatalog.ts](src/pathCatalog.ts). Include neighborhood or catchment labels, first-grade schools, general and selective secondary schools, local university programs when available, the district wage benchmark, and qualified and unqualified vacancies. Keep object IDs stable because they are recorded in saves. Add the city's place profile and artwork, then run the catalog and progression tests. Leave the university list empty for a city without programs so the player can apply in another city.

### Data and rules

- School admissions and local catalogs. [Ministry of Education](https://www.mon.bg/obshto-obrazovanie/kandidatstvane-sled-vii-klas/zapovedi-2/) · [Sofia first-grade catchments](https://council.sofia.bg/documents/d/guest/r-215-2026) · [Tryavna school directory](https://tryavna.bg/obrazovanie/uchebni-zavedeniya/)
- University admissions and scholarships. [Medical University of Sofia](https://mu-sofia.bg/priem/ksk/spravochnik-kandidatstudenti/) · [Sofia University student scholarships](https://student.uni-sofia.bg/index.php)
- Employment and income. [NSI district averages](https://www.nsi.bg/statistical-data/179/569) · [General Labour Inspectorate](https://www.postedworkers.gli.government.bg/bg/22/spetsialna-zakrila/) · [2026 minimum wage](https://messages.mlsp.government.bg/messages/newm/index.php?ot=31&section=LIST&tid=1)
- Contributions, benefits and pensions. [National Revenue Agency](https://nra.bg/wps/wcm/connect/agency/site/osiguryavane/zdravno-osiguryavane/studenti/studenti) · [National Social Security Institute unemployment benefits](https://www.nssi.bg/fizicheski-lica/po-bg-zakonodatelstvo/pri-bezrabotitsa/) · [National Social Security Institute pension rules](https://www.nssi.bg/fizicheski-lica/pensii-bg/trudova-deinost-pridobivane-pravo/pensii-za-osig-staj-v-namalen-razmer/)

## Mobile wrappers

Capacitor reads `capacitor.config.ts` and packages the contents of `dist/` as local app resources. The provisional local app identifier is `com.georgicole.bglife`. Choose the permanent identifier before registering store applications.

On the platform development machine, build the web project first and generate the required native platform once.

```sh
npm run build
npx cap add android
npx cap open android
```

On macOS with Xcode, the equivalent platform is `ios`.

```sh
npm run build
npx cap add ios
npx cap open ios
```

After changing the game, run `npm run native:sync` to rebuild and copy the web output into the generated native projects. Compile and sign through Android Studio or Xcode. The downloadable chapter is a browser build.

## Project layout

| Location | Purpose |
| --- | --- |
| `src/engine.ts` | Year progression, choices, spending, memories and save validation |
| `src/story.ts` | Bilingual scenes, conditions and outcomes |
| `src/pathCatalog.ts` | Local schools, programs, jobs and wage anchors |
| `src/lifePath.ts` | Education, work and insurance coordination |
| `src/main.tsx` | React application entry |
| `src/style.css` | Responsive visual system |
| `public/art/` | Location artwork and credits |
| `tests/` | Automated simulation regressions |
| `scripts/build.mjs` | Development server and production builds |

The distributed web build carries artwork credits and third-party notices in `dist/CREDITS.txt`. The standalone page embeds the same notices in its `game-credits` element.
