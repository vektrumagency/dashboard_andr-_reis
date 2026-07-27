import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Compõe classes Tailwind condicionalmente e resolve conflitos (ex: dois "px-*"). */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
