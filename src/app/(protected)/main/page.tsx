"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import Header from "@/app/components/Header/Header";
import FloatingBurgerMenu from "@/app/components/FloatingBurgerMenu/FloatingBurgerMenu";
import { useToast } from "@/app/components/Toast/ToastProvider";
import { useSession } from "@/hooks/useSession";
import {
  ActivityDiaryIcon,
  AnalysisIcon,
  BusinesAnatomyIcon,
  DiseaseLibraryIcon,
  MyProgressIcon,
  ParticipantsIcon,
} from "@/shared/ui/icons";
import { Tablet, Role, TabKey } from "@/app/components/Tablet/Tablet";
import BusinessAnatomy from "@/app/(protected)/main/components/BusinessAnatomy/BusinessAnatomy";
import MyProgress from "@/app/(protected)/main/components/MyProgress/MyProgress";
import ActivityDiary from "@/app/(protected)/main/components/ActivityDiary/ActivityDiary";
import DiseaseLibrary from "@/app/(protected)/main/components/DiseaseLibrary/DiseaseLibrary";
import Participants from "@/app/(protected)/main/components/Participants/Participants";
import { createBoard, getBoardSnapshot } from "@/app/(protected)/board/api/boards";
import {
  AnalysisBoardsProvider,
  useAnalysisBoards,
} from "@/app/(protected)/main/context/AnalysisBoardsContext";

import styles from "./main.module.scss";

export default function MainPage() {
  return (
    <AnalysisBoardsProvider>
      <MainPageContent />
    </AnalysisBoardsProvider>
  );
}

function MainPageContent() {
  const router = useRouter();
  const toast = useToast();
  const { initialized, loading, isAuth, logout, user } = useSession();
  const [creatingBoard, setCreatingBoard] = useState(false);
  const [openingBoardId, setOpeningBoardId] = useState<string | null>(null);
  const analysisScrollRef = useRef<HTMLDivElement | null>(null);
  const analysisSentinelRef = useRef<HTMLDivElement | null>(null);

  const {
    boards: analysisBoards,
    hasMore: analysisBoardsHasMore,
    loading: analysisBoardsLoading,
    ensureLoaded,
    loadMore,
    prependBoard,
  } = useAnalysisBoards();

  const role: Role =
    user?.role === "admin" || user?.role === "moderator" ? user.role : "participant";

  const tabsByRole: Record<
    Role,
    readonly {
      key: TabKey;
      label: string;
      icon: React.FC<React.SVGProps<SVGSVGElement>>;
    }[]
  > = {
    participant: [
      { key: "anatomy", label: "Анатомия Бизнеса", icon: BusinesAnatomyIcon },
      { key: "progress", label: "Мой прогресс", icon: MyProgressIcon },
      { key: "diary", label: "Дневник активности", icon: ActivityDiaryIcon },
    ],
    moderator: [
      { key: "anatomy", label: "Анатомия Бизнеса", icon: BusinesAnatomyIcon },
      { key: "library", label: "Библиотека Болезней", icon: DiseaseLibraryIcon },
      { key: "participants", label: "Участники", icon: ParticipantsIcon },
      { key: "analysis", label: "Разбор", icon: AnalysisIcon },
    ],
    admin: [
      { key: "anatomy", label: "Анатомия Бизнеса", icon: BusinesAnatomyIcon },
      { key: "library", label: "Библиотека Болезней", icon: DiseaseLibraryIcon },
      { key: "participants", label: "Участники", icon: ParticipantsIcon },
    ],
  };

  const availableTabs = tabsByRole[role];
  const [tab, setTab] = useState<TabKey>(availableTabs[0].key);
  const safeTab = availableTabs.some((item) => item.key === tab) ? tab : availableTabs[0].key;

  useEffect(() => {
    if (!initialized) return;
    if (!isAuth) router.replace("/login");
  }, [initialized, isAuth, router]);

  useEffect(() => {
    if (!initialized || !isAuth) return;
    if (safeTab !== "analysis") return;

    void (async () => {
      try {
        await ensureLoaded();
      } catch {
        toast.error("Не удалось загрузить доски");
      }
    })();
  }, [initialized, isAuth, safeTab, ensureLoaded, toast]);

  useEffect(() => {
    if (safeTab !== "analysis") return;
    if (!analysisBoardsHasMore) return;

    const root = analysisScrollRef.current;
    const target = analysisSentinelRef.current;

    if (!root || !target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const isIntersecting = entries.some((entry) => entry.isIntersecting);
        if (!isIntersecting) return;
        loadMore();
      },
      {
        root,
        rootMargin: "0px 0px 220px 0px",
      }
    );

    observer.observe(target);

    return () => {
      observer.disconnect();
    };
  }, [safeTab, analysisBoardsHasMore, analysisBoards.length, loadMore]);

  const onCreateBoard = async () => {
    if (creatingBoard) return;

    const now = new Date();
    const title = `Новая доска ${now.toLocaleString("ru-RU")}`;

    try {
      setCreatingBoard(true);

      const response = await createBoard({
        direction: "right",
        layoutType: "radial",
        status: "ACTIVE",
        title,
      });

      const boardId = response.id;

      if (!boardId) {
        toast.error("Доска создана, но не получен идентификатор");
        return;
      }

      toast.success("Доска создана");
      prependBoard(response);
      router.push(`/board/${encodeURIComponent(boardId)}`);
    } catch {
      toast.error("Не удалось создать доску");
    } finally {
      setCreatingBoard(false);
    }
  };

  const onOpenBoard = async (boardId: string) => {
    if (openingBoardId || creatingBoard) return;

    try {
      setOpeningBoardId(boardId);
      const response = await getBoardSnapshot(boardId);
      const targetBoardId = response.board?.id ?? boardId;
      router.push(`/board/${encodeURIComponent(targetBoardId)}`);
    } catch {
      toast.error("Не удалось открыть доску");
    } finally {
      setOpeningBoardId(null);
    }
  };

  if (!initialized || loading) {
    return (
      <div className={styles.loader}>
        <div className={styles.spinner} />
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <Header user={user ?? null} onLogout={logout} />

      <main className={styles.main}>
        <div className={`${styles.container} ${safeTab === "analysis" ? styles.containerLong : ""}`}>
          <div className={styles.tabletWrap}>
            <Tablet role={role} tabsByRole={tabsByRole} value={safeTab} onChange={setTab} />
          </div>

          {safeTab === "analysis" ? (
            <section className={styles.contentPlain}>
              <div className={styles.analysisBlock}>
                <div className={styles.analysisToolbar}>
                  <button
                    type="button"
                    className={styles.analysisAddBtn}
                    onClick={() => void onCreateBoard()}
                    disabled={creatingBoard}
                  >
                    {creatingBoard ? "Создание..." : "Добавить доску"}
                  </button>
                </div>

                <div className={styles.analysisScroll} ref={analysisScrollRef}>
                  {analysisBoardsLoading && analysisBoards.length === 0 && (
                    <div className={styles.analysisState}>Загрузка досок...</div>
                  )}

                  {!analysisBoardsLoading && analysisBoards.length === 0 && (
                    <div className={styles.analysisState}>Досок пока нет</div>
                  )}

                  {analysisBoards.length > 0 && (
                    <>
                      <div className={styles.analysisBoards}>
                        {analysisBoards.map((board) => {
                          const isOpening = openingBoardId === board.id;

                          return (
                            <button
                              key={board.id}
                              type="button"
                              className={`${styles.analysisBoard} ${isOpening ? styles.analysisBoardLoading : ""}`}
                              onClick={() => void onOpenBoard(board.id)}
                            >
                              {isOpening && (
                                <div className={styles.analysisBoardOverlay}>Открытие...</div>
                              )}

                              <div className={styles.analysisMap}>
                                <div className={styles.analysisMapCore}>
                                  {board.title || "Без названия"}
                                </div>
                              </div>

                              <div className={styles.analysisMeta}>
                                <span>{board.status}</span>
                                <span>v{board.version}</span>
                              </div>
                            </button>
                          );
                        })}
                      </div>

                      {analysisBoardsHasMore && (
                        <>
                          <div ref={analysisSentinelRef} className={styles.analysisSentinel} />
                          <div className={styles.analysisLoadMore}>Подгружаем доски...</div>
                        </>
                      )}
                    </>
                  )}
                </div>
              </div>
            </section>
          ) : (
            <section className={styles.content}>
              {safeTab === "anatomy" && <BusinessAnatomy />}
              {safeTab === "progress" && <MyProgress />}
              {safeTab === "diary" && <ActivityDiary />}
              {safeTab === "library" && <DiseaseLibrary />}
              {safeTab === "participants" && <Participants />}
            </section>
          )}
        </div>
      </main>

      <FloatingBurgerMenu
        role={role}
        position="left"
        showBack={false}
        showPersonal={true}
        showAdmin={true}
        onPersonal={() => router.push("/profile")}
        onAdmin={() => router.push("/admin")}
      />
    </div>
  );
}
