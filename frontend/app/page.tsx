'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { HeroSection } from '@/components/sections/HeroSection';
import { FeaturesSection } from '@/components/sections/FeaturesSection';

export default function Home() {
  return (
    <div className="w-full">
      {/* Hero Section */}
      <HeroSection />

      {/* Features Section */}
      <FeaturesSection />

      {/* CTA Section */}
      <section className="mx-4 md:mx-auto md:max-w-7xl mb-16 md:mb-0 rounded-2xl bg-black text-white px-6 py-14 md:px-16 md:py-20">
        <div className="text-center">
          <h2 className="text-2xl md:text-4xl font-bold mb-4">Ready to Create Amazing Clips?</h2>
          <p className="text-gray-300 mb-8 text-base md:text-lg max-w-xl mx-auto">
            Upload your livestream video and start creating professional clips in minutes.
          </p>
          <Link href="/upload">
            <Button className="bg-white text-black hover:bg-gray-200 text-base md:text-lg h-11 md:h-12 px-6 md:px-8 w-full sm:w-auto">
              Start Clipping Now
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
