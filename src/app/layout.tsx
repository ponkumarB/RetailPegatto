import React from 'react';
import type { Metadata } from 'next';
import '@/index.css';
import { Providers } from '@/store/providers';

export const metadata: Metadata = {
  title: 'Retail Pegatto',
  description: 'Enterprise OS for Commerce and Trade',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased" suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
