import type { OnboardingAnswers } from "@/features/onboarding/models/onboarding";
import { buildFocusWeek } from "@/features/schedule/services/template-service";
import { emptyWeek } from "@/features/schedule/models/week";
import type { WeekSchedule } from "@/features/schedule/models/task";
import type { UserSettings } from "@/features/settings/models/user-settings";
import { DEFAULT_SETTINGS } from "@/features/settings/models/user-settings";

export function applyOnboarding(answers: OnboardingAnswers): {
  schedule: WeekSchedule;
  settings: UserSettings;
} {
  const settings: UserSettings = {
    ...DEFAULT_SETTINGS,
    displayName: answers.name.trim(),
    trackPrayers: answers.trackPrayers,
    peakStart: answers.peakStart,
    peakEnd: answers.peakEnd,
    logoff: answers.logoff,
    buildMode: answers.buildMode,
    workspaceName: answers.workspaceName.trim() || (answers.name ? `${answers.name}` : ""),
    onboardingComplete: true,
  };
  const schedule =
    answers.buildMode === "custom"
      ? emptyWeek()
      : buildFocusWeek({
          peakStart: answers.peakStart,
          peakEnd: answers.peakEnd,
          logoff: answers.logoff,
          trackPrayers: answers.trackPrayers,
        });
  return { schedule, settings };
}
