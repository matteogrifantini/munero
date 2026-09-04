import type { Metadata } from 'next';
import { Playfair_Display, Inter } from 'next/font/google';
import './globals.css';

const display = Playfair_Display({ subsets: ['latin'], variable: '--font-display' });
const sans = Inter({ subsets: ['latin'], variable: '--font-sans' });

export const metadata: Metadata = {
  title: 'Munero — Siti per professionisti',
  description: 'Munero crea siti eleganti per professionisti: catalogo, prenotazioni e assistenza inclusi.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it" className={`${display.variable} ${sans.variable}`}>
      <body className="bg-[#faf8f4] text-stone-900 antialiased">{children}</body>
    </html>
  );
}
