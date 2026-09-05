import {
  Activity,
  ArrowRight,
  AudioLines,
  Bell,
  CalendarDays,
  Check,
  CheckCheck,
  ChevronRight,
  CircleHelp,
  Download,
  Drum,
  Flag,
  Heart,
  LayoutDashboard,
  MapPin,
  Megaphone,
  Music2,
  Newspaper,
  Play,
  Plus,
  Settings2,
  ShieldCheck,
  Sparkles,
  Star,
  TrendingUp,
  Trophy,
  Upload,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import Band from "./components/Band";
import Dialog from "./components/Dialog";
import Finances from "./components/Finances";
import Gigs from "./components/Gigs";
import GigStage from "./components/GigStage";
import LiveGig from "./components/LiveGig";
import { Avatar, Empty, Meter, Tag } from "./components/ui";
import type { GameState, Gig, Member } from "./game/engine";
import {
  advanceWeek,
  bookGig,
  createGame,
  getReadiness,
  INSTRUMENTS,
  loadGame,
  recruit,
  rehearse,
  resolveGig,
  setRehearsal,
  trainMember,
  unbookGig,
  upgrade,
} from "./game/engine";
import { cx, money, SAVE_KEY } from "./game/format";

const tabs = [
  { id: "overview", name: "Clubhouse", icon: LayoutDashboard },
  { id: "band", name: "The band", icon: Users },
  { id: "gigs", name: "Gigs & calendar", icon: CalendarDays },
  { id: "rehearsal", name: "Rehearsal room", icon: Drum },
  { id: "finances", name: "Finances", icon: Wallet },
  { id: "news", name: "Band journal", icon: Newspaper },
];
const planCopy = {
  groove: ["Lock in the groove", "Build skill and tighten the rhythm section."],
  showmanship: [
    "Put on a show",
    "Lift morale and bring more personality to the stage.",
  ],
  rest: ["Take a breather", "Recover energy before the next big performance."],
};

export default function App() {
  const [game, setGame] = useState<GameState>(() => {
    try {
      return loadGame(localStorage.getItem(SAVE_KEY)) || createGame();
    } catch {
      return createGame();
    }
  });
  const [page, setPage] = useState("overview");
  const [toast, setToast] = useState("");
  const [saveError, setSaveError] = useState(false);
  const [modal, setModal] = useState<"help" | "settings" | "reset" | null>(
    null,
  );
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [liveGig, setLiveGig] = useState<Gig | null>(null);
  const [sound, setSound] = useState(false);
  const importRef = useRef<HTMLInputElement>(null);
  const liveMember = selectedMember
    ? game.members.find((m) => m.id === selectedMember.id)
    : null;
  const due = game.gigs.filter((g) => g.booked && g.week <= game.week);
  const next =
    due[0] ||
    [...game.gigs].filter((g) => g.booked).sort((a, b) => a.week - b.week)[0] ||
    game.gigs[0];
  const averageSkill = Math.round(
    game.members.reduce((n, m) => n + m.skill, 0) /
      Math.max(game.members.length, 1),
  );
  const averageEnergy = Math.round(
    game.members.reduce((n, m) => n + m.energy, 0) /
      Math.max(game.members.length, 1),
  );
  const notify = (message: string) => setToast(message);
  useEffect(() => {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(game));
      setSaveError(false);
    } catch {
      setSaveError(true);
    }
  }, [game]);
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(""), 4200);
    return () => clearTimeout(id);
  }, [toast]);
  const act = (fn: (state: GameState) => GameState, message?: string) => {
    try {
      const nextState = fn(game);
      setGame(nextState);
      if (message) notify(message);
    } catch (err) {
      notify(
        err instanceof Error
          ? err.message
          : "That action could not be completed.",
      );
    }
  };
  const go = (id: string) => {
    setPage(id);
    window.scrollTo({ top: 0, behavior: "instant" });
  };
  const advance = () => {
    if (due.length) {
      setLiveGig(due[0]);
      return;
    }
    act(
      advanceWeek,
      `Hello, week ${game.week + 1}. A fresh start and a fresh set of opportunities.`,
    );
  };
  const exportSave = () => {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(game, null, 2)], { type: "application/json" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = `samba-social-week-${game.week}.json`;
    a.click();
    URL.revokeObjectURL(url);
    notify("Your band’s story is backed up.");
  };
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Skip to clubhouse content
      </a>
      <aside className="sidebar">
        <a
          className="brand"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            go("overview");
          }}
        >
          <span className="brand-mark">
            <Drum size={27} />
          </span>
          <span>
            SAMBA
            <span className="brand-second">
              SOCIAL<span className="brand-dot">®</span>
            </span>
          </span>
        </a>
        <span className="sidebar-label">YOUR BAND. YOUR BEAT.</span>
        <div className="club-selector">
          <span className="club-crest">
            <AudioLines size={23} />
          </span>
          <div>
            <strong>Clyde City Samba</strong>
            <small>
              Glasgow, Scotland <span>↗</span>
            </small>
          </div>
        </div>
        <div className="sidebar-label management">MANAGEMENT</div>
        <nav aria-label="Main navigation">
          {tabs.map(({ id, name, icon: Icon }) => (
            <button
              key={id}
              onClick={() => go(id)}
              className={cx("nav-item", page === id && "active")}
              aria-label={name}
              aria-current={page === id ? "page" : undefined}
            >
              <Icon size={19} />
              <span>{name}</span>
              {id === "gigs" && (
                <span className="nav-count">
                  {game.gigs.filter((g) => !g.booked).length}
                </span>
              )}
              {id === "news" && <span className="notification-dot" />}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="season-card">
            <span className="season-icon">
              <Trophy size={20} />
            </span>
            <small>THE ROAD TO MAIN STAGE</small>
            <strong>Little band. Big ambitions.</strong>
            <Meter value={game.successfulGigs * 5} />
            <div>
              <span>{game.successfulGigs} / 20 successful gigs</span>
              <Flag size={13} />
            </div>
          </div>
          <button className="manager" onClick={() => setModal("settings")}>
            <span className="manager-avatar">K</span>
            <span>
              <strong>The band manager</strong>
              <small>Keeping the chaos in time</small>
            </span>
            <Settings2 size={17} />
          </button>
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <div className="breadcrumb">
            Clyde City Samba <span>/</span>
            <strong>{tabs.find((t) => t.id === page)?.name}</strong>
          </div>
          <div className="topbar-actions">
            <span className="save-status">
              <span className={cx("status-light", saveError && "error")} />
              {saveError ? "Save unavailable" : "Auto-saved"}
            </span>
            <button
              className="icon-button help-button"
              aria-label="How to play"
              onClick={() => setModal("help")}
            >
              <CircleHelp size={19} />
            </button>
            <button
              className="icon-button"
              aria-label="Open band journal"
              onClick={() => go("news")}
            >
              <Bell size={19} />
              <i />
            </button>
            <button
              className="top-avatar"
              aria-label="Open manager settings"
              onClick={() => setModal("settings")}
            >
              K
            </button>
          </div>
        </header>
        <main id="main-content">
          <div className="page-heading">
            <div>
              <div className="eyebrow">
                <span /> SEASON 01 <b>•</b> WEEK{" "}
                {String(game.week).padStart(2, "0")}
              </div>
              <h1>
                {
                  (
                    {
                      overview: "Big rhythms. Beautiful chaos.",
                      band: "Good people. Great noise.",
                      gigs: "Your next big moment.",
                      rehearsal: "Find your collective groove.",
                      finances: "Keep the good times funded.",
                      news: "Every band has a story.",
                    } as Record<string, string>
                  )[page]
                }
              </h1>
              <p>
                {
                  (
                    {
                      overview:
                        "A little Glasgow grit. A lot of Brazilian soul. Let’s make some noise.",
                      band: "Meet the personalities behind the percussion. Every player makes a difference.",
                      gigs: "From a rainy parade to a roaring festival crowd. Build your season.",
                      rehearsal:
                        "The magic on stage starts with the work in this room.",
                      finances:
                        "Full drums, a full diary, and enough left over for the minibus.",
                      news: "The triumphs, the drama, and the things that definitely weren’t in the plan.",
                    } as Record<string, string>
                  )[page]
                }
              </p>
            </div>
            <button
              className="button primary advance"
              onClick={advance}
              disabled={!!game.gameOver}
            >
              {due.length ? (
                <>
                  <Play size={16} fill="currentColor" /> Play this week
                </>
              ) : (
                <>
                  Next week <ArrowRight size={17} />
                </>
              )}
            </button>
          </div>
          {game.gameOver && (
            <div className={cx("end-banner", game.gameOver.won && "won")}>
              <Trophy />
              <div>
                <strong>
                  {game.gameOver.won
                    ? "You made the main stage!"
                    : "The curtain falls."}
                </strong>
                <p>{game.gameOver.reason}</p>
              </div>
              <button className="button" onClick={() => setModal("reset")}>
                Start a new story
              </button>
            </div>
          )}
          {saveError && (
            <div className="warning-banner">
              Your browser could not save this game.{" "}
              <button onClick={exportSave}>Download a backup</button> before
              closing.
            </div>
          )}
          <div className="stats-grid">
            {[
              {
                label: "Band balance",
                value: money(game.bank),
                caption: "The keep-us-going fund",
                icon: Wallet,
                color: "purple",
                detail: "In the bank",
              },
              {
                label: "Our people",
                value: String(game.members.length),
                caption: `${game.members.filter((m) => m.status === "active").length} ready to make some noise`,
                icon: Users,
                color: "blue",
                detail: "Band members",
              },
              {
                label: "Reputation",
                value: `${game.reputation}`,
                caption:
                  game.reputation >= 60
                    ? "Word is getting around"
                    : "Making a name for ourselves",
                icon: Star,
                color: "orange",
                detail: "/ 100",
              },
              {
                label: "Band spirit",
                value: `${game.morale}%`,
                caption:
                  game.morale >= 65
                    ? "Good vibes in the group chat"
                    : "Time for a little encouragement",
                icon: Heart,
                color: "pink",
                detail: game.morale >= 65 ? "Feeling good" : "Needs some love",
              },
            ].map((s) => (
              <div className="stat-card" key={s.label}>
                <div className="stat-top">
                  <span>{s.label}</span>
                  <span className={cx("stat-icon", s.color)}>
                    <s.icon size={17} />
                  </span>
                </div>
                <div className="stat-value">
                  {s.value}
                  <small>{s.detail}</small>
                </div>
                <div className="stat-caption">
                  {s.label === "Reputation" ? (
                    <TrendingUp size={13} />
                  ) : (
                    <span className="tiny-dot" />
                  )}
                  {s.caption}
                </div>
              </div>
            ))}
          </div>
          {page === "overview" && (
            <>
              <div className="overview-grid">
                <section className="panel gig-hero">
                  <div className="panel-head">
                    <div className="section-title">
                      <span className="live-dot" /> THE NEXT BIG THING
                    </div>
                    <Tag tone="purple">{next?.type || "Rehearsal"}</Tag>
                  </div>
                  <div className="stage-wrap">
                    <GigStage
                      energy={game.morale}
                      playing={!liveGig}
                      mode={next ? "festival" : "rehearsal"}
                    />
                    <div className="stage-weather">
                      ☀ <span>18° · Good vibes forecast</span>
                    </div>
                    <span className="stage-sticker">
                      BRING THE
                      <br />
                      <b>NOISE!</b>
                      <Sparkles size={20} />
                    </span>
                  </div>
                  <div className="hero-details">
                    <div>
                      <div className="eyebrow purple-text">
                        {next
                          ? `WEEK ${next.week} · ${next.day.toUpperCase()}`
                          : "THE REHEARSAL ROOM"}
                      </div>
                      <h2>{next?.name || "A little room. A big sound."}</h2>
                      <p>
                        <MapPin size={14} />
                        {next?.location || "Glasgow, Scotland"}
                        <span>•</span>
                        {next
                          ? `${next.capacity.toLocaleString()} crowd capacity`
                          : "Your people, your rhythm"}
                      </p>
                    </div>
                    {next && (
                      <div className="gig-fee">
                        <small>GIG FEE</small>
                        <strong>{money(next.fee)}</strong>
                      </div>
                    )}
                  </div>
                  <div className="hero-footer">
                    <div className="avatar-stack">
                      {game.members.slice(0, 5).map((m) => (
                        <Avatar key={m.id} member={m} />
                      ))}
                      <span>+{Math.max(0, game.members.length - 5)}</span>
                    </div>
                    <div className="ready-copy">
                      <strong>
                        {next
                          ? `${getReadiness(game, next).expected} expected to play`
                          : "Your band is waiting"}
                      </strong>
                      <small>
                        {next
                          ? `${Math.round(getReadiness(game, next).confidence)}% lineup confidence`
                          : "Let’s build something special"}
                      </small>
                    </div>
                    <button
                      className="button primary"
                      disabled={!!game.gameOver}
                      onClick={() => {
                        if (next?.booked && next.week <= game.week)
                          setLiveGig(next);
                        else go("gigs");
                      }}
                    >
                      {next?.booked && next.week <= game.week
                        ? "Enter gig day"
                        : "View gig calendar"}
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </section>
                <div className="overview-right">
                  <section className="panel band-pulse">
                    <div className="panel-head">
                      <h3>In the pocket</h3>
                      <AudioLines size={20} />
                    </div>
                    <p className="panel-subtitle">
                      Your band’s pulse, at a glance.
                    </p>
                    <div className="pulse-row">
                      <span>Musicianship</span>
                      <strong>
                        {averageSkill}
                        <small> / 100</small>
                      </strong>
                      <Meter value={averageSkill} />
                    </div>
                    <div className="pulse-row">
                      <span>Energy in the tank</span>
                      <strong>
                        {averageEnergy}
                        <small> / 100</small>
                      </strong>
                      <Meter value={averageEnergy} color="lime" />
                    </div>
                    <div className="pulse-row">
                      <span>Community following</span>
                      <strong>
                        {game.fans.toLocaleString()}
                        <small> fans</small>
                      </strong>
                      <div className="mini-wave" aria-hidden="true">
                        {[
                          13, 19, 15, 25, 20, 29, 24, 37, 29, 40, 37, 49, 43,
                          55, 49, 59, 54, 66, 62, 76, 65, 84, 73, 94,
                        ].map((v, i) => (
                          <i
                            key={i}
                            style={{
                              height: `${Math.min(100, v * (0.5 + game.reputation / 100))}%`,
                            }}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="pulse-tip">
                      <Sparkles size={17} />
                      <span>
                        {averageEnergy < 55
                          ? "Running on empty? A rest week will put the bounce back in your band."
                          : "A tight groove and happy people. That’s where the good stuff starts."}
                      </span>
                    </div>
                  </section>
                  <section className="rehearsal-promo">
                    <span className="promo-note">
                      <Music2 size={54} />
                    </span>
                    <Tag>MAKE IT CLICK</Tag>
                    <h3>
                      One band.
                      <br />A whole lot of rhythm.
                    </h3>
                    <p>Pick this week’s rehearsal focus.</p>
                    <button onClick={() => go("rehearsal")}>
                      Step into rehearsal <ArrowRight size={16} />
                    </button>
                  </section>
                </div>
              </div>
              <div className="bottom-grid">
                <section className="panel opportunities">
                  <div className="panel-head">
                    <h3>
                      Good things on the horizon{" "}
                      <span className="count">
                        {game.gigs.filter((g) => !g.booked).length}
                      </span>
                    </h3>
                    <button className="text-button" onClick={() => go("gigs")}>
                      All gigs <ArrowRight size={14} />
                    </button>
                  </div>
                  {game.gigs
                    .filter((g) => !g.booked)
                    .slice(0, 3)
                    .map((gig, index) => (
                      <button
                        key={gig.id}
                        className="opportunity-row"
                        onClick={() => go("gigs")}
                      >
                        <span className={cx("event-art", `art-${index}`)}>
                          {index === 0 ? (
                            <Flag />
                          ) : index === 1 ? (
                            <Music2 />
                          ) : (
                            <Sparkles />
                          )}
                        </span>
                        <span className="opportunity-info">
                          <strong>{gig.name}</strong>
                          <small>
                            {gig.location} · Week {gig.week}
                          </small>
                        </span>
                        <span className="opportunity-price">
                          {money(gig.fee)}
                          <small>{gig.type}</small>
                        </span>
                        <ChevronRight size={17} />
                      </button>
                    ))}
                  {!game.gigs.some((g) => !g.booked) && (
                    <Empty>
                      All booked up. Next week brings fresh opportunities.
                    </Empty>
                  )}
                </section>
                <section className="panel journal-preview">
                  <div className="panel-head">
                    <h3>Heard in the group chat</h3>
                    <button className="text-button" onClick={() => go("news")}>
                      See all <ArrowRight size={14} />
                    </button>
                  </div>
                  {game.events.slice(0, 3).map((event, i) => (
                    <div className="journal-snippet" key={event.id}>
                      <span className={cx("journal-icon", event.type)}>
                        {i === 0 ? (
                          <Megaphone size={17} />
                        ) : event.type === "bad" ? (
                          <Activity size={17} />
                        ) : (
                          <Music2 size={17} />
                        )}
                      </span>
                      <div>
                        <strong>{event.title}</strong>
                        <p>{event.text}</p>
                        <small>WEEK {event.week}</small>
                      </div>
                    </div>
                  ))}
                </section>
              </div>
            </>
          )}
          {page === "band" && (
            <Band
              game={game}
              onSelect={setSelectedMember}
              onRecruit={(kind) =>
                act(
                  (s) => recruit(s, kind),
                  "Fresh faces in the rehearsal room. Welcome to the band!",
                )
              }
            />
          )}
          {page === "gigs" && (
            <Gigs
              game={game}
              onBook={(id) =>
                act(
                  (s) => bookGig(s, id),
                  "It’s in the diary. Time to make it a good one.",
                )
              }
              onUnbook={(id) =>
                act((s) => unbookGig(s, id), "Booking released.")
              }
              onPlay={setLiveGig}
            />
          )}
          {page === "rehearsal" && (
            <div className="rehearsal-layout">
              <section className="panel">
                <div className="panel-head">
                  <h3>This week’s session</h3>
                  <Tag tone="purple">WEEK {game.week}</Tag>
                </div>
                <div className="rehearsal-scene">
                  <GigStage mode="rehearsal" energy={game.morale} compact />
                </div>
                <div className="rehearsal-options">
                  {(["groove", "showmanship", "rest"] as const).map(
                    (plan, i) => (
                      <button
                        key={plan}
                        aria-pressed={game.rehearsal === plan}
                        className={cx(
                          "plan-card",
                          game.rehearsal === plan && "selected",
                        )}
                        disabled={!!game.gameOver}
                        onClick={() => act((s) => setRehearsal(s, plan))}
                      >
                        <span className="plan-icon">
                          {i === 0 ? (
                            <AudioLines />
                          ) : i === 1 ? (
                            <Sparkles />
                          ) : (
                            <Heart />
                          )}
                        </span>
                        <span>
                          <strong>{planCopy[plan][0]}</strong>
                          <small>{planCopy[plan][1]}</small>
                        </span>
                        <span className="radio-mark">
                          {game.rehearsal === plan && <Check size={13} />}
                        </span>
                      </button>
                    ),
                  )}
                </div>
                <div className="panel-action">
                  <span>
                    {game.rehearsedWeek === game.week
                      ? "A good session. The band is feeling it."
                      : "One session per week · Hall and tutor: £80"}
                  </span>
                  <button
                    className="button primary"
                    disabled={
                      !!game.gameOver ||
                      game.rehearsedWeek === game.week ||
                      game.bank < 80
                    }
                    onClick={() =>
                      act(
                        rehearse,
                        "Session complete. Check the band’s refreshed stats.",
                      )
                    }
                  >
                    <Drum size={17} />
                    {game.rehearsedWeek === game.week
                      ? "Session complete"
                      : "Run rehearsal · £80"}
                  </button>
                </div>
              </section>
              <section className="panel coaching-panel">
                <div className="panel-head">
                  <h3>Give everyone a part</h3>
                  <Users size={20} />
                </div>
                <p>
                  Instrument balance matters as much as headcount. Cross-train
                  players to cover gaps in your lineup.
                </p>
                {INSTRUMENTS.map((inst) => {
                  const players = game.members.filter(
                    (m) => m.instrument === inst,
                  );
                  return (
                    <div className="instrument-row" key={inst}>
                      <span>{inst}</span>
                      <div className="instrument-dots">
                        {players.map((m) => (
                          <i key={m.id} style={{ background: m.color }} />
                        ))}
                      </div>
                      <strong>{players.length}</strong>
                    </div>
                  );
                })}
                <button
                  className="button secondary full"
                  onClick={() => go("band")}
                >
                  Develop a player <ArrowRight size={16} />
                </button>
                <div className="note-card">
                  <ShieldCheck size={22} />
                  <p>
                    Players in training sit out gigs. Keep enough depth in your
                    rhythm section before starting a new course.
                  </p>
                </div>
              </section>
            </div>
          )}
          {page === "finances" && (
            <Finances
              game={game}
              onUpgrade={(kind) =>
                act(
                  (s) => upgrade(s, kind),
                  "A little investment. A bigger future for the band.",
                )
              }
            />
          )}
          {page === "news" && (
            <section className="panel full-journal">
              <div className="panel-head">
                <h3>The Clyde City chronicles</h3>
                <Tag>{game.events.length} moments</Tag>
              </div>
              {game.events.map((event) => (
                <div className="full-event" key={event.id}>
                  <div className="event-week">
                    WEEK<strong>{String(event.week).padStart(2, "0")}</strong>
                  </div>
                  <span className={cx("journal-icon", event.type)}>
                    {event.type === "good" ? (
                      <Sparkles size={20} />
                    ) : event.type === "bad" ? (
                      <Activity size={20} />
                    ) : (
                      <Megaphone size={20} />
                    )}
                  </span>
                  <div>
                    <h3>{event.title}</h3>
                    <p>{event.text}</p>
                  </div>
                </div>
              ))}
            </section>
          )}
          <footer className="page-footer">
            <span>
              <Drum size={14} /> Made of rhythm. Held together by people.
            </span>
            <span>
              CLYDE CITY SAMBA <b>✳</b> EST. THIS WEEK
            </span>
          </footer>
        </main>
      </div>
      {toast && (
        <div className="toast" role="status">
          <CheckCheck size={19} />
          {toast}
          <button
            onClick={() => setToast("")}
            aria-label="Dismiss notification"
          >
            <X size={15} />
          </button>
        </div>
      )}
      {modal && (
        <Dialog
          title={
            modal === "help"
              ? "Your band. Your beat."
              : modal === "reset"
                ? "Start a new band story?"
                : "The manager’s desk"
          }
          onClose={() => setModal(null)}
        >
          {modal === "help" ? (
            <>
              <p className="dialog-intro">
                Take a chaotic community samba band from the rehearsal room to
                the main stage. Your goal: <strong>20 successful gigs.</strong>
              </p>
              <div className="help-steps">
                {[
                  [
                    "01",
                    "Get the band ready",
                    "Rehearse once a week to develop skill, lift morale or recover energy. Recruit and cross-train to cover every instrument.",
                  ],
                  [
                    "02",
                    "Build your diary",
                    "Book gigs that match your lineup. Each player can fill only one instrument role. Attendance is a forecast, never a promise.",
                  ],
                  [
                    "03",
                    "Put on a show",
                    "Enter gig day, pick your approach and make two live conducting decisions. Your band’s skill, energy and choices shape the result.",
                  ],
                  [
                    "04",
                    "Keep the wheels turning",
                    "Advance the week after playing all due gigs. Costs, recovery and life events roll forward. Keep funds above £0, reputation above 0 and at least 12 active players.",
                  ],
                ].map(([n, title, text]) => (
                  <div key={n}>
                    <b>{n}</b>
                    <span>
                      <strong>{title}</strong>
                      <p>{text}</p>
                    </span>
                  </div>
                ))}
              </div>
              <button
                className="button primary full"
                onClick={() => setModal(null)}
              >
                Let’s make some noise <ArrowRight size={16} />
              </button>
            </>
          ) : modal === "reset" ? (
            <>
              <p>
                This replaces the current season. Download a backup first if
                you’d like to keep it.
              </p>
              <button className="button secondary full" onClick={exportSave}>
                <Download size={17} /> Back up this season
              </button>
              <button
                className="button danger full"
                onClick={() => {
                  setGame(createGame(Date.now()));
                  setModal(null);
                  go("overview");
                  notify("A new band. A new beginning.");
                }}
              >
                Start fresh
              </button>
            </>
          ) : (
            <>
              <p>
                Your season saves automatically in this browser. Take a backup
                to move it to another device.
              </p>
              <button className="settings-row" onClick={exportSave}>
                <Download />
                <span>
                  <strong>Download save</strong>
                  <small>Keep your band’s story safe</small>
                </span>
                <ChevronRight />
              </button>
              <button
                className="settings-row"
                onClick={() => importRef.current?.click()}
              >
                <Upload />
                <span>
                  <strong>Restore a save</strong>
                  <small>Import a Samba Social v2 backup</small>
                </span>
                <ChevronRight />
              </button>
              <input
                type="file"
                accept=".json,application/json"
                ref={importRef}
                hidden
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  try {
                    const loaded = loadGame(await file.text());
                    if (!loaded)
                      throw new Error(
                        "This is not a valid Samba Social v2 save.",
                      );
                    setGame(loaded);
                    setModal(null);
                    notify(
                      "Welcome back. Your band is right where you left it.",
                    );
                  } catch (err) {
                    notify(
                      err instanceof Error
                        ? err.message
                        : "Unable to read this save.",
                    );
                  }
                  e.target.value = "";
                }}
              />
              <button
                className="settings-row"
                onClick={() => setModal("reset")}
              >
                <Flag />
                <span>
                  <strong>New season</strong>
                  <small>Start again with a fresh band</small>
                </span>
                <ChevronRight />
              </button>
              <div className="note-card">
                <ShieldCheck />
                <p>
                  The original game is preserved in{" "}
                  <code>docs/original.html</code>. Its older save is kept
                  separately.
                </p>
              </div>
            </>
          )}
        </Dialog>
      )}
      {liveMember && (
        <Dialog
          title="A face behind the rhythm"
          onClose={() => setSelectedMember(null)}
        >
          <div className="member-profile">
            <Avatar member={liveMember} size="large" />
            <div>
              <h2>{liveMember.name}</h2>
              <p>
                {liveMember.instrument}
                {liveMember.secondary ? ` · also ${liveMember.secondary}` : ""}
              </p>
              <Tag tone="purple">{liveMember.trait}</Tag>
            </div>
          </div>
          <div className="profile-stats">
            {[
              ["Skill", liveMember.skill],
              ["Reliability", liveMember.reliability],
              ["Energy", liveMember.energy],
              ["Morale", liveMember.morale],
            ].map(([label, value]) => (
              <div key={label}>
                <span>{label}</span>
                <strong>{value}</strong>
                <Meter value={Number(value)} />
              </div>
            ))}
          </div>
          <div className="note-card">
            <Activity />
            <p>
              {liveMember.status === "active"
                ? "Ready for the next gig. Reliability influences attendance; energy and skill influence the show."
                : `${liveMember.status === "training" ? "Learning a new instrument" : "Recovering from an injury"}. ${liveMember.statusWeeks} weeks remaining.`}
            </p>
          </div>
          <h3>Learn a new instrument</h3>
          <p className="muted small">
            Training takes this player out of the gig lineup temporarily. Their
            existing instrument stays in the toolkit.
          </p>
          <div className="training-buttons">
            {INSTRUMENTS.filter(
              (i) => i !== liveMember.instrument && i !== liveMember.secondary,
            ).map((inst) => (
              <button
                className="button secondary"
                key={inst}
                disabled={liveMember.status !== "active" || !!game.gameOver}
                onClick={() =>
                  act(
                    (s) => trainMember(s, liveMember.id, inst),
                    `${liveMember.name.split(" ")[0]} is learning ${inst}.`,
                  )
                }
              >
                <Plus size={14} />
                {inst}
              </button>
            ))}
          </div>
        </Dialog>
      )}
      {liveGig && (
        <LiveGig
          gig={liveGig}
          game={game}
          sound={sound}
          setSound={setSound}
          onClose={() => setLiveGig(null)}
          onResolve={(choices) => {
            const resolved = resolveGig(game, liveGig.id, choices);
            setGame(resolved.state);
            return resolved.result;
          }}
        />
      )}
    </div>
  );
}
