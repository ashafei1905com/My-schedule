import { useRef, useState } from "react";
import { askAssistant } from "@/lib/ai";
import { t, type Lang } from "@/lib/schedule/i18n";
import type { ChatMessage, Task } from "@/lib/schedule/types";
import { Btn } from "./modal";
import { X } from "lucide-react";

export function AiPanel({
  open,
  lang,
  messages,
  context,
  onClose,
  onPush,
  onClear,
  onApply,
}: {
  open: boolean;
  lang: Lang;
  messages: ChatMessage[];
  context: string;
  onClose: () => void;
  onPush: (m: ChatMessage) => void;
  onClear: () => void;
  onApply: (days: Partial<Record<number, Task[]>>) => void;
}) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const scroller = useRef<HTMLDivElement>(null);

  if (!open) return null;

  const send = async () => {
    const q = text.trim();
    if (!q || busy) return;
    setText("");
    setErr("");
    onPush({ role: "user", content: q });
    setBusy(true);
    try {
      const res = await askAssistant({
        data: { messages: [...messages, { role: "user", content: q }], context },
      });
      if (!res.ok) {
        setErr(res.error);
        onPush({ role: "assistant", content: t(lang, "aiOffline") });
      } else {
        onPush({ role: "assistant", content: res.text });
        const parsed = extractDays(res.text);
        if (parsed) onApply(parsed);
      }
    } catch {
      setErr(t(lang, "aiOffline"));
    } finally {
      setBusy(false);
      requestAnimationFrame(() => {
        scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
      });
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-bg sm:inset-auto sm:bottom-6 sm:end-6 sm:h-[min(640px,80dvh)] sm:w-[400px] sm:overflow-hidden sm:rounded-xl sm:border sm:border-border sm:shadow-panel">
      <header className="flex items-center justify-between border-b border-border px-4 py-3">
        <div>
          <div className="text-sm font-semibold">{t(lang, "assistant")}</div>
          <div className="text-xs text-fg-muted">{t(lang, "assistantHint")}</div>
        </div>
        <div className="flex items-center gap-1">
          <button type="button" className="h-9 px-2 text-xs text-fg-muted" onClick={onClear}>
            {t(lang, "newChat")}
          </button>
          <button type="button" className="flex size-9 items-center justify-center text-fg-muted" onClick={onClose} aria-label={t(lang, "close")}>
            <X className="size-4" />
          </button>
        </div>
      </header>
      <div ref={scroller} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.length === 0 ? (
          <p className="text-sm leading-relaxed text-fg-muted">{t(lang, "assistantHint")}</p>
        ) : (
          messages.map((m, i) => (
            <div
              key={i}
              className={
                m.role === "user"
                  ? "ms-8 rounded-md bg-surface-2 px-3 py-2 text-sm"
                  : "me-4 whitespace-pre-wrap rounded-md border border-border bg-surface px-3 py-2 text-sm leading-relaxed"
              }
            >
              {stripJsonFence(m.content)}
            </div>
          ))
        )}
        {busy ? <p className="text-xs text-fg-subtle">{t(lang, "aiBusy")}</p> : null}
        {err ? <p className="text-xs text-danger">{err}</p> : null}
      </div>
      <form
        className="flex gap-2 border-t border-border p-3"
        onSubmit={(e) => {
          e.preventDefault();
          void send();
        }}
      >
        <textarea
          rows={2}
          className="flex-1 resize-none rounded-sm border border-border bg-bg px-3 py-2 text-sm outline-none ring-ring focus:ring-2"
          placeholder={t(lang, "assistantPh")}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void send();
            }
          }}
        />
        <Btn disabled={busy || !text.trim()} onClick={() => void send()}>
          {t(lang, "send")}
        </Btn>
      </form>
    </div>
  );
}

function stripJsonFence(s: string): string {
  return s.replace(/```json[\s\S]*?```/g, "").trim();
}

function extractDays(text: string): Partial<Record<number, Task[]>> | null {
  const m = text.match(/```json\s*([\s\S]*?)```/);
  if (!m) return null;
  try {
    const obj = JSON.parse(m[1]) as { action?: string; days?: Record<string, Task[]> };
    if (!obj.days) return null;
    const out: Partial<Record<number, Task[]>> = {};
    for (const [k, v] of Object.entries(obj.days)) {
      const jd = Number(k);
      if (!Array.isArray(v)) continue;
      out[jd] = v.map((t) => ({
        id: t.id || `${jd}-${Math.random().toString(36).slice(2, 7)}`,
        start: t.start,
        end: t.end,
        category: t.category || "work",
        name: t.name,
        nameAr: t.nameAr || t.name,
        desc: t.desc || "",
        descAr: t.descAr || t.desc || "",
        pts: Number(t.pts) || 10,
        notify: t.notify !== false,
        foodLog: t.category === "food" || t.category === "snack",
        optional: t.category === "free" || t.category === "snack",
      }));
    }
    return out;
  } catch {
    return null;
  }
}
