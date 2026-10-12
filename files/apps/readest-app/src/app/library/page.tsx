'use client';

import Boot from '@/components/paperback/Boot';

// Paperback: this file replaces Readest's src/app/library/page.tsx (AGPL-3.0, see NOTICE.md).
// Readest sends people to /library after an opened file or a link; Paperback's Library is /books.
export default function LibraryRedirect() {
  return <Boot to='/books' />;
}
