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
→ Show an honest "automaticity journey" per habit. Never promise "21 days". A habit becomes a **fruit** on the tree after ~66 days of consistency.

## Never miss twice
One miss is an accident; two is the start of a new (bad) habit. Avoid the *abstinence violation effect* ("I already ruined it, so why bother").
→ Streaks tolerate a single miss; the tree wilts slightly and recovers when you return. The coach suggests the 2-minute version after a miss.

## The 1% rule
1.01^365 ≈ 37.8. Small improvements compound.
→ "1% curve" chart comparing actual consistency with the compounding curve.

## Time of day and energy
Habits placed at consistent times and anchored to stable routines form faster. Show completion rate per day band (morning / afternoon / night) so users learn *when* they succeed.

## Ethics guardrails
- No variable-ratio "slot machine" rewards meant to create compulsion.
- No guilt or shame copy. Notifications are capped and respect quiet hours.
- Success is measured by the user's behavior change, not by time spent in the app.
