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
import CustomSelect from '@/components/ui/custom-select';

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
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [condition, setCondition] = useState<ItemCondition>('Good');
  const [isSpare, setIsSpare] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  // Custom Thumbnail background removal and size fit options
  const [imageFit, setImageFit] = useState<'cover' | 'contain'>('cover');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isRemovingBg, setIsRemovingBg] = useState(false);

  // Generalized category & specifications states
  const [selectedCategory, setSelectedCategory] = useState('Clothing');
  const [clothingType, setClothingType] = useState<ClothingCategory>('Tops');
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [customCategory, setCustomCategory] = useState('');
  const [subCategory, setSubCategory] = useState('');
  const [size, setSize] = useState('');
  const [color, setColor] = useState('');
  const [material, setMaterial] = useState('');
  const [brand, setBrand] = useState('');

  // Computed values
  const itemType: ItemType = (!isCustomCategory && selectedCategory === 'Clothing') ? 'clothing' : 'item-accessory';
  const category = isCustomCategory
    ? customCategory.trim()
    : (selectedCategory === 'Clothing' ? clothingType : selectedCategory);

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
      setSelectedFile(file);
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

  // Client-side Background Removal handler
  const handleRemoveBackground = async () => {
    if (!selectedFile) return;
    setIsRemovingBg(true);
    try {
      // Dynamic import to optimize Next.js initial bundle sizes
      const { removeBackground } = (await import('@imgly/background-removal')) as any;
      
      console.log('Removing background client-side...');
      const imageBlob = await removeBackground(selectedFile);
      
      // Convert transparent image Blob back to File format
      const processedFile = new File([imageBlob], `processed_${Date.now()}.png`, { type: 'image/png' });
      
      setIsUploading(true);
      const url = await uploadImageToStorage(processedFile, 'items');
      if (url) {
        setImageUrl(url);
        // Automatically default transparency outline images to contain
        setImageFit('contain');
        console.log('Background removed successfully and uploaded!');
      }
    } catch (err) {
      console.error('Failed to process background removal:', err);
      alert('Failed to remove background. Processing is resource-intensive and might fail on some devices or file formats.');
    } finally {
      setIsUploading(false);
      setIsRemovingBg(false);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    if (!targetContainerId) {
      alert('Please select a storage unit.');
      return;
    }

    // Append image fit preference as URL hash to prevent schema layout conflicts
    const finalImageUrl = imageUrl
      ? `${imageUrl.split('#')[0]}#${imageFit}`
      : undefined;

    const finalItem = {
      containerId: targetContainerId,
      name: name.trim(),
      description: description.trim(),
      imageUrl: finalImageUrl,
      quantity,
      condition,
      isSpare,
      itemType,
      category: category || undefined,
      subCategory: subCategory.trim() || undefined,
      size: size.trim() || undefined,
      color: color.trim() || undefined,
      material: material.trim() || undefined,
      brand: brand.trim() || undefined,
    };

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
    setSelectedFile(null);
    setImageFit('cover');
    setIsRemovingBg(false);
    setSelectedCategory('Clothing');
    setClothingType('Tops');
    setIsCustomCategory(false);
    setCustomCategory('');
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
            </div>            {/* Form */}
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
                <CustomSelect
                  label="Parent Storage *"
                  placeholder="Select Storage"
                  options={activeSpaceStorages.map(node => ({ value: node.id, label: node.name }))}
                  value={selectedParentId}
                  onChange={setSelectedParentId}
                />

                {/* Child Container */}
                {selectedParentNode && selectedParentNode.children && selectedParentNode.children.length > 0 ? (
                  <CustomSelect
                    label="Child Container"
                    placeholder="Select Container"
                    options={selectedParentNode.children.map(node => ({ value: node.id, label: node.name }))}
                    value={selectedChildId}
                    onChange={setSelectedChildId}
                  />
                ) : (
                  <div className="hidden sm:block" />
                )}

                {/* Compartment */}
                {selectedChildNode && selectedChildNode.children && selectedChildNode.children.length > 0 ? (
                  <CustomSelect
                    label="Compartment"
                    placeholder="Select Compartment"
                    options={selectedChildNode.children.map(node => ({ value: node.id, label: node.name }))}
                    value={selectedCompartmentId}
                    onChange={setSelectedCompartmentId}
                  />
                ) : (
                  <div className="hidden sm:block" />
                )}
              </div>

              {/* Category & Sub-Category Section */}
              <div className="p-4 bg-canvas/25 rounded-2xl border border-border-main/15 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Category Selection */}
                  {isCustomCategory ? (
                    <div className="space-y-1.5">
                      <label className="font-bold text-secondary text-[11px] uppercase tracking-wider">Custom Category Name *</label>
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
                          title="Revert to presets"
                        >
                          <X className="w-4.5 h-4.5" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1.5 flex flex-col justify-end">
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

                  {/* Sub-Category Input */}
                  <div className="space-y-1.5 flex flex-col justify-end">
                    <label className="font-bold text-secondary text-[11px] uppercase tracking-wider">Sub-Category</label>
                    <input
                      type="text"
                      placeholder="e.g. T-Shirt, Jeans, Charger"
                      value={subCategory}
                      onChange={(e) => setSubCategory(e.target.value)}
                      className="w-full h-9 px-3 bg-card rounded-xl border border-border-main/40 focus:outline-none focus:bg-white focus:border-brand text-xs font-semibold"
                    />
                  </div>
                </div>

                {/* Clothing Type select (only shown if isCustomCategory is false and Category is Clothing) */}
                {!isCustomCategory && selectedCategory === 'Clothing' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <CustomSelect
                      label="Clothing Type *"
                      options={CLOTHING_CATEGORIES.map(cat => ({ value: cat, label: cat }))}
                      value={clothingType}
                      onChange={(val) => setClothingType(val as ClothingCategory)}
                      className="col-span-full"
                    />
                  </div>
                )}
              </div>

              {/* Product Specifications Section */}
              <div className="p-4 bg-canvas/25 rounded-2xl border border-border-main/15 space-y-3">
                <h4 className="font-bold text-secondary uppercase text-[10px] tracking-wider border-b border-border-main/15 pb-1">
                  Product Specifications (Optional)
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="space-y-1.5">
                    <label className="font-bold text-[10px] text-secondary">Size</label>
                    <input
                      type="text"
                      placeholder="e.g. M, 10"
                      value={size}
                      onChange={(e) => setSize(e.target.value)}
                      className="w-full h-9 px-2 bg-card rounded-xl border border-border-main/40 focus:outline-none focus:bg-white focus:border-brand text-xs font-medium"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-bold text-[10px] text-secondary">Color</label>
                    <input
                      type="text"
                      placeholder="e.g. Black"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      className="w-full h-9 px-2 bg-card rounded-xl border border-border-main/40 focus:outline-none focus:bg-white focus:border-brand text-xs font-medium"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-bold text-[10px] text-secondary">Material</label>
                    <input
                      type="text"
                      placeholder="e.g. Cotton"
                      value={material}
                      onChange={(e) => setMaterial(e.target.value)}
                      className="w-full h-9 px-2 bg-card rounded-xl border border-border-main/40 focus:outline-none focus:bg-white focus:border-brand text-xs font-medium"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-bold text-[10px] text-secondary">Brand</label>
                    <input
                      type="text"
                      placeholder="e.g. Zara"
                      value={brand}
                      onChange={(e) => setBrand(e.target.value)}
                      className="w-full h-9 px-2 bg-card rounded-xl border border-border-main/40 focus:outline-none focus:bg-white focus:border-brand text-xs font-medium"
                    />
                  </div>
                </div>
              </div>

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
              <div className="space-y-2.5">
                <label className="font-bold text-secondary block">Thumbnail Image</label>

                {/* Visual Preview Box with dynamic size preference preview */}
                {imageUrl && (
                  <div className="relative border border-border-main/20 bg-canvas/30 rounded-2xl overflow-hidden p-3 flex flex-col items-center justify-center gap-2">
                    <div className="relative w-full h-40 flex items-center justify-center bg-transparent">
                      <img 
                        id="output-image"
                        src={imageUrl} 
                        alt="Preview" 
                        className={`max-w-full max-h-full rounded-lg ${imageFit === 'contain' ? 'object-contain w-auto h-auto' : 'object-cover w-full h-full'}`} 
                      />
                    </div>

                    <div className="flex w-full items-center justify-between gap-4 mt-1 border-t border-border-main/10 pt-2.5">
                      {/* Image Fit controls (size preference) */}
                      <div className="flex flex-col gap-1">
                        <span className="text-[9px] font-bold text-secondary uppercase tracking-wider">Thumbnail Fit</span>
                        <div className="flex gap-1 bg-canvas p-0.5 rounded-lg border border-border-main/15">
                          <button
                            type="button"
                            onClick={() => setImageFit('cover')}
                            className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition-all cursor-pointer ${
                              imageFit === 'cover' ? 'bg-card text-primary shadow-xs' : 'text-secondary hover:text-primary'
                            }`}
                          >
                            Cover (Square Crop)
                          </button>
                          <button
                            type="button"
                            onClick={() => setImageFit('contain')}
                            className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition-all cursor-pointer ${
                              imageFit === 'contain' ? 'bg-card text-primary shadow-xs' : 'text-secondary hover:text-primary'
                            }`}
                          >
                            Contain (Fit Image)
                          </button>
                        </div>
                      </div>

                      {/* Remove Background Action */}
                      {selectedFile && (
                        <button
                          type="button"
                          disabled={isRemovingBg || isUploading}
                          onClick={handleRemoveBackground}
                          className="h-8 px-3 rounded-full bg-brand text-brand-foreground hover:brightness-95 flex items-center gap-1 cursor-pointer font-bold disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          {isRemovingBg ? (
                            <div className="w-3.5 h-3.5 rounded-full border-2 border-brand-foreground/30 border-t-brand-foreground animate-spin" />
                          ) : (
                            <Sparkles className="w-3.5 h-3.5" />
                          )}
                          {isRemovingBg ? 'Processing...' : 'Remove BG'}
                        </button>
                      )}
                    </div>
                  </div>
                )}

                <div className="relative h-9">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    disabled={isUploading || isRemovingBg}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                  />
                  <div className="absolute inset-0 bg-canvas/30 rounded-xl border border-border-main/40 flex items-center justify-center gap-1.5 hover:bg-canvas/50">
                    <ImageIcon className="w-3.5 h-3.5 text-secondary" />
                    <span className="text-[10px] text-secondary font-medium">
                      {isUploading ? 'Uploading...' : imageUrl ? 'Change Photo' : 'Choose File'}
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
