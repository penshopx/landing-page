/**
 * Centralized WhatsApp contact numbers for Gustafta.
 *
 * Runtime values come from GET /api/config/contact (backed by the DB or env).
 * Admin can rotate numbers via the admin panel (Tools tab) without redeploying.
 * The constants below are compile-time fallbacks used where React hooks are unavailable.
 */
import { useQuery } from "@tanstack/react-query";

// ── Static fallbacks (build-time, used in non-React contexts) ────────────────
const _FALLBACK_PRIMARY = "6281287941900";
const _FALLBACK_SECONDARY = "6282299417818";

export const WA_CONTACT_NUMBER: string =
  (import.meta as any).env?.VITE_WA_CONTACT_PRIMARY ?? _FALLBACK_PRIMARY;

export const WA_CONTACT_NUMBER_2: string =
  (import.meta as any).env?.VITE_WA_CONTACT_SECONDARY ?? _FALLBACK_SECONDARY;

/** Display format (leading 0, Indonesian style) */
export const WA_CONTACT_DISPLAY: string = WA_CONTACT_NUMBER.replace(/^62/, "0");
export const WA_CONTACT_DISPLAY_2: string = WA_CONTACT_NUMBER_2.replace(/^62/, "0");

/** Base wa.me deep-links (no message text) */
export const WA_CONTACT_LINK: string = `https://wa.me/${WA_CONTACT_NUMBER}`;
export const WA_CONTACT_LINK_2: string = `https://wa.me/${WA_CONTACT_NUMBER_2}`;

/**
 * Build a wa.me deep-link with an optional pre-filled message.
 * Uses static fallback values — prefer useContactNumbers().waLink for runtime-accurate links.
 */
export function waLink(text?: string, secondary = false): string {
  const base = secondary ? WA_CONTACT_LINK_2 : WA_CONTACT_LINK;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}

// ── Runtime hook ─────────────────────────────────────────────────────────────

export interface ContactNumbers {
  primary: string;
  secondary: string;
  display: string;
  display2: string;
  link: string;
  link2: string;
  waLink: (text?: string, secondary?: boolean) => string;
}

/**
 * React hook — fetches WA contact numbers from /api/config/contact at runtime.
 * Values are cached for 1 hour; stale cache is reused while a background refresh runs.
 * Falls back to static build-time constants while loading or on error.
 *
 * Use this hook anywhere the numbers appear in the UI so that admin rotations
 * take effect without a redeploy.
 */
export function useContactNumbers(): ContactNumbers {
  const { data } = useQuery<{ primary: string; secondary: string }>({
    queryKey: ["/api/config/contact"],
    staleTime: 60 * 60 * 1000,      // 1 hour — reuse cached value
    gcTime: 2 * 60 * 60 * 1000,     // evict from cache after 2 hours of disuse
    refetchOnWindowFocus: false,
  });

  const primary = data?.primary ?? WA_CONTACT_NUMBER;
  const secondary = data?.secondary ?? WA_CONTACT_NUMBER_2;
  const display = primary.replace(/^62/, "0");
  const display2 = secondary.replace(/^62/, "0");
  const link = `https://wa.me/${primary}`;
  const link2 = `https://wa.me/${secondary}`;

  return {
    primary,
    secondary,
    display,
    display2,
    link,
    link2,
    waLink: (text?: string, sec = false) => {
      const base = sec ? link2 : link;
      return text ? `${base}?text=${encodeURIComponent(text)}` : base;
    },
  };
}
