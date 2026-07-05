'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, Minus, Plus } from 'lucide-react';
import CoverflowCarousel, { type CarouselItem } from '@/components/carousel/coverflow-carousel';
import { getSpaceById, getSpaceContainers, getSpaceStorageUnits } from '@/data/mock-data';
import type { ViewId } from '@/hooks/use-navigation';

interface SpaceViewProps {
  spaceId: ViewId;
  counts: Record<string, number>;
  onIncrement: (id: string) => void;
  onDecrement: (id: string) => void;
}

export default function SpaceView({ spaceId, counts, onIncrement, onDecrement }: SpaceViewProps) {
  const space = getSpaceById(spaceId);
  const containers = getSpaceContainers(spaceId);
  const storageUnits = getSpaceStorageUnits(spaceId);
  const [activeContainerIndex, setActiveContainerIndex] = useState(0);

  if (!space) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-secondary text-sm">Space not found</p>
      </div>
    );
  }

  const storageCarouselItems: CarouselItem[] = containers.map((c) => ({
    id: c.id,
    title: c.name,
    subtitle: c.description,
    emoji: c.spaceId === 'my-room' ? '🗄️' : c.spaceId === 'kitchen' ? '🍽️' : c.spaceId === 'comfort-room' ? '🪞' : '📺',
    gradient: 'from-slate-100 to-gray-50',
    meta: `${counts[c.id] ?? c.itemCount} items inside`,
  }));

  const activeContainer = containers[activeContainerIndex];
  const activeUnit = storageUnits[activeContainerIndex];

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <motion.div
        className="flex items-center gap-1.5 text-sm"
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      >
        <span className="text-secondary font-medium">Spaces</span>
        <ChevronRight className="w-3.5 h-3.5 text-secondary" />
        <span className="text-primary font-medium">{space.name}</span>
      </motion.div>

      {/* Space Header */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25, delay: 0.05 }}
      >
        <h1 className="text-2xl font-semibold text-primary tracking-tight">{space.name}</h1>
        <p className="text-sm text-secondary mt-1">{space.description} — {containers.length} storage containers</p>
      </motion.div>

      {/* Level 2 Storage Coverflow Carousel */}
      <motion.div
        className="space-y-3"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25, delay: 0.1 }}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-primary">Storage Containers</h2>
          <span className="text-[10px] text-secondary uppercase tracking-widest font-semibold">{containers.length} units</span>
        </div>
        <CoverflowCarousel
          items={storageCarouselItems}
          activeIndex={activeContainerIndex}
          onChangeActiveIndex={setActiveContainerIndex}
          onItemClick={(_id, index) => setActiveContainerIndex(index)}
          height="h-44"
        />
      </motion.div>

      {/* Active Container Item Inventory Grid */}
      <AnimatePresence mode="wait">
        {activeContainer && (
          <motion.div
            key={activeContainer.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="bg-card border border-border-main"
          >
            {/* Container Header */}
            <div className="px-6 py-4 border-b border-border-main flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-primary">{activeContainer.name}</h3>
                <p className="text-xs text-secondary mt-0.5">{activeContainer.description}</p>
              </div>
              {activeUnit && (
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider border border-border-main ${
                    activeUnit.status === 'full' ? 'bg-emerald-50 text-emerald-700' :
                    activeUnit.status === 'has-spares' ? 'bg-sky-50 text-sky-700' :
                    'bg-canvas text-secondary'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      activeUnit.status === 'full' ? 'bg-emerald-500' :
                      activeUnit.status === 'has-spares' ? 'bg-header-accent' :
                      'bg-secondary'
                    }`} />
                    {activeUnit.status === 'full' ? 'Full' : activeUnit.status === 'has-spares' ? 'Has Spares' : 'Empty'}
                  </span>
                </div>
              )}
            </div>

            {/* Inline Volume Modifier */}
            <div className="px-6 py-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-secondary font-medium uppercase tracking-widest">Item Count</p>
                  <p className="text-[10px] text-secondary mt-0.5">
                    {activeUnit ? `Capacity: ${activeUnit.capacity}` : 'No capacity data'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <motion.button
                    onClick={() => onDecrement(activeContainer.id)}
                    className="w-9 h-9 flex items-center justify-center border border-border-main bg-canvas hover:bg-card transition-colors"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                    aria-label="Decrease count"
                  >
                    <Minus className="w-4 h-4 text-primary" />
                  </motion.button>
                  <div className="w-16 h-9 flex items-center justify-center border border-border-main bg-card">
                    <span className="text-lg font-bold text-primary tabular-nums">
                      {counts[activeContainer.id] ?? activeContainer.itemCount}
                    </span>
                  </div>
                  <motion.button
                    onClick={() => onIncrement(activeContainer.id)}
                    className="w-9 h-9 flex items-center justify-center border border-border-main bg-header-accent/15 hover:bg-header-accent/25 transition-colors"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                    aria-label="Increase count"
                  >
                    <Plus className="w-4 h-4 text-primary" />
                  </motion.button>
                </div>
              </div>

              {/* Capacity bar */}
              {activeUnit && (
                <div className="mt-4">
                  <div className="h-2 bg-canvas border border-border-main overflow-hidden">
                    <motion.div
                      className="h-full bg-header-accent"
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, ((counts[activeContainer.id] ?? activeContainer.itemCount) / activeUnit.capacity) * 100)}%` }}
                      transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                    />
                  </div>
                  <div className="flex justify-between mt-1.5">
                    <span className="text-[10px] text-secondary">{counts[activeContainer.id] ?? activeContainer.itemCount} items</span>
                    <span className="text-[10px] text-secondary">{activeUnit.capacity} max</span>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
