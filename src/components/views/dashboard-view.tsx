'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import CoverflowCarousel, { type CarouselItem } from '@/components/carousel/coverflow-carousel';
import type { Space } from '@/data/mock-data';
import { 
  Package, Archive, AlertTriangle, ChevronRight, 
  Plus, Minus, Tag, Image as ImageIcon, X, Sliders, Info, Trash2, Edit3 
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

export interface IndividualItem {
  id: string;
  containerId: string; // Reference to StorageUnit id
  name: string;
  description: string;
  imageUrl?: string;
  quantity: number;
  condition: 'Mint' | 'Good' | 'Worn';
  isSpare: boolean;
}

export interface StorageUnit {
  id: string;
  name: string;
  spaceId: string;
  spaceName: string;
  totalItems: number;
  capacity: number;
  status: 'full' | 'has-spares' | 'empty';
  imageUrl?: string;
  compartments?: number;
  type?: string;
}

interface DashboardViewProps {
  spaces: Space[];
  activeCarouselIndex: number;
  setActiveCarouselIndex: (index: number) => void;
  storageUnitsList: StorageUnit[];
  setStorageUnitsList: React.Dispatch<React.SetStateAction<StorageUnit[]>>;
  individualItemsList: IndividualItem[];
  setIndividualItemsList: React.Dispatch<React.SetStateAction<IndividualItem[]>>;
  searchQuery: string;
  onUpdateSpace: (id: string, updatedFields: Partial<Space>) => void;
  userId: string | null;
  userName: string;
}

const spaceImages: Record<string, string> = {
  'my-room': 'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=600&q=80',
  'kitchen': 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=600&q=80',
  'comfort-room': 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=600&q=80',
  'living-room': 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=600&q=80',
};

const defaultSpaceGradients = [
  'from-brand/10 to-brand/5',
  'from-amber-100 to-orange-50',
  'from-emerald-100 to-teal-50',
  'from-violet-100 to-purple-50',
];

const greetingTags = [
  "Anything to track today?",
  "Ready to manage your cabinets?",
  "Your household items are looking organized!",
  "Let's check your active spares.",
  "Everything in its right place.",
  "MoonFerret is online and tracking.",
  "Let's organize some storage units!"
];

export default function DashboardView({
  spaces,
  activeCarouselIndex,
  setActiveCarouselIndex,
  storageUnitsList,
  setStorageUnitsList,
  individualItemsList,
  setIndividualItemsList,
  searchQuery,
  onUpdateSpace,
  userId,
  userName,
}: DashboardViewProps) {
  const [selectedStorageId, setSelectedStorageId] = useState<string | null>(null);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  // Animated greetings
  const [randomGreetingTag, setRandomGreetingTag] = useState('');

  useEffect(() => {
    const idx = Math.floor(Math.random() * greetingTags.length);
    setRandomGreetingTag(greetingTags[idx]);
  }, []);

  const getGreetingHeader = () => {
    const hour = new Date().getHours();
    let text = 'Good morning';
    if (hour >= 12 && hour < 18) {
      text = 'Good afternoon';
    } else if (hour >= 18) {
      text = 'Good evening';
    }
    return `${text}, ${userName}! ✨`;
  };

  // Modals state
  const [isAddStorageOpen, setIsAddStorageOpen] = useState(false);
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [isEditSpaceOpen, setIsEditSpaceOpen] = useState(false);

  // Form states: Edit/Customize Space
  const [editSpaceName, setEditSpaceName] = useState('');
  const [editSpaceDesc, setEditSpaceDesc] = useState('');
  const [editSpaceDim, setEditSpaceDim] = useState('');
  const [editSpaceImage, setEditSpaceImage] = useState<string | null>(null);

  // Form states: Add Storage
  const [newStorageName, setNewStorageName] = useState('');
  const [newStorageDesc, setNewStorageDesc] = useState('');
  const [newStorageComp, setNewStorageComp] = useState(4);
  const [newStorageType, setNewStorageType] = useState('Closet');
  const [newStorageImage, setNewStorageImage] = useState<string | null>(null);

  // Form states: Add Item
  const [newItemName, setNewItemName] = useState('');
  const [newItemDesc, setNewItemDesc] = useState('');
  const [newItemQty, setNewItemQty] = useState(1);
  const [newItemCond, setNewItemCond] = useState<'Mint' | 'Good' | 'Worn'>('Good');
  const [newItemSpare, setNewItemSpare] = useState(false);
  const [newItemImage, setNewItemImage] = useState<string | null>(null);

  // Build carousel spaces list
  const carouselItems: CarouselItem[] = [
    {
      id: 'dashboard',
      title: 'Overall Dashboard',
      subtitle: 'Overview of all tracked items and spaces',
      gradient: 'from-brand/20 to-brand/10',
      meta: 'All Spaces Summary',
    },
    ...spaces.map((s, idx) => ({
      id: s.id,
      title: s.name,
      subtitle: s.description,
      imageUrl: s.imageUrl || spaceImages[s.id],
      gradient: defaultSpaceGradients[idx % defaultSpaceGradients.length],
      meta: `${storageUnitsList.filter((u) => u.spaceId === s.id).length} Storage Units`,
    })),
  ];

  const len = carouselItems.length;
  const currentNormalized = ((activeCarouselIndex % len) + len) % len;
  const activeSlide = carouselItems[currentNormalized];
  const isOverall = activeSlide.id === 'dashboard';
  const activeSpaceId = isOverall ? null : activeSlide.id;
  const activeSelectedSpace = spaces.find(s => s.id === activeSpaceId);

  // Filter storages based on active space slide and Search Query
  const activeStorages = (activeSpaceId
    ? storageUnitsList.filter((unit) => unit.spaceId === activeSpaceId)
    : storageUnitsList
  ).filter(unit => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    
    // Multi-field matching query logic
    const matchUnitName = unit.name.toLowerCase().includes(query);
    const matchUnitType = (unit.type || '').toLowerCase().includes(query);
    const matchSpaceName = unit.spaceName.toLowerCase().includes(query);
    
    const matchItems = individualItemsList.some(item => 
      item.containerId === unit.id && (
        item.name.toLowerCase().includes(query) || 
        (item.description || '').toLowerCase().includes(query) ||
        item.condition.toLowerCase().includes(query)
      )
    );
    
    return matchUnitName || matchUnitType || matchSpaceName || matchItems;
  });

  // Fallback selected storage unit
  const currentSelectedStorageId = selectedStorageId && activeStorages.some(u => u.id === selectedStorageId)
    ? selectedStorageId
    : activeStorages[0]?.id || null;

  // Filter individual items stored strictly inside the active clicked storage unit and Search Query
  const activeItems = (currentSelectedStorageId
    ? individualItemsList.filter((item) => item.containerId === currentSelectedStorageId)
    : []
  ).filter(item => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return item.name.toLowerCase().includes(query) || 
           (item.description || '').toLowerCase().includes(query) ||
           item.condition.toLowerCase().includes(query);
  });

  // Localized calculations for stats
  const activeSpaceContainers = activeSpaceId
    ? individualItemsList.filter((item) => {
        const parentStorage = storageUnitsList.find(su => su.id === item.containerId);
        return parentStorage && parentStorage.spaceId === activeSpaceId;
      })
    : individualItemsList;

  const totalItemsCount = activeSpaceContainers.reduce((sum, item) => sum + item.quantity, 0);
  const totalStorageCount = activeStorages.length;

  const lowStockCount = activeSpaceContainers.filter(
    (item) => item.quantity > 0 && item.quantity <= 3
  ).length;

  const sparesCount = activeSpaceContainers.filter((item) => item.isSpare).length;

  const activeSelectedStorage = storageUnitsList.find(su => su.id === currentSelectedStorageId);
  const activeSelectedItem = individualItemsList.find(i => i.id === selectedItemId);

  // Handlers for dynamic creations
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>, setImgState: (url: string | null) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      const localUrl = URL.createObjectURL(file);
      setImgState(localUrl);
    }
  };

  // CRUD: Space Customization Edit Modal trigger
  const handleOpenCustomize = () => {
    if (activeSelectedSpace) {
      setEditSpaceName(activeSelectedSpace.name);
      setEditSpaceDesc(activeSelectedSpace.description);
      setEditSpaceDim(activeSelectedSpace.dimensions || '');
      setEditSpaceImage(activeSelectedSpace.imageUrl || null);
      setIsEditSpaceOpen(true);
    }
  };

  const handleSaveCustomizeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSpaceId) return;

    onUpdateSpace(activeSpaceId, {
      name: editSpaceName.trim(),
      description: editSpaceDesc.trim(),
      dimensions: editSpaceDim.trim() || undefined,
      imageUrl: editSpaceImage || undefined
    });
    setIsEditSpaceOpen(false);
  };

  // CRUD: Delete Storage Unit (Supabase anchor mapping user_id)
  const handleDeleteStorage = async (id: string) => {
    setStorageUnitsList(prev => prev.filter(u => u.id !== id));
    setIndividualItemsList(prev => prev.filter(item => item.containerId !== id));

    if (userId) {
      try {
        await supabase.from('storages').delete().eq('id', id).eq('user_id', userId);
        // Cascades to delete nested items inside DB
        await supabase.from('items').delete().eq('container_id', id).eq('user_id', userId);
      } catch (err) {
        console.error('Supabase delete storage fail:', err);
      }
    }

    if (selectedStorageId === id) {
      setSelectedStorageId(null);
      setSelectedItemId(null);
    }
  };

  // CRUD: Delete Individual Item (Supabase anchor mapping user_id)
  const handleDeleteItem = async (itemId: string) => {
    const itemToDelete = individualItemsList.find(i => i.id === itemId);
    if (!itemToDelete) return;

    setIndividualItemsList(prev => prev.filter(i => i.id !== itemId));

    // Update parent totalItems count locally
    setStorageUnitsList(prev => prev.map(unit => {
      if (unit.id === itemToDelete.containerId) {
        const nextTotal = Math.max(0, unit.totalItems - itemToDelete.quantity);
        return {
          ...unit,
          totalItems: nextTotal,
          status: nextTotal >= unit.capacity ? 'full' : nextTotal > 0 ? 'has-spares' : 'empty'
        };
      }
      return unit;
    }));

    if (userId) {
      try {
        await supabase.from('items').delete().eq('id', itemId).eq('user_id', userId);
        if (activeSelectedStorage) {
          const nextTotal = Math.max(0, activeSelectedStorage.totalItems - itemToDelete.quantity);
          await supabase.from('storages').update({
            total_items: nextTotal,
            status: nextTotal >= activeSelectedStorage.capacity ? 'full' : nextTotal > 0 ? 'has-spares' : 'empty'
          }).eq('id', itemToDelete.containerId).eq('user_id', userId);
        }
      } catch (err) {
        console.error('Supabase delete item fail:', err);
      }
    }
  };

  const handleAddStorageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStorageName.trim() || !activeSpaceId) return;

    const matchedSpace = spaces.find(s => s.id === activeSpaceId);
    const newStorage: StorageUnit = {
      id: `su-${Date.now()}`,
      name: newStorageName.trim(),
      spaceId: activeSpaceId,
      spaceName: matchedSpace?.name || 'Custom Space',
      totalItems: 0,
      capacity: newStorageComp * 5,
      status: 'empty',
      imageUrl: newStorageImage || undefined,
      compartments: newStorageComp,
      type: newStorageType,
    };

    setStorageUnitsList(prev => [...prev, newStorage]);

    if (userId) {
      try {
        await supabase.from('storages').insert({
          id: newStorage.id,
          name: newStorage.name,
          space_id: newStorage.spaceId,
          space_name: newStorage.spaceName,
          total_items: newStorage.totalItems,
          capacity: newStorage.capacity,
          status: newStorage.status,
          image_url: newStorage.imageUrl || null,
          compartments: newStorage.compartments,
          type: newStorage.type,
          user_id: userId
        });
      } catch (err) {
        console.error('Supabase insert storage fail:', err);
      }
    }

    setNewStorageName('');
    setNewStorageDesc('');
    setNewStorageComp(4);
    setNewStorageImage(null);
    setIsAddStorageOpen(false);
  };

  const handleAddItemSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim() || !currentSelectedStorageId || !activeSelectedStorage) return;

    const newItem: IndividualItem = {
      id: `ii-${Date.now()}`,
      containerId: currentSelectedStorageId,
      name: newItemName.trim(),
      description: newItemDesc.trim(),
      imageUrl: newItemImage || undefined,
      quantity: newItemQty,
      condition: newItemCond,
      isSpare: newItemSpare,
    };

    setIndividualItemsList(prev => [...prev, newItem]);
    
    // Update container totalItems count in storage state
    setStorageUnitsList(prev => prev.map(unit => {
      if (unit.id === currentSelectedStorageId) {
        const nextTotal = unit.totalItems + newItemQty;
        return {
          ...unit,
          totalItems: nextTotal,
          status: nextTotal >= unit.capacity ? 'full' : nextTotal > 0 ? 'has-spares' : 'empty'
        };
      }
      return unit;
    }));

    if (userId) {
      try {
        await supabase.from('items').insert({
          id: newItem.id,
          container_id: newItem.containerId,
          name: newItem.name,
          description: newItem.description,
          image_url: newItem.imageUrl || null,
          quantity: newItem.quantity,
          condition: newItem.condition,
          is_spare: newItem.isSpare,
          user_id: userId
        });

        const nextTotal = activeSelectedStorage.totalItems + newItemQty;
        await supabase.from('storages').update({
          total_items: nextTotal,
          status: nextTotal >= activeSelectedStorage.capacity ? 'full' : nextTotal > 0 ? 'has-spares' : 'empty'
        }).eq('id', currentSelectedStorageId).eq('user_id', userId);
      } catch (err) {
        console.error('Supabase insert item fail:', err);
      }
    }

    setNewItemName('');
    setNewItemDesc('');
    setNewItemQty(1);
    setNewItemCond('Good');
    setNewItemSpare(false);
    setNewItemImage(null);
    setIsAddItemOpen(false);
  };

  const handleQuantityAdjust = async (itemId: string, direction: 'inc' | 'dec') => {
    const item = individualItemsList.find(i => i.id === itemId);
    if (!item) return;
    const nextQty = direction === 'inc' ? item.quantity + 1 : Math.max(0, item.quantity - 1);
    const parentStorage = storageUnitsList.find(su => su.id === item.containerId);

    setIndividualItemsList(prev => prev.map(i => {
      if (i.id === itemId) {
        return { ...i, quantity: nextQty };
      }
      return i;
    }));
    
    // Update capacity in parent storage locally
    setStorageUnitsList(prevSu => prevSu.map(unit => {
      if (unit.id === item.containerId) {
        const diff = nextQty - item.quantity;
        const newTotal = Math.max(0, unit.totalItems + diff);
        return {
          ...unit,
          totalItems: newTotal,
          status: newTotal >= unit.capacity ? 'full' : newTotal > 0 ? 'has-spares' : 'empty'
        };
      }
      return unit;
    }));

    if (userId) {
      try {
        await supabase.from('items').update({
          quantity: nextQty
        }).eq('id', itemId).eq('user_id', userId);

        if (parentStorage) {
          const diff = nextQty - item.quantity;
          const newTotal = Math.max(0, parentStorage.totalItems + diff);
          await supabase.from('storages').update({
            total_items: newTotal,
            status: newTotal >= parentStorage.capacity ? 'full' : newTotal > 0 ? 'has-spares' : 'empty'
          }).eq('id', item.containerId).eq('user_id', userId);
        }
      } catch (err) {
        console.error('Supabase quantity adjust fail:', err);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex items-center justify-between pb-1">
        <div>
          {isOverall ? (
            <motion.h2 
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 20 }}
              className="text-base font-bold text-primary font-sans leading-tight"
            >
              {getGreetingHeader()}
            </motion.h2>
          ) : (
            <h2 className="text-base font-bold text-primary font-sans leading-tight">
              {activeSlide.title}
            </h2>
          )}
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <p className="text-xs text-secondary font-medium">
              {isOverall 
                ? (randomGreetingTag || 'Overview of all tracked items and spaces')
                : activeSlide.subtitle
              }
            </p>
            {!isOverall && activeSelectedSpace?.dimensions && (
              <span className="text-[9px] font-bold bg-canvas border border-border-main/30 px-2 py-0.5 rounded-full text-secondary">
                Size: {activeSelectedSpace.dimensions}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          {!isOverall && (
            <button
              onClick={handleOpenCustomize}
              className="h-7 px-3 bg-white hover:bg-canvas border border-border-main/40 text-secondary rounded-full text-[10px] font-bold shadow-xs transition-all flex items-center gap-1 cursor-pointer font-sans"
            >
              <Edit3 className="w-3 h-3 text-secondary" />
              Customize Space
            </button>
          )}
          <span className="text-[10px] font-bold text-brand bg-brand/10 px-3 py-1 rounded-full border border-brand/20 uppercase tracking-widest font-sans">
            {isOverall ? 'Global Summary' : 'Space detail'}
          </span>
        </div>
      </div>

      {/* Looping Carousel centerpiece */}
      <div className="w-full py-2 bg-canvas/40 rounded-3xl border border-border-main/20 p-2 shadow-inner">
        <CoverflowCarousel
          items={carouselItems}
          activeIndex={activeCarouselIndex}
          onChangeActiveIndex={setActiveCarouselIndex}
          height="h-60"
        />
      </div>

      {/* Main bottom grid and drill down workflow */}
      <div className="space-y-6">
        {/* Storage containers section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-secondary flex items-center gap-1.5 font-sans">
              <Archive className="w-3.5 h-3.5 text-brand" />
              {isOverall ? 'Global Storage Catalog' : 'Physical Storage grid'}
            </h3>
            {!isOverall && (
              <button
                onClick={() => setIsAddStorageOpen(true)}
                className="h-7 px-3 bg-brand hover:brightness-95 text-brand-foreground rounded-full text-[10px] font-bold shadow-sm transition-all flex items-center gap-1 cursor-pointer font-sans"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Storage
              </button>
            )}
          </div>

          {/* 1. Internal Grid Scrolling Constraint Wrapper */}
          <div className={`w-full ${activeStorages.length > 6 ? 'max-h-[520px] overflow-y-auto pr-2' : ''}`}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeStorages.map((unit) => {
                const isSelected = unit.id === currentSelectedStorageId;
                const hasImg = !!unit.imageUrl;

                return (
                  <button
                    key={unit.id}
                    onClick={() => {
                      if (!isOverall) {
                        setSelectedStorageId(unit.id);
                        setSelectedItemId(null);
                      }
                    }}
                    className={`text-left rounded-2xl border p-4.5 flex flex-col justify-between h-48 shadow-sm transition-all duration-300 hover:scale-[1.01] hover:shadow-md relative overflow-hidden group ${
                      isSelected && !isOverall
                        ? 'border-brand bg-brand/5 ring-1 ring-brand/30'
                        : 'border-border-main/45 bg-card'
                    } ${isOverall ? 'cursor-default' : 'cursor-pointer'}`}
                  >
                    {/* Explicit Delete Button — visible ONLY on hover without overlapping badges */}
                    {!isOverall && (
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteStorage(unit.id);
                        }}
                        className="absolute top-3 right-3 z-20 p-1.5 bg-white hover:bg-rose-50 rounded-full border border-border-main/30 shadow-md text-stone-400 hover:text-rose-500 transition-all duration-200 opacity-0 group-hover:opacity-100 scale-95 group-hover:scale-100 cursor-pointer"
                        title="Delete Storage Unit"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </span>
                    )}

                    {/* Background container image preview */}
                    {hasImg ? (
                      <div className="absolute inset-0 z-0">
                        <img src={unit.imageUrl} alt={unit.name} className="w-full h-full object-cover opacity-20" />
                        <div className="absolute inset-0 bg-gradient-to-t from-card via-card/90 to-transparent" />
                      </div>
                    ) : (
                      <div className="absolute inset-0 z-0 bg-gradient-to-br from-canvas/50 to-transparent opacity-50" />
                    )}

                    <div className="relative z-10 w-full">
                      <div className="flex items-start justify-between gap-3">
                        <div className="pr-6">
                          <h4 className="text-sm font-bold text-primary truncate">{unit.name}</h4>
                          <p className="text-[10px] text-secondary mt-0.5 uppercase tracking-widest font-semibold">{unit.type || 'Storage Cabinet'}</p>
                        </div>
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border shrink-0 ${
                          unit.status === 'full' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' :
                          unit.status === 'has-spares' ? 'bg-brand/10 text-brand border-brand/20' :
                          'bg-stone-500/10 text-stone-500 border-border-main/30'
                        }`}>
                          {unit.status}
                        </span>
                      </div>
                      {unit.compartments && (
                        <p className="text-[10px] text-secondary mt-2 font-medium">{unit.compartments} active compartments</p>
                      )}
                    </div>

                    <div className="relative z-10 w-full pt-4 border-t border-border-main/20 flex items-center justify-between text-[10px]">
                      <span className="text-secondary font-medium">Capacity Utilized</span>
                      <span className="font-bold text-primary">{unit.totalItems} / {unit.capacity} items</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Dynamic Drill Down Capsule Items list */}
        {!isOverall && activeSelectedStorage && (
          <div className="bg-card border border-border-main/40 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-border-main/20">
              <div className="flex items-center gap-2">
                <Sliders className="w-3.5 h-3.5 text-brand" />
                <h4 className="text-xs font-bold text-primary">Stored Items: {activeSelectedStorage.name}</h4>
              </div>
              <button
                onClick={() => setIsAddItemOpen(true)}
                className="h-7 px-3 bg-brand/15 hover:bg-brand/25 text-brand rounded-full text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer font-sans"
              >
                <Plus className="w-3 h-3 text-brand" />
                Add Item
              </button>
            </div>

            {/* Compact list rows layout styled like image_933d20.png */}
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1.5">
              {activeItems.map((item) => (
                <div
                  key={item.id}
                  onClick={() => setSelectedItemId(item.id)}
                  className={`p-3 rounded-2xl border flex items-center justify-between gap-4 cursor-pointer transition-all duration-300 hover:scale-[1.01] ${
                    selectedItemId === item.id 
                      ? 'border-brand bg-brand/5' 
                      : 'border-border-main/30 bg-card hover:bg-canvas/20'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-canvas overflow-hidden shrink-0 border border-border-main/20 relative">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-brand/10 text-brand font-bold text-xs">
                          {item.name.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-primary truncate">{item.name}</p>
                      <p className="text-[10px] text-secondary mt-0.5 truncate">{item.description || 'No description added'}</p>
                    </div>
                  </div>

                  {/* Quantity and parameters capsules */}
                  <div className="flex items-center gap-3 shrink-0" onClick={e => e.stopPropagation()}>
                    <span className="text-[9px] font-bold uppercase tracking-wider bg-canvas border border-border-main/20 px-2 py-0.5 rounded-full text-secondary font-semibold">
                      {item.condition}
                    </span>
                    {item.isSpare && (
                      <span className="text-[9px] font-bold uppercase tracking-wider bg-brand/10 text-brand border border-brand/25 px-2 py-0.5 rounded-full font-semibold">
                        Spare
                      </span>
                    )}
                    <div className="flex items-center gap-1 bg-canvas p-1 rounded-full border border-border-main/30">
                      <button
                        onClick={() => handleQuantityAdjust(item.id, 'dec')}
                        className="w-6 h-6 rounded-full bg-card hover:bg-canvas flex items-center justify-center shadow-sm border border-border-main/10 cursor-pointer"
                      >
                        <Minus className="w-2.5 h-2.5 text-secondary" />
                      </button>
                      <span className="w-6 text-center text-xs font-bold text-primary tabular-nums">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => handleQuantityAdjust(item.id, 'inc')}
                        className="w-6 h-6 rounded-full bg-brand/10 hover:bg-brand/20 flex items-center justify-center shadow-sm border border-brand/20 cursor-pointer"
                      >
                        <Plus className="w-2.5 h-2.5 text-brand" />
                      </button>
                    </div>
                    {/* Direct row delete button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteItem(item.id);
                      }}
                      className="p-1 hover:bg-canvas rounded text-secondary/40 hover:text-rose-500 transition-colors cursor-pointer"
                      title="Delete item completely"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}

              {activeItems.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-xs text-secondary font-medium">No matching items found inside this cabinet.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 5. Repositioned Reactive Stats Card at Very Bottom */}
        <div className="bg-card rounded-2xl border border-border-main/40 p-5 shadow-sm space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-secondary flex items-center gap-1.5 pb-2 border-b border-border-main/20 font-sans">
            <Package className="w-3.5 h-3.5 text-brand" />
            {isOverall ? 'Global Analytics Summary' : `Room Analytics: ${activeSlide.title}`}
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <span className="text-[9px] text-secondary uppercase tracking-widest font-bold">Space Items Count</span>
              <p className="text-xl font-bold text-primary">{totalItemsCount} total</p>
            </div>
            <div className="space-y-1">
              <span className="text-[9px] text-secondary uppercase tracking-widest font-bold">Storage Count</span>
              <p className="text-xl font-bold text-primary">{totalStorageCount} cabinets</p>
            </div>
            <div className="space-y-1">
              <span className="text-[9px] text-secondary uppercase tracking-widest font-bold">Low Stock Warning</span>
              <div className="flex items-center gap-1.5">
                <p className="text-xl font-bold text-primary">{lowStockCount}</p>
                {lowStockCount > 0 && <AlertTriangle className="w-4 h-4 text-amber-500 animate-pulse" />}
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-[9px] text-secondary uppercase tracking-widest font-bold">Active Spares</span>
              <p className="text-xl font-bold text-brand">{sparesCount} items</p>
            </div>
          </div>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────
         MODALS & DRAWERS FOR DRILL DOWN AND CRUD
         ──────────────────────────────────────────────────────── */}

      {/* Customize/Edit Space Modal Form */}
      <AnimatePresence>
        {isEditSpaceOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              className="absolute inset-0 bg-black/40 backdrop-blur-xs"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsEditSpaceOpen(false)}
            />
            <motion.div 
              className="relative w-full max-w-md bg-card rounded-3xl border border-border-main/40 p-6 shadow-2xl z-10 space-y-4"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
            >
              <div className="flex items-center justify-between pb-2 border-b border-border-main/20">
                <h3 className="text-sm font-bold text-primary flex items-center gap-1.5">
                  <Edit3 className="w-4 h-4 text-brand" />
                  Customize Space Details
                </h3>
                <button onClick={() => setIsEditSpaceOpen(false)} className="p-1 hover:bg-canvas rounded-full text-secondary">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveCustomizeSubmit} className="space-y-3.5 text-xs font-sans">
                <div className="space-y-1">
                  <label className="font-bold text-secondary">Space Name / Title</label>
                  <input
                    type="text"
                    required
                    value={editSpaceName}
                    onChange={(e) => setEditSpaceName(e.target.value)}
                    className="w-full h-9 px-3 bg-canvas/30 rounded-xl border border-border-main/40 focus:outline-none focus:bg-white focus:border-brand font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-secondary">Description / Details</label>
                  <input
                    type="text"
                    value={editSpaceDesc}
                    onChange={(e) => setEditSpaceDesc(e.target.value)}
                    className="w-full h-9 px-3 bg-canvas/30 rounded-xl border border-border-main/40 focus:outline-none focus:bg-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-secondary">Size Dimensions</label>
                    <input
                      type="text"
                      value={editSpaceDim}
                      onChange={(e) => setEditSpaceDim(e.target.value)}
                      placeholder="e.g. 14x12 ft"
                      className="w-full h-9 px-3 bg-canvas/30 rounded-xl border border-border-main/40 focus:outline-none focus:bg-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-secondary">Custom Space Image</label>
                    <div className="relative h-9">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageChange(e, setEditSpaceImage)}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                      />
                      <div className="absolute inset-0 bg-canvas/30 rounded-xl border border-border-main/40 flex items-center justify-center gap-1.5 hover:bg-canvas/50">
                        <ImageIcon className="w-3.5 h-3.5 text-secondary" />
                        <span className="text-[10px] text-secondary font-medium">
                          {editSpaceImage ? 'Selected ✅' : 'Upload custom picture'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-border-main/20 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditSpaceOpen(false)}
                    className="h-8.5 px-4 rounded-full bg-canvas text-secondary font-bold hover:bg-canvas/80"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="h-8.5 px-4 rounded-full bg-brand text-brand-foreground font-bold hover:brightness-95 shadow-sm"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Dynamic Item Preview Detail Pop-up Modal */}
      <AnimatePresence>
        {activeSelectedItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div 
              className="absolute inset-0 bg-black/40 backdrop-blur-xs"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedItemId(null)}
            />
            {/* Center Modal Panel */}
            <motion.div 
              className="relative w-full max-w-sm bg-card rounded-3xl border border-border-main/40 p-6 shadow-2xl z-10 flex flex-col gap-4"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 350, damping: 28 }}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-border-main/20">
                  <span className="text-xs font-bold uppercase tracking-wider text-secondary flex items-center gap-1.5">
                    <Info className="w-4 h-4 text-brand" />
                    Asset Details
                  </span>
                  <button onClick={() => setSelectedItemId(null)} className="p-1 hover:bg-canvas rounded-full text-secondary">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Full-scale image preview — object-contain to avoid cropping */}
                <div className="w-full h-48 bg-canvas rounded-2xl border border-border-main/20 relative shadow-inner flex items-center justify-center overflow-hidden">
                  {activeSelectedItem.imageUrl ? (
                    <img 
                      src={activeSelectedItem.imageUrl} 
                      alt={activeSelectedItem.name} 
                      className="w-full h-full object-contain p-2" 
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-secondary/40 gap-1">
                      <ImageIcon className="w-8 h-8" />
                      <span className="text-[10px] font-medium">No Image Uploaded</span>
                    </div>
                  )}
                </div>

                <div className="space-y-3.5">
                  <div>
                    <h3 className="text-sm font-bold text-primary leading-snug">{activeSelectedItem.name}</h3>
                    <p className="text-xs text-secondary mt-1 leading-relaxed">{activeSelectedItem.description || 'No description added yet.'}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 bg-canvas/30 rounded-xl border border-border-main/20">
                      <span className="text-[8px] text-secondary font-bold uppercase block mb-1">Condition</span>
                      <span className="font-bold text-primary">{activeSelectedItem.condition}</span>
                    </div>
                    <div className="p-2.5 bg-canvas/30 rounded-xl border border-border-main/20">
                      <span className="text-[8px] text-secondary font-bold uppercase block mb-1">Classification</span>
                      <span className="font-bold text-brand">{activeSelectedItem.isSpare ? 'Spare Asset' : 'Standard Item'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="pt-3 border-t border-border-main/20 flex items-center justify-between">
                <div className="flex items-center gap-1 bg-canvas p-1 rounded-full border border-border-main/30">
                  <button
                    onClick={() => handleQuantityAdjust(activeSelectedItem.id, 'dec')}
                    className="w-7 h-7 rounded-full bg-card hover:bg-canvas flex items-center justify-center shadow-sm"
                  >
                    <Minus className="w-3 h-3 text-secondary" />
                  </button>
                  <span className="w-8 text-center text-xs font-bold text-primary tabular-nums">
                    {activeSelectedItem.quantity}
                  </span>
                  <button
                    onClick={() => handleQuantityAdjust(activeSelectedItem.id, 'inc')}
                    className="w-7 h-7 rounded-full bg-brand/10 hover:bg-brand/20 flex items-center justify-center shadow-sm animate-pulse"
                  >
                    <Plus className="w-3 h-3 text-brand" />
                  </button>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      handleDeleteItem(activeSelectedItem.id);
                      setSelectedItemId(null);
                    }}
                    className="h-8.5 px-3 rounded-full bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 text-xs font-bold transition-all shadow-sm cursor-pointer"
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => setSelectedItemId(null)}
                    className="h-8.5 px-4 rounded-full bg-primary text-white text-xs font-bold shadow-sm"
                  >
                    Done
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Storage Modal Form */}
      <AnimatePresence>
        {isAddStorageOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              className="absolute inset-0 bg-black/40 backdrop-blur-xs"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddStorageOpen(false)}
            />
            <motion.div 
              className="relative w-full max-w-md bg-card rounded-3xl border border-border-main/40 p-6 shadow-2xl z-10 space-y-4"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
            >
              <div className="flex items-center justify-between pb-2 border-b border-border-main/20">
                <h3 className="text-sm font-bold text-primary">Add New Storage Container</h3>
                <button onClick={() => setIsAddStorageOpen(false)} className="p-1 hover:bg-canvas rounded-full text-secondary">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAddStorageSubmit} className="space-y-3.5 text-xs font-sans">
                <div className="space-y-1">
                  <label className="font-bold text-secondary">Storage Title</label>
                  <input
                    type="text"
                    required
                    value={newStorageName}
                    onChange={(e) => setNewStorageName(e.target.value)}
                    placeholder="e.g. Oak Wardrobe Cabinet..."
                    className="w-full h-9 px-3 bg-canvas/30 rounded-xl border border-border-main/40 focus:outline-none focus:bg-white focus:border-brand"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-secondary">Type of Storage</label>
                  <select
                    value={newStorageType}
                    onChange={(e) => setNewStorageType(e.target.value)}
                    className="w-full h-9 px-3 bg-canvas/30 rounded-xl border border-border-main/40 focus:outline-none focus:bg-white"
                  >
                    <option value="Closet">Closet / Wardrobe</option>
                    <option value="Drawer Set">Drawer Set</option>
                    <option value="Open Shelf">Open Shelf</option>
                    <option value="Heavy Bin">Heavy Bin / Trunk</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-secondary">Compartments</label>
                    <input
                      type="number"
                      required
                      min={1}
                      max={12}
                      value={newStorageComp}
                      onChange={(e) => setNewStorageComp(parseInt(e.target.value) || 1)}
                      className="w-full h-9 px-3 bg-canvas/30 rounded-xl border border-border-main/40 focus:outline-none focus:bg-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-secondary">Cabinet Picture</label>
                    <div className="relative h-9">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageChange(e, setNewStorageImage)}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                      />
                      <div className="absolute inset-0 bg-canvas/30 rounded-xl border border-border-main/40 flex items-center justify-center gap-1.5 hover:bg-canvas/50">
                        <ImageIcon className="w-3.5 h-3.5 text-secondary" />
                        <span className="text-[10px] text-secondary font-medium">
                          {newStorageImage ? 'Selected ✅' : 'Choose File'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-border-main/20 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddStorageOpen(false)}
                    className="h-8.5 px-4 rounded-full bg-canvas text-secondary font-bold hover:bg-canvas/80"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="h-8.5 px-4 rounded-full bg-brand text-brand-foreground font-bold hover:brightness-95 shadow-sm"
                  >
                    Create Storage
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Item Modal Form */}
      <AnimatePresence>
        {isAddItemOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              className="absolute inset-0 bg-black/40 backdrop-blur-xs"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddItemOpen(false)}
            />
            <motion.div 
              className="relative w-full max-w-md bg-card rounded-3xl border border-border-main/40 p-6 shadow-2xl z-10 space-y-4"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
            >
              <div className="flex items-center justify-between pb-2 border-b border-border-main/20">
                <h3 className="text-sm font-bold text-primary">Add New Item Asset</h3>
                <button onClick={() => setIsAddItemOpen(false)} className="p-1 hover:bg-canvas rounded-full text-secondary">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAddItemSubmit} className="space-y-3.5 text-xs font-sans">
                <div className="space-y-1">
                  <label className="font-bold text-secondary">Item Title / Name</label>
                  <input
                    type="text"
                    required
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    placeholder="e.g. Leather Jacket..."
                    className="w-full h-9 px-3 bg-canvas/30 rounded-xl border border-border-main/40 focus:outline-none focus:bg-white focus:border-brand font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-secondary">Description / Details</label>
                  <input
                    type="text"
                    value={newItemDesc}
                    onChange={(e) => setNewItemDesc(e.target.value)}
                    placeholder="Brief details about placement..."
                    className="w-full h-9 px-3 bg-canvas/30 rounded-xl border border-border-main/40 focus:outline-none focus:bg-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-secondary">Initial Quantity</label>
                    <div className="flex items-center gap-1.5 bg-canvas/30 p-1 rounded-xl border border-border-main/40">
                      <button
                        type="button"
                        onClick={() => setNewItemQty(q => Math.max(1, q - 1))}
                        className="w-7 h-7 rounded-lg bg-card flex items-center justify-center border border-border-main/15 shadow-sm cursor-pointer"
                      >
                        <Minus className="w-3 h-3 text-secondary" />
                      </button>
                      <span className="flex-1 text-center font-bold text-primary">{newItemQty}</span>
                      <button
                        type="button"
                        onClick={() => setNewItemQty(q => q + 1)}
                        className="w-7 h-7 rounded-lg bg-brand/10 flex items-center justify-center border border-brand/20 shadow-sm cursor-pointer"
                      >
                        <Plus className="w-3 h-3 text-brand" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-secondary">Condition Rating</label>
                    <select
                      value={newItemCond}
                      onChange={(e) => setNewItemCond(e.target.value as any)}
                      className="w-full h-9 px-3 bg-canvas/30 rounded-xl border border-border-main/40 focus:outline-none focus:bg-white"
                    >
                      <option value="Mint">Mint / New</option>
                      <option value="Good">Good / Used</option>
                      <option value="Worn">Worn / Mending</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 items-center">
                  <div className="space-y-1">
                    <label className="font-bold text-secondary">Item Image</label>
                    <div className="relative h-9">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageChange(e, setNewItemImage)}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                      />
                      <div className="absolute inset-0 bg-canvas/30 rounded-xl border border-border-main/40 flex items-center justify-center gap-1.5 hover:bg-canvas/50">
                        <ImageIcon className="w-3.5 h-3.5 text-secondary" />
                        <span className="text-[10px] text-secondary font-medium">
                          {newItemImage ? 'Selected ✅' : 'Choose File'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-4 pl-1">
                    <input
                      type="checkbox"
                      id="newItemSpare"
                      checked={newItemSpare}
                      onChange={(e) => setNewItemSpare(e.target.checked)}
                      className="w-4 h-4 text-brand bg-canvas border-border-main/40 rounded focus:ring-brand"
                    />
                    <label htmlFor="newItemSpare" className="font-bold text-secondary select-none cursor-pointer">
                      Flag as Spare
                    </label>
                  </div>
                </div>

                <div className="pt-3 border-t border-border-main/20 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddItemOpen(false)}
                    className="h-8.5 px-4 rounded-full bg-canvas text-secondary font-bold hover:bg-canvas/80"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="h-8.5 px-4 rounded-full bg-brand text-brand-foreground font-bold hover:brightness-95 shadow-sm"
                  >
                    Create Asset
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
