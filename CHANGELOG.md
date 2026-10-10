# What changed, build by build

Newest first. Each entry says where to look on the phone.

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
