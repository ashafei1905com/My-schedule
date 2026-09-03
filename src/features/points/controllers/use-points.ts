import { useAppStore } from "@/features/persistence/controllers/use-app-store";

export function usePoints() {
  return useAppStore((s) => s.stats);
}
