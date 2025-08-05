import './globals.css';
import type { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import AuthWrapper from '@/components/AuthWrapper';

export const metadata: Metadata = {
  title: 'ComfortZone',
  description: 'Daily challenges to leave your comfort zone.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-green-800 antialiased">
        <AuthWrapper>
          <Navbar />
          <main className="max-w-4xl mx-auto px-4 py-8">{children}</main>
        </AuthWrapper>
      </body>
    </html>
  );
}
