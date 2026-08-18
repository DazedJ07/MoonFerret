# MoonFerret — Wardrobe & Storage Refactor Walkthrough

## Completed Refactoring Tasks

1. **Recursive Sub-Storage Relations ($Storage \rightarrow Container \rightarrow Compartment$)**:
   - Modified storage data structures in [`src/data/types.ts`](file:///C:/Users/Jian%20Medina/Desktop/LaMoon/src/data/types.ts) to support hierarchical nesting via a `parentId` field.
   - Restructured [`src/components/views/dashboard-view.tsx`](file:///C:/Users/Jian%20Medina/Desktop/LaMoon/src/components/views/dashboard-view.tsx) to render only top-level storages initially, allowing one-click drill-down navigation into sub-containers and compartments, accompanied by a dynamic path breadcrumbs bar.
   - Cascade-deletes all sub-storages and nested child items automatically inside the local state and Supabase tables.

2. **Unified Poly-Classification Asset Flow**:
   - Created a standalone modal [`src/components/modals/add-asset-modal.tsx`](file:///C:/Users/Jian%20Medina/Desktop/LaMoon/src/components/modals/add-asset-modal.tsx) featuring a segmented control toggle between `[Clothing Item]` and `[Item/Accessory]`.
   - Conditionally renders relevant metadata form inputs (category, sub-category, size, color, material, brand) for apparel vs general assets.
   - Implements **Dynamic Dependent Dropdowns** which dynamically filter child containers and compartments based on parent storage selections.

3. **Omni-Outfit Builder**:
   - Extracted and refactored the outfit compiler into a standalone modal [`src/components/modals/outfit-builder.tsx`](file:///C:/Users/Jian%20Medina/Desktop/LaMoon/src/components/modals/outfit-builder.tsx).
   - Allows users to compile curated outfits from a heterogeneous mix of clothing items and accessories.
   - Syncs saved outfits and outfit-to-item associations directly to Supabase (`outfits` and `outfit_items` tables).

4. **Permanent Cloud Image Pipeline**:
   - Eliminated all local `URL.createObjectURL` session blob URLs to prevent images vanishing on reload.
   - Image selections trigger direct uploads to the `moonferret-images` bucket on Supabase, resolving public URLs before DB records are committed.
   - Features upload loading indicators to prevent double-submits.

5. **Defensive Viewport Resilience & Responsiveness**:
   - Changed rigid pixel widths to fluid flex/grid layouts with `min-width: 0` constraints to eliminate text/image blowout on window resizing.
   - Added an AnimatePresence-wrapped mobile sidebar drawer overlay inside [`src/app/page.tsx`](file:///C:/Users/Jian%20Medina/Desktop/LaMoon/src/app/page.tsx) that slides in from the left on mobile screens when the header hamburger menu is clicked.
   - Styled the sub-nav pills and category filter pills to scroll horizontally on mobile with custom `scrollbar-hide` classes.

6. **Animated List Grid**:
   - Integrated a staggered entrance layout transition container [`src/components/dashboard/animated-list.tsx`](file:///C:/Users/Jian%20Medina/Desktop/LaMoon/src/components/dashboard/animated-list.tsx) for items, ensuring layout animations do not cause frame drops or lazy-loading jank.

7. **Granular Category Filters**:
   - Expanded navigation with the standalone [`src/components/pill-filter-nav.tsx`](file:///C:/Users/Jian%20Medina/Desktop/LaMoon/src/components/pill-filter-nav.tsx) component.
   - Instantly slices inventory items by `All`, `Tops`, `Bottoms`, `Outerwear`, `Footwear`, or `Accessories` with reactive badge count indicators.

8. **Seamless Light & Dark Theme Toggling**:
   - Added support for dark mode class toggles on the HTML element by defining `.dark` variables in [`src/app/globals.css`](file:///C:/Users/Jian%20Medina/Desktop/LaMoon/src/app/globals.css) that override surface colors (`--bg-canvas`, `--bg-card`, `--border-main`, `--text-primary`, `--text-secondary`).
   - Implemented global focused-input theme rules for selects, inputs, and textareas inside dark mode to prevent bright white flash overlaps.
   - Integrated the credential gateway [`src/components/auth-gateway.tsx`](file:///C:/Users/Jian%20Medina/Desktop/LaMoon/src/components/auth-gateway.tsx) to adapt to active color brand tints and light/dark modes cohesively.

12. **Vite Migration & 3D Carousel Integration**:
    - **Next.js to Vite Migration**: Migrated the single-page application framework from Next.js to Vite, speeding up local start-up and build times significantly.
    - **Tailwind CSS v4 Integration**: Native integration using `@tailwindcss/vite` plugin to resolve compiled stylesheets directly within the bundle rather than relying on external PostCSS configs.
    - **Lightswind 3D Carousel**: Integrated `ThreeDImageCarousel` under [3d-image-carousel.tsx](file:///c:/Users/Jian%20Medina/Desktop/LaMoon/src/components/lightswind/3d-image-carousel.tsx), customized to render structured room cards with overlapping 3D cascade scaling and swipe controls. Used in `dashboard-view.tsx` and `space-view.tsx`.
    - **Layout & Transition Smoothing**: Removed the bulky grey double-bordered box wrapper to let the carousel cards float natively on the page. Sync'ed the transition keys in `MainContent` to prevent the carousel from unmounting and remounting on slide changes, achieving seamless butter-smooth sliding. Added depth of field grayscale and blur filters for inactive slides to make the active slide pop.
    - **Size & Navigation Refinement**: Scaled up card sizes by ~30% (active cards: `450px x 280px`) and centered the carousel navigation arrow buttons closer to the active slide. Added mouse wheel / trackpad scroll navigation support (using debounced native non-passive event listeners to prevent accidental page scroll).
    - **Sidebar Consolidation**: Removed the top pill SubNav navigation bar entirely. Created unified sidebar sections: "Workspace" (housing Dashboard, My Outfits, My Notes, and Todo List) and "Spaces" (dynamic listing of user-created rooms with the `+` add button and trash options intact).
    - **Editable Spaces (Images & Photos)**: Added a "Space Background Image" file uploader to the "Customize Space" modal in [`dashboard-view.tsx`](file:///c:/Users/Jian%20Medina/Desktop/LaMoon/src/components/views/dashboard-view.tsx). Users can now select and upload new image assets to Supabase storage to update space backgrounds, view uploaded preview thumbnails, and reset or delete space photos.
    - **Pinterest-Style Masonry Layout**: Created a GSAP-driven responsive [Masonry.tsx](file:///c:/Users/Jian%20Medina/Desktop/LaMoon/src/components/ui/Masonry.tsx) grid thumbnail view to layout inventory assets dynamically with staggered height tiles. Added a layout switch toggle in the catalog items header to transition seamlessly between List View and Pinterest Grid, displaying full-color pictures with item names printed clearly underneath, and supporting detail-modal click overrides for instant edit operations. Added full aspect-ratio rendering support that honors the `#contain` image settings (scaling images inside tiles using `object-contain` rather than cropping them).
    - **Outfit Builder Stacking Order**: Wrapped the Outfit Builder modal in a React Portal (`createPortal`) targeting `document.body` and elevated its container `z-index` to `z-[100]`. This completely escapes the transform stacking context created by parent tab animation containers, keeping the Outfit Builder fully visible and centered on the screen without overlapping behind the sticky header. All other space/drawer modals were reverted back to their original scopes as requested.
    - **Surprise Tab (Monthsary Celebration & Gallery)**: Added a "Surprise 💖" workspace tab linked to [`surprise-view.tsx`](file:///c:/Users/Jian%20Medina/Desktop/LaMoon/src/components/views/surprise-view.tsx). This tab contains:
      - 💌 An interactive unfolding heart monthsary letter addressed *"To my Dearest Khayzilene"* in italics, featuring a customized romantic letter from Bebi Jc with a bold, red final I Love You declaration.
      - 📸 A GSAP-powered, full-color responsive accordion photo and video gallery (*July and August*) referencing assets inside `src/Motmot` (including `.jpg` photo cards and an auto-playing, looping `.mp4` video panel).
      - 🎵 An embedded YouTube song of the month player ("Stand By Me" by Oasis) with a personalized note card underneath.

---

## Technical Specifications

### Central Types Schema
```typescript
export interface StorageUnit {
  id: string;
  name: string;
  spaceId: string;
  spaceName: string;
  parentId: string | null;
  totalItems: number;
  capacity: number;
  status: StorageStatus;
  imageUrl?: string;
  type?: StorageType;
}

export interface IndividualItem {
  id: string;
  containerId: string;
  name: string;
  description: string;
  imageUrl?: string;
  quantity: number;
  condition: ItemCondition;
  isSpare: boolean;
  itemType: ItemType;
  category?: ClothingCategory;
  subCategory?: string;
  size?: string;
  color?: string;
  material?: string;
  brand?: string;
}
```

### Verification
- Production build successfully completed (`npm run build`)
- Statically generated page data check passed with zero type errors.
