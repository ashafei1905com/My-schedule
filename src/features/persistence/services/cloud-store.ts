import { createServerFn } from "@tanstack/react-start";
import type { PersistedAppState } from "@/features/persistence/models/app-state";

/** Local-first build: cloud sync is unused. Stubs keep the module importable. */
export const loadCloudState = createServerFn({ method: "GET" }).handler(async () => {
  return null as PersistedAppState | null;
});

export const saveCloudState = createServerFn({ method: "POST" })
  .validator((input: PersistedAppState) => input)
  .handler(async () => {
    return { ok: false as const };
  });
