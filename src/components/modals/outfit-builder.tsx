'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shirt, X, Image as ImageIcon, Search, Tag, Check, Trash2 } from 'lucide-react';
import { IndividualItem, CategoryFilter, CATEGORY_FILTERS } from '@/data/types';
import { uploadImageToStorage } from '@/lib/supabase';

interface OutfitBuilderProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (outfit: { name: string; itemIds: string[]; imageUrl?: string }) => void;
  allItems: IndividualItem[];
}

export default function OutfitBuilder({
  isOpen,
  onClose,
  onSave,
  allItems,
}: OutfitBuilderProps) {
  const [name, setName] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [activeFilter, setActiveFilter] = useState<CategoryFilter>('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Category filter + search query logic
  const filteredItems = useMemo(() => {
    return allItems.filter((item) => {
      // 1. Search filter
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;

      // 2. Category filter
      if (activeFilter === 'All') return true;
      
      // Items that are item-accessory only display under Accessories in addition to All
      if (item.itemType === 'item-accessory') {
        return activeFilter === 'Accessories';
      }

      return item.category === activeFilter;
    });
  }, [allItems, activeFilter, searchQuery]);

  // Selected items objects
  const selectedItems = useMemo(() => {
    return allItems.filter(item => selectedIds.includes(item.id));
  }, [allItems, selectedIds]);

  const handleToggleItem = (itemId: string) => {
    setSelectedIds(prev => 
      prev.includes(itemId) ? prev.filter(id => id !== itemId) : [...prev, itemId]
    );
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploading(true);
      try {
        const url = await uploadImageToStorage(file, 'outfits');
        if (url) {
          setImageUrl(url);
        }
      } catch (err) {
        console.error('Outfit image upload failed:', err);
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Please enter an outfit name.');
      return;
    }
    if (selectedIds.length === 0) {
      alert('Please select at least one item to build an outfit.');
      return;
    }

    onSave({
      name: name.trim(),
      itemIds: selectedIds,
      imageUrl: imageUrl || undefined,
    });

    handleReset();
  };

  const handleReset = () => {
    setName('');
    setSelectedIds([]);
    setImageUrl(null);
    setActiveFilter('All');
    setSearchQuery('');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleReset}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />

          {/* Modal Panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="relative max-w-3xl w-full bg-card rounded-2xl shadow-2xl z-10 border border-border-main/20 flex flex-col font-sans max-h-[85vh] overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border-main/10">
              <h3 className="text-sm font-bold text-primary flex items-center gap-1.5">
                <Shirt className="w-4 h-4 text-brand" />
                Outfit Builder
              </h3>
              <button
                onClick={handleReset}
                className="p-1 hover:bg-canvas rounded-full text-secondary transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Split Panel Body */}
            <div className="flex flex-col md:flex-row flex-1 overflow-hidden divide-y md:divide-y-0 md:divide-x divide-border-main/10">
              
              {/* LEFT PANEL: Filters & Selectable Items (60%) */}
              <div className="w-full md:w-3/5 p-4 flex flex-col gap-3 overflow-y-auto min-h-0">
                {/* Search */}
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-secondary" />
                  <input
                    type="text"
                    placeholder="Search items to pair..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-9 pl-9 pr-3 bg-canvas/30 rounded-xl border border-border-main/40 focus:outline-none focus:bg-white focus:border-brand text-xs font-medium"
                  />
                </div>

                {/* Inline Category Filters */}
                <div className="flex items-center gap-1 overflow-x-auto pb-1.5 scrollbar-hide flex-shrink-0">
                  {CATEGORY_FILTERS.map((filter) => {
                    const isActive = activeFilter === filter;
                    return (
                      <button
                        key={filter}
                        type="button"
                        onClick={() => setActiveFilter(filter)}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-all whitespace-nowrap flex-shrink-0 cursor-pointer ${
                          isActive
                            ? 'bg-brand/10 text-brand border border-brand/35'
                            : 'bg-canvas text-secondary border border-transparent hover:bg-canvas/80'
                        }`}
                      >
                        {filter}
                      </button>
                    );
                  })}
                </div>

                {/* Selectable Items Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 overflow-y-auto pr-1">
                  {filteredItems.map((item) => {
                    const isSelected = selectedIds.includes(item.id);
                    const initialLetter = item.name.charAt(0).toUpperCase();

                    return (
                      <div
                        key={item.id}
                        onClick={() => handleToggleItem(item.id)}
                        className={`p-2 rounded-xl border cursor-pointer transition-all flex flex-col gap-1.5 relative ${
                          isSelected
                            ? 'border-brand bg-brand/5 ring-1 ring-brand'
                            : 'border-border-main/20 hover:border-brand/40 bg-card'
                        }`}
                      >
                        {/* Selector indicator */}
                        <div className={`absolute top-1.5 right-1.5 w-4 h-4 rounded-full border flex items-center justify-center transition-all ${
                          isSelected
                            ? 'bg-brand border-brand text-white'
                            : 'border-border-main/30 bg-card/70'
                        }`}>
                          {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                        </div>

                        {/* Thumbnail */}
                        <div className="h-20 w-full rounded-lg overflow-hidden bg-canvas border border-border-main/10 flex items-center justify-center relative">
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
                            <span className="text-xl font-bold text-secondary/30">{initialLetter}</span>
                          )}
                        </div>

                        <div className="px-0.5">
                          <span className="text-[10px] font-bold text-primary block truncate max-w-[85%]">
                            {item.name}
                          </span>
                          <span className="text-[8px] font-extrabold text-stone-400 uppercase tracking-wider">
                            {item.itemType === 'clothing' ? item.category : 'Accessory'}
                          </span>
                        </div>
                      </div>
                    );
                  })}

                  {filteredItems.length === 0 && (
                    <div className="col-span-full py-8 text-center text-secondary text-xs">
                      No matching inventory assets found.
                    </div>
                  )}
                </div>
              </div>

              {/* RIGHT PANEL: Form & Selected List Summary (40%) */}
              <form onSubmit={handleSave} className="w-full md:w-2/5 p-4 flex flex-col gap-4 overflow-y-auto min-h-0">
                {/* Name */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-secondary uppercase tracking-wider">Outfit Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Summer Casual Style"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full h-9 px-3 bg-canvas/30 rounded-xl border border-border-main/40 focus:outline-none focus:bg-white focus:border-brand text-sm font-medium"
                  />
                </div>

                {/* Cover Image */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-secondary uppercase tracking-wider block">Outfit Cover Image</label>
                  <div className="relative h-9">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      disabled={isUploading}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                    />
                    <div className="absolute inset-0 bg-canvas/30 rounded-xl border border-border-main/40 flex items-center justify-center gap-1.5 hover:bg-canvas/50">
                      <ImageIcon className="w-3.5 h-3.5 text-secondary" />
                      <span className="text-[10px] text-secondary font-medium">
                        {isUploading ? 'Uploading...' : imageUrl ? 'Uploaded Cover ✅' : 'Choose Cover'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Selected List Summary */}
                <div className="flex-1 flex flex-col min-h-0 gap-1.5">
                  <label className="text-[10px] font-bold text-secondary uppercase tracking-wider flex justify-between">
                    <span>Selected Items</span>
                    <span className="text-brand font-black">{selectedIds.length} Assets</span>
                  </label>

                  <div className="flex-1 border border-border-main/10 rounded-xl overflow-y-auto p-2 bg-canvas/20 divide-y divide-border-main/5 min-h-[150px]">
                    {selectedItems.map((item) => (
                      <div key={item.id} className="py-1.5 flex items-center justify-between text-[11px] gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          {item.imageUrl ? (
                            <img src={item.imageUrl} className="w-6 h-6 object-cover rounded" />
                          ) : (
                            <div className="w-6 h-6 bg-brand/10 rounded flex items-center justify-center text-[10px] text-brand font-bold">
                              {item.name.charAt(0)}
                            </div>
                          )}
                          <span className="font-bold text-primary truncate">{item.name}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleToggleItem(item.id)}
                          className="p-1 hover:bg-red-50 text-red-500 rounded transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}

                    {selectedIds.length === 0 && (
                      <div className="h-full flex items-center justify-center text-center text-stone-400 text-[10px] py-8">
                        Pair items from the catalog.
                      </div>
                    )}
                  </div>
                </div>
              </form>

            </div>

            {/* Bottom Actions */}
            <div className="p-4 border-t border-border-main/10 bg-canvas/30 flex justify-end gap-2">
              <button
                type="button"
                onClick={handleReset}
                className="h-8.5 px-4 rounded-full bg-canvas text-secondary font-bold hover:bg-canvas/80 text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={isUploading || selectedIds.length === 0}
                className="h-8.5 px-4 rounded-full bg-brand text-brand-foreground font-bold hover:brightness-95 shadow-sm disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer text-xs"
              >
                {isUploading ? 'Uploading...' : 'Save Outfit'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
