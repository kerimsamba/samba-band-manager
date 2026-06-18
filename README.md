# 🥁 Samba Band Manager

A lightweight, mobile-first management simulation game inspired by Football Manager — but about running a chaotic community samba band in Scotland.

You don't control the performances. You manage **people, training, recruitment, morale and band structure**, trying to field enough balanced musicians to fulfil gigs despite unreliable attendance and ever-changing life circumstances.

## Play

Open `index.html` in any modern browser, or deploy the folder to Vercel and open the URL on your phone. It's a single self-contained HTML file — HTML + CSS + vanilla JavaScript, with the save game stored in `localStorage`.

## How to play

- **Start:** 30 members, £2,000, reputation 50, morale 60.
- **Goal:** complete **20 successful gigs**.
- **Game over if:** bank balance < £0, active members < 12, or reputation hits 0.

### Weekly loop
1. New gig offers appear (Parade, Gala Day, Festival, Corporate).
2. Accept the gigs you think you can staff.
3. Train members onto new instruments and recruit new players.
4. Advance the week — a signup simulation decides who actually turns up.
5. Each gig succeeds, scrapes through, performs poorly, or is cancelled based on attendance and instrument balance.
6. Finances, reputation and morale update, and random life events cause chaos.

### Screens
- **Home** — dashboard, objectives and win progress.
- **Gigs** — offers with live requirement readiness chips (green = enough available players).
- **Band** — sortable/searchable roster; tap a member for full stats and to retrain.
- **Manage** — recruitment (Open Rehearsal £100, Social Media £250) and training.
- **News** — weekly events feed (marriages, injuries, drama, viral videos, grants, rivals…).

## Tech

- Single file: `index.html` (no build step, no backend, no dependencies).
- Mobile GUI priority: bottom tab navigation, safe-area insets, touch-friendly controls.
- Save/load via `localStorage`.

## Deploy to Vercel

This is a static site — no configuration needed. Point Vercel at the repo (or `vercel deploy`) and it serves `index.html` directly.
