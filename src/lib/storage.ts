import type { AppState } from "./types";
import { newId } from "./rules";

const KEY = "maumjaro:v1";

export function emptyState(): AppState {
  return {
    version: 1,
    profile: null,
    checkins: [],
    savings: [],
    penCardsSeen: 0,
    anonId: newId(),
    consent: false,
    testMode: false,
  };
}

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return emptyState();
    const parsed = JSON.parse(raw);
    if (!isAppState(parsed)) return emptyState();
    return parsed;
  } catch {
    return emptyState();
  }
}

export function saveState(state: AppState): boolean {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

export function clearState(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* 무시 */
  }
}

export function isAppState(x: unknown): x is AppState {
  if (!x || typeof x !== "object") return false;
  const s = x as Partial<AppState>;
  return (
    s.version === 1 &&
    Array.isArray(s.checkins) &&
    Array.isArray(s.savings) &&
    typeof s.penCardsSeen === "number" &&
    typeof s.anonId === "string"
  );
}

/** 백업 파일 내용 */
export function exportJson(state: AppState): string {
  return JSON.stringify({ app: "maumjaro", exportedAt: new Date().toISOString(), state }, null, 2);
}

/** 백업 파일 읽기. 잘못된 파일이면 null */
export function importJson(text: string): AppState | null {
  try {
    const parsed = JSON.parse(text);
    const s = parsed?.app === "maumjaro" ? parsed.state : parsed;
    return isAppState(s) ? s : null;
  } catch {
    return null;
  }
}

export function downloadFile(name: string, content: string, type: string): void {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** iOS 사파리이고 홈 화면 앱이 아닌지 */
export function needsHomeScreenHint(): boolean {
  if (typeof window === "undefined") return false;
  const ua = navigator.userAgent;
  const isIOS = /iPhone|iPad|iPod/.test(ua);
  const standalone =
    window.matchMedia?.("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true;
  return isIOS && !standalone;
}
