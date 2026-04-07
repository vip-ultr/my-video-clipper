'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';

export function Navbar() {
  return (
    <nav className="sticky top-0 z-50 border-b border-gray-200 bg-white">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="text-2xl font-bold text-black">
          My Video Clipper
        </Link>
        <Link href="/upload">
          <Button className="bg-black text-white hover:bg-gray-800">
            Start Clipping
          </Button>
        </Link>
      </div>
    </nav>
  );
}
