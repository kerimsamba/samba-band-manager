import { isPlanning } from "../game/engine";
import {
  Check,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  Drum,
  MapPin,
  Play,
  Plus,
  Users,
} from "lucide-react";
import { useState } from "react";
import type { GameState, Gig } from "../game/engine";
import { getReadiness } from "../game/engine";
import { cx, money } from "../game/format";
import { Empty, Meter, Tag } from "./ui";
export default function Gigs({
  game,
  initialFilter = "all",
  onBook,
  onUnbook,
  onPlay,
}: {
  game: GameState;
  initialFilter?: string;
  onBook: (id: string) => void;
  onUnbook: (id: string) => void;
  onPlay: (g: Gig) => void;
}) {
  const [filter, setFilter] = useState(initialFilter);
  const [weekOffset, setWeekOffset] = useState(0);
  const gigs = [...game.gigs]
    .filter(
      (g) =>
        filter === "all" ||
        (filter === "week"
          ? g.week === game.week && g.booked
          : filter === "booked"
            ? g.booked
            : !g.booked),
    )
    .sort((a, b) => a.week - b.week);
  return (
    <>
      <div className="calendar-strip">
        <button
          className="icon-button"
          disabled={weekOffset <= 0}
          onClick={() => setWeekOffset((v) => Math.max(0, v - 4))}
          aria-label="Earlier weeks"
        >
          <ChevronLeft size={18} />
        </button>
        {Array.from({ length: 4 }, (_, i) => game.week + weekOffset + i).map(
          (week) => (
            <div
              key={week}
              className={cx("calendar-week", week === game.week && "current")}
            >
              <small>{week === game.week ? "THIS WEEK" : "COMING UP"}</small>
              <strong>Week {String(week).padStart(2, "0")}</strong>
              <span>
                {game.gigs.filter((g) => g.booked && g.week === week).length}{" "}
                booked <i />{" "}
                {game.gigs.filter((g) => !g.booked && g.week === week).length}{" "}
                offers
              </span>
            </div>
          ),
        )}
        <button
          className="icon-button"
          onClick={() => setWeekOffset((v) => v + 4)}
          aria-label="Later weeks"
        >
          <ChevronRight size={18} />
        </button>
      </div>
      <div className="section-toolbar">
        <div className="segmented">
          {[
            ["all", "All opportunities"],
            ["week", "This week"],
            ["booked", "In the diary"],
            ["offers", "New offers"],
          ].map(([id, label]) => (
            <button
              className={filter === id ? "active" : ""}
              onClick={() => setFilter(id)}
              key={id}
            >
              {label}
            </button>
          ))}
        </div>
        <span className="muted small">
          Lineup forecasts aren’t attendance guarantees.
        </span>
      </div>
      <div className="gigs-grid">
        {gigs.map((gig, i) => {
          const ready = getReadiness(game, gig);
          return (
            <section className="panel gig-card" key={gig.id}>
              <div className={cx("gig-poster", `poster-${i % 4}`)}>
                <span>
                  {gig.type.toUpperCase()}
                  <br />
                  <b>
                    {gig.type === "Festival"
                      ? "GOOD\nVIBRATIONS"
                      : gig.type === "Parade"
                        ? "TAKE IT TO\nTHE STREETS"
                        : gig.type === "Corporate"
                          ? "A LITTLE\nEXTRA LOUD"
                          : "LOCAL ROOTS.\nGLOBAL RHYTHMS."}
                  </b>
                </span>
                <div className="poster-drum">
                  <Drum size={84} strokeWidth={1.2} />
                  <span>✳</span>
                </div>
                <Tag>
                  {gig.booked ? (
                    <>
                      <Check size={12} /> BOOKED
                    </>
                  ) : (
                    "INVITATION"
                  )}
                </Tag>
              </div>
              <div className="gig-card-body">
                <div className="eyebrow purple-text">
                  WEEK {gig.week} · {gig.day.toUpperCase()}
                </div>
                <h3>{gig.name}</h3>
                <p className="location">
                  <MapPin size={13} />
                  {gig.location}
                </p>
                <div className="gig-facts">
                  <span>
                    <small>THE FEE</small>
                    <strong>{money(gig.fee)}</strong>
                  </span>
                  <span>
                    <small>THE CROWD</small>
                    <strong>{gig.capacity.toLocaleString()}</strong>
                  </span>
                  <span>
                    <small>DIFFICULTY</small>
                    <strong>
                      {gig.difficulty}
                      <small> / 100</small>
                    </strong>
                  </span>
                </div>
                <div className="readiness">
                  <span>
                    <Users size={14} />
                    {ready.expected} expected · {ready.required} needed
                  </span>
                  <strong>{Math.round(ready.confidence)}%</strong>
                  <Meter value={ready.confidence} />
                </div>
                <div className="requirements">
                  {Object.entries(gig.requirements).map(([inst, n]) => (
                    <span key={inst}>
                      {inst} <b>×{n}</b>
                    </span>
                  ))}
                </div>
                <div className="gig-card-actions">
                  {gig.booked ? (
                    <>
                      <button
                        className="button secondary"
                        onClick={() => onUnbook(gig.id)}
                        disabled={
                          !!game.gameOver ||
                          !isPlanning(game) ||
                          gig.week <= game.week
                        }
                        title={
                          gig.week <= game.week
                            ? "This week’s gig is committed; take the stage to fulfil it."
                            : "Release this future booking"
                        }
                      >
                        Release
                      </button>
                      {gig.week <= game.week ? (
                        <button
                          className="button primary"
                          disabled={!!game.gameOver}
                          onClick={() => onPlay(gig)}
                        >
                          <Play size={15} />{" "}
                          {isPlanning(game)
                            ? "Finish turn & play"
                            : "Enter gig day"}
                        </button>
                      ) : (
                        <span className="booked-note">
                          <CheckCheck size={16} /> See you in week {gig.week}
                        </span>
                      )}
                    </>
                  ) : (
                    <button
                      className="button primary full"
                      disabled={!!game.gameOver || !isPlanning(game)}
                      onClick={() => onBook(gig.id)}
                    >
                      Put it in the diary
                      <Plus size={16} />
                    </button>
                  )}
                </div>
              </div>
            </section>
          );
        })}
      </div>
      {!gigs.length && (
        <Empty>
          No gigs here yet. Browse the opportunities or advance to a new week.
        </Empty>
      )}
      {!!game.history.length && (
        <section className="panel gig-history">
          <div className="panel-head">
            <h3>Already made some noise</h3>
            <Tag>{game.totalGigs} shows</Tag>
          </div>
          {[...game.history].reverse().map((result) => (
            <div className="history-row" key={result.id}>
              <span className="score-badge">{result.score}</span>
              <div>
                <strong>{result.name}</strong>
                <small>
                  Week {result.week} · {result.attendance} players
                </small>
              </div>
              <Tag tone={result.success ? "green" : "orange"}>
                {result.outcome}
              </Tag>
              <strong>{money(result.pay - result.cost)}</strong>
            </div>
          ))}
        </section>
      )}
    </>
  );
}
