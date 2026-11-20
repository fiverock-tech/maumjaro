"use client";

import { useState } from "react";
import type { ActionStatus, AppState } from "@/lib/types";
import {
  DAY_NAMES,
  MAINTAIN_BAND_KG,
  PEN_WEEKS,
  checkedThisWeek,
  completedPens,
  confirmedSaved,
  daysUntilCheckinDay,
  pensAtGraduation,
  postGraduationSaved,
  fromLocalDate,
  hasUnseenPen,
  lastWeight,
  latestWeight,
  localDate,
  progress,
  stampsInCurrentPen,
  totalSaved,
  virtualSaved,
  weekIndex,
  weekWeight,
} from "@/lib/rules";
import { kg, ordinal, parseDecimal, won } from "@/lib/format";
import { needsHomeScreenHint } from "@/lib/storage";
import { Card, CheckIcon, Choice, Field, H2, Help, PrimaryButton, Screen, Stat, TopBar } from "./ui";
import WeightChart from "./WeightChart";

function md(s: string) {
  const d = fromLocalDate(s);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

const STATUS_LABEL: Record<ActionStatus, string> = {
  done: "해냈어요",
  partial: "조금 했어요",
  missed: "못 했어요",
};

export default function Home({
  state,
  now,
  onSaveWeight,
  onCheckin,
  onOpenSettings,
  onOpenPen,
  onOpenGraduation,
  onTestAdvance,
}: {
  state: AppState;
  now: Date;
  onSaveWeight: (weight: number) => void;
  onCheckin: (status: ActionStatus) => void;
  onOpenSettings: () => void;
  onOpenPen: (pen: number) => void;
  onOpenGraduation: () => void;
  onTestAdvance: (days: number) => void;
}) {
  const profile = state.profile!;
  const today = localDate(now);
  const todayEntry = state.weights.find((w) => w.date === today) ?? null;
  const [weight, setWeight] = useState("");
  const [editing, setEditing] = useState(!todayEntry);
  const [status, setStatus] = useState<ActionStatus>("done");
  const [showHint] = useState(() => needsHomeScreenHint());

  const week = weekIndex(profile.startedAt, now);
  const checked = checkedThisWeek(state, now);
  const open = !checked;
  const ww = weekWeight(state, now);
  const latest = latestWeight(state, now);
  const daysSinceLatest = latest ? Math.round((fromLocalDate(today).getTime() - fromLocalDate(latest.date).getTime()) / 86400000) : null;
  const stamps = stampsInCurrentPen(state);
  const pens = completedPens(state);
  const currentPen = pens + 1;
  const prog = progress(profile, state.checkins);
  const last = lastWeight(state) ?? profile.startWeight;
  const isDay = now.getDay() === profile.checkinDay;
  const daysLeft = daysUntilCheckinDay(profile.checkinDay, now) || 7;
  const recent = state.checkins.slice(state.checkins.length - stamps);

  const w = parseDecimal(weight);
  const weightOk = w >= 30 && w <= 300;
  const saveWeight = () => {
    if (!weightOk) return;
    onSaveWeight(Math.round(w * 10) / 10);
    setWeight("");
    setEditing(false);
  };

  const title = checked ? "이번 주 마음 주사 완료" : isDay ? "오늘은 마음 주사의 날" : "이번 주 마음 주사를 맞아요";

  return (
    <Screen>
      <TopBar
        right={
          <>
            <span>
              {week + 1}주차 · {DAY_NAMES[now.getDay()]}요일
            </span>
            <button
              type="button"
              onClick={onOpenSettings}
              aria-label="설정"
              className="-mr-2 flex h-11 w-11 items-center justify-center rounded-xl text-sub"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </button>
          </>
        }
      />

      {state.testMode && (
        <div className="flex items-center justify-between gap-2 rounded-xl border border-dashed border-coral-line bg-coral-bg px-3 py-2 text-xs text-coral-text">
          <span>
            테스트 날짜 {md(today)}({DAY_NAMES[now.getDay()]}) · +{state.testDayOffset || 0}일
          </span>
          <span className="flex gap-1.5">
            <button type="button" onClick={() => onTestAdvance(1)} className="min-h-8 rounded-lg bg-white px-2.5 font-semibold">
              +1일
            </button>
            <button type="button" onClick={() => onTestAdvance(7)} className="min-h-8 rounded-lg bg-white px-2.5 font-semibold">
              +7일
            </button>
          </span>
        </div>
      )}

      {showHint && (
        <Card tone="teal" className="gap-1.5">
          <div className="text-sm font-semibold text-teal">홈 화면에 추가해 주세요</div>
          <p className="m-0 text-[13px] leading-relaxed text-sub">
            사파리 아래쪽 공유 버튼 → &lsquo;홈 화면에 추가&rsquo;. 홈 화면에서 열어야 기록이 안전하게 보관돼요.
          </p>
        </Card>
      )}

      {hasUnseenPen(state) && (
        <Card tone="solid" className="gap-2">
          <div className="text-base font-bold">{ordinal(state.penCardsSeen + 1)} 마음 펜이 완성됐어요</div>
          <button
            type="button"
            onClick={() => onOpenPen(state.penCardsSeen + 1)}
            className="h-11 rounded-xl bg-white text-[15px] font-semibold text-teal"
          >
            성취 카드 보기
          </button>
        </Card>
      )}

      {prog.phase === "graduated" && !state.graduationSeen && (
        <Card tone="solid" className="gap-2">
          <div className="text-[13px] font-semibold opacity-90">목표 체중 + {profile.maintainWeeks}주 유지 달성</div>
          <div className="text-xl font-bold">졸업했어요!</div>
          <button
            type="button"
            onClick={onOpenGraduation}
            className="h-11 rounded-xl bg-white text-[15px] font-semibold text-teal"
          >
            졸업 카드 보기
          </button>
        </Card>
      )}

      {prog.phase === "graduated" && state.graduationSeen && (
        <Card tone="teal" className="gap-1">
          <div className="text-[15px] font-bold text-teal">
            유지 시즌 · {prog.outOfBand ? "범위를 조금 벗어났어요" : `범위 안 ${prog.maintainCount}주 연속`}
          </div>
          <p className="m-0 text-[13px] leading-relaxed text-sub">
            {prog.outOfBand
              ? `이번엔 ${kg(profile.goalWeight + MAINTAIN_BAND_KG)}보다 높았어요. 다음 주에 다시 돌아오면 돼요.`
              : `${kg(profile.goalWeight + MAINTAIN_BAND_KG)} 이하를 지키고 있어요. 확정 금액 ${won(confirmedSaved(state) ?? 0)}은 그대로예요.`}
          </p>
          <button type="button" onClick={onOpenGraduation} className="mt-1 h-10 w-fit text-[13px] text-teal underline underline-offset-2">
            졸업 카드 다시 보기
          </button>
        </Card>
      )}

      <h1 className="m-0 px-1 text-2xl font-bold leading-snug">{title}</h1>

      <Card className="gap-3">
        <div className="flex items-baseline justify-between">
          <H2>오늘 체중</H2>
          {latest && (
            <div className="text-[13px] text-muted">
              현재 {kg(latest.weight)}
              {daysSinceLatest ? ` · ${daysSinceLatest}일 전 기록` : ""}
            </div>
          )}
        </div>
        {todayEntry && !editing ? (
          <div className="flex items-center justify-between gap-3">
            <div className="text-[15px]">
              오늘 <span className="text-lg font-bold">{kg(todayEntry.weight)}</span> 기록했어요
            </div>
            <button type="button" onClick={() => setEditing(true)} className="h-10 rounded-xl border border-line px-3.5 text-sm text-sub">
              수정
            </button>
          </div>
        ) : (
          <div className="flex items-end gap-2">
            <div className="min-w-0 flex-1">
              <Field
                id="weight"
                label="체중 (kg)"
                value={weight}
                onChange={setWeight}
                unit="kg"
                inputMode="decimal"
                placeholder={(todayEntry?.weight ?? last).toFixed(1)}
              />
            </div>
            <button
              type="button"
              onClick={saveWeight}
              disabled={!weightOk}
              className="h-12 rounded-xl bg-teal px-5 text-[15px] font-semibold text-white disabled:opacity-40"
            >
              기록
            </button>
          </div>
        )}
        <Help>매일 기록해도 되고, 일주일에 한 번만 해도 돼요. 마음 주사에는 그 주의 마지막 기록이 들어가요.</Help>
      </Card>

      <Card className="gap-3.5">
        <div className="flex items-baseline justify-between">
          <H2>{ordinal(currentPen)} 마음 펜</H2>
          <div className="text-[13px] text-muted">
            {open ? `오늘 체크인하면 ${stamps + 1}/${PEN_WEEKS}` : `${stamps}/${PEN_WEEKS} 채웠어요`}
          </div>
        </div>
        <ol className="m-0 grid list-none grid-cols-4 gap-2 p-0 text-center" aria-label="이번 펜 스탬프">
          {Array.from({ length: PEN_WEEKS }).map((_, i) => {
            const c = recent[i];
            const isNext = !c && i === stamps && open;
            return (
              <li key={i} className="flex flex-col items-center gap-1.5">
                {c ? (
                  <div className="flex h-[52px] w-[52px] items-center justify-center rounded-full bg-teal" aria-label="완료">
                    <CheckIcon />
                  </div>
                ) : isNext ? (
                  <div className="flex h-[52px] w-[52px] items-center justify-center rounded-full border-2 border-dashed border-teal bg-teal-bg text-[13px] font-semibold text-teal">
                    {isDay ? "오늘" : "이번 주"}
                  </div>
                ) : (
                  <div className="h-[52px] w-[52px] rounded-full border border-line bg-white" aria-label="비어 있음" />
                )}
                <div className={`text-xs ${isNext ? "font-semibold text-teal" : "text-muted"}`}>
                  {c ? `${c.week + 1}주` : `${(open ? week : week + 1) + (i - stamps) + 1}주`}
                </div>
              </li>
            );
          })}
        </ol>
      </Card>

      {open ? (
        <Card className="gap-4">
          <div className="flex items-baseline justify-between gap-3">
            <div className="text-[13px] font-semibold text-sub">이번 주 체중</div>
            {ww ? (
              <div className="text-right">
                <span className="text-lg font-bold">{kg(ww.weight)}</span>
                <span className="ml-1.5 text-xs text-muted">{md(ww.date)} 기록</span>
              </div>
            ) : (
              <div className="text-[13px] font-semibold text-coral-text">아직 없어요</div>
            )}
          </div>
          {!ww && <Help tone="warn">이번 주 체중을 위에서 한 번 기록하면 마음 주사를 맞을 수 있어요.</Help>}
          <div className="flex flex-col gap-2">
            <div className="text-[15px] font-semibold leading-snug">이번 주 &lsquo;{profile.action}&rsquo;, 해냈나요?</div>
            <div role="group" aria-label="실천 여부" className="grid grid-cols-3 gap-2">
              {(Object.keys(STATUS_LABEL) as ActionStatus[]).map((st) => (
                <Choice key={st} selected={status === st} onClick={() => setStatus(st)}>
                  <span className="text-sm">{STATUS_LABEL[st]}</span>
                </Choice>
              ))}
            </div>
          </div>
          <PrimaryButton disabled={!ww} onClick={() => onCheckin(status)}>
            마음 주사 맞기
          </PrimaryButton>
        </Card>
      ) : (
        <Card className="gap-1">
          <div className="text-[15px] font-semibold">
            다음 마음 주사: {DAY_NAMES[profile.checkinDay]}요일{daysLeft < 7 ? ` (${daysLeft}일 뒤)` : ""}
          </div>
          <Help>이번 주 실천 행동: {profile.action}. 체중은 매일 기록해도 돼요.</Help>
        </Card>
      )}

      <Card className="gap-3">
        <H2>체중 흐름</H2>
        <WeightChart weights={state.weights} goal={profile.goalWeight} today={today} />
      </Card>

      {prog.phase === "maintaining" && (
        <Card tone="teal" className="gap-1">
          <div className="text-[15px] font-bold text-teal">
            유지 모드 · {prog.maintainCount}/{profile.maintainWeeks}주
          </div>
          <p className="m-0 text-[13px] leading-relaxed text-sub">
            {prog.outOfBand
              ? `이번엔 유지 범위(${kg(profile.goalWeight + MAINTAIN_BAND_KG)} 이하)를 벗어났어요. 벌칙 없이 다시 세요.`
              : `${kg(profile.goalWeight + MAINTAIN_BAND_KG)} 이하로 지키면 한 주씩 쌓여요.`}
          </p>
        </Card>
      )}

      <section className="grid grid-cols-3 gap-2">
        {prog.phase === "graduated" ? (
          <Stat label="확정 절약액" value={won(confirmedSaved(state) ?? 0)} sub={`마음 ${pensAtGraduation(state) ?? 0}펜`} tone="teal" />
        ) : (
          <Stat label="가상 절약액" value={won(virtualSaved(state))} sub={`마음 ${pens}펜`} tone="teal" />
        )}
        <Stat label="실제 모은 돈" value={won(totalSaved(state.savings))} sub="직접 기록" tone="coral" />
        {prog.phase === "losing" && (
          <Stat label="졸업까지" value={kg(Math.max(0, last - profile.goalWeight))} sub={`+ ${profile.maintainWeeks}주 유지`} />
        )}
        {prog.phase === "maintaining" && (
          <Stat label="졸업까지" value={`${profile.maintainWeeks - prog.maintainCount}주`} sub="유지 남음" />
        )}
        {prog.phase === "graduated" && (
          <Stat
            label="졸업 후 유지"
            value={won(postGraduationSaved(state))}
            sub={`${pens - (pensAtGraduation(state) ?? pens)}펜 더 채움`}
            tone="teal"
          />
        )}
      </section>

      {pens > 0 && (
        <button type="button" onClick={() => onOpenPen(pens)} className="h-11 text-sm text-teal underline underline-offset-2">
          지난 펜 카드와 쓸 곳 보기
        </button>
      )}
    </Screen>
  );
}
