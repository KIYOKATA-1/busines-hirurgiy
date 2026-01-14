"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { useSession } from "@/hooks/useSession";
import { adminService } from "@/services/admin/admin.service";
import type { IAdminUserListItem, IAdminUsersResponse } from "@/services/admin/admin.types";

import { EditIcon } from "@/shared/ui/icons/EditIcon";

import FloatingBurgerMenu from "@/app/components/FloatingBurgerMenu/FloatingBurgerMenu";
import type { Role } from "@/app/components/Tablet/Tablet";

import styles from "./admin.module.scss";
import EditUserRolesModal from "@/app/components/EditUserRolesModal/EditUserRolesModal";

type LoadState = "idle" | "loading" | "success" | "error";

const LIMIT = 20;

function safeInt(v: string | null, fallback: number) {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : fallback;
}

function clampOffset(v: number) {
  if (!Number.isFinite(v) || v < 0) return 0;
  return Math.floor(v);
}

export default function AdminPage() {
  const router = useRouter();
  const sp = useSearchParams();

  const { initialized, loading: sessionLoading, isAuth, user } = useSession();

  const qFromUrl = sp.get("q") ?? "";
  const offsetFromUrl = clampOffset(safeInt(sp.get("offset"), 0));

  const [q, setQ] = useState(qFromUrl);
  const [loadState, setLoadState] = useState<LoadState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<IAdminUsersResponse | null>(null);
  const [refreshTick, setRefreshTick] = useState(0);

  const [rolesOpen, setRolesOpen] = useState(false);
  const [activeUser, setActiveUser] = useState<IAdminUserListItem | null>(null);

  const roleStr = user?.role ?? "";
  const isAdmin = roleStr === "admin";

  useEffect(() => {
    setQ(qFromUrl);
  }, [qFromUrl]);

  useEffect(() => {
    if (!initialized) return;
    if (sessionLoading) return;

    if (!isAuth) {
      router.replace("/login");
      return;
    }

    if (!isAdmin) {
      router.replace("/main");
      return;
    }
  }, [initialized, sessionLoading, isAuth, isAdmin, router]);

  const urlSync = (next: { q?: string; offset?: number }) => {
    const params = new URLSearchParams(sp.toString());

    if (typeof next.q === "string") {
      const v = next.q.trim();
      if (v) params.set("q", v);
      else params.delete("q");
    }

    if (typeof next.offset === "number") {
      const o = clampOffset(next.offset);
      if (o > 0) params.set("offset", String(o));
      else params.delete("offset");
    }

    const qs = params.toString();
    router.replace(qs ? `/admin?${qs}` : "/admin");
  };

  useEffect(() => {
    if (!initialized || sessionLoading) return;
    if (!isAuth || !isAdmin) return;

    let cancelled = false;

    (async () => {
      try {
        setLoadState("loading");
        setError(null);

        const res = await adminService.getUsers({
          q: qFromUrl || undefined,
          limit: LIMIT,
          offset: offsetFromUrl,
        });

        if (cancelled) return;

        setData(res);
        setLoadState("success");
      } catch (e: any) {
        if (cancelled) return;
        setLoadState("error");
        setError(e?.response?.data?.error || e?.message || "Ошибка загрузки");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [initialized, sessionLoading, isAuth, isAdmin, qFromUrl, offsetFromUrl, refreshTick]);

  const items = useMemo(() => data?.items ?? [], [data]);

  const total = data?.total ?? 0;
  const from = total === 0 ? 0 : offsetFromUrl + 1;
  const to = total === 0 ? 0 : Math.min(offsetFromUrl + LIMIT, total);

  const canPrev = offsetFromUrl > 0;
  const canNext = offsetFromUrl + LIMIT < total;

  const openRoles = (u: IAdminUserListItem) => {
    setActiveUser(u);
    setRolesOpen(true);
  };

  const closeRoles = () => {
    setRolesOpen(false);
    setActiveUser(null);
  };

  const onBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/main");
    }
  };

  const onPersonal = () => {
    router.push("/main");
  };

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <section className={styles.titleBlock}>
          <h1>Админ панель</h1>
          <p>Управление пользователями</p>
        </section>

        <section className={styles.toolbar} aria-label="Панель управления">
          <form
            className={styles.searchForm}
            onSubmit={(e) => {
              e.preventDefault();
              urlSync({ q, offset: 0 });
            }}
          >
            <label className={styles.searchLabel}>
              <span>Поиск</span>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="email / имя / фамилия"
              />
            </label>

            <div className={styles.actions}>
              <button type="submit" className={styles.primaryBtn} disabled={loadState === "loading"}>
                Найти
              </button>

              <button
                type="button"
                className={styles.secondaryBtn}
                onClick={() => urlSync({ q: "", offset: 0 })}
                disabled={loadState === "loading"}
              >
                Сброс
              </button>

              <button
                type="button"
                className={styles.secondaryBtn}
                onClick={() => setRefreshTick((v) => v + 1)}
                disabled={loadState === "loading"}
              >
                Обновить
              </button>
            </div>
          </form>
        </section>
      </header>

      <section className={styles.card} aria-label="Список пользователей">
        <div className={styles.cardTop}>
          <p className={styles.summary}>
            {total > 0 ? (
              <>
                Показано <b>{from}</b>–<b>{to}</b> из <b>{total}</b>
              </>
            ) : (
              <>Нет данных</>
            )}
          </p>

          <nav className={styles.pager} aria-label="Пагинация">
            <button
              type="button"
              className={styles.pageBtn}
              onClick={() => urlSync({ offset: Math.max(0, offsetFromUrl - LIMIT) })}
              disabled={!canPrev || loadState === "loading"}
            >
              Назад
            </button>

            <button
              type="button"
              className={styles.pageBtn}
              onClick={() => urlSync({ offset: offsetFromUrl + LIMIT })}
              disabled={!canNext || loadState === "loading"}
            >
              Вперёд
            </button>
          </nav>
        </div>

        {loadState === "loading" && (
          <div className={styles.loading}>
            <div className="spinner" />
            <p>Загрузка пользователей…</p>
          </div>
        )}

        {loadState === "error" && (
          <div className={styles.stateError}>
            <h2>Ошибка</h2>
            <p>{error}</p>
            <button
              className={styles.primaryBtn}
              type="button"
              onClick={() => setRefreshTick((v) => v + 1)}
            >
              Повторить
            </button>
          </div>
        )}

        {loadState !== "loading" && loadState !== "error" && items.length === 0 && (
          <p className={styles.empty}>Пользователи не найдены</p>
        )}

        {items.length > 0 && (
          <div className={styles.tableWrap}>
            <table>
              <thead>
                <tr>
                  <th>Пользователь</th>
                  <th>Email</th>
                  <th>Роль</th>
                  <th>ID</th>
                </tr>
              </thead>

              <tbody>
                {items.map((u) => (
                  <tr key={u.id}>
                    <td className={styles.userCell}>
                      <p className={styles.userName}>
                        {u.name} {u.surname}
                      </p>
                    </td>

                    <td className={styles.mono}>{u.email}</td>

                    <td className={styles.rolesCell}>
                      <div className={styles.roles}>
                        {(u.roles || []).map((r) => (
                          <span key={r} className={styles.rolePill}>
                            {r}
                          </span>
                        ))}
                      </div>

                      <button
                        type="button"
                        className={styles.iconBtn}
                        onClick={() => openRoles(u)}
                        aria-label="Изменить роль"
                        title="Изменить роль"
                      >
                        <EditIcon />
                      </button>
                    </td>

                    <td className={styles.mono}>{u.id}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {activeUser && (
        <EditUserRolesModal
          open={rolesOpen}
          userId={activeUser.id}
          userEmail={activeUser.email}
          userName={`${activeUser.name} ${activeUser.surname}`}
          onClose={closeRoles}
          onChanged={() => setRefreshTick((v) => v + 1)}
        />
      )}

      <FloatingBurgerMenu
        role={(roleStr as Role) || ("participant" as Role)}
        position="left"
        showBack
        showPersonal
        showAdmin={false}
        backLabel="Назад"
        personalLabel="Личный кабинет"
        onBack={onBack}
        onPersonal={onPersonal}
      />
    </main>
  );
}
