import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";

export interface CartItem {
  id: string;          // sp-{productId} or agent-{agentId}
  productId?: number;
  agentId?: number;
  name: string;
  price: number;
  emoji: string;
  scalevVariantId?: number | null;
  qty: number;
  selected: boolean;   // checkbox in cart
}

interface CartContextType {
  items: CartItem[];
  totalItems: number;
  selectedTotal: number;
  selectedCount: number;
  addItem: (item: Omit<CartItem, "qty" | "selected">) => void;
  removeItem: (id: string) => void;
  updateQty: (id: string, qty: number) => void;
  toggleSelect: (id: string) => void;
  selectAll: () => void;
  deselectAll: () => void;
  clearCart: () => void;
  buildCheckoutUrl: () => string | null;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
}

const CartContext = createContext<CartContextType | null>(null);
const STORAGE_KEY = "gustafta_cart_v1";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  });
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); } catch {}
  }, [items]);

  const addItem = useCallback((item: Omit<CartItem, "qty" | "selected">) => {
    setItems(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, { ...item, qty: 1, selected: true }];
    });
    setIsOpen(true);
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
  }, []);

  const updateQty = useCallback((id: string, qty: number) => {
    if (qty < 1) return;
    setItems(prev => prev.map(i => i.id === id ? { ...i, qty } : i));
  }, []);

  const toggleSelect = useCallback((id: string) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, selected: !i.selected } : i));
  }, []);

  const selectAll = useCallback(() => {
    setItems(prev => prev.map(i => ({ ...i, selected: true })));
  }, []);

  const deselectAll = useCallback(() => {
    setItems(prev => prev.map(i => ({ ...i, selected: false })));
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const buildCheckoutUrl = useCallback((): string | null => {
    const selected = items.filter(i => i.selected && i.scalevVariantId);
    if (!selected.length) return null;
    const variantIds = selected.map(i => i.scalevVariantId).join(",");
    const qtys = selected.map(i => String(i.qty)).join(",");
    return `https://bayar.gustafta.my.id/c/checkout?variant_ids=${variantIds}&qty=${qtys}`;
  }, [items]);

  const totalItems = items.reduce((sum, i) => sum + i.qty, 0);
  const selectedTotal = items.filter(i => i.selected).reduce((sum, i) => sum + i.price * i.qty, 0);
  const selectedCount = items.filter(i => i.selected).length;

  return (
    <CartContext.Provider value={{
      items, totalItems, selectedTotal, selectedCount,
      addItem, removeItem, updateQty, toggleSelect,
      selectAll, deselectAll, clearCart, buildCheckoutUrl,
      isOpen, openCart: () => setIsOpen(true), closeCart: () => setIsOpen(false),
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be inside CartProvider");
  return ctx;
}
