# Paperback

A personal ebook reader for Android: Readest's reading engine with its own design (coral, black and
white; Outfit and Newsreader), reading stats, goals and history, notes and bookmarks, favorites,
ratings, wishlist, collections, dictionary and backup.

The new design is being built screen by screen. Done so far: **Home**, **Library** (shelf, grid, list and stacks views), **Stats**, four navigation styles
(tab bar, dock, header switch, off; chosen in Settings → Themes) the reader footer and the reader menu (tap the page)
("23 pages left in chapter" · "31 / 355"). The
other screens still use the earlier layout in the new colors.

## How this repo works (why it's small)

This repo holds only Paperback's own files (about 45). When you run the build, GitHub downloads the
Readest source from GitHub at a fixed date, `apply.mjs` lays Paperback's files on top of it, and the
result is compiled into an APK. Nothing from Readest needs to be uploaded here.

| Path | What it is |
|---|---|
| `files/` | Paperback's new code, laid out exactly like the Readest project it is copied into |
| `apply.mjs` | Copies `files/` in and makes the few small edits Readest's own files need |
| `.github/workflows/android.yml` | The build |

See `CHANGELOG.md` for what each version changed and where to check it.

## Set up

1. Make a **new private repo** (if an old attempt exists, delete it under Settings → Danger zone).
2. Upload: **Add file → Upload files**, drag in everything from the unzipped folder
   (`apply.mjs`, `files`, `README.md`, `LICENSE`, `NOTICE.md`), commit.
3. Add the build file: **Add file → Create new file**, type the name
   `.github/workflows/android.yml` (typing `/` makes the folders), paste in the contents of the
   attached `android.yml`, commit.
4. Optional but recommended, so each build can update the last install. On a computer with Java:
   ```
   keytool -genkeypair -v -keystore paperback.jks -alias paperback -keyalg RSA -keysize 2048 -validity 10000
   base64 -w0 paperback.jks        # macOS: base64 -i paperback.jks
   ```
   (same password for store and key). Repo → Settings → Secrets and variables → Actions → add
   `ANDROID_KEY_BASE64`, `ANDROID_KEY_ALIAS` (`paperback`), `ANDROID_KEY_PASSWORD`. Keep
   `paperback.jks`; without it you can't update the app in place. Skipping this still builds, signed
   with a throwaway key.
5. **Actions → Paperback APK → Run workflow.** It only runs when you start it. The first build takes
   about 40–60 minutes. When it's green, open the repo's **Releases** page on your phone, download
   `Paperback.apk` and install it.

If a build fails: open the run, click the red step, and send me that step's log.

## Changing things later

Replace or add files under `files/` (same folder layout) and run the build again. For a change in
an existing Readest file, add a small edit to `apply.mjs`, which I can write for you.
A few files under `files/` are Readest's own files, copied and changed (the Discover toolbar, for
example); `NOTICE.md` lists them. Same-named files in `files/` replace Readest's when copied in.

## Roadmap: less Readest

The build downloads Readest and compiles all of it, which is most of the build time. Planned order for
depending on it less:

1. ~~Put every Readest import used by Paperback's screens behind one small adapter module.~~ Done:
   `files/.../components/paperback/platform.ts` is now the only Paperback file that imports Readest code
   (19 names, listed there by area). Replacing a name there replaces it for every screen.
   A second kind of step: **when Paperback gets its own version of a Readest screen, Readest's version is
   deleted from the build.** `apply.mjs` does this at the end (`pruneUnused`): it deletes the files of a Readest
   folder that nothing else needs, and the tests of those files. Done for **Readest's Library** (`src/app/library`:
   about 16,000 lines and 55 of its tests). To retire another folder, add one line `pruneUnused('<folder>')`.
2. Give Paperback its own library list, reading progress, notes and stats storage. (The Library screen, importing,
   removing, and the app launch (`Boot`) are Paperback's own now; the data underneath is still Readest's.)
3. Render books with foliate-js directly (the EPUB engine Readest itself uses) instead of Readest's reader.
4. Swap the Tauri/Rust shell for a lighter Android shell.

Each step keeps the app working; the build gets shorter as Readest code is no longer compiled.
