"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./Participants.module.scss";

import { moderatorUsersService } from "@/services/moderatorUsers/moderatorUsers.service";
import type { IModeratorDashboardResponse } from "@/services/moderatorUsers/moderatorUsers.types";
import ParticipantsStats from "./components/ParticipantsStats/ParticipantsStats";


type LoadState = "idle" | "loading" | "success" | "error";

function clampPct(v: number) {
  if (!Number.isFinite(v)) return 0;
  return Math.max(0, Math.min(100, Math.round(v)));
}

function safeNum(v: any) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export default function Participants() {
  const [loadState, setLoadState] = useState<LoadState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [dashboard, setDashboard] = useState<IModeratorDashboardResponse | null>(null);

  const abortRef = useRef({ aborted: false });

  const fetchDashboard = async () => {
    setLoadState("loading");
    setError(null);
    abortRef.current.aborted = false;

    try {
      // Нам нужны только stats — ограничим отдачу пользователей
      const res = await moderatorUsersService.getDashboard({ limit: 1, offset: 0 });
      if (abortRef.current.aborted) return;

      setDashboard(res);
      setLoadState("success");
    } catch (e: any) {
      if (abortRef.current.aborted) return;
      const msg = e?.response?.data?.message || e?.message || "Ошибка загрузки dashboard";
      setError(String(msg));
      setLoadState("error");
    }
  };

  useEffect(() => {
    fetchDashboard();
    return () => {
      abortRef.current.aborted = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stats = dashboard?.stats;

  const totalParticipants = safeNum(stats?.totalParticipants);
  const avgProgressPercent = clampPct(safeNum(stats?.avgProgressPercent));
  const activeProblems = safeNum(stats?.activeProblems);

  return (
    <section className={styles.wrap} aria-label="Участники">
      <ParticipantsStats
        loadState={loadState}
        error={error}
        onRetry={fetchDashboard}
        totalParticipants={totalParticipants}
        avgProgressPercent={avgProgressPercent}
        activeProblems={activeProblems}
      />
    </section>
  );
}
