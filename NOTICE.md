# Notice

Paperback is a personal ebook reader built on **Readest** (https://github.com/readest/readest),
copyright its contributors, released under the GNU Affero General Public License v3.0.
Paperback is licensed under the same license (see `LICENSE`). The Readest source is downloaded
at build time and is not stored in this repository. EPUB rendering is done by foliate-js; other
third-party components keep their own licenses.

This repository contains Paperback's own screens, logic and design (`files/`), a script that
adjusts a few Readest files (`apply.mjs`), and the build workflow. If you distribute Paperback to
other people, the AGPL requires you to make the corresponding source available to them.

## Readest files that Paperback replaces

A few files under `files/` start from Readest's own file of the same name and are changed for Paperback.
They stay under Readest's license (AGPL-3.0) and say so in their first lines:

- `src/app/opds/components/Navigation.tsx`: Discover's toolbar (new look; same behaviour).
- `src/app/opds/utils/opdsClose.ts`: closing a catalog returns to Paperback's Discover list.
- `src/app/page.tsx`: the launch screen (loads the library, opens a file or link handed over by the phone, then Home).
- `src/app/library/page.tsx`: Readest's old Library address now forwards to Paperback's Library (`/books`).

Readest's own Library screen (the rest of `src/app/library`) is not part of Paperback: `apply.mjs` deletes the files
that Paperback no longer uses before the app is compiled. What is left in that folder (`BackupWindow`,
`ShareBookDialog`, `BookContextMenuPopup`, `useBookTransferActions`, `useOpenBook`, `libraryUtils`) is still
Readest's code, under the same license.
