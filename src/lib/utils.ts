import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Consistently capitalizes person names across the application.
 * e.g., "Muthu saran K" -> "Muthu Saran K", "tamil selvan" -> "Tamil Selvan"
 */
export function formatPersonName(name?: string | null): string {
  if (!name || typeof name !== 'string') return '';
  const trimmed = name.trim();
  if (!trimmed) return '';

  return trimmed
    .split(/\s+/)
    .map(word => {
      // Handle hyphenated words like Mary-Jane
      if (word.includes('-')) {
        return word
          .split('-')
          .map(part => part ? part.charAt(0).toUpperCase() + part.slice(1).toLowerCase() : '')
          .join('-');
      }
      // Handle apostrophe words like O'Connor
      if (word.includes("'")) {
        return word
          .split("'")
          .map(part => part ? part.charAt(0).toUpperCase() + part.slice(1).toLowerCase() : '')
          .join("'");
      }
      // Single letter initials like K or k.
      if (word.length === 1 || (word.length === 2 && word.endsWith('.'))) {
        return word.toUpperCase();
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
}

/**
 * Extracts clean 2-letter uppercase initials from a person's name.
 */
export function getInitials(name?: string | null): string {
  if (!name || typeof name !== 'string') return 'UN';
  const cleanName = name.replace(/^Owner\s+/i, '').trim();
  const parts = cleanName.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'UN';
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[1][0]).toUpperCase();
}
