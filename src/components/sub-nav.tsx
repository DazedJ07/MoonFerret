'use client';

import { motion } from 'motion/react';
import { Package, Shirt, StickyNote, ListTodo } from 'lucide-react';

export type SubNavTab = 'my-items' | 'my-outfits' | 'my-notes' | 'todo-list';

interface SubNavProps {
  activeTab: SubNavTab;
  onTabChange: (tab: SubNavTab) => void;
}

const tabs: { id: SubNavTab; label: string; icon: typeof Package }[] = [
  { id: 'my-items', label: 'My Items', icon: Package },
  { id: 'my-outfits', label: 'My Outfits', icon: Shirt },
  { id: 'my-notes', label: 'My Notes', icon: StickyNote },
  { id: 'todo-list', label: 'Todo List', icon: ListTodo },
];

export default function SubNav({ activeTab, onTabChange }: SubNavProps) {
  return (
    <div className="flex items-center gap-1 p-1 bg-card border border-border-main/45 rounded-full max-w-full overflow-x-auto scrollbar-hide shadow-sm flex-nowrap">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <motion.button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`relative flex items-center gap-2 px-4.5 py-1.5 text-xs font-semibold rounded-full transition-colors duration-150 flex-shrink-0 ${
              isActive ? 'text-primary' : 'text-secondary hover:text-primary'
            }`}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          >
            {isActive && (
              <motion.div
                layoutId="activeSubTab"
                className="absolute inset-0 bg-brand/10 rounded-full border border-brand/25"
                transition={{ type: 'spring', stiffness: 350, damping: 30 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}
