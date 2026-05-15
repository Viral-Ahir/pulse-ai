import "server-only";

import { Liveblocks } from "@liveblocks/node";

const CURSOR_COLOR_PALETTE = [
  "#f43f5e",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#14b8a6",
  "#06b6d4",
  "#3b82f6",
  "#8b5cf6",
  "#d946ef",
  "#ec4899",
] as const;

const globalForLiveblocks = globalThis as unknown as {
  liveblocks?: Liveblocks;
};

export function getLiveblocks(): Liveblocks {
  if (globalForLiveblocks.liveblocks) {
    return globalForLiveblocks.liveblocks;
  }

  const secret = process.env.LIVEBLOCKS_SECRET_KEY;
  if (!secret) {
    throw new Error("LIVEBLOCKS_SECRET_KEY is not set");
  }

  const client = new Liveblocks({ secret });
  globalForLiveblocks.liveblocks = client;
  return client;
}

export function getCursorColorForUser(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = (hash * 31 + userId.charCodeAt(i)) | 0;
  }
  const index = Math.abs(hash) % CURSOR_COLOR_PALETTE.length;
  return CURSOR_COLOR_PALETTE[index];
}
