"use client";

import { useMemo, useRef, useState } from "react";
import type { DailyWeight } from "@/lib/types";
import { addDays, fromLocalDate, movingAverage } from "@/lib/rules";
import { kg } from "@/lib/format";

const W = 340;
const H = 190;
const PAD = { l: 34, r: 12, t: 12, b: 24 };
const TEAL = "#0F766E";
const DOT = "#6FB3AB";
const GRID = "#E8EBEE";
const AXIS = "#5B6672";

function md(s: string) {
  const d = fromLocalDate(s);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function dayDiff(a: string, b: string) {
  return Math.round((fromLocalDate(b).getTime() - fromLocalDate(a).getTime()) / 86400000);
}

/** 일별 체중: 실제 입력한 날은 점, 7일 평균은 선, 목표는 점선 */
export default function WeightChart({
  weights,
  goal,
  today,
}: {
  weights: DailyWeight[];
  goal: number;
  today: string;
}) {
  const [range, setRange] = useState<"4w" | "all">("4w");
  const [hover, setHover] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const past = useMemo(() => weights.filter((w) => w.date <= today), [weights, today]);
  const from = useMemo(() => {
    // 기록이 시작된 날부터 그리되, 최소 7일 폭은 확보. '4주'는 최근 28일까지만
    const first = past.length ? past[0].date : today;
    const minStart = addDays(today, -6);
    const start = first < minStart ? first : minStart;
    const fourWeeks = addDays(today, -27);
    return range === "4w" && start < fourWeeks ? fourWeeks : start;
  }, [range, past, today]);

  const pts = past.filter((w) => w.date >= from);
  const ma = movingAverage(past).filter((m) => m.date >= from);
  const span = Math.max(1, dayDiff(from, today));

  if (pts.length < 2) {
    return (
      <p className="m-0 rounded-xl bg-ground px-4 py-6 text-center text-[13px] leading-relaxed text-muted">
        체중을 이틀 이상 기록하면 그래프가 그려져요.
      </p>
    );
  }

  const vals = [...pts.map((p) => p.weight), ...ma.map((m) => m.avg), goal];
  const lo = Math.floor((Math.min(...vals) - 0.3) * 2) / 2;
  const hi = Math.ceil((Math.max(...vals) + 0.3) * 2) / 2;
  const plotW = W - PAD.l - PAD.r;
  const plotH = H - PAD.t - PAD.b;
  const x = (d: string) => PAD.l + (dayDiff(from, d) / span) * plotW;
  const y = (v: number) => PAD.t + (1 - (v - lo) / (hi - lo || 1)) * plotH;
  const ticks = [lo, Math.round(((lo + hi) / 2) * 2) / 2, hi].filter((v, i, a) => a.indexOf(v) === i);
  const linePath = ma.map((m, i) => `${i ? "L" : "M"}${x(m.date).toFixed(1)} ${y(m.avg).toFixed(1)}`).join("");
  const midDate = addDays(from, Math.round(span / 2));

  const hp = hover ? pts.find((p) => p.date === hover) : null;
  const hm = hover ? ma.find((m) => m.date === hover) : null;

  const onMove = (clientX: number) => {
    const svg = svgRef.current;
    if (!svg) return;
    const r = svg.getBoundingClientRect();
    const vx = ((clientX - r.left) / r.width) * W;
    let best = pts[0];
    for (const p of pts) if (Math.abs(x(p.date) - vx) < Math.abs(x(best.date) - vx)) best = p;
    setHover(best.date);
  };

  const last = pts[pts.length - 1];
  const lastMa = ma[ma.length - 1];
  const label = `최근 체중 그래프. 마지막 기록 ${md(last.date)} ${kg(last.weight)}, 7일 평균 ${kg(lastMa.avg)}, 목표 ${kg(goal)}.`;

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-xs text-sub">
          <span className="flex items-center gap-1.5">
            <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full" style={{ background: DOT }} />
            기록한 날
          </span>
          <span className="flex items-center gap-1.5">
            <span aria-hidden="true" className="h-0.5 w-4 rounded" style={{ background: TEAL }} />
            7일 평균
          </span>
          <span className="flex items-center gap-1.5">
            <span aria-hidden="true" className="w-4 border-t-2 border-dashed" style={{ borderColor: AXIS }} />
            목표
          </span>
        </div>
        <div role="group" aria-label="기간" className="flex rounded-lg bg-ground p-0.5 text-xs">
          {(["4w", "all"] as const).map((r) => (
            <button
              key={r}
              type="button"
              aria-pressed={range === r}
              onClick={() => setRange(r)}
              className={`min-h-8 rounded-md px-2.5 ${range === r ? "bg-white font-semibold text-ink shadow-sm" : "text-muted"}`}
            >
              {r === "4w" ? "4주" : "전체"}
            </button>
          ))}
        </div>
      </div>

      <div className="relative">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          className="block h-auto w-full touch-pan-y select-none"
          role="img"
          aria-label={label}
          onPointerMove={(e) => onMove(e.clientX)}
          onPointerDown={(e) => onMove(e.clientX)}
          onPointerLeave={() => setHover(null)}
        >
          {ticks.map((t) => (
            <g key={t}>
              <line x1={PAD.l} x2={W - PAD.r} y1={y(t)} y2={y(t)} stroke={GRID} strokeWidth="1" />
              <text x={PAD.l - 6} y={y(t) + 3.5} textAnchor="end" fontSize="10" fill={AXIS}>
                {t.toFixed(1)}
              </text>
            </g>
          ))}
          <line x1={PAD.l} x2={W - PAD.r} y1={y(goal)} y2={y(goal)} stroke={AXIS} strokeWidth="1.25" strokeDasharray="4 4" />
          <text x={W - PAD.r} y={y(goal) - 4} textAnchor="end" fontSize="10" fill={AXIS}>
            목표 {goal.toFixed(1)}
          </text>

          {pts.map((p) => (
            <circle
              key={p.date}
              cx={x(p.date)}
              cy={y(p.weight)}
              r={p.date === hover ? 5 : 3.5}
              fill={DOT}
              stroke="#FFFFFF"
              strokeWidth="1.5"
            />
          ))}
          <path d={linePath} fill="none" stroke={TEAL} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />

          {hover && (
            <line x1={x(hover)} x2={x(hover)} y1={PAD.t} y2={H - PAD.b} stroke={AXIS} strokeOpacity="0.35" strokeWidth="1" />
          )}

          {[from, midDate, today].map((d, i) => (
            <text
              key={d + i}
              x={x(d)}
              y={H - 6}
              textAnchor={i === 0 ? "start" : i === 2 ? "end" : "middle"}
              fontSize="10"
              fill={AXIS}
            >
              {md(d)}
            </text>
          ))}
        </svg>

        {hp && (
          <div
            role="status"
            className="pointer-events-none absolute top-0 whitespace-nowrap rounded-lg bg-ink px-2.5 py-1.5 text-xs leading-snug text-white shadow"
            style={{
              left: `${Math.min(Math.max((x(hp.date) / W) * 100, 18), 82)}%`,
              transform: "translateX(-50%)",
            }}
          >
            <div className="font-semibold">
              {md(hp.date)} · {kg(hp.weight)}
            </div>
            {hm && <div className="opacity-80">7일 평균 {kg(hm.avg)}</div>}
          </div>
        )}
      </div>

      <details className="text-[13px] text-sub">
        <summary className="min-h-8 cursor-pointer py-1 text-muted">기록 표로 보기</summary>
        <table className="mt-1 w-full border-collapse text-left">
          <thead>
            <tr className="text-xs text-muted">
              <th className="py-1 font-normal">날짜</th>
              <th className="py-1 text-right font-normal">체중</th>
              <th className="py-1 text-right font-normal">7일 평균</th>
            </tr>
          </thead>
          <tbody>
            {[...pts].reverse().map((p) => (
              <tr key={p.date} className="border-t border-rule">
                <td className="py-1.5">{md(p.date)}</td>
                <td className="py-1.5 text-right">{kg(p.weight)}</td>
                <td className="py-1.5 text-right text-muted">{kg(ma.find((m) => m.date === p.date)?.avg ?? p.weight)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}
