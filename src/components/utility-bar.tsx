'use client';

import StickyPad from '@/components/utility/sticky-pad';
import SparesTray from '@/components/utility/spares-tray';
import type { ViewId } from '@/hooks/use-navigation';
import type { IndividualItem } from '@/data/types';

interface UtilityBarProps {
  activeView: ViewId;
  onSaveNote?: (text: string) => void;
  individualItemsList: IndividualItem[];
}

export default function UtilityBar({ activeView, onSaveNote, individualItemsList }: UtilityBarProps) {
  const spaceId = activeView === 'dashboard' ? undefined : activeView;

  // Filter dynamic spares list to feed SparesTray
  const activeSpares = spaceId
    ? individualItemsList.filter((item) => item.isSpare && item.quantity > 0)
    : individualItemsList.filter((item) => item.isSpare && item.quantity > 0);

  return (
    <aside className="w-full col-span-full xl:col-span-1 shrink-0 block">
      <div className="xl:sticky xl:top-24 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-1 gap-4">
        {/* Sticky Notes Card */}
        <div className="bg-card rounded-2xl border border-border-main/40 p-5 shadow-sm">
          <StickyPad onSave={onSaveNote} />
        </div>

        {/* Spares Quick-Tray */}
        <div className="bg-card rounded-2xl border border-border-main/40 p-5 shadow-sm">
          <SparesTray spareItems={activeSpares} />
        </div>
      </div>
    </aside>
  );
}
