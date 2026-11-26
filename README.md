# BgLife

The first playable chapter follows Mila Nikolova from age 16 in Tryavna through age 26. School, a workshop, a move to Sofia and a Friday promise lead to different people and opportunities. The interface and story support Bulgarian and English.

## Play the chapter

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
| `src/main.tsx` | React application entry |
| `src/style.css` | Responsive visual system |
| `public/art/` | Location artwork and credits |
| `tests/` | Automated simulation regressions |
| `scripts/build.mjs` | Development server and production builds |

The distributed web build carries artwork credits and third-party notices in `dist/CREDITS.txt`. The standalone page embeds the same notices in its `game-credits` element.
