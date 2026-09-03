import { Send, Sparkles, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import { useAppStore } from "@/features/persistence/controllers/use-app-store";
import { t } from "@/shared/lib/i18n";
import { Button } from "@/shared/ui/button";
import { Sheet, SheetContent } from "@/shared/ui/sheet";
import { Textarea } from "@/shared/ui/textarea";

export function AssistantPanel({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const lang = useAppStore((s) => s.settings.lang);
  const chat = useAppStore((s) => s.chat);
  const send = useAppStore((s) => s.sendAssistant);
  const clear = useAppStore((s) => s.clearChat);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  async function onSend() {
    const v = text.trim();
    if (!v || busy) return;
    setText("");
    setBusy(true);
    await send(v);
    setBusy(false);
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent title={t(lang, "assistant")} side="bottom" className="flex max-h-[88vh] flex-col">
        <p className="mb-3 text-xs text-fg-muted">{t(lang, "askPlaceholder")}</p>
        <div className="min-h-40 flex-1 space-y-3 overflow-y-auto rounded-lg border border-border bg-bg-elevated p-3">
          {(chat?.messages ?? []).length === 0 ? (
            <p className="py-8 text-center text-sm text-fg-subtle">{t(lang, "askPlaceholder")}</p>
          ) : (
            chat?.messages.map((m) => (
              <div
                key={m.id}
                className={`max-w-[90%] rounded-lg px-3 py-2 text-sm leading-relaxed ${
                  m.role === "user" ? "ms-auto bg-primary text-primary-fg" : "bg-surface text-fg"
                }`}
              >
                {m.content.replace(/```json[\s\S]*?```/g, "").trim()}
              </div>
            ))
          )}
          {busy ? <p className="text-xs text-fg-subtle">{t(lang, "thinking")}</p> : null}
          <div ref={endRef} />
        </div>
        <div className="mt-3 flex items-end gap-2">
          <Textarea
            className="min-h-12 flex-1"
            rows={2}
            placeholder={t(lang, "askPlaceholder")}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void onSend();
              }
            }}
          />
          <Button size="icon" onClick={() => void onSend()} disabled={busy || !text.trim()} aria-label={t(lang, "send")}>
            <Send className="size-4" />
          </Button>
          <Button size="icon" variant="ghost" onClick={clear} aria-label={t(lang, "newChat")}>
            <Trash2 className="size-4" />
          </Button>
        </div>
        <div className="mt-2 flex items-center gap-1.5 text-[11px] text-fg-subtle">
          <Sparkles className="size-3" />
          {t(lang, "assistant")}
        </div>
      </SheetContent>
    </Sheet>
  );
}
