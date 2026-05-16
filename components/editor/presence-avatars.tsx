"use client";

import { UserButton, useUser } from "@clerk/nextjs";
import { shallow, useOthersMapped } from "@liveblocks/react/suspense";

const MAX_VISIBLE = 5;
const AVATAR_SIZE_CLASS = "h-7 w-7";

interface CollaboratorInfo {
  name: string;
  avatar: string;
  color: string;
}

export function PresenceAvatars() {
  const { user } = useUser();
  const currentUserId = user?.id;

  const others = useOthersMapped(
    (other) => ({ id: other.id, info: other.info }),
    shallow,
  );

  const collaborators = others
    .map(([connectionId, data]) => ({ connectionId, ...data }))
    .filter((entry) => entry.id !== currentUserId);

  const visible = collaborators.slice(0, MAX_VISIBLE);
  const overflow = collaborators.length - visible.length;
  const hasCollaborators = collaborators.length > 0;

  return (
    <div className="absolute top-3 right-4 z-30 flex items-center gap-2 rounded-full border border-surface-border bg-surface/90 backdrop-blur px-2 py-1 shadow-sm">
      {hasCollaborators && (
        <div className="flex items-center -space-x-2">
          {visible.map((entry) => (
            <CollaboratorAvatar key={entry.connectionId} info={entry.info} />
          ))}
          {overflow > 0 && (
            <div
              className={`relative z-0 ${AVATAR_SIZE_CLASS} rounded-full bg-elevated text-[10px] font-medium text-copy-secondary flex items-center justify-center ring-2 ring-surface`}
              aria-label={`${overflow} more collaborator${overflow === 1 ? "" : "s"}`}
            >
              +{overflow}
            </div>
          )}
        </div>
      )}
      {hasCollaborators && (
        <div className="h-5 w-px bg-surface-border" aria-hidden="true" />
      )}
      <UserButton />
    </div>
  );
}

function CollaboratorAvatar({ info }: { info: CollaboratorInfo }) {
  const initial = (info.name?.trim()?.[0] ?? "?").toUpperCase();
  return (
    <div
      className={`relative ${AVATAR_SIZE_CLASS} rounded-full ring-2 ring-surface overflow-hidden flex items-center justify-center text-[11px] font-medium text-white select-none`}
      style={{ backgroundColor: info.color }}
      title={info.name}
      aria-label={info.name}
    >
      {info.avatar ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={info.avatar}
          alt=""
          className="h-full w-full object-cover"
          draggable={false}
        />
      ) : (
        <span>{initial}</span>
      )}
    </div>
  );
}
