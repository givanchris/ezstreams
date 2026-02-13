/**
 * Shared navigation utilities.
 * Centralizes search submission so every entry point behaves identically.
 */

import type { NavigateFunction } from "react-router-dom";

/**
 * Navigate to the search page with the given query.
 * Used by homepage search, navbar search, mobile search, and autocomplete submit.
 */
export function submitSearch(query: string, navigate: NavigateFunction): void {
  const trimmed = query.trim();
  if (!trimmed) return;
  navigate(`/search?q=${encodeURIComponent(trimmed)}`);
}
