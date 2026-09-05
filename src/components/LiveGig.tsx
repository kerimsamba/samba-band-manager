import {
  ArrowRight,
  AudioLines,
  Check,
  ChevronRight,
  Drum,
  Heart,
  MapPin,
  Pause,
  Play,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
  Volume2,
  VolumeX,
  Wallet,
  Zap,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { GameState, Gig, GigResult } from "../game/engine";
import { getReadiness } from "../game/engine";
import { cx, money, SAVE_KEY } from "../game/format";
import Dialog from "./Dialog";
import GigStage from "./GigStage";
import { Meter, Tag } from "./ui";
import { useSambaAudio } from "./useSambaAudio";
type Choices = {
  approach: "steady" | "bold" | "party";
  cue: "tighten" | "solo" | "crowd";
  finale: "classic" | "encore";
};
export default function LiveGig({
  gig,
  game,
  sound,
  setSound,
  onClose,
  onResolve,
}: {
  gig: Gig;
  game: GameState;
  sound: boolean;
  setSound: (v: boolean) => void;
  onClose: () => void;
  onResolve: (choices: Choices) => GigResult;
}) {
  const draftKey = `${SAVE_KEY}_live`;
  const [draft] = useState(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem(draftKey) || "null");
      if (
        saved?.gigId === gig.id &&
        saved.seed === game.seed &&
        saved.week === game.week &&
        typeof saved.started === "boolean" &&
        typeof saved.decisionPending === "boolean" &&
        Number.isFinite(saved.progress) &&
        saved.progress >= 0 &&
        saved.progress < 100 &&
        [0, 1, 2].includes(saved.checkpoint) &&
        ["steady", "bold", "party"].includes(saved.choices?.approach) &&
        ["tighten", "solo", "crowd"].includes(saved.choices?.cue) &&
        ["classic", "encore"].includes(saved.choices?.finale)
      )
        return saved as {
          progress: number;
          started: boolean;
          decisionPending: boolean;
          checkpoint: number;
          choices: Choices;
        };
    } catch {
      /* Private browsing may disable session storage. */
    }
    return null;
  });
  const [progress, setProgress] = useState(draft?.progress || 0);
  const [decisionPending, setDecisionPending] = useState(
    draft?.decisionPending || false,
  );
  const [running, setRunning] = useState(false);
  const [started, setStarted] = useState(draft?.started || false);
  const [speed, setSpeed] = useState(1);
  const [checkpoint, setCheckpoint] = useState(draft?.checkpoint || 0);
  const [choices, setChoices] = useState<Choices>(
    draft?.choices || { approach: "steady", cue: "tighten", finale: "classic" },
  );
  const [result, setResult] = useState<GigResult | null>(null);
  const [error, setError] = useState("");
  const resolved = useRef(false);
  useEffect(() => {
    try {
      if (result) sessionStorage.removeItem(draftKey);
      else
        sessionStorage.setItem(
          draftKey,
          JSON.stringify({
            gigId: gig.id,
            seed: game.seed,
            week: game.week,
            progress,
            started,
            decisionPending,
            checkpoint,
            choices,
          }),
        );
    } catch {
      /* The game remains playable without draft storage. */
    }
  }, [progress, started, decisionPending, checkpoint, choices, result]);
  const choiceMode = !started
    ? "approach"
    : decisionPending && checkpoint === 1
      ? "cue"
      : decisionPending && checkpoint === 2
        ? "finale"
        : null;
  const energy = Math.min(
    100,
    Math.round(
      game.morale * 0.55 +
        progress * 0.35 +
        (choices.approach === "party" ? 20 : 10),
    ),
  );
  const { supported } = useSambaAudio({
    enabled: sound,
    playing: running,
    energy,
    tempo: choices.approach === "bold" ? 118 : 108,
  });
  const finish = () => {
    if (resolved.current) return;
    resolved.current = true;
    setRunning(false);
    try {
      setResult(onResolve(choices));
      setProgress(100);
    } catch (e) {
      resolved.current = false;
      setError(e instanceof Error ? e.message : "Unable to finish this show.");
    }
  };
  useEffect(() => {
    if (!running) return;
    const timer = setInterval(
      () => setProgress((p) => Math.min(100, p + speed * 0.5)),
      180,
    );
    return () => clearInterval(timer);
  }, [running, speed]);
  useEffect(() => {
    if (progress >= 100 && !result) finish();
    else if (progress >= 66 && checkpoint < 2) {
      setRunning(false);
      setCheckpoint(2);
      setDecisionPending(true);
    } else if (progress >= 32 && checkpoint < 1) {
      setRunning(false);
      setCheckpoint(1);
      setDecisionPending(true);
    }
  }, [progress]);
  const decisionSets = {
    approach: [
      {
        id: "steady",
        title: "Find the pocket",
        text: "A steady groove. Reliable and easy on energy.",
        icon: AudioLines,
      },
      {
        id: "bold",
        title: "Go all out",
        text: "Big ambition. Rewards skill, risks tired players.",
        icon: Zap,
      },
      {
        id: "party",
        title: "Bring the party",
        text: "Put band spirit and crowd connection first.",
        icon: Sparkles,
      },
    ],
    cue: [
      {
        id: "tighten",
        title: "Bring it together",
        text: "Tighten the rhythm and steady the band.",
        icon: AudioLines,
      },
      {
        id: "solo",
        title: "Give them a solo",
        text: "Spotlight your skill. A little more risk.",
        icon: Drum,
      },
      {
        id: "crowd",
        title: "Get them involved",
        text: "Call and response. Make it everyone’s show.",
        icon: Users,
      },
    ],
    finale: [
      {
        id: "classic",
        title: "Stick the landing",
        text: "Finish tight. Save a little energy for tomorrow.",
        icon: ShieldCheck,
      },
      {
        id: "encore",
        title: "One more tune!",
        text: "Spend the last of your energy on a big finish.",
        icon: FlameIcon,
      },
    ],
  };
  return (
    <Dialog title={result ? "That’s a wrap!" : gig.name} onClose={onClose} wide>
      <div className="live-meta">
        <span>
          <MapPin size={14} />
          {gig.location}
        </span>
        <Tag tone="purple">
          {result
            ? "SHOW COMPLETE"
            : !started
              ? "SOUNDCHECK"
              : running
                ? "LIVE ON STAGE"
                : decisionPending
                  ? "YOUR CALL, MAESTRO"
                  : "PAUSED"}
        </Tag>
      </div>
      <div className="live-stage">
        <GigStage
          energy={result ? result.score : energy}
          playing={running || !!result}
          progress={progress}
        />
        <div className="live-overlay-badge">
          <span className={cx("live-dot", running && "red")} />
          {result
            ? result.outcome.toUpperCase()
            : running
              ? "LIVE"
              : "BACKSTAGE"}
        </div>
        {result && (
          <div className="result-score">
            <strong>{result.score}</strong>
            <span>SHOW RATING</span>
          </div>
        )}
      </div>
      {result ? (
        <div className="show-results">
          <h2>
            {result.success
              ? "You brought people together."
              : "Every show teaches you something."}
          </h2>
          <p>
            {result.outcome} · {result.attendance} players took the stage
          </p>
          <div className="result-stats">
            <div>
              <Wallet />
              <strong>{money(result.pay - result.cost)}</strong>
              <small>Net gig income</small>
            </div>
            <div>
              <Star />
              <strong>
                {result.repDelta >= 0 ? "+" : ""}
                {result.repDelta}
              </strong>
              <small>Reputation</small>
            </div>
            <div>
              <Heart />
              <strong>
                {result.fansDelta >= 0 ? "+" : ""}
                {result.fansDelta}
              </strong>
              <small>New fans</small>
            </div>
          </div>
          <div className="highlights">
            {result.highlights.map((h, i) => (
              <p key={i}>
                <Sparkles size={15} />
                {h}
              </p>
            ))}
          </div>
          <button className="button primary full" onClick={onClose}>
            Back to the clubhouse <ArrowRight size={17} />
          </button>
        </div>
      ) : (
        <>
          <div className="live-transport">
            <button
              className="icon-button"
              aria-label={
                sound ? "Mute samba percussion" : "Enable samba percussion"
              }
              onClick={() => setSound(!sound)}
              disabled={!supported}
            >
              {sound ? <Volume2 size={19} /> : <VolumeX size={19} />}
            </button>
            <span className="sound-label">
              {sound ? "Sound on" : "Sound off"}
            </span>
            <div className="live-timeline">
              <Meter value={progress} />
              <span>
                OPENING GROOVE <b>THE BREAKDOWN</b> GRAND FINALE
              </span>
            </div>
            <button
              className="speed-button"
              onClick={() => setSpeed((s) => (s === 1 ? 2 : s === 2 ? 4 : 1))}
              aria-label="Change playback speed"
            >
              {speed}×
            </button>
            {started && (
              <button
                className="icon-button"
                aria-label={running ? "Pause show" : "Resume show"}
                onClick={() => setRunning((v) => !v)}
                disabled={!running && choiceMode !== null}
              >
                {running ? <Pause size={18} /> : <Play size={18} />}
              </button>
            )}
          </div>
          {!started || (!running && choiceMode) ? (
            <div className="conducting">
              <div className="conducting-heading">
                <span className="eyebrow purple-text">
                  {!started
                    ? "01 / SET THE FEEL"
                    : checkpoint === 1
                      ? "02 / READ THE ROOM"
                      : "03 / MAKE IT MEMORABLE"}
                </span>
                <h3>
                  {!started
                    ? "How are we playing this?"
                    : checkpoint === 1
                      ? "The groove is rolling. What’s your call?"
                      : "They’re with you. How do you finish?"}
                </h3>
                <p>
                  {!started
                    ? `${getReadiness(game, gig).expected} players expected. ${Math.round(getReadiness(game, gig).confidence)}% lineup confidence. Pick an approach that fits your band.`
                    : "Your decision changes the performance, energy cost, and crowd response."}
                </p>
              </div>
              <div className="decision-grid">
                {decisionSets[choiceMode || "approach"].map((option) => (
                  <button
                    aria-pressed={
                      choices[choiceMode || "approach"] === option.id
                    }
                    className={cx(
                      "decision-card",
                      choices[choiceMode || "approach"] === option.id &&
                        "selected",
                    )}
                    key={option.id}
                    onClick={() =>
                      setChoices((c) => ({
                        ...c,
                        [choiceMode || "approach"]: option.id,
                      }))
                    }
                  >
                    <option.icon size={23} />
                    <strong>{option.title}</strong>
                    <small>{option.text}</small>
                    {choices[choiceMode || "approach"] === option.id && (
                      <span className="decision-check">
                        <Check size={12} />
                      </span>
                    )}
                  </button>
                ))}
              </div>
              <button
                className="button primary full"
                onClick={() => {
                  setStarted(true);
                  setDecisionPending(false);
                  setRunning(true);
                }}
              >
                <Play size={16} />
                {!started
                  ? "Take the stage"
                  : checkpoint === 1
                    ? "Cue the band"
                    : "Bring it home"}
              </button>
            </div>
          ) : (
            <div className="performance-commentary">
              <span className="equalizer">
                <i />
                <i />
                <i />
                <i />
              </span>
              <div>
                <strong>
                  {progress < 32
                    ? "The surdos kick in. Heads start nodding."
                    : progress < 66
                      ? choices.cue === "solo"
                        ? "A solo rises over the rhythm. The band gives it space."
                        : choices.cue === "crowd"
                          ? "Your call. Their response. The whole park finds the beat."
                          : "The rhythm section locks in. One band, one heartbeat."
                      : choices.finale === "encore"
                        ? "One more tune. Every last drop of energy."
                        : "Eyes on the leader. One final break. Make it count."}
                </strong>
                <p>
                  {running
                    ? "Watch the show. Your next conducting moment is coming up."
                    : "The show is paused. Resume when you’re ready."}
                </p>
              </div>
            </div>
          )}
          <div className="live-bottom">
            <small>
              Close to pause; reopen gig day to resume. Decisions affect the
              final result.
            </small>
            {started && (
              <button className="text-button" onClick={finish}>
                Skip to result <ChevronRight size={14} />
              </button>
            )}
          </div>
          {error && (
            <p role="alert" className="error-text">
              {error}
            </p>
          )}
        </>
      )}
    </Dialog>
  );
}
function FlameIcon({ size = 24 }: { size?: number }) {
  return <Zap size={size} />;
}
