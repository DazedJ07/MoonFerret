'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Trash2, Shield, Plus, Minus, Tag, Edit3, Save, Image as ImageIcon } from 'lucide-react';
import { IndividualItem, ItemCondition, ClothingCategory, CLOTHING_CATEGORIES, ITEM_CONDITIONS } from '@/data/types';
import CustomSelect from '@/components/ui/custom-select';
import { uploadImageToStorage } from '@/lib/supabase';

interface ItemDetailModalProps {
  item: IndividualItem | null;
  isOpen: boolean;
  onClose: () => void;
  onDelete: (itemId: string) => void;
  onQuantityAdjust: (itemId: string, direction: 'inc' | 'dec') => void;
  onSave?: (itemId: string, updatedFields: Partial<IndividualItem>) => Promise<void>;
}

export default function ItemDetailModal({
  item,
  isOpen,
  onClose,
  onDelete,
  onQuantityAdjust,
  onSave,
}: ItemDetailModalProps) {
  if (!item) return null;

  const [isEditing, setIsEditing] = useState(false);
  
  // Edit form states
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Clothing');
  const [clothingType, setClothingType] = useState<ClothingCategory>('Tops');
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [customCategory, setCustomCategory] = useState('');
  const [subCategory, setSubCategory] = useState('');
  const [size, setSize] = useState('');
  const [color, setColor] = useState('');
  const [material, setMaterial] = useState('');
  const [brand, setBrand] = useState('');
  const [condition, setCondition] = useState<ItemCondition>('Good');
  const [isSpare, setIsSpare] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Sync edit form states when item changes or edit mode toggles
  useEffect(() => {
    if (item && isEditing) {
      setName(item.name);
      setDescription(item.description || '');
      setCondition(item.condition);
      setIsSpare(item.isSpare);
      setQuantity(item.quantity);
      setImageUrl(item.imageUrl || null);
      
      const isItemClothing = item.itemType === 'clothing' || item.category === 'Clothing';
      if (isItemClothing) {
        setSelectedCategory('Clothing');
        setIsCustomCategory(false);
        setClothingType((item.subCategory as ClothingCategory) || 'Tops');
        setSubCategory('');
      } else {
        const presets = ['Item', 'Accessory', 'Skin Care', 'Make Up', 'Tools'];
        if (item.category && presets.includes(item.category)) {
          setSelectedCategory(item.category);
          setIsCustomCategory(false);
        } else if (item.category) {
          setSelectedCategory('Item');
          setIsCustomCategory(true);
          setCustomCategory(item.category);
        } else {
          setSelectedCategory('Accessory');
          setIsCustomCategory(false);
        }
        setSubCategory(item.subCategory || '');
      }
      
      setSize(item.size || '');
      setColor(item.color || '');
      setMaterial(item.material || '');
      setBrand(item.brand || '');
    }
  }, [item, isEditing]);

  // Reset isEditing when modal closes
  useEffect(() => {
    if (!isOpen) {
      setIsEditing(false);
    }
  }, [isOpen]);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploading(true);
      try {
        const url = await uploadImageToStorage(file, 'items');
        if (url) {
          setImageUrl(url);
        }
      } catch (err) {
        console.error('Failed to upload image:', err);
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const updatedItemType: 'clothing' | 'item-accessory' = (!isCustomCategory && selectedCategory === 'Clothing') ? 'clothing' : 'item-accessory';
    const updatedCategory = isCustomCategory
      ? customCategory.trim()
      : (selectedCategory === 'Clothing' ? 'Clothing' : selectedCategory);
    const updatedSubCategory = (!isCustomCategory && selectedCategory === 'Clothing')
      ? clothingType
      : (subCategory.trim() || null);

    const updatedFields: Partial<IndividualItem> = {
      name: name.trim(),
      description: description.trim(),
      imageUrl: imageUrl || undefined,
      quantity,
      condition,
      isSpare,
      itemType: updatedItemType,
      category: updatedCategory || undefined,
      subCategory: updatedSubCategory || undefined,
      size: size.trim() || undefined,
      color: color.trim() || undefined,
      material: material.trim() || undefined,
      brand: brand.trim() || undefined,
    };

    if (onSave) {
      await onSave(item.id, updatedFields);
    }
    setIsEditing(false);
  };

  const getConditionColor = (cond: string) => {
    switch (cond) {
      case 'Mint':
        return 'bg-emerald-100 text-emerald-700 border-emerald-250';
      case 'Good':
        return 'bg-sky-100 text-sky-700 border-sky-200';
      case 'Worn':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      default:
        return 'bg-stone-100 text-stone-700 border-stone-200';
    }
  };

  const initial = item.name.charAt(0).toUpperCase();

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />

          {/* Modal Panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="relative max-w-sm w-full bg-card rounded-2xl overflow-hidden shadow-2xl z-10 border border-border-main/20 flex flex-col font-sans max-h-[90vh]"
          >
            {/* Close Button overlay */}
            <button
              onClick={onClose}
              className="absolute top-3 right-3 z-20 p-1.5 bg-black/30 hover:bg-black/50 rounded-full text-white backdrop-blur-sm transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>

            {isEditing ? (
              <form onSubmit={handleSaveEdit} className="p-5 overflow-y-auto space-y-4 text-xs flex-1">
                {/* Header inside form */}
                <div className="flex items-center justify-between pb-2 border-b border-border-main/10">
                  <h4 className="text-sm font-bold text-primary flex items-center gap-1.5">
                    <Edit3 className="w-4 h-4 text-brand" />
                    Edit Asset Details
                  </h4>
                </div>

                {/* Photo change */}
                <div className="space-y-1.5">
                  <label className="font-bold text-secondary block">Asset Image</label>
                  <div className="flex items-center gap-3">
                    <div className="h-14 w-14 rounded-xl overflow-hidden border border-border-main/20 bg-canvas/30 shrink-0 flex items-center justify-center relative">
                      {imageUrl ? (
                        <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon className="w-5 h-5 text-secondary" />
                      )}
                    </div>
                    <div className="relative h-9 flex-1">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        disabled={isUploading}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                      />
                      <div className="absolute inset-0 bg-canvas/30 rounded-xl border border-border-main/40 flex items-center justify-center gap-1.5 hover:bg-canvas/50">
                        <span className="text-[10px] text-secondary font-medium">
                          {isUploading ? 'Uploading...' : 'Change Photo'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Name */}
                <div className="space-y-1.5">
                  <label className="font-bold text-secondary">Asset Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full h-9 px-3 bg-canvas/30 rounded-xl border border-border-main/45 focus:outline-none focus:bg-white focus:border-brand text-xs font-semibold"
                  />
                </div>

                {/* Category & Sub-Category */}
                <div className="p-3 bg-canvas/15 rounded-xl border border-border-main/15 space-y-3">
                  <div className="grid grid-cols-1 gap-3">
                    {/* Category Selection */}
                    {isCustomCategory ? (
                      <div className="space-y-1.5">
                        <label className="font-bold text-secondary text-[10px] uppercase tracking-wider">Custom Category Name *</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            required
                            placeholder="e.g. Board Games, Books"
                            value={customCategory}
                            onChange={(e) => setCustomCategory(e.target.value)}
                            className="w-full h-9 px-3 bg-card rounded-xl border border-border-main/40 focus:outline-none focus:bg-white focus:border-brand text-xs font-semibold"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setIsCustomCategory(false);
                              setCustomCategory('');
                            }}
                            className="h-9 px-3 bg-canvas border border-border-main/20 hover:bg-canvas/80 text-secondary rounded-xl font-bold flex items-center justify-center transition-colors cursor-pointer shrink-0"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        <div className="flex items-end gap-2">
                          <div className="flex-1">
                            <CustomSelect
                              label="Category *"
                              options={[
                                { value: 'Clothing', label: 'Clothing' },
                                { value: 'Item', label: 'Item' },
                                { value: 'Accessory', label: 'Accessory' },
                                { value: 'Skin Care', label: 'Skin Care' },
                                { value: 'Make Up', label: 'Make Up' },
                                { value: 'Tools', label: 'Tools' },
                              ]}
                              value={selectedCategory}
                              onChange={setSelectedCategory}
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => setIsCustomCategory(true)}
                            className="h-9 px-3 bg-brand/10 border border-brand/20 hover:bg-brand/20 text-brand rounded-xl font-bold flex items-center justify-center transition-colors cursor-pointer shrink-0"
                            title="Add Custom Category"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Sub-Category or Clothing Type */}
                    {!isCustomCategory && selectedCategory === 'Clothing' ? (
                      <CustomSelect
                        label="Clothing Type *"
                        options={CLOTHING_CATEGORIES.map(cat => ({ value: cat, label: cat }))}
                        value={clothingType}
                        onChange={(val) => setClothingType(val as ClothingCategory)}
                      />
                    ) : (
                      <div className="space-y-1.5">
                        <label className="font-bold text-secondary text-[10px] uppercase tracking-wider">Sub-Category</label>
                        <input
                          type="text"
                          placeholder="e.g. Charger, Book, Bottle"
                          value={subCategory}
                          onChange={(e) => setSubCategory(e.target.value)}
                          className="w-full h-9 px-3 bg-card rounded-xl border border-border-main/40 focus:outline-none focus:bg-white focus:border-brand text-xs font-semibold"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <label className="font-bold text-secondary">Description</label>
                  <textarea
                    placeholder="Optional details..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={2}
                    className="w-full p-2.5 bg-canvas/30 rounded-xl border border-border-main/40 focus:outline-none focus:bg-white focus:border-brand text-xs font-semibold resize-none"
                  />
                </div>

                {/* Specs optional */}
                <div className="p-3 bg-canvas/15 rounded-xl border border-border-main/15 space-y-2.5">
                  <span className="font-bold text-secondary text-[10px] uppercase tracking-wider block">
                    Product Specifications (Optional)
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="font-bold text-[10px] text-secondary">Size</label>
                      <input
                        type="text"
                        value={size}
                        onChange={(e) => setSize(e.target.value)}
                        className="w-full h-8 px-2 bg-card rounded-lg border border-border-main/40 text-xs font-medium focus:outline-none focus:border-brand"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-[10px] text-secondary">Color</label>
                      <input
                        type="text"
                        value={color}
                        onChange={(e) => setColor(e.target.value)}
                        className="w-full h-8 px-2 bg-card rounded-lg border border-border-main/40 text-xs font-medium focus:outline-none focus:border-brand"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-[10px] text-secondary">Material</label>
                      <input
                        type="text"
                        value={material}
                        onChange={(e) => setMaterial(e.target.value)}
                        className="w-full h-8 px-2 bg-card rounded-lg border border-border-main/40 text-xs font-medium focus:outline-none focus:border-brand"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-[10px] text-secondary">Brand</label>
                      <input
                        type="text"
                        value={brand}
                        onChange={(e) => setBrand(e.target.value)}
                        className="w-full h-8 px-2 bg-card rounded-lg border border-border-main/40 text-xs font-medium focus:outline-none focus:border-brand"
                      />
                    </div>
                  </div>
                </div>

                {/* Quantity and condition */}
                <div className="grid grid-cols-2 gap-3 items-end">
                  {/* Quantity */}
                  <div className="space-y-1.5">
                    <label className="font-bold text-secondary">Quantity</label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={quantity <= 1}
                        onClick={() => setQuantity(q => Math.max(1, q - 1))}
                        className="w-7 h-7 bg-canvas border border-border-main/20 rounded-lg font-bold flex items-center justify-center hover:bg-canvas/80 disabled:opacity-40"
                      >
                        -
                      </button>
                      <span className="flex-1 text-center font-bold text-xs">{quantity}</span>
                      <button
                        type="button"
                        onClick={() => setQuantity(q => q + 1)}
                        className="w-7 h-7 bg-canvas border border-border-main/20 rounded-lg font-bold flex items-center justify-center hover:bg-canvas/80"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Condition selector */}
                  <CustomSelect
                    label="Condition *"
                    options={ITEM_CONDITIONS.map(c => ({ value: c, label: c }))}
                    value={condition}
                    onChange={(val) => setCondition(val as ItemCondition)}
                  />
                </div>

                {/* Spare toggle and Action Buttons */}
                <div className="flex items-center justify-between pt-2">
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-secondary">
                    <input
                      type="checkbox"
                      checked={isSpare}
                      onChange={(e) => setIsSpare(e.target.checked)}
                      className="rounded border-border-main/40 text-brand focus:ring-brand w-4 h-4 cursor-pointer"
                    />
                    Flag as Spare
                  </label>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="h-9 px-3.5 rounded-xl border border-border-main/30 text-secondary hover:bg-canvas font-bold transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isUploading}
                      className="h-9 px-4 rounded-xl bg-brand text-brand-foreground font-bold hover:brightness-95 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <Save className="w-3.5 h-3.5" />
                      Save
                    </button>
                  </div>
                </div>
              </form>
            ) : (
              <>
                {/* Top Image Section */}
                <div className="relative h-48 bg-canvas/30 flex items-center justify-center border-b border-border-main/10 overflow-hidden p-4 shrink-0">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className={
                        item.imageUrl.endsWith('#contain')
                          ? 'max-w-full max-h-full object-contain w-auto h-auto rounded-lg'
                          : 'w-full h-full object-cover'
                      }
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-tr from-brand/20 to-brand/5 flex items-center justify-center">
                      <span className="text-5xl font-black text-brand/35 select-none">{initial}</span>
                    </div>
                  )}

                  {/* Float Badges */}
                  <div className="absolute bottom-3 left-3 flex gap-1.5">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/90 text-primary border border-border-main/10 shadow-sm">
                      {item.itemType === 'clothing' ? 'Clothing' : 'Item/Accessory'}
                    </span>
                    {item.isSpare && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-100 text-violet-700 border border-violet-200 flex items-center gap-1 shadow-sm">
                        <Shield className="w-2.5 h-2.5" />
                        Spare
                      </span>
                    )}
                  </div>
                </div>

                {/* Info Body */}
                <div className="p-5 space-y-4 flex-1 overflow-y-auto">
                  <div className="space-y-1">
                    <h3 className="text-base font-black text-primary leading-tight">{item.name}</h3>
                    <div className="flex items-center gap-1.5">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${getConditionColor(item.condition)}`}>
                        Condition: {item.condition}
                      </span>
                    </div>
                  </div>

                  {item.description && (
                    <p className="text-xs text-secondary leading-relaxed bg-canvas/30 p-2.5 rounded-xl border border-border-main/10">
                      {item.description}
                    </p>
                  )}

                  {/* Details Grid */}
                  <div className="bg-canvas/20 border border-border-main/10 rounded-xl p-3 space-y-2">
                    <span className="text-[10px] font-extrabold text-secondary tracking-wider uppercase block">
                      Asset Metadata
                    </span>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                      <div className="flex justify-between border-b border-border-main/5 pb-1">
                        <span className="text-secondary font-medium">Category</span>
                        <span className="text-primary font-bold">{item.category || 'Accessory'}</span>
                      </div>
                      {item.subCategory && (
                        <div className="flex justify-between border-b border-border-main/5 pb-1">
                          <span className="text-secondary font-medium">{item.itemType === 'clothing' ? 'Type' : 'Sub-Category'}</span>
                          <span className="text-primary font-bold">{item.subCategory}</span>
                        </div>
                      )}
                      {item.size && (
                        <div className="flex justify-between border-b border-border-main/5 pb-1">
                          <span className="text-secondary font-medium">Size</span>
                          <span className="text-primary font-bold">{item.size}</span>
                        </div>
                      )}
                      {item.color && (
                        <div className="flex justify-between border-b border-border-main/5 pb-1">
                          <span className="text-secondary font-medium">Color</span>
                          <span className="text-primary font-bold">{item.color}</span>
                        </div>
                      )}
                      {item.material && (
                        <div className="flex justify-between border-b border-border-main/5 pb-1 col-span-2">
                          <span className="text-secondary font-medium">Material</span>
                          <span className="text-primary font-bold">{item.material}</span>
                        </div>
                      )}
                      {item.brand && (
                        <div className="flex justify-between border-b border-border-main/5 pb-1 col-span-2">
                          <span className="text-secondary font-medium">Brand</span>
                          <span className="text-primary font-bold">{item.brand}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Inline Quantity Stepper */}
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-xs font-bold text-secondary">Asset Quantity</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onQuantityAdjust(item.id, 'dec')}
                        className="w-7 h-7 rounded-full bg-canvas border border-border-main/20 flex items-center justify-center text-primary hover:bg-canvas/80 cursor-pointer"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-sm font-black min-w-[2rem] text-center">{item.quantity}</span>
                      <button
                        onClick={() => onQuantityAdjust(item.id, 'inc')}
                        className="w-7 h-7 rounded-full bg-canvas border border-border-main/20 flex items-center justify-center text-primary hover:bg-canvas/80 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Bottom Actions Bar */}
                <div className="p-4 border-t border-border-main/10 bg-canvas/30 flex items-center justify-between gap-3 shrink-0">
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        if (confirm('Delete this asset permanently?')) {
                          onDelete(item.id);
                          onClose();
                        }
                      }}
                      className="h-9 px-3 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 font-bold flex items-center gap-1.5 transition-colors text-xs cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete
                    </button>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="h-9 px-3 rounded-xl border border-border-main/30 text-secondary hover:bg-canvas font-bold flex items-center gap-1.5 transition-colors text-xs cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      Edit
                    </button>
                  </div>
                  <button
                    onClick={onClose}
                    className="h-9 px-4 rounded-xl bg-brand text-brand-foreground font-bold hover:brightness-95 transition-all text-xs cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
