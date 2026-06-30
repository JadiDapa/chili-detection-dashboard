import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Generate a unique id. `crypto.randomUUID()` only exists in secure contexts
 * (HTTPS or localhost); when the app is served over plain HTTP at a raw IP it's
 * undefined and throws. Fall back to a non-cryptographic id in that case.
 */
export function uid(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID()
  }
  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
}
