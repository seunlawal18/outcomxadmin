"use client";
// Admin always displays canonical USD ledger values — there's no per-admin
// currency preference the way the public app has for traders — so this is
// a fixed-USD formatter, not a store-backed hook like the public app's.

function formatUSD(amount: number, compact = false): string {
  if (compact) {
    if (amount >= 1_000_000_000) return `$${(amount / 1_000_000_000).toFixed(1)}B`;
    if (amount >= 1_000_000)     return `$${(amount / 1_000_000).toFixed(1)}M`;
    if (amount >= 1_000)         return `$${(amount / 1_000).toFixed(1)}K`;
    return `$${amount.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
  }
  return `$${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export interface UseCurrencyResult {
  fmt: (amount: number, compact?: boolean) => string;
  fmtUSD: (amount: number, compact?: boolean) => string;
  symbol: string;
}

export function useCurrency(): UseCurrencyResult {
  return {
    fmt: formatUSD,
    fmtUSD: formatUSD,
    symbol: "$",
  };
}
