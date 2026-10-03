import type { EventCategory } from "@workspace/api-client-react";

export const MAX_SELECTED_CATEGORIES = 4;

export function toggleCategory(selected: readonly EventCategory[], category: EventCategory): EventCategory[] {
  if (selected.includes(category)) return selected.filter(value => value !== category);
  return selected.length < MAX_SELECTED_CATEGORIES ? [...selected, category] : [...selected];
}

export function matchesCategories(category: EventCategory, selected: readonly EventCategory[]): boolean {
  return selected.length === 0 || selected.includes(category);
}

// Keep the existing API's single-category optimization; multi-selection uses
// the complete search/year/date result and applies an OR filter locally.
export function serverCategory(selected: readonly EventCategory[]): EventCategory | undefined {
  return selected.length === 1 ? selected[0] : undefined;
}