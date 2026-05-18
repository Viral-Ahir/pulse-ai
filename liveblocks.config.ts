declare global {
  interface Liveblocks {
    Presence: {
      cursor: { x: number; y: number } | null;
      thinking: boolean;
    };

    Storage: {};

    UserMeta: {
      id: string;
      info: {
        name: string;
        avatar: string;
        color: string;
        isAi?: boolean;
      };
    };

    RoomEvent:
      | {
          type: "ai-status";
          runId: string;
          phase: "starting" | "processing" | "complete" | "error";
          message: string;
        };

    ThreadMetadata: {};

    RoomInfo: {};
  }
}

export {};
