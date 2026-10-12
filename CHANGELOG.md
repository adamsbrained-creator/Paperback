# What changed, build by build

Newest first. Each entry says where to look on the phone.

## Scrapbook links back to the book
- Everything sent to Scrapbook (a Journal note, a highlight, a note on a highlight) now ends with an **Open in Paperback**
  link. In Scrapbook, tap it and Paperback opens that book, at the highlighted passage when there is one.
- It uses Readest's own `readest://book/…` links, which Paperback already understood, so Paperback needed no new
  permission. The Scrapbook app needs the matching update (see the Scrapbook zip): it makes the link tappable and files
  things sent from Paperback in a **Paperback** box (made the first time).
- If the book is no longer in your library, Paperback says "Book not in your library".
- Code: `paperbackLink` in `services/paperback/scrapbook.ts` (tested against Readest's own link reader).

## Highlights → Scrapbook
- Menu → **Notes & highlights**: every card has a small round share button in its top right corner. The same button is
  on the cards on a book's **Journal** page.
- It opens the phone's share sheet; choose **Scrapbook** and its "Save to Scrapbook" screen opens with the text.
  A plain highlight arrives as a **Quote** scrap: "the passage" and, underneath, "— Author, Book, p. 12".
  A note you wrote arrives as a normal scrap: your note, then the passage, then the source.
- Without a share sheet the text is copied and a short message says so.
- Code: `SendToScrapbook.tsx`, `scrapbookHighlight` in `services/paperback/scrapbook.ts` (with tests).

## Journal → Scrapbook
- Home or Library → a book → **Journal** (the page with your note): under *My note* there is now **Send to Scrapbook**.
  It opens the phone's share sheet with the book title, your note and the author; choose **Scrapbook** and its
  "Save to Scrapbook" screen opens with it (the book title becomes the scrap's title; pick the box and Save).
- The button is greyed out while the note is empty. It sends what is in the box, saved or not.
- Needs the Scrapbook app installed. Without a share sheet the text is copied instead.
- Code: `shareToApps` in `platform.ts` (Readest's share plugin), `services/paperback/scrapbook.ts`.

## Paperback's own Library
- **Library** (menu → Library, or the Library tab) is built from the new designs, with the standard header (menu ·
  "paperback" · search, "Library" underneath and a "8 books" chip) that follows **Header size**:
  - **Shelves** (home layout): a *Continue reading* card, then *Also reading*, *Not started*, *Favorites* (an empty
    one explains how to add) and *Finished*. **See all** opens that shelf in *All books*.
  - **All books**: filter chips (All, Reading, Not started, Favorites, Finished), a sort menu (Recently opened,
    Recently added, Title, Author), grid or list, and **+** to import books. Back returns to the shelves.
  - **Tap** a book to read it; **press and hold** for the book sheet: Resume, Pin for today, Add to Favorites,
    Add to collection, Mark as finished, Book details, Remove from library (asks first).
  - **Empty library**: Import books and Discover free books.
  - Books without a cover get a drawn cover in a colour taken from the book.
- **Import** works inside Paperback (the + on All books, the Library's empty screen, or Settings → Library & import):
  pick several files at once.
- **Readest's Library is gone from the app.** Opening a file from another app, restoring the last books and links
  are handled by Paperback's own launch screen (`Boot`). Readest's library code is deleted before the build
  (about 16,000 lines), so building takes less.
- Authors → an author opens *All books* searched for that author. Settings → **Reader defaults** opens Readest's reader
  settings window. Backup & restore → *Back up or restore books and notes* opens Readest's backup window.
- **No longer available** (they lived only in Readest's Library): importing a whole folder, watched folders, cloud
  sync of the library, the transfer queue, send-to-Readest links, searching inside book text from Search, tagging
  and grouping books, and editing book details from the library. Ask when you want any of them back in Paperback's
  own style.

## Same header on every screen
- Screens now get Settings' header: round menu button, "paperback", round search button, and the screen's name
  underneath, plus the round menu button at the bottom right. It follows **Settings → App style → Header size**
  (Compact, Regular, Large), so changing the size changes it everywhere.
- On: Discover, Collections, a single collection (its name underneath), Book details, Bookmarks, Dictionary,
  Currently reading, Recently read, Finished, Authors, Notes & highlights, Search, Favorites, Wishlist, Genres,
  Import, Appearance (was "Themes") and Backup & restore (was "Backup"). Home and Stats keep their own headers,
  because they have their own designs.
- Home: the "p" mark next to the wordmark is gone, only "paperback" is left.
- A long title underneath is cut with "…" instead of wrapping.
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
