import type { AppState } from "./types";

/**
 * 익명 체크인 신호.
 * - 사용자가 동의(consent)했을 때만 보냅니다.
 * - 체중, 금액, 쓸 곳 이름은 절대 보내지 않습니다.
 * - 환경변수가 없으면 아무것도 하지 않습니다.
 *
 * 보내는 항목: 익명 ID, 이벤트 종류, 주차, 실천 여부, 앱 버전
 */
export type EventName = "start" | "checkin" | "pen" | "saving" | "graduate";

const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const APP_VERSION = "0.1.0";

export function telemetryEnabled(): boolean {
  return Boolean(URL_ && KEY);
}

export function sendEvent(
  state: AppState,
  event: EventName,
  data: { week?: number; status?: string } = {}
): void {
  if (!state.consent || !URL_ || !KEY) return;
  const body = {
    anon_id: state.anonId,
    event,
    week: data.week ?? null,
    action_status: data.status ?? null,
    app_version: APP_VERSION,
  };
  try {
    fetch(`${URL_}/rest/v1/checkin_events`, {
      method: "POST",
      headers: {
        apikey: KEY,
        Authorization: `Bearer ${KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify(body),
      keepalive: true,
    }).catch(() => {});
  } catch {
    /* 신호 실패는 앱 사용에 영향 없음 */
  }
}
