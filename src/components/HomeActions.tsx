import {
  ArrowRight,
  CalendarDays,
  Check,
  CircleHelp,
  Drum,
  Play,
  Users,
  Wallet,
} from "lucide-react";
import type { GameState } from "../game/engine";
import { isPlanning, weeklyCost } from "../game/engine";
import { money } from "../game/format";

export default function HomeActions({
  game,
  onNavigate,
  onAdvance,
  onHelp,
}: {
  game: GameState;
  onNavigate: (page: string) => void;
  onAdvance: () => void;
  onHelp: () => void;
}) {
  if (game.gameOver) return null;
  const planning = isPlanning(game);
  const due = game.gigs.filter((g) => g.booked && g.week <= game.week);
  const rehearsed = game.rehearsedWeek === game.week;
  const offers = game.gigs.filter((g) => !g.booked).length;
  const played = game.history.filter((g) => g.week === game.week).length;
  const actions = [
    {
      label: "Rehearse",
      detail: rehearsed ? "Done this week" : "£80 · one session this week",
      icon: Drum,
      action: () => onNavigate("rehearsal"),
    },
    {
      label: "Manage band",
      detail: "Recruit, train & view players",
      icon: Users,
      action: () => onNavigate("band"),
    },
    {
      label: "Book gigs",
      detail: `${offers} open invitations`,
      icon: CalendarDays,
      action: () => onNavigate("offers"),
    },
    {
      label: "View this week",
      detail: `${due.length} booked ${due.length === 1 ? "gig" : "gigs"}`,
      icon: Play,
      action: () => onNavigate("week"),
    },
    {
      label: "Manage funds",
      detail: "Budget, kit & transport",
      icon: Wallet,
      action: () => onNavigate("finances"),
    },
    {
      label: "Finish weekly turn",
      detail: due.length
        ? `Lock plans · play ${due.length} ${due.length === 1 ? "gig" : "gigs"}`
        : `${money(weeklyCost(game))} upkeep · start week ${game.week + 1}`,
      icon: ArrowRight,
      action: onAdvance,
    },
  ];
  return (
    <section className="home-actions" aria-labelledby="home-actions-title">
      <div className="home-actions-heading">
        <div>
          <span className="turn-label">
            WEEK {game.week} · {planning ? "PLANNING" : "GIG EVENTS"}
          </span>
          <h2 id="home-actions-title">
            {planning
              ? "Choose an action"
              : due.length
                ? "This week’s gigs"
                : "Week complete"}
          </h2>
        </div>
        <button
          className="text-button"
          onClick={onHelp}
          aria-label="Open game guide"
        >
          <CircleHelp size={17} />
          Game guide
        </button>
      </div>
      <p className="planning-note">
        {planning
          ? "Take your time making changes. Finish the weekly turn when your plans are set."
          : due.length
            ? "Your plans are locked. Gigs are events between this week’s turn and the next."
            : `All gig events are finished. Starting week ${game.week + 1} costs ${money(weeklyCost(game))} in upkeep, recovers energy, and progresses training.`}
      </p>
      {planning ? (
        <div className="home-actions-grid">
          {actions.map(({ label, detail, icon: Icon, action }) => (
            <button
              key={label}
              className="home-action"
              onClick={action}
              aria-label={label}
            >
              <Icon size={24} />
              <span>
                <strong>{label}</strong>
                <small>{detail}</small>
              </span>
            </button>
          ))}
        </div>
      ) : (
        <div className="between-turn-events">
          {due.map((gig) => (
            <div key={gig.id} className="pending-gig">
              <CalendarDays size={22} />
              <span>
                <strong>{gig.name}</strong>
                <small>
                  {gig.day} · {gig.location}
                </small>
              </span>
              <span className="tag">Booked</span>
            </div>
          ))}
          <button className="button primary full" onClick={onAdvance}>
            {due.length ? (
              <>
                <Play size={17} />
                Play next gig
              </>
            ) : (
              <>
                Start next week
                <ArrowRight size={17} />
              </>
            )}
          </button>
        </div>
      )}
      <div className="turn-status">
        <span>
          {rehearsed && <Check size={14} />}Rehearsal{" "}
          {rehearsed ? "complete" : planning ? "available" : "not held"}
        </span>
        <span>
          {played} {played === 1 ? "show" : "shows"} played this week
        </span>
        {planning && (
          <span>{money(weeklyCost(game))} upkeep when the week closes</span>
        )}
      </div>
    </section>
  );
}
