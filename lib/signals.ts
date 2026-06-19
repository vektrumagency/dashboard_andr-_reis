const NEGATIVE_SIGNALS = new Set([
  "overpriced_for_zone",
  "seller_unresponsive",
  "stale_listing",
  "multiple_agencies_competing",
]);

export function isNegativeSignal(signal: string): boolean {
  return NEGATIVE_SIGNALS.has(signal);
}
