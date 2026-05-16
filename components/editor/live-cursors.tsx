"use client";

import { useStore } from "@xyflow/react";
import {
  useOther,
  useOthersConnectionIds,
} from "@liveblocks/react/suspense";

export function LiveCursors() {
  const connectionIds = useOthersConnectionIds();

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {connectionIds.map((connectionId) => (
        <RemoteCursor key={connectionId} connectionId={connectionId} />
      ))}
    </div>
  );
}

function RemoteCursor({ connectionId }: { connectionId: number }) {
  const data = useOther(connectionId, (other) => ({
    cursor: other.presence.cursor,
    name: other.info.name,
    color: other.info.color,
  }));
  const transformX = useStore((state) => state.transform[0]);
  const transformY = useStore((state) => state.transform[1]);
  const zoom = useStore((state) => state.transform[2]);

  if (!data?.cursor) {
    return null;
  }

  const x = transformX + data.cursor.x * zoom;
  const y = transformY + data.cursor.y * zoom;

  return (
    <div
      className="absolute left-0 top-0 will-change-transform"
      style={{ transform: `translate3d(${x}px, ${y}px, 0)` }}
    >
      <CursorIcon color={data.color} />
      <div
        className="ml-3 -mt-1 inline-block rounded px-1.5 py-0.5 text-[11px] font-medium leading-none text-white whitespace-nowrap"
        style={{ backgroundColor: data.color }}
      >
        {data.name}
      </div>
    </div>
  );
}

function CursorIcon({ color }: { color: string }) {
  return (
    <svg
      width="18"
      height="22"
      viewBox="0 0 18 22"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M1 1L17 9.5L9.5 12.5L6 21L1 1Z"
        fill={color}
        stroke="white"
        strokeWidth="1.25"
        strokeLinejoin="round"
      />
    </svg>
  );
}
