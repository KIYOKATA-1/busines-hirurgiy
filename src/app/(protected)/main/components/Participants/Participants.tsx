"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./Participants.module.scss";

import { moderatorUsersService } from "@/services/moderatorUsers/moderatorUsers.service";
import type {
  IModeratorDashboardResponse,
  IModeratorDashboardUser,
} from "@/services/moderatorUsers/moderatorUsers.types";

import ParticipantsStats from "./components/ParticipantsStats/ParticipantsStats";
import ParticipantsList from "./components/ParticipantsList/ParticipantsList";

import { motion, useReducedMotion } from "motion/react";

type LoadState = "idle" | "loading" | "success" | "error";

function clampPct(v: number) {
  if (!Number.isFinite(v)) return 0;
  return Math.max(0, Math.min(100, Math.round(v)));
}

function safeNum(v: any) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function calcLimitByHeight(h: number) {
  if (h <= 640) return 1;
  if (h <= 780) return 2;
  return 3;
}

export default function Participants() {
  const reduceMotion = useReducedMotion();

  const [loadState, setLoadState] = useState<LoadState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [dashboard, setDashboard] = useState<IModeratorDashboardResponse | null>(
    null
  );

  const abortRef = useRef({ aborted: false });

  const [limit, setLimit] = useState(3);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const apply = () => {
      const next = calcLimitByHeight(window.innerHeight);
      setLimit((prev) => (prev === next ? prev : next));
    };

    apply();
    window.addEventListener("resize", apply);
    return () => window.removeEventListener("resize", apply);
  }, []);

  useEffect(() => {
    setOffset(0);
  }, [limit]);

  const total = safeNum(dashboard?.users?.total);
  const totalPages = Math.max(1, Math.ceil(Math.max(0, total) / limit));
  const currentPage = Math.min(
    totalPages,
    Math.max(1, Math.floor(offset / limit) + 1)
  );

  const canPrev = offset > 0;
  const canNext = offset + limit < total;

  const fetchDashboard = async (nextOffset: number) => {
    setLoadState("loading");
    setError(null);
    abortRef.current.aborted = false;

    try {
      const res = await moderatorUsersService.getDashboard({
        limit,
        offset: Math.max(0, nextOffset),
      });

      if (abortRef.current.aborted) return;

      setDashboard(res);
      setLoadState("success");
    } catch (e: any) {
      if (abortRef.current.aborted) return;
      const msg =
        e?.response?.data?.message ||
        e?.message ||
        "Ошибка загрузки dashboard";
      setError(String(msg));
      setLoadState("error");
    }
  };

  useEffect(() => {
    fetchDashboard(offset);
    return () => {
      abortRef.current.aborted = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offset, limit]);

  const users: IModeratorDashboardUser[] = useMemo(() => {
    return dashboard?.users?.items ?? [];
  }, [dashboard]);

  const stats = dashboard?.stats;
  const totalParticipants = safeNum(stats?.totalParticipants);
  const avgProgressPercent = clampPct(safeNum(stats?.avgProgressPercent));
  const activeProblems = safeNum(stats?.activeProblems);

  return (
    <motion.section
      className={styles.wrap}
      aria-label="Участники"
      initial={
        reduceMotion
          ? false
          : { opacity: 0, y: 10, filter: "blur(8px)" as any }
      }
      animate={
        reduceMotion
          ? undefined
          : { opacity: 1, y: 0, filter: "blur(0px)" as any }
      }
      transition={
        reduceMotion
          ? undefined
          : { duration: 0.55, ease: [0.22, 1, 0.36, 1] }
      }
    >
      <div className={styles.statsSlot}>
        <ParticipantsStats
          loadState={loadState}
          error={error}
          onRetry={() => fetchDashboard(offset)}
          totalParticipants={totalParticipants}
          avgProgressPercent={avgProgressPercent}
          activeProblems={activeProblems}
        />
      </div>

      <div className={styles.listSlot}>
        <ParticipantsList
          loadState={loadState}
          error={error}
          users={users}
          total={total}
          currentPage={currentPage}
          totalPages={totalPages}
          canPrev={canPrev}
          canNext={canNext}
          onPrev={() => setOffset((v) => Math.max(0, v - limit))}
          onNext={() => setOffset((v) => (v + limit < total ? v + limit : v))}
          onRetry={() => fetchDashboard(offset)}
          limit={limit}
          offset={offset}
          onSetOffset={setOffset}
        />
      </div>
    </motion.section>
  );
}
