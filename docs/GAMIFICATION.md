# Gamification: the Identity Tree

Every completed habit is a **vote** for the person you want to become. Votes feed a living tree rendered with Skia.

## Anatomy
| Tree part | Meaning |
|---|---|
| Trunk | Core identity / total consistency |
| Branches | Identities / areas (Health, Mind, Relationships, Work) → `identities` |
| Leaves | Active habits on that branch |
| Flowers | Consistent weeks (e.g. ≥80% of scheduled occurrences) |
| Fruits | Habits that reached automaticity (~66 days of consistency) |
| Roots | Habit stacks (`anchor_habit_id` chains), visible underground |

## Growth stages (`garden_state.stage`)
0 Seed → 1 Sprout → 2 Sapling → 3 Tree → 4 Fruiting tree. Thresholds are based on votes and weeks of consistency, tuned during Phase 2.

## Health (`garden_state.health`)
- A single miss makes leaves droop slightly ("never miss twice"); it recovers fully on the next completion.
- Repeated misses make the tree lose leaves, but it **never dies**. Progress is never erased, only paused.

## Environment
- The sky follows the real local time and the user's day bands: dawn/morning (warm), afternoon (golden), night (deep blue with stars).
- Weather reflects today: sunny when on track, cloudy when there are pending habits, a light rain animation when the day is completed (watering).
- Seasons follow the calendar month.

## Couples (Pro)
Two trees with intertwined roots. Shared weekly habits grow a **shared fruit** when both partners complete them. Partners can send cheers (reactions) and "nudges".

## Rewards
- Immediate: check-in animation, haptic tap, a leaf/particle flies to the tree.
- Milestones: new branch, first flower, first fruit. Unlockable garden themes (Pro).
- No loot boxes and no randomized compulsion loops (see SCIENCE.md, ethics).
