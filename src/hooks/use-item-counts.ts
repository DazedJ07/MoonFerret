'use client';

import { useState, useCallback } from 'react';
import { containerItems } from '@/data/mock-data';

export function useItemCounts() {
  const [counts, setCounts] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    containerItems.forEach(item => {
      initial[item.id] = item.itemCount;
    });
    return initial;
  });

  const increment = useCallback((id: string) => {
    setCounts(prev => ({
      ...prev,
      [id]: (prev[id] ?? 0) + 1,
    }));
  }, []);

  const decrement = useCallback((id: string) => {
    setCounts(prev => ({
      ...prev,
      [id]: Math.max((prev[id] ?? 0) - 1, 0),
    }));
  }, []);

  const getCount = useCallback((id: string): number => {
    return counts[id] ?? 0;
  }, [counts]);

  return {
    counts,
    increment,
    decrement,
    getCount,
  };
}
