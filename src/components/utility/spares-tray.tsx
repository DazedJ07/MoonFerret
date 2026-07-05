'use client';

import { PackagePlus } from 'lucide-react';
import AnimatedList from '@/components/reactbits/AnimatedList';
import type { IndividualItem } from '@/components/views/dashboard-view';

interface SparesTrayProps {
  spareItems: IndividualItem[];
}

export default function SparesTray({ spareItems }: SparesTrayProps) {
  const itemIds = spareItems.map((s) => s.id);

  if (spareItems.length === 0) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <PackagePlus className="w-4 h-4 text-sky-400" />
          <h3 className="text-sm font-semibold text-primary">Spare Items</h3>
        </div>
        <div className="flex items-center justify-center py-8">
          <p className="text-xs text-secondary font-medium">No active spares tracked</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <PackagePlus className="w-4 h-4 text-sky-400" />
          <h3 className="text-sm font-semibold text-primary">Spare Items</h3>
        </div>
        <span className="text-[10px] font-semibold text-sky-600 bg-sky-500/10 px-2 py-0.5 rounded-full border border-sky-400/20 uppercase tracking-wider">
          {spareItems.length} items
        </span>
      </div>

      <AnimatedList
        items={itemIds}
        showGradients={true}
        enableArrowNavigation={false}
        displayScrollbar={false}
        renderItem={(_itemId, index, isSelected) => {
          const spare: IndividualItem | undefined = spareItems[index];
          if (!spare) return null;

          return (
            <div
              className={`p-3.5 rounded-2xl border transition-all duration-300 ease-out hover:scale-[1.02] flex items-center justify-between gap-3 ${
                isSelected
                  ? 'bg-sky-500/10 border-sky-400/30 shadow-md'
                  : 'bg-canvas/30 border-border-main/20'
              }`}
            >
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-primary truncate">
                  {spare.name}
                </p>
                <p className="text-[10px] text-secondary mt-0.5 truncate">
                  Condition: {spare.condition}
                </p>
              </div>
              <span className="shrink-0 inline-flex items-center justify-center px-2 py-0.5 rounded-full bg-sky-500/10 text-[10px] font-bold text-sky-600 border border-sky-400/20">
                {spare.quantity} Qty
              </span>
            </div>
          );
        }}
      />
    </div>
  );
}
