# Gamification: the Identity Tree

Every completed habit is a **seed** planted for the person you want to become. Seeds feed a living tree rendered with Skia.

**The sowing metaphor (decided 2026-09-30, replaces "votes" in all copy):**
- **Plant (🌱 semillas):** every completed habit. The counter in the top bar, the garden and Progress.
- **Water (💧 gotas):** earned by consistency; the currency of the character (below).
- **Harvest (🍎 frutos):** a habit that reached ~66 repetitions.

Code still calls planted seeds `votes` (`useVotes`, `votesKey`, i18n keys `*.votes_*`): only the words changed.

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
0 Seed → 1 Sprout → 2 Sapling → 3 Tree → 4 Fruiting tree. Thresholds are based on seeds planted and weeks of consistency, tuned during Phase 2.

## Health (`garden_state.health`)
- A single miss makes leaves droop slightly ("never miss twice"); it recovers fully on the next completion.
- Repeated misses make the tree lose leaves, but it **never dies**. Progress is never erased, only paused.

## Environment
- The sky follows the real local time and the user's day bands: dawn/morning (warm), afternoon (golden), night (deep blue with stars).
- Weather reflects today: sunny when on track, cloudy when there are pending habits, a light rain animation when the day is completed (watering).
- Seasons follow the calendar month.

## Your character (decided 2026-09-29, design open)
Each user has a **customizable character** that is *them* growing: the identity principle made visible. It is the main delight feature, works solo from day 1, and is what friends see. It must be very visual and alive (Duolingo-level).

**Decided (2026-09-29): a plant avatar built from five swappable parts.** Brote is the default plant.
| Part | Examples |
|---|---|
| Plant | brote, cactus, sunflower, tulip, tree, mushroom, palm, … (many over time) |
| Pot | terracotta, wood, Japanese, rainbow, space, gaming, … |
| Eyes | several styles, each with the moods below |
| Mouth | several styles, each with the moods below |
| Accessory | cap, glasses, crown, bow, … |

- **It is the user's profile picture**: what friends see in shared streaks, circles and leagues. Every part must read at ~40 px.
- **Anchor points, not fixed positions:** each plant declares a `face` anchor (position + scale) and a `head` anchor; pots share one `base` line. Eyes, mouths and accessories are drawn once, centered on their anchor, so any part fits any plant and a new plant never forces redrawing the others.
- **Launch small, grow in seasons:** ~6 plants, 4 pots, 5 eyes, 5 mouths, 6 accessories at launch (thousands of combinations); new parts in themed drops. Rive files can be fetched remotely, so new parts need no app update.
- Open: whether the avatar plant also grows in stages with consistency (lovely, but multiplies plant art — later).

**Unlocks: free, earned with drops, or bought.**
- **Drops (💧 gotas)** are earned by **consistency, never by raw check-ins**: streak milestones, consistent weeks, the ~66-day automaticity mark; daily cap. Adding trivial habits must not earn more.
- **Drops are never sold for money.** Paid items are bought directly; otherwise completing habits becomes "the slow way to pay" (overjustification risk, see SCIENCE.md ethics).
- **Computed on the server:** an append-only drop ledger written by Postgres from real logs (function/trigger), never granted by the client. Inventory table records each owned part and its source (free / earned / purchased); `profiles` stores the equipped combination.

**Asset spec (for designing with other AIs / Claude Cowork):**
- SVG, `viewBox="0 0 120 120"`, flat shapes (no filters, no raster), palette from `src/constants/theme.ts` + the Brote colors in `src/features/mascot/brote.tsx`.
- **One layer per swappable part**, each a separate group or file: body, eyes/face per mood, leaves/hair, accessory (head), accessory (hand), pot/base, background item. Parts share the same canvas so they align without offsets.
- Moods at minimum: happy, cheer, celebrate, sleepy (rest day), sad-but-kind (missed yesterday — never shaming).
- Growth stages if the character grows (seed → sprout → young → grown), same layers per stage.
- Final animation in **Rive** (`.riv`): one state machine with a `mood` number input and a `cheer` trigger; skins and accessories as swappable artboards or nested components. Rive needs a development build (`rive-react-native`).

**Tools.** Raster generators such as Ludo.ai (spritesheet PNG / GIF / MP4) are great for concept exploration, one-off non-customizable animations (day-complete celebration, confetti, onboarding moments), check-in sound effects and store/marketing video — but **not** for the customizable character: pre-rendered frames multiply by every combination of parts, while vector layers + Rive animate any combination once. Spritesheets can be played with Skia. Confirm commercial-use licensing before shipping any generated asset.

## Cosmetics (Pro)
Skins, accessories, pots and garden themes. **Cosmetic only, never pay-to-win**; no loot boxes, no fake scarcity ("only today!"). Some cosmetics are earned by milestones, so free users also customize.

## Friends & circles (replaces "Couples")
A couple is a circle of two, so the base is **friends and small circles**:
- Follow / friend requests; see a friend's character, tree, streak and consistency %. **Habit names stay private by default** (people track sensitive habits).
- **Shared streaks:** grow when both complete their day; they follow "never miss twice" — one partner's single miss never breaks it (no guilt toward the other).
- Cheers (reactions) and gentle nudges; intertwined trees for circles of two.
- App Store requirement for user interaction (guideline 1.2): block, report, moderation, usernames; account deletion cascades.

## Leagues (opt-in)
Weekly leagues of ~30 people, top ranks move up, bottom ranks move down (Duolingo-style) — not ELO, which models head-to-head matches. Score = **consistency % on your own scheduled habits**, never raw check-in counts (adding trivial habits must not win). Opt-in: competition motivates some people and causes the anxiety we promised to avoid in others.

## Rewards
- Immediate: check-in animation, haptic tap, a leaf/particle flies to the tree, the character reacts.
- Milestones: new branch, first flower, first fruit, character growth stages. Unlockable garden themes and cosmetics.
- No loot boxes and no randomized compulsion loops (see SCIENCE.md, ethics).
