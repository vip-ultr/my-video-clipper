'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Github, Upload } from 'lucide-react';

export function Navbar() {
  return (
    <nav className="border-b border-gray-200 bg-white">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="text-2xl font-bold text-black">
            My Video Clipper
          </Link>
          <div className="hidden md:flex gap-6">
            <Link href="/upload" className="text-gray-600 hover:text-black transition">
              Upload
            </Link>
            <a href="#features" className="text-gray-600 hover:text-black transition">
              Features
            </a>
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-black transition">
              Docs
            </a>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/upload">
            <Button className="bg-black text-white hover:bg-gray-800">
              <Upload className="w-4 h-4 mr-2" />
              Get Started
            </Button>
          </Link>
          <a href="https://github.com" target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="icon" className="border-gray-200">
              <Github className="w-4 h-4" />
            </Button>
          </a>
        </div>
      </div>
    </nav>
  );
}
