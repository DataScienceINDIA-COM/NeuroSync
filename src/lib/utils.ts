import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateId(): string {
  // A simple ID generator, replace with a more robust one like UUID if needed for production.
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}
