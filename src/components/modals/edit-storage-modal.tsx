'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Image as ImageIcon, Trash2, Save, AlertTriangle } from 'lucide-react';
import { StorageUnit, StorageType, STORAGE_TYPES } from '@/data/types';
import { uploadImageToStorage } from '@/lib/supabase';

interface EditStorageModalProps {
  isOpen: boolean;
  onClose: () => void;
  storage: StorageUnit | null;
  onSave: (id: string, updatedFields: {
    name: string;
    type: StorageType;
    capacity: number;
    imageUrl: string | null;
  }) => void;
  onDelete: (id: string) => void;
}

export default function EditStorageModal({
  isOpen,
  onClose,
  storage,
  onSave,
  onDelete,
}: EditStorageModalProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState<StorageType>('Closet');
  const [customCapacity, setCustomCapacity] = useState<string>('20');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Sync state when storage changes or modal opens
  useEffect(() => {
    if (isOpen && storage) {
      setName(storage.name);
      setType(storage.type || 'Closet');
      setCustomCapacity(storage.capacity === 999 ? '' : storage.capacity.toString());
      setImageUrl(storage.imageUrl || null);
      setShowDeleteConfirm(false);
    }
  }, [isOpen, storage]);

  const capacity = useMemo(() => {
    const parsed = customCapacity.trim() === '' ? 999 : parseInt(customCapacity);
    return isNaN(parsed) ? 20 : parsed;
  }, [customCapacity]);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploading(true);
      try {
        const url = await uploadImageToStorage(file, 'storages');
        if (url) setImageUrl(url);
      } catch (err) {
        console.error('Storage edit image upload failed:', err);
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!storage || !name.trim()) return;

    onSave(storage.id, {
      name: name.trim(),
      type,
      capacity,
      imageUrl,
    });
    onClose();
  };

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = () => {
    if (storage) {
      onDelete(storage.id);
      onClose();
    }
  };

  if (!storage) return null;

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
            className="relative max-w-sm w-full bg-card rounded-2xl p-6 shadow-2xl z-10 border border-border-main/20 flex flex-col gap-4 font-sans text-xs"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-2 border-b border-border-main/10">
              <h3 className="text-sm font-bold text-primary flex items-center gap-1.5">
                Manage Storage: {storage.name}
              </h3>
              <button
                type="button"
                onClick={onClose}
                className="p-1 hover:bg-canvas rounded-full text-secondary transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {showDeleteConfirm ? (
              /* Delete Confirmation Overlay View */
              <div className="space-y-4 py-2">
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-start gap-2.5 text-rose-500">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-primary text-[11px]">Are you absolutely sure?</p>
                    <p className="text-[10px] text-secondary mt-1 leading-normal">
                      Deleting this cabinet will also permanently remove all its nested sub-containers, shelves, and cataloged items!
                    </p>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(false)}
                    className="h-8 px-4 rounded-full bg-canvas text-secondary font-bold hover:bg-canvas/80"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmDelete}
                    className="h-8 px-4 rounded-full bg-rose-500 text-white font-bold hover:bg-rose-600 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Confirm Delete
                  </button>
                </div>
              </div>
            ) : (
              /* Standard Edit Form */
              <form onSubmit={handleSave} className="space-y-4">
                {/* Rename */}
                <div className="space-y-1.5">
                  <label className="font-bold text-secondary">Storage Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Master Wardrobe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full h-9 px-3 bg-canvas/30 rounded-xl border border-border-main/40 focus:outline-none focus:bg-canvas focus:border-brand text-xs font-semibold"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Type */}
                  <div className="space-y-1.5">
                    <label className="font-bold text-secondary">Storage Type *</label>
                    <select
                      value={type}
                      onChange={(e) => setType(e.target.value as StorageType)}
                      className="w-full h-9 px-2 bg-canvas/30 rounded-xl border border-border-main/40 focus:outline-none focus:bg-canvas focus:border-brand text-xs font-semibold"
                    >
                      {STORAGE_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Max Capacity */}
                  <div className="space-y-1.5">
                    <label className="font-bold text-secondary">Max Item Limit</label>
                    <input
                      type="text"
                      placeholder="Unlimited"
                      value={customCapacity}
                      onChange={(e) => setCustomCapacity(e.target.value.replace(/\D/g, ''))}
                      className="w-full h-9 px-3 bg-canvas/30 rounded-xl border border-border-main/40 focus:outline-none focus:bg-canvas focus:border-brand text-xs font-semibold"
                    />
                  </div>
                </div>

                {/* Cabinet Picture */}
                <div className="space-y-1.5">
                  <label className="font-bold text-secondary block">Cabinet Photo</label>
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

                {/* Form Actions */}
                <div className="pt-3 border-t border-border-main/20 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={handleDeleteClick}
                    className="h-8.5 px-3 rounded-full bg-rose-500/10 text-rose-500 font-bold hover:bg-rose-500/20 flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete
                  </button>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={onClose}
                      className="h-8.5 px-3 rounded-full bg-canvas text-secondary font-bold hover:bg-canvas/80"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isUploading || !name.trim()}
                      className="h-8.5 px-3 rounded-full bg-brand text-brand-foreground font-bold hover:brightness-95 shadow-sm disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1"
                    >
                      <Save className="w-3.5 h-3.5" />
                      Save
                    </button>
                  </div>
                </div>
              </form>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
