"use client";

import { useState } from "react";
import type { AppState } from "@/lib/types";
import {
  MAINTAIN_BAND_KG,
  UNASSIGNED,
  confirmedSaved,
  pensAtGraduation,
  progress,
  savedByBucket,
  totalSaved,
} from "@/lib/rules";
import { kg, kgDelta, won } from "@/lib/format";
import { Card, H2, Help, PrimaryButton, Screen, SecondaryButton, TopBar } from "./ui";

export default function Graduation({
  state,
  onBack,
  onContinue,
}: {
  state: AppState;
  onBack: () => void;
  onContinue: () => void;
}) {
  const profile = state.profile!;
  const [toast, setToast] = useState<string | null>(null);
  const prog = progress(profile, state.checkins);
  if (prog.graduatedAt === null) return null;

  const upTo = state.checkins.slice(0, prog.graduatedAt + 1);
  const gradCheckin = upTo[upTo.length - 1];
  const pens = pensAtGraduation(state) ?? 0;
  const confirmed = confirmedSaved(state) ?? 0;
  const doneCount = upTo.filter((c) => c.status === "done").length;
  const byBucket = savedByBucket(state.savings);
  const real = totalSaved(state.savings);
  const firstTime = !state.graduationSeen;

  const share = async () => {
    const text = `마음자로 졸업! 목표 체중을 ${profile.maintainWeeks}주 동안 지켰어요. 마음 ${pens}펜, 가상으로 ${won(confirmed)}을 아꼈어요.`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "마음자로", text, url: location.origin });
        return;
      }
      await navigator.clipboard.writeText(`${text} ${location.origin}`);
      setToast("공유 문구를 복사했어요");
      setTimeout(() => setToast(null), 2200);
    } catch {
      /* 사용자가 취소 */
    }
  };

  return (
    <Screen>
      <TopBar onBack={firstTime ? undefined : onBack} right="졸업" />

      <Card tone="solid" className="gap-2 py-6">
        <div className="text-[13px] font-semibold opacity-90">목표 체중 + {profile.maintainWeeks}주 유지 달성</div>
        <h1 className="m-0 text-[28px] font-bold leading-snug">졸업을 축하해요</h1>
        <p className="m-0 text-[15px] leading-relaxed">
          {gradCheckin.week + 1}주 동안 마음 주사를 {upTo.length}번 맞았어요.
        </p>
      </Card>

      <section className="grid grid-cols-3 gap-2">
        <div className="flex flex-col gap-1 rounded-[14px] bg-white px-3 py-3.5">
          <div className="text-xs text-muted">시작보다</div>
          <div className="text-xl font-bold">{kgDelta(gradCheckin.weight - profile.startWeight)}</div>
        </div>
        <div className="flex flex-col gap-1 rounded-[14px] bg-white px-3 py-3.5">
          <div className="text-xs text-muted">마음 펜</div>
          <div className="text-xl font-bold">{pens}펜</div>
        </div>
        <div className="flex flex-col gap-1 rounded-[14px] bg-white px-3 py-3.5">
          <div className="text-xs text-muted">실천 해냄</div>
          <div className="text-xl font-bold">{doneCount}번</div>
        </div>
      </section>

      <Card className="gap-1.5">
        <div className="text-[13px] font-semibold text-sub">확정된 가상 절약액</div>
        <div className="text-[28px] font-bold text-teal">{won(confirmed)}</div>
        <Help>졸업 순간에 고정된 금액이에요. 약을 쓰지 않았을 때의 단순 비교 예시예요.</Help>
      </Card>

      <Card tone="coral" className="gap-2.5">
        <div className="text-[13px] font-semibold text-coral-text">실제 모은 돈</div>
        <div className="text-[22px] font-bold">{won(real)}</div>
        {real > 0 && (
          <ul className="m-0 flex list-none flex-col gap-1.5 p-0 text-sm">
            {profile.buckets.map((b) => (
              <li key={b.id} className="flex justify-between">
                <span>{b.name}</span>
                <span className="font-semibold">{won(byBucket[b.id] || 0)}</span>
              </li>
            ))}
            {(byBucket[UNASSIGNED] || 0) > 0 && (
              <li className="flex justify-between text-sub">
                <span>아직 정하지 않음</span>
                <span className="font-semibold">{won(byBucket[UNASSIGNED])}</span>
              </li>
            )}
          </ul>
        )}
        {real === 0 && <Help>직접 기록한 금액이 아직 없어요. 4주 성취 카드에서 언제든 기록할 수 있어요.</Help>}
      </Card>

      <Card tone="teal" className="gap-2">
        <H2>이제부터는 유지 시즌</H2>
        <ul className="m-0 flex list-disc flex-col gap-1.5 pl-5 text-sm leading-relaxed">
          <li>매주 기록과 스탬프는 그대로 이어가요.</li>
          <li>앞으로 채우는 펜은 &lsquo;졸업 후 유지로 아낀 돈&rsquo;으로 따로 쌓여요. 확정 금액은 바뀌지 않아요.</li>
          <li>매주 {kg(profile.goalWeight + MAINTAIN_BAND_KG)} 이하(목표 +1kg)를 지키는지 함께 봐요.</li>
        </ul>
      </Card>

      <div className="mt-2 flex flex-col gap-2.5">
        <SecondaryButton onClick={share}>공유하기</SecondaryButton>
        <PrimaryButton onClick={onContinue}>{firstTime ? "유지 계속하기" : "홈으로"}</PrimaryButton>
      </div>

      {toast && (
        <div role="status" className="fixed inset-x-0 bottom-6 z-10 mx-auto w-fit max-w-[90%] rounded-full bg-ink px-4 py-2.5 text-sm text-white shadow-lg">
          {toast}
        </div>
      )}
    </Screen>
  );
}
