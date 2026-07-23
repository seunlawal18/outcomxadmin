// ── OUTCOMX Admin Real-Time Client ──────────────────────────────────────────
// One shared connection for the admin app. Only the public broadcasts
// (trade:placed / market:settled / market:closed) are relevant here — the
// private per-user trade:settled notification is end-user-facing only and
// has nothing to do with market management, so no auth handshake is needed.

import { io, Socket } from "socket.io-client";

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (socket) return socket;
  socket = io(SOCKET_URL, { autoConnect: true });
  return socket;
}
