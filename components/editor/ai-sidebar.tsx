"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import {
  AlertCircle,
  Bot,
  Download,
  FileText,
  Loader2,
  Send,
  Sparkles,
  X,
} from "lucide-react";

import { useFeedMessages } from "@liveblocks/react";
import { useLiveblocksFlow } from "@liveblocks/react-flow";
import { useRealtimeRun } from "@trigger.dev/react-hooks";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import type { CanvasEdge, CanvasNode } from "@/types/canvas";
import type { designAgentTask } from "@/trigger/design-agent";
import type { generateSpecTask } from "@/trigger/generate-spec";
import {
  AI_CHAT_FEED_ID,
  AI_CHAT_MESSAGE_MAX_LENGTH,
  AI_STATUS_FEED_ID,
  aiChatMessageSchema,
  aiStatusMessageSchema,
  isActiveAiStatusPhase,
  type AiChatMessage,
  type AiStatusMessage,
} from "@/types/tasks";

interface AiSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  roomId: string;
}

interface ChatEntry {
  id: string;
  createdAt: number;
  message: AiChatMessage;
}

interface ActiveRun {
  runId: string;
  publicToken: string;
}

const STARTER_PROMPTS = [
  "Design an e-commerce backend",
  "Create a chat app architecture",
  "Build a CI/CD pipeline",
];

const GREEN_ACCENT = "#62C073";
const GREEN_ACCENT_DARK = "#0F2E18";

export function AiSidebar({
  isOpen,
  onClose,
  projectId,
  roomId,
}: AiSidebarProps) {
  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-base/80 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-12 right-0 z-40 h-[calc(100vh-3rem)] w-96 max-w-[100vw] flex flex-col bg-base/95 backdrop-blur border-l border-surface-border shadow-2xl shadow-black/40 transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <AiSidebarHeader onClose={onClose} />

        <Tabs
          defaultValue="architect"
          className="flex-1 flex flex-col min-h-0 px-4 pt-3 pb-4 gap-3"
        >
          <TabsList className="grid grid-cols-2 w-full bg-subtle h-9">
            <TabsTrigger
              value="architect"
              className="text-copy-muted data-active:bg-ai/15 data-active:text-ai-text"
            >
              AI Architect
            </TabsTrigger>
            <TabsTrigger
              value="specs"
              className="text-copy-muted data-active:bg-ai/15 data-active:text-ai-text"
            >
              Specs
            </TabsTrigger>
          </TabsList>

          <TabsContent value="architect" className="flex flex-col min-h-0">
            <AiArchitectTab projectId={projectId} roomId={roomId} />
          </TabsContent>
          <TabsContent value="specs" className="flex flex-col min-h-0">
            <SpecsTab projectId={projectId} roomId={roomId} />
          </TabsContent>
        </Tabs>
      </aside>
    </>
  );
}

function AiSidebarHeader({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex items-start gap-3 px-4 py-3 border-b border-surface-border">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-ai/15 text-ai-text shrink-0">
        <Bot className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-copy-primary leading-tight">
          AI Workspace
        </p>
        <p className="text-xs text-copy-muted mt-0.5 leading-tight">
          Collaborate with Pulse AI
        </p>
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={onClose}
        className="h-8 w-8 shrink-0 text-copy-muted hover:text-copy-primary"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}

function AiArchitectTab({
  projectId,
  roomId,
}: {
  projectId: string;
  roomId: string;
}) {
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [activeRun, setActiveRun] = useState<ActiveRun | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const chatEntries = useChatEntries();
  const latestStatus = useLatestAiStatus();
  const sharedActive = latestStatus
    ? isActiveAiStatusPhase(latestStatus.phase)
    : false;

  const isRunActive = activeRun !== null || sharedActive;
  const inputDisabled = isSending || isRunActive;

  const clearActiveRun = useCallback(() => {
    setActiveRun(null);
  }, []);

  const submit = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isSending || isRunActive) return;

      setSendError(null);
      setIsSending(true);
      try {
        const chatResponse = await fetch("/api/ai/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: trimmed,
            projectId,
            roomId,
          }),
        });
        if (!chatResponse.ok) {
          const body = (await chatResponse.json().catch(() => null)) as
            | { error?: string }
            | null;
          throw new Error(body?.error ?? "Could not send the message.");
        }

        const designResponse = await fetch("/api/ai/design", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: trimmed,
            projectId,
            roomId,
          }),
        });
        if (!designResponse.ok) {
          const body = (await designResponse.json().catch(() => null)) as
            | { error?: string }
            | null;
          throw new Error(
            body?.error ?? "Could not start the design generation.",
          );
        }
        const data = (await designResponse.json()) as {
          runId?: string;
          publicToken?: string;
        };
        if (!data.runId || !data.publicToken) {
          throw new Error("Design response is missing runId or publicToken.");
        }

        setActiveRun({ runId: data.runId, publicToken: data.publicToken });
        setInput("");
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Unexpected error while sending the message.";
        setSendError(message);
      } finally {
        setIsSending(false);
      }
    },
    [isRunActive, isSending, projectId, roomId],
  );

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void submit(input);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void submit(input);
    }
  };

  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [chatEntries.length, isSending]);

  const canSend = input.trim().length > 0 && !inputDisabled;

  return (
    <div className="flex flex-1 flex-col min-h-0">
      <div
        ref={scrollRef}
        className="flex-1 min-h-0 overflow-y-auto pr-1 scroll-smooth"
      >
        {chatEntries.length === 0 && !isSending ? (
          <EmptyState
            disabled={inputDisabled}
            onPickPrompt={(prompt) => setInput(prompt)}
          />
        ) : (
          <div className="flex flex-col gap-3 py-4">
            {chatEntries.map((entry) => (
              <ChatBubble key={entry.id} entry={entry} />
            ))}
          </div>
        )}
      </div>

      {activeRun && (
        <RunSubscriber
          runId={activeRun.runId}
          accessToken={activeRun.publicToken}
          onClear={clearActiveRun}
        />
      )}

      {isRunActive && latestStatus && (
        <SharedStatusIndicator status={latestStatus} />
      )}

      {sendError && (
        <div className="mb-2 flex items-start gap-2 rounded-xl border border-error/40 bg-error/10 px-3 py-2 text-xs text-error">
          <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
          <span>{sendError}</span>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="pt-3 border-t border-surface-border"
      >
        <div className="relative">
          <Textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isRunActive
                ? "Pulse AI is working on the design…"
                : "Describe what you want to build…"
            }
            rows={3}
            disabled={inputDisabled}
            maxLength={AI_CHAT_MESSAGE_MAX_LENGTH}
            className="min-h-[72px] max-h-[160px] resize-none bg-elevated border-surface-border text-copy-primary placeholder:text-copy-faint pr-12 disabled:opacity-60"
          />
          <Button
            type="submit"
            size="icon-sm"
            disabled={!canSend}
            className="absolute right-2 bottom-2 disabled:opacity-50 hover:brightness-110"
            style={{ backgroundColor: GREEN_ACCENT, color: GREEN_ACCENT_DARK }}
            aria-label="Send message"
          >
            {isSending || isRunActive ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Send className="h-3.5 w-3.5" />
            )}
          </Button>
        </div>
        <p className="text-[10px] text-copy-faint mt-2">
          Press Enter to send · Shift+Enter for newline
        </p>
      </form>
    </div>
  );
}

function RunSubscriber({
  runId,
  accessToken,
  onClear,
}: {
  runId: string;
  accessToken: string;
  onClear: () => void;
}) {
  const { run, error } = useRealtimeRun<typeof designAgentTask>(runId, {
    accessToken,
  });

  useEffect(() => {
    if (error) {
      onClear();
      return;
    }
    if (!run) return;
    const status = run.status;
    if (
      status === "COMPLETED" ||
      status === "FAILED" ||
      status === "CANCELED" ||
      status === "TIMED_OUT" ||
      status === "CRASHED" ||
      status === "SYSTEM_FAILURE" ||
      status === "EXPIRED"
    ) {
      onClear();
    }
  }, [error, run, onClear]);

  return null;
}

function ChatBubble({ entry }: { entry: ChatEntry }) {
  const { sender, role, content, timestamp } = entry.message;
  const isAi = role === "ai";
  const formattedTime = useMemo(() => formatTimestamp(timestamp), [timestamp]);
  const initial = sender.name.trim().charAt(0).toUpperCase() || "?";

  return (
    <div className="flex items-start gap-2.5">
      <Avatar sender={sender} isAi={isAi} initial={initial} />
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="text-xs font-medium text-copy-primary truncate">
            {sender.name}
          </span>
          <span className="text-[10px] text-copy-faint shrink-0">
            {formattedTime}
          </span>
        </div>
        <div
          className={`mt-1 inline-block max-w-full rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap break-words ${
            isAi
              ? "border border-surface-border bg-elevated text-ai-text"
              : ""
          }`}
          style={
            isAi
              ? undefined
              : { backgroundColor: GREEN_ACCENT, color: GREEN_ACCENT_DARK }
          }
        >
          {content}
        </div>
      </div>
    </div>
  );
}

function Avatar({
  sender,
  isAi,
  initial,
}: {
  sender: AiChatMessage["sender"];
  isAi: boolean;
  initial: string;
}) {
  if (isAi) {
    return (
      <div
        className="flex h-7 w-7 items-center justify-center rounded-full bg-ai/15 text-ai-text shrink-0"
        aria-label={`${sender.name} avatar`}
      >
        <Bot className="h-3.5 w-3.5" />
      </div>
    );
  }

  if (sender.avatar) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={sender.avatar}
        alt={`${sender.name} avatar`}
        className="h-7 w-7 rounded-full object-cover shrink-0 ring-1 ring-surface-border"
      />
    );
  }

  return (
    <div
      className="flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-semibold text-white shrink-0"
      style={{ backgroundColor: sender.color ?? "var(--accent-primary)" }}
      aria-label={`${sender.name} avatar`}
    >
      {initial}
    </div>
  );
}

function useChatEntries(): ChatEntry[] {
  const { messages: feedMessages } = useFeedMessages(AI_CHAT_FEED_ID);

  return useMemo(() => {
    if (!feedMessages || feedMessages.length === 0) return [];

    const entries: ChatEntry[] = [];
    for (const entry of feedMessages) {
      const parsed = aiChatMessageSchema.safeParse(entry.data);
      if (!parsed.success) continue;
      entries.push({
        id: entry.id,
        createdAt: entry.createdAt,
        message: parsed.data,
      });
    }
    entries.sort((a, b) => a.createdAt - b.createdAt);
    return entries;
  }, [feedMessages]);
}

function useLatestAiStatus(): AiStatusMessage | null {
  const { messages: feedMessages } = useFeedMessages(AI_STATUS_FEED_ID);

  return useMemo(() => {
    if (!feedMessages || feedMessages.length === 0) return null;

    const sorted = [...feedMessages].sort(
      (a, b) => b.createdAt - a.createdAt,
    );

    for (const entry of sorted) {
      const parsed = aiStatusMessageSchema.safeParse(entry.data);
      if (parsed.success) {
        return parsed.data;
      }
    }
    return null;
  }, [feedMessages]);
}

function SharedStatusIndicator({ status }: { status: AiStatusMessage }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="mb-2 flex items-center gap-2 rounded-xl border bg-base/80 px-3 py-2 text-xs"
      style={{
        borderColor: `${GREEN_ACCENT}55`,
        color: GREEN_ACCENT,
      }}
    >
      <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
      <span className="truncate">
        {status.text ?? "Pulse AI is working…"}
      </span>
    </div>
  );
}

function formatTimestamp(timestamp: number): string {
  try {
    return new Intl.DateTimeFormat(undefined, {
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(timestamp));
  } catch {
    return "";
  }
}

function EmptyState({
  disabled,
  onPickPrompt,
}: {
  disabled: boolean;
  onPickPrompt: (prompt: string) => void;
}) {
  return (
    <div className="flex flex-col items-center text-center px-2 py-8">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-ai/15 text-ai-text mb-4">
        <Bot className="h-6 w-6" />
      </div>
      <p className="text-sm font-medium text-copy-primary">
        Design with Pulse AI
      </p>
      <p className="text-xs text-copy-muted mt-1 max-w-[20rem]">
        Describe a system and Pulse AI will draft the architecture on the
        canvas. Everyone in the room sees the updates live.
      </p>
      <div className="flex flex-wrap justify-center gap-2 mt-5">
        {STARTER_PROMPTS.map((prompt) => (
          <button
            key={prompt}
            type="button"
            disabled={disabled}
            onClick={() => onPickPrompt(prompt)}
            className="rounded-full bg-subtle text-ai-text text-xs px-3 py-1.5 hover:bg-elevated transition-colors disabled:opacity-50"
          >
            {prompt}
          </button>
        ))}
      </div>
    </div>
  );
}

interface SpecListItem {
  id: string;
  createdAt: string;
  filename: string;
}

interface ActiveSpecRun {
  runId: string;
  accessToken: string;
}

function SpecsTab({
  projectId,
  roomId,
}: {
  projectId: string;
  roomId: string;
}) {
  const [specs, setSpecs] = useState<SpecListItem[] | null>(null);
  const [listError, setListError] = useState<string | null>(null);
  const [selectedSpec, setSelectedSpec] = useState<SpecListItem | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [activeRun, setActiveRun] = useState<ActiveSpecRun | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);

  const flow = useLiveblocksFlow<CanvasNode, CanvasEdge>();
  const chatEntries = useChatEntries();

  const refetchSpecs = useCallback(async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/specs`);
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(body?.error ?? "Failed to load specs.");
      }
      const data = (await response.json()) as { specs: SpecListItem[] };
      setSpecs(data.specs);
      setListError(null);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to load specs.";
      setListError(message);
      setSpecs((prev) => prev ?? []);
    }
  }, [projectId]);

  useEffect(() => {
    void refetchSpecs();
  }, [refetchSpecs]);

  const handleGenerate = useCallback(async () => {
    if (isStarting || activeRun) return;
    if (flow.isLoading) return;

    setGenerationError(null);
    setIsStarting(true);
    try {
      const chatHistory = chatEntries.map((entry) => ({
        role: entry.message.role,
        content: entry.message.content,
      }));

      const specResponse = await fetch("/api/ai/spec", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId,
          chatHistory,
          nodes: flow.nodes,
          edges: flow.edges,
        }),
      });
      if (!specResponse.ok) {
        const body = (await specResponse.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(body?.error ?? "Could not start spec generation.");
      }
      const specData = (await specResponse.json()) as { runId?: string };
      if (!specData.runId) {
        throw new Error("Spec response is missing runId.");
      }

      const tokenResponse = await fetch("/api/ai/spec/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ runId: specData.runId }),
      });
      if (!tokenResponse.ok) {
        const body = (await tokenResponse.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(body?.error ?? "Could not mint spec token.");
      }
      const tokenData = (await tokenResponse.json()) as { token?: string };
      if (!tokenData.token) {
        throw new Error("Token response is missing token.");
      }

      setActiveRun({ runId: specData.runId, accessToken: tokenData.token });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Spec generation failed.";
      setGenerationError(message);
    } finally {
      setIsStarting(false);
    }
  }, [activeRun, chatEntries, flow.edges, flow.isLoading, flow.nodes, isStarting, roomId]);

  const handleRunComplete = useCallback(
    (success: boolean) => {
      setActiveRun(null);
      if (success) {
        void refetchSpecs();
      }
    },
    [refetchSpecs],
  );

  const generationBusy = isStarting || activeRun !== null;
  const generateDisabled = generationBusy || flow.isLoading;

  return (
    <div className="flex flex-1 flex-col min-h-0 gap-3">
      <Button
        type="button"
        onClick={handleGenerate}
        disabled={generateDisabled}
        className="w-full bg-ai text-white hover:bg-ai/90 disabled:opacity-60"
      >
        {generationBusy ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Sparkles className="h-4 w-4" />
        )}
        {activeRun
          ? "Generating spec…"
          : isStarting
            ? "Starting…"
            : "Generate Spec"}
      </Button>

      {activeRun && (
        <SpecRunSubscriber
          runId={activeRun.runId}
          accessToken={activeRun.accessToken}
          onComplete={handleRunComplete}
        />
      )}

      {generationError && (
        <div className="flex items-start gap-2 rounded-xl border border-error/40 bg-error/10 px-3 py-2 text-xs text-error">
          <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
          <span>{generationError}</span>
        </div>
      )}

      <div className="flex-1 min-h-0 overflow-y-auto pr-1">
        {specs === null && !listError ? (
          <div className="flex flex-col items-center py-8 text-copy-muted">
            <Loader2 className="h-4 w-4 animate-spin" />
            <p className="text-xs mt-2">Loading specs…</p>
          </div>
        ) : listError && (specs === null || specs.length === 0) ? (
          <div className="flex items-start gap-2 rounded-xl border border-error/40 bg-error/10 px-3 py-2 text-xs text-error">
            <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            <span>{listError}</span>
          </div>
        ) : specs && specs.length === 0 ? (
          <SpecsEmptyState />
        ) : (
          <ul className="flex flex-col gap-2">
            {specs?.map((spec) => (
              <SpecListRow
                key={spec.id}
                spec={spec}
                projectId={projectId}
                onPreview={() => setSelectedSpec(spec)}
              />
            ))}
          </ul>
        )}
      </div>

      <SpecPreviewDialog
        spec={selectedSpec}
        projectId={projectId}
        onClose={() => setSelectedSpec(null)}
      />
    </div>
  );
}

function SpecsEmptyState() {
  return (
    <div className="flex flex-col items-center text-center px-2 py-8">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-ai/15 text-ai-text mb-4">
        <FileText className="h-6 w-6" />
      </div>
      <p className="text-sm font-medium text-copy-primary">
        No specs yet
      </p>
      <p className="text-xs text-copy-muted mt-1 max-w-[20rem]">
        Generate a spec to turn the current canvas + chat into a Markdown
        document you can download and share.
      </p>
    </div>
  );
}

function SpecListRow({
  spec,
  projectId,
  onPreview,
}: {
  spec: SpecListItem;
  projectId: string;
  onPreview: () => void;
}) {
  const handleDownload = (event: React.MouseEvent) => {
    event.stopPropagation();
    triggerSpecDownload(projectId, spec);
  };

  return (
    <li className="relative rounded-2xl border border-surface-border bg-elevated p-3 flex items-center gap-3 hover:bg-subtle transition-colors">
      <button
        type="button"
        onClick={onPreview}
        aria-label={`Preview ${spec.filename}`}
        className="absolute inset-0 rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-ai-text"
      />
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-subtle text-ai-text shrink-0 pointer-events-none">
        <FileText className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0 pointer-events-none">
        <p className="text-sm font-medium text-copy-primary truncate">
          {spec.filename}
        </p>
        <p className="text-xs text-copy-muted">
          {formatSpecDate(spec.createdAt)}
        </p>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        onClick={handleDownload}
        aria-label={`Download ${spec.filename}`}
        className="relative shrink-0 text-copy-muted hover:text-copy-primary"
      >
        <Download className="h-3.5 w-3.5" />
      </Button>
    </li>
  );
}

function SpecPreviewDialog({
  spec,
  projectId,
  onClose,
}: {
  spec: SpecListItem | null;
  projectId: string;
  onClose: () => void;
}) {
  const [content, setContent] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!spec) {
      setContent(null);
      setLoadError(null);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setLoadError(null);
    setContent(null);

    (async () => {
      try {
        const response = await fetch(
          `/api/projects/${projectId}/specs/${spec.id}/download`,
        );
        if (!response.ok) {
          throw new Error(`Failed to load spec (${response.status}).`);
        }
        const text = await response.text();
        if (cancelled) return;
        setContent(text);
      } catch (error) {
        if (cancelled) return;
        setLoadError(
          error instanceof Error ? error.message : "Failed to load spec.",
        );
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [spec, projectId]);

  return (
    <Dialog
      open={spec !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="sm:max-w-2xl w-full max-w-[calc(100%-2rem)] gap-0 p-0 overflow-hidden bg-surface ring-1 ring-surface-border"
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b border-surface-border">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-ai/15 text-ai-text shrink-0">
            <FileText className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            <DialogTitle className="text-sm font-medium text-copy-primary truncate">
              {spec?.filename ?? "Spec"}
            </DialogTitle>
            <p className="text-xs text-copy-muted">
              {spec ? formatSpecDate(spec.createdAt) : ""}
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => spec && triggerSpecDownload(projectId, spec)}
            disabled={!spec}
            className="shrink-0"
          >
            <Download className="h-3.5 w-3.5" />
            Download
          </Button>
          <DialogClose
            render={
              <Button
                variant="ghost"
                size="icon-sm"
                className="shrink-0 text-copy-muted hover:text-copy-primary"
                aria-label="Close preview"
              />
            }
          >
            <X className="h-4 w-4" />
          </DialogClose>
        </div>
        <ScrollArea className="h-[60vh]">
          <div className="px-5 py-4">
            {isLoading && (
              <div className="flex flex-col items-center py-8 text-copy-muted">
                <Loader2 className="h-4 w-4 animate-spin" />
                <p className="text-xs mt-2">Loading spec…</p>
              </div>
            )}
            {loadError && (
              <div className="flex items-start gap-2 rounded-xl border border-error/40 bg-error/10 px-3 py-2 text-xs text-error">
                <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                <span>{loadError}</span>
              </div>
            )}
            {!isLoading && !loadError && content !== null && (
              <SpecMarkdown source={content} />
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

function SpecMarkdown({ source }: { source: string }) {
  return (
    <div className="text-sm text-copy-primary leading-relaxed [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: (props) => (
            <h1
              {...props}
              className="text-lg font-semibold text-copy-primary mt-5 mb-3"
            />
          ),
          h2: (props) => (
            <h2
              {...props}
              className="text-base font-semibold text-copy-primary mt-5 mb-2"
            />
          ),
          h3: (props) => (
            <h3
              {...props}
              className="text-sm font-semibold text-copy-primary mt-4 mb-2"
            />
          ),
          p: (props) => (
            <p
              {...props}
              className="text-sm text-copy-secondary my-2 leading-relaxed"
            />
          ),
          ul: (props) => (
            <ul
              {...props}
              className="list-disc pl-5 my-2 text-copy-secondary marker:text-copy-faint"
            />
          ),
          ol: (props) => (
            <ol
              {...props}
              className="list-decimal pl-5 my-2 text-copy-secondary marker:text-copy-faint"
            />
          ),
          li: (props) => <li {...props} className="my-1" />,
          strong: (props) => (
            <strong
              {...props}
              className="font-semibold text-copy-primary"
            />
          ),
          em: (props) => <em {...props} className="italic" />,
          a: (props) => (
            <a
              {...props}
              className="text-ai-text underline hover:opacity-80"
              target="_blank"
              rel="noreferrer noopener"
            />
          ),
          code: ({ className, children, ...props }) => {
            const isBlock = /language-/.test(className ?? "");
            if (isBlock) {
              return (
                <code
                  {...props}
                  className="block rounded-lg bg-base/60 border border-surface-border p-3 text-xs text-copy-primary overflow-x-auto"
                >
                  {children}
                </code>
              );
            }
            return (
              <code
                {...props}
                className="rounded bg-subtle px-1 py-0.5 text-xs text-copy-primary"
              >
                {children}
              </code>
            );
          },
          pre: (props) => (
            <pre
              {...props}
              className="rounded-lg bg-base/60 border border-surface-border p-3 my-2 overflow-x-auto"
            />
          ),
          blockquote: (props) => (
            <blockquote
              {...props}
              className="border-l-2 border-surface-border pl-3 my-2 text-copy-muted"
            />
          ),
          hr: () => <hr className="my-4 border-surface-border" />,
          table: (props) => (
            <div className="my-3 overflow-x-auto">
              <table
                {...props}
                className="w-full text-xs border-collapse"
              />
            </div>
          ),
          th: (props) => (
            <th
              {...props}
              className="border border-surface-border bg-elevated px-2 py-1 text-left font-semibold text-copy-primary"
            />
          ),
          td: (props) => (
            <td
              {...props}
              className="border border-surface-border px-2 py-1 text-copy-secondary"
            />
          ),
        }}
      >
        {source}
      </ReactMarkdown>
    </div>
  );
}

function SpecRunSubscriber({
  runId,
  accessToken,
  onComplete,
}: {
  runId: string;
  accessToken: string;
  onComplete: (success: boolean) => void;
}) {
  const { run, error } = useRealtimeRun<typeof generateSpecTask>(runId, {
    accessToken,
  });

  useEffect(() => {
    if (error) {
      onComplete(false);
      return;
    }
    if (!run) return;
    const status = run.status;
    if (status === "COMPLETED") {
      onComplete(true);
      return;
    }
    if (
      status === "FAILED" ||
      status === "CANCELED" ||
      status === "TIMED_OUT" ||
      status === "CRASHED" ||
      status === "SYSTEM_FAILURE" ||
      status === "EXPIRED"
    ) {
      onComplete(false);
    }
  }, [error, run, onComplete]);

  return null;
}

function triggerSpecDownload(projectId: string, spec: SpecListItem) {
  const url = `/api/projects/${projectId}/specs/${spec.id}/download`;
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = spec.filename;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}

function formatSpecDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}
