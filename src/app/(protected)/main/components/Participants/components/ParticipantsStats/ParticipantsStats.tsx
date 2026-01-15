"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, useReducedMotion } from "motion/react";

import { ProgressIcon, UsersIcon, WarningIcon } from "@/shared/ui/icons";
import styles from "./ParticipantsStats.module.scss";

type LoadState = "idle" | "loading" | "success" | "error";

type Props = {
  loadState: LoadState;
  error: string | null;
  onRetry: () => void;

  totalParticipants: number;
  avgProgressPercent: number;
  activeProblems: number;
};

function clampNum(v: number) {
  if (!Number.isFinite(v)) return 0;
  return v;
}

function useCountUp(target: number, enabled: boolean, opts?: { durationMs?: number }) {
  const reduceMotion = useReducedMotion();
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!enabled) {
      setValue(0);
      return;
    }

    const to = clampNum(target);

    if (reduceMotion) {
      setValue(to);
      return;
    }

    const duration = Math.max(250, opts?.durationMs ?? 900);
    const from = 0;

    let raf = 0;
    const start = performance.now();

    const ease = (t: number) => 1 - Math.pow(1 - t, 3);

    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = ease(p);
      const next = from + (to - from) * eased;
      setValue(next);

      if (p < 1) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);

    return () => {
      if (raf) cancelAnimationFrame(raf);
    };
  }, [target, enabled, reduceMotion, opts?.durationMs]);

  return value;
}

export default function ParticipantsStats({
  loadState,
  error,
  onRetry,
  totalParticipants,
  avgProgressPercent,
  activeProblems,
}: Props) {
  const reduceMotion = useReducedMotion();

  const isSuccess = loadState === "success";
  const isError = loadState === "error";

  const totalV = useCountUp(totalParticipants, isSuccess, { durationMs: 900 });
  const avgV = useCountUp(avgProgressPercent, isSuccess, { durationMs: 900 });
  const problemsV = useCountUp(activeProblems, isSuccess, { durationMs: 900 });

  const totalText = useMemo(() => (isSuccess ? String(Math.round(totalV)) : "—"), [isSuccess, totalV]);
  const avgText = useMemo(() => (isSuccess ? `${Math.round(avgV)}%` : "—"), [isSuccess, avgV]);
  const problemsText = useMemo(() => (isSuccess ? String(Math.round(problemsV)) : "—"), [isSuccess, problemsV]);

  const cardInitial = reduceMotion ? false : { opacity: 0, y: 10, scale: 0.985 };
  const cardAnimate = reduceMotion ? undefined : { opacity: 1, y: 0, scale: 1 };

  return (
    <section className={styles.statsWrap} aria-label="Статистика">
      <section className={styles.statsGrid}>
        <motion.article
          className={styles.statCard}
          initial={cardInitial as any}
          animate={cardAnimate as any}
          transition={reduceMotion ? undefined : { type: "tween", duration: 0.55, delay: 0.05 }}
          whileHover={reduceMotion ? undefined : { y: -2 }}
          whileTap={reduceMotion ? undefined : { scale: 0.99 }}
        >
          <header className={styles.statHead}>
            <p className={styles.statTitle}>Всего участников</p>
            <span className={`${styles.statIcon} ${styles.iconUsers}`} aria-hidden="true">
              <UsersIcon />
            </span>
          </header>

          <p className={styles.statValue}>{totalText}</p>
          <p className={styles.statSub}>Активных пользователей</p>
        </motion.article>

        <motion.article
          className={styles.statCard}
          initial={cardInitial as any}
          animate={cardAnimate as any}
          transition={reduceMotion ? undefined : { type: "tween", duration: 0.55, delay: 0.12 }}
          whileHover={reduceMotion ? undefined : { y: -2 }}
          whileTap={reduceMotion ? undefined : { scale: 0.99 }}
        >
          <header className={styles.statHead}>
            <p className={styles.statTitle}>Средний прогресс</p>
            <span className={`${styles.statIcon} ${styles.iconProgress}`} aria-hidden="true">
              <ProgressIcon />
            </span>
          </header>

          <p className={styles.statValue}>{avgText}</p>
          <p className={styles.statSub}>По всем участникам</p>
        </motion.article>

        <motion.article
          className={styles.statCard}
          initial={cardInitial as any}
          animate={cardAnimate as any}
          transition={reduceMotion ? undefined : { type: "tween", duration: 0.55, delay: 0.19 }}
          whileHover={reduceMotion ? undefined : { y: -2 }}
          whileTap={reduceMotion ? undefined : { scale: 0.99 }}
        >
          <header className={styles.statHead}>
            <p className={styles.statTitle}>Активные проблемы</p>
            <span className={styles.statIconDanger} aria-hidden="true">
              <WarningIcon />
            </span>
          </header>

          <p className={styles.statValue}>{problemsText}</p>
          <p className={styles.statSub}>Требуют внимания</p>
        </motion.article>
      </section>

      {isError ? (
        <motion.section
          className={styles.errorBox}
          role="alert"
          initial={reduceMotion ? false : { opacity: 0, y: 8 }}
          animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
          transition={reduceMotion ? undefined : { type: "tween", duration: 0.35 }}
        >
          <h3 className={styles.errorTitle}>Не удалось загрузить</h3>
          <p className={styles.errorText}>{error}</p>
          <button className={styles.retryBtn} type="button" onClick={onRetry}>
            Повторить
          </button>
        </motion.section>
      ) : null}
    </section>
  );
}
