'use client';

import { useState, useCallback } from 'react';

export type ViewId = 'dashboard' | 'my-room' | 'kitchen' | 'comfort-room' | 'living-room';

export function useNavigation(initialView: ViewId = 'dashboard') {
  const [activeView, setActiveView] = useState<ViewId>(initialView);

  const navigate = useCallback((view: ViewId) => {
    setActiveView(view);
  }, []);

  const isSpaceView = activeView !== 'dashboard';

  return {
    activeView,
    navigate,
    isSpaceView,
  };
}
