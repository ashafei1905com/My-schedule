# TODO - My-schedule

## Streak fixes
- [x] Remove forced reset of STATS.best on loadAll()
- [ ] Update checkStreak() so:
  - [ ] STATS.best represents max streak-days (not points)
  - [ ] STATS.best only updates when streak is broken/lost (if user wants that behavior)
  - [ ] STATS.cur resets when user loses the streak

## Weekly report changes
- [ ] Change weekly report day ordering to Saturday → Friday
- [ ] Add Weekly History UI that shows savedReports anytime

## Verification
- [ ] Open index.html in browser and test:
  - Streak increments/resets correctly
  - Weekly report shows correct day order
  - Weekly history list shows saved reports

