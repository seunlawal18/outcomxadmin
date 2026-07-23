"use client";
import { useEffect } from "react";
import { useStore } from "@/lib/store";
import { getSocket } from "@/lib/socket";

interface TradePlacedPayload {
  marketId: number;
  updatedProbabilities: Record<string, number>;
  newVolume: number; // fresh absolute volume — safe to set directly, never double-counts
}
interface MarketSettledPayload {
  marketId: number;
  result: string;
}
interface MarketClosedPayload {
  marketId: number;
}

/**
 * Mounted once inside AdminGuard (see app/layout.tsx), only while logged in.
 * Keeps the shared markets store fresh from live server push, so
 * Manage/Resolve/Dashboard see trades and settlements land without a manual
 * refresh — mirrors the public app's RealtimeSync, minus the private
 * per-user trade:settled push (that's end-user notification only).
 */
export default function RealtimeSync() {
  useEffect(() => {
    const socket = getSocket();

    const onTradePlaced = (payload: TradePlacedPayload) => {
      useStore.getState().patchMarket(payload.marketId, {
        probabilities: payload.updatedProbabilities,
        volume: payload.newVolume,
      });
    };

    const onMarketSettled = (payload: MarketSettledPayload) => {
      useStore.getState().patchMarket(payload.marketId, {
        status: "settled",
        result: payload.result,
      });
    };

    const onMarketClosed = (payload: MarketClosedPayload) => {
      useStore.getState().patchMarket(payload.marketId, { status: "closed" });
    };

    socket.on("trade:placed", onTradePlaced);
    socket.on("market:settled", onMarketSettled);
    socket.on("market:closed", onMarketClosed);

    return () => {
      socket.off("trade:placed", onTradePlaced);
      socket.off("market:settled", onMarketSettled);
      socket.off("market:closed", onMarketClosed);
    };
  }, []);

  return null;
}
