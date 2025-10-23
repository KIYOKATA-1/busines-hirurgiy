import './globals.scss';
import { ReactNode } from 'react';

export const metadata = {
  title: 'MyApp',
  description: 'Secure Next.js SSR app',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
