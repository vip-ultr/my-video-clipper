'use client';

import { Sparkles, Palette, Layers, Zap } from 'lucide-react';

export function FeaturesSection() {
  const features = [
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
  ];

  return (
    <section id="features" className="max-w-7xl mx-auto px-4 py-20">
      <h2 className="text-4xl font-bold text-center mb-16">Powerful Features</h2>
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
        {features.map((feature, idx) => {
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
  );
}
