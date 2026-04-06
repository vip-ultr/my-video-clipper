'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Zap, Sparkles, Palette, Layers } from 'lucide-react';

export default function Home() {
  return (
    <div className="w-full">
      {/* Hero Section */}
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
          <a href="https://github.com" target="_blank" rel="noopener noreferrer">
            <Button variant="outline" className="text-lg h-12 px-8">
              View on GitHub
            </Button>
          </a>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="max-w-7xl mx-auto px-4 py-20">
        <h2 className="text-4xl font-bold text-center mb-16">Powerful Features</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            {
              icon: Sparkles,
              title: 'AI Clip Detection',
              description: 'Automatically identify high-engagement moments using sentiment analysis'
            },
            {
              icon: Palette,
              title: 'Subtitle Styles',
              description: 'Choose from 3 professional subtitle styles with custom colors'
            },
            {
              icon: Layers,
              title: 'Blur Effects',
              description: 'Apply smooth blur to sensitive content with adjustable strength'
            },
            {
              icon: Zap,
              title: 'Watermarks',
              description: 'Add custom or default watermarks with position and opacity control'
            }
          ].map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <div key={idx} className="p-6 border border-gray-200 rounded-lg hover:shadow-lg transition">
                <Icon className="w-12 h-12 mb-4 text-black" />
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </section>

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
