'use client';

import { useState } from 'react';
import { StickyNote, Save } from 'lucide-react';

interface StickyPadProps {
  onSave?: (text: string) => void;
}

export default function StickyPad({ onSave }: StickyPadProps) {
  const [note, setNote] = useState('');

  const handleSave = () => {
    if (!note.trim()) return;
    if (onSave) {
      onSave(note);
      setNote('');
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <StickyNote className="w-4 h-4 text-sky-400" />
          <h3 className="text-sm font-semibold text-primary">Quick Notes</h3>
        </div>
      </div>
      
      <div className="relative">
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Jot down a quick reminder..."
          rows={5}
          className="w-full bg-canvas/40 rounded-xl p-4 text-xs text-primary placeholder:text-secondary/55 border-0 focus:outline-none focus:bg-canvas/70 resize-none transition-all duration-200 leading-relaxed shadow-inner"
        />
      </div>

      <div className="flex items-center justify-between pt-1">
        {note.length > 0 ? (
          <span className="text-[10px] text-secondary font-medium">
            {note.length} chars
          </span>
        ) : (
          <div />
        )}
        <button
          onClick={handleSave}
          disabled={!note.trim()}
          className="h-7 px-3 rounded-full bg-sky-500 hover:bg-sky-600 text-white text-[10px] font-bold shadow-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
        >
          <Save className="w-3 h-3" />
          Save Note
        </button>
      </div>
    </div>
  );
}
