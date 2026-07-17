'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import CoverflowCarousel, { type CarouselItem } from '@/components/carousel/coverflow-carousel';
import { 
  Space, 
  StorageUnit, 
  IndividualItem, 
  ItemCondition, 
  StorageType,
  CLOTHING_CATEGORIES,
  ClothingCategory,
  buildStorageTree,
  getDescendantIds,
  buildChildStorageUnits,
  computeStorageStatus,
} from '@/data/types';
import { 
  Package, Archive, AlertTriangle, ChevronRight, 
  Plus, Minus, Tag, Image as ImageIcon, X, Sliders, Info, Trash2, Edit3, ChevronLeft
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import AnimatedList from '@/components/dashboard/animated-list';

// Import newly extracted modal components
import AddAssetModal from '@/components/modals/add-asset-modal';
import AddStorageModal from '@/components/modals/add-storage-modal';
import ItemDetailModal from '@/components/modals/item-detail-modal';
import EditStorageModal from '@/components/modals/edit-storage-modal';
import PillFilterNav from '@/components/pill-filter-nav';
import type { ViewId } from '@/hooks/use-navigation';

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
  onNavigateToSpace?: (spaceId: ViewId) => void;
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
  onNavigateToSpace,
}: DashboardViewProps) {
  const [selectedStorageId, setSelectedStorageId] = useState<string | null>(null);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>('All');
  const [activeSubFilter, setActiveSubFilter] = useState<string>('All');

  // Animated greetings
  const [randomGreetingTag, setRandomGreetingTag] = useState('');

  // Modals state
  const [isAddStorageOpen, setIsAddStorageOpen] = useState(false);
  const [isEditStorageOpen, setIsEditStorageOpen] = useState(false);
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [isEditSpaceOpen, setIsEditSpaceOpen] = useState(false);

  // Form states: Edit/Customize Space
  const [editSpaceName, setEditSpaceName] = useState('');
  const [editSpaceDesc, setEditSpaceDesc] = useState('');
  const [editSpaceDim, setEditSpaceDim] = useState('');
  const [editSpaceImage, setEditSpaceImage] = useState<string | null>(null);



  useEffect(() => {
    const idx = Math.floor(Math.random() * greetingTags.length);
    setRandomGreetingTag(greetingTags[idx]);
  }, []);
  const handleFilterChange = (filter: string) => {
    setActiveFilter(filter);
    setActiveSubFilter('All');
  };

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
      meta: `${storageUnitsList.filter((u) => u.spaceId === s.id && u.parentId === null).length} Storages`,
    })),
  ];

  const len = carouselItems.length;
  const currentNormalized = ((activeCarouselIndex % len) + len) % len;
  const activeSlide = carouselItems[currentNormalized];
  const isOverall = activeSlide.id === 'dashboard';
  const activeSpaceId = isOverall ? null : activeSlide.id;
  const activeSelectedSpace = spaces.find(s => s.id === activeSpaceId);

  const lastActiveSpaceIdRef = useRef<string | null>(null);

  // Reset selectedStorageId when space changes
  useEffect(() => {
    // Only reset if it is not the initial mount and spaceId actually changed
    if (lastActiveSpaceIdRef.current !== null && lastActiveSpaceIdRef.current !== activeSpaceId) {
      setSelectedStorageId(null);
      setSelectedItemId(null);
      setActiveFilter('All');
    }
    lastActiveSpaceIdRef.current = activeSpaceId;
  }, [activeSpaceId]);

  // Load and save active selectedStorageId to localStorage safely on client
  useEffect(() => {
    const savedStorageId = localStorage.getItem('moonferret-selected-storage-id');
    if (savedStorageId && storageUnitsList.some(su => su.id === savedStorageId && (!activeSpaceId || su.spaceId === activeSpaceId))) {
      setSelectedStorageId(savedStorageId);
    }
  }, [storageUnitsList, activeSpaceId]);

  useEffect(() => {
    if (selectedStorageId) {
      localStorage.setItem('moonferret-selected-storage-id', selectedStorageId);
    } else {
      localStorage.removeItem('moonferret-selected-storage-id');
    }
  }, [selectedStorageId]);

  // Compute breadcrumbs path for hierarchical storages
  const storagePath = useMemo(() => {
    const path: StorageUnit[] = [];
    let currentId = selectedStorageId;
    while (currentId) {
      const unit = storageUnitsList.find(u => u.id === currentId);
      if (unit) {
        path.unshift(unit);
        currentId = unit.parentId;
      } else {
        break;
      }
    }
    return path;
  }, [storageUnitsList, selectedStorageId]);

  // Filter storages to render in grid based on space and current depth
  const activeStorages = useMemo(() => {
    // 1. Filter by space
    let list = activeSpaceId
      ? storageUnitsList.filter((unit) => unit.spaceId === activeSpaceId)
      : storageUnitsList;

    // 2. Filter by parent ID (depth)
    if (!isOverall) {
      list = list.filter(unit => unit.parentId === selectedStorageId);
    } else {
      // On global dashboard show only top-level units
      list = list.filter(unit => unit.parentId === null);
    }

    // 3. Search query filter
    return list.filter(unit => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      
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
  }, [storageUnitsList, activeSpaceId, selectedStorageId, searchQuery, individualItemsList, isOverall]);

  // Fallback for drill-down catalog selection
  const activeSelectedStorage = useMemo(() => {
    return storageUnitsList.find(su => su.id === selectedStorageId) || null;
  }, [storageUnitsList, selectedStorageId]);

  // Get flat list of items in the selected storage
  const itemsInStorage = useMemo(() => {
    if (!selectedStorageId) return [];
    return individualItemsList.filter(item => item.containerId === selectedStorageId);
  }, [individualItemsList, selectedStorageId]);

  // Extract dynamic categories from items in active storage
  const dynamicCategories = useMemo(() => {
    if (!selectedStorageId) return [];
    const cats = new Set<string>();
    itemsInStorage.forEach(item => {
      if (item.category) {
        cats.add(item.category);
      } else {
        cats.add('Accessory');
      }
    });
    return Array.from(cats);
  }, [itemsInStorage]);

  // Filter individual items stored inside the active target storage unit and search query + category filters
  const activeItems = useMemo(() => {
    if (!selectedStorageId) return [];

    return itemsInStorage.filter(item => {
      // Search Query filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch = item.name.toLowerCase().includes(query) || 
          (item.description || '').toLowerCase().includes(query) ||
          item.condition.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }

      // Category filter
      if (activeFilter === 'All') return true;

      const itemCat = item.category || 'Accessory';
      if (itemCat !== activeFilter) return false;

      // Sub-category filter for clothes
      if (activeFilter === 'Clothing' && activeSubFilter !== 'All') {
        return item.subCategory === activeSubFilter;
      }

      return true;
    });
  }, [itemsInStorage, searchQuery, activeFilter, activeSubFilter]);

  // Compute category count mapping for filter badges
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { All: itemsInStorage.length };
    dynamicCategories.forEach(cat => {
      counts[cat] = 0;
    });
    itemsInStorage.forEach(item => {
      const cat = item.category || 'Accessory';
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return counts;
  }, [itemsInStorage, dynamicCategories]);

  // Compute clothing type subcategory counts
  const subCategoryCounts = useMemo(() => {
    const counts: Record<string, number> = { All: categoryCounts['Clothing'] || 0 };
    CLOTHING_CATEGORIES.forEach(sc => {
      counts[sc] = 0;
    });
    itemsInStorage.forEach(item => {
      if (item.category === 'Clothing' && item.subCategory) {
        counts[item.subCategory] = (counts[item.subCategory] || 0) + 1;
      }
    });
    return counts;
  }, [itemsInStorage, categoryCounts]);

  // Scoped metrics summary
  const activeSpaceContainers = useMemo(() => {
    if (!activeSpaceId) return individualItemsList;
    return individualItemsList.filter((item) => {
      const parentStorage = storageUnitsList.find(su => su.id === item.containerId);
      return parentStorage && parentStorage.spaceId === activeSpaceId;
    });
  }, [individualItemsList, storageUnitsList, activeSpaceId]);

  const totalItemsCount = useMemo(() => {
    return activeSpaceContainers.reduce((sum, item) => sum + item.quantity, 0);
  }, [activeSpaceContainers]);

  const totalStorageCount = useMemo(() => {
    return activeSpaceId 
      ? storageUnitsList.filter(su => su.spaceId === activeSpaceId).length
      : storageUnitsList.length;
  }, [storageUnitsList, activeSpaceId]);

  const lowStockCount = useMemo(() => {
    return activeSpaceContainers.filter(item => item.quantity > 0 && item.quantity <= 3).length;
  }, [activeSpaceContainers]);

  const sparesCount = useMemo(() => {
    return activeSpaceContainers.filter(item => item.isSpare).length;
  }, [activeSpaceContainers]);

  const activeSelectedItem = useMemo(() => {
    return individualItemsList.find(i => i.id === selectedItemId) || null;
  }, [individualItemsList, selectedItemId]);

  // Space Customization Modal triggers
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

  // CRUD: Add Storage Unit (+ auto-generated child containers/compartments)
  const handleAddStorageSubmit = async (storageData: {
    name: string;
    type: string;
    parentId: string | null;
    compartments: number;
    capacity: number;
    imageUrl: string | null;
    spaceId?: string;
  }) => {
    const targetSpaceId = storageData.spaceId || activeSpaceId;
    if (!targetSpaceId) {
      alert('Please create or select a space first.');
      return;
    }

    const matchedSpace = spaces.find(s => s.id === targetSpaceId);
    const parentId = `su-${Date.now()}`;
    const newStorage: StorageUnit = {
      id: parentId,
      name: storageData.name,
      spaceId: targetSpaceId,
      spaceName: matchedSpace?.name || 'Custom Space',
      parentId: storageData.parentId,
      totalItems: 0,
      capacity: storageData.capacity,
      status: 'empty',
      imageUrl: storageData.imageUrl || undefined,
      compartments: storageData.compartments,
      type: storageData.type as StorageType,
    };

    const childDrafts = buildChildStorageUnits(
      newStorage,
      newStorage.type as StorageType,
      storageData.parentId,
      storageData.compartments
    );

    const childUnits: StorageUnit[] = childDrafts.map((draft, i) => ({
      ...draft,
      id: `${parentId}-c${i + 1}`,
    }));

    const allUnits = [newStorage, ...childUnits];
    setStorageUnitsList(prev => [...prev, ...allUnits]);

    if (userId) {
      try {
        const { error } = await supabase.from('storages').insert(
          allUnits.map((unit) => ({
            id: unit.id,
            name: unit.name,
            space_id: unit.spaceId,
            space_name: unit.spaceName,
            parent_id: unit.parentId,
            total_items: unit.totalItems,
            capacity: unit.capacity,
            status: unit.status,
            image_url: unit.imageUrl || null,
            compartments: unit.compartments ?? null,
            type: unit.type,
            user_id: userId,
          }))
        );
        if (error) throw error;
      } catch (err) {
        console.error('Supabase insert storage fail:', err);
      }
    }
  };

  // CRUD: Delete Storage Unit (deletes recursive tree children)
  const handleDeleteStorage = async (id: string) => {
    const idsToDelete = [id, ...getDescendantIds(id, storageUnitsList)];
    
    // Filter storage list and items list locally
    setStorageUnitsList(prev => prev.filter(u => !idsToDelete.includes(u.id)));
    setIndividualItemsList(prev => prev.filter(item => !idsToDelete.includes(item.containerId)));

    if (userId) {
      try {
        await supabase.from('storages').delete().in('id', idsToDelete).eq('user_id', userId);
        await supabase.from('items').delete().in('container_id', idsToDelete).eq('user_id', userId);
      } catch (err) {
        console.error('Supabase delete storage fail:', err);
      }
    }

    if (selectedStorageId && idsToDelete.includes(selectedStorageId)) {
      setSelectedStorageId(null);
      setSelectedItemId(null);
    }
  };

  // CRUD: Edit Storage Unit details
  const handleEditStorageSubmit = async (
    id: string,
    updatedFields: {
      name: string;
      type: StorageType;
      capacity: number;
      imageUrl: string | null;
    }
  ) => {
    setStorageUnitsList(prev => prev.map(unit => {
      if (unit.id === id) {
        return {
          ...unit,
          name: updatedFields.name,
          type: updatedFields.type,
          capacity: updatedFields.capacity,
          imageUrl: updatedFields.imageUrl || undefined,
        };
      }
      return unit;
    }));

    if (userId) {
      try {
        const { error } = await supabase.from('storages').update({
          name: updatedFields.name,
          type: updatedFields.type,
          capacity: updatedFields.capacity,
          image_url: updatedFields.imageUrl
        }).eq('id', id).eq('user_id', userId);
        if (error) throw error;
      } catch (err) {
        console.error('Supabase edit storage fail:', err);
      }
    }
  };

  // CRUD: Add Individual Item
  const handleAddItemSubmit = async (itemData: Omit<IndividualItem, 'id'>) => {
    const newItem: IndividualItem = {
      id: `ii-${Date.now()}`,
      ...itemData
    };

    setIndividualItemsList(prev => [...prev, newItem]);
    
    // Update container totalItems count in storage state
    setStorageUnitsList(prev => prev.map(unit => {
      if (unit.id === newItem.containerId) {
        const nextTotal = unit.totalItems + newItem.quantity;
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
        const { error: itemError } = await supabase.from('items').insert({
          id: newItem.id,
          container_id: newItem.containerId,
          name: newItem.name,
          description: newItem.description,
          image_url: newItem.imageUrl || null,
          quantity: newItem.quantity,
          condition: newItem.condition,
          is_spare: newItem.isSpare,
          item_type: newItem.itemType,
          category: newItem.category || null,
          sub_category: newItem.subCategory || null,
          size: newItem.size || null,
          color: newItem.color || null,
          material: newItem.material || null,
          brand: newItem.brand || null,
          user_id: userId
        });
        if (itemError) throw itemError;

        const parentStorage = storageUnitsList.find(su => su.id === newItem.containerId);
        if (parentStorage) {
          const nextTotal = parentStorage.totalItems + newItem.quantity;
          const { error: updateError } = await supabase.from('storages').update({
            total_items: nextTotal,
            status: nextTotal >= parentStorage.capacity ? 'full' : nextTotal > 0 ? 'has-spares' : 'empty'
          }).eq('id', newItem.containerId).eq('user_id', userId);
          if (updateError) throw updateError;
        }
      } catch (err) {
        console.error('Supabase insert item fail:', err);
      }
    }
  };

  // CRUD: Delete Individual Item
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
        const parentStorage = storageUnitsList.find(su => su.id === itemToDelete.containerId);
        if (parentStorage) {
          const nextTotal = Math.max(0, parentStorage.totalItems - itemToDelete.quantity);
          await supabase.from('storages').update({
            total_items: nextTotal,
            status: nextTotal >= parentStorage.capacity ? 'full' : nextTotal > 0 ? 'has-spares' : 'empty'
          }).eq('id', itemToDelete.containerId).eq('user_id', userId);
        }
      } catch (err) {
        console.error('Supabase delete item fail:', err);
      }
    }
  };

  // CRUD: Quantity Stepper Adjuster
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
    
    // Update parent storage locally
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
        await supabase.from('items').update({ quantity: nextQty }).eq('id', itemId).eq('user_id', userId);

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

  // CRUD: Update Item details
  const handleUpdateItem = async (itemId: string, updatedFields: Partial<IndividualItem>) => {
    const item = individualItemsList.find(i => i.id === itemId);
    if (!item) return;

    // Calculate quantity change for storage counts
    const quantityDiff = (updatedFields.quantity ?? item.quantity) - item.quantity;

    // Update item locally
    setIndividualItemsList(prev => prev.map(i => {
      if (i.id === itemId) {
        return { ...i, ...updatedFields };
      }
      return i;
    }));

    // Update local storage unit item count if quantity changed
    if (quantityDiff !== 0) {
      setStorageUnitsList(prev => prev.map(unit => {
        if (unit.id === item.containerId) {
          const nextTotal = Math.max(0, unit.totalItems + quantityDiff);
          return {
            ...unit,
            totalItems: nextTotal,
            status: nextTotal >= unit.capacity ? 'full' : nextTotal > 0 ? 'has-spares' : 'empty'
          };
        }
        return unit;
      }));
    }

    if (userId) {
      try {
        const { error: updateError } = await supabase.from('items').update({
          name: updatedFields.name,
          description: updatedFields.description,
          image_url: updatedFields.imageUrl,
          quantity: updatedFields.quantity,
          condition: updatedFields.condition,
          is_spare: updatedFields.isSpare,
          item_type: updatedFields.itemType,
          category: updatedFields.category,
          sub_category: updatedFields.subCategory,
          size: updatedFields.size,
          color: updatedFields.color,
          material: updatedFields.material,
          brand: updatedFields.brand,
        }).eq('id', itemId).eq('user_id', userId);
        if (updateError) throw updateError;

        if (quantityDiff !== 0) {
          const parentStorage = storageUnitsList.find(su => su.id === item.containerId);
          if (parentStorage) {
            const nextTotal = Math.max(0, parentStorage.totalItems + quantityDiff);
            await supabase.from('storages').update({
              total_items: nextTotal,
              status: nextTotal >= parentStorage.capacity ? 'full' : nextTotal > 0 ? 'has-spares' : 'empty'
            }).eq('id', item.containerId).eq('user_id', userId);
          }
        }
      } catch (err) {
        console.error('Supabase update item fail:', err);
      }
    }
  };

  return (
    <div className="space-y-6 min-w-0">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-1">
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
        <div className="flex items-center gap-2 sm:self-start">
          {!isOverall && (
            <button
              onClick={handleOpenCustomize}
              className="h-7 px-3 bg-card hover:bg-canvas border border-border-main/40 text-secondary rounded-full text-[10px] font-bold shadow-xs transition-all flex items-center gap-1 cursor-pointer font-sans"
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

      {/* Coverflow Carousel */}
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
        {/* Storage Catalog Section */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-secondary flex-wrap">
              <Archive className="w-3.5 h-3.5 text-brand flex-shrink-0" />
              <button 
                onClick={() => setSelectedStorageId(null)}
                className="text-xs font-bold uppercase tracking-wider hover:text-primary transition-colors cursor-pointer"
              >
                {isOverall ? 'Global Catalog' : 'Physical Catalog'}
              </button>
              {storagePath.map((node, i) => (
                <div key={node.id} className="flex items-center gap-1.5 text-xs text-secondary font-bold">
                  <ChevronRight className="w-3 h-3 text-stone-400" />
                  <button 
                    onClick={() => {
                      setSelectedStorageId(node.id);
                      setSelectedItemId(null);
                    }}
                    className="hover:text-primary transition-colors cursor-pointer"
                  >
                    {node.name}
                  </button>
                </div>
              ))}
            </div>
            
            {!isOverall && (
              <button
                onClick={() => setIsAddStorageOpen(true)}
                className="h-7 px-3 bg-brand hover:brightness-95 text-brand-foreground rounded-full text-[10px] font-bold shadow-sm transition-all flex items-center gap-1 cursor-pointer font-sans self-start sm:self-auto"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Storage
              </button>
            )}
          </div>

          {/* Catalog grid */}
          <div className={`w-full ${activeStorages.length > 6 ? 'max-h-[520px] overflow-y-auto pr-2' : ''}`}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeStorages.map((unit) => {
                const isSelected = unit.id === selectedStorageId;
                const hasImg = !!unit.imageUrl;

                return (
                  <button
                    key={unit.id}
                    onClick={() => {
                      if (!isOverall) {
                        setSelectedStorageId(unit.id);
                        setSelectedItemId(null);
                      } else {
                        // Quick Link Navigation: go directly to the storage when clicked in Global Catalog
                        if (unit.spaceId && unit.spaceId !== 'unassigned') {
                          localStorage.setItem('moonferret-selected-storage-id', unit.id);
                          onNavigateToSpace?.(unit.spaceId as ViewId);
                        }
                      }
                    }}
                    className={`text-left rounded-2xl border p-4.5 flex flex-col justify-between h-48 shadow-sm transition-all duration-300 hover:scale-[1.01] hover:shadow-md relative overflow-hidden group cursor-pointer ${
                      isSelected && !isOverall
                        ? 'border-brand bg-brand/5 ring-1 ring-brand/30'
                        : 'border-border-main/45 bg-card/65 backdrop-blur-md dark:bg-card/35'
                    }`}
                  >
                    {/* Explicit Delete Button */}
                    {!isOverall && (
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteStorage(unit.id);
                        }}
                        className="absolute top-3 right-3 z-20 p-1.5 bg-card hover:bg-rose-500/10 rounded-full border border-border-main/30 shadow-md text-stone-400 hover:text-rose-500 transition-all duration-200 opacity-0 group-hover:opacity-100 scale-95 group-hover:scale-100 cursor-pointer"
                        title="Delete Storage"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </span>
                    )}

                    {/* Background preview */}
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

              {activeStorages.length === 0 && (
                <div className="col-span-full py-12 text-center text-secondary text-xs">
                  {selectedStorageId 
                    ? 'No child storage units / drawers defined here.' 
                    : 'No storage containers cataloged in this space.'}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Dynamic Drill Down Items list */}
        {!isOverall && activeSelectedStorage && (
          <div className="bg-card border border-border-main/40 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border-main/20">
              <div className="flex items-center gap-2">
                <Sliders className="w-3.5 h-3.5 text-brand" />
                <h4 className="text-xs font-bold text-primary">Stored Items: {activeSelectedStorage.name}</h4>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditStorageOpen(true)}
                  className="h-7 px-3 bg-canvas border border-border-main/20 hover:bg-canvas/80 text-secondary rounded-full text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer font-sans"
                >
                  <Edit3 className="w-3 h-3 text-secondary" />
                  Manage Storage
                </button>
                <button
                  onClick={() => setIsAddItemOpen(true)}
                  className="h-7 px-3 bg-brand/15 hover:bg-brand/25 text-brand rounded-full text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer font-sans"
                >
                  <Plus className="w-3 h-3 text-brand" />
                  Add Item
                </button>
              </div>
            </div>

            {/* Category filter pills */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-start">
                <PillFilterNav 
                  filters={['All', ...dynamicCategories]}
                  activeFilter={activeFilter} 
                  onFilterChange={handleFilterChange} 
                  counts={categoryCounts} 
                />
              </div>

              {activeFilter === 'Clothing' && (
                <div className="flex items-center gap-1.5 justify-start pl-2 animate-fade-in">
                  <span className="text-[10px] font-bold text-secondary uppercase tracking-widest">Type:</span>
                  <PillFilterNav 
                    filters={['All', ...CLOTHING_CATEGORIES]}
                    activeFilter={activeSubFilter} 
                    onFilterChange={setActiveSubFilter} 
                    counts={subCategoryCounts} 
                  />
                </div>
              )}
            </div>

            {/* Items list wrapper */}
            <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1.5">
              <AnimatedList className="space-y-2">
                {activeItems.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setSelectedItemId(item.id)}
                    className={`p-3 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer transition-all duration-300 hover:scale-[1.01] ${
                      selectedItemId === item.id 
                        ? 'border-brand bg-brand/5' 
                        : 'border-border-main/30 bg-card hover:bg-canvas/20'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-canvas overflow-hidden shrink-0 border border-border-main/20 relative">
                        {item.imageUrl ? (
                          <img 
                            src={item.imageUrl} 
                            alt={item.name} 
                            className={
                              item.imageUrl.endsWith('#contain')
                                ? 'max-w-full max-h-full object-contain w-auto h-auto rounded-lg absolute inset-0 m-auto'
                                : 'w-full h-full object-cover'
                            } 
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-brand/10 text-brand font-bold text-xs">
                            {item.name.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-bold text-primary truncate">{item.name}</p>
                          <span className="text-[8px] bg-brand/10 text-brand border border-brand/20 px-1.5 py-0.2 rounded font-extrabold uppercase tracking-wide">
                            {item.itemType === 'clothing' ? `Clothing: ${item.subCategory || 'Tops'}` : (item.category || 'Accessory')}
                          </span>
                        </div>
                        <p className="text-[10px] text-secondary mt-0.5 truncate">{item.description || 'No description added'}</p>
                      </div>
                    </div>

                    {/* Adjusters and badges */}
                    <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-bold uppercase tracking-wider bg-canvas border border-border-main/20 px-2 py-0.5 rounded-full text-secondary">
                          {item.condition}
                        </span>
                        {item.isSpare && (
                          <span className="text-[9px] font-bold uppercase tracking-wider bg-brand/10 text-brand border border-brand/25 px-2 py-0.5 rounded-full">
                            Spare
                          </span>
                        )}
                      </div>
                      
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
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteItem(item.id);
                        }}
                        className="p-1 hover:bg-canvas rounded text-secondary/40 hover:text-rose-500 transition-colors cursor-pointer"
                        title="Delete item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </AnimatedList>

              {activeItems.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-xs text-secondary font-medium">No inventory assets matched the active filter keys.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Scoped metrics stats summary */}
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

      {/* Extracted modular modals */}
      <AddStorageModal 
        isOpen={isAddStorageOpen}
        onClose={() => setIsAddStorageOpen(false)}
        onSubmit={handleAddStorageSubmit}
        existingStorages={storageUnitsList}
        activeSpaceId={activeSpaceId}
        defaultParentId={selectedStorageId}
        spaces={spaces}
      />

      <AddAssetModal 
        isOpen={isAddItemOpen}
        onClose={() => setIsAddItemOpen(false)}
        onSubmit={handleAddItemSubmit}
        storageUnits={storageUnitsList}
        activeSpaceId={activeSpaceId}
        defaultContainerId={selectedStorageId}
      />

      <ItemDetailModal 
        item={activeSelectedItem}
        isOpen={!!selectedItemId}
        onClose={() => setSelectedItemId(null)}
        onDelete={handleDeleteItem}
        onQuantityAdjust={handleQuantityAdjust}
        onSave={handleUpdateItem}
      />

      <EditStorageModal
        isOpen={isEditStorageOpen}
        onClose={() => setIsEditStorageOpen(false)}
        storage={activeSelectedStorage}
        onSave={handleEditStorageSubmit}
        onDelete={handleDeleteStorage}
      />

      {/* Edit space modal */}
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
                <h3 className="text-sm font-bold text-primary">Customize Space</h3>
                <button onClick={() => setIsEditSpaceOpen(false)} className="p-1 hover:bg-canvas rounded-full text-secondary">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveCustomizeSubmit} className="space-y-3.5 text-xs font-sans">
                <div className="space-y-1.5">
                  <label className="font-bold text-secondary">Space Name</label>
                  <input 
                    type="text" 
                    required
                    value={editSpaceName} 
                    onChange={(e) => setEditSpaceName(e.target.value)}
                    className="w-full h-9 px-3 bg-canvas/30 rounded-xl border border-border-main/40 focus:outline-none focus:bg-white focus:border-brand font-medium text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-secondary">Description</label>
                  <input 
                    type="text" 
                    required
                    value={editSpaceDesc} 
                    onChange={(e) => setEditSpaceDesc(e.target.value)}
                    className="w-full h-9 px-3 bg-canvas/30 rounded-xl border border-border-main/40 focus:outline-none focus:bg-white focus:border-brand font-medium text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-secondary">Dimensions (Size)</label>
                  <input 
                    type="text" 
                    placeholder="e.g. 12x15 ft or 180 sq ft"
                    value={editSpaceDim} 
                    onChange={(e) => setEditSpaceDim(e.target.value)}
                    className="w-full h-9 px-3 bg-canvas/30 rounded-xl border border-border-main/40 focus:outline-none focus:bg-white focus:border-brand font-medium text-sm"
                  />
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
    </div>
  );
}
