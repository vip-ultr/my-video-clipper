import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { Navbar } from '@/components/layout/Navbar';
import '@/styles/globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'My Video Clipper - AI-Powered Livestream Video Clipper',
  description: 'Automatically create short-form clips from your livestreams with AI detection, subtitle styling, blur effects, and watermarks.',
  keywords: ['video', 'clipper', 'ai', 'livestream', 'shorts', 'tiktok'],
  authors: [{ name: 'My Video Clipper' }]
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  colorScheme: 'light'
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="bg-white text-black font-sans flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-1">{children}</main>
        <footer className="border-t border-gray-200 bg-white py-8 mt-auto">
          <div className="max-w-7xl mx-auto px-4 text-center text-sm text-gray-600">
            <p>&copy; 2026 My Video Clipper. All rights reserved.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
