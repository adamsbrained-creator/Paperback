'use client';

import Boot from '@/components/paperback/Boot';

// Paperback: this file replaces Readest's src/app/page.tsx (AGPL-3.0, see NOTICE.md).
// The app opens here, loads the library, handles a file or link the phone handed over, then lands on Home.
export default function LaunchPage() {
  return <Boot to='/home' />;
}
