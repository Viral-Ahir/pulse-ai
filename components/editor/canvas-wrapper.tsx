"use client";

import { useState } from "react";

import {
  ClientSideSuspense,
  LiveblocksProvider,
  RoomProvider,
  useErrorListener,
} from "@liveblocks/react/suspense";
import { AlertCircle } from "lucide-react";

import { Canvas } from "./canvas";

interface CanvasWrapperProps {
  roomId: string;
}

export function CanvasWrapper({ roomId }: CanvasWrapperProps) {
  return (
    <LiveblocksProvider authEndpoint="/api/liveblocks-auth">
      <RoomProvider
        id={roomId}
        initialPresence={{ cursor: null, isThinking: false }}
      >
        <CanvasRoom />
      </RoomProvider>
    </LiveblocksProvider>
  );
}

function CanvasRoom() {
  const [connectionError, setConnectionError] = useState<string | null>(null);

  useErrorListener((error) => {
    if (error.context.type !== "ROOM_CONNECTION_ERROR") {
      return;
    }

    switch (error.context.code) {
      case -1:
        setConnectionError("Could not authenticate with Liveblocks.");
        return;
      case 4001:
        setConnectionError("You do not have access to this room.");
        return;
      case 4005:
        setConnectionError("This room is full. Try again later.");
        return;
      case 4006:
        setConnectionError("This room is no longer available.");
        return;
      default:
        setConnectionError("Lost connection to the collaborative canvas.");
    }
  });

  if (connectionError) {
    return <CanvasError message={connectionError} />;
  }

  return (
    <ClientSideSuspense fallback={<CanvasLoading />}>
      <Canvas />
    </ClientSideSuspense>
  );
}

function CanvasLoading() {
  return (
    <div className="h-full w-full flex items-center justify-center bg-base">
      <p className="text-sm text-copy-faint">Connecting to canvas…</p>
    </div>
  );
}

function CanvasError({ message }: { message: string }) {
  return (
    <div className="h-full w-full flex items-center justify-center bg-base">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="h-12 w-12 rounded-2xl bg-elevated flex items-center justify-center">
          <AlertCircle className="h-6 w-6 text-error" />
        </div>
        <p className="text-sm text-copy-secondary max-w-xs">{message}</p>
      </div>
    </div>
  );
}
