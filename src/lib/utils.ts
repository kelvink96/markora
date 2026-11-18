import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Joins class names and resolves Tailwind conflicts (the last one wins), as shadcn components expect. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
