"use client";

import type { ReactNode } from "react";

export function Screen({ children }: { children: ReactNode }) {
  return (
    <main
      className="mx-auto flex min-h-dvh w-full max-w-[440px] flex-col gap-4 bg-ground px-4 pb-10"
      style={{ paddingTop: "max(20px, env(safe-area-inset-top))" }}
    >
      {children}
    </main>
  );
}

export function TopBar({ right, onBack }: { right?: ReactNode; onBack?: () => void }) {
  return (
    <div className="flex min-h-11 items-center justify-between px-1">
      {onBack ? (
        <button
          type="button"
          onClick={onBack}
          className="-ml-2 flex h-11 items-center gap-1 rounded-xl px-2 text-[15px] font-semibold text-teal"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          뒤로
        </button>
      ) : (
        <div className="text-lg font-bold text-teal">마음자로</div>
      )}
      <div className="flex items-center gap-1 text-[13px] text-muted">{right}</div>
    </div>
  );
}

export function Card({
  children,
  tone = "white",
  className = "",
}: {
  children: ReactNode;
  tone?: "white" | "teal" | "coral" | "solid";
  className?: string;
}) {
  const tones = {
    white: "bg-white",
    teal: "bg-teal-bg",
    coral: "bg-coral-bg",
    solid: "bg-teal text-white",
  };
  return <section className={`flex flex-col gap-3 rounded-2xl p-5 ${tones[tone]} ${className}`}>{children}</section>;
}

export function H2({ children }: { children: ReactNode }) {
  return <h2 className="m-0 text-base font-bold">{children}</h2>;
}

export function Help({ children, tone = "muted" }: { children: ReactNode; tone?: "muted" | "warn" | "error" }) {
  const c = tone === "error" ? "text-coral font-semibold" : tone === "warn" ? "text-coral-text" : "text-muted";
  return <p className={`m-0 text-xs leading-relaxed ${c}`}>{children}</p>;
}

export function Field({
  id,
  label,
  value,
  onChange,
  unit,
  inputMode,
  placeholder,
  big,
  tone = "default",
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  unit?: string;
  inputMode?: "decimal" | "numeric" | "text";
  placeholder?: string;
  big?: boolean;
  tone?: "default" | "coral";
}) {
  const border = tone === "coral" ? "border-coral-line bg-white" : "border-line bg-white";
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <label htmlFor={id} className="text-[13px] font-semibold text-sub">
        {label}
      </label>
      <div
        className={`flex items-center gap-1.5 rounded-xl border px-3.5 focus-within:border-teal focus-within:ring-2 focus-within:ring-teal/20 ${border} ${big ? "h-[52px]" : "h-12"}`}
      >
        <input
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          inputMode={inputMode}
          placeholder={placeholder}
          autoComplete="off"
          className={`min-w-0 flex-1 border-0 bg-transparent text-ink outline-none placeholder:text-[#8A949E] ${big ? "text-xl font-semibold" : "text-base"}`}
        />
        {unit && <span className="text-sm text-muted">{unit}</span>}
      </div>
    </div>
  );
}

export function Choice({
  selected,
  onClick,
  children,
  shape = "box",
  dashed,
}: {
  selected?: boolean;
  onClick?: () => void;
  children: ReactNode;
  shape?: "box" | "pill";
  dashed?: boolean;
}) {
  const base = shape === "pill" ? "min-h-11 rounded-full px-3.5 text-sm" : "min-h-11 rounded-xl px-2 text-[15px]";
  const look = selected
    ? "border-2 border-teal bg-teal-bg font-semibold text-teal"
    : dashed
      ? "border border-dashed border-[#8A949E] bg-white text-sub"
      : "border border-line bg-white text-ink";
  return (
    <button type="button" aria-pressed={selected} onClick={onClick} className={`${base} ${look}`}>
      {children}
    </button>
  );
}

export function PrimaryButton({
  children,
  onClick,
  disabled,
  tone = "teal",
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  tone?: "teal" | "coral";
}) {
  const bg = tone === "coral" ? "bg-coral" : "bg-teal";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex h-14 w-full items-center justify-center rounded-[14px] text-[17px] font-semibold text-white ${bg} disabled:opacity-40`}
    >
      {children}
    </button>
  );
}

export function SecondaryButton({ children, onClick }: { children: ReactNode; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-12 w-full items-center justify-center rounded-[14px] border border-teal bg-white text-base font-semibold text-teal"
    >
      {children}
    </button>
  );
}

export function TextButton({ children, onClick }: { children: ReactNode; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-11 w-full items-center justify-center rounded-xl border border-line bg-white text-sm text-ink"
    >
      {children}
    </button>
  );
}

export function CheckIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  );
}

export function Stat({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: "teal" | "coral" }) {
  const c = tone === "teal" ? "text-teal" : tone === "coral" ? "text-coral" : "text-ink";
  return (
    <div className="flex min-w-0 flex-col gap-1 rounded-[14px] bg-white p-3">
      <div className="text-[11px] text-muted">{label}</div>
      <div className={`text-[15px] font-bold ${c}`}>{value}</div>
      {sub && <div className="text-[11px] text-muted">{sub}</div>}
    </div>
  );
}

export function Disclaimer() {
  return (
    <p className="m-0 text-center text-xs leading-relaxed text-muted">
      마음자로는 의료 조언이 아니며, 특정 의약품을 대신하지 않아요.
      <br />
      기록은 이 기기에만 저장돼요.
    </p>
  );
}
