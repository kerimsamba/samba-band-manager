import { Music2 } from "lucide-react";
import type { ReactNode } from "react";
import type { Member } from "../game/engine";
import { cx } from "../game/format";
export function Avatar({
  member,
  size = "",
}: {
  member: Member;
  size?: string;
}) {
  const index = member.name.charCodeAt(0) % 4;
  return (
    <span
      className={cx("avatar", size)}
      style={{ background: member.color || "#e2d9f4" }}
      aria-label={member.name}
    >
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <path
          d="M7 49c0-13 6-19 17-19s17 6 17 19"
          fill={["#655092", "#b85f48", "#576e52", "#d6a341"][index]}
        />
        <rect x="20" y="27" width="8" height="8" rx="3" fill="#ba815e" />
        <ellipse
          cx="24"
          cy="21"
          rx="11"
          ry="13"
          fill={["#e8ba92", "#ad7654", "#dca480", "#82513b"][index]}
        />
        <path
          d={
            index % 2
              ? "M12 23V15C12 0 39 5 35 23l-4-10-12 3-5 10Z"
              : "M12 18c-4-19 29-17 23 3l-6-10-5 4-9 1-1 10Z"
          }
          fill="#3b303f"
        />
        <circle cx="20" cy="22" r="1.1" fill="#342a34" />
        <circle cx="28" cy="22" r="1.1" fill="#342a34" />
        <path
          d="M21 28q3 3 6-1"
          stroke="#7b493d"
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}
export function Meter({
  value,
  color = "",
}: {
  value: number;
  color?: string;
}) {
  return (
    <span className={cx("meter", color)}>
      <i style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </span>
  );
}
export function Tag({
  children,
  tone = "",
}: {
  children: ReactNode;
  tone?: string;
}) {
  return <span className={cx("tag", tone)}>{children}</span>;
}
export function Empty({ children }: { children: ReactNode }) {
  return (
    <div className="empty">
      <Music2 size={32} />
      <p>{children}</p>
    </div>
  );
}
