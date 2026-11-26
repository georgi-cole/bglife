# BgLife

BgLife follows one life from birth through age 131. Choose a birth city, make decisions between birthdays, and revisit the years in your journal. Lives born in Tryavna can follow the original age 16–26 storyline. The interface and story support Bulgarian and English.

## Play the game

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

After changing the game, run `npm run native:sync` to rebuild and copy the web output into the generated native projects. Compile and sign through Android Studio or Xcode. The downloadable game is a browser build.

## Project layout

| Location | Purpose |
| --- | --- |
| `src/engine.ts` | Year progression, choices, spending, memories and save validation |
| `src/story.ts` | Bilingual scenes, conditions and outcomes |
| `src/main.tsx` | React application entry |
| `src/style.css` | Responsive visual system |
| `public/art/` | Location artwork and credits |
| `tests/` | Automated simulation regressions |
| `scripts/build.mjs` | Development server and production builds |

The distributed web build carries artwork credits and third-party notices in `dist/CREDITS.txt`. The standalone page embeds the same notices in its `game-credits` element.
