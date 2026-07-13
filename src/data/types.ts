// ─────────────────────────────────────────────────────
// MoonFerret — Centralized Type Definitions
// ─────────────────────────────────────────────────────

// ── Classification Enums ──

export type ItemType = 'clothing' | 'item-accessory';

export type ClothingCategory =
  | 'Tops'
  | 'Bottoms'
  | 'Outerwear'
  | 'Footwear'
  | 'Accessories';

export type ItemCondition = 'Mint' | 'Good' | 'Worn';

export type StorageType =
  | 'Closet'
  | 'Drawer Set'
  | 'Open Shelf'
  | 'Heavy Bin'
  | 'Container'
  | 'Compartment';

export type StorageStatus = 'full' | 'has-spares' | 'empty';

// ── Core Data Interfaces ──

/** A physical space / room in the household */
export interface Space {
  id: string;
  name: string;
  slug?: string;
  icon?: string;
  description: string;
  imageCount: number;
  imageUrl?: string;
  dimensions?: string;
}

/**
 * A storage unit within a space.
 * Supports recursive parent→child hierarchy:
 *   Storage → Container → Compartment
 */
export interface StorageUnit {
  id: string;
  name: string;
  spaceId: string;
  spaceName: string;
  parentId: string | null;      // null = top-level storage
  totalItems: number;
  capacity: number;
  status: StorageStatus;
  imageUrl?: string;
  compartments?: number;
  type?: StorageType;
  children?: StorageUnit[];     // client-side computed tree (not persisted)
}

/**
 * An individual item stored in a storage unit.
 * Supports poly-classification:
 *   itemType = 'clothing'        → exposes category, subCategory, size, color, material, brand
 *   itemType = 'item-accessory'  → general item / accessory with name, description, quantity
 */
export interface IndividualItem {
  id: string;
  containerId: string;          // FK → StorageUnit.id
  name: string;
  description: string;
  imageUrl?: string;
  quantity: number;
  condition: ItemCondition;
  isSpare: boolean;
  itemType: ItemType;
  // Clothing-specific fields (only relevant when itemType === 'clothing')
  category?: string;
  subCategory?: string;         // e.g. 'T-Shirt', 'Jeans', 'Sneakers'
  size?: string;                // e.g. 'M', 'L', '42'
  color?: string;
  material?: string;
  brand?: string;
}

/** A curated outfit composed of heterogeneous items */
export interface Outfit {
  id: string;
  name: string;
  itemIds: string[];            // mixed clothing + accessory IDs
  imageUrl?: string;
  createdAt?: string;
}

/** A user note */
export interface Note {
  id: string;
  title: string;
  body: string;
  date: string;
}

/** A todo task */
export interface Todo {
  id: string;
  text: string;
  done: boolean;
  spaceId?: string;
  priority?: 'low' | 'medium' | 'high';
}

// ── Filter Constants ──

export const CLOTHING_CATEGORIES: ClothingCategory[] = [
  'Tops',
  'Bottoms',
  'Outerwear',
  'Footwear',
  'Accessories',
];

export const ITEM_CONDITIONS: ItemCondition[] = ['Mint', 'Good', 'Worn'];

export const STORAGE_TYPES: StorageType[] = [
  'Closet',
  'Drawer Set',
  'Open Shelf',
  'Heavy Bin',
  'Container',
  'Compartment',
];

/** Top-level storage types (Storage tier in Storage → Container → Compartment) */
export const TOP_LEVEL_STORAGE_TYPES: StorageType[] = [
  'Closet',
  'Drawer Set',
  'Open Shelf',
  'Heavy Bin',
];

export function isTopLevelStorageType(type: StorageType): boolean {
  return TOP_LEVEL_STORAGE_TYPES.includes(type);
}

/** Resolve eligible parent units for a given storage type within a space */
export function getEligibleParentStorages(
  type: StorageType,
  storages: StorageUnit[],
  spaceId: string | null
): StorageUnit[] {
  if (!spaceId || isTopLevelStorageType(type)) return [];

  const inSpace = storages.filter((su) => su.spaceId === spaceId);

  if (type === 'Container') {
    return inSpace.filter((su) => su.parentId === null);
  }

  if (type === 'Compartment') {
    return inSpace.filter((su) => su.type === 'Container');
  }

  return [];
}

/** Child tier auto-generated when compartments > 0 */
export function getAutoChildStorageType(
  parentType: StorageType,
  parentId: string | null
): StorageType {
  if (parentType === 'Compartment') return 'Compartment';
  if (parentType === 'Container' || parentId) return 'Compartment';
  return 'Container';
}

/** Build child storage rows for compartment stepper */
export function buildChildStorageUnits(
  parent: Pick<StorageUnit, 'id' | 'name' | 'spaceId' | 'spaceName'>,
  parentType: StorageType,
  parentId: string | null,
  compartments: number
): Omit<StorageUnit, 'id'>[] {
  if (parentType === 'Compartment' || compartments <= 0) return [];

  const childType = getAutoChildStorageType(parentType, parentId);
  const label = childType === 'Compartment' ? 'Compartment' : 'Container';

  return Array.from({ length: compartments }, (_, i) => ({
    name: `${parent.name} — ${label} ${i + 1}`,
    spaceId: parent.spaceId,
    spaceName: parent.spaceName,
    parentId: parent.id,
    totalItems: 0,
    capacity: 5,
    status: 'empty' as StorageStatus,
    type: childType,
  }));
}

export type CategoryFilter = 'All' | ClothingCategory;

export const CATEGORY_FILTERS: CategoryFilter[] = [
  'All',
  'Tops',
  'Bottoms',
  'Outerwear',
  'Footwear',
  'Accessories',
];

// ── Utility Helpers ──

/** Build a tree from a flat list of storage units by parentId */
export function buildStorageTree(units: StorageUnit[]): StorageUnit[] {
  const map = new Map<string, StorageUnit>();
  const roots: StorageUnit[] = [];

  // First pass: clone and index
  for (const unit of units) {
    map.set(unit.id, { ...unit, children: [] });
  }

  // Second pass: attach children
  for (const unit of map.values()) {
    if (unit.parentId && map.has(unit.parentId)) {
      map.get(unit.parentId)!.children!.push(unit);
    } else {
      roots.push(unit);
    }
  }

  return roots;
}

/** Compute storage status from totalItems and capacity */
export function computeStorageStatus(totalItems: number, capacity: number): StorageStatus {
  if (totalItems >= capacity) return 'full';
  if (totalItems > 0) return 'has-spares';
  return 'empty';
}

/** Get all descendant storage IDs (recursive) */
export function getDescendantIds(unitId: string, allUnits: StorageUnit[]): string[] {
  const ids: string[] = [];
  const children = allUnits.filter(u => u.parentId === unitId);
  for (const child of children) {
    ids.push(child.id);
    ids.push(...getDescendantIds(child.id, allUnits));
  }
  return ids;
}

/** Selected storage + all nested child/compartment IDs */
export function getContainerScopeIds(
  selectedStorageId: string,
  allUnits: StorageUnit[]
): string[] {
  return [selectedStorageId, ...getDescendantIds(selectedStorageId, allUnits)];
}

/** Resolve a flat container ID into parent → child → compartment dropdown values */
export function resolveStorageSelectionPath(
  containerId: string | null | undefined,
  allUnits: StorageUnit[]
): { parentId: string; childId: string; compartmentId: string } | null {
  if (!containerId) return null;

  const target = allUnits.find((u) => u.id === containerId);
  if (!target) return null;

  const chain: StorageUnit[] = [];
  let current: StorageUnit | undefined = target;
  while (current) {
    chain.unshift(current);
    current = current.parentId
      ? allUnits.find((u) => u.id === current!.parentId)
      : undefined;
  }

  return {
    parentId: chain[0]?.id ?? '',
    childId: chain[1]?.id ?? '',
    compartmentId: chain[2]?.id ?? '',
  };
}
