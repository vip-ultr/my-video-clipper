import type { Metadata } from 'next';
import { Navbar } from '@/components/layout/Navbar';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: 'My Video Clipper - AI-Powered Livestream Video Clipper',
  description: 'Automatically create short-form clips from your livestreams with AI detection, subtitle styling, blur effects, and watermarks.',
  keywords: ['video', 'clipper', 'ai', 'livestream', 'shorts', 'tiktok'],
  authors: [{ name: 'My Video Clipper' }],
  viewport: 'width=device-width, initial-scale=1',
  colorScheme: 'light'
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-white text-black">
        <Navbar />
        <main className="flex-1">{children}</main>
        <footer className="border-t border-gray-200 bg-white py-8 mt-16">
          <div className="max-w-7xl mx-auto px-4 text-center text-sm text-gray-600">
            <p>&copy; 2024 My Video Clipper. All rights reserved.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
