'use client';

import { Minus, Plus } from 'lucide-react';
import AnimatedList from '@/components/reactbits/AnimatedList';
import { getSpaceContainers } from '@/data/mock-data';

interface ContainersListProps {
  spaceId: string;
  counts: Record<string, number>;
  onIncrement: (id: string) => void;
  onDecrement: (id: string) => void;
}

export default function ContainersList({ spaceId, counts, onIncrement, onDecrement }: ContainersListProps) {
  const containers = getSpaceContainers(spaceId);
  const itemNames = containers.map((c) => c.id);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-[#1A1A1A]">Storage Containers</h3>
        <span className="text-xs text-[#9CA3AF] font-medium">{containers.length} units</span>
      </div>

      <AnimatedList
        items={itemNames}
        showGradients={false}
        enableArrowNavigation={false}
        displayScrollbar={false}
        renderItem={(itemId, index, isSelected) => {
          const container = containers[index];
          if (!container) return null;
          const count = counts[container.id] ?? container.itemCount;

          return (
            <div
              className={`bg-white rounded-xl p-4 border transition-all duration-200 ${
                isSelected
                  ? 'border-emerald-300 shadow-[0_0_0_1px_rgba(74,222,128,0.15)]'
                  : 'border-[#E5E7EB] hover:border-[#D1D5DB]'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#1A1A1A] truncate">{container.name}</p>
                  <p className="text-xs text-[#9CA3AF] mt-0.5">{container.description}</p>
                </div>
                <div className="flex items-center gap-1 ml-4">
                  <button
                    onClick={(e) => { e.stopPropagation(); onDecrement(container.id); }}
                    className="w-7 h-7 rounded-lg bg-[#F5F5F0] hover:bg-[#E5E7EB] flex items-center justify-center transition-colors duration-150"
                    aria-label="Decrease count"
                  >
                    <Minus className="w-3 h-3 text-[#6B7280]" />
                  </button>
                  <span className="w-10 text-center text-sm font-semibold text-[#1A1A1A] tabular-nums">
                    {count}
                  </span>
                  <button
                    onClick={(e) => { e.stopPropagation(); onIncrement(container.id); }}
                    className="w-7 h-7 rounded-lg bg-emerald-50 hover:bg-emerald-100 flex items-center justify-center transition-colors duration-150"
                    aria-label="Increase count"
                  >
                    <Plus className="w-3 h-3 text-emerald-600" />
                  </button>
                </div>
              </div>
            </div>
          );
        }}
      />
    </div>
  );
}
