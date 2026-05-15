import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { getCursorColorForUser, getLiveblocks } from "@/lib/liveblocks";
import {
  getCurrentIdentity,
  getProjectIfAccessible,
} from "@/lib/project-access";

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown = null;
  try {
    body = await request.json();
  } catch {
    body = null;
  }

  const rawRoom =
    body && typeof body === "object" && "room" in body
      ? (body as { room?: unknown }).room
      : undefined;
  const roomId = typeof rawRoom === "string" ? rawRoom.trim() : "";

  if (!roomId) {
    return NextResponse.json({ error: "Missing room id" }, { status: 400 });
  }

  const identity = await getCurrentIdentity();
  if (!identity) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const project = await getProjectIfAccessible(roomId, identity);
  if (!project) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const liveblocks = getLiveblocks();

  await liveblocks.getOrCreateRoom(roomId, {
    defaultAccesses: [],
  });

  const user = await currentUser();
  const fullName = [user?.firstName, user?.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();
  const name =
    fullName.length > 0
      ? fullName
      : (identity.email ?? user?.username ?? "Anonymous");
  const avatar = user?.imageUrl ?? "";
  const color = getCursorColorForUser(userId);

  const session = liveblocks.prepareSession(userId, {
    userInfo: { name, avatar, color },
  });
  session.allow(roomId, session.FULL_ACCESS);

  const { status, body: responseBody } = await session.authorize();
  return new Response(responseBody, { status });
}
