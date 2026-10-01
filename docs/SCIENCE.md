# Science → Features

Every feature must map to a mechanism here. If a feature doesn't, question it.

## The 4 Laws of Behavior Change (Atomic Habits)

| Law | Mechanism | Feature |
|---|---|---|
| 1. Make it obvious | Implementation intentions: "I will [X] at [time] in [place]" (Gollwitzer, 1999; meta-analysis Gollwitzer & Sheeran, 2006, d≈0.65) | `habits.implementation_intention` field in the creation flow |
| | Habit stacking: "After [current habit], I will [new habit]" | `cue_type = after_habit` + `anchor_habit_id`; completing the anchor surfaces/notifies the next habit |
| | Context cues ("When I get home → gym") | `cue_type = context` + `context_label`; optional geofence later |
| 2. Make it attractive | Temptation bundling (Milkman et al., 2014) | `habits.temptation_bundle` ("Only listen to my podcast while walking") |
| | Identity + social norms | Identity statements (tree branches); Couples mode |
| 3. Make it easy | 2-minute rule; reduce friction | `habits.two_minute_version`; `done_minimum` log status counts toward the streak |
| 4. Make it satisfying | Immediate reward; habit tracking | Check-in animation + haptics, the tree grows immediately, visual tracker |

## Identity-based habits
"Every action you take is a vote for the type of person you wish to become." Completions are **votes** that grow the Identity Tree (see `GAMIFICATION.md`). Users define identities ("Soy una persona que lee") and link habits to them.

## Time to automaticity
Lally et al. (2010): median **~66 days** to reach automaticity, range **18–254**. Missing a single day did not significantly affect the process.
→ Show an honest "automaticity journey" per habit. Never promise "21 days". A habit becomes a **fruit** on the tree after ~66 days of consistency. The coach marks halfway, "close" and the fruit (`automaticity`).

## Never miss twice
One miss is an accident; two is the start of a new (bad) habit. Avoid the *abstinence violation effect* ("I already ruined it, so why bother").
→ Streaks tolerate a single miss; the tree wilts slightly and recovers when you return. The coach suggests the 2-minute version after a miss (rule `never_miss_twice`, one tap to log it) and welcomes users back after two missed days (`comeback`).

## The 1% rule
1.01^365 ≈ 37.8. Small improvements compound.
→ "1% curve" chart comparing actual consistency with the compounding curve.

## Time of day and energy
Habits placed at consistent times and anchored to stable routines form faster. Show completion rate per day band (morning / afternoon / night) so users learn *when* they succeed.

## Coach (rule-based tip)
A tip on Today per day band. Detectors (`src/features/coach/detectors.ts`) read the user's own
history and each cites a mechanism above; the highest score wins, insights shown in the last 3 days
step aside, and every tip has a "¿Por qué?" line with the data and the source.

| Detector | Mechanism |
|---|---|
| never miss twice (+ "you came back the last N times") | Never miss twice; abstinence violation effect |
| comeback after two missed days | Abstinence violation effect |
| usual check-in time, running late | Stable times form habits faster (time of day) |
| weak weekday → lower the bar | 2-minute rule (Law 3) |
| automaticity: halfway, close, fruit | Lally et al. (2010), ~66 days, range 18–254 |
| projected fruit date from recent pace | Lally et al.; worded as an estimate, never a promise |
| struggling habit → 2-minute version / when and where | Law 3; implementation intentions (Law 1) |
| heavy day in the weakest band → front-load | Time of day and energy |
| best day band | Time of day and energy |
| better week | The 1% rule |
| minimum version kept the streak alive | 2-minute rule; identity votes |
| rotating science fact (fallback) | — |

Every detector stays silent below a minimum sample (e.g. at least 4 of a weekday, 5 timed
check-ins). Claude (weekly review, chat) builds on top later.

## Ethics guardrails
- No variable-ratio "slot machine" rewards meant to create compulsion.
- No guilt or shame copy. Notifications are capped and respect quiet hours.
- Success is measured by the user's behavior change, not by time spent in the app.
