"use client";

import { useState } from "react";
import type { Bucket } from "@/lib/types";
import { MAX_BUCKETS, newId, pensToTarget, sumPercent } from "@/lib/rules";
import { formatMoneyInput, parseMoney, won } from "@/lib/format";

interface Row {
  id: string;
  name: string;
  percent: string;
  target: string;
}

function toRows(buckets: Bucket[]): Row[] {
  return buckets.map((b) => ({
    id: b.id,
    name: b.name,
    percent: String(b.percent),
    target: b.target ? b.target.toLocaleString("ko-KR") : "",
  }));
}

function toBuckets(rows: Row[]): Bucket[] {
  return rows.map((r) => {
    const p = parseInt(r.percent.replace(/[^0-9]/g, ""), 10);
    const t = parseMoney(r.target);
    return { id: r.id, name: r.name, percent: Number.isFinite(p) ? p : 0, ...(t ? { target: t } : {}) };
  });
}

/** 아낀 돈 쓸 곳 편집. 최대 3개, 합계 100% 이하 */
export default function BucketEditor({
  initial,
  penCost,
  onChange,
}: {
  initial: Bucket[];
  penCost: number;
  onChange: (buckets: Bucket[]) => void;
}) {
  const [rows, setRows] = useState<Row[]>(() => toRows(initial));

  const update = (next: Row[]) => {
    setRows(next);
    onChange(toBuckets(next));
  };

  const buckets = toBuckets(rows);
  const total = sumPercent(buckets);
  const over = total > 100;

  return (
    <div className="flex flex-col gap-3">
      {rows.map((r, i) => {
        const b = buckets[i];
        const pens = pensToTarget(b, penCost);
        return (
          <div key={r.id} className="flex flex-col gap-2 rounded-xl border border-line p-3">
            <div className="flex items-end gap-2">
              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <label htmlFor={`bn-${r.id}`} className="text-[13px] font-semibold text-sub">
                  쓸 곳 {i + 1}
                </label>
                <input
                  id={`bn-${r.id}`}
                  value={r.name}
                  placeholder="예: 제주 가족여행"
                  onChange={(e) => update(rows.map((x) => (x.id === r.id ? { ...x, name: e.target.value } : x)))}
                  className="h-12 min-w-0 rounded-xl border border-line bg-white px-3.5 text-base outline-none focus:border-teal"
                />
              </div>
              <div className="flex w-[92px] flex-col gap-1.5">
                <label htmlFor={`bp-${r.id}`} className="text-[13px] font-semibold text-sub">
                  비율
                </label>
                <div className="flex h-12 items-center gap-1 rounded-xl border border-line bg-white px-3 focus-within:border-teal">
                  <input
                    id={`bp-${r.id}`}
                    value={r.percent}
                    inputMode="numeric"
                    onChange={(e) =>
                      update(
                        rows.map((x) =>
                          x.id === r.id ? { ...x, percent: e.target.value.replace(/[^0-9]/g, "").slice(0, 3) } : x
                        )
                      )
                    }
                    className="w-full min-w-0 border-0 bg-transparent text-right text-base outline-none"
                  />
                  <span className="text-sm text-muted">%</span>
                </div>
              </div>
            </div>
            <div className="flex items-end gap-2">
              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <label htmlFor={`bt-${r.id}`} className="text-xs text-muted">
                  목표 금액 (선택)
                </label>
                <div className="flex h-11 items-center gap-1 rounded-xl border border-line bg-white px-3 focus-within:border-teal">
                  <input
                    id={`bt-${r.id}`}
                    value={r.target}
                    inputMode="numeric"
                    placeholder="예: 1,000,000"
                    onChange={(e) =>
                      update(rows.map((x) => (x.id === r.id ? { ...x, target: formatMoneyInput(e.target.value) } : x)))
                    }
                    className="w-full min-w-0 border-0 bg-transparent text-[15px] outline-none placeholder:text-[#8A949E]"
                  />
                  <span className="text-sm text-muted">원</span>
                </div>
              </div>
              {rows.length > 1 && (
                <button
                  type="button"
                  onClick={() => update(rows.filter((x) => x.id !== r.id))}
                  className="h-11 rounded-xl px-3 text-sm text-muted underline underline-offset-2"
                >
                  삭제
                </button>
              )}
            </div>
            {pens !== null && (
              <div className="text-xs text-muted">
                이 비율이면 {won(b.target!)}까지 마음 {pens}펜
              </div>
            )}
          </div>
        );
      })}

      {rows.length < MAX_BUCKETS && (
        <button
          type="button"
          onClick={() => update([...rows, { id: newId(), name: "", percent: String(Math.max(0, 100 - total)), target: "" }])}
          className="min-h-11 rounded-xl border border-dashed border-[#8A949E] bg-white text-sm text-sub"
        >
          + 쓸 곳 추가 (최대 {MAX_BUCKETS}개)
        </button>
      )}

      <div className={`text-[13px] ${over ? "font-semibold text-coral" : "text-sub"}`} aria-live="polite">
        {over
          ? `합계 ${total}% · 100%를 넘을 수 없어요`
          : total === 100
            ? "합계 100% · 모두 정했어요"
            : `합계 ${total}% · ${100 - total}%는 아직 정하지 않음`}
      </div>
    </div>
  );
}
