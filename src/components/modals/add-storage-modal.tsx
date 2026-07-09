'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Archive, X, Image as ImageIcon, Plus, Minus } from 'lucide-react';
import {
  StorageUnit,
  StorageType,
  STORAGE_TYPES,
  TOP_LEVEL_STORAGE_TYPES,
  isTopLevelStorageType,
  getEligibleParentStorages,
} from '@/data/types';
import { uploadImageToStorage } from '@/lib/supabase';

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
  }) => void;
  existingStorages: StorageUnit[];
  activeSpaceId: string | null;
  defaultParentId?: string | null;
}

export default function AddStorageModal({
  isOpen,
  onClose,
  onSubmit,
  existingStorages,
  activeSpaceId,
  defaultParentId,
}: AddStorageModalProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState<StorageType>('Closet');
  const [parentId, setParentId] = useState<string>('');
  const [compartments, setCompartments] = useState(4);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const requiresParent = type === 'Container' || type === 'Compartment';
  const isLeafType = type === 'Compartment';

  const potentialParents = useMemo(() => {
    return getEligibleParentStorages(type, existingStorages, activeSpaceId);
  }, [type, existingStorages, activeSpaceId]);

  // Sync parent when type or defaults change
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

  // Infer type from default parent when modal opens
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

  const effectiveCompartments = isLeafType ? 1 : compartments;
  const capacity = useMemo(
    () => (isLeafType ? 5 : effectiveCompartments * 5),
    [effectiveCompartments, isLeafType]
  );

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

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    if (requiresParent && !parentId) return;

    onSubmit({
      name: name.trim(),
      type,
      parentId: requiresParent ? parentId : null,
      compartments: effectiveCompartments,
      capacity,
      imageUrl,
    });

    handleReset();
  };

  const handleReset = () => {
    setName('');
    setType('Closet');
    setParentId('');
    setCompartments(4);
    setImageUrl(null);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleReset}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="relative max-w-md w-full max-h-[90vh] overflow-y-auto bg-card rounded-2xl p-6 shadow-2xl z-10 border border-border-main/20 flex flex-col gap-4 font-sans min-w-0"
          >
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

            <form onSubmit={handleSave} className="space-y-4 text-xs min-w-0">
              <div className="space-y-1.5">
                <label className="font-bold text-secondary">Storage Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Oak Wardrobe, Shoe Organizer"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-9 px-3 bg-canvas/30 rounded-xl border border-border-main/40 focus:outline-none focus:bg-white focus:border-brand text-sm font-medium min-w-0"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 min-w-0">
                <div className="space-y-1.5 min-w-0">
                  <label className="font-bold text-secondary">Storage Type *</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as StorageType)}
                    className="w-full h-9 px-2 bg-canvas/30 rounded-xl border border-border-main/40 focus:outline-none focus:bg-white focus:border-brand text-xs font-medium min-w-0"
                  >
                    {STORAGE_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                        {TOP_LEVEL_STORAGE_TYPES.includes(t) ? ' (Storage)' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {requiresParent ? (
                  <div className="space-y-1.5 min-w-0">
                    <label className="font-bold text-secondary">
                      Parent {type === 'Compartment' ? 'Container' : 'Storage'} *
                    </label>
                    <select
                      value={parentId}
                      onChange={(e) => setParentId(e.target.value)}
                      required
                      className="w-full h-9 px-2 bg-canvas/30 rounded-xl border border-border-main/40 focus:outline-none focus:bg-white focus:border-brand text-xs font-medium min-w-0"
                    >
                      <option value="" disabled>
                        {potentialParents.length === 0 ? 'No eligible parents' : 'Select parent'}
                      </option>
                      {potentialParents.map((parent) => (
                        <option key={parent.id} value={parent.id}>
                          {parent.name}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="space-y-1.5 flex items-end">
                    <p className="text-[10px] text-secondary font-medium pb-2">
                      Top-level storage — no parent required
                    </p>
                  </div>
                )}
              </div>

              {!isLeafType && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center min-w-0">
                  <div className="space-y-1.5">
                    <label className="font-bold text-secondary">
                      {type === 'Container' ? 'Compartments to Generate' : 'Containers to Generate'}
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={compartments <= 1}
                        onClick={() => setCompartments((c) => Math.max(1, c - 1))}
                        className="w-9 h-9 bg-canvas border border-border-main/20 rounded-xl font-bold flex items-center justify-center hover:bg-canvas/80 disabled:opacity-40 shrink-0"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="flex-1 text-center font-bold text-sm">{compartments}</span>
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

                  <div className="space-y-1 bg-canvas/40 p-2.5 rounded-xl border border-border-main/10 flex flex-col justify-center min-w-0">
                    <span className="text-[10px] font-bold text-secondary">Computed Capacity</span>
                    <span className="text-sm font-black text-brand">{capacity} Items</span>
                    <span className="text-[9px] text-stone-400 font-medium">
                      Auto-creates {compartments}{' '}
                      {type === 'Container' || requiresParent ? 'compartment' : 'container'}
                      {compartments !== 1 ? 's' : ''} · 5 items each
                    </span>
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="font-bold text-secondary block">Cabinet Picture</label>
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
                {imageUrl && (
                  <div className="mt-2 h-16 w-16 rounded-lg overflow-hidden border border-border-main/20 shrink-0">
                    <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>

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
                  disabled={isUploading || (requiresParent && !parentId)}
                  className="h-8.5 px-4 rounded-full bg-brand text-brand-foreground font-bold hover:brightness-95 shadow-sm disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  Create Storage
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
