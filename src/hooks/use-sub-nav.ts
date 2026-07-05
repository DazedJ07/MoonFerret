'use client';

import { useState, useCallback } from 'react';

export type SubNavTab = 'my-items' | 'my-outfits' | 'my-notes' | 'todo-list';

export function useSubNav(initialTab: SubNavTab = 'my-items') {
  const [activeTab, setActiveTab] = useState<SubNavTab>(initialTab);

  const switchTab = useCallback((tab: SubNavTab) => {
    setActiveTab(tab);
  }, []);

  return {
    activeTab,
    switchTab,
  };
}
