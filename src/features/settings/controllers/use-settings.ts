import { useAppStore } from "@/features/persistence/controllers/use-app-store";

export function useSettings() {
  const settings = useAppStore((s) => s.settings);
  const patchSettings = useAppStore((s) => s.patchSettings);
  return { settings, patchSettings };
}
