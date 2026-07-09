'use client';

import { motion, AnimatePresence } from 'motion/react';
import { X, Trash2, Shield, Plus, Minus, Tag } from 'lucide-react';
import { IndividualItem } from '@/data/types';

interface ItemDetailModalProps {
  item: IndividualItem | null;
  isOpen: boolean;
  onClose: () => void;
  onDelete: (itemId: string) => void;
  onQuantityAdjust: (itemId: string, direction: 'inc' | 'dec') => void;
}

export default function ItemDetailModal({
  item,
  isOpen,
  onClose,
  onDelete,
  onQuantityAdjust,
}: ItemDetailModalProps) {
  if (!item) return null;

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
            className="relative max-w-sm w-full bg-card rounded-2xl overflow-hidden shadow-2xl z-10 border border-border-main/20 flex flex-col font-sans"
          >
            {/* Close Button overlay */}
            <button
              onClick={onClose}
              className="absolute top-3 right-3 z-20 p-1.5 bg-black/30 hover:bg-black/50 rounded-full text-white backdrop-blur-sm transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>

            {/* Top Image Section */}
            <div className="relative h-48 bg-canvas/30 flex items-center justify-center border-b border-border-main/10 overflow-hidden p-4">
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
            <div className="p-5 space-y-4 flex-1">
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

              {/* Clothing Details Grid */}
              {item.itemType === 'clothing' && (
                <div className="bg-canvas/20 border border-border-main/10 rounded-xl p-3 space-y-2">
                  <span className="text-[10px] font-extrabold text-secondary tracking-wider uppercase block">
                    Clothing Metadata
                  </span>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                    {item.category && (
                      <div className="flex justify-between border-b border-border-main/5 pb-1">
                        <span className="text-secondary font-medium">Category</span>
                        <span className="text-primary font-bold">{item.category}</span>
                      </div>
                    )}
                    {item.subCategory && (
                      <div className="flex justify-between border-b border-border-main/5 pb-1">
                        <span className="text-secondary font-medium">Type</span>
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
              )}

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
            <div className="p-4 border-t border-border-main/10 bg-canvas/30 flex items-center justify-between gap-3">
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
                Delete Item
              </button>
              <button
                onClick={onClose}
                className="h-9 px-4 rounded-xl bg-brand text-brand-foreground font-bold hover:brightness-95 transition-all text-xs cursor-pointer"
              >
                Done
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
