'use client';

import { BedDouble, CookingPot, Bath, Sofa, Plus, Trash2, Folder, LayoutDashboard } from 'lucide-react';
import type { ViewId } from '@/hooks/use-navigation';
import type { Space } from '@/data/types';

interface SidebarProps {
  activeView: ViewId;
  onNavigate: (view: ViewId) => void;
  spaces: Space[];
  onAddSpaceClick: () => void;
  onDeleteSpace: (id: string) => void;
  totalItems: number;
  utilization: number;
  className?: string;
}

const iconMap: Record<string, typeof BedDouble> = {
  'my-room': BedDouble,
  'kitchen': CookingPot,
  'comfort-room': Bath,
  'living-room': Sofa,
};

export default function Sidebar({ 
  activeView, 
  onNavigate, 
  spaces, 
  onAddSpaceClick, 
  onDeleteSpace,
  totalItems,
  utilization,
  className
}: SidebarProps) {
  return (
    <aside className={className || "w-full min-w-0 hidden lg:block"}>
      <div className="lg:sticky lg:top-24 glass-liquid rounded-2xl p-4 space-y-3 transition-all duration-300">
        {/* Brand */}
        <div className="px-3 pt-1 pb-2">
          <h2 className="text-lg font-bold text-primary tracking-tight">
            <span className="text-brand">Moon</span>Ferret
          </h2>
          <p className="text-[10px] text-secondary font-medium uppercase tracking-widest mt-0.5">
            Inventory Tracker
          </p>
        </div>

        {/* Divider — soft gray stroke */}
        <div className="h-px bg-border-main/50 mx-1" />

        {/* Navigation */}
        <nav className="space-y-1">
          {/* Dashboard Overall Nav Button */}
          <button
            onClick={() => onNavigate('dashboard')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-300 ease-out hover:scale-[1.02] hover:bg-canvas group ${
              activeView === 'dashboard'
                ? 'bg-brand/10 text-primary border-l-2 border-brand font-semibold'
                : 'text-secondary hover:text-primary'
            }`}
          >
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 ${
                activeView === 'dashboard'
                  ? 'bg-brand/20'
                  : 'bg-canvas group-hover:bg-card'
              }`}
            >
              <LayoutDashboard className={`w-4 h-4 transition-colors duration-300 ${
                activeView === 'dashboard' ? 'text-brand' : 'text-secondary group-hover:text-primary'
              }`} />
            </div>
            <span>Dashboard</span>
            {activeView === 'dashboard' && (
              <div className="ml-auto w-1.5 h-1.5 rounded-full bg-brand" />
            )}
          </button>

          <div className="h-px bg-border-main/30 my-2 mx-1" />

          {/* Spaces Header with [+] Action */}
          <div className="flex items-center justify-between px-3 py-1.5">
            <p className="text-[10px] font-semibold text-secondary uppercase tracking-widest">
              Spaces
            </p>
            <button 
              onClick={onAddSpaceClick}
              className="p-1 hover:bg-canvas rounded-full text-secondary hover:text-primary transition-colors cursor-pointer"
              aria-label="Add Space"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Dynamic Spaces List */}
          <div className="space-y-0.5">
            {spaces.map((space) => {
              const isActive = activeView === space.id;
              const IconComp = iconMap[space.id] || Folder;

              return (
                <div 
                  key={space.id} 
                  className="group/item relative flex items-center w-full"
                >
                  <button
                    onClick={() => onNavigate(space.id as ViewId)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-300 ease-out hover:scale-[1.02] hover:bg-canvas group ${
                      isActive
                        ? 'bg-brand/10 text-primary border-l-2 border-brand font-semibold'
                        : 'text-secondary hover:text-primary'
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 ${
                        isActive
                          ? 'bg-brand/20'
                          : 'bg-canvas group-hover:bg-card'
                      }`}
                    >
                      <IconComp
                        className={`w-4 h-4 transition-colors duration-300 ${
                          isActive ? 'text-brand' : 'text-secondary group-hover:text-primary'
                        }`}
                      />
                    </div>
                    <span className="truncate pr-4">{space.name}</span>
                    {isActive && (
                      <div className="ml-auto w-1.5 h-1.5 rounded-full bg-brand" />
                    )}
                  </button>

                  {/* Delete Button (Visible on Hover) */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteSpace(space.id);
                    }}
                    className="absolute right-2 opacity-0 group-hover/item:opacity-100 hover:text-rose-500 p-1 bg-card rounded-md border border-border-main/20 shadow-sm transition-all duration-200 cursor-pointer"
                    aria-label={`Delete ${space.name}`}
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
          </div>
        </nav>

        {/* Divider */}
        <div className="h-px bg-border-main/50 mx-1" />

        {/* Quick Stats */}
        <div className="px-3 py-1">
          <p className="text-[10px] font-semibold text-secondary uppercase tracking-widest mb-3">
            Quick Stats
          </p>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-secondary">Total Items</span>
              <span className="text-xs font-semibold text-primary">{totalItems}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-secondary">Utilization</span>
              <span className="text-xs font-semibold text-primary">{utilization}%</span>
            </div>
            <div className="w-full h-1.5 bg-canvas overflow-hidden mt-1 rounded-full border border-border-main/40">
              <div style={{ width: `${utilization}%` }} className="h-full bg-brand rounded-full transition-all duration-500" />
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
