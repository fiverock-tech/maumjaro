export function won(n: number): string {
  return `${Math.round(n).toLocaleString("ko-KR")}원`;
}

export function kg(n: number): string {
  return `${(Math.round(n * 10) / 10).toFixed(1)}kg`;
}

/** 부호 있는 체중 차이: −1.6kg / +0.4kg */
export function kgDelta(n: number): string {
  const v = Math.round(n * 10) / 10;
  if (v === 0) return "0.0kg";
  return `${v < 0 ? "−" : "+"}${Math.abs(v).toFixed(1)}kg`;
}

/** "300,000" → 300000 */
export function parseMoney(s: string): number {
  const n = Number(s.replace(/[^0-9]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

export function formatMoneyInput(s: string): string {
  const n = parseMoney(s);
  return n ? n.toLocaleString("ko-KR") : "";
}

export function parseDecimal(s: string): number {
  const n = Number(s.replace(",", "."));
  return Number.isFinite(n) ? n : NaN;
}

export function ordinal(n: number): string {
  const names = ["첫", "두", "세", "네", "다섯", "여섯", "일곱", "여덟", "아홉", "열"];
  return n >= 1 && n <= 10 ? `${names[n - 1]} 번째` : `${n}번째`;
}
