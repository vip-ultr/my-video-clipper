'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';

export function HeroSection() {
  return (
    <section className="max-w-7xl mx-auto px-4 py-20 text-center">
      <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
        Clip Your Livestreams<br />
        <span className="text-gray-600">in Seconds</span>
      </h1>
      <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
        AI-powered automatic clip detection, professional editing tools, and instant sharing.
        Turn hours of content into viral short-form videos.
      </p>
      <div className="flex justify-center gap-4">
        <Link href="/upload">
          <Button className="bg-black text-white hover:bg-gray-800 text-lg h-12 px-8">
            Get Started Free
          </Button>
        </Link>
      </div>
    </section>
  );
}
