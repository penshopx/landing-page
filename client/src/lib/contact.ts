/**
 * Centralized WhatsApp contact numbers for Gustafta.
 *
 * To rotate without redeploying, set the VITE_WA_CONTACT_PRIMARY and/or
 * VITE_WA_CONTACT_SECONDARY environment variables (international format,
 * no leading "+"). The values here are the hard-coded fallbacks.
 */

export const WA_CONTACT_NUMBER: string =
  (import.meta as any).env?.VITE_WA_CONTACT_PRIMARY ?? "6281287941900";

export const WA_CONTACT_NUMBER_2: string =
  (import.meta as any).env?.VITE_WA_CONTACT_SECONDARY ?? "6282299417818";

/** Display format (leading 0, Indonesian style) */
export const WA_CONTACT_DISPLAY: string = WA_CONTACT_NUMBER.replace(/^62/, "0");
export const WA_CONTACT_DISPLAY_2: string = WA_CONTACT_NUMBER_2.replace(/^62/, "0");

/** Base wa.me deep-links (no message text) */
export const WA_CONTACT_LINK: string = `https://wa.me/${WA_CONTACT_NUMBER}`;
export const WA_CONTACT_LINK_2: string = `https://wa.me/${WA_CONTACT_NUMBER_2}`;

/**
 * Build a wa.me deep-link with an optional pre-filled message.
 * @param text  Plain text message (will be encoded automatically).
 * @param secondary  If true, use the secondary number instead of the primary.
 */
export function waLink(text?: string, secondary = false): string {
  const base = secondary ? WA_CONTACT_LINK_2 : WA_CONTACT_LINK;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}
