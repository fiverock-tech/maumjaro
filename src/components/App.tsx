"use client";

import { useCallback, useEffect, useState } from "react";
import type { ActionStatus, AppState, Bucket, Checkin, Profile } from "@/lib/types";
import { appNow, completedPens, localDate, newId, progress, splitAmount, upsertWeight, weekIndex, weekWeight } from "@/lib/rules";
import { clearState, emptyState, loadState, saveState } from "@/lib/storage";
import { sendEvent } from "@/lib/telemetry";
import Onboarding from "./Onboarding";
import Home from "./Home";
import Done from "./Done";
import PenCard from "./PenCard";
import Settings from "./Settings";
import Graduation from "./Graduation";

type View = { name: "home" } | { name: "done" } | { name: "settings" } | { name: "graduation" } | { name: "pen"; pen: number };

export default function App() {
  const [state, setState] = useState<AppState | null>(null);
  const [view, setView] = useState<View>({ name: "home" });

  useEffect(() => {
    setState(loadState());
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [view]);

  const commit = useCallback((next: AppState) => {
    saveState(next);
    setState(next);
  }, []);

  const update = useCallback(
    (fn: (s: AppState) => AppState) => {
      setState((prev) => {
        if (!prev) return prev;
        const next = fn(prev);
        saveState(next);
        return next;
      });
    },
    []
  );

  if (!state) {
    return <div className="min-h-dvh bg-ground" aria-busy="true" />;
  }

  if (!state.profile) {
    return (
      <Onboarding
        onStart={(profile: Profile, consent: boolean) => {
          const start = { date: localDate(new Date(profile.startedAt)), weight: profile.startWeight, at: profile.startedAt };
          const next = { ...state, profile, consent, weights: upsertWeight(state.weights, start) };
          commit(next);
          sendEvent(next, "start", { week: 0 });
          setView({ name: "home" });
        }}
      />
    );
  }

  const now = appNow(state);

  const saveWeight = (weight: number) => {
    const entry = { date: localDate(now), weight, at: now.toISOString() };
    commit({ ...state, weights: upsertWeight(state.weights, entry) });
  };

  const checkin = (status: ActionStatus) => {
    const profile = state.profile!;
    const ww = weekWeight(state, now);
    if (!ww) return;
    const week = weekIndex(profile.startedAt, now);
    const c: Checkin = { id: newId(), at: now.toISOString(), week, weight: ww.weight, action: profile.action, status };
    const next = { ...state, checkins: [...state.checkins, c] };
    commit(next);

    sendEvent(next, "checkin", { week, status });
    if (completedPens(next) > completedPens(state)) sendEvent(next, "pen", { week });
    const wasGrad = progress(profile, state.checkins).phase === "graduated";
    if (!wasGrad && progress(profile, next.checkins).phase === "graduated") sendEvent(next, "graduate", { week });
    setView({ name: "done" });
  };

  const recordSaving = (pen: number, amount: number) => {
    const profile = state.profile!;
    const next = {
      ...state,
      savings: [
        ...state.savings,
        { id: newId(), at: new Date().toISOString(), pen, amount, split: splitAmount(amount, profile.buckets) },
      ],
    };
    commit(next);
    sendEvent(next, "saving", { week: weekIndex(profile.startedAt, now) });
  };

  const saveBuckets = (buckets: Bucket[]) => update((s) => ({ ...s, profile: { ...s.profile!, buckets } }));
  const changeAction = (action: string) => update((s) => ({ ...s, profile: { ...s.profile!, action } }));

  switch (view.name) {
    case "done":
      return (
        <Done
          state={state}
          onHome={() => setView({ name: "home" })}
          onOpenPen={(pen) => setView({ name: "pen", pen })}
          onOpenGraduation={() => setView({ name: "graduation" })}
        />
      );
    case "graduation":
      return (
        <Graduation
          state={state}
          onBack={() => setView({ name: "home" })}
          onContinue={() => {
            update((s) => ({ ...s, graduationSeen: true }));
            setView({ name: "home" });
          }}
        />
      );
    case "pen":
      return (
        <PenCard
          key={view.pen}
          state={state}
          pen={view.pen}
          onBack={() => setView({ name: "home" })}
          onRecordSaving={recordSaving}
          onSaveBuckets={saveBuckets}
          onChangeAction={changeAction}
          onFinish={() => {
            update((s) => ({ ...s, penCardsSeen: Math.max(s.penCardsSeen, view.pen) }));
            setView({ name: "home" });
          }}
        />
      );
    case "settings":
      return (
        <Settings
          state={state}
          onBack={() => setView({ name: "home" })}
          onUpdate={update}
          onReplace={(s) => {
            commit(s);
            setView({ name: "home" });
          }}
          onReset={() => {
            clearState();
            commit(emptyState());
            setView({ name: "home" });
          }}
        />
      );
    default:
      return (
        <Home
          key={state.checkins.length}
          state={state}
          now={now}
          onSaveWeight={saveWeight}
          onCheckin={checkin}
          onTestAdvance={(days) => update((s) => ({ ...s, testDayOffset: (s.testDayOffset || 0) + days }))}
          onOpenSettings={() => setView({ name: "settings" })}
          onOpenPen={(pen) => setView({ name: "pen", pen })}
          onOpenGraduation={() => setView({ name: "graduation" })}
        />
      );
  }
}
