import assert from "node:assert/strict";
import test from "node:test";
import {
  INSTRUMENTS,
  advanceWeek,
  assignAttendees,
  bookGig,
  createGame,
  getReadiness,
  loadGame,
  recruit,
  rehearse,
  resolveGig,
  setRehearsal,
  trainMember,
  unbookGig,
  upgrade,
  weeklyCost,
} from "./engine";

const choices = {
  approach: "steady" as const,
  cue: "tighten" as const,
  finale: "classic" as const,
};

test("starts with a balanced roster and a deterministic booked hero gig", () => {
  const a = createGame(17);
  const b = createGame(17);
  assert.deepEqual(a, b);
  assert.equal(a.bank, 2400);
  assert.equal(a.gigs[0].name, "Kelvingrove Summer Social");
  assert.equal(a.gigs[0].booked, true);
  const counts = INSTRUMENTS.map(
    (instrument) => a.members.filter((m) => m.instrument === instrument).length,
  );
  assert.ok(Math.max(...counts) - Math.min(...counts) <= 1);
});

test("enforces day conflicts and due gig order", () => {
  const state = createGame(4);
  const offer = state.gigs.find((g) => !g.booked)!;
  assert.throws(() => unbookGig(state, state.gigs[0].id), /due gig/i);
  const booked = bookGig(state, offer.id);
  const conflict = { ...offer, id: "conflicting-offer", booked: false };
  assert.throws(
    () => bookGig({ ...booked, gigs: [...booked.gigs, conflict] }, conflict.id),
    /already have/i,
  );
  assert.equal(
    unbookGig(booked, offer.id).gigs.find((g) => g.id === offer.id)?.booked,
    false,
  );
  assert.throws(() => advanceWeek(state), /resolve all booked/i);
});

test("rehearsal is an £80 once-per-week action", () => {
  const state = createGame(5);
  const after = rehearse(state);
  assert.equal(after.bank, state.bank - 80);
  assert.throws(() => rehearse(after), /already rehearsed/i);
});

test("resolving a booked due gig records one result and removes it", () => {
  let state = createGame(33);
  const gig = state.gigs[0];
  const readiness = getReadiness(state, gig);
  assert.ok(readiness.coverage > 0.5);
  const resolved = resolveGig(state, gig.id, choices);
  state = resolved.state;
  assert.equal(state.history.length, 1);
  assert.equal(
    state.gigs.some((g) => g.id === gig.id),
    false,
  );
  assert.equal(state.totalGigs, 1);
  assert.equal(
    new Set(resolved.result.attendeeIds).size,
    resolved.result.attendeeIds.length,
  );
  assert.throws(() => resolveGig(state, gig.id, choices), /not found/i);
});

test("advance progresses training, costs weekly upkeep and creates future offers", () => {
  const state = createGame(9);
  const resolved = resolveGig(state, state.gigs[0].id, choices).state;
  const next = advanceWeek(resolved);
  assert.equal(next.week, 2);
  assert.equal(next.bank, resolved.bank - 150);
  assert.ok(next.gigs.some((g) => g.week === 2));
});

test("malformed saves are rejected", () => {
  assert.equal(loadGame(null), null);
  assert.equal(loadGame('{"version":2}'), null);
  assert.ok(loadGame(JSON.stringify(createGame(81))));
  const malformed = createGame(82);
  malformed.gigs[0].requirements = { Primeira: -4 };
  assert.equal(loadGame(JSON.stringify(malformed)), null);
  const malformedMember = createGame(83);
  malformedMember.members[0].status = "training";
  delete malformedMember.members[0].trainingInstrument;
  assert.equal(loadGame(JSON.stringify(malformedMember)), null);
  const malformedEvent = createGame(84);
  malformedEvent.events[0].type = "wat" as never;
  assert.equal(loadGame(JSON.stringify(malformedEvent)), null);
  const malformedHistory = createGame(85);
  malformedHistory.history.push({} as never);
  assert.equal(loadGame(JSON.stringify(malformedHistory)), null);
});

test("training completes into the requested instrument and injuries recover", () => {
  let state = createGame(101);
  const member = state.members[0];
  state = trainMember(state, member.id, "Tamborim");
  assert.equal(state.members[0].status, "training");
  const duration = state.members[0].statusWeeks;
  state = resolveGig(state, state.gigs[0].id, choices).state;
  for (let i = 0; i < duration; i++) state = advanceWeek(state);
  assert.equal(state.members[0].instrument, "Tamborim");
  const injured = {
    ...state,
    members: state.members.map((m, i) =>
      i === 1 ? { ...m, status: "injured" as const, statusWeeks: 2 } : m,
    ),
  };
  const recovered = advanceWeek(injured);
  assert.equal(recovered.members[1].status, "injured");
  assert.equal(advanceWeek(recovered).members[1].status, "active");
});

test("weekly cost is charged once, rest restores energy, and terminal states stop actions", () => {
  let state = createGame(202);
  const beforeEnergy = state.members[0].energy;
  state = setRehearsal(state, "rest");
  state = rehearse(state);
  assert.ok(state.members[0].energy > beforeEnergy);
  state = resolveGig(state, state.gigs[0].id, choices).state;
  const next = advanceWeek(state);
  assert.ok(next.bank <= state.bank - weeklyCost(state) + 250); // a grant can offset part of the weekly charge
  const over = { ...next, gameOver: { won: true, reason: "test" } };
  assert.equal(bookGig(over, over.gigs.find((g) => !g.booked)!.id), over);
  assert.equal(setRehearsal(over, "groove"), over);
});

test("twentieth success immediately wins and cannot be resolved again", () => {
  const base = createGame(303);
  const state = {
    ...base,
    successfulGigs: 19,
    reputation: 100,
    members: base.members.map((m) => ({
      ...m,
      skill: 100,
      energy: 100,
      reliability: 100,
    })),
  };
  const resolved = resolveGig(state, state.gigs[0].id, choices);
  assert.equal(resolved.result.success, true);
  assert.equal(resolved.state.successfulGigs, 20);
  assert.equal(resolved.state.gameOver?.won, true);
  assert.throws(
    () => resolveGig(resolved.state, resolved.result.gigId, choices),
    /game is over/i,
  );
});

test("a deterministic manager can play thirty weeks without stale offer deadlock", () => {
  let state = createGame(606);
  for (let turn = 0; turn < 30 && !state.gameOver; turn++) {
    for (const gig of state.gigs.filter(
      (g) => g.booked && g.week <= state.week,
    ))
      state = resolveGig(state, gig.id, choices).state;
    if (state.gameOver) break;
    const nextOffer = state.gigs.find(
      (g) => !g.booked && g.week === state.week + 1,
    );
    if (nextOffer) state = bookGig(state, nextOffer.id);
    state = advanceWeek(state);
  }
  assert.equal(state.gameOver?.won, true);
  assert.equal(state.successfulGigs, 20);
});

test("secondary-instrument matching finds a complete lineup without duplicate players", () => {
  const base = createGame(41);
  const a = {
    ...base.members[0],
    id: "flex",
    instrument: "Caixa" as const,
    secondary: "Repinique" as const,
    skill: 100,
  };
  const b = {
    ...base.members[1],
    id: "single",
    instrument: "Caixa" as const,
    secondary: null,
    skill: 40,
  };
  const gig = { ...base.gigs[0], requirements: { Caixa: 1, Repinique: 1 } };
  for (const members of [
    [a, b],
    [b, a],
  ]) {
    const matching = assignAttendees(members, gig);
    assert.equal(matching.covered, 2);
    assert.equal(new Set(matching.assigned.map((m) => m.id)).size, 2);
    assert.equal(getReadiness({ ...base, members }, gig).coverage, 1);
  }
});

test("forecast is an attendee count and a percentage without changing the season RNG", () => {
  const state = createGame(73);
  const copy = structuredClone(state);
  const preview = getReadiness(state, state.gigs[0]);
  assert.ok(preview.expected > 0 && preview.expected <= state.members.length);
  assert.ok(preview.confidence >= 0 && preview.confidence <= 100);
  assert.deepEqual(getReadiness(state, state.gigs[0]), preview);
  assert.deepEqual(state, copy);
});

test("conducting has real tradeoffs and missing instruments cannot succeed", () => {
  const state = createGame(129);
  const steady = resolveGig(state, state.gigs[0].id, choices);
  const encore = resolveGig(state, state.gigs[0].id, {
    approach: "bold",
    cue: "solo",
    finale: "encore",
  });
  assert.deepEqual(steady.result.attendeeIds, encore.result.attendeeIds);
  const id = steady.result.attendeeIds[0];
  assert.ok(
    steady.state.members.find((m) => m.id === id)!.energy >
      encore.state.members.find((m) => m.id === id)!.energy,
  );
  const allCaixa = {
    ...state,
    members: state.members.map((m) => ({
      ...m,
      instrument: "Caixa" as const,
      secondary: null,
    })),
  };
  assert.equal(
    resolveGig(allCaixa, state.gigs[0].id, choices).result.success,
    false,
  );
  const tired = {
    ...state,
    members: state.members.map((m) => ({ ...m, energy: 0, skill: 20 })),
  };
  assert.ok(
    resolveGig(tired, state.gigs[0].id, {
      approach: "bold",
      cue: "solo",
      finale: "encore",
    }).result.score < steady.result.score,
  );
});

test("kit upgrades improve performance and promotion upgrades improve fan growth", () => {
  const state = createGame(303);
  const baseline = resolveGig(state, state.gigs[0].id, choices);
  const betterKit = resolveGig(
    upgrade(state, "kit"),
    state.gigs[0].id,
    choices,
  );
  const promoted = resolveGig(
    upgrade(state, "promotion"),
    state.gigs[0].id,
    choices,
  );
  assert.ok(betterKit.result.score > baseline.result.score);
  assert.ok(promoted.result.fansDelta > baseline.result.fansDelta);
  assert.equal(upgrade(state, "kit").bank, state.bank - 500);
  assert.throws(() => upgrade({ ...state, bank: 0 }, "kit"), /need/i);
});

test("valid completed games round-trip while invalid nested save data fails closed", () => {
  const state = createGame(88);
  const played = resolveGig(state, state.gigs[0].id, choices).state;
  assert.deepEqual(loadGame(JSON.stringify(played)), played);
  for (const mutate of [
    (s: typeof state) => {
      s.gigs[0].difficulty = NaN;
    },
    (s: typeof state) => {
      s.members[0].statusWeeks = -1;
    },
    (s: typeof state) => {
      s.members[0].color = "url(https://example.com)";
    },
    (s: typeof state) => {
      s.gigs.push(s.gigs[0]);
    },
    (s: typeof state) => {
      s.members[0].trait = null as never;
    },
    (s: typeof state) => {
      s.successfulGigs = 40;
    },
    (s: typeof state) => {
      s.history[0].attendeeIds.push(s.history[0].attendeeIds[0]);
    },
  ]) {
    const bad = structuredClone(played);
    mutate(bad);
    assert.equal(loadGame(JSON.stringify(bad)), null);
  }
});

test("loss conditions trigger and immutable actions preserve their input", () => {
  const state = createGame(18);
  const copy = structuredClone(state);
  resolveGig(state, state.gigs[0].id, choices);
  recruit(state, "open");
  rehearse(state);
  upgrade(state, "kit");
  assert.deepEqual(state, copy);
  const noGigs = { ...state, gigs: [] };
  assert.equal(advanceWeek({ ...noGigs, bank: -1000 }).gameOver?.won, false);
  assert.equal(
    advanceWeek({ ...noGigs, members: state.members.slice(0, 10) }).gameOver
      ?.won,
    false,
  );
});
