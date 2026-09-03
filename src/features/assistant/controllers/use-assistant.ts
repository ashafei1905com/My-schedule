import { useAppStore } from "@/features/persistence/controllers/use-app-store";

export function useAssistant() {
  const chat = useAppStore((s) => s.chat);
  const sendAssistant = useAppStore((s) => s.sendAssistant);
  const clearChat = useAppStore((s) => s.clearChat);
  return { chat, sendAssistant, clearChat };
}
