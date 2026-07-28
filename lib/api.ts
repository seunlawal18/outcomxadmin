// ── OUTCOMX Admin API Client ──────────────────────────────────────
// Talks to the same Express backend as the public site, but this app
// only ever calls /api/admin/* (plus /api/auth/login to obtain the
// admin token) — so every request always carries the admin token,
// unlike the public app's apiFetch which picks per-path.

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
const ADMIN_TOKEN_KEY = "outcomx_admin_token";

export function getAdminToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ADMIN_TOKEN_KEY);
}
export function setAdminToken(token: string): void {
  if (typeof window !== "undefined") localStorage.setItem(ADMIN_TOKEN_KEY, token);
}
export function clearAdminToken(): void {
  if (typeof window !== "undefined") localStorage.removeItem(ADMIN_TOKEN_KEY);
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<{ ok: boolean; data?: T; error?: string }> {
  try {
    const token = getAdminToken();

    const res = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers ?? {}),
      },
    });

    const json = await res.json();

    if (res.status === 401) {
      clearAdminToken();
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("admin-token-expired"));
      }
    }

    if (!res.ok) {
      return { ok: false, error: json.error ?? `HTTP ${res.status}` };
    }
    return { ok: true, data: json.data };
  } catch {
    return { ok: false, error: "Cannot connect to the OutcomX backend." };
  }
}

// ── Auth ──────────────────────────────────────────────────────────

export async function apiAdminLogin(email: string, password: string) {
  const res = await apiFetch<{ token: string; user: ApiUser }>(
    "/api/auth/login",
    { method: "POST", body: JSON.stringify({ email, password }) }
  );
  if (res.ok && res.data) {
    if (!res.data.user.isAdmin) return { ok: false, error: "Not an admin account." };
    setAdminToken(res.data.token);
  }
  return res;
}

// Validates the stored admin token against the backend.
// Returns the user if valid and is admin, null otherwise.
export async function apiValidateAdminToken(): Promise<ApiUser | null> {
  const token = getAdminToken();
  if (!token) return null;
  try {
    const res = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    const json = await res.json();
    const user = json.data as ApiUser;
    return user?.isAdmin ? user : null;
  } catch {
    return null;
  }
}

// ── Markets ───────────────────────────────────────────────────────

export async function apiAdminGetMarkets(params?: { search?: string; status?: string; category?: string }) {
  const q = new URLSearchParams();
  if (params?.search)   q.set("search", params.search);
  if (params?.status)   q.set("status", params.status);
  if (params?.category) q.set("category", params.category);
  const qs = q.toString();
  return apiFetch<ApiMarket[]>(`/api/admin/markets${qs ? `?${qs}` : ""}`);
}

export async function apiAdminCreateMarket(data: {
  title: string; category: string; type: string;
  options: string[]; duration: string;
  image?: string; banner?: string;
  probabilities?: Record<string, number>;
  resolution_source?: string;
  price_asset_id?: string;
  price_asset_symbol?: string;
}) {
  return apiFetch<ApiMarket>("/api/admin/markets", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function apiAdminUpdateMarket(id: number, updates: {
  title?: string; category?: string; image?: string;
  banner?: string; resolution_source?: string; status?: string;
}) {
  return apiFetch<ApiMarket>(`/api/admin/markets/${id}`, {
    method: "PATCH",
    body: JSON.stringify(updates),
  });
}

export async function apiAdminDeleteMarket(id: number) {
  return apiFetch(`/api/admin/markets/${id}`, { method: "DELETE" });
}

export async function apiAdminToggleMarket(id: number) {
  return apiFetch<ApiMarket>(`/api/admin/markets/${id}/toggle`, { method: "PATCH" });
}

export async function apiAdminFeatureMarket(
  id: number,
  featured: boolean,
  featuredOrder?: number,
  heroTag?: string,
  heroSub?: string,
  heroAccent?: string,
) {
  return apiFetch<ApiMarket>(`/api/admin/markets/${id}/feature`, {
    method: "PATCH",
    body: JSON.stringify({ featured, featuredOrder, heroTag, heroSub, heroAccent }),
  });
}

export async function apiAdminGetFeaturedMarkets() {
  return apiFetch<ApiMarket[]>("/api/admin/markets/featured");
}

export async function apiAdminResolveMarket(id: number, result: string | Record<string, "Yes" | "No">) {
  return apiFetch<{
    market:        ApiMarket;
    settledTrades: number;
    settlement:    SettlementBreakdown;
  }>(
    `/api/admin/resolve/${id}`,
    { method: "PATCH", body: JSON.stringify({ result }) }
  );
}

// ── Coin search (live-price market creation) ───────────────────────

export interface ApiCoinSearchResult {
  id: string;
  symbol: string;
  name: string;
}

export async function apiAdminSearchCoins(query: string) {
  return apiFetch<ApiCoinSearchResult[]>(`/api/admin/coins/search?q=${encodeURIComponent(query)}`);
}

// ── Stats / income / users ──────────────────────────────────────────

export async function apiAdminGetStats() {
  return apiFetch<{
    totalMarkets: number; openMarkets: number; settledMarkets: number;
    totalTrades: number; activeTrades: number; totalVolume: number;
    totalUsers: number; activeTraders: number;
  }>("/api/admin/stats");
}

export async function apiAdminGetIncome() {
  return apiFetch<{
    totalIncome: number;
    settledMarkets: number;
    recentSettlements: {
      id: number; title: string;
      platformFee: number; prizePool: number;
      volume: number; result: string | null;
      createdAt: string;
      // null means auto-resolved (live-price market) rather than an admin call
      resolvedBy: string | null;
    }[];
  }>("/api/admin/income");
}

export async function apiAdminGetUsers() {
  return apiFetch<ApiUser[]>("/api/admin/users");
}

// ── Withdrawals ──────────────────────────────────────────────────────

export interface ApiWithdrawalRequest {
  id: number;
  userId: number;
  userEmail: string;
  username: string;
  amount: number;
  destinationAddress: string;
  chain: string;
  status: "pending" | "approved" | "rejected" | "completed";
  adminNote: string | null;
  txHash: string | null;
  createdAt: string;
  resolvedAt: string | null;
  resolvedByUsername: string | null;
}

export async function apiAdminGetWithdrawals(status?: string) {
  const qs = status ? `?status=${encodeURIComponent(status)}` : "";
  return apiFetch<ApiWithdrawalRequest[]>(`/api/admin/withdrawals${qs}`);
}

export async function apiAdminApproveWithdrawal(id: number, adminNote?: string) {
  return apiFetch<{ id: number; status: string }>(`/api/admin/withdrawals/${id}/approve`, {
    method: "PATCH",
    body: JSON.stringify({ adminNote }),
  });
}

export async function apiAdminRejectWithdrawal(id: number, adminNote?: string) {
  return apiFetch<{ id: number; status: string }>(`/api/admin/withdrawals/${id}/reject`, {
    method: "PATCH",
    body: JSON.stringify({ adminNote }),
  });
}

// Records that funds were manually sent from the treasury wallet — pass the
// resulting on-chain tx hash. Only valid once a request is 'approved'.
export async function apiAdminCompleteWithdrawal(id: number, txHash: string) {
  return apiFetch<{ id: number; status: string; txHash: string }>(`/api/admin/withdrawals/${id}/complete`, {
    method: "PATCH",
    body: JSON.stringify({ txHash }),
  });
}

// ── API Response Types (camelCase from backend) ───────────────────

export interface ApiUser {
  id: number;
  email: string;
  name: string;
  username: string;
  region: string;
  balance: number;
  isAdmin: boolean;
  isDemo: boolean;
  isVerified: boolean;
  bio: string;
  avatar: string;
  joinedAt: string;
  walletAddress: string | null;
}

export interface ApiMarketOutcome {
  id: number;
  marketId: number;
  label: string;
  probability: number;
  poolAmount: number;
  createdAt: string;
}

export interface ApiMarket {
  id: number;
  title: string;
  category: string;
  type: string;
  options: string[];
  status: string;
  result: string | null;
  volume: number;
  probabilities: Record<string, number>;
  duration: string;
  expiresAt: string;
  image: string | null;
  banner: string | null;
  resolutionSource: string | null;
  platformFee: number | null;
  prizePool: number | null;
  trending: boolean;
  priceAssetId: string | null;
  priceAssetSymbol: string | null;
  openingPrice: number | null;
  createdAt: string;
  outcomes?: ApiMarketOutcome[];
  /** Homepage hero slideshow fields */
  featured?: boolean;
  featuredOrder?: number | null;
  heroTag?: string | null;
  heroSub?: string | null;
  heroAccent?: string | null;
}

export interface SettlementBreakdown {
  totalPool:       number;
  platformFee:     number;
  platformFeeRate: number;
  prizePool:       number;
  winningOutcome:  string;
}
