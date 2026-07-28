export type MarketType = "YES_NO" | "UP_DOWN" | "MULTI" | "MULTI_YESNO";
export type MarketStatus = "open" | "closed" | "settled";
export type MarketCategory =
  | "all"
  | "new"
  | "sports"
  | "crypto"
  | "politics"
  | "finance"
  | "esports"
  | "entertainment"
  | "economy";

export type MarketDuration =
  | "5min"
  | "15min"
  | "1hour"
  | "4hours"
  | "daily"
  | "weekly"
  | "monthly"
  | "yearly";

export interface Market {
  id: number;
  title: string;
  category: MarketCategory;
  type: MarketType;
  options: string[];
  status: MarketStatus;
  result: string | null;
  volume: number;
  createdAt: string;
  probabilities: Record<string, number>;
  trending?: boolean;
  duration: MarketDuration;
  expiresAt: string;
  image?: string;
  banner?: string;
  resolutionSource?: string;
  platformFee?: number | null;
  prizePool?: number | null;
  poolAmounts?: Record<string, number>;
  /** CoinGecko coin id — presence marks this as a live-price market */
  priceAssetId?: string | null;
  priceAssetSymbol?: string | null;
  openingPrice?: number | null;
  /** Homepage hero slideshow fields */
  featured?: boolean;
  featuredOrder?: number | null;
  heroTag?: string | null;
  heroSub?: string | null;
  heroAccent?: string | null;
  heroBanner?: string | null;
  heroHref?: string | null;
}

export interface Trade {
  id: number;
  marketId: number;
  marketTitle: string;
  option: string;
  amount: number;
  timestamp: string;
  status: "active" | "won" | "lost";
  payoutAmount?: number;
  lockedPayout?: number | null;
  settledAt?: string | null;
}

// Duration helpers
export const DURATION_LABELS: Record<MarketDuration, string> = {
  "5min":    "5 Min",
  "15min":   "15 Min",
  "1hour":   "1 Hour",
  "4hours":  "4 Hours",
  "daily":   "Daily",
  "weekly":  "Weekly",
  "monthly": "Monthly",
  "yearly":  "Yearly",
};

// ── Backend timestamp parsing ──────────────────────────────────────
// SQLite/Postgres both return naive UTC strings with no "Z" or offset
// (e.g. "2026-07-08 12:19:21"). Per the JS Date spec, a timestamp with
// no timezone marker is parsed as LOCAL time, not UTC — so every
// backend timestamp must go through this before use.
export function parseApiDate(ts: string): Date {
  const normalized = ts.endsWith("Z") || ts.includes("+") ? ts : ts + "Z";
  return new Date(normalized);
}

export function formatCountdown(expiresAt: string): { label: string; urgent: boolean; expired: boolean } {
  const diff = parseApiDate(expiresAt).getTime() - Date.now();
  if (diff <= 0) return { label: "Expired", urgent: true, expired: true };

  const s = Math.floor(diff / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);

  let label = "";
  if (d > 0)       label = `${d}d ${h % 24}h`;
  else if (h > 0)  label = `${h}h ${m % 60}m`;
  else if (m > 0)  label = `${m}m ${s % 60}s`;
  else             label = `${s}s`;

  return { label, urgent: diff < 5 * 60 * 1000, expired: false };
}
