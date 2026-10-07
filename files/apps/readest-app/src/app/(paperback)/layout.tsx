import type { Metadata } from 'next';
import { Newsreader, Outfit } from 'next/font/google';
import '../../styles/paperback.css';

const outfit = Outfit({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  display: 'swap',
  variable: '--font-outfit',
});

const newsreader = Newsreader({
  subsets: ['latin'],
  weight: ['400', '500'],
  style: ['normal', 'italic'],
  display: 'swap',
  variable: '--font-newsreader',
});

export const metadata: Metadata = { title: 'Paperback' };

export default function PaperbackLayout({ children }: { children: React.ReactNode }) {
  return <div className={`${outfit.variable} ${newsreader.variable}`}>{children}</div>;
}
