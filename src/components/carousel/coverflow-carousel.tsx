'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface CarouselItem {
  id: string;
  title: string;
  subtitle?: string;
  emoji?: string;
  gradient?: string;
  imageUrl?: string;
  meta?: string;
}

interface CoverflowCarouselProps {
  items: CarouselItem[];
  activeIndex: number;
  onChangeActiveIndex: (index: number) => void;
  onItemClick?: (id: string, index: number) => void;
  height?: string;
}

export default function CoverflowCarousel({ 
  items, 
  activeIndex, 
  onChangeActiveIndex, 
  onItemClick, 
  height = 'h-64' 
}: CoverflowCarouselProps) {
  const [windowWidth, setWindowWidth] = useState(1200);

  useEffect(() => {
    setWindowWidth(window.innerWidth);
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const len = items.length;

  const prev = () => onChangeActiveIndex(activeIndex - 1);
  const next = () => onChangeActiveIndex(activeIndex + 1);

  const goToItem = (index: number) => {
    if (len === 0) return;
    const currentNormalized = ((activeIndex % len) + len) % len;
    let diff = index - currentNormalized;
    if (diff > len / 2) diff -= len;
    if (diff < -len / 2) diff += len;
    onChangeActiveIndex(activeIndex + diff);
  };

  const isMobile = windowWidth < 640;
  const isTablet = windowWidth >= 640 && windowWidth < 1024;

  const cardWidthActive = isMobile ? '280px' : isTablet ? '320px' : '360px';
  const cardWidthInactive = isMobile ? '210px' : isTablet ? '240px' : '280px';
  const xOffsetMultiplier = isMobile ? 120 : isTablet ? 180 : 260;

  const getCardStyle = (index: number) => {
    if (len === 0) return { scale: 0, x: 0, opacity: 0, zIndex: 0, rotateY: 0 };

    const normalizedActive = ((activeIndex % len) + len) % len;
    let relativeDiff = index - normalizedActive;
    if (relativeDiff > len / 2) relativeDiff -= len;
    if (relativeDiff < -len / 2) relativeDiff += len;

    const absDiff = Math.abs(relativeDiff);

    if (absDiff > 2) {
      return {
        scale: 0,
        x: relativeDiff * xOffsetMultiplier,
        opacity: 0,
        zIndex: 0,
        rotateY: 0,
      };
    }

    return {
      scale: absDiff === 0 ? 1.05 : absDiff === 1 ? 0.85 : 0.7,
      x: relativeDiff * xOffsetMultiplier,
      opacity: absDiff === 0 ? 1 : absDiff === 1 ? 0.75 : 0.4,
      zIndex: 10 - absDiff,
      rotateY: relativeDiff * -10,
    };
  };

  if (len === 0) return null;

  const currentNormalized = ((activeIndex % len) + len) % len;

  return (
    <div className="relative w-full">
      {/* Carousel Container */}
      <div className={`relative ${height} flex items-center justify-center overflow-hidden`} style={{ perspective: '1200px' }}>
        <AnimatePresence mode="popLayout">
          {items.map((item, index) => {
            const style = getCardStyle(index);
            const isActive = index === currentNormalized;

            // Wrap logic for rendering only neighbors
            let relativeDiff = index - currentNormalized;
            if (relativeDiff > len / 2) relativeDiff -= len;
            if (relativeDiff < -len / 2) relativeDiff += len;
            if (Math.abs(relativeDiff) > 2) return null;

            return (
              <motion.div
                key={item.id}
                className="absolute cursor-pointer"
                style={{
                  width: isActive ? cardWidthActive : cardWidthInactive,
                  zIndex: style.zIndex,
                  transformStyle: 'preserve-3d',
                }}
                animate={{
                  x: style.x,
                  scale: style.scale,
                  opacity: style.opacity,
                  rotateY: style.rotateY,
                }}
                transition={{
                  type: 'spring',
                  stiffness: 260,
                  damping: 26,
                  mass: 0.8,
                }}
                onClick={() => {
                  if (isActive) {
                    onItemClick?.(item.id, index);
                  } else {
                    goToItem(index);
                  }
                }}
                whileHover={isActive ? { scale: 1.07, y: -6 } : { scale: style.scale * 1.03 }}
                whileTap={isActive ? { scale: 0.98 } : {}}
              >
                <div
                  className={`${height} bg-card rounded-2xl border overflow-hidden flex flex-col justify-end p-6 transition-all duration-300 relative ${
                    isActive ? 'border-brand/50 shadow-[0_12px_30px_rgba(0,0,0,0.06)]' : 'border-border-main/20 shadow-[0_4px_12px_rgba(0,0,0,0.02)]'
                  }`}
                >
                  {/* Background Image / Gradient Fallback */}
                  {item.imageUrl ? (
                    <>
                      <div 
                        className="absolute inset-0 z-0 bg-cover bg-center transition-transform duration-700 hover:scale-105"
                        style={{ backgroundImage: `url(${item.imageUrl})` }}
                      />
                      <div className="absolute inset-0 z-10 bg-gradient-to-t from-stone-900/90 via-stone-900/40 to-transparent" />
                    </>
                  ) : (
                    <>
                      <div className={`absolute inset-0 z-0 bg-gradient-to-br ${item.gradient || 'from-brand/10 to-brand/5'} opacity-75`} />
                      <div className="absolute inset-0 z-10 bg-gradient-to-t from-stone-900/20 via-transparent to-transparent" />
                    </>
                  )}

                  {/* Content */}
                  <div className={`relative z-20 w-full ${item.imageUrl ? 'text-white' : 'text-primary'}`}>
                    <div className="flex items-center gap-2 mb-1.5">
                      <h3 className="font-bold tracking-tight text-base leading-tight font-sans">
                        {item.title}
                      </h3>
                    </div>
                    {item.subtitle && (
                      <p className={`text-xs line-clamp-1 ${item.imageUrl ? 'text-stone-200' : 'text-secondary'}`}>
                        {item.subtitle}
                      </p>
                    )}
                    {item.meta && isActive && (
                      <div className="mt-2.5">
                        <span className="inline-block text-[9px] font-bold uppercase tracking-wider bg-brand/20 text-brand border border-brand/25 px-2 py-0.5 rounded-full">
                          {item.meta}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Navigation Arrows */}
      <div className="flex justify-center items-center gap-4 mt-2">
        <button
          onClick={prev}
          className="w-8 h-8 rounded-full border border-border-main bg-card hover:bg-canvas flex items-center justify-center shadow-xs transition-colors duration-150 cursor-pointer"
          aria-label="Previous space"
        >
          <ChevronLeft className="w-4 h-4 text-primary" />
        </button>
        <div className="flex gap-1.5">
          {items.map((_, i) => (
            <button
              key={i}
              onClick={() => goToItem(i)}
              className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                i === currentNormalized ? 'w-5 bg-brand' : 'w-1.5 bg-border-main/50 hover:bg-border-main'
              }`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
        <button
          onClick={next}
          className="w-8 h-8 rounded-full border border-border-main bg-card hover:bg-canvas flex items-center justify-center shadow-xs transition-colors duration-150 cursor-pointer"
          aria-label="Next space"
        >
          <ChevronRight className="w-4 h-4 text-primary" />
        </button>
      </div>
    </div>
  );
}
