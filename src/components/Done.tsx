"use client";

import type { AppState } from "@/lib/types";
import {
  DAY_NAMES,
  PEN_WEEKS,
  actionStreak,
  hasUnseenPen,
  isFastLoss,
  progress,
  stampsInCurrentPen,
  MAINTAIN_BAND_KG,
  confirmedSaved,
} from "@/lib/rules";
import { kg, ordinal, won } from "@/lib/format";
import { Card, CheckIcon, H2, PrimaryButton, Screen, TopBar } from "./ui";

export default function Done({
  state,
  onHome,
  onOpenPen,
  onOpenGraduation,
}: {
  state: AppState;
  onHome: () => void;
  onOpenPen: (pen: number) => void;
  onOpenGraduation: () => void;
}) {
  const profile = state.profile!;
  const cs = state.checkins;
  const c = cs[cs.length - 1];
  if (!c) return null;

  const prevWeight = cs.length >= 2 ? cs[cs.length - 2].weight : profile.startWeight;
  const delta = Math.round((c.weight - prevWeight) * 10) / 10;
  const stamps = stampsInCurrentPen(state);
  const penDone = stamps === 0 && hasUnseenPen(state);
  const penNo = penDone ? state.penCardsSeen + 1 : Math.floor(cs.length / PEN_WEEKS) + 1;
  const stampNo = penDone ? PEN_WEEKS : stamps;

  const before = progress(profile, cs.slice(0, -1));
  const after = progress(profile, cs);
  const justGraduated = before.phase !== "graduated" && after.phase === "graduated";
  const justReached = before.phase === "losing" && after.phase !== "losing";
  const streak = actionStreak(cs);
  const fast = isFastLoss(cs, profile);

  const weightLine =
    delta < 0
      ? `지난 기록보다 ${Math.abs(delta).toFixed(1)}kg 가벼워요`
      : delta > 0
        ? "이번 주는 체중이 조금 늘었어요. 스탬프는 그대로예요."
        : "지난 기록과 같아요.";

  const actionTitle =
    c.status === "done"
      ? streak >= 2
        ? `${c.action} ${streak}주째, 잘 이어가고 있어요`
        : `${c.action}, 해냈어요`
      : c.status === "partial"
        ? "조금이라도 한 게 중요해요"
        : "기록한 것만으로도 스탬프예요";
  const actionBody =
    c.status === "missed"
      ? `다음 주엔 '${c.action}', 한 번만 해봐요.`
      : "체중은 매주 오르내려요. 기록하고 실천한 것만으로 이번 주는 성공이에요.";

  const statusText = c.status === "done" ? "해냈어요" : c.status === "partial" ? "조금 했어요" : "못 했어요";

  return (
    <Screen>
      <TopBar right={`${c.week + 1}주차 · ${DAY_NAMES[new Date(c.at).getDay()]}요일`} />

      <div className="flex flex-col items-center gap-3 pb-2 pt-6 text-center">
        <div className="animate-pop flex h-24 w-24 items-center justify-center rounded-full bg-teal-bg">
          <div className="flex h-[68px] w-[68px] items-center justify-center rounded-full bg-teal">
            <CheckIcon size={34} />
          </div>
        </div>
        <h1 className="m-0 text-[26px] font-bold leading-snug">마음 주사 투여 완료</h1>
        <p className="m-0 text-[15px] text-sub" aria-live="polite">
          이번 주 스탬프 +1 · {ordinal(penNo)} 마음 펜 {stampNo}/{PEN_WEEKS}
        </p>
      </div>

      {justGraduated && (
        <Card tone="solid" className="gap-1.5">
          <div className="text-xl font-bold">졸업했어요!</div>
          <p className="m-0 text-sm leading-relaxed">
            목표 체중을 {profile.maintainWeeks}주 동안 지켰어요. 가상 절약액 {won(confirmedSaved(state) ?? 0)}이 확정됐어요.
          </p>
        </Card>
      )}
      {!justGraduated && justReached && (
        <Card tone="solid" className="gap-1.5">
          <div className="text-xl font-bold">목표 체중에 닿았어요</div>
          <p className="m-0 text-sm leading-relaxed">
            이제 유지 모드예요. {profile.maintainWeeks}주 동안 지키면 졸업이에요.
          </p>
        </Card>
      )}

      <Card className="gap-3.5">
        <H2>이번 주 기록</H2>
        <div className="flex items-baseline justify-between gap-3">
          <div className="text-sm text-muted">체중</div>
          <div className="text-right">
            <div className="text-base font-semibold">{kg(c.weight)}</div>
            <div className="text-xs text-muted">{weightLine}</div>
          </div>
        </div>
        <div className="h-px bg-rule" />
        <div className="flex items-baseline justify-between gap-3">
          <div className="text-sm text-muted">실천 행동</div>
          <div className="text-right">
            <div className="text-base font-semibold">{c.action}</div>
            <div className={`text-xs font-semibold ${c.status === "done" ? "text-teal" : "text-muted"}`}>{statusText}</div>
          </div>
        </div>
      </Card>

      {before.phase === "graduated" && (
        <Card tone={after.outOfBand ? "coral" : "teal"} className="gap-1">
          <div className={`text-[15px] font-bold ${after.outOfBand ? "text-coral-text" : "text-teal"}`}>
            {after.outOfBand ? "유지 범위를 조금 벗어났어요" : `유지 범위 안 · ${after.maintainCount}주 연속`}
          </div>
          <p className="m-0 text-sm leading-relaxed">
            {after.outOfBand
              ? `이번 주는 ${kg(profile.goalWeight + MAINTAIN_BAND_KG)}보다 높아요. 벌칙은 없어요. 다음 주에 다시 돌아오면 돼요.`
              : `${kg(profile.goalWeight + MAINTAIN_BAND_KG)} 이하를 지키고 있어요.`}
          </p>
        </Card>
      )}

      <Card tone="teal" className="gap-1.5">
        <div className="text-[15px] font-bold text-teal">{actionTitle}</div>
        <p className="m-0 text-sm leading-relaxed">{actionBody}</p>
      </Card>

      {fast && (
        <Card tone="coral" className="gap-1.5">
          <div className="text-[15px] font-bold text-coral-text">속도는 천천히</div>
          <p className="m-0 text-sm leading-relaxed">
            한 주에 1.5kg 넘게 줄었어요. 무리하지 않는 속도가 오래 가요. 몸 상태가 걱정되면 의료진과 상의해 주세요.
          </p>
        </Card>
      )}

      {!penDone && (
        <div className="flex flex-col gap-1 px-1">
          <div className="text-sm font-semibold">다음 마음 주사: 다음 주 {DAY_NAMES[profile.checkinDay]}요일</div>
          <div className="text-[13px] text-muted">
            {PEN_WEEKS - stamps}번 더 하면 {ordinal(penNo)} 마음 펜 완성이에요.
          </div>
        </div>
      )}

      <div className="mt-auto flex flex-col gap-2.5">
        {justGraduated ? (
          <PrimaryButton onClick={onOpenGraduation}>졸업 카드 보기</PrimaryButton>
        ) : penDone ? (
          <PrimaryButton onClick={() => onOpenPen(penNo)}>{ordinal(penNo)} 마음 펜 완성! 카드 보기</PrimaryButton>
        ) : (
          <PrimaryButton onClick={onHome}>홈으로</PrimaryButton>
        )}
      </div>
    </Screen>
  );
}
