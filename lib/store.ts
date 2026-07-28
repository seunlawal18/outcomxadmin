import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Market, MarketCategory, MarketDuration, MarketStatus } from "./types";
import {
  apiAdminLogin, clearAdminToken,
  apiAdminGetMarkets, apiAdminCreateMarket, apiAdminUpdateMarket,
  apiAdminDeleteMarket, apiAdminToggleMarket, apiAdminResolveMarket,
  apiAdminFeatureMarket, apiAdminGetFeaturedMarkets,
  ApiMarket, SettlementBreakdown,
} from "./api";

// ── Convert API market → frontend Market type ─────────────────────
function toMarket(m: ApiMarket): Market {
  const poolAmounts: Record<string, number> = {};
  if (m.outcomes?.length) m.outcomes.forEach(o => { poolAmounts[o.label] = o.poolAmount; });
  return {
    id:               m.id,
    title:            m.title,
    category:         m.category as MarketCategory,
    type:             m.type as Market["type"],
    options:          m.options,
    status:           m.status as MarketStatus,
    result:           m.result,
    volume:           m.volume,
    createdAt:        m.createdAt,
    probabilities:    m.probabilities,
    trending:         m.trending,
    duration:         m.duration as MarketDuration,
    expiresAt:        m.expiresAt,
    image:            m.image ?? undefined,
    banner:           m.banner ?? undefined,
    resolutionSource: m.resolutionSource ?? undefined,
    platformFee:      m.platformFee ?? null,
    prizePool:        m.prizePool ?? null,
    poolAmounts:      Object.keys(poolAmounts).length ? poolAmounts : undefined,
    priceAssetId:     m.priceAssetId ?? null,
    priceAssetSymbol: m.priceAssetSymbol ?? null,
    openingPrice:     m.openingPrice ?? null,
    featured:         m.featured ?? false,
    featuredOrder:    m.featuredOrder ?? null,
    heroTag:          m.heroTag ?? null,
    heroSub:          m.heroSub ?? null,
    heroAccent:       m.heroAccent ?? null,
  };
}

type Result = { ok: true } | { ok: false; error: string };

interface AdminState {
  isAdminLoggedIn: boolean;
  markets: Market[];

  adminLogin:  (email: string, password: string) => Promise<Result>;
  adminLogout: () => void;

  fetchMarkets: () => Promise<Result>;
  // Applies a real-time update (trade placed / settled / closed) to one
  // already-loaded market in place — see components/RealtimeSync.tsx.
  patchMarket: (marketId: number, updates: Partial<Market>) => void;
  createMarket: (data: {
    title: string; category: MarketCategory; type: Market["type"];
    options: string[]; duration: MarketDuration;
    image?: string; banner?: string; resolutionSource?: string;
    probabilities?: Record<string, number>;
    priceAssetId?: string; priceAssetSymbol?: string;
  }) => Promise<Result>;
  updateMarket: (id: number, updates: {
    title?: string; category?: MarketCategory; image?: string;
    banner?: string; resolutionSource?: string; status?: MarketStatus;
  }) => Promise<Result>;
  deleteMarket: (id: number) => Promise<Result>;
  toggleMarketStatus: (id: number) => Promise<Result>;
  featureMarket: (id: number, featured: boolean, featuredOrder?: number, heroTag?: string, heroSub?: string, heroAccent?: string) => Promise<Result>;
  resolveMarket: (id: number, result: string | Record<string, "Yes" | "No">) => Promise<
    { ok: true; settlement: SettlementBreakdown } | { ok: false; error: string }
  >;
}

export const useStore = create<AdminState>()(
  persist(
    (set, get) => ({
      isAdminLoggedIn: false,
      markets: [],

      adminLogin: async (email, password) => {
        const res = await apiAdminLogin(email, password);
        if (res.ok) {
          set({ isAdminLoggedIn: true });
          return { ok: true };
        }
        return { ok: false, error: res.error ?? "Invalid credentials." };
      },

      adminLogout: () => {
        clearAdminToken();
        set({ isAdminLoggedIn: false, markets: [] });
      },

      // Always the full admin view (every status) — this app has no
      // separate "public open markets only" concept to fall back to.
      fetchMarkets: async () => {
        const res = await apiAdminGetMarkets();
        if (res.ok && res.data) {
          set({ markets: res.data.map(toMarket) });
          return { ok: true };
        }
        return { ok: false, error: res.error ?? "Could not load markets." };
      },

      patchMarket: (marketId, updates) => {
        set((state) => ({
          markets: state.markets.map(m => m.id === marketId ? { ...m, ...updates } : m),
        }));
      },

      createMarket: async (marketData) => {
        const res = await apiAdminCreateMarket({
          title:             marketData.title,
          category:          marketData.category,
          type:              marketData.type,
          options:           marketData.options,
          duration:          marketData.duration,
          image:             marketData.image,
          banner:            marketData.banner,
          resolution_source: marketData.resolutionSource,
          probabilities:     marketData.probabilities,
          price_asset_id:     marketData.priceAssetId,
          price_asset_symbol: marketData.priceAssetSymbol,
        });
        if (!res.ok || !res.data) return { ok: false, error: res.error ?? "Failed to create market." };
        set((state) => ({ markets: [toMarket(res.data!), ...state.markets] }));
        return { ok: true };
      },

      updateMarket: async (id, updates) => {
        const res = await apiAdminUpdateMarket(id, {
          title:             updates.title,
          category:          updates.category,
          image:             updates.image,
          banner:            updates.banner,
          resolution_source: updates.resolutionSource,
          status:            updates.status,
        });
        if (!res.ok || !res.data) return { ok: false, error: res.error ?? "Failed to update market." };
        set((state) => ({ markets: state.markets.map((m) => m.id === id ? toMarket(res.data!) : m) }));
        return { ok: true };
      },

      deleteMarket: async (id) => {
        const res = await apiAdminDeleteMarket(id);
        if (!res.ok) return { ok: false, error: res.error ?? "Failed to delete market." };
        set((state) => ({ markets: state.markets.filter((m) => m.id !== id) }));
        return { ok: true };
      },

      resolveMarket: async (id, result) => {
        const res = await apiAdminResolveMarket(id, result);
        if (!res.ok || !res.data) return { ok: false, error: res.error ?? "Failed to resolve market." };
        set((state) => ({ markets: state.markets.map((m) => m.id === id ? toMarket(res.data!.market) : m) }));
        return { ok: true, settlement: res.data.settlement };
      },

      toggleMarketStatus: async (id) => {
        const res = await apiAdminToggleMarket(id);
        if (!res.ok || !res.data) return { ok: false, error: res.error ?? "Failed to toggle market status." };
        set((state) => ({ markets: state.markets.map((m) => m.id === id ? toMarket(res.data!) : m) }));
        return { ok: true };
      },

      featureMarket: async (id, featured, featuredOrder, heroTag, heroSub, heroAccent) => {
        const res = await apiAdminFeatureMarket(id, featured, featuredOrder, heroTag, heroSub, heroAccent);
        if (!res.ok || !res.data) return { ok: false, error: res.error ?? "Failed to update feature status." };
        set((state) => ({ markets: state.markets.map((m) => m.id === id ? toMarket(res.data!) : m) }));
        return { ok: true };
      },
    }),
    {
      name: "outcomx-admin-v1",
      partialize: (state) => ({ isAdminLoggedIn: state.isAdminLoggedIn }),
    }
  )
);
