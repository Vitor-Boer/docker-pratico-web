import type { Metadata } from 'next';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { StatusBar } from '@/components/StatusBar';
import { StatusProvider } from '@/components/StatusProvider';
import './globals.css';

export const metadata: Metadata = {
  title: 'Docker na Prática',
  description: 'Workshop prático de Docker',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <StatusProvider>
          <header className="header">
            <Link href="/" className="brand">
              Docker na Prática
            </Link>
            <StatusBar />
          </header>
          <main className="main">{children}</main>
        </StatusProvider>
      </body>
    </html>
  );
}
