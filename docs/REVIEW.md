# Review and rebuild

## Starting point

The original game has a strong premise: unreliable attendance, instrument balance, and a very Scottish community band. It ships as a self-contained mobile HTML file with a text-only weekly gig summary.

The main limitation was the absence of a performance experience. Managing the band did not lead to anything you could watch or influence on stage. Its fixed 560px layout also left desktop space unused, and simulation code called UI methods directly, making independent tests difficult.

## Changes delivered

- Replaced the narrow interface with a responsive management clubhouse, sidebar/bottom navigation, six working screens, player portraits, gig posters, and visible season progress.
- Added a custom SVG festival scene with eleven representative drummers, a dancing audience, stage lighting, bunting, and confetti. Animation respects reduced motion and pauses with the show.
- Added a three-part gig sequence: approach, mid-show cue, and finale. Prepared bands can take risks; fatigue and missing roles have consequences. Show reports include a score, attendance, net payment, reputation, fan growth, and decision-specific highlights.
- Added opt-in stereo percussion with surdo, caixa, agogo, and shaker voices. Audio is synthesized locally and stopped when the show pauses or closes.
- Split React screens, reusable UI, the scene, audio, and pure simulation into separate modules.
- Added recruitment, instrument training, three rehearsal focuses, scheduled offers, and permanent investments with explicit prices.
- Added import/export backups, nested save validation, storage-error feedback, keyboard modal focus management, and unfinished-show resumption within the browser tab.

- Made turns explicitly weekly: management decisions lock when the player finishes planning, gigs run as intermediate events, and the next turn opens only after all due gigs. The phase survives reloads and older v2 saves remain usable.
- Added equal home-screen action cards with direct views for open invitations and this week’s bookings.
- Reworked phones with readable typography, 44–48px controls, player cards with named stats, stacked conducting choices, and safe-area-aware navigation and dialogs.

## Correctness findings addressed

1. **Misleading instrument readiness:** the old UI counted a multi-instrument musician in more than one requirement chip. The new engine uses maximum bipartite matching, so each musician occupies one slot and flexible players can move to cover a gap.
2. **Availability versus performance:** the new forecast estimates attendees and complete-lineup probability using an isolated deterministic preview RNG. Real gig scoring uses the players who actually arrived.
3. **Irreversible future booking clicks:** future gigs can now be released. Committed gigs due this week must be played, and same-day bookings conflict.
4. **Weak save validation:** imported and stored games now validate numeric ranges, nested member/gig/result data, unique IDs, instruments, and history totals before loading.
5. **Repeated rewards and costs:** resolved gigs are removed and cannot pay twice; rehearsals are once per week; upgrades enforce maximum levels and affordability; terminal seasons block further actions.
6. **Animation layout collision:** browser inspection exposed CSS keyframes overriding SVG translations. Static positioning and animated movement now live on separate groups, covered by a browser geometry regression test.
7. **Pause between conducting cues:** separate pending-decision and pause state prevents the resume button from becoming stuck after the first cue.

## Verification

The test suite covers deterministic creation and playthrough, real win/loss transitions, weekly finances, rehearsal gating, recruitment, training/recovery, unique instrument assignments, risk/energy tradeoffs, upgrade effects, save corruption, immutability, and duplicate result prevention.

Browser checks exercise a complete performance, all three decisions, result persistence, booking/release, roster search and training, recruitment, weekly advancement, save restore, show pause/resume, animated performer placement, and narrow-screen overflow. Weekly phase tests cover two gigs without accidental advancement, locked management, reloads between events, and reopening rehearsal next week. Responsive checks measure controls, typography, and overflow at 320px, 390px, and 430px.

## Current scope

This is a substantial playable local single-player rebuild, not an equivalent in depth to a mature Football Manager release. It has no multiplayer, cloud sync, real music licensing, full career leagues, player contracts, or editable song/setlist system. Gigs use an illustrated performance sequence tied to a statistical result; they are not note-by-note audio physics. The stage uses representative performers rather than every roster member.

Version 1 saves remain separate because the state model and simulation rules changed. Balance is covered by deterministic scenarios, but long-term tuning would benefit from actual player feedback.
