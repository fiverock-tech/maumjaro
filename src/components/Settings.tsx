"use client";

import { useRef, useState } from "react";
import type { AppState, Bucket } from "@/lib/types";
import { DAY_NAMES, sumPercent, validateBuckets } from "@/lib/rules";
import { kg, won } from "@/lib/format";
import { downloadFile, exportJson, importJson } from "@/lib/storage";
import { weeklyCheckinIcs } from "@/lib/ics";
import { telemetryEnabled } from "@/lib/telemetry";
import BucketEditor from "./BucketEditor";
import { Card, Choice, Disclaimer, H2, Help, Screen, TextButton, TopBar } from "./ui";

function Toggle({ id, checked, onChange, label, help }: { id: string; checked: boolean; onChange: (v: boolean) => void; label: string; help?: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="flex flex-col gap-1">
        <label htmlFor={id} className="text-[15px] font-semibold">
          {label}
        </label>
        {help && <Help>{help}</Help>}
      </div>
      <input
        id={id}
        type="checkbox"
        role="switch"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-6 w-6 shrink-0 accent-teal"
      />
    </div>
  );
}

export default function Settings({
  state,
  onBack,
  onUpdate,
  onReplace,
  onReset,
}: {
  state: AppState;
  onBack: () => void;
  onUpdate: (fn: (s: AppState) => AppState) => void;
  onReplace: (s: AppState) => void;
  onReset: () => void;
}) {
  const profile = state.profile!;
  const fileRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [editBuckets, setEditBuckets] = useState(false);
  const [draft, setDraft] = useState<Bucket[]>(profile.buckets);
  const [bucketError, setBucketError] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  const setProfile = (patch: Partial<typeof profile>) =>
    onUpdate((s) => ({ ...s, profile: { ...s.profile!, ...patch } }));

  const today = new Date();
  const stamp = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, "0")}${String(today.getDate()).padStart(2, "0")}`;

  return (
    <Screen>
      <TopBar onBack={onBack} right="설정" />

      <Card>
        <H2>내 목표</H2>
        <dl className="m-0 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
          <dt className="text-muted">체중</dt>
          <dd className="m-0 text-right">
            {kg(profile.startWeight)} → 목표 {kg(profile.goalWeight)}
          </dd>
          <dt className="text-muted">유지기간</dt>
          <dd className="m-0 text-right">{profile.maintainWeeks}주</dd>
          <dt className="text-muted">4주 가상 비용</dt>
          <dd className="m-0 text-right">{won(profile.penCost)}</dd>
          <dt className="text-muted">실천 행동</dt>
          <dd className="m-0 text-right">{profile.action}</dd>
        </dl>
        <Help>실천 행동은 4주 성취 카드에서 바꿀 수 있어요.</Help>
      </Card>

      <Card>
        <H2>마음 주사의 날</H2>
        <div role="group" aria-label="체크인 요일" className="grid grid-cols-7 gap-1.5">
          {DAY_NAMES.map((d, i) => (
            <Choice key={d} selected={profile.checkinDay === i} onClick={() => setProfile({ checkinDay: i })}>
              {d}
            </Choice>
          ))}
        </div>
        <TextButton
          onClick={() =>
            downloadFile("maumjaro-weekly.ics", weeklyCheckinIcs(profile.checkinDay, location.origin), "text/calendar;charset=utf-8")
          }
        >
          캘린더에 매주 반복 일정 추가
        </TextButton>
        <Help>내려받은 파일을 열면 휴대폰 캘린더에 매주 {DAY_NAMES[profile.checkinDay]}요일 저녁 8시 알림이 생겨요.</Help>
      </Card>

      <Card>
        <H2>아낀 돈 쓸 곳</H2>
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
                  setProfile({ buckets: draft.map((b) => ({ ...b, name: b.name.trim() })) });
                  setEditBuckets(false);
                  setBucketError(null);
                }}
                className="h-11 rounded-xl bg-teal text-sm font-semibold text-white"
              >
                저장
              </button>
              <TextButton onClick={() => setEditBuckets(false)}>취소</TextButton>
            </div>
          </>
        ) : (
          <>
            <ul className="m-0 flex list-none flex-col gap-1.5 p-0 text-sm">
              {profile.buckets.map((b) => (
                <li key={b.id} className="flex justify-between">
                  <span>{b.name}</span>
                  <span className="font-semibold">{b.percent}%</span>
                </li>
              ))}
              {sumPercent(profile.buckets) < 100 && (
                <li className="flex justify-between text-muted">
                  <span>아직 정하지 않음</span>
                  <span className="font-semibold">{100 - sumPercent(profile.buckets)}%</span>
                </li>
              )}
            </ul>
            <TextButton onClick={() => setEditBuckets(true)}>쓸 곳·비율 바꾸기</TextButton>
          </>
        )}
      </Card>

      <Card>
        <H2>기록 백업</H2>
        <Help>
          기록은 이 기기에만 있어요. 폰을 바꾸거나 브라우저 데이터를 지우면 사라질 수 있으니, 가끔 백업 파일을 저장해 두세요.
        </Help>
        <TextButton onClick={() => downloadFile(`maumjaro-backup-${stamp}.json`, exportJson(state), "application/json")}>
          백업 파일 저장
        </TextButton>
        <TextButton onClick={() => fileRef.current?.click()}>백업 파일에서 복원</TextButton>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={async (e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            if (!f) return;
            const restored = importJson(await f.text());
            if (!restored) return setMessage("마음자로 백업 파일이 아니에요.");
            onReplace(restored);
            setMessage("백업에서 복원했어요.");
          }}
        />
        {message && (
          <p role="status" className="m-0 text-[13px] font-semibold text-teal">
            {message}
          </p>
        )}
      </Card>

      <Card className="gap-4">
        {telemetryEnabled() && (
          <Toggle
            id="consent"
            checked={state.consent}
            onChange={(v) => onUpdate((s) => ({ ...s, consent: v }))}
            label="테스트 참여 (익명 신호)"
            help="기록 횟수와 실천 여부만 익명으로 보내요. 체중과 금액은 보내지 않아요."
          />
        )}
        <Toggle
          id="testmode"
          checked={state.testMode}
          onChange={(v) => onUpdate((s) => ({ ...s, testMode: v }))}
          label="테스트 모드"
          help="주 1회 제한을 풀어 여러 주를 바로 기록해 볼 수 있어요. 내부 점검용이에요."
        />
      </Card>

      <Card>
        <H2>처음부터 다시</H2>
        {confirmReset ? (
          <>
            <Help tone="error">모든 기록이 지워져요. 되돌릴 수 없어요.</Help>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={onReset} className="h-11 rounded-xl bg-coral text-sm font-semibold text-white">
                모두 지우기
              </button>
              <TextButton onClick={() => setConfirmReset(false)}>취소</TextButton>
            </div>
          </>
        ) : (
          <TextButton onClick={() => setConfirmReset(true)}>모든 기록 지우기</TextButton>
        )}
      </Card>

      <Disclaimer />
      <p className="m-0 text-center text-[11px] text-muted">마음자로 v0.1.0</p>
    </Screen>
  );
}
