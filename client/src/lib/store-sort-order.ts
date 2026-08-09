/**
 * Helpers for store product sort-order state management.
 *
 * Extracted from admin.tsx so they can be imported by tests — keeping the
 * test coupled to production logic so any regression (e.g. reintroducing the
 * `if (storeProducts.length > 0)` guard) is caught immediately.
 */

export interface SortableProduct {
  id: number;
  sortOrder: number;
}

/**
 * Sort a fresh server snapshot into display order.
 *
 * Called inside useEffect whenever `storeProducts` changes.  The old version
 * had a `if (storeProducts.length > 0)` guard that prevented clearing
 * `orderedProducts` when the last product was deleted, causing stale state.
 * This version always syncs — including the empty case.
 */
export function syncOrderedProducts<T extends SortableProduct>(serverProducts: T[]): T[] {
  return [...serverProducts].sort((a, b) => (a.sortOrder - b.sortOrder) || (a.id - b.id));
}

/**
 * Compute the next sort-order value for a new product.
 *
 * Returns max(existing sortOrders) + 10, or 10 when the list is empty.
 */
export function computeNextSortOrder(products: SortableProduct[]): number {
  const maxOrder = products.length > 0
    ? Math.max(...products.map((p) => p.sortOrder ?? 0))
    : 0;
  return maxOrder + 10;
}
