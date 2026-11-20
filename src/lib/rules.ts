import type { AppState, Bucket, Checkin, Profile, Saving, SavingSplit } from "./types";

export const PEN_WEEKS = 4;
export const MAX_BUCKETS = 3;
export const MIN_BMI = 18.5;
/** 유지 범위: 목표 체중 + 이 값(kg) 이내면 유지로 인정 */
export const MAINTAIN_BAND_KG = 1.0;
/** 이보다 빠른 주당 감량은 속도 주의 안내 */
export const FAST_LOSS_KG_PER_WEEK = 1.5;
export const UNASSIGNED = "unassigned";

const DAY_MS = 24 * 60 * 60 * 1000;

export const ACTION_PRESETS = [
  "저녁 간식 줄이기",
  "하루 20분 걷기",
  "단 음료 대신 물",
  "밤 9시 이후 배달 안 하기",
  "아이와 저녁 산책",
  "7시간 이상 자기",
];

export const DAY_NAMES = ["일", "월", "화", "수", "목", "금", "토"];

function startOfDay(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

/** 시작일 기준 몇 번째 주인지(0부터) */
export function weekIndex(startedAt: string, now: Date): number {
  const diff = startOfDay(now) - startOfDay(new Date(startedAt));
  return Math.max(0, Math.floor(diff / (7 * DAY_MS)));
}

export function canCheckIn(state: AppState, now: Date): boolean {
  if (!state.profile) return false;
  if (state.testMode) return true;
  const w = weekIndex(state.profile.startedAt, now);
  return !state.checkins.some((c) => c.week === w);
}

/** 다음 체크인 요일까지 남은 날(오늘이면 0) */
export function daysUntilCheckinDay(checkinDay: number, now: Date): number {
  return (checkinDay - now.getDay() + 7) % 7;
}

export function bmi(weightKg: number, heightCm: number): number {
  const m = heightCm / 100;
  return weightKg / (m * m);
}

/** 목표 설정 검증. 문제가 없으면 null */
export function validateProfile(p: {
  heightCm: number;
  startWeight: number;
  goalWeight: number;
}): string | null {
  if (!(p.heightCm >= 120 && p.heightCm <= 230)) return "키를 확인해 주세요.";
  if (!(p.startWeight >= 30 && p.startWeight <= 300)) return "현재 체중을 확인해 주세요.";
  if (!(p.goalWeight > 0)) return "목표 체중을 입력해 주세요.";
  if (p.goalWeight >= p.startWeight) return "목표 체중은 현재 체중보다 낮아야 해요.";
  if (bmi(p.goalWeight, p.heightCm) < MIN_BMI) {
    const minKg = Math.ceil(MIN_BMI * (p.heightCm / 100) ** 2 * 10) / 10;
    return `건강한 범위(BMI 18.5 이상)로만 정할 수 있어요. 이 키라면 ${minKg}kg 이상이에요.`;
  }
  return null;
}

/** 쓸 곳 검증. 문제가 없으면 null */
export function validateBuckets(buckets: Bucket[]): string | null {
  if (buckets.length > MAX_BUCKETS) return `쓸 곳은 최대 ${MAX_BUCKETS}개까지예요.`;
  for (const b of buckets) {
    if (!b.name.trim()) return "쓸 곳 이름을 입력해 주세요.";
    if (!Number.isInteger(b.percent) || b.percent < 0 || b.percent > 100) return "비율은 0~100 사이로 입력해 주세요.";
  }
  if (sumPercent(buckets) > 100) return "비율 합계가 100%를 넘을 수 없어요.";
  return null;
}

export function sumPercent(buckets: Bucket[]): number {
  return buckets.reduce((s, b) => s + (b.percent || 0), 0);
}

// ---------- 펜 ----------

export function completedPens(state: AppState): number {
  return Math.floor(state.checkins.length / PEN_WEEKS);
}

/** 현재 펜에서 채운 스탬프 수(0~3) */
export function stampsInCurrentPen(state: AppState): number {
  return state.checkins.length % PEN_WEEKS;
}

export function hasUnseenPen(state: AppState): boolean {
  return completedPens(state) > state.penCardsSeen;
}

export function penCheckins(state: AppState, pen: number): Checkin[] {
  return state.checkins.slice((pen - 1) * PEN_WEEKS, pen * PEN_WEEKS);
}

/** 펜 시작 직전 체중(1번째 펜이면 시작 체중) */
export function weightBeforePen(state: AppState, pen: number): number {
  if (!state.profile) return 0;
  if (pen <= 1) return state.profile.startWeight;
  const prev = state.checkins[(pen - 1) * PEN_WEEKS - 1];
  return prev ? prev.weight : state.profile.startWeight;
}

export function virtualSaved(state: AppState): number {
  if (!state.profile) return 0;
  return completedPens(state) * state.profile.penCost;
}

// ---------- 목표·유지·졸업 ----------

export type Phase = "losing" | "maintaining" | "graduated";

export interface Progress {
  phase: Phase;
  maintainCount: number; // 연속 유지 주수
  outOfBand: boolean; // 유지 중 범위를 벗어나 다시 세는 중
}

/**
 * 목표 체중 이하에 처음 닿으면 유지 모드.
 * 그 뒤 체크인마다 '목표 + 1kg 이내'면 유지 주수 +1, 벗어나면 0부터 다시(벌칙 없음).
 * 유지 주수가 유지기간에 닿으면 졸업(한 번 졸업하면 유지).
 */
export function progress(profile: Profile, checkins: Checkin[]): Progress {
  let reached = false;
  let count = 0;
  let outOfBand = false;
  for (const c of checkins) {
    if (!reached) {
      if (c.weight <= profile.goalWeight) {
        reached = true;
        count = 1;
      }
    } else if (c.weight <= profile.goalWeight + MAINTAIN_BAND_KG) {
      count += 1;
      outOfBand = false;
    } else {
      count = 0;
      outOfBand = true;
    }
    if (reached && count >= profile.maintainWeeks) {
      return { phase: "graduated", maintainCount: count, outOfBand: false };
    }
  }
  return { phase: reached ? "maintaining" : "losing", maintainCount: count, outOfBand };
}

export function lastWeight(state: AppState): number | null {
  const c = state.checkins[state.checkins.length - 1];
  return c ? c.weight : state.profile?.startWeight ?? null;
}

/** 같은 실천 행동을 '해냈어요'로 이어간 주 수(최근부터) */
export function actionStreak(checkins: Checkin[]): number {
  let n = 0;
  const last = checkins[checkins.length - 1];
  if (!last) return 0;
  for (let i = checkins.length - 1; i >= 0; i--) {
    const c = checkins[i];
    if (c.action !== last.action || c.status !== "done") break;
    n++;
  }
  return n;
}

/** 직전 기록 대비 주당 감량 속도가 빠른지 */
export function isFastLoss(checkins: Checkin[], profile: Profile): boolean {
  const n = checkins.length;
  if (n === 0) return false;
  const cur = checkins[n - 1];
  const prevWeight = n >= 2 ? checkins[n - 2].weight : profile.startWeight;
  const prevWeek = n >= 2 ? checkins[n - 2].week : -1;
  const weeks = Math.max(1, cur.week - prevWeek);
  return (prevWeight - cur.weight) / weeks > FAST_LOSS_KG_PER_WEEK;
}

// ---------- 실제 저축 ----------

/** 실제 금액을 현재 비율대로 나눔. 남는 몫은 '아직 정하지 않음' */
export function splitAmount(amount: number, buckets: Bucket[]): SavingSplit[] {
  const out: SavingSplit[] = [];
  let used = 0;
  for (const b of buckets) {
    if (b.percent <= 0) continue;
    const a = Math.floor((amount * b.percent) / 100);
    out.push({ bucketId: b.id, name: b.name, amount: a });
    used += a;
  }
  const rest = amount - used;
  if (rest > 0) out.push({ bucketId: UNASSIGNED, name: "아직 정하지 않음", amount: rest });
  return out;
}

export function totalSaved(savings: Saving[]): number {
  return savings.reduce((s, x) => s + x.amount, 0);
}

/** 쓸 곳별 실제 모은 돈 누계(이름이 바뀌어도 id 기준) */
export function savedByBucket(savings: Saving[]): Record<string, number> {
  const m: Record<string, number> = {};
  for (const s of savings) for (const p of s.split) m[p.bucketId] = (m[p.bucketId] || 0) + p.amount;
  return m;
}

/** 목표 금액까지 필요한 펜 수(가상 기준) */
export function pensToTarget(b: Bucket, penCost: number): number | null {
  if (!b.target || b.percent <= 0 || penCost <= 0) return null;
  return Math.ceil(b.target / ((penCost * b.percent) / 100));
}

export function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}
