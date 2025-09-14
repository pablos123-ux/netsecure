import './globals.css';
import type { Metadata } from 'next';
import { Toaster } from 'sonner';
import { fontSans } from './fonts';

export const metadata: Metadata = {
  title: 'Rwanda Network Management System',
  description: 'Professional network monitoring and management system for Rwanda',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${fontSans.variable} font-sans`}>
      <body>
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
