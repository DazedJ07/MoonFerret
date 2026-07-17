import { Home, Plus, Trash2, Shirt, ClipboardList, StickyNote, Folder } from 'lucide-react';
import type { Space } from '@/data/mock-data';
import type { ViewId } from '@/hooks/use-navigation';

interface SidebarProps {
  activeView: string;
  onNavigate: (view: ViewId | string) => void;
  activeTab: string;
  onTabChange: (tab: any) => void;
  spaces?: Space[];
  onAddSpaceClick?: () => void;
  onDeleteSpace?: (spaceId: string) => void;
  totalItems?: number;
  utilization?: number;
  className?: string;
}

export default function Sidebar({
  activeView,
  onNavigate,
  activeTab,
  onTabChange,
  spaces = [],
  onAddSpaceClick,
  onDeleteSpace,
  totalItems = 0,
  utilization = 0,
  className,
}: SidebarProps) {
  const sidebarClassName = className
    ? className
    : 'hidden lg:block fixed left-6 top-24 max-h-[calc(100vh-6rem)] w-[240px] rounded-3xl border border-border-main/20 bg-card p-3 shadow-sm space-y-3 overflow-y-auto';

  // General workspace links
  const generalLinks = [
    { id: 'dashboard', label: 'Dashboard', icon: Home, tab: 'my-items' },
    { id: 'outfits', label: 'My Outfits', icon: Shirt, tab: 'my-outfits' },
    { id: 'notes', label: 'My Notes', icon: StickyNote, tab: 'my-notes' },
    { id: 'todo', label: 'Todo List', icon: ClipboardList, tab: 'todo-list' },
  ];

  return (
    <aside className={sidebarClassName}>
      {/* Header Logo */}
      <div className="rounded-3xl border border-border-main/20 bg-background/90 p-3 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 overflow-hidden rounded-2xl bg-canvas/80 flex items-center justify-center border border-border-main/20">
            <img src="/Ico/Moonferret.png" alt="MoonFerret Logo" className="h-full w-full object-contain" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-[0.24em] text-secondary/70">MoonFerret</p>
            <h1 className="text-sm font-semibold text-primary truncate">MoonFerret Home</h1>
            <p className="text-[10px] text-secondary mt-1">Inventory Tracker</p>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-border-main/20 bg-white/90 p-3 shadow-sm space-y-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.24em] text-secondary/70 mb-3">Workspace</p>
          <div className="space-y-2">
          {generalLinks.map((item) => {
            const isActive = item.tab === 'my-items' 
              ? (activeView === 'dashboard' && activeTab === 'my-items')
              : (activeTab === item.tab);

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  if (item.tab === 'my-items') {
                    onNavigate('dashboard');
                  }
                  onTabChange(item.tab);
                }}
                className={`flex w-full items-center gap-2 rounded-2xl px-2.5 py-2 text-left text-sm transition font-medium ${
                  isActive ? 'bg-brand/10 text-primary font-semibold' : 'text-secondary hover:bg-canvas'
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </button>
            );
          })}
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-border-main/20 bg-white/90 p-3 shadow-sm space-y-3">
        <div className="mb-2 flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.24em] text-secondary/70">Inventory</p>
            <h2 className="text-sm font-semibold text-primary">Spaces</h2>
          </div>
          {onAddSpaceClick && (
            <button
              type="button"
              onClick={onAddSpaceClick}
              className="rounded-full border border-border-main/20 p-1 text-secondary transition hover:bg-canvas cursor-pointer"
              aria-label="Add space"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="space-y-1">
          {spaces.map((space) => {
            const isActive = activeView === space.id && activeTab === 'my-items';
            return (
              <button
                key={space.id}
                type="button"
                onClick={() => {
                  onNavigate(space.id);
                  onTabChange('my-items');
                }}
                className={`flex w-full items-center justify-between rounded-2xl px-2.5 py-2 text-left text-sm transition font-medium ${
                  isActive ? 'bg-brand/10 text-primary font-semibold' : 'text-secondary hover:bg-canvas'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Folder className="h-4 w-4" />
                  {space.name}
                </span>
                {onDeleteSpace && (
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(event) => {
                      event.stopPropagation();
                      onDeleteSpace(space.id);
                    }}
                    className="rounded-full p-1 text-secondary/70 hover:bg-canvas hover:text-primary cursor-pointer"
                    aria-label={`Delete ${space.name}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Stats Section */}
      <div className="rounded-3xl border border-border-main/20 bg-background/90 p-3 text-xs text-secondary mt-2 shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-border-main/20">
          <span className="font-semibold text-secondary uppercase tracking-[0.22em]">Quick Stats</span>
        </div>
        <div className="mt-3 space-y-3">
          <div className="flex items-center justify-between text-[11px]">
            <span>Total Items</span>
            <span className="font-semibold text-primary">{totalItems}</span>
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span>Utilization</span>
            <span className="font-semibold text-primary">{utilization}%</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
