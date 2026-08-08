// Base URL toko pembayaran (Scalev storefront).
// Migrasi domain berikutnya cukup ganti env VITE_PAYMENT_BASE_URL — tanpa sentuh kode.
export const PAYMENT_BASE_URL =
  (import.meta.env.VITE_PAYMENT_BASE_URL as string | undefined) || "https://bayar.dokumenproyek.com";
