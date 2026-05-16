"use client";

import {
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import {
  Bot,
  Download,
  FileText,
  Send,
  Sparkles,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

interface AiSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

const STARTER_PROMPTS = [
  "Design an e-commerce backend",
  "Create a chat app architecture",
  "Build a CI/CD pipeline",
];

export function AiSidebar({ isOpen, onClose }: AiSidebarProps) {
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
            <AiArchitectTab />
          </TabsContent>
          <TabsContent value="specs" className="flex flex-col min-h-0">
            <SpecsTab />
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

function AiArchitectTab() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");

  const send = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), role: "user", content: trimmed },
    ]);
    setInput("");
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    send(input);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      send(input);
    }
  };

  const canSend = input.trim().length > 0;

  return (
    <div className="flex flex-1 flex-col min-h-0">
      <div className="flex-1 min-h-0 overflow-y-auto pr-1">
        {messages.length === 0 ? (
          <EmptyState onPickPrompt={(prompt) => setInput(prompt)} />
        ) : (
          <div className="flex flex-col gap-3 py-4">
            {messages.map((msg) =>
              msg.role === "user" ? (
                <div
                  key={msg.id}
                  className="self-end max-w-[85%] rounded-2xl border-2 border-brand/50 bg-brand-dim px-3 py-2 text-sm text-copy-primary whitespace-pre-wrap break-words"
                >
                  {msg.content}
                </div>
              ) : (
                <div
                  key={msg.id}
                  className="self-start max-w-[85%] rounded-2xl border border-surface-border bg-elevated px-3 py-2 text-sm text-ai-text whitespace-pre-wrap break-words"
                >
                  {msg.content}
                </div>
              ),
            )}
          </div>
        )}
      </div>

      <form
        onSubmit={handleSubmit}
        className="pt-3 border-t border-surface-border"
      >
        <div className="relative">
          <Textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask the AI architect..."
            rows={3}
            className="min-h-[72px] max-h-[160px] resize-none bg-elevated border-surface-border text-copy-primary placeholder:text-copy-faint pr-12"
          />
          <Button
            type="submit"
            size="icon-sm"
            disabled={!canSend}
            className="absolute right-2 bottom-2 bg-ai text-white hover:bg-ai/90"
            aria-label="Send message"
          >
            <Send className="h-3.5 w-3.5" />
          </Button>
        </div>
        <p className="text-[10px] text-copy-faint mt-2">
          Press Enter to send · Shift+Enter for newline
        </p>
      </form>
    </div>
  );
}

function EmptyState({
  onPickPrompt,
}: {
  onPickPrompt: (prompt: string) => void;
}) {
  return (
    <div className="flex flex-col items-center text-center px-2 py-8">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-ai/15 text-ai-text mb-4">
        <Bot className="h-6 w-6" />
      </div>
      <p className="text-sm font-medium text-copy-primary">How can I help?</p>
      <p className="text-xs text-copy-muted mt-1 max-w-[20rem]">
        Describe what you want to design and Pulse AI will help you sketch the
        architecture.
      </p>
      <div className="flex flex-wrap justify-center gap-2 mt-5">
        {STARTER_PROMPTS.map((prompt) => (
          <button
            key={prompt}
            type="button"
            onClick={() => onPickPrompt(prompt)}
            className="rounded-full bg-subtle text-ai-text text-xs px-3 py-1.5 hover:bg-elevated transition-colors"
          >
            {prompt}
          </button>
        ))}
      </div>
    </div>
  );
}

function SpecsTab() {
  return (
    <div className="flex flex-1 flex-col min-h-0 gap-4">
      <Button
        type="button"
        className="w-full bg-ai text-white hover:bg-ai/90"
      >
        <Sparkles className="h-4 w-4" />
        Generate Spec
      </Button>

      <div className="flex-1 min-h-0 overflow-y-auto pr-1">
        <div className="rounded-2xl border border-surface-border bg-elevated p-4 flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-subtle text-ai-text shrink-0">
              <FileText className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-copy-primary truncate">
                E-commerce Backend Spec
              </p>
              <p className="text-xs text-copy-muted">Draft · just now</p>
            </div>
          </div>
          <p className="text-xs text-copy-secondary leading-relaxed">
            REST API with an auth service, product catalog, order management,
            and a Postgres database. Background queues handle async order
            processing and email notifications.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled
            className="self-start"
          >
            <Download className="h-3.5 w-3.5" />
            Download
          </Button>
        </div>
      </div>
    </div>
  );
}
