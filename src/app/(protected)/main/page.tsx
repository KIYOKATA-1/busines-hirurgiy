"use client";

import React, { useCallback, useEffect, useState } from "react";
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
import { createBoard, getBoardSnapshot, getBoards } from "@/app/(protected)/board/api/boards";
import type { BoardListItem } from "@/app/(protected)/board/types";

import styles from "./main.module.scss";

export default function MainPage() {
  const router = useRouter();
  const toast = useToast();
  const { initialized, loading, isAuth, logout, user } = useSession();
  const [creatingBoard, setCreatingBoard] = useState(false);
  const [analysisBoards, setAnalysisBoards] = useState<BoardListItem[]>([]);
  const [analysisBoardsLoading, setAnalysisBoardsLoading] = useState(false);
  const [openingBoardId, setOpeningBoardId] = useState<string | null>(null);

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

  const loadAnalysisBoards = useCallback(async () => {
    try {
      setAnalysisBoardsLoading(true);
      const response = await getBoards();
      setAnalysisBoards(response ?? []);
    } catch {
      toast.error("Не удалось загрузить доски");
    } finally {
      setAnalysisBoardsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (!initialized || !isAuth) return;
    if (safeTab !== "analysis") return;
    void loadAnalysisBoards();
  }, [initialized, isAuth, safeTab, loadAnalysisBoards]);

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
      setAnalysisBoards((prev) => {
        const next = prev.filter((item) => item.id !== response.id);
        return [response, ...next];
      });
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

                {analysisBoardsLoading && analysisBoards.length === 0 && (
                  <div className={styles.analysisState}>Загрузка досок...</div>
                )}

                {!analysisBoardsLoading && analysisBoards.length === 0 && (
                  <div className={styles.analysisState}>Досок пока нет</div>
                )}

                {analysisBoards.length > 0 && (
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
                          {isOpening && <div className={styles.analysisBoardOverlay}>Открытие...</div>}

                          <div className={styles.analysisMap}>
                            <div className={styles.analysisMapCore}>{board.title || "Без названия"}</div>
                          </div>

                          <div className={styles.analysisMeta}>
                            <span>{board.status}</span>
                            <span>v{board.version}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
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
