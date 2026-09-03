import { useAppStore } from "@/features/persistence/controllers/use-app-store";

export function useOnboarding() {
  const complete = useAppStore((s) => s.settings.onboardingComplete);
  const finishOnboarding = useAppStore((s) => s.finishOnboarding);
  const replayOnboarding = useAppStore((s) => s.replayOnboarding);
  return { complete, finishOnboarding, replayOnboarding };
}
