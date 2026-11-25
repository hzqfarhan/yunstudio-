import type { Metadata, Viewport } from 'next';
import { Poppins } from 'next/font/google';
import './globals.css';

const poppins = Poppins({ subsets: ['latin'], weight: ['500', '700', '800'], display: 'swap' });

export const metadata: Metadata = {
  title: 'LEED 26 crew passes',
  description: 'Every LEED 26 crew pass in 3D on its lanyard. Find your name and open your own pass. Developed by SELADEVS.',
};

export const viewport: Viewport = { themeColor: '#13042e', width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={poppins.className}>{children}</body>
    </html>
  );
}
