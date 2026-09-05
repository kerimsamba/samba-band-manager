import { useId, type CSSProperties } from "react";
import "./gig-stage.css";

type GigStageProps = {
  energy?: number;
  playing?: boolean;
  mode?: "festival" | "rehearsal";
  progress?: number;
  compact?: boolean;
  spotlight?: string;
};

const clamp = (value: number, min = 0, max = 100) =>
  Math.max(min, Math.min(max, value));

const performers = [
  {
    x: 166,
    y: 252,
    skin: "#ad704e",
    shirt: "#f7a6a0",
    hair: "#302042",
    drum: "#f2b67e",
    accent: "#d8f477",
    tilt: -5,
  },
  {
    x: 220,
    y: 235,
    skin: "#8b573e",
    shirt: "#d8f477",
    hair: "#19213b",
    drum: "#e89277",
    accent: "#f9d7b5",
    tilt: 4,
  },
  {
    x: 274,
    y: 249,
    skin: "#d89b76",
    shirt: "#f2cb73",
    hair: "#3c1f32",
    drum: "#b99ce9",
    accent: "#ed786b",
    tilt: -3,
  },
  {
    x: 329,
    y: 229,
    skin: "#704233",
    shirt: "#f08379",
    hair: "#1c1a2e",
    drum: "#efbb79",
    accent: "#d8f477",
    tilt: 3,
  },
  {
    x: 385,
    y: 249,
    skin: "#c98661",
    shirt: "#9e81d9",
    hair: "#482a35",
    drum: "#e99277",
    accent: "#f2cb73",
    tilt: -4,
  },
  {
    x: 440,
    y: 230,
    skin: "#9d6046",
    shirt: "#f6e4c8",
    hair: "#28213a",
    drum: "#f0b26e",
    accent: "#ed786b",
    tilt: 5,
  },
  {
    x: 495,
    y: 247,
    skin: "#e0a27c",
    shirt: "#d8f477",
    hair: "#612d35",
    drum: "#b99ce9",
    accent: "#f7a6a0",
    tilt: -3,
  },
  {
    x: 551,
    y: 231,
    skin: "#744535",
    shirt: "#f7a6a0",
    hair: "#151a30",
    drum: "#efbb79",
    accent: "#b99ce9",
    tilt: 4,
  },
  {
    x: 605,
    y: 250,
    skin: "#b97657",
    shirt: "#f2cb73",
    hair: "#3a2032",
    drum: "#df8b72",
    accent: "#d8f477",
    tilt: -5,
  },
  {
    x: 659,
    y: 234,
    skin: "#d59a77",
    shirt: "#9e81d9",
    hair: "#202038",
    drum: "#edb879",
    accent: "#f6e4c8",
    tilt: 3,
  },
  {
    x: 710,
    y: 250,
    skin: "#87513d",
    shirt: "#f08379",
    hair: "#422637",
    drum: "#bc93dc",
    accent: "#f2cb73",
    tilt: -4,
  },
];

const crowd = Array.from({ length: 36 }, (_, i) => ({
  x: 26 + ((i * 83) % 850),
  y: 414 + ((i * 17) % 74),
  r: 3 + (i % 4),
  skin: ["#8b573e", "#d89b76", "#ad704e", "#e0a27c"][i % 4],
  shirt: ["#d8f477", "#f7a6a0", "#9e81d9", "#f2cb73", "#f6e4c8"][i % 5],
  delay: `${(i % 7) * 0.13}s`,
}));

function Person({
  person,
  index,
}: {
  person: (typeof performers)[number];
  index: number;
}) {
  return (
    <g transform={`translate(${person.x} ${person.y}) rotate(${person.tilt})`}>
      <g
        className="gig-performer"
        style={{ "--person-delay": `${index * 0.08}s` } as CSSProperties}
      >
        <ellipse cx="0" cy="72" rx="27" ry="6" fill="#1e1735" opacity=".28" />
        <path
          d="M-17 27 Q-23 48 -17 69 L17 69 Q23 48 17 27Z"
          fill={person.shirt}
          stroke="#241839"
          strokeWidth="2"
        />
        <path
          d="M-10 65 L-14 86 M10 65 L14 86"
          stroke="#241839"
          strokeWidth="6"
          strokeLinecap="round"
        />
        <circle
          cx="0"
          cy="11"
          r="14"
          fill={person.skin}
          stroke="#241839"
          strokeWidth="2"
        />
        <path
          d="M-14 10 Q-16 -8 0 -9 Q16 -8 14 10 Q8 2 -1 4 Q-8 0 -14 10Z"
          fill={person.hair}
        />
        <circle cx="-5" cy="12" r="1.5" fill="#241839" />
        <circle cx="5" cy="12" r="1.5" fill="#241839" />
        <path
          d="M-4 19 Q0 22 4 19"
          fill="none"
          stroke="#6b3b42"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <ellipse
          cx="0"
          cy="47"
          rx="18"
          ry="13"
          fill={person.drum}
          stroke="#241839"
          strokeWidth="2"
        />
        <path
          d="M-17 47 Q0 38 17 47"
          fill="none"
          stroke="#fff0d7"
          strokeWidth="3"
          opacity=".8"
        />
        <path
          d="M-14 55 Q0 63 14 55"
          fill="none"
          stroke="#a45050"
          strokeWidth="2"
          opacity=".7"
        />
        <path
          d="M-12 33 L-25 19"
          stroke={person.skin}
          strokeWidth="6"
          strokeLinecap="round"
        />
        <path
          className="gig-drum-stick gig-drum-stick--left"
          d="M-23 20 L-34 3"
          stroke="#f6e4c8"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <path
          d="M12 33 L24 19"
          stroke={person.skin}
          strokeWidth="6"
          strokeLinecap="round"
        />
        <path
          className="gig-drum-stick gig-drum-stick--right"
          d="M23 20 L34 3"
          stroke="#f6e4c8"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <path
          d="M-11 29 Q0 23 11 29"
          fill="none"
          stroke={person.accent}
          strokeWidth="3"
          strokeLinecap="round"
        />
      </g>
    </g>
  );
}

export default function GigStage({
  energy = 65,
  playing = true,
  mode = "festival",
  progress = 0,
  compact = false,
  spotlight,
}: GigStageProps) {
  const rawId = useId();
  const id = rawId.replace(/[^a-zA-Z0-9_-]/g, "");
  const power = clamp(energy) / 100;
  const sceneProgress = clamp(progress) / 100;
  const skyGlow = 0.22 + power * 0.3 + sceneProgress * 0.2;
  const ariaTitle =
    mode === "rehearsal"
      ? "Samba Social rehearsal stage"
      : "Samba Social at a Scottish twilight festival";

  return (
    <div
      className={`gig-stage ${playing ? "" : "gig-stage--paused"} ${compact ? "gig-stage--compact" : ""}`}
      style={
        {
          "--gig-energy": power,
          "--gig-spotlight": spotlight || "#d8f477",
        } as CSSProperties
      }
    >
      <svg
        className="gig-stage__svg"
        viewBox="0 0 900 510"
        role="img"
        aria-labelledby={`${id}-title ${id}-desc`}
        preserveAspectRatio="xMidYMid meet"
      >
        <title id={`${id}-title`}>{ariaTitle}</title>
        <desc id={`${id}-desc`}>
          An animated hand-drawn isometric samba band playing on a purple
          outdoor stage, with crowd, speakers, hills, bunting and glowing
          festival lights.
        </desc>
        <defs>
          <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#b89bdb" />
            <stop offset=".62" stopColor="#e6dff7" />
            <stop offset="1" stopColor="#f9dbbc" />
          </linearGradient>
          <linearGradient id={`${id}-stage`} x1="0" y1="0" x2="0" y2="1">
            <stop stopColor="#4e286c" />
            <stop offset="1" stopColor="#291a49" />
          </linearGradient>
          <linearGradient id={`${id}-wood`} x1="0" y1="0" x2="1" y2="1">
            <stop stopColor="#754b76" />
            <stop offset="1" stopColor="#3a235c" />
          </linearGradient>
          <radialGradient id={`${id}-sun`}>
            <stop stopColor="#fff2b8" stopOpacity=".9" />
            <stop offset="1" stopColor="#ffc8aa" stopOpacity="0" />
          </radialGradient>
          <filter
            id={`${id}-glow`}
            x="-80%"
            y="-80%"
            width="260%"
            height="260%"
          >
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id={`${id}-soft`}>
            <feGaussianBlur stdDeviation="12" />
          </filter>
          <clipPath id={`${id}-frame`}>
            <rect x="0" y="0" width="900" height="510" rx="20" />
          </clipPath>
        </defs>
        <g clipPath={`url(#${id}-frame)`}>
          <rect width="900" height="510" fill={`url(#${id}-sky)`} />
          <circle
            cx="715"
            cy="142"
            r="125"
            fill={`url(#${id}-sun)`}
            opacity={skyGlow}
            className="gig-sky-glow"
          />
          <circle cx="715" cy="142" r="30" fill="#fff0c6" opacity=".75" />
          <path
            d="M0 220 Q100 160 205 222 T405 204 T610 219 T900 185 V300 H0Z"
            fill="#9981ba"
            opacity=".55"
          />
          <path
            d="M0 252 Q130 194 250 252 T500 235 T720 249 T900 214 V320 H0Z"
            fill="#76639d"
            opacity=".7"
          />
          <path
            d="M0 300 Q130 252 250 296 T500 277 T730 295 T900 266 V370 H0Z"
            fill="#5b4d85"
          />
          <path
            d="M0 318 Q155 285 310 323 T620 311 T900 302 V396 H0Z"
            fill="#493c70"
          />
          <g className="gig-skyline" fill="#3e335f" opacity=".82">
            <path d="M48 300v-34h8v-12h12v46h20v-22h13v22h14v-54h9v54h30v-29h9v29h16v-43h13v43h17v-18h10v18h30v-36h9v36h22v-19h11v19h22v-62h10v62h19v-28h9v28h25v-48h10v48h26v-32h12v32h26v-52h11v52h22v-22h9v22h30v-36h12v36h24v-51h9v51h24v-22h13v22h18v-39h10v39h28v-25h13v25h22v-47h10v47h28v-33h10v33h32v-29h11v29h25v-42h10v42h18v-26h14v26h24v-51h10v51h32v-20h9v20h28v-34h12v34h20v-25h11v25h30v-32h11v32Z" />
          </g>
          <g className="gig-bunting" stroke="#3a255b" strokeWidth="3">
            <path d="M44 79 Q450 174 856 79" fill="none" />
            <path
              d="M80 94 L98 121 L116 102 M140 109 L158 138 L178 116 M205 122 L222 151 L244 128 M272 137 L291 163 L311 141 M342 148 L360 177 L381 151 M412 157 L430 186 L450 158 M482 157 L500 186 L520 152 M554 148 L573 177 L593 145 M625 137 L644 164 L663 130 M696 121 L716 149 L735 112 M766 104 L784 132 L804 92"
              fill="none"
            />
            <path d="M80 94 L98 121 L116 102Z" fill="#f7a6a0" />
            <path d="M140 109 L158 138 L178 116Z" fill="#d8f477" />
            <path d="M205 122 L222 151 L244 128Z" fill="#f2cb73" />
            <path d="M272 137 L291 163 L311 141Z" fill="#b99ce9" />
            <path d="M342 148 L360 177 L381 151Z" fill="#ed786b" />
            <path d="M412 157 L430 186 L450 158Z" fill="#d8f477" />
            <path d="M482 157 L500 186 L520 152Z" fill="#f7a6a0" />
            <path d="M554 148 L573 177 L593 145Z" fill="#f2cb73" />
            <path d="M625 137 L644 164 L663 130Z" fill="#b99ce9" />
            <path d="M696 121 L716 149 L735 112Z" fill="#ed786b" />
            <path d="M766 104 L784 132 L804 92Z" fill="#d8f477" />
          </g>
          <g className="gig-bulbs" filter={`url(#${id}-glow)`}>
            {[100, 165, 232, 300, 370, 440, 510, 580, 648, 716, 784].map(
              (x, i) => (
                <circle
                  key={x}
                  cx={x}
                  cy={80 + 52 * (1 - Math.abs(x - 450) / 450)}
                  r="5"
                  fill={i % 3 === 0 ? "#f7a6a0" : "#d8f477"}
                  style={{ "--bulb-delay": `${i * 0.18}s` } as CSSProperties}
                />
              ),
            )}
          </g>
          <g className="gig-stage-architecture">
            <path
              d="M194 294 L273 294 L246 390 L218 390Z M706 294 L627 294 L654 390 L682 390Z"
              fill="var(--gig-spotlight)"
              opacity={0.035 + power * 0.08}
              className="gig-spotlight-beam"
            />
            <path d="M94 326 L142 289 H758 L806 326Z" fill="#23163f" />
            <path
              d="M107 325 H793 V390 H107Z"
              fill={`url(#${id}-stage)`}
              stroke="#22163d"
              strokeWidth="3"
            />
            <path
              d="M107 390 L793 390 L817 411 H83Z"
              fill={`url(#${id}-wood)`}
              stroke="#22163d"
              strokeWidth="3"
            />
            <path d="M83 411 H817 V433 H83Z" fill="#291947" />
            <path
              d="M83 433 L817 433 L841 452 H59Z"
              fill="#704774"
              stroke="#27173f"
              strokeWidth="3"
            />
            <path
              d="M60 452 H840"
              stroke="#d8f477"
              strokeWidth="3"
              opacity=".7"
            />
            <path
              d="M130 326 V390 M770 326 V390"
              stroke="#b99ce9"
              strokeWidth="3"
              opacity=".5"
            />
          </g>
          <g className="gig-sign">
            <path
              d="M235 188 Q450 164 665 188 L651 252 Q450 232 249 252Z"
              fill="#f6e4c8"
              stroke="#291947"
              strokeWidth="5"
            />
            <path
              d="M253 205 Q450 184 648 205"
              stroke="#d8f477"
              strokeWidth="6"
              fill="none"
            />
            <text
              x="450"
              y="226"
              textAnchor="middle"
              fill="#4e286c"
              fontSize="28"
              fontWeight="900"
              fontFamily="system-ui, sans-serif"
              letterSpacing="3"
            >
              SAMBA SOCIAL
            </text>
          </g>
          <g className="gig-speakers">
            <path
              d="M110 274 L153 263 L153 366 L110 378Z"
              fill="#21163b"
              stroke="#17132b"
              strokeWidth="3"
            />
            <path
              d="M790 263 L833 274 V378 L790 366Z"
              fill="#21163b"
              stroke="#17132b"
              strokeWidth="3"
            />
            {[288, 319, 349].map((y) => (
              <g key={y}>
                <circle
                  cx="132"
                  cy={y}
                  r="13"
                  fill="#563d75"
                  stroke="#b99ce9"
                  strokeWidth="2"
                />
                <circle
                  cx="812"
                  cy={y}
                  r="13"
                  fill="#563d75"
                  stroke="#b99ce9"
                  strokeWidth="2"
                />
              </g>
            ))}
          </g>
          <g className="gig-performers">
            {performers.map((person, i) => (
              <Person key={person.x} person={person} index={i} />
            ))}
          </g>
          <g className="gig-plants">
            <path
              d="M55 404h62l-8 37H63Z"
              fill="#f2cb73"
              stroke="#291947"
              strokeWidth="2"
            />
            <path
              d="M80 404 Q67 370 43 361 M85 404 Q95 361 122 351 M80 404 Q80 362 80 342"
              stroke="#47705a"
              strokeWidth="8"
              fill="none"
              strokeLinecap="round"
            />
            <path
              d="M783 404h62l-8 37h-46Z"
              fill="#f2cb73"
              stroke="#291947"
              strokeWidth="2"
            />
            <path
              d="M810 404 Q798 370 773 359 M815 404 Q826 362 851 351 M810 404 Q811 361 810 341"
              stroke="#47705a"
              strokeWidth="8"
              fill="none"
              strokeLinecap="round"
            />
          </g>
          <g className="gig-crowd">
            {crowd.map((p, i) => (
              <g key={`${p.x}-${p.y}`} transform={`translate(${p.x} ${p.y})`}>
                <g
                  className="gig-crowd-person"
                  style={{ "--crowd-delay": p.delay } as CSSProperties}
                >
                  <ellipse
                    cx="0"
                    cy="18"
                    rx={p.r + 4}
                    ry="4"
                    fill="#2a1b47"
                    opacity=".3"
                  />
                  <path
                    d={`M-${p.r} 8 Q0 ${3 - (i % 3) * 2} ${p.r} 8 L${p.r + 2} 25 H-${p.r + 2}Z`}
                    fill={p.shirt}
                  />
                  <circle cy="0" r={p.r} fill={p.skin} />
                  <path
                    d={`M-${p.r} 0 Q0 -${p.r + 4} ${p.r} 0`}
                    stroke="#2b1b40"
                    strokeWidth="3"
                    fill="none"
                  />
                  <path
                    className="gig-crowd-arm"
                    d={`M-${p.r} 10 L-${p.r + 7} -${8 + (i % 3) * 3}`}
                    stroke={p.skin}
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                  <path
                    className="gig-crowd-arm gig-crowd-arm--right"
                    d={`M${p.r} 10 L${p.r + 7} -${5 + (i % 4) * 4}`}
                    stroke={p.skin}
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                </g>
              </g>
            ))}
          </g>
          <g className="gig-confetti">
            <path
              d="M173 383l8-13 4 17M265 409l14-5-4 17M629 380l4-17 9 13M735 405l15 3-11 12M408 399l-4-15 14 8M519 379l11 5-13 11"
              stroke="#d8f477"
              strokeWidth="4"
              fill="none"
              strokeLinecap="round"
            />
            <text x="144" y="371" fill="#f7a6a0" fontSize="18">
              ♪
            </text>
            <text x="753" y="365" fill="#f6e4c8" fontSize="24">
              ♫
            </text>
            <text x="343" y="374" fill="#d8f477" fontSize="16">
              •
            </text>
            <text x="582" y="395" fill="#f7a6a0" fontSize="20">
              ✦
            </text>
          </g>
          <rect
            width="900"
            height="510"
            fill="#d8f477"
            opacity={power * 0.035}
            pointerEvents="none"
          />
        </g>
      </svg>
    </div>
  );
}
