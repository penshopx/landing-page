import { X, ShoppingCart, Trash2, Plus, Minus, CreditCard, CheckSquare, Square, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/hooks/use-cart";
import { useToast } from "@/hooks/use-toast";

function formatPrice(n: number) {
  return "Rp " + n.toLocaleString("id-ID");
}

export function CartDrawer() {
  const {
    items, isOpen, closeCart, removeItem, updateQty,
    toggleSelect, selectAll, deselectAll,
    selectedTotal, selectedCount, buildCheckoutUrl, clearCart,
  } = useCart();
  const { toast } = useToast();

  const handleCheckout = () => {
    const selected = items.filter(i => i.selected);
    if (selected.length === 0) {
      toast({ title: "Pilih produk dulu", description: "Centang minimal satu produk untuk checkout.", variant: "destructive" });
      return;
    }

    // Items with Scalev variant → checkout via Scalev
    const scalevItems = selected.filter(i => i.scalevVariantId);
    if (scalevItems.length > 0) {
      const url = buildCheckoutUrl();
      if (url) window.open(url, "_blank");
    }

    // Items without Scalev variant → WA inquiry
    const waItems = selected.filter(i => !i.scalevVariantId);
    if (waItems.length > 0) {
      const list = waItems.map(i => `- ${i.name} (${formatPrice(i.price)})`).join("%0A");
      const msg = encodeURIComponent(`Halo, saya ingin membeli:\n`) + list + encodeURIComponent(`\n\nMohon info cara pembelian.`);
      window.open(`https://wa.me/6282299417818?text=${msg}`, "_blank");
    }
  };

  const allSelected = items.length > 0 && items.every(i => i.selected);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-50 transition-opacity"
        onClick={closeCart}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white z-50 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-violet-600" />
            <span className="font-semibold text-gray-900">Keranjang Belanja</span>
            {items.length > 0 && (
              <Badge className="bg-violet-100 text-violet-700 border-violet-200 text-xs px-2 py-0.5">
                {items.length} produk
              </Badge>
            )}
          </div>
          <button onClick={closeCart} className="text-gray-400 hover:text-gray-700 transition-colors p-1">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Empty state */}
        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-gray-400 px-8">
            <ShoppingCart className="h-16 w-16 text-gray-200" />
            <div className="text-center">
              <p className="font-medium text-gray-500 mb-1">Keranjang masih kosong</p>
              <p className="text-sm">Tambahkan produk dari Store untuk mulai berbelanja</p>
            </div>
            <Button variant="outline" onClick={closeCart} className="mt-2">Lihat Produk</Button>
          </div>
        ) : (
          <>
            {/* Select all bar */}
            <div className="flex items-center justify-between px-5 py-2.5 bg-gray-50 border-b border-gray-100">
              <button
                onClick={allSelected ? deselectAll : selectAll}
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-violet-700 transition-colors"
              >
                {allSelected
                  ? <CheckSquare className="h-4 w-4 text-violet-600" />
                  : <Square className="h-4 w-4" />}
                <span>{allSelected ? "Batal Pilih Semua" : "Pilih Semua"}</span>
              </button>
              <button
                onClick={clearCart}
                className="text-xs text-red-400 hover:text-red-600 transition-colors flex items-center gap-1"
              >
                <Trash2 className="h-3.5 w-3.5" />Kosongkan
              </button>
            </div>

            {/* Items list */}
            <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
              {items.map(item => (
                <div key={item.id} className={`flex gap-3 px-5 py-4 transition-colors ${item.selected ? "bg-white" : "bg-gray-50/50 opacity-70"}`}>
                  {/* Checkbox */}
                  <button
                    onClick={() => toggleSelect(item.id)}
                    className="mt-1 flex-shrink-0"
                    title={item.selected ? "Batalkan pilihan" : "Pilih untuk checkout"}
                  >
                    {item.selected
                      ? <CheckSquare className="h-5 w-5 text-violet-600" />
                      : <Square className="h-5 w-5 text-gray-400" />}
                  </button>

                  {/* Emoji icon */}
                  <div className="w-11 h-11 rounded-xl bg-violet-50 flex items-center justify-center text-xl flex-shrink-0 border border-violet-100">
                    {item.emoji}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 leading-snug line-clamp-2">{item.name}</p>
                    <p className="text-sm font-bold text-violet-700 mt-1">{formatPrice(item.price)}</p>
                    {!item.scalevVariantId && (
                      <p className="text-xs text-amber-600 mt-0.5">⚠ Hubungi kami untuk pembelian</p>
                    )}
                  </div>

                  {/* Qty controls + remove */}
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-gray-300 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => updateQty(item.id, item.qty - 1)}
                        disabled={item.qty <= 1}
                        className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:border-violet-400 hover:text-violet-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-7 text-center text-sm font-medium text-gray-900">{item.qty}</span>
                      <button
                        onClick={() => updateQty(item.id, item.qty + 1)}
                        className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:border-violet-400 hover:text-violet-600 transition-colors"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer / Checkout */}
            <div className="border-t border-gray-100 px-5 py-4 bg-white space-y-3">
              {/* Summary */}
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  {selectedCount > 0
                    ? `${selectedCount} produk dipilih`
                    : <span className="text-amber-600 text-xs">Centang produk untuk checkout</span>}
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400">Total dipilih</p>
                  <p className="font-bold text-gray-900 text-lg">{formatPrice(selectedTotal)}</p>
                </div>
              </div>

              {/* Note: qty=1 for license products */}
              <p className="text-xs text-gray-400 leading-relaxed">
                Lisensi AI Specialist = sekali bayar per produk. Checkout akan diarahkan ke halaman pembayaran Scalev — QRIS, transfer bank, e-wallet tersedia.
              </p>

              <Button
                onClick={handleCheckout}
                disabled={selectedCount === 0}
                className="w-full bg-violet-600 hover:bg-violet-700 text-white h-12 text-sm font-semibold gap-2 disabled:opacity-40"
              >
                <CreditCard className="h-4 w-4" />
                Checkout {selectedCount > 0 ? `(${selectedCount} produk)` : ""}
                <ExternalLink className="h-3.5 w-3.5 ml-auto" />
              </Button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
