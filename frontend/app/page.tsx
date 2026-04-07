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
      <section className="max-w-7xl mx-auto px-4 py-20 bg-black text-white rounded-lg">
        <div className="text-center">
          <h2 className="text-4xl font-bold mb-4">Ready to Create Amazing Clips?</h2>
          <p className="text-gray-300 mb-8 text-lg">
            Upload your livestream video and start creating professional clips in minutes.
          </p>
          <Link href="/upload">
            <Button className="bg-white text-black hover:bg-gray-200 text-lg h-12 px-8">
              Start Clipping Now
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
