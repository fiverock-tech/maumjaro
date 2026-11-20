export type ActionStatus = "done" | "partial" | "missed";

/** 아낀 돈을 쓸 곳. 최대 3개, 비율 합계 100% 이하 */
export interface Bucket {
  id: string;
  name: string;
  percent: number; // 0~100 정수
  target?: number; // 목표 금액(선택, 원)
}

export interface Profile {
  heightCm: number;
  startWeight: number;
  goalWeight: number;
  maintainWeeks: number; // 4 | 8 | 12
  penCost: number; // 4주 가상 비용(원)
  action: string; // 현재 4주 실천 행동
  checkinDay: number; // 0=일 ~ 6=토
  buckets: Bucket[];
  startedAt: string; // ISO
}

export interface Checkin {
  id: string;
  at: string; // ISO
  week: number; // 시작 기준 0부터
  weight: number;
  action: string; // 그 주의 실천 행동 이름
  status: ActionStatus;
}

export interface SavingSplit {
  bucketId: string; // "unassigned" = 아직 정하지 않음
  name: string;
  amount: number;
}

export interface Saving {
  id: string;
  at: string;
  pen: number; // 몇 번째 펜을 기념해 기록했는지
  amount: number; // 사용자가 직접 기록한 실제 금액
  split: SavingSplit[];
}

export interface AppState {
  version: 1;
  profile: Profile | null;
  checkins: Checkin[];
  savings: Saving[];
  penCardsSeen: number; // 확인한 펜 카드 수
  anonId: string;
  consent: boolean; // 익명 체크인 신호 전송 동의
  testMode: boolean; // 주 1회 제한 해제(내부 테스트용)
}
