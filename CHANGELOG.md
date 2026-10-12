# What changed, build by build

Newest first. Each entry says where to look on the phone.

## Same header on every screen (in progress)
- Screens now get Settings' header: round menu button, "paperback", round search button, and the screen's name
  underneath, plus the round menu button at the bottom right. It follows **Settings → App style → Header size**
  (Compact, Regular, Large), so changing the size changes it everywhere.
- Done so far: **Discover** (the list of catalogs), **Collections**, **Bookmarks**, **Dictionary**. The rest
  (Currently reading, Recently read, Finished, Authors, Notes & highlights, Search, Favorites, Wishlist, Genres,
  Backup & restore) follow in the next steps. Stats keeps its own header.
- On the Search screen the header's search button puts the cursor in the search field.
- Code: `components/paperback/PageTop.tsx`; a screen opts in with `<Shell title='…' pageHeader>`.

## Discover (catalog browser) redesign
- Menu → Discover → pick a catalog: the "paperback" header with **Discover** under it, then the toolbar:
  back, forward, catalog home, a pill search field, add to My Catalogs (**+**) and close (**✕**). Disabled
  arrows are greyed. The round menu button and its pop-up are here too.
- Loading shows the coral spinner with "Loading…".
- Closing a catalog (✕ or Android Back at its first page) now returns to the Discover list instead of
  Readest's library.
- Feeds, book pages and search results are still Readest's, with the earlier soft cards and rounded covers;
  they will follow when you send their designs.
- Code: the toolbar is a copy of Readest's `Navigation.tsx` kept in `files/` (see `NOTICE.md`).

## New menu
- Tap the menu button (top left, or the round button at the bottom right): a small card pops up above the round
  button with Home, Discover, Collections, Bookmarks, Dictionary, Stats and Settings. The page you are on is
  highlighted with a coral dot, and the round button turns into a close button.
- **More** (last row, not in the design) opens the older full list, so Favorites, Wishlist, Authors, Genres,
  Recently read and Reading history stay reachable. Set `SHOW_MORE = false` in `MenuSheet.tsx` to remove it.

## About redesign
- Menu → Settings → About Paperback: the logo tile, a large "paperback" and "Version 1.0.0 · personal build",
  then **Credits** and **Open-source licenses** cards. The header follows your Header size.
- Until those two get their own pages, tapping a card opens its text in place (the old "Your data" note is
  inside Credits).

## Settings redesign + header size
- Menu → Settings looks like the new design: the **Daily goal** card (ring, minutes today, Edit), then Reading,
  Look and Library groups of rows, About, and a round menu button at the bottom right.
- Menu → Settings → **App style**: pick a **Header size** (Compact, Regular, Large) with a live sample of each.
  It is saved on the device. For now it changes the header on Settings and App style; other screens take it as
  they are redesigned.
- Placeholders that only keep the look: *Reader defaults* shows "Roboto · 16" and *Library & import* shows
  "Import, sync" (not read from real settings yet).

## New logo and icon set
- App icon: the **bookmark p** (logo A): white mark on coral. Launcher icon after installing.
- Header: the mark sits next to the "paperback" wordmark on Home and Library.
- Menu → Settings → About Paperback: the logo tile replaces the cover fan.
- Every icon in the app is now Paperback's own set (24 px grid, 1.9 px stroke, round ends) instead of
  Phosphor: tab bar, header buttons, Settings rows, search fields, bookmarks. The active tab fills in.
  Library uses the layers icon. Code: `components/paperback/icons.tsx` and `Logo.tsx`.

## Discover looks like Paperback
- Menu → Discover → pick Project Gutenberg (or any catalog): the page now starts with a serif **Discover**
  title and a Home button, the toolbar buttons are round chips, the search field is a pill, catalog
  entries are soft rounded cards and book covers are rounded with a soft shadow.
- Everything it does (browse, search, download into your library) is still Readest's.
- Newsreader (the serif font) is now available in the whole app, not only in the Paperback screens.

## Library list now belongs to Paperback
- Paperback keeps its own saved copy of your book list (`paperback.catalog.v1`), so Home, Library and
  Stats show instantly at launch instead of waiting for Readest to load. Tapping a book in the first
  moments says "still loading" instead of doing nothing.
- All screens use Paperback's own book type (`services/paperback/library.ts`); Readest's book object is
  only used to draw covers and open the reader (through `components/paperback/platform.ts`).
- **Check:** open the app with Wi-Fi on, close it fully, open it again: Home should appear at once.

## New app icon
- White square with "Paperback" in Outfit, like the Binder icon.

## Home layout: Pile
- Settings → Themes → **Home layout** → *Pile*: a heap of your recent covers with your latest note on top,
  a streak badge, and Reading / Finished shelves. *Classic* is the earlier layout.

## Library: Bento view
- A fifth view next to Shelf, Grid, List and Stacks: tiles for your latest covers, a progress tile and your
  latest highlights.

## Smaller changes
- Reader menu: the bottom dock sits on a page-coloured strip, so the "pages left" text no longer peeks out
  at its corners.
- Stats → Most read: percentages now say "% of time" (they are your share of reading time, not book progress).
- Build: frees disk space first (the last build ran out near the end); runs the new library tests.
