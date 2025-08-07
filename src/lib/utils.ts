import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function isColorDark(hexColor: string): boolean {
  if (!hexColor || hexColor.length < 4) return false;

  let c = hexColor.substring(1); // strip #
  if (c.length === 3) {
    c = c.split('').map(char => char + char).join('');
  }
  if (c.length !== 6) {
    return false;
  }
  
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  
  // Formula from http://www.w3.org/TR/AERT#color-contrast
  const brightness = ((r * 299) + (g * 587) + (b * 114)) / 1000;
  
  return brightness < 128;
}
