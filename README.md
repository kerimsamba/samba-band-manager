# Samba Social · Band Manager

**Big rhythms. Beautiful chaos.** A playable management game about building a community samba band in Glasgow. Develop the musicians, book Scottish gigs, conduct the show, and keep the group chat from falling apart.

This is the second-generation version of Samba Band Manager, rebuilt in React and TypeScript with an animated gig world. The untouched original is preserved in [`docs/original.html`](docs/original.html).

## Play locally

Requires Node.js 22+ and npm.

```sh
npm ci
npm run dev
```

Open the localhost address Vite prints. The game works on desktop and phone-sized screens. No accounts, API keys, backend, or paid services are required.

## What you can do

- **Clubhouse:** see the next gig, finances, morale, readiness, energy, and the latest band news.
- **The band:** search and sort 30 distinct starting players, inspect their strengths, recruit, and cross-train across eight samba instruments.
- **Gigs & calendar:** book future events, release future bookings, avoid same-day clashes, and review past performances.
- **Rehearsal room:** choose groove, showmanship, or rest; run one £80 rehearsal each week.
- **Finances:** pay weekly running costs and invest in three levels each of transport, kit, and promotion.
- **Band journal:** follow gig outcomes, expenses, grants, injuries, and rehearsal-room drama.
- **Live gig day:** watch animated drummers, dancing crowds, lights, and confetti. Choose your opening approach, call a mid-show cue, and decide how to finish. Optional procedural stereo samba percussion plays only when enabled.

Shows support pause, 1×/2×/4× speed, and skipping to the result. Closing an unfinished show stores the performance position in the current browser tab; reopening the gig resumes from that point as long as the band state has not changed. The stage is a stylized representation of the band, not a one-avatar-per-attendee visualization.

## The season

Start with **30 musicians, £2,400, reputation 42, and band spirit 76**. Your first booking is the Kelvingrove Summer Social.

1. Choose a rehearsal focus and develop your band.
2. Book suitable gigs in the coming weeks.
3. Play every booked gig due this week.
4. Advance the week to pay upkeep, recover energy, progress training, and receive new offers and events.
5. Complete **20 successful gigs** to win. Running out of money, losing all reputation, or falling below 12 available players ends the season.

Attendance is uncertain. Reliability, energy, morale, travel, scheduling, and transport upgrades affect who arrives. Every required instrument slot needs a different musician. Cross-trained musicians can cover either role; the engine finds a full assignment when one exists.

Musicianship, fatigue, coverage, kit quality, and conducting decisions affect performance. Bold arrangements and encores can improve the show but consume more energy; tired bands can struggle. Crowd-focused choices reward community growth. Forecast confidence estimates lineup completeness, not a guaranteed gig score.

## Saves

The game auto-saves under `sambaSocial_v2` in browser local storage. Open the manager avatar to download or restore a JSON backup. Storage failure shows a backup warning. Save imports validate nested data before accepting it.

The original `sambaBandManager_v1` save is left untouched. Version 1 saves are not imported into the new ruleset; use the preserved original to continue an old season. Local saves belong to a browser and origin, so export before changing devices, ports, or deployments.

## Development

```sh
npm test              # deterministic simulation and save-integrity tests
npm run test:e2e      # Playwright desktop and mobile flows
npm run build        # TypeScript check + production bundle
npm run preview      # serve the production build locally
npm run format:check # source formatting check
```

Playwright uses its installed Chromium, with a local Google Chrome fallback on macOS. If neither is available, run `npx playwright install chromium` first. E2E tests start their own Vite server on port 5174.

```text
src/
  App.tsx                  App shell, clubhouse, rehearsal, journal, save management
  components/
    Band.tsx               Roster, filtering, recruitment
    Gigs.tsx               Calendar, invitations, gig history
    Finances.tsx           Budget and investments
    LiveGig.tsx            Performance lifecycle and conducting decisions
    GigStage.tsx           Responsive animated SVG world
    useSambaAudio.ts       Procedural Web Audio samba groove
    Dialog.tsx             Keyboard-accessible modal
    ui.tsx                 Shared avatars, meters, tags
  game/
    engine.ts              Pure deterministic simulation; no browser APIs
    engine.test.ts         Economy, matching, progression, persistence invariants
```

All artwork and percussion are generated locally by SVG/CSS and Web Audio. Fonts are bundled with the app, so the production build makes no external font or asset requests. The UI respects reduced-motion preferences; sound is off initially.

## Deploy

This is a static Vite application. On Vercel, Netlify, or another static host:

- Install: `npm ci`
- Build: `npm run build`
- Output directory: `dist`

No server-side environment variables are needed. Opening the source `index.html` directly is no longer supported; use the dev server or the built site.

See [`docs/REVIEW.md`](docs/REVIEW.md) for the review findings, changes, and remaining limits.
