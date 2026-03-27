import type { Metadata } from 'next';
import { AuthProvider } from '@/lib/auth-context';
import { ToastProvider } from '@/components/ui/toast';
import './globals.css';

export const metadata: Metadata = {
  title: 'MedFolio — Your Medical Portfolio Companion',
  description:
    'A modern portfolio companion for UK doctors. Track your training, log interesting cases, and prepare for career milestones.',
  keywords: ['medical portfolio', 'junior doctor', 'doctor', 'resident doctor' , 'ARCP', 'ePortfolio', 'UK medicine'],
  icons: {
    icon: '/favicon.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <AuthProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
