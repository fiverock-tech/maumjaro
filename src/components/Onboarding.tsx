"use client";

import { useMemo, useState } from "react";
import type { Bucket, Profile } from "@/lib/types";
import { ACTION_PRESETS, DAY_NAMES, newId, pensToTarget, validateBuckets, validateProfile } from "@/lib/rules";
import { formatMoneyInput, parseDecimal, parseMoney, won } from "@/lib/format";
import { telemetryEnabled } from "@/lib/telemetry";
import BucketEditor from "./BucketEditor";
import { Card, Choice, Disclaimer, Field, H2, Help, PrimaryButton, Screen, TopBar } from "./ui";

export default function Onboarding({ onStart }: { onStart: (p: Profile, consent: boolean) => void }) {
  const [height, setHeight] = useState("");
  const [now, setNow] = useState("");
  const [goal, setGoal] = useState("");
  const [maintain, setMaintain] = useState(8);
  const [cost, setCost] = useState("300,000");
  const [buckets, setBuckets] = useState<Bucket[]>([{ id: newId(), name: "", percent: 100 }]);
  const [action, setAction] = useState(ACTION_PRESETS[1]);
  const [customAction, setCustomAction] = useState("");
  const [useCustom, setUseCustom] = useState(false);
  const [day, setDay] = useState(0);
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const penCost = parseMoney(cost);
  const finalAction = useCustom ? customAction.trim() : action;

  const preview = useMemo(() => {
    const first = buckets.find((b) => b.name.trim() && b.percent > 0);
    const pens = first ? pensToTarget(first, penCost) : null;
    return { first, pens };
  }, [buckets, penCost]);

  const start = () => {
    const h = parseDecimal(height);
    const s = parseDecimal(now);
    const g = parseDecimal(goal);
    const err =
      validateProfile({ heightCm: h, startWeight: s, goalWeight: g }) ||
      (penCost < 1000 ? "4주 비용을 입력해 주세요." : null) ||
      validateBuckets(buckets) ||
      (!finalAction ? "실천 행동을 하나 골라 주세요." : null);
    if (err) {
      setError(err);
      return;
    }
    onStart(
      {
        heightCm: h,
        startWeight: Math.round(s * 10) / 10,
        goalWeight: Math.round(g * 10) / 10,
        maintainWeeks: maintain,
        penCost,
        action: finalAction,
        checkinDay: day,
        buckets: buckets.map((b) => ({ ...b, name: b.name.trim() })),
        startedAt: new Date().toISOString(),
      },
      consent
    );
  };

  return (
    <Screen>
      <TopBar right="목표 설정" />

      <div className="flex flex-col gap-2 px-1">
        <h1 className="m-0 text-[26px] font-bold leading-snug">
          마음으로 맞는 주사,
          <br />
          오늘부터 시작해요
        </h1>
        <p className="m-0 text-[15px] leading-relaxed text-muted">
          주 1회 기록하고 4주를 채우면 마음 1펜. 가족 위시가 한 걸음 가까워져요.
        </p>
      </div>

      <Card>
        <H2>몸 목표</H2>
        <div className="grid grid-cols-2 gap-3">
          <Field id="height" label="키" value={height} onChange={setHeight} unit="cm" inputMode="decimal" placeholder="172" />
          <Field id="now" label="현재 체중" value={now} onChange={setNow} unit="kg" inputMode="decimal" placeholder="78.0" />
        </div>
        <Field id="goal" label="목표 체중" value={goal} onChange={setGoal} unit="kg" inputMode="decimal" placeholder="72.0" />
        <Help>건강한 범위(BMI 18.5 이상)로만 정할 수 있어요.</Help>
        <div className="flex flex-col gap-1.5">
          <div className="text-[13px] font-semibold text-sub">유지기간</div>
          <div role="group" aria-label="유지기간" className="grid grid-cols-3 gap-2">
            {[4, 8, 12].map((w) => (
              <Choice key={w} selected={maintain === w} onClick={() => setMaintain(w)}>
                {w}주
              </Choice>
            ))}
          </div>
          <Help>목표 체중에 닿은 뒤 이 기간 동안 목표 +1kg 이내를 지키면 졸업이에요.</Help>
        </div>
      </Card>

      <Card>
        <H2>가상 비용과 아낀 돈 쓸 곳</H2>
        <Field
          id="cost"
          label="4주 비용 (가상)"
          value={cost}
          onChange={(v) => setCost(formatMoneyInput(v))}
          unit="원"
          inputMode="numeric"
        />
        <Help>비교를 위한 예시 금액이에요. 직접 바꿀 수 있어요.</Help>
        <BucketEditor initial={buckets} penCost={penCost} onChange={setBuckets} />
        <Help>예: 가족여행 40%, 아이 선물 30%. 합계 100% 이하면 되고, 나중에 바꿀 수 있어요.</Help>
      </Card>

      <Card>
        <H2>이번 4주 실천 행동 1개</H2>
        <div role="group" aria-label="실천 행동" className="flex flex-wrap gap-2">
          {ACTION_PRESETS.map((a) => (
            <Choice
              key={a}
              shape="pill"
              selected={!useCustom && action === a}
              onClick={() => {
                setUseCustom(false);
                setAction(a);
              }}
            >
              {a}
            </Choice>
          ))}
          <Choice shape="pill" dashed={!useCustom} selected={useCustom} onClick={() => setUseCustom(true)}>
            + 직접 입력
          </Choice>
        </div>
        {useCustom && (
          <Field id="custom-action" label="나만의 실천 행동" value={customAction} onChange={setCustomAction} placeholder="예: 점심 후 10분 걷기" />
        )}
        <Help>체중과 상관없이 매주 기록하면 스탬프를 받아요. 실천한 주는 따로 쌓여요.</Help>
      </Card>

      <Card>
        <H2>마음 주사의 날</H2>
        <div role="group" aria-label="체크인 요일" className="grid grid-cols-7 gap-1.5">
          {DAY_NAMES.map((d, i) => (
            <Choice key={d} selected={day === i} onClick={() => setDay(i)}>
              {d}
            </Choice>
          ))}
        </div>
        <Help>매주 이 요일에 체중과 실천을 기록해요. 시작 후 설정에서 캘린더 반복 일정을 받을 수 있어요.</Help>
      </Card>

      <Card tone="teal">
        <div className="text-[13px] font-semibold text-teal">미리 보기</div>
        <div className="text-lg font-bold leading-snug">4주마다 마음 1펜 = 가상 {won(penCost)}</div>
        {preview.first && preview.pens !== null && (
          <div className="text-[15px]">
            {preview.first.name}까지 마음 {preview.pens}펜
          </div>
        )}
        <p className="m-0 text-xs leading-relaxed text-sub">가상 금액은 비교용이에요. 실제로 모은 돈은 따로 기록해요.</p>
      </Card>

      {telemetryEnabled() && (
        <div className="flex items-start gap-2.5 px-1">
          <input
            id="consent"
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="mt-0.5 h-[22px] w-[22px] shrink-0 accent-teal"
          />
          <label htmlFor="consent" className="text-[13px] leading-relaxed text-sub">
            테스트에 참여해 기록 횟수만 익명으로 보내기 (체중과 금액은 보내지 않아요)
          </label>
        </div>
      )}

      {error && (
        <div role="alert" className="rounded-xl bg-coral-bg px-4 py-3 text-sm font-semibold text-coral-text">
          {error}
        </div>
      )}

      <PrimaryButton onClick={start}>마음자로 시작하기</PrimaryButton>
      <Disclaimer />
    </Screen>
  );
}
