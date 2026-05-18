"use client";

import { useEffect, useRef, useState } from "react";

import { useEventListener } from "@liveblocks/react/suspense";
import { Bot, CheckCircle2, Loader2, XCircle } from "lucide-react";

type RunPhase = "starting" | "processing" | "complete" | "error";

interface BannerState {
  phase: RunPhase;
  message: string;
  runId: string;
}

const AUTO_DISMISS_MS = 4000;

export function AiStatusBanner() {
  const [state, setState] = useState<BannerState | null>(null);
  const dismissTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEventListener(({ event }) => {
    if (event.type !== "ai-status") return;
    setState({ phase: event.phase, message: event.message, runId: event.runId });
  });

  useEffect(() => {
    if (!state) return;
    if (dismissTimeoutRef.current) {
      clearTimeout(dismissTimeoutRef.current);
      dismissTimeoutRef.current = null;
    }
    if (state.phase === "complete" || state.phase === "error") {
      dismissTimeoutRef.current = setTimeout(() => {
        setState(null);
      }, AUTO_DISMISS_MS);
    }
    return () => {
      if (dismissTimeoutRef.current) {
        clearTimeout(dismissTimeoutRef.current);
        dismissTimeoutRef.current = null;
      }
    };
  }, [state]);

  if (!state) {
    return null;
  }

  return (
    <div className="pointer-events-none absolute top-3 left-1/2 z-30 -translate-x-1/2">
      <div className="pointer-events-auto flex items-center gap-2 rounded-full border border-surface-border bg-surface/95 backdrop-blur px-3 py-1.5 shadow-lg">
        <PhaseIcon phase={state.phase} />
        <span className="text-xs text-copy-primary max-w-[28rem] truncate">
          {state.message}
        </span>
      </div>
    </div>
  );
}

function PhaseIcon({ phase }: { phase: RunPhase }) {
  if (phase === "complete") {
    return <CheckCircle2 className="h-3.5 w-3.5 text-success" />;
  }
  if (phase === "error") {
    return <XCircle className="h-3.5 w-3.5 text-error" />;
  }
  if (phase === "starting") {
    return <Bot className="h-3.5 w-3.5 text-ai-text" />;
  }
  return <Loader2 className="h-3.5 w-3.5 animate-spin text-ai-text" />;
}
