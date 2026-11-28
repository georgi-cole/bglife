import { build, context } from 'esbuild';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const require = createRequire(import.meta.url);
const dist = path.join(root, 'dist');
const release = path.join(root, 'release');
const iconName = 'bglife-icon.png';
const serve = process.argv.includes('--serve');
const template = await readFile(path.join(root, 'index.html'), 'utf8');
const [artCredits, ...licenseTexts] = await Promise.all([
  readFile(path.join(root, 'public/art/CREDITS.txt'), 'utf8'),
  ...['react', 'react-dom', 'scheduler'].map(name =>
    readFile(path.join(path.dirname(require.resolve(name + '/package.json')), 'LICENSE'), 'utf8')
  )
]);
const notices = artCredits.trim() + '\n\nThird-party software\n\n' + [...new Set(licenseTexts)].join('\n');

const config = {
  absWorkingDir: root,
  entryPoints: { app: 'src/main.tsx' },
  outdir: dist,
  bundle: true,
  minify: !serve,
  platform: 'browser',
  target: 'es2022',
  format: 'iife',
  jsx: 'automatic',
  charset: 'utf8',
  assetNames: 'art/[name]',
  loader: { '.webp': 'file' },
  legalComments: 'inline',
  define: { 'process.env.NODE_ENV': JSON.stringify(serve ? 'development' : 'production') },
  logLevel: 'warning'
};

function page(style, script, icon = '') {
  const safeNotices = JSON.stringify(notices).replaceAll('<', '\\u003c');
  return template
    .replace('<!-- bglife:icon -->', () => icon)
    .replace('<!-- bglife:style -->', () => style)
    .replace('<!-- bglife:credits -->', () => '<script id="game-credits" type="application/json">' + safeNotices + '</script>')
    .replace('<!-- bglife:script -->', () => script);
}

async function writeWebEntry() {
  const assets = ['app.css', 'app.js'];
  const version = serve ? '' : '?v=' + createHash('sha256')
    .update(await readFile(path.join(dist, assets[0])))
    .update(await readFile(path.join(dist, assets[1])))
    .digest('hex').slice(0, 12);
  await writeFile(path.join(dist, 'index.html'), page(
    '<link rel="stylesheet" href="./' + assets[0] + version + '">',
    '<script src="./' + assets[1] + version + '"></script>',
    '<link rel="icon" type="image/png" href="./' + iconName + '">',
  ));
}

await mkdir(dist, { recursive: true });
await copyFile(path.join(root, 'public', iconName), path.join(dist, iconName));
await writeFile(path.join(dist, 'CREDITS.txt'), notices);
if (serve) {
  await writeWebEntry();
  const port = Number(process.env.PORT || 4187);
  const ctx = await context(config);
  await ctx.watch();
  const server = await ctx.serve({ host: '127.0.0.1', port, servedir: dist });
  console.log('BgLife is running at http://127.0.0.1:' + server.port + '/');
} else {
  await build(config);
  await writeWebEntry();
  const packed = await build({ ...config, write: false, loader: { '.webp': 'dataurl' } });
  const css = packed.outputFiles.find(f => f.path.endsWith('.css')).text.replace(/<\/style/gi, '<\\/style');
  const js = packed.outputFiles.find(f => f.path.endsWith('.js')).text.replace(/<\/script/gi, '<\\/script');
  await mkdir(release, { recursive: true });
  await writeFile(path.join(release, 'BgLife-Playable.html'), page('<style>' + css + '</style>', '<script>' + js + '</script>'));
  console.log('Built dist/ and release/BgLife-Playable.html');
}
