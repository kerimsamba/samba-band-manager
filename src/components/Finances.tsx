import { isPlanning } from "../game/engine";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Coins,
  Drum,
  MapPin,
  Plus,
  Radio,
  Ticket,
  Wallet,
} from "lucide-react";
import type { GameState } from "../game/engine";
import { upgradeCost, weeklyCost } from "../game/engine";
import { cx, money } from "../game/format";
import { Empty, Tag } from "./ui";
export default function Finances({
  game,
  onUpgrade,
}: {
  game: GameState;
  onUpgrade: (kind: "transport" | "kit" | "promotion") => void;
}) {
  const earned = game.history.reduce((n, r) => n + r.pay, 0);
  const costs = game.history.reduce((n, r) => n + r.cost, 0);
  return (
    <>
      <div className="finance-summary">
        <div className="finance-hero">
          <span>THE BAND FUND</span>
          <h2>{money(game.bank)}</h2>
          <p>Every great show starts with keeping the lights on.</p>
          <Wallet size={94} />
        </div>
        <section className="panel finance-income">
          <div>
            <span className="stat-icon green">
              <ArrowDownLeft size={20} />
            </span>
            <span>
              <small>LIFETIME GIG INCOME</small>
              <strong>{money(earned)}</strong>
            </span>
          </div>
          <div>
            <span className="stat-icon orange">
              <ArrowUpRight size={20} />
            </span>
            <span>
              <small>LIFETIME GIG EXPENSES</small>
              <strong>{money(costs)}</strong>
            </span>
          </div>
        </section>
      </div>
      <div className="section-toolbar">
        <h2 className="section-heading">Give the band a little upgrade</h2>
        <span className="muted small">
          Permanent investments. Lasting good vibes.
        </span>
      </div>
      <div className="upgrades-grid">
        {(
          [
            {
              kind: "transport",
              title: "Room on the minibus",
              text: "Make travel easier and help more players show up.",
              icon: MapPin,
            },
            {
              kind: "kit",
              title: "A kit worth making noise on",
              text: "Better instruments for a tighter, more confident sound.",
              icon: Drum,
            },
            {
              kind: "promotion",
              title: "Let the whole city hear",
              text: "Turn festival moments into a growing community of fans.",
              icon: Radio,
            },
          ] as const
        ).map((u) => (
          <section className="panel upgrade-card" key={u.kind}>
            <span className="upgrade-art">
              <u.icon size={52} strokeWidth={1.4} />
            </span>
            <Tag tone="purple">LEVEL {game.upgrades[u.kind]} / 3</Tag>
            <h3>{u.title}</h3>
            <p>{u.text}</p>
            <div className="upgrade-level">
              {[1, 2, 3].map((n) => (
                <i
                  key={n}
                  className={game.upgrades[u.kind] >= n ? "filled" : ""}
                />
              ))}
            </div>
            <button
              className="button primary full"
              disabled={
                !!game.gameOver ||
                !isPlanning(game) ||
                game.upgrades[u.kind] >= 3 ||
                game.bank < upgradeCost(game, u.kind)
              }
              onClick={() => onUpgrade(u.kind)}
            >
              {game.upgrades[u.kind] >= 3
                ? "Fully upgraded"
                : `Upgrade · ${money(upgradeCost(game, u.kind))}`}
              {game.upgrades[u.kind] < 3 && <Plus size={16} />}
            </button>
            <small className="upgrade-cost" data-upgrade={u.kind}>
              {game.upgrades[u.kind] >= 3
                ? "Built for the big stage."
                : `One-time cost · Level ${game.upgrades[u.kind] + 1}`}
            </small>
          </section>
        ))}
      </div>
      <div className="note-card finance-note">
        <Coins size={22} />
        <p>
          Your current running costs are{" "}
          <strong>{money(weeklyCost(game))} per week</strong>. Rehearsals cost
          £80; recruitment costs £100–£250. Gig travel is deducted from each
          payment. Every upgrade is a one-time investment.
        </p>
      </div>
      <section className="panel">
        <div className="panel-head">
          <h3>Show by show</h3>
          <span className="muted small">Gig payments & travel costs</span>
        </div>
        {game.history.length ? (
          [...game.history].reverse().map((r) => (
            <div className="transaction" key={r.id}>
              <span className={cx("stat-icon", r.pay > 0 ? "green" : "orange")}>
                <Ticket size={18} />
              </span>
              <div>
                <strong>{r.name}</strong>
                <small>
                  Week {r.week} · {r.outcome}
                </small>
              </div>
              <span>
                <strong>+{money(r.pay)}</strong>
                <small>−{money(r.cost)} expenses</small>
              </span>
            </div>
          ))
        ) : (
          <Empty>Your first gig payday is waiting in the wings.</Empty>
        )}
      </section>
    </>
  );
}
