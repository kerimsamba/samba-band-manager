import { isPlanning } from "../game/engine";
import { Megaphone, Plus, Search, Users } from "lucide-react";
import { useState } from "react";
import type { GameState, Member } from "../game/engine";
import { INSTRUMENTS } from "../game/engine";
import { money } from "../game/format";
import { Avatar, Empty, Meter, Tag } from "./ui";
export default function Band({
  game,
  onSelect,
  onRecruit,
}: {
  game: GameState;
  onSelect: (m: Member) => void;
  onRecruit: (kind: "open" | "campaign") => void;
}) {
  const [search, setSearch] = useState("");
  const [instrument, setInstrument] = useState("All instruments");
  const [sort, setSort] = useState("name");
  const members = game.members
    .filter(
      (m) =>
        m.name.toLowerCase().includes(search.toLowerCase()) &&
        (instrument === "All instruments" || m.instrument === instrument),
    )
    .sort((a, b) =>
      sort === "name"
        ? a.name.localeCompare(b.name)
        : b[sort as "skill" | "energy" | "reliability"] -
          a[sort as "skill" | "energy" | "reliability"],
    );
  return (
    <>
      <div className="roster-toolbar">
        <div className="input-wrap">
          <Search size={18} />
          <input
            aria-label="Search band members"
            placeholder="Find a familiar face…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          aria-label="Filter by instrument"
          value={instrument}
          onChange={(e) => setInstrument(e.target.value)}
        >
          {["All instruments", ...INSTRUMENTS].map((inst) => (
            <option key={inst}>{inst}</option>
          ))}
        </select>
        <select
          aria-label="Sort members"
          value={sort}
          onChange={(e) => setSort(e.target.value)}
        >
          <option value="name">Sort: Name</option>
          <option value="skill">Sort: Skill</option>
          <option value="reliability">Sort: Reliability</option>
          <option value="energy">Sort: Energy</option>
        </select>
        <span>{members.length} members</span>
      </div>
      <section className="panel roster">
        <div className="roster-row roster-header">
          <span>THE PLAYER</span>
          <span>INSTRUMENT</span>
          <span>SKILL</span>
          <span>RELIABILITY</span>
          <span>ENERGY</span>
          <span>STATUS</span>
        </div>
        {members.map((m) => (
          <button className="roster-row" key={m.id} onClick={() => onSelect(m)}>
            <span className="player-cell">
              <Avatar member={m} />
              <span>
                <strong>{m.name}</strong>
                <small>{m.trait}</small>
              </span>
            </span>
            <span className="instrument-cell">
              {m.instrument}
              <small>{m.secondary ? `+ ${m.secondary}` : "Specialist"}</small>
            </span>
            <span className="table-stat">
              <span className="mobile-stat-label">Skill</span>
              <b>{m.skill}</b>
              <Meter value={m.skill} />
            </span>
            <span className="table-stat">
              <span className="mobile-stat-label">Reliability</span>
              <b>{m.reliability}</b>
              <Meter value={m.reliability} />
            </span>
            <span className="table-stat">
              <span className="mobile-stat-label">Energy</span>
              <b>{m.energy}</b>
              <Meter value={m.energy} color="lime" />
            </span>
            <span>
              <Tag tone={m.status === "active" ? "green" : "orange"}>
                {m.status === "active" ? "Ready to play" : m.status}
              </Tag>
            </span>
          </button>
        ))}
        {!members.length && (
          <Empty>
            No players match this search. Try another name or instrument.
          </Empty>
        )}
      </section>
      <div className="recruit-grid">
        {[
          {
            kind: "open" as const,
            title: "Open the rehearsal doors",
            text: "A friendly session for the samba-curious. Welcome 1–3 new players.",
            cost: 100,
          },
          {
            kind: "campaign" as const,
            title: "Make some noise online",
            text: "Share the energy. Reach new people and bring 2–5 players into the fold.",
            cost: 250,
          },
        ].map((r) => (
          <section className="panel recruit-card" key={r.kind}>
            <span className="recruit-icon">
              {r.kind === "open" ? (
                <Users size={29} />
              ) : (
                <Megaphone size={29} />
              )}
            </span>
            <div>
              <h3>{r.title}</h3>
              <p>{r.text}</p>
            </div>
            <button
              className="button primary"
              disabled={
                game.bank < r.cost || !!game.gameOver || !isPlanning(game)
              }
              onClick={() => onRecruit(r.kind)}
            >
              Recruit · {money(r.cost)}
              <Plus size={16} />
            </button>
          </section>
        ))}
      </div>
    </>
  );
}
