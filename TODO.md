# TODO - Weekly Reporting System + Per-date Persistence

- [ ] Refactor date utilities (Kuwait timezone) to compute week start/end and calendar dates for Sun..Sat
- [ ] Update persistence layer from global `DONE`/`SELECTED_ALTS` to `DONE_BY_DATE`/`ALTS_BY_DATE` loaded per selected date
- [ ] Update rendering (`renderPanel`, `switchDay`, task completion handlers) to read/write based on selected `dateStr`
- [ ] Implement weekly archive trigger: on bootstrap, detect new week after Saturday and generate summary for previous week, then archive under `sc:weekly:${weekEnd}`
- [ ] Reset weekly/daily points when new week begins
- [ ] Add week navigation UI so “previous day tab” can show historical days (past weeks)

- [ ] Ensure cloud backup (Firestore) stores per-day DONE and per-date alts; keep stats reset compatible
- [ ] Quick manual test checklist
  - [ ] Mark tasks done/qada on multiple dates, reload and verify persistence
  - [ ] Navigate to past week and verify tasks show as completed/missed
  - [ ] Confirm weekly archive entries appear in localStorage after Saturday → Sunday transition

