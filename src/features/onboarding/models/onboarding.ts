export interface OnboardingAnswers {
  name: string;
  trackPrayers: boolean;
  peakStart: string;
  peakEnd: string;
  logoff: string;
  buildMode: "template" | "custom";
  workspaceName: string;
}

export const EMPTY_ONBOARDING: OnboardingAnswers = {
  name: "",
  trackPrayers: true,
  peakStart: "08:00",
  peakEnd: "11:00",
  logoff: "17:30",
  buildMode: "template",
  workspaceName: "",
};

export const ONBOARDING_STEPS = 5;
