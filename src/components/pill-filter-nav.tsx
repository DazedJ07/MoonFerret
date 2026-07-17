'use client';

import { motion, AnimatePresence } from 'motion/react';

interface PillFilterNavProps {
  filters: string[];
  activeFilter: string;
  onFilterChange: (filter: string) => void;
  counts?: Record<string, number>;
}

export default function PillFilterNav({
  filters,
  activeFilter,
  onFilterChange,
  counts,
}: PillFilterNavProps) {
  return (
    <div className="flex items-center gap-1.5 p-1 bg-card border border-border-main/30 rounded-full w-fit shadow-sm overflow-x-auto scrollbar-hide">
      {filters.map((filter) => {
        const isActive = activeFilter === filter;
        const count = counts?.[filter];

        return (
          <button
            key={filter}
            onClick={() => onFilterChange(filter)}
            className={`relative flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-full transition-colors whitespace-nowrap flex-shrink-0 ${
              isActive ? 'text-primary' : 'text-secondary hover:text-primary'
            }`}
          >
            <AnimatePresence>
              {isActive && (
                <motion.span
                  layoutId="activeCategoryPill"
                  className="absolute inset-0 bg-brand/10 rounded-full border border-brand/25"
                  transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                  initial={false}
                  exit={{ opacity: 0 }}
                />
              )}
            </AnimatePresence>

            <span className="relative z-10">{filter}</span>

            {count != null && count > 0 && (
              <span className="relative z-10 ml-1 text-[9px] bg-canvas/60 px-1.5 py-0.5 rounded-full font-mono">
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
