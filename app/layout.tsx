import type { Metadata } from 'next';
import { Inter, Geist_Mono } from 'next/font/google';
import { ThemeProvider } from 'next-themes';
import { LearnerProvider } from '@/contexts/LearnerContext';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import './globals.css';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Claude Learn — AI-Native Learning Platform',
  description:
    'Master Claude through personalized, AI-native learning experiences. Adaptive assessments, interactive exercises, and real-time feedback.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${geistMono.variable} font-sans antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <LearnerProvider>
            <ErrorBoundary>{children}</ErrorBoundary>
          </LearnerProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
