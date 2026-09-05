export const INSTRUMENTS = [
  "Primeira",
  "Segunda",
  "Terceira",
  "Caixa",
  "Repinique",
  "Tamborim",
  "Agogo",
  "Chocalho",
] as const;
export type Instrument = (typeof INSTRUMENTS)[number];
export type GigType = "Festival" | "Parade" | "Community" | "Corporate";
export type RehearsalPlan = "groove" | "showmanship" | "rest";

export interface Member {
  id: string;
  name: string;
  instrument: Instrument;
  secondary: Instrument | null;
  skill: number;
  reliability: number;
  energy: number;
  morale: number;
  status: "active" | "injured" | "training";
  statusWeeks: number;
  trait: string;
  color: string;
  trainingInstrument?: Instrument;
}

export interface Gig {
  id: string;
  name: string;
  location: string;
  type: GigType;
  week: number;
  day: string;
  fee: number;
  capacity: number;
  difficulty: number;
  requirements: Partial<Record<Instrument, number>>;
  booked: boolean;
}

export interface Event {
  id: string;
  week: number;
  title: string;
  text: string;
  type: "good" | "bad" | "info";
}
export interface GigResult {
  id: string;
  gigId: string;
  name: string;
  week: number;
  score: number;
  outcome: string;
  pay: number;
  cost: number;
  repDelta: number;
  fansDelta: number;
  attendeeIds: string[];
  attendance: number;
  capacity: number;
  highlights: string[];
  success: boolean;
}
export interface GameState {
  version: 2;
  seed: number;
  week: number;
  /** Missing in older v2 saves means the week is still open for planning. */
  phase?: "planning" | "gigs";
  bank: number;
  reputation: number;
  morale: number;
  fans: number;
  successfulGigs: number;
  totalGigs: number;
  members: Member[];
  gigs: Gig[];
  events: Event[];
  history: GigResult[];
  rehearsal: RehearsalPlan;
  upgrades: { transport: number; kit: number; promotion: number };
  rehearsedWeek: number | null;
  gameOver: null | { won: boolean; reason: string };
}

const firstNames = [
  "Ailsa",
  "Callum",
  "Eilidh",
  "Fergus",
  "Greer",
  "Hamish",
  "Isla",
  "Mhairi",
  "Niall",
  "Rhona",
  "Shona",
  "Tam",
  "Morag",
  "Iain",
  "Senga",
  "Lewis",
];
const lastNames = [
  "MacLeod",
  "Fraser",
  "Ross",
  "Kerr",
  "Campbell",
  "Reid",
  "Stewart",
  "Brown",
  "Munro",
  "Scott",
  "Sinclair",
  "Paterson",
];
const colors = [
  "#ead2d8",
  "#eee0bc",
  "#d4e2c5",
  "#d5dfed",
  "#ded1ef",
  "#edd4c1",
];
const locations = [
  "Glasgow Green",
  "Leith Walk",
  "Stirling High Street",
  "Oban Harbour",
  "Dundee City Square",
  "Paisley Arts Centre",
  "Inverness River Ness",
];
const days = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];
const types: GigType[] = ["Festival", "Parade", "Community", "Corporate"];

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value));
const clamp = (n: number, lo = 0, hi = 100) =>
  Math.max(lo, Math.min(hi, Math.round(n)));
const validInstrument = (x: unknown): x is Instrument =>
  (INSTRUMENTS as readonly string[]).includes(x as string);
function roll(seed: number): [number, number] {
  const next = (Math.imul(seed || 1, 1664525) + 1013904223) >>> 0;
  return [next / 0x100000000, next];
}
function int(state: GameState, min: number, max: number): [number, GameState] {
  const [r, seed] = roll(state.seed);
  return [Math.floor(r * (max - min + 1)) + min, { ...state, seed }];
}
function choose<T>(state: GameState, list: readonly T[]): [T, GameState] {
  const [i, s] = int(state, 0, list.length - 1);
  return [list[i], s];
}
export function weeklyCost(state: GameState): number {
  return Math.max(
    120,
    state.members.filter((m) => m.status !== "injured").length * 5 -
      state.upgrades.transport * 20,
  );
}
export function upgradeCost(
  state: GameState,
  kind: "transport" | "kit" | "promotion",
): number {
  const costs = {
    transport: [450, 800, 1300],
    kit: [500, 900, 1500],
    promotion: [350, 700, 1200],
  } as const;
  return costs[kind][Math.min(2, state.upgrades[kind])];
}
function memberName(state: GameState): [string, GameState] {
  const taken = new Set(state.members.map((m) => m.name));
  const candidates = firstNames
    .flatMap((first) => lastNames.map((last) => `${first} ${last}`))
    .filter((name) => !taken.has(name));
  return choose(
    state,
    candidates.length
      ? candidates
      : firstNames.map(
          (first) =>
            `${first} Mc${lastNames[state.members.length % lastNames.length]}`,
        ),
  );
}
function makeMember(
  state: GameState,
  instrument: Instrument,
  index: number,
): [Member, GameState] {
  let s = state;
  const [name, s1] = memberName(s);
  s = s1;
  const [skill, s2] = int(s, 42, 76);
  s = s2;
  const [rel, s3] = int(s, 48, 88);
  s = s3;
  const [energy, s4] = int(s, 72, 100);
  s = s4;
  return [
    {
      id: `m${index + 1}`,
      name,
      instrument,
      secondary: null,
      skill,
      reliability: rel,
      energy,
      morale: 60,
      status: "active",
      statusWeeks: 0,
      trait: [
        "The human metronome",
        "The organiser",
        "The group-chat comedian",
        "The quiet virtuoso",
        "First on the dance floor",
        "Always brings the biscuits",
      ][index % 6],
      color: colors[index % colors.length],
    },
    s,
  ];
}

function addEvent(
  state: GameState,
  title: string,
  text: string,
  type: Event["type"],
): GameState {
  let sequence = state.events.length;
  while (
    state.events.some(
      (e) => e.id === `e${state.week}-${state.seed}-${sequence}`,
    )
  )
    sequence++;
  const id = `e${state.week}-${state.seed}-${sequence}`;
  return {
    ...state,
    events: [
      { id, week: state.week, title, text, type },
      ...state.events,
    ].slice(0, 100),
  };
}
function playable(state: GameState): boolean {
  return state.gameOver === null;
}
export function isPlanning(state: GameState): boolean {
  return state.phase !== "gigs";
}
function requirePlanning(state: GameState): void {
  if (!isPlanning(state))
    throw new Error(
      "This week’s plans are locked. Finish the gig events to open next week for changes.",
    );
}
export function finishPlanning(state: GameState): GameState {
  if (state.gameOver || !isPlanning(state)) return state;
  return { ...state, phase: "gigs" };
}

function newGig(
  state: GameState,
  week: number,
  index: number,
): [Gig, GameState] {
  let s = state;
  let type: GigType;
  [type, s] = choose(s, types);
  let location: string;
  [location, s] = choose(s, locations);
  let day: string;
  [day, s] = choose(s, days);
  if (type === "Festival") day = week % 2 ? "Saturday" : "Sunday";
  const base: Record<GigType, [number, number, number]> = {
    Festival: [650, 1500, 72],
    Parade: [280, 650, 48],
    Community: [180, 450, 35],
    Corporate: [500, 1200, 62],
  };
  const [lo, hi, difficulty] = base[type];
  let fee: number;
  [fee, s] = int(s, lo, hi);
  const req: Partial<Record<Instrument, number>> =
    type === "Festival"
      ? {
          Primeira: 2,
          Segunda: 2,
          Terceira: 1,
          Caixa: 3,
          Repinique: 1,
          Tamborim: 1,
          Agogo: 1,
          Chocalho: 1,
        }
      : type === "Corporate"
        ? { Primeira: 1, Segunda: 1, Caixa: 2, Tamborim: 1 }
        : { Primeira: 1, Segunda: 1, Caixa: 2, Repinique: 1 };
  const crowdCapacity =
    type === "Festival"
      ? 2000
      : type === "Corporate"
        ? 900
        : type === "Parade"
          ? 700
          : 450;
  return [
    {
      id: `g${week}-${index}`,
      name: `${({ Festival: "Rhythm & Roots Festival", Parade: "The Big Street Parade", Community: "Neighbourhood Summer Social", Corporate: "After-Hours Sessions" } as Record<GigType, string>)[type]}`,
      location,
      type,
      week,
      day,
      fee,
      capacity: crowdCapacity,
      difficulty,
      requirements: req,
      booked: false,
    },
    s,
  ];
}

export function createGame(seed = Date.now() >>> 0): GameState {
  let state: GameState = {
    version: 2,
    seed: seed >>> 0 || 1,
    week: 1,
    phase: "planning",
    bank: 2400,
    reputation: 42,
    morale: 76,
    fans: 120,
    successfulGigs: 0,
    totalGigs: 0,
    members: [],
    gigs: [],
    events: [],
    history: [],
    rehearsal: "groove",
    upgrades: { transport: 0, kit: 0, promotion: 0 },
    rehearsedWeek: null,
    gameOver: null,
  };
  for (let i = 0; i < 30; i++) {
    const [m, s] = makeMember(state, INSTRUMENTS[i % INSTRUMENTS.length], i);
    state = { ...state, seed: s.seed, members: [...state.members, m] };
  }
  const first: Gig = {
    id: "g1-kelvingrove",
    name: "Kelvingrove Summer Social",
    location: "Kelvingrove Park, Glasgow",
    type: "Community",
    week: 1,
    day: "Saturday",
    fee: 650,
    capacity: 450,
    difficulty: 35,
    requirements: {
      Primeira: 1,
      Segunda: 1,
      Caixa: 2,
      Repinique: 1,
      Tamborim: 1,
    },
    booked: true,
  };
  state = { ...state, gigs: [first] };
  for (let i = 0; i < 3; i++) {
    const [g, s] = newGig(state, i + 2, i);
    state = { ...state, seed: s.seed, gigs: [...state.gigs, g] };
  }
  state = addEvent(
    state,
    "Thirty people. One big sound.",
    "Welcome to Clyde City Samba. Some of us have played for years. Some came for the biscuits. All of us belong here.",
    "info",
  );
  state = addEvent(
    state,
    "The first gig is in the diary",
    "Kelvingrove wants a little Brazilian sunshine. Saturday, 450 people, £650. No pressure, then.",
    "good",
  );
  return addEvent(
    state,
    "Shall we get a rehearsal in?",
    "Tam has the hall keys. Pick a rehearsal focus before we take the stage — or go straight in and trust the groove.",
    "info",
  );
}

function due(state: GameState, gigId: string): Gig {
  const gig = state.gigs.find((g) => g.id === gigId);
  if (!gig) throw new Error("Gig not found.");
  if (!gig.booked) throw new Error("Book this gig before resolving it.");
  if (gig.week > state.week)
    throw new Error("This gig is scheduled for a future week.");
  return gig;
}

export function bookGig(state: GameState, id: string): GameState {
  if (!playable(state)) return state;
  requirePlanning(state);
  const gig = state.gigs.find((g) => g.id === id);
  if (!gig) throw new Error("Gig not found.");
  if (gig.booked) throw new Error("Gig is already booked.");
  if (gig.week < state.week) throw new Error("This offer has expired.");
  if (
    state.gigs.some((g) => g.booked && g.week === gig.week && g.day === gig.day)
  )
    throw new Error(`You already have a gig booked on ${gig.day}.`);
  return {
    ...state,
    gigs: state.gigs.map((g) => (g.id === id ? { ...g, booked: true } : g)),
  };
}
export function unbookGig(state: GameState, id: string): GameState {
  if (!playable(state)) return state;
  requirePlanning(state);
  const gig = state.gigs.find((g) => g.id === id);
  if (!gig) throw new Error("Gig not found.");
  if (!gig.booked) throw new Error("Gig is not booked.");
  if (gig.week <= state.week) throw new Error("A due gig cannot be unbooked.");
  return {
    ...state,
    gigs: state.gigs.map((g) => (g.id === id ? { ...g, booked: false } : g)),
  };
}
export function setRehearsal(state: GameState, plan: RehearsalPlan): GameState {
  if (!playable(state)) return state;
  requirePlanning(state);
  return { ...state, rehearsal: plan };
}

function attendanceChance(state: GameState, gig: Gig, member: Member): number {
  const weekend = gig.day === "Saturday" || gig.day === "Sunday";
  const distance = gig.location.includes("Glasgow")
    ? 0
    : gig.location.includes("Inverness") || gig.location.includes("Oban")
      ? 0.07
      : 0.025;
  return Math.max(
    0.12,
    Math.min(
      0.97,
      0.25 +
        member.reliability * 0.005 +
        member.energy * 0.0018 +
        state.morale * 0.0015 +
        state.upgrades.transport * 0.04 -
        gig.difficulty * 0.001 -
        distance +
        (weekend ? 0.07 : -0.07),
    ),
  );
}
export function getReadiness(
  state: GameState,
  gig: Gig,
): {
  expected: number;
  required: number;
  coverage: number;
  confidence: number;
} {
  const required = Object.values(gig.requirements).reduce(
    (sum, n) => sum + (n || 0),
    0,
  );
  const available = state.members.filter((m) => m.status === "active");
  const covered = assignAttendees(available, gig).covered;
  const probabilities = available.map((m) => attendanceChance(state, gig, m));
  const expected = Math.round(probabilities.reduce((a, b) => a + b, 0));
  // A separate preview RNG never advances the real season. Confidence estimates
  // the chance of filling every role, including flexible secondary instruments.
  let previewSeed =
    (state.seed ^
      gig.id
        .split("")
        .reduce((n, c) => Math.imul(n, 31) + c.charCodeAt(0), 7)) >>>
    0;
  let complete = 0;
  if (covered === required && required > 0)
    for (let trial = 0; trial < 80; trial++) {
      const attending = available.filter((_, index) => {
        const [r, next] = roll(previewSeed);
        previewSeed = next;
        return r < probabilities[index];
      });
      if (assignAttendees(attending, gig).covered === required) complete++;
    }
  return {
    expected,
    required,
    coverage: required ? covered / required : 0,
    confidence: Math.round((complete / 80) * 100),
  };
}

export function rehearse(state: GameState): GameState {
  if (!playable(state)) return state;
  requirePlanning(state);
  if (state.rehearsedWeek === state.week)
    throw new Error("The band has already rehearsed this week.");
  if (state.bank < 80)
    throw new Error("You need £80 to hire the rehearsal hall.");
  const members = state.members.map((m) => ({
    ...m,
    energy: clamp(m.energy + (state.rehearsal === "rest" ? 10 : -8)),
    skill: clamp(
      m.skill + (state.rehearsal === "groove" && m.status === "active" ? 2 : 0),
    ),
    morale: clamp(
      m.morale +
        (state.rehearsal === "showmanship"
          ? 3
          : state.rehearsal === "rest"
            ? 2
            : 1),
    ),
  }));
  return addEvent(
    {
      ...state,
      bank: state.bank - 80,
      members,
      morale: clamp(state.morale + (state.rehearsal === "showmanship" ? 4 : 2)),
      rehearsedWeek: state.week,
    },
    "Weekly rehearsal",
    `${state.rehearsal[0].toUpperCase() + state.rehearsal.slice(1)} rehearsal completed for £80.`,
    "info",
  );
}

export function recruit(
  state: GameState,
  kind: "open" | "campaign",
): GameState {
  if (!playable(state)) return state;
  requirePlanning(state);
  const cost = kind === "open" ? 100 : 250;
  if (state.bank < cost) throw new Error(`You need £${cost} to recruit.`);
  let s = { ...state, bank: state.bank - cost };
  const countRange: [number, number] = kind === "open" ? [1, 3] : [2, 5];
  let count: number;
  [count, s] = int(s, ...countRange);
  const members = [...s.members];
  for (let i = 0; i < count; i++) {
    const [inst, s1] = choose(s, INSTRUMENTS);
    s = s1;
    const [m, s2] = makeMember({ ...s, members }, inst, members.length);
    s = { ...s, seed: s2.seed };
    members.push({ ...m, id: `m${members.length + 1}` });
  }
  return addEvent(
    { ...s, members },
    kind === "open" ? "Open rehearsal" : "Recruitment campaign",
    `${count} new player${count === 1 ? "" : "s"} joined the band.`,
    "good",
  );
}

export function upgrade(
  state: GameState,
  kind: "transport" | "kit" | "promotion",
): GameState {
  if (!playable(state)) return state;
  requirePlanning(state);
  const level = state.upgrades[kind];
  if (level >= 3) throw new Error("That upgrade is already maxed.");
  const cost = upgradeCost(state, kind);
  if (state.bank < cost) throw new Error(`You need £${cost} for this upgrade.`);
  return addEvent(
    {
      ...state,
      bank: state.bank - cost,
      upgrades: { ...state.upgrades, [kind]: level + 1 },
    },
    "Band upgrade",
    `${kind[0].toUpperCase() + kind.slice(1)} improved to level ${level + 1}.`,
    "good",
  );
}

export function trainMember(
  state: GameState,
  id: string,
  instrument: Instrument,
): GameState {
  if (!playable(state)) return state;
  requirePlanning(state);
  if (!validInstrument(instrument)) throw new Error("Unknown instrument.");
  const m = state.members.find((x) => x.id === id);
  if (!m) throw new Error("Member not found.");
  if (m.status !== "active")
    throw new Error("Only active members can start training.");
  if (m.instrument === instrument || m.secondary === instrument)
    throw new Error("Member already covers that instrument.");
  const weeks = m.skill >= 65 ? 2 : 3;
  return addEvent(
    {
      ...state,
      members: state.members.map((x) =>
        x.id === id
          ? {
              ...x,
              status: "training",
              statusWeeks: weeks,
              trainingInstrument: instrument,
            }
          : x,
      ),
    },
    "A new rhythm to learn",
    `${m.name} is learning ${instrument}. They will miss gigs for ${weeks} weeks, then keep ${m.instrument} as a secondary.`,
    "info",
  );
}

function checkGameOver(state: GameState): GameState {
  if (state.successfulGigs >= 20)
    return {
      ...state,
      gameOver: { won: true, reason: "Twenty successful gigs completed." },
    };
  const active = state.members.filter((m) => m.status === "active").length;
  if (state.bank < 0)
    return {
      ...state,
      gameOver: { won: false, reason: "The band ran out of money." },
    };
  if (active < 12)
    return {
      ...state,
      gameOver: {
        won: false,
        reason: "Fewer than twelve players remain available.",
      },
    };
  if (state.reputation <= 0)
    return {
      ...state,
      gameOver: { won: false, reason: "The band lost all of its reputation." },
    };
  return state;
}

export function assignAttendees(
  attendees: Member[],
  gig: Gig,
): { assigned: Member[]; covered: number; quality: number } {
  const slots = Object.entries(gig.requirements).flatMap(
    ([instrument, count]) =>
      Array.from({ length: count || 0 }, () => instrument),
  );
  const candidates = [...attendees].sort(
    (a, b) =>
      Number(!!a.secondary) - Number(!!b.secondary) ||
      b.skill + b.energy - (a.skill + a.energy),
  );
  const owner = new Map<string, number>();
  const assigned = new Map<number, Member>();
  // Augmenting paths can move a flexible player to a different slot. A greedy
  // assignment incorrectly rejects feasible lineups when primaries overlap.
  function fill(slot: number, visited: Set<string>): boolean {
    for (const member of candidates) {
      if (
        visited.has(member.id) ||
        (member.instrument !== slots[slot] && member.secondary !== slots[slot])
      )
        continue;
      visited.add(member.id);
      const previous = owner.get(member.id);
      if (previous === undefined || fill(previous, visited)) {
        owner.set(member.id, slot);
        assigned.set(slot, member);
        return true;
      }
    }
    return false;
  }
  slots.forEach((_, slot) => fill(slot, new Set()));
  const members = [...assigned.values()];
  return {
    assigned: members,
    covered: members.length,
    quality: members.length
      ? members.reduce(
          (sum, m) => sum + m.skill * 0.65 + m.energy * 0.2 + m.morale * 0.15,
          0,
        ) / members.length
      : 0,
  };
}

export function resolveGig(
  state: GameState,
  gigId: string,
  choices: {
    approach: "steady" | "bold" | "party";
    cue: "tighten" | "solo" | "crowd";
    finale: "classic" | "encore";
  },
): { state: GameState; result: GigResult } {
  if (!playable(state)) throw new Error("The game is over.");
  if (
    !["steady", "bold", "party"].includes(choices.approach) ||
    !["tighten", "solo", "crowd"].includes(choices.cue) ||
    !["classic", "encore"].includes(choices.finale)
  )
    throw new Error("Choose a valid conducting plan.");
  if (isPlanning(state))
    throw new Error("Finish the weekly planning turn before playing gigs.");
  const gig = due(state, gigId);
  const required = Object.values(gig.requirements).reduce(
    (sum, n) => sum + (n || 0),
    0,
  );
  let s = { ...state };
  const attendees = s.members
    .filter((m) => m.status === "active")
    .filter((m) => {
      let r: number;
      [r, s] = int(s, 0, 999);
      return r < attendanceChance(state, gig, m) * 1000;
    });
  const attendance = attendees.length;
  const assignment = assignAttendees(attendees, gig);
  const average = (key: "energy" | "skill" | "morale") =>
    attendees.length
      ? attendees.reduce((n, m) => n + m[key], 0) / attendees.length
      : 0;
  const energy = average("energy");
  const skill = average("skill");
  const spirit = (average("morale") + s.morale) / 2;
  const approach =
    choices.approach === "bold"
      ? skill >= 64 && energy >= 55
        ? 10
        : -9
      : choices.approach === "party"
        ? (spirit - 45) / 5
        : 3;
  const cue =
    choices.cue === "tighten"
      ? 4
      : choices.cue === "solo"
        ? Math.max(0, ...attendees.map((m) => m.skill)) >= 75 && energy > 40
          ? 8
          : -6
        : (spirit - 40) / 6;
  const finale = choices.finale === "encore" ? (energy >= 60 ? 7 : -10) : 2;
  const coverage = required ? assignment.covered / required : 0;
  const score = attendance
    ? clamp(
        assignment.quality * 0.5 +
          coverage * 34 +
          energy * 0.08 +
          spirit * 0.07 +
          approach +
          cue +
          finale +
          s.upgrades.kit * 3 -
          gig.difficulty * 0.2,
      )
    : 0;
  const success =
    score >= 62 && assignment.covered === required && required > 0;
  const outcome =
    attendance < Math.ceil(required * 0.5)
      ? "Cancelled"
      : score >= 86 && success
        ? "Triumphant"
        : success
          ? "Success"
          : "Scrappy set";
  const pay = success
    ? Math.round(gig.fee * (score >= 86 ? 1.12 : 0.9))
    : outcome === "Scrappy set"
      ? Math.round(gig.fee * 0.35)
      : 0;
  const cost = Math.max(
    35,
    (gig.location.includes("Glasgow") ? 65 : 110) - s.upgrades.transport * 15,
  );
  const repDelta = success
    ? score >= 86
      ? 7
      : 4
    : outcome === "Scrappy set"
      ? -2
      : -6;
  const fanBonus =
    (choices.approach === "party" ? 6 : 0) +
    (choices.cue === "crowd" ? 7 : 0) +
    (choices.finale === "encore" && finale > 0 ? 5 : 0);
  const fansDelta = success
    ? Math.round(
        (score >= 86 ? 28 : 15) * (1 + s.upgrades.promotion * 0.15) + fanBonus,
      )
    : -Math.min(8, state.fans);
  const exertion =
    (choices.approach === "steady"
      ? 10
      : choices.approach === "party"
        ? 14
        : 19) +
    (choices.cue === "solo" ? 4 : 0) +
    (choices.finale === "encore" ? 11 : 0);
  const highlights = [
    `${attendance} of ${state.members.filter((m) => m.status === "active").length} available players showed up. ${assignment.covered}/${required} instrument roles covered.`,
    choices.approach === "bold"
      ? approach > 0
        ? "The ambitious arrangement paid off. Your preparation showed."
        : "The arrangement asked more than the band had in the tank."
      : choices.approach === "party"
        ? "You made the crowd part of the band. That connection brings new fans."
        : "A steady opening gave everyone room to settle into the groove.",
    choices.cue === "solo"
      ? cue > 0
        ? "Your strongest player stepped into the spotlight and delivered."
        : "The solo needed a little more confidence. Back to the rehearsal room."
      : choices.cue === "crowd"
        ? "The call-and-response travelled right to the back of the crowd."
        : "One look from the leader, and the rhythm section pulled together.",
    choices.finale === "encore"
      ? finale > 0
        ? `One more tune! A big ending, but the players spent ${exertion} energy.`
        : `The encore pushed tired players too far. ${exertion} energy spent.`
      : `A clean finish and something left for next time. ${exertion} energy spent.`,
  ];
  if (outcome === "Cancelled")
    highlights.splice(
      1,
      highlights.length - 1,
      "Too few players made it. The organiser cancelled the performance; no gig fee was paid.",
    );
  const result: GigResult = {
    id: `r${s.week}-${s.history.length + 1}`,
    gigId,
    name: gig.name,
    week: s.week,
    score,
    outcome,
    pay,
    cost,
    repDelta,
    fansDelta,
    attendeeIds: attendees.map((m) => m.id),
    attendance,
    capacity: gig.capacity,
    highlights,
    success,
  };
  const played = new Set(result.attendeeIds);
  s = {
    ...s,
    bank: s.bank + pay - cost,
    reputation: clamp(s.reputation + repDelta),
    morale: clamp(s.morale + (success ? 4 : -4)),
    fans: Math.max(0, s.fans + fansDelta),
    successfulGigs: s.successfulGigs + (success ? 1 : 0),
    totalGigs: s.totalGigs + 1,
    history: [...s.history, result],
    gigs: s.gigs.filter((g) => g.id !== gigId),
    members: s.members.map((m) =>
      played.has(m.id)
        ? {
            ...m,
            energy: clamp(m.energy - exertion),
            morale: clamp(m.morale + (success ? 3 : -4)),
          }
        : m,
    ),
  };
  s = addEvent(
    s,
    success ? "A little louder, a little prouder" : "A lesson from the stage",
    `${gig.name} in ${gig.location}: ${outcome}. ${attendance} players, £${pay} paid, £${cost} travel costs.`,
    success ? "good" : "bad",
  );
  return { state: checkGameOver(s), result };
}

export function advanceWeek(state: GameState): GameState {
  if (state.gameOver) return state;
  if (isPlanning(state))
    throw new Error("Finish the weekly planning turn before advancing.");
  if (state.gigs.some((g) => g.booked && g.week <= state.week))
    throw new Error("Resolve all booked gigs due this week before advancing.");
  let s: GameState = { ...state, week: state.week + 1, phase: "planning" };
  s = {
    ...s,
    bank: state.bank - weeklyCost(state),
    rehearsedWeek: null,
    members: state.members.map((m) => {
      if (m.status === "injured") {
        const left = m.statusWeeks - 1;
        return left <= 0
          ? { ...m, status: "active", statusWeeks: 0 }
          : { ...m, statusWeeks: left };
      }
      if (m.status === "training") {
        const left = m.statusWeeks - 1;
        if (left <= 0)
          return {
            ...m,
            status: "active",
            statusWeeks: 0,
            instrument: m.trainingInstrument || m.instrument,
            secondary: m.instrument,
            trainingInstrument: undefined,
            skill: clamp(m.skill + 4),
          };
        return { ...m, statusWeeks: left };
      }
      return { ...m, energy: clamp(m.energy + 12), morale: m.morale };
    }),
  };
  s = addEvent(
    s,
    "Weekly running costs",
    `The band paid £${weeklyCost(state)} for halls, storage and transport.`,
    "info",
  );
  s = { ...s, gigs: s.gigs.filter((g) => g.week >= s.week) };
  for (let i = 0; i < 3; i++) {
    const [g, ns] = newGig(s, s.week + 3, i);
    s = { ...s, seed: ns.seed, gigs: [...s.gigs, g] };
  }
  const [eventRoll, ns] = int(s, 1, 6);
  s = { ...s, seed: ns.seed };
  if (eventRoll === 1) {
    s = { ...s, bank: s.bank + 250, morale: clamp(s.morale + 4) };
    s = addEvent(
      s,
      "Community grant",
      "A local arts fund backed the band with £250.",
      "good",
    );
  } else if (eventRoll === 2) {
    s = { ...s, morale: clamp(s.morale - 5) };
    s = addEvent(
      s,
      "Band drama",
      "The rehearsal group chat got spicy. Morale dipped.",
      "bad",
    );
  } else if (eventRoll === 3) {
    const active = s.members.filter((m) => m.status === "active");
    if (active.length) {
      const [i, ss] = int(s, 0, active.length - 1);
      const id = active[i].id;
      s = {
        ...s,
        seed: ss.seed,
        members: s.members.map((m) =>
          m.id === id ? { ...m, status: "injured", statusWeeks: 2 } : m,
        ),
      };
      s = addEvent(
        s,
        "A sore wrist",
        `${active[i].name} will miss two weeks.`,
        "bad",
      );
    }
  } else if (eventRoll === 4) {
    s = { ...s, fans: s.fans + 20, reputation: clamp(s.reputation + 2) };
    s = addEvent(
      s,
      "Viral rehearsal clip",
      "A rehearsal clip brought new fans to the band.",
      "good",
    );
  } else
    s = addEvent(
      s,
      "A quiet week",
      "The band kept the rhythm and prepared for the next offer.",
      "info",
    );
  return checkGameOver(s);
}

export function loadGame(raw: string | null): GameState | null {
  if (!raw || raw.length > 5_000_000) return null;
  try {
    const x = JSON.parse(raw);
    const numeric = [
      "seed",
      "week",
      "bank",
      "reputation",
      "morale",
      "fans",
      "successfulGigs",
      "totalGigs",
    ];
    if (
      !x ||
      x.version !== 2 ||
      !numeric.every((k) => Number.isFinite(x[k])) ||
      !Number.isInteger(x.week) ||
      x.week < 1 ||
      !Array.isArray(x.members) ||
      !Array.isArray(x.gigs) ||
      !Array.isArray(x.events) ||
      !Array.isArray(x.history) ||
      !x.upgrades ||
      !["groove", "showmanship", "rest"].includes(x.rehearsal)
    )
      return null;
    if (
      !x.members.every(
        (m: Member) =>
          m &&
          typeof m.id === "string" &&
          typeof m.name === "string" &&
          validInstrument(m.instrument) &&
          (m.secondary === null || validInstrument(m.secondary)) &&
          ["active", "injured", "training"].includes(m.status) &&
          Number.isFinite(m.skill) &&
          Number.isFinite(m.reliability) &&
          Number.isFinite(m.energy) &&
          Number.isFinite(m.morale),
      )
    )
      return null;
    if (
      !x.gigs.every(
        (g: Gig) =>
          g &&
          typeof g.id === "string" &&
          typeof g.name === "string" &&
          types.includes(g.type) &&
          Number.isInteger(g.week) &&
          g.week >= 1 &&
          typeof g.day === "string" &&
          Number.isFinite(g.fee) &&
          Number.isFinite(g.capacity) &&
          g.requirements &&
          Object.entries(g.requirements).every(
            ([instrument, count]) =>
              validInstrument(instrument) &&
              Number.isInteger(count) &&
              (count as number) >= 0,
          ) &&
          typeof g.booked === "boolean",
      )
    )
      return null;
    if (
      !x.members.every(
        (m: Member) =>
          m.status !== "training" ||
          (validInstrument(m.trainingInstrument) &&
            Number.isInteger(m.statusWeeks) &&
            m.statusWeeks > 0),
      )
    )
      return null;
    if (
      !x.events.every(
        (e: Event) =>
          e &&
          typeof e.id === "string" &&
          Number.isInteger(e.week) &&
          typeof e.title === "string" &&
          typeof e.text === "string" &&
          ["good", "bad", "info"].includes(e.type),
      )
    )
      return null;
    if (
      !x.history.every(
        (r: GigResult) =>
          r &&
          typeof r.id === "string" &&
          typeof r.gigId === "string" &&
          typeof r.name === "string" &&
          Number.isInteger(r.week) &&
          Number.isFinite(r.score) &&
          typeof r.outcome === "string" &&
          Number.isFinite(r.pay) &&
          Number.isFinite(r.cost) &&
          Number.isFinite(r.repDelta) &&
          Number.isFinite(r.fansDelta) &&
          Array.isArray(r.attendeeIds) &&
          r.attendeeIds.every((id) => typeof id === "string") &&
          Number.isFinite(r.attendance) &&
          Number.isFinite(r.capacity) &&
          Array.isArray(r.highlights) &&
          r.highlights.every((h) => typeof h === "string") &&
          typeof r.success === "boolean",
      )
    )
      return null;
    if (
      x.rehearsedWeek !== null &&
      (!Number.isInteger(x.rehearsedWeek) || x.rehearsedWeek < 1)
    )
      return null;
    if (
      x.gameOver !== null &&
      (!x.gameOver ||
        typeof x.gameOver.won !== "boolean" ||
        typeof x.gameOver.reason !== "string")
    )
      return null;
    if (
      !["transport", "kit", "promotion"].every(
        (k) =>
          Number.isInteger(x.upgrades[k]) &&
          x.upgrades[k] >= 0 &&
          x.upgrades[k] <= 3,
      )
    )
      return null;
    const bounded = (value: unknown, lo = 0, hi = 100): boolean =>
      typeof value === "number" &&
      Number.isFinite(value) &&
      value >= lo &&
      value <= hi;
    const text = (value: unknown, max = 500): boolean =>
      typeof value === "string" && value.length > 0 && value.length <= max;
    const unique = (items: { id: string }[]): boolean =>
      new Set(items.map((item) => item.id)).size === items.length;
    if (
      !Number.isInteger(x.seed) ||
      !bounded(x.seed, 0, 0xffffffff) ||
      !bounded(x.reputation) ||
      !bounded(x.morale) ||
      !Number.isInteger(x.fans) ||
      !bounded(x.fans, 0, 1e9) ||
      !Number.isInteger(x.bank) ||
      Math.abs(x.bank) > 1e9
    )
      return null;
    if (
      x.members.length > 1000 ||
      x.gigs.length > 1000 ||
      x.events.length > 100 ||
      x.history.length > 10000 ||
      !unique(x.members) ||
      !unique(x.gigs) ||
      !unique(x.events) ||
      !unique(x.history)
    )
      return null;
    if (
      !x.members.every(
        (m: Member) =>
          text(m.id, 100) &&
          text(m.name, 100) &&
          text(m.trait, 100) &&
          /^#[a-f0-9]{6}$/i.test(m.color) &&
          bounded(m.skill) &&
          bounded(m.reliability) &&
          bounded(m.energy) &&
          bounded(m.morale) &&
          Number.isInteger(m.statusWeeks) &&
          bounded(m.statusWeeks, 0, 100) &&
          (m.status === "active" ? m.statusWeeks === 0 : m.statusWeeks > 0),
      )
    )
      return null;
    if (
      !x.gigs.every(
        (g: Gig) =>
          text(g.id, 100) &&
          text(g.name, 200) &&
          text(g.location, 200) &&
          days.includes(g.day) &&
          bounded(g.difficulty, 1, 100) &&
          Number.isInteger(g.fee) &&
          bounded(g.fee, 0, 1e7) &&
          Number.isInteger(g.capacity) &&
          bounded(g.capacity, 1, 1e7) &&
          !Array.isArray(g.requirements) &&
          Object.keys(g.requirements).length > 0 &&
          Object.values(g.requirements).every(
            (n) => Number.isInteger(n) && bounded(n, 1, 100),
          ),
      )
    )
      return null;
    if (
      !x.events.every(
        (e: Event) =>
          text(e.title) && text(e.text, 2000) && e.week > 0 && e.week <= x.week,
      )
    )
      return null;
    if (
      !x.history.every(
        (r: GigResult) =>
          bounded(r.score) &&
          bounded(r.pay, 0, 1e7) &&
          bounded(r.cost, 0, 1e7) &&
          Number.isInteger(r.attendance) &&
          r.attendance === r.attendeeIds.length &&
          new Set(r.attendeeIds).size === r.attendeeIds.length &&
          r.week > 0 &&
          r.week <= x.week &&
          bounded(r.capacity, 1, 1e7),
      )
    )
      return null;
    if (
      x.totalGigs !== x.history.length ||
      x.successfulGigs !==
        x.history.filter((r: GigResult) => r.success).length ||
      new Set(x.history.map((r: GigResult) => r.gigId)).size !==
        x.history.length ||
      x.gigs.some((g: Gig) =>
        x.history.some((r: GigResult) => r.gigId === g.id),
      )
    )
      return null;
    if (x.rehearsedWeek !== null && x.rehearsedWeek !== x.week) return null;
    if (x.phase !== undefined && x.phase !== "planning" && x.phase !== "gigs")
      return null;
    return clone(x) as GameState;
  } catch {
    return null;
  }
}
