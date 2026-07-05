// Types
export interface Space {
  id: string;
  name: string;
  slug: string;
  icon: string; // lucide icon name
  description: string;
  imageCount: number;
  imageUrl?: string;
  dimensions?: string;
}

export interface StorageUnit {
  id: string;
  name: string;
  spaceId: string;
  spaceName: string;
  totalItems: number;
  capacity: number;
  status: 'full' | 'has-spares' | 'empty';
}

export interface SpareItem {
  id: string;
  name: string;
  containerName: string;
  spaceId: string;
  quantity: number;
}

export interface Metrics {
  totalItems: number;
  storageUnits: number;
  spareItems: number;
  defectiveItems: number;
  utilizationPercent: number;
}

export interface ContainerItem {
  id: string;
  name: string;
  spaceId: string;
  description: string;
  itemCount: number;
  icon: string;
}

// Data
export const spaces: Space[] = [
  { id: 'my-room', name: 'My Room', slug: 'my-room', icon: 'BedDouble', description: 'Personal bedroom and workspace', imageCount: 3 },
  { id: 'kitchen', name: 'Kitchen', slug: 'kitchen', icon: 'CookingPot', description: 'Cooking and dining area', imageCount: 2 },
  { id: 'comfort-room', name: 'Comfort Room', slug: 'comfort-room', icon: 'Bath', description: 'Bathroom and personal care', imageCount: 2 },
  { id: 'living-room', name: 'Living Room', slug: 'living-room', icon: 'Sofa', description: 'Family entertainment space', imageCount: 3 },
];

export const storageUnits: StorageUnit[] = [
  { id: 'su-1', name: 'Main Clothes Cabinet', spaceId: 'my-room', spaceName: 'My Room', totalItems: 34, capacity: 40, status: 'has-spares' },
  { id: 'su-2', name: 'Desk Drawer Set', spaceId: 'my-room', spaceName: 'My Room', totalItems: 18, capacity: 18, status: 'full' },
  { id: 'su-3', name: 'Bookshelf Unit', spaceId: 'my-room', spaceName: 'My Room', totalItems: 22, capacity: 30, status: 'has-spares' },
  { id: 'su-4', name: 'Upper Kitchen Cabinet', spaceId: 'kitchen', spaceName: 'Kitchen', totalItems: 28, capacity: 28, status: 'full' },
  { id: 'su-5', name: 'Lower Kitchen Cabinet', spaceId: 'kitchen', spaceName: 'Kitchen', totalItems: 15, capacity: 25, status: 'has-spares' },
  { id: 'su-6', name: 'Pantry Shelf', spaceId: 'kitchen', spaceName: 'Kitchen', totalItems: 0, capacity: 20, status: 'empty' },
  { id: 'su-7', name: 'Medicine Cabinet', spaceId: 'comfort-room', spaceName: 'Comfort Room', totalItems: 12, capacity: 15, status: 'has-spares' },
  { id: 'su-8', name: 'Under-Sink Storage', spaceId: 'comfort-room', spaceName: 'Comfort Room', totalItems: 8, capacity: 8, status: 'full' },
  { id: 'su-9', name: 'TV Console Drawer', spaceId: 'living-room', spaceName: 'Living Room', totalItems: 0, capacity: 12, status: 'empty' },
  { id: 'su-10', name: 'Display Shelf', spaceId: 'living-room', spaceName: 'Living Room', totalItems: 5, capacity: 16, status: 'has-spares' },
];

export const containerItems: ContainerItem[] = [
  { id: 'ci-1', name: 'Main Clothes Cabinet', spaceId: 'my-room', description: 'Wardrobe with 3 sections', itemCount: 34, icon: 'ShirtIcon' },
  { id: 'ci-2', name: 'Desk Setup', spaceId: 'my-room', description: 'Work desk with drawers', itemCount: 18, icon: 'Monitor' },
  { id: 'ci-3', name: 'Bookshelf Unit', spaceId: 'my-room', description: '5-tier bookshelf', itemCount: 22, icon: 'BookOpen' },
  { id: 'ci-4', name: 'Upper Kitchen Cabinet', spaceId: 'kitchen', description: 'Wall-mounted cabinet', itemCount: 28, icon: 'ChefHat' },
  { id: 'ci-5', name: 'Lower Kitchen Cabinet', spaceId: 'kitchen', description: 'Under-counter storage', itemCount: 15, icon: 'UtensilsCrossed' },
  { id: 'ci-6', name: 'Pantry Shelf', spaceId: 'kitchen', description: 'Food storage area', itemCount: 0, icon: 'Package' },
  { id: 'ci-7', name: 'Medicine Cabinet', spaceId: 'comfort-room', description: 'Wall-mounted mirror cabinet', itemCount: 12, icon: 'Cross' },
  { id: 'ci-8', name: 'Under-Sink Storage', spaceId: 'comfort-room', description: 'Cleaning supplies area', itemCount: 8, icon: 'Droplets' },
  { id: 'ci-9', name: 'TV Console Drawer', spaceId: 'living-room', description: 'Media console with 3 drawers', itemCount: 0, icon: 'Tv' },
  { id: 'ci-10', name: 'Display Shelf', spaceId: 'living-room', description: 'Decorative display unit', itemCount: 5, icon: 'Frame' },
];

export const spareItems: SpareItem[] = [
  { id: 'sp-1', name: 'Light Bulbs (LED)', containerName: 'Desk Drawer Set', spaceId: 'my-room', quantity: 4 },
  { id: 'sp-2', name: 'USB Cables', containerName: 'Desk Drawer Set', spaceId: 'my-room', quantity: 3 },
  { id: 'sp-3', name: 'Trash Bags (Roll)', containerName: 'Lower Kitchen Cabinet', spaceId: 'kitchen', quantity: 2 },
  { id: 'sp-4', name: 'Sponges', containerName: 'Lower Kitchen Cabinet', spaceId: 'kitchen', quantity: 5 },
  { id: 'sp-5', name: 'Hand Soap Refill', containerName: 'Under-Sink Storage', spaceId: 'comfort-room', quantity: 1 },
  { id: 'sp-6', name: 'Toothbrush Heads', containerName: 'Medicine Cabinet', spaceId: 'comfort-room', quantity: 2 },
  { id: 'sp-7', name: 'AA Batteries', containerName: 'TV Console Drawer', spaceId: 'living-room', quantity: 6 },
  { id: 'sp-8', name: 'Coat Hangers', containerName: 'Main Clothes Cabinet', spaceId: 'my-room', quantity: 8 },
];

export const metrics: Metrics = {
  totalItems: 142,
  storageUnits: 10,
  spareItems: 18,
  defectiveItems: 3,
  utilizationPercent: 73,
};

export function getSpaceStorageUnits(spaceId: string): StorageUnit[] {
  return storageUnits.filter(u => u.spaceId === spaceId);
}

export function getSpaceContainers(spaceId: string): ContainerItem[] {
  return containerItems.filter(c => c.spaceId === spaceId);
}

export function getSpaceSpares(spaceId: string): SpareItem[] {
  return spareItems.filter(s => s.spaceId === spaceId);
}

export function getSpaceById(spaceId: string): Space | undefined {
  return spaces.find(s => s.id === spaceId);
}
