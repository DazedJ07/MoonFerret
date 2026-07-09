'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, X, Image as ImageIcon, Sparkles, Folder } from 'lucide-react';
import { 
  IndividualItem, 
  StorageUnit, 
  ItemType, 
  ClothingCategory, 
  ItemCondition, 
  CLOTHING_CATEGORIES, 
  ITEM_CONDITIONS,
  buildStorageTree,
  resolveStorageSelectionPath,
} from '@/data/types';
import { uploadImageToStorage } from '@/lib/supabase';

interface AddAssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (item: Omit<IndividualItem, 'id'>) => void;
  storageUnits: StorageUnit[];
  activeSpaceId: string | null;
  defaultContainerId?: string | null;
}

export default function AddAssetModal({
  isOpen,
  onClose,
  onSubmit,
  storageUnits,
  activeSpaceId,
  defaultContainerId,
}: AddAssetModalProps) {
  const [itemType, setItemType] = useState<ItemType>('clothing');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [condition, setCondition] = useState<ItemCondition>('Good');
  const [isSpare, setIsSpare] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Clothing specific states
  const [category, setCategory] = useState<ClothingCategory>('Tops');
  const [subCategory, setSubCategory] = useState('');
  const [size, setSize] = useState('');
  const [color, setColor] = useState('');
  const [material, setMaterial] = useState('');
  const [brand, setBrand] = useState('');

  // Storage selection hierarchy states
  const [selectedParentId, setSelectedParentId] = useState<string>('');
  const [selectedChildId, setSelectedChildId] = useState<string>('');
  const [selectedCompartmentId, setSelectedCompartmentId] = useState<string>('');

  // Get active space storage tree
  const activeSpaceStorages = useMemo(() => {
    const filtered = storageUnits.filter(su => su.spaceId === activeSpaceId);
    return buildStorageTree(filtered);
  }, [storageUnits, activeSpaceId]);

  // Reset dropdowns when space changes or list updates — honour drill-down pre-selection
  useEffect(() => {
    if (!isOpen) return;

    const spaceUnits = storageUnits.filter((su) => su.spaceId === activeSpaceId);
    const resolved = defaultContainerId
      ? resolveStorageSelectionPath(defaultContainerId, spaceUnits)
      : null;

    if (resolved?.parentId) {
      setSelectedParentId(resolved.parentId);
      setSelectedChildId(resolved.childId);
      setSelectedCompartmentId(resolved.compartmentId);
      return;
    }

    if (activeSpaceStorages.length > 0) {
      setSelectedParentId(activeSpaceStorages[0].id);
    } else {
      setSelectedParentId('');
      setSelectedChildId('');
      setSelectedCompartmentId('');
    }
  }, [isOpen, activeSpaceStorages, defaultContainerId, storageUnits, activeSpaceId]);

  // Find selected parent node
  const selectedParentNode = useMemo(() => {
    return activeSpaceStorages.find(node => node.id === selectedParentId) || null;
  }, [activeSpaceStorages, selectedParentId]);

  // Cascade child selection when parent changes (skip when pre-set from defaultContainerId)
  useEffect(() => {
    if (!selectedParentNode?.children?.length) {
      if (selectedChildId) setSelectedChildId('');
      return;
    }

    const childStillValid = selectedParentNode.children.some(
      (node) => node.id === selectedChildId
    );
    if (!childStillValid) {
      setSelectedChildId(selectedParentNode.children[0].id);
    }
  }, [selectedParentNode, selectedChildId]);

  // Find selected child node
  const selectedChildNode = useMemo(() => {
    if (!selectedParentNode?.children?.length) return null;
    return selectedParentNode.children.find(node => node.id === selectedChildId) || null;
  }, [selectedParentNode, selectedChildId]);

  // Cascade compartment selection when child changes
  useEffect(() => {
    if (!selectedChildNode?.children?.length) {
      if (selectedCompartmentId) setSelectedCompartmentId('');
      return;
    }

    const compartmentStillValid = selectedChildNode.children.some(
      (node) => node.id === selectedCompartmentId
    );
    if (!compartmentStillValid) {
      setSelectedCompartmentId(selectedChildNode.children[0].id);
    }
  }, [selectedChildNode, selectedCompartmentId]);

  // The final target storage ID to link the item to
  const targetContainerId = useMemo(() => {
    if (selectedCompartmentId) return selectedCompartmentId;
    if (selectedChildId) return selectedChildId;
    return selectedParentId;
  }, [selectedParentId, selectedChildId, selectedCompartmentId]);

  // File Upload handler
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
        console.error('Image upload failed:', err);
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    if (!targetContainerId) {
      alert('Please select a storage unit.');
      return;
    }

    const baseItem = {
      containerId: targetContainerId,
      name: name.trim(),
      description: description.trim(),
      imageUrl: imageUrl || undefined,
      quantity,
      condition,
      isSpare,
      itemType,
    };

    const finalItem = itemType === 'clothing' ? {
      ...baseItem,
      category,
      subCategory: subCategory.trim() || undefined,
      size: size.trim() || undefined,
      color: color.trim() || undefined,
      material: material.trim() || undefined,
      brand: brand.trim() || undefined,
    } : baseItem;

    onSubmit(finalItem);
    handleReset();
  };

  const handleReset = () => {
    setName('');
    setDescription('');
    setQuantity(1);
    setCondition('Good');
    setIsSpare(false);
    setImageUrl(null);
    setCategory('Tops');
    setSubCategory('');
    setSize('');
    setColor('');
    setMaterial('');
    setBrand('');
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
            className="relative max-w-lg w-full bg-card rounded-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto z-10 border border-border-main/20 flex flex-col gap-4 font-sans"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-2 border-b border-border-main/10">
              <h3 className="text-sm font-bold text-primary flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-brand" />
                Add New Asset
              </h3>
              <button 
                onClick={handleReset}
                className="p-1 hover:bg-canvas rounded-full text-secondary transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Poly-classification Segmented Control */}
            <div className="p-1 bg-canvas rounded-xl flex gap-1">
              <button
                type="button"
                onClick={() => setItemType('clothing')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all relative ${
                  itemType === 'clothing' ? 'text-primary' : 'text-secondary hover:text-primary'
                }`}
              >
                {itemType === 'clothing' && (
                  <motion.div
                    layoutId="itemTypeActive"
                    className="absolute inset-0 bg-white rounded-lg shadow-sm border border-border-main/5"
                    transition={{ type: 'spring', stiffness: 450, damping: 30 }}
                  />
                )}
                <span className="relative z-10 flex items-center justify-center gap-1">
                  <Sparkles className="w-3 h-3 text-brand" />
                  Clothing Item
                </span>
              </button>
              <button
                type="button"
                onClick={() => setItemType('item-accessory')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all relative ${
                  itemType === 'item-accessory' ? 'text-primary' : 'text-secondary hover:text-primary'
                }`}
              >
                {itemType === 'item-accessory' && (
                  <motion.div
                    layoutId="itemTypeActive"
                    className="absolute inset-0 bg-white rounded-lg shadow-sm border border-border-main/5"
                    transition={{ type: 'spring', stiffness: 450, damping: 30 }}
                  />
                )}
                <span className="relative z-10 flex items-center justify-center gap-1">
                  <Folder className="w-3.5 h-3.5 text-secondary" />
                  Item / Accessory
                </span>
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSave} className="space-y-4 text-xs">
              {/* Name */}
              <div className="space-y-1.5">
                <label className="font-bold text-secondary">Asset Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Cozy White Hoodie, Keys, etc."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-9 px-3 bg-canvas/30 rounded-xl border border-border-main/40 focus:outline-none focus:bg-white focus:border-brand text-sm font-medium"
                />
              </div>

              {/* Dynamic Hierarchical Storage Dropdowns */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Parent Storage */}
                <div className="space-y-1.5">
                  <label className="font-bold text-secondary">Parent Storage *</label>
                  <select
                    value={selectedParentId}
                    onChange={(e) => setSelectedParentId(e.target.value)}
                    className="w-full h-9 px-2 bg-canvas/30 rounded-xl border border-border-main/40 focus:outline-none focus:bg-white focus:border-brand text-xs font-medium"
                  >
                    <option value="" disabled>Select Storage</option>
                    {activeSpaceStorages.map(node => (
                      <option key={node.id} value={node.id}>{node.name}</option>
                    ))}
                  </select>
                </div>

                {/* Child Container */}
                {selectedParentNode && selectedParentNode.children && selectedParentNode.children.length > 0 ? (
                  <div className="space-y-1.5">
                    <label className="font-bold text-secondary">Child Container</label>
                    <select
                      value={selectedChildId}
                      onChange={(e) => setSelectedChildId(e.target.value)}
                      className="w-full h-9 px-2 bg-canvas/30 rounded-xl border border-border-main/40 focus:outline-none focus:bg-white focus:border-brand text-xs font-medium"
                    >
                      {selectedParentNode.children.map(node => (
                        <option key={node.id} value={node.id}>{node.name}</option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="hidden sm:block" />
                )}

                {/* Compartment */}
                {selectedChildNode && selectedChildNode.children && selectedChildNode.children.length > 0 ? (
                  <div className="space-y-1.5">
                    <label className="font-bold text-secondary">Compartment</label>
                    <select
                      value={selectedCompartmentId}
                      onChange={(e) => setSelectedCompartmentId(e.target.value)}
                      className="w-full h-9 px-2 bg-canvas/30 rounded-xl border border-border-main/40 focus:outline-none focus:bg-white focus:border-brand text-xs font-medium"
                    >
                      {selectedChildNode.children.map(node => (
                        <option key={node.id} value={node.id}>{node.name}</option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="hidden sm:block" />
                )}
              </div>

              {/* Clothing-Specific Fields */}
              {itemType === 'clothing' && (
                <div className="space-y-4 p-3 bg-canvas/20 rounded-xl border border-border-main/10">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="font-bold text-secondary">Category *</label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value as ClothingCategory)}
                        className="w-full h-9 px-2 bg-canvas/30 rounded-xl border border-border-main/40 focus:outline-none focus:bg-white focus:border-brand text-xs font-medium"
                      >
                        {CLOTHING_CATEGORIES.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="font-bold text-secondary">Sub-Category</label>
                      <input
                        type="text"
                        placeholder="e.g. T-Shirt, Jeans"
                        value={subCategory}
                        onChange={(e) => setSubCategory(e.target.value)}
                        className="w-full h-9 px-3 bg-canvas/30 rounded-xl border border-border-main/40 focus:outline-none focus:bg-white focus:border-brand text-sm font-medium"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="space-y-1.5">
                      <label className="font-bold text-secondary">Size</label>
                      <input
                        type="text"
                        placeholder="e.g. M, 10"
                        value={size}
                        onChange={(e) => setSize(e.target.value)}
                        className="w-full h-9 px-2 bg-canvas/30 rounded-xl border border-border-main/40 focus:outline-none focus:bg-white focus:border-brand text-xs font-medium"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="font-bold text-secondary">Color</label>
                      <input
                        type="text"
                        placeholder="e.g. Black"
                        value={color}
                        onChange={(e) => setColor(e.target.value)}
                        className="w-full h-9 px-2 bg-canvas/30 rounded-xl border border-border-main/40 focus:outline-none focus:bg-white focus:border-brand text-xs font-medium"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="font-bold text-secondary">Material</label>
                      <input
                        type="text"
                        placeholder="e.g. Cotton"
                        value={material}
                        onChange={(e) => setMaterial(e.target.value)}
                        className="w-full h-9 px-2 bg-canvas/30 rounded-xl border border-border-main/40 focus:outline-none focus:bg-white focus:border-brand text-xs font-medium"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="font-bold text-secondary">Brand</label>
                      <input
                        type="text"
                        placeholder="e.g. Zara"
                        value={brand}
                        onChange={(e) => setBrand(e.target.value)}
                        className="w-full h-9 px-2 bg-canvas/30 rounded-xl border border-border-main/40 focus:outline-none focus:bg-white focus:border-brand text-xs font-medium"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Description */}
              <div className="space-y-1.5">
                <label className="font-bold text-secondary">Description</label>
                <textarea
                  placeholder="Optional details, location details, etc."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="w-full p-2.5 bg-canvas/30 rounded-xl border border-border-main/40 focus:outline-none focus:bg-white focus:border-brand text-xs font-medium resize-none"
                />
              </div>

              {/* Quantity, Condition, Spare */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                {/* Quantity */}
                <div className="space-y-1.5">
                  <label className="font-bold text-secondary">Quantity</label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={quantity <= 1}
                      onClick={() => setQuantity(q => Math.max(1, q - 1))}
                      className="w-9 h-9 bg-canvas border border-border-main/20 rounded-xl font-bold flex items-center justify-center hover:bg-canvas/80 disabled:opacity-40"
                    >
                      -
                    </button>
                    <span className="flex-1 text-center font-bold text-sm">{quantity}</span>
                    <button
                      type="button"
                      onClick={() => setQuantity(q => q + 1)}
                      className="w-9 h-9 bg-canvas border border-border-main/20 rounded-xl font-bold flex items-center justify-center hover:bg-canvas/80"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Condition Selection */}
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="font-bold text-secondary block">Condition</label>
                  <div className="grid grid-cols-3 gap-1">
                    {ITEM_CONDITIONS.map((cond) => (
                      <button
                        key={cond}
                        type="button"
                        onClick={() => setCondition(cond)}
                        className={`h-9 rounded-xl border text-xs font-semibold flex items-center justify-center transition-colors ${
                          condition === cond
                            ? 'bg-brand/10 border-brand text-brand'
                            : 'bg-canvas/30 border-border-main/20 text-secondary hover:text-primary hover:bg-canvas/60'
                        }`}
                      >
                        {cond}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Image Upload */}
              <div className="space-y-1.5">
                <label className="font-bold text-secondary block">Thumbnail Image</label>
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
                      {isUploading ? 'Uploading...' : imageUrl ? 'Uploaded ✅' : 'Choose File'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Spare Flag */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isSpare"
                  checked={isSpare}
                  onChange={(e) => setIsSpare(e.target.checked)}
                  className="w-4 h-4 rounded text-brand border-border-main/40 focus:ring-brand"
                />
                <label htmlFor="isSpare" className="font-bold text-secondary select-none">
                  Flag as Spare / Backup item (displayed in Spares Tray)
                </label>
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-border-main/20 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={handleReset}
                  className="h-8.5 px-4 rounded-full bg-canvas text-secondary font-bold hover:bg-canvas/80"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploading}
                  className="h-8.5 px-4 rounded-full bg-brand text-brand-foreground font-bold hover:brightness-95 shadow-sm disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  Create Asset
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
