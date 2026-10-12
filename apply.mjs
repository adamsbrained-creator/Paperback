#!/usr/bin/env node
// Applies the Paperback changes on top of a Readest checkout.
//   cd <readest checkout> && node <paperback repo>/apply.mjs
// The CI workflow does this for you. Safe to run more than once: existing Readest files are
// changed with small, anchored edits (not overwritten), so it keeps working as upstream moves.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = process.cwd();
const app = path.join(root, 'apps/readest-app');

if (!fs.existsSync(path.join(app, 'package.json'))) {
  console.error('Run this from the repository root (the folder that contains apps/readest-app).');
  process.exit(1);
}

let problems = 0;
const log = (msg) => console.log(msg);

// 1. new files ---------------------------------------------------------------
function copyTree(src, dst) {
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dst, entry.name);
    if (entry.isDirectory()) {
      fs.mkdirSync(d, { recursive: true });
      copyTree(s, d);
    } else {
      fs.mkdirSync(path.dirname(d), { recursive: true });
      fs.copyFileSync(s, d);
      log(`  + ${path.relative(root, d)}`);
    }
  }
}
log('Copying new files…');
copyTree(path.join(here, 'files'), root);

// 2. anchored edits to existing files ---------------------------------------
function edit(file, { marker, anchor, replace, what }) {
  const p = path.join(root, file);
  if (!fs.existsSync(p)) {
    console.error(`  ! ${file} not found — skipped: ${what}`);
    problems++;
    return;
  }
  const text = fs.readFileSync(p, 'utf8');
  if (text.includes(marker)) {
    log(`  = ${file}: ${what} (already applied)`);
    return;
  }
  if (!text.includes(anchor)) {
    console.error(`  ! ${file}: anchor for "${what}" not found (upstream changed?) — skipped`);
    problems++;
    return;
  }
  fs.writeFileSync(p, text.replace(anchor, replace));
  log(`  ~ ${file}: ${what}`);
}

log('Editing existing files…');

edit('apps/readest-app/src/services/statistics/statisticsDb.ts', {
  what: 'add getPageEventsSince()',
  marker: 'getPageEventsSince',
  anchor: '  async getBookByMd5(',
  replace: `  /** Paperback: every page-read event since \`sinceStartTime\`, joined with its book. */
  async getPageEventsSince(sinceStartTime: number): Promise<
    {
      md5: string;
      title: string;
      authors: string;
      page: number;
      startTime: number;
      duration: number;
      totalPages: number;
    }[]
  > {
    const rows = await this.db.select<DatabaseRow>(
      \`SELECT b.md5 AS md5, b.title AS title, b.authors AS authors,
              p.page AS page, p.start_time AS startTime, p.duration AS duration, p.total_pages AS totalPages
       FROM page_stat_data p JOIN book b ON b.id = p.id_book
       WHERE p.start_time >= ?
       ORDER BY p.start_time ASC\`,
      [sinceStartTime],
    );
    return rows.map((r) => ({
      md5: String(r['md5']),
      title: String(r['title'] ?? ''),
      authors: String(r['authors'] ?? ''),
      page: Number(r['page']),
      startTime: Number(r['startTime']),
      duration: Number(r['duration']),
      totalPages: Number(r['totalPages']),
    }));
  }

  async getBookByMd5(`,
});

// (Readest's library menu is gone: Paperback has its own Library, menu and settings screens.)

// Theme: Paperback palette replaces Readest's "Default" theme (light + dark),
// so the library, reader chrome and dialogs all pick it up.
const themesFile = 'apps/readest-app/src/styles/themes.ts';
edit(themesFile, {
  what: 'add Paperback palettes',
  marker: 'paperbackLight',
  anchor: "const _ = (stubKey: string) => stubKey;\n\nexport const themes = [",
  replace: `// Paperback: white page, soft grey cards (base-300), ink text, coral accent.
const paperbackLight: Palette = {
  'base-100': '#ffffff',
  'base-200': '#fcfcfc',
  'base-300': '#f3f3f3',
  'base-content': '#111111',
  neutral: '#111111',
  'neutral-content': '#ffffff',
  primary: '#f46b4e',
  secondary: '#111111',
  accent: '#f46b4e',
};
const paperbackDark: Palette = {
  'base-100': '#000000',
  'base-200': '#050505',
  'base-300': '#161616',
  'base-content': '#f5f5f5',
  neutral: '#1f1f1f',
  'neutral-content': '#9a9a9a',
  primary: '#f46b4e',
  secondary: '#f5f5f5',
  accent: '#f46b4e',
};

const _ = (stubKey: string) => stubKey;

export const themes = [`,
});
edit(themesFile, {
  what: 'use Paperback palettes for the default theme',
  marker: 'light: paperbackLight',
  anchor:
    "      light: generateLightPalette({ fg: '#171717', bg: '#ffffff', primary: '#0066cc' }),\n" +
    "      dark: generateDarkPalette({ fg: '#e0e0e0', bg: '#222222', primary: '#77bbee' }),",
  replace: '      light: paperbackLight,\n      dark: paperbackDark,',
});

// Font: Outfit everywhere in the UI (book text keeps its own font setting).
const layoutFile = 'apps/readest-app/src/app/layout.tsx';
edit(layoutFile, {
  what: 'load Outfit + Paperback global css',
  marker: 'paperback-global.css',
  anchor: "import '../styles/globals.css';",
  replace: `import '../styles/globals.css';
import '../styles/paperback-global.css';
import { Newsreader, Outfit } from 'next/font/google';

// next/font self-hosts the fonts at build time, so they also work offline.
const outfit = Outfit({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  display: 'swap',
  variable: '--font-outfit',
});
const newsreader = Newsreader({
  subsets: ['latin'],
  weight: ['400', '500'],
  style: ['normal', 'italic'],
  display: 'swap',
  variable: '--font-newsreader',
});`,
});
edit(layoutFile, {
  what: 'apply Outfit variable on <html>',
  marker: 'outfit.variable',
  anchor: "className={process.env['NEXT_PUBLIC_APP_PLATFORM'] === 'tauri' ? 'edge-to-edge' : ''}",
  replace:
    "className={`${outfit.variable} ${newsreader.variable} ${process.env['NEXT_PUBLIC_APP_PLATFORM'] === 'tauri' ? 'edge-to-edge' : ''}`}",
});
edit('apps/readest-app/src/styles/globals.css', {
  what: 'font-sans → Outfit first',
  marker: 'var(--font-outfit)',
  anchor: "--font-sans: 'Inter', ui-sans-serif, system-ui, sans-serif;",
  replace: "--font-sans: var(--font-outfit), 'Inter', ui-sans-serif, system-ui, sans-serif;",
});

// Cold start: Paperback's own src/app/page.tsx (a file in files/) loads the library, handles opened files and
// deep links, then lands on Home. Readest's library page is not part of the app any more.

// tauri.conf.json: app name + no updater artifacts (they need a signing key).
const tauriConf = 'apps/readest-app/src-tauri/tauri.conf.json';
edit(tauriConf, {
  what: 'productName → Paperback',
  marker: '"productName": "Paperback"',
  anchor: '"productName": "Readest"',
  replace: '"productName": "Paperback"',
});
edit(tauriConf, {
  what: 'createUpdaterArtifacts → false',
  marker: '"createUpdaterArtifacts": false',
  anchor: '"createUpdaterArtifacts": true',
  replace: '"createUpdaterArtifacts": false',
});

if (process.argv.includes('--clean-workflows')) {
  // Upstream CI (releases, nightly, CodeQL, …) is useless in a private personal repo.
  const dir = path.join(root, '.github/workflows');
  for (const f of fs.readdirSync(dir)) {
    if (f === 'paperback-apk.yml') continue;
    fs.rmSync(path.join(dir, f));
    log(`  - .github/workflows/${f}`);
  }
}

// Closing a book returns to the page you came from (Home, Library, Notes…), not Readest's library.
edit('apps/readest-app/src/app/reader/components/ReaderContent.tsx', {
  what: 'close the reader back to the previous page',
  marker: "router.replace('/home')",
  anchor: "    navigateToLibrary(router, '', undefined, true);\n  };",
  replace: `    // Paperback: go back to where the book was opened from; Home if there is no history.
    if (typeof window !== 'undefined' && window.history.length > 1) router.back();
    else router.replace('/home');
  };`,
});

// The edit above removes the only call to navigateToLibrary, which leaves its import unused,
// and Readest's TypeScript settings fail the build on unused imports. Drop it (only if nothing else uses it).
{
  const rc = path.join(root, 'apps/readest-app/src/app/reader/components/ReaderContent.tsx');
  if (fs.existsSync(rc)) {
    const text = fs.readFileSync(rc, 'utf8');
    if ((text.match(/navigateToLibrary/g) || []).length === 1) {
      const next = text
        .replace(/^[ \t]*navigateToLibrary,\r?\n/m, '')
        .replace(/\bnavigateToLibrary,\s*/, '')
        .replace(/,\s*navigateToLibrary\b/, '');
      if (next !== text) {
        fs.writeFileSync(rc, next);
        log('  ~ ReaderContent.tsx: removed the now-unused navigateToLibrary import');
      }
    }
  }
}

// Reader footer default: show "N pages left in chapter" (the page / total readout is already on).
edit('apps/readest-app/src/services/constants.ts', {
  what: 'footer shows pages left in the chapter by default',
  marker: 'showRemainingPages: true,',
  anchor: '  showRemainingPages: false,\n',
  replace: '  showRemainingPages: true,\n',
});

// Reader menu: give the bottom icon row a class so Paperback can style it as a floating dock.
edit('apps/readest-app/src/app/reader/components/footerbar/NavigationBar.tsx', {
  what: 'mark the reader footer icon row (floating dock)',
  marker: "'reader-nav-dock ",
  anchor: "'not-eink:bg-base-200 eink:bg-base-100 z-30 mt-auto flex w-full justify-between px-8 py-4',",
  replace:
    "'reader-nav-dock not-eink:bg-base-200 eink:bg-base-100 z-30 mt-auto flex w-full justify-between px-8 py-4',",
});

// Discover (the OPDS browser): Paperback header + a class the stylesheet can hang the new look on.
// Its toolbar (opds/components/Navigation.tsx) and close behaviour (opds/utils/opdsClose.ts) are Paperback's own
// copies under files/, which replace Readest's when the files are copied in.
const opdsPage = 'apps/readest-app/src/app/opds/page.tsx';
edit(opdsPage, {
  what: 'import the Paperback header for Discover',
  marker: 'PaperbackOpdsHeader',
  anchor: "import { Navigation } from './components/Navigation';",
  replace:
    "import { Navigation } from './components/Navigation';\nimport PaperbackOpdsHeader from '@/components/paperback/PaperbackOpdsHeader';",
});
edit(opdsPage, {
  what: 'show the Paperback header above the catalog toolbar',
  marker: '<PaperbackOpdsHeader />',
  anchor: '        <Navigation\n',
  replace: '        <PaperbackOpdsHeader />\n        <Navigation\n',
});
edit(opdsPage, {
  what: 'import the Paperback loading state for Discover',
  marker: 'import PaperbackLoading',
  anchor: "import PaperbackOpdsHeader from '@/components/paperback/PaperbackOpdsHeader';",
  replace:
    "import PaperbackOpdsHeader from '@/components/paperback/PaperbackOpdsHeader';\nimport PaperbackLoading from '@/components/paperback/PaperbackLoading';",
});
edit(opdsPage, {
  what: 'Paperback loading state in Discover',
  marker: '<PaperbackLoading label',
  anchor: `        {viewMode === 'loading' && (
          <div className='flex h-full items-center justify-center'>
            <div className='text-center'>
              <div className='loading loading-spinner loading-lg mb-4'></div>
              <h1 className='text-base font-semibold'>{_('Loading...')}</h1>
            </div>
          </div>
        )}`,
  replace: "        {viewMode === 'loading' && <PaperbackLoading label={_('Loading...')} />}",
});
edit(opdsPage, {
  what: 'mark the Discover page for styling',
  marker: "'pb-opds ",
  anchor: "'bg-base-100 flex h-screen select-none flex-col',",
  replace: "'pb-opds bg-base-100 flex h-screen select-none flex-col',",
});

// No analytics: an empty PostHog key makes the app skip it entirely.
{
  const envFile = path.join(root, 'apps/readest-app/.env');
  if (fs.existsSync(envFile)) {
    const text = fs.readFileSync(envFile, 'utf8');
    const next = text.replace(
      /NEXT_PUBLIC_DEFAULT_POSTHOG_KEY_BASE64="[^"]*"/,
      'NEXT_PUBLIC_DEFAULT_POSTHOG_KEY_BASE64=""',
    );
    if (next !== text) {
      fs.writeFileSync(envFile, next);
      log('  ~ apps/readest-app/.env: analytics key blanked');
    } else {
      log('  = apps/readest-app/.env: analytics key (already blank or not found)');
    }
  }
}


// 3. prune Readest's library screen -------------------------------------------
// Paperback has its own Library, so Readest's (about 16,000 lines in src/app/library) is not compiled into the app.
// Only files nothing else needs are deleted: a file is kept when any file outside the pruned folder (or any
// Paperback-owned file inside it) imports it, directly or through other kept files. Tests of deleted files go too.
function pruneUnused(pruneRel) {
  const src = path.join(app, 'src');
  const pruneRoot = path.join(src, pruneRel);
  if (!fs.existsSync(pruneRoot)) {
    log(`  = ${pruneRel}: nothing to prune`);
    return;
  }
  const all = [];
  (function walk(dir) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) {
        if (e.name !== 'node_modules') walk(full);
      } else if (/\.(ts|tsx)$/.test(e.name)) all.push(full);
    }
  })(src);
  const known = new Set(all);
  const owned = new Set();
  (function walk(dir) {
    if (!fs.existsSync(dir)) return;
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) walk(full);
      else owned.add(path.join(app, path.relative(path.join(here, 'files/apps/readest-app'), full)));
    }
  })(path.join(here, 'files/apps/readest-app'));

  const exts = ['', '.ts', '.tsx', '/index.ts', '/index.tsx'];
  const resolve = (from, spec) => {
    let base;
    if (spec.startsWith('@/')) base = path.join(src, spec.slice(2));
    else if (spec.startsWith('.')) base = path.resolve(path.dirname(from), spec);
    else return null;
    for (const x of exts) if (known.has(base + x)) return base + x;
    return null;
  };
  const importRe =
    /(?:import|export)\s[^'"`;]*?from\s*['"]([^'"]+)['"]|import\s*['"]([^'"]+)['"]|import\(\s*['"]([^'"]+)['"]\s*\)|require\(\s*['"]([^'"]+)['"]\s*\)|vi\.(?:mock|importActual)\(\s*['"]([^'"]+)['"]/g;
  const deps = new Map();
  for (const f of all) {
    const text = fs.readFileSync(f, 'utf8');
    const out = new Set();
    importRe.lastIndex = 0;
    let m;
    while ((m = importRe.exec(text))) {
      const r = resolve(f, m[1] || m[2] || m[3] || m[4] || m[5]);
      if (r) out.add(r);
    }
    deps.set(f, out);
  }
  const inPrune = (f) => f.startsWith(pruneRoot + path.sep);
  const isTest = (f) => f.includes(`${path.sep}__tests__${path.sep}`) || /\.test\.tsx?$/.test(f);
  const roots = all.filter((f) => !isTest(f) && (!inPrune(f) || owned.has(f)));
  const live = new Set(roots);
  const stack = [...roots];
  while (stack.length) {
    for (const d of deps.get(stack.pop()) ?? []) {
      if (!live.has(d)) {
        live.add(d);
        stack.push(d);
      }
    }
  }
  const dead = all.filter((f) => inPrune(f) && !live.has(f));
  const deadSet = new Set(dead);
  const deadTests = all.filter((f) => isTest(f) && [...deps.get(f)].some((d) => deadSet.has(d)));
  for (const f of [...dead, ...deadTests]) fs.rmSync(f);
  // Remove folders left empty.
  (function sweep(dir) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) if (e.isDirectory()) sweep(path.join(dir, e.name));
    if (dir !== pruneRoot && fs.readdirSync(dir).length === 0) fs.rmdirSync(dir);
  })(pruneRoot);
  const kept = all.filter((f) => inPrune(f) && live.has(f)).length;
  log(`  - ${pruneRel}: deleted ${dead.length} unused file(s) and ${deadTests.length} test(s) of them, kept ${kept} still in use`);
}
log('Pruning Readest code Paperback no longer uses…');
pruneUnused('app/library');

log(problems ? `\nDone with ${problems} problem(s) — see messages above.` : '\nAll done.');
process.exit(problems ? 1 : 0);
