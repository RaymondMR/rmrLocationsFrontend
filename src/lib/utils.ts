import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merges Tailwind CSS classes with clsx and tailwind-merge.
 * This is the standard utility for conditional classes in premium React apps.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
