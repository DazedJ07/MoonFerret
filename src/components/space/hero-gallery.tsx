'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Space } from '@/data/mock-data';

const gradients = [
  'from-emerald-100 via-emerald-50 to-teal-50',
  'from-sky-100 via-blue-50 to-indigo-50',
  'from-amber-100 via-orange-50 to-yellow-50',
  'from-rose-100 via-pink-50 to-fuchsia-50',
  'from-violet-100 via-purple-50 to-indigo-50',
];

const roomIcons: Record<string, string> = {
  'my-room': '🛏️',
  kitchen: '🍳',
  'comfort-room': '🚿',
  'living-room': '🛋️',
};

interface HeroGalleryProps {
  space: Space;
}

export default function HeroGallery({ space }: HeroGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const totalSlides = space.imageCount;

  const prev = () => setCurrentIndex((c) => (c === 0 ? totalSlides - 1 : c - 1));
  const next = () => setCurrentIndex((c) => (c === totalSlides - 1 ? 0 : c + 1));

  return (
    <div className="relative rounded-2xl overflow-hidden bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      {/* Gallery Slide */}
      <div className={`relative h-48 sm:h-56 bg-gradient-to-br ${gradients[currentIndex % gradients.length]} flex items-center justify-center transition-all duration-500`}>
        <div className="text-center">
          <span className="text-5xl">{roomIcons[space.id] || '📦'}</span>
          <p className="text-sm font-medium text-[#6B7280] mt-3">{space.name} — View {currentIndex + 1}</p>
        </div>

        {/* Navigation Arrows */}
        <button
          onClick={prev}
          className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 backdrop-blur-sm shadow-sm flex items-center justify-center hover:bg-white transition-all duration-200"
          aria-label="Previous slide"
        >
          <ChevronLeft className="w-4 h-4 text-[#6B7280]" />
        </button>
        <button
          onClick={next}
          className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 backdrop-blur-sm shadow-sm flex items-center justify-center hover:bg-white transition-all duration-200"
          aria-label="Next slide"
        >
          <ChevronRight className="w-4 h-4 text-[#6B7280]" />
        </button>
      </div>

      {/* Dots Indicator */}
      <div className="flex items-center justify-center gap-1.5 py-3">
        {Array.from({ length: totalSlides }).map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentIndex(i)}
            className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
              i === currentIndex ? 'bg-emerald-500 w-4' : 'bg-[#D1D5DB]'
            }`}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
