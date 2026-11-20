"use client";

import { useState } from "react";
import type { AppState, Bucket } from "@/lib/types";
import {
  ACTION_PRESETS,
  PEN_WEEKS,
  UNASSIGNED,
  penCheckins,
  savedByBucket,
  sumPercent,
  validateBuckets,
  weightBeforePen,
} from "@/lib/rules";
import { formatMoneyInput, kgDelta, ordinal, parseMoney, won } from "@/lib/format";
import BucketEditor from "./BucketEditor";
import { Card, Choice, Field, H2, Help, PrimaryButton, Screen, SecondaryButton, TextButton, TopBar } from "./ui";

const BUCKET_COLORS = ["#0F766E", "#E08A5B", "#4F7CAC"];

export default function PenCard({
  state,
  pen,
  onBack,
  onRecordSaving,
  onSaveBuckets,
  onChangeAction,
  onFinish,
}: {
  state: AppState;
  pen: number;
  onBack: () => void;
  onRecordSaving: (pen: number, amount: number) => void;
  onSaveBuckets: (buckets: Bucket[]) => void;
  onChangeAction: (action: string) => void;
  onFinish: () => void;
}) {
  const profile = state.profile!;
  const cs = penCheckins(state, pen);
  const [amount, setAmount] = useState("");
  const [savingOpen, setSavingOpen] = useState(true);
  const [editBuckets, setEditBuckets] = useState(false);
  const [draft, setDraft] = useState<Bucket[]>(profile.buckets);
  const [bucketError, setBucketError] = useState<string | null>(null);
  const [changingAction, setChangingAction] = useState(false);
  const [customAction, setCustomAction] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  if (cs.length < PEN_WEEKS) return null;

  const doneCount = cs.filter((c) => c.status === "done").length;
  const partialCount = cs.filter((c) => c.status === "partial").length;
  const delta = cs[cs.length - 1].weight - weightBeforePen(state, pen);
  const cumulative = pen * profile.penCost;
  const savedThisPen = state.savings.filter((s) => s.pen === pen).reduce((a, s) => a + s.amount, 0);
  const byBucket = savedByBucket(state.savings);
  const total = sumPercent(profile.buckets);
  const rest = Math.max(0, 100 - total);
  const isLatestUnseen = pen === state.penCardsSeen + 1;

  const flash = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  };

  const record = () => {
    const a = parseMoney(amount);
    if (a <= 0) return;
    onRecordSaving(pen, a);
    setAmount("");
    setSavingOpen(false);
    flash(`${won(a)}을 기록했어요`);
  };

  const share = async () => {
    const text = `마음자로 ${ordinal(pen)} 마음 펜 완성! 4주 꾸준히 기록하고 가상으로 ${won(cumulative)}을 아꼈어요.`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "마음자로", text, url: location.origin });
        return;
      }
      await navigator.clipboard.writeText(`${text} ${location.origin}`);
      flash("공유 문구를 복사했어요");
    } catch {
      /* 사용자가 취소 */
    }
  };

  return (
    <Screen>
      <TopBar onBack={onBack} right={`${ordinal(pen)} 펜`} />

      <Card tone="solid" className="gap-2 py-6">
        <div className="text-[13px] font-semibold opacity-90">마음 주사 {PEN_WEEKS}번 완주</div>
        <h1 className="m-0 text-[28px] font-bold leading-snug">{ordinal(pen)} 마음 펜 완성!</h1>
        <p className="m-0 text-[15px] leading-relaxed">4주 동안 기록을 이어왔어요. 이게 가장 어려운 부분이에요.</p>
      </Card>

      <section className="grid grid-cols-3 gap-2">
        <div className="flex flex-col gap-1 rounded-[14px] bg-white px-3 py-3.5">
          <div className="text-xs text-muted">체크인</div>
          <div className="text-xl font-bold">
            {cs.length}/{PEN_WEEKS}
          </div>
        </div>
        <div className="flex flex-col gap-1 rounded-[14px] bg-white px-3 py-3.5">
          <div className="text-xs text-muted">실천 행동</div>
          <div className="text-xl font-bold">
            {doneCount}/{PEN_WEEKS}
          </div>
          {partialCount > 0 && <div className="text-[11px] text-muted">조금 {partialCount}번</div>}
        </div>
        <div className="flex flex-col gap-1 rounded-[14px] bg-white px-3 py-3.5">
          <div className="text-xs text-muted">4주 전보다</div>
          <div className="text-xl font-bold">{kgDelta(delta)}</div>
        </div>
      </section>

      <Card className="gap-1.5">
        <div className="text-[13px] font-semibold text-sub">가상 절약액</div>
        <div className="text-[26px] font-bold text-teal">+{won(profile.penCost)}</div>
        <Help>누적 {won(cumulative)} · 약을 쓰지 않았을 때의 단순 비교 예시예요.</Help>
      </Card>

      <Card tone="coral" className="gap-3">
        <div className="flex flex-col gap-1">
          <div className="text-[13px] font-semibold text-coral-text">실제 모은 돈 (선택)</div>
          <div className="text-base font-bold leading-snug">
            {savedThisPen > 0
              ? `이번 펜 기념으로 ${won(savedThisPen)}을 옮겼어요`
              : `${ordinal(pen)} 펜 기념으로 가족 통장에 옮겨볼까요?`}
          </div>
        </div>
        {savingOpen ? (
          <>
            <Field
              id="saved"
              label="옮긴 금액"
              value={amount}
              onChange={(v) => setAmount(formatMoneyInput(v))}
              unit="원"
              inputMode="numeric"
              placeholder="100,000"
              tone="coral"
            />
            <Help>직접 기록한 금액이에요. 아래에서 정한 비율대로 나눠 기록돼요.</Help>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={record}
                disabled={parseMoney(amount) <= 0}
                className="h-12 rounded-xl bg-coral text-[15px] font-semibold text-white disabled:opacity-40"
              >
                기록하기
              </button>
              <button
                type="button"
                onClick={() => setSavingOpen(false)}
                className="h-12 rounded-xl border border-coral-line bg-white text-[15px] text-sub"
              >
                이번엔 건너뛰기
              </button>
            </div>
          </>
        ) : (
          <button type="button" onClick={() => setSavingOpen(true)} className="h-11 rounded-xl border border-coral-line bg-white text-sm text-sub">
            {savedThisPen > 0 ? "더 기록하기" : "기록하기"}
          </button>
        )}
      </Card>

      <Card className="gap-3.5">
        <div className="flex flex-col gap-1">
          <H2>아낀 돈, 어디에 쓸까요?</H2>
          <div className="text-[13px] text-muted">이번 펜 {won(profile.penCost)} 기준</div>
        </div>

        {editBuckets ? (
          <>
            <BucketEditor initial={profile.buckets} penCost={profile.penCost} onChange={setDraft} />
            {bucketError && <Help tone="error">{bucketError}</Help>}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  const err = validateBuckets(draft);
                  if (err) return setBucketError(err);
                  onSaveBuckets(draft.map((b) => ({ ...b, name: b.name.trim() })));
                  setEditBuckets(false);
                  setBucketError(null);
                }}
                className="h-11 rounded-xl bg-teal text-sm font-semibold text-white"
              >
                저장
              </button>
              <TextButton
                onClick={() => {
                  setEditBuckets(false);
                  setBucketError(null);
                }}
              >
                취소
              </TextButton>
            </div>
          </>
        ) : (
          <>
            <div aria-hidden="true" className="flex h-3 gap-0.5 overflow-hidden rounded-md">
              {profile.buckets
                .filter((b) => b.percent > 0)
                .map((b) => (
                  <div key={b.id} style={{ width: `${b.percent}%`, background: BUCKET_COLORS[profile.buckets.indexOf(b) % 3] }} />
                ))}
              {rest > 0 && <div style={{ width: `${rest}%` }} className="bg-rule" />}
            </div>
            <ul className="m-0 flex list-none flex-col gap-3 p-0">
              {profile.buckets.map((b, i) => (
                <li key={b.id} className="flex items-start gap-2.5">
                  <span aria-hidden="true" className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: BUCKET_COLORS[i % 3] }} />
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <div className="text-[15px] font-semibold">{b.name}</div>
                    <div className="text-xs text-muted">
                      실제 모은 돈 {won(byBucket[b.id] || 0)}
                      {b.target ? ` / 목표 ${won(b.target)}` : ""}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[15px] font-bold">{b.percent}%</div>
                    <div className="text-xs text-muted">{won((profile.penCost * b.percent) / 100)}</div>
                  </div>
                </li>
              ))}
              {(rest > 0 || (byBucket[UNASSIGNED] || 0) > 0) && (
                <li className="flex items-start gap-2.5">
                  <span aria-hidden="true" className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full border border-[#8A949E] bg-rule" />
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <div className="text-[15px] text-sub">아직 정하지 않음</div>
                    <div className="text-xs text-muted">실제 모은 돈 {won(byBucket[UNASSIGNED] || 0)}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[15px] font-bold text-sub">{rest}%</div>
                    <div className="text-xs text-muted">{won((profile.penCost * rest) / 100)}</div>
                  </div>
                </li>
              )}
            </ul>
            <Help>쓸 곳은 최대 3개. 합계 100%만 넘지 않으면 돼요. 남는 몫은 &lsquo;아직 정하지 않음&rsquo;으로 남겨둬요.</Help>
            <TextButton onClick={() => setEditBuckets(true)}>쓸 곳·비율 바꾸기</TextButton>
          </>
        )}
      </Card>

      {isLatestUnseen && (
        <Card className="gap-2.5">
          <H2>다음 4주 실천 행동</H2>
          <div className="text-sm text-sub">지금: {profile.action}</div>
          {!changingAction ? (
            <div role="group" aria-label="다음 4주 실천 행동" className="grid grid-cols-2 gap-2">
              <Choice selected onClick={() => setChangingAction(false)}>
                <span className="text-sm">계속하기</span>
              </Choice>
              <Choice onClick={() => setChangingAction(true)}>
                <span className="text-sm">바꾸기</span>
              </Choice>
            </div>
          ) : (
            <>
              <div role="group" aria-label="새 실천 행동" className="flex flex-wrap gap-2">
                {ACTION_PRESETS.map((a) => (
                  <Choice
                    key={a}
                    shape="pill"
                    selected={profile.action === a}
                    onClick={() => {
                      onChangeAction(a);
                      setChangingAction(false);
                      flash(`다음 4주: ${a}`);
                    }}
                  >
                    {a}
                  </Choice>
                ))}
              </div>
              <div className="flex items-end gap-2">
                <div className="min-w-0 flex-1">
                  <Field id="pen-custom" label="직접 입력" value={customAction} onChange={setCustomAction} placeholder="예: 점심 후 10분 걷기" />
                </div>
                <button
                  type="button"
                  disabled={!customAction.trim()}
                  onClick={() => {
                    onChangeAction(customAction.trim());
                    setChangingAction(false);
                    flash(`다음 4주: ${customAction.trim()}`);
                  }}
                  className="h-12 rounded-xl bg-teal px-4 text-sm font-semibold text-white disabled:opacity-40"
                >
                  적용
                </button>
              </div>
            </>
          )}
        </Card>
      )}

      <div className="mt-2 flex flex-col gap-2.5">
        <SecondaryButton onClick={share}>공유하기</SecondaryButton>
        <PrimaryButton onClick={onFinish}>{isLatestUnseen ? "다음 4주 시작" : "홈으로"}</PrimaryButton>
      </div>

      {toast && (
        <div
          role="status"
          className="fixed inset-x-0 bottom-6 z-10 mx-auto w-fit max-w-[90%] rounded-full bg-ink px-4 py-2.5 text-sm text-white shadow-lg"
        >
          {toast}
        </div>
      )}
    </Screen>
  );
}
