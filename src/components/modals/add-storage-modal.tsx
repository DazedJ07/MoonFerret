'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Archive, X, Image as ImageIcon, Plus, Minus, ChevronRight, ChevronLeft, Sparkles } from 'lucide-react';
import {
  Space,
  StorageUnit,
  StorageType,
  STORAGE_TYPES,
  TOP_LEVEL_STORAGE_TYPES,
  getEligibleParentStorages,
} from '@/data/types';
import { uploadImageToStorage } from '@/lib/supabase';
import CustomSelect from '@/components/ui/custom-select';

interface AddStorageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (storage: {
    name: string;
    type: StorageType;
    parentId: string | null;
    compartments: number;
    capacity: number;
    imageUrl: string | null;
    spaceId?: string;
  }) => void;
  existingStorages: StorageUnit[];
  activeSpaceId: string | null;
  defaultParentId?: string | null;
  spaces?: Space[];
}

export default function AddStorageModal({
  isOpen,
  onClose,
  onSubmit,
  existingStorages,
  activeSpaceId,
  defaultParentId,
  spaces = [],
}: AddStorageModalProps) {
  // Stepper state
  const [step, setStep] = useState(1);

  // Form states
  const [name, setName] = useState('');
  const [type, setType] = useState<StorageType>('Closet');
  const [selectedSpaceId, setSelectedSpaceId] = useState<string>('');
  const [parentId, setParentId] = useState<string>('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Nested creation sub-configuration states
  const [hasChildren, setHasChildren] = useState(true);
  const [compartments, setCompartments] = useState(4);
  const [customCapacity, setCustomCapacity] = useState<string>('20');

  const requiresParent = type === 'Container' || type === 'Compartment';
  const isLeafType = type === 'Compartment';

  const potentialParents = useMemo(() => {
    return getEligibleParentStorages(type, existingStorages, selectedSpaceId || activeSpaceId);
  }, [type, existingStorages, selectedSpaceId, activeSpaceId]);

  // Sync space selection when active space or list changes
  useEffect(() => {
    if (activeSpaceId) {
      setSelectedSpaceId(activeSpaceId);
    } else if (spaces.length > 0) {
      setSelectedSpaceId(spaces[0].id);
    }
  }, [isOpen, activeSpaceId, spaces]);

  // Sync parent selection based on type & space
  useEffect(() => {
    if (!requiresParent) {
      setParentId('');
      return;
    }

    if (defaultParentId && potentialParents.some((p) => p.id === defaultParentId)) {
      setParentId(defaultParentId);
      return;
    }

    if (potentialParents.length > 0) {
      setParentId(potentialParents[0].id);
    } else {
      setParentId('');
    }
  }, [type, defaultParentId, potentialParents, requiresParent]);

  // Sync type from default parent when modal opens
  useEffect(() => {
    if (!isOpen || !defaultParentId) return;
    const parent = existingStorages.find((su) => su.id === defaultParentId);
    if (!parent) return;

    if (parent.type === 'Container') {
      setType('Compartment');
    } else if (parent.parentId === null) {
      setType('Container');
    }
  }, [isOpen, defaultParentId, existingStorages]);

  // Compute actual properties for submission
  const effectiveCompartments = useMemo(() => {
    if (requiresParent) {
      return isLeafType ? 1 : compartments;
    }
    return hasChildren ? compartments : 0;
  }, [requiresParent, isLeafType, hasChildren, compartments]);

  const capacity = useMemo(() => {
    const parsed = customCapacity.trim() === '' ? 999 : parseInt(customCapacity);
    const itemLimit = isNaN(parsed) ? 20 : parsed;
    return isLeafType ? itemLimit : (effectiveCompartments || 1) * itemLimit;
  }, [customCapacity, isLeafType, effectiveCompartments]);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploading(true);
      try {
        const url = await uploadImageToStorage(file, 'storages');
        if (url) setImageUrl(url);
      } catch (err) {
        console.error('Storage image upload failed:', err);
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleNextStep = () => {
    if (!name.trim()) return;
    setStep(2);
  };

  const handlePrevStep = () => {
    setStep(1);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    if (requiresParent && !parentId) {
      alert('Please select a parent storage unit.');
      return;
    }

    onSubmit({
      name: name.trim(),
      type,
      parentId: requiresParent ? parentId : null,
      compartments: effectiveCompartments,
      capacity,
      imageUrl,
      spaceId: selectedSpaceId || undefined,
    });

    handleReset();
  };

  const handleReset = () => {
    setName('');
    setType('Closet');
    setParentId('');
    setCompartments(4);
    setImageUrl(null);
    setCustomCapacity('20');
    setHasChildren(true);
    setStep(1);
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
            className="relative max-w-md w-full bg-card rounded-2xl p-6 shadow-2xl z-10 border border-border-main/20 flex flex-col gap-4 font-sans min-w-0"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-2 border-b border-border-main/10">
              <h3 className="text-sm font-bold text-primary flex items-center gap-1.5">
                <Archive className="w-4 h-4 text-brand" />
                Add Storage Unit
              </h3>
              <button
                type="button"
                onClick={handleReset}
                className="p-1 hover:bg-canvas rounded-full text-secondary transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Stepper Progress Bar */}
            <div className="flex items-center justify-center gap-4 py-1.5 bg-canvas/30 rounded-xl border border-border-main/10 px-4">
              <div className="flex items-center gap-1.5">
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${step === 1 ? 'bg-brand text-brand-foreground' : 'bg-brand/20 text-brand'}`}>
                  1
                </span>
                <span className={`text-[10px] font-bold ${step === 1 ? 'text-primary' : 'text-secondary'}`}>Details</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-secondary/40" />
              <div className="flex items-center gap-1.5">
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${step === 2 ? 'bg-brand text-brand-foreground' : 'bg-canvas border border-border-main/20 text-secondary'}`}>
                  2
                </span>
                <span className={`text-[10px] font-bold ${step === 2 ? 'text-primary' : 'text-secondary'}`}>Nesting & Capacity</span>
              </div>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs min-w-0">
              
              {/* STEP 1: Details */}
              {step === 1 && (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-4"
                >
                  {/* Storage Title */}
                  <div className="space-y-1.5">
                    <label className="font-bold text-secondary">Storage Title *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Oak Wardrobe, Master Drawer, Shoe Organizer"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full h-9 px-3 bg-canvas/30 rounded-xl border border-border-main/40 focus:outline-none focus:bg-canvas focus:border-brand text-xs font-semibold min-w-0"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Storage Type */}
                    <CustomSelect
                      label="Storage Type *"
                      options={STORAGE_TYPES.map((t) => ({
                        value: t,
                        label: `${t}${TOP_LEVEL_STORAGE_TYPES.includes(t) ? ' (Top-Level)' : ' (Nested)'}`
                      }))}
                      value={type}
                      onChange={(val) => setType(val as StorageType)}
                    />

                    {/* Space Selection (only if activeSpaceId is null) */}
                    {!activeSpaceId && spaces.length > 0 && (
                      <CustomSelect
                        label="Space Location *"
                        options={spaces.map((sp) => ({
                          value: sp.id,
                          label: sp.name
                        }))}
                        value={selectedSpaceId}
                        onChange={setSelectedSpaceId}
                      />
                    )}
                  </div>

                  {/* Cabinet Picture */}
                  <div className="space-y-1.5">
                    <label className="font-bold text-secondary block">Cabinet Photo (Optional)</label>
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
                          {isUploading ? 'Uploading...' : imageUrl ? 'Photo Selected ✅' : 'Choose File'}
                        </span>
                      </div>
                    </div>
                    {imageUrl && (
                      <div className="mt-2 h-16 w-16 rounded-xl overflow-hidden border border-border-main/20 shrink-0">
                        <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>

                  {/* Next Action */}
                  <div className="pt-3 border-t border-border-main/20 flex justify-end">
                    <button
                      type="button"
                      disabled={!name.trim()}
                      onClick={handleNextStep}
                      className="h-8.5 px-4 rounded-full bg-brand text-brand-foreground font-bold hover:brightness-95 flex items-center gap-1.5 shadow-sm disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    >
                      Next Step
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              )}

              {/* STEP 2: Nesting & Capacity Setup */}
              {step === 2 && (
                <motion.div 
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-4"
                >
                  {/* Nested Type Settings */}
                  {requiresParent ? (
                    <div className="space-y-4">
                      {/* Parent Selector */}
                      <CustomSelect
                        label={`Parent ${type === 'Compartment' ? 'Container' : 'Storage Unit'} *`}
                        placeholder={potentialParents.length === 0 ? 'No eligible parent structures' : 'Select parent storage'}
                        options={potentialParents.map(parent => ({
                          value: parent.id,
                          label: `${parent.name} (${parent.type})`
                        }))}
                        value={parentId}
                        onChange={setParentId}
                      />

                      {/* Compartment capacity input */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                        <div className="space-y-1.5">
                          <label className="font-bold text-secondary">Max Item Limit</label>
                          <input
                            type="text"
                            placeholder="Unlimited"
                            value={customCapacity}
                            onChange={(e) => setCustomCapacity(e.target.value.replace(/\D/g, ''))}
                            className="w-full h-9 px-3 bg-canvas/30 rounded-xl border border-border-main/40 focus:outline-none focus:bg-canvas focus:border-brand text-xs font-semibold"
                          />
                          <p className="text-[9px] text-stone-400">Leave blank for unlimited</p>
                        </div>

                        <div className="space-y-1 bg-canvas/40 p-2.5 rounded-xl border border-border-main/10 flex flex-col justify-center min-w-0">
                          <span className="text-[9px] font-bold text-secondary">Computed Capacity</span>
                          <span className="text-sm font-black text-brand">
                            {customCapacity.trim() === '' ? 'Unlimited' : `${customCapacity} Items`}
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    // Top-Level Type Settings (Closet, Drawer Set, Open Shelf, Heavy Bin)
                    <div className="space-y-4">
                      {/* Sub-storage creation toggle */}
                      <div className="flex items-center gap-2 pt-1">
                        <input
                          type="checkbox"
                          id="hasChildren"
                          checked={hasChildren}
                          onChange={(e) => setHasChildren(e.target.checked)}
                          className="w-4 h-4 rounded text-brand border-border-main/40 focus:ring-brand cursor-pointer"
                        />
                        <label htmlFor="hasChildren" className="font-bold text-secondary select-none cursor-pointer">
                          Generate sub-containers (e.g. drawers or shelves) automatically
                        </label>
                      </div>

                      {hasChildren ? (
                        <div className="space-y-4">
                          {/* Stepper for compartments number */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                            <div className="space-y-1.5">
                              <label className="font-bold text-secondary">Sub-containers to generate</label>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  disabled={compartments <= 1}
                                  onClick={() => setCompartments((c) => Math.max(1, c - 1))}
                                  className="w-9 h-9 bg-canvas border border-border-main/20 rounded-xl font-bold flex items-center justify-center hover:bg-canvas/80 disabled:opacity-40 shrink-0"
                                >
                                  <Minus className="w-3.5 h-3.5" />
                                </button>
                                <span className="flex-1 text-center font-black text-sm">{compartments}</span>
                                <button
                                  type="button"
                                  disabled={compartments >= 12}
                                  onClick={() => setCompartments((c) => Math.min(12, c + 1))}
                                  className="w-9 h-9 bg-canvas border border-border-main/20 rounded-xl font-bold flex items-center justify-center hover:bg-canvas/80 disabled:opacity-40 shrink-0"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            {/* Capacity per compartment */}
                            <div className="space-y-1.5">
                              <label className="font-bold text-secondary">Max items per container</label>
                              <input
                                type="text"
                                placeholder="Unlimited"
                                value={customCapacity}
                                onChange={(e) => setCustomCapacity(e.target.value.replace(/\D/g, ''))}
                                className="w-full h-9 px-3 bg-canvas/30 rounded-xl border border-border-main/40 focus:outline-none focus:bg-canvas focus:border-brand text-xs font-semibold"
                              />
                            </div>
                          </div>

                          {/* Computed summary box */}
                          <div className="space-y-1 bg-canvas/40 p-2.5 rounded-xl border border-border-main/10 flex flex-col justify-center min-w-0">
                            <span className="text-[9px] font-bold text-secondary">Total Computed Capacity</span>
                            <span className="text-sm font-black text-brand">
                              {customCapacity.trim() === '' ? 'Unlimited' : `${capacity} Items total`}
                            </span>
                            <span className="text-[9px] text-stone-400 font-medium">
                              Creates {compartments} child container{compartments !== 1 ? 's' : ''} · {customCapacity.trim() === '' ? 'unlimited' : `${customCapacity}`} items capacity each
                            </span>
                          </div>
                        </div>
                      ) : (
                        // Standard top-level storage without children
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                          <div className="space-y-1.5">
                            <label className="font-bold text-secondary">Max Item Limit</label>
                            <input
                              type="text"
                              placeholder="Unlimited"
                              value={customCapacity}
                              onChange={(e) => setCustomCapacity(e.target.value.replace(/\D/g, ''))}
                              className="w-full h-9 px-3 bg-canvas/30 rounded-xl border border-border-main/40 focus:outline-none focus:bg-canvas focus:border-brand text-xs font-semibold"
                            />
                            <p className="text-[9px] text-stone-400">Leave blank for unlimited</p>
                          </div>

                          <div className="space-y-1 bg-canvas/40 p-2.5 rounded-xl border border-border-main/10 flex flex-col justify-center min-w-0">
                            <span className="text-[9px] font-bold text-secondary">Computed Capacity</span>
                            <span className="text-sm font-black text-brand">
                              {customCapacity.trim() === '' ? 'Unlimited' : `${customCapacity} Items`}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Step Actions */}
                  <div className="pt-3 border-t border-border-main/20 flex justify-between gap-2">
                    <button
                      type="button"
                      onClick={handlePrevStep}
                      className="h-8.5 px-4 rounded-full bg-canvas text-secondary font-bold hover:bg-canvas/80 flex items-center gap-1.5"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={isUploading || (requiresParent && !parentId)}
                      className="h-8.5 px-4 rounded-full bg-brand text-brand-foreground font-bold hover:brightness-95 shadow-sm disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    >
                      Create Storage
                    </button>
                  </div>
                </motion.div>
              )}
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
