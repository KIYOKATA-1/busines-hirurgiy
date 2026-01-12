"use client";

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

export default function ParticipantsStats({
    loadState,
    error,
    onRetry,
    totalParticipants,
    avgProgressPercent,
    activeProblems,
}: Props) {
    const isSuccess = loadState === "success";
    const isError = loadState === "error";

    return (
        <section className={styles.statsWrap} aria-label="Статистика">
            <section className={styles.statsGrid}>
                <article className={styles.statCard}>
                    <header className={styles.statHead}>
                        <p className={styles.statTitle}>Всего участников</p>
                        <span className={`${styles.statIcon} ${styles.iconUsers}`} aria-hidden="true">
                            <UsersIcon />
                        </span>
                    </header>

                    <p className={styles.statValue}>{isSuccess ? totalParticipants : "—"}</p>
                    <p className={styles.statSub}>Активных пользователей</p>
                </article>

                <article className={styles.statCard}>
                    <header className={styles.statHead}>
                        <p className={styles.statTitle}>Средний прогресс</p>
                        <span className={`${styles.statIcon} ${styles.iconProgress}`} aria-hidden="true">
                            <ProgressIcon />
                        </span>
                    </header>

                    <p className={styles.statValue}>{isSuccess ? `${avgProgressPercent}%` : "—"}</p>
                    <p className={styles.statSub}>По всем участникам</p>
                </article>

                <article className={styles.statCard}>
                    <header className={styles.statHead}>
                        <p className={styles.statTitle}>Активные проблемы</p>
                        <span className={styles.statIconDanger} aria-hidden="true">
                            <WarningIcon />
                        </span>
                    </header>

                    <p className={styles.statValue}>{isSuccess ? activeProblems : "—"}</p>
                    <p className={styles.statSub}>Требуют внимания</p>
                </article>
            </section>

            {isError ? (
                <section className={styles.errorBox} role="alert">
                    <h3 className={styles.errorTitle}>Не удалось загрузить</h3>
                    <p className={styles.errorText}>{error}</p>
                    <button className={styles.retryBtn} type="button" onClick={onRetry}>
                        Повторить
                    </button>
                </section>
            ) : null}
        </section>
    );
}
