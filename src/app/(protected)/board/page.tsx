"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";

import { useToast } from "@/app/components/Toast/ToastProvider";
import { useSession } from "@/hooks/useSession";
import { ArrowLeftIcon } from "@/shared/ui/icons";
import { diseaseService } from "@/services/disease/disease.service";
import type { IDiseaseListEntry } from "@/services/disease/disease.types";

import { BoardCanvas } from "./components/BoardCanvas";
import { useBoard } from "./hooks/useBoard";
import styles from "./board.module.scss";

type IslandMenu = "disease" | "plan" | null;
type PickerItem = { id: string; title: string };

export default function BoardPage() {
  const params = useParams<{ boardId?: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const toast = useToast();
  const { initialized, loading, isAuth } = useSession();
  const islandRef = useRef<HTMLDivElement | null>(null);
  const [openMenu, setOpenMenu] = useState<IslandMenu>(null);
  const [diseasesWithPlans, setDiseasesWithPlans] = useState<IDiseaseListEntry[]>([]);
  const [menuLoading, setMenuLoading] = useState(false);

  const boardIdFromPath = typeof params?.boardId === "string" ? params.boardId.trim() : "";
  const boardIdFromQuery = searchParams.get("boardId")?.trim() ?? "";
  const boardId = boardIdFromPath || boardIdFromQuery;

  const {
    board,
    canvasRef,
    creatingTopic,
    draftTopic,
    draggingTopicId,
    error,
    links,
    loading: loadingBoard,
    onCanvasDoubleClick,
    onCanvasPointerDown,
    onDraftTopicCancel,
    onDraftTopicChange,
    onDraftTopicSubmit,
    createTopicFromPicker,
    onTopicClick,
    onTopicPointerCancel,
    onTopicPointerDown,
    onTopicPointerMove,
    onTopicPointerUp,
    pan,
    proximityConnectHint,
    relationships,
    savingPosition,
    selectedTopicId,
    setPan,
    setSelectedTopicId,
    setZoom,
    templateRootIds,
    topics,
    zoom,
  } = useBoard(boardId);

  useEffect(() => {
    if (!initialized) return;
    if (!isAuth) router.replace("/login");
  }, [initialized, isAuth, router]);

  useEffect(() => {
    if (!error) return;
    toast.error(error);
  }, [error, toast]);

  useEffect(() => {
    if (!initialized || !isAuth) return;

    let cancelled = false;

    const loadMenuData = async () => {
      try {
        setMenuLoading(true);
        const response = await diseaseService.getAll();
        if (cancelled) return;
        setDiseasesWithPlans(response ?? []);
      } catch {
        if (cancelled) return;
        toast.error("Не удалось загрузить болезни и планы лечения");
      } finally {
        if (!cancelled) setMenuLoading(false);
      }
    };

    void loadMenuData();

    return () => {
      cancelled = true;
    };
  }, [initialized, isAuth, toast]);

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      const root = islandRef.current;
      if (!root) return;

      const target = event.target as Node | null;
      if (target && root.contains(target)) return;

      setOpenMenu(null);
    };

    document.addEventListener("pointerdown", onPointerDown);

    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, []);

  useEffect(() => {
    if (!boardId) setOpenMenu(null);
  }, [boardId]);

  const diseaseMenuItems = useMemo<PickerItem[]>(() => {
    const dedup = new Map<string, PickerItem>();

    diseasesWithPlans.forEach((entry) => {
      const disease = entry?.disease;
      if (!disease?.id || dedup.has(disease.id)) return;
      dedup.set(disease.id, {
        id: disease.id,
        title: disease.title || "Без названия",
      });
    });

    return Array.from(dedup.values());
  }, [diseasesWithPlans]);

  const planMenuItems = useMemo<PickerItem[]>(() => {
    const dedup = new Map<string, PickerItem>();

    diseasesWithPlans.forEach((entry) => {
      const plan = entry?.plan;
      if (!plan?.id || dedup.has(plan.id)) return;
      dedup.set(plan.id, {
        id: plan.id,
        title: plan.title || "Без названия",
      });
    });

    return Array.from(dedup.values());
  }, [diseasesWithPlans]);

  const onPickItem = async (title: string) => {
    if (!boardId) {
      toast.error("Сначала откройте доску");
      return;
    }

    const created = await createTopicFromPicker(title);
    setOpenMenu(null);

    if (created) {
      toast.success(`Тема «${title}» добавлена`);
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
      <div className={styles.island} ref={islandRef}>
        <button type="button" className={styles.islandBackBtn} onClick={() => router.push("/main")}>
          <ArrowLeftIcon />
          <span>Назад</span>
        </button>

        <div className={styles.boardBadge}>
          {board ? `${board.title} • ${board.status} • v${board.version}` : "Разбор"}
        </div>

        <div className={styles.islandMenus}>
          <div
            className={`${styles.islandDropdown} ${styles.islandDropdownDisease} ${openMenu === "disease" ? styles.islandDropdownOpen : ""}`}
          >
            <button
              type="button"
              className={styles.islandDropdownToggle}
              onClick={() => setOpenMenu((prev) => (prev === "disease" ? null : "disease"))}
            >
              <span>Болезни</span>
            </button>

            <div className={styles.islandDropdownMenu}>
              {menuLoading && <div className={styles.islandDropdownEmpty}>Загрузка...</div>}
              {!menuLoading && diseaseMenuItems.length === 0 && (
                <div className={styles.islandDropdownEmpty}>Список болезней пуст</div>
              )}
              {!menuLoading &&
                diseaseMenuItems.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={styles.islandDropdownItem}
                    onClick={() => void onPickItem(item.title)}
                  >
                    {item.title}
                  </button>
                ))}
            </div>
          </div>

          <div
            className={`${styles.islandDropdown} ${styles.islandDropdownPlan} ${openMenu === "plan" ? styles.islandDropdownOpen : ""}`}
          >
            <button
              type="button"
              className={styles.islandDropdownToggle}
              onClick={() => setOpenMenu((prev) => (prev === "plan" ? null : "plan"))}
            >
              <span>План лечения</span>
            </button>

            <div className={styles.islandDropdownMenu}>
              {menuLoading && <div className={styles.islandDropdownEmpty}>Загрузка...</div>}
              {!menuLoading && planMenuItems.length === 0 && (
                <div className={styles.islandDropdownEmpty}>Список планов пуст</div>
              )}
              {!menuLoading &&
                planMenuItems.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={styles.islandDropdownItem}
                    onClick={() => void onPickItem(item.title)}
                  >
                    {item.title}
                  </button>
                ))}
            </div>
          </div>
        </div>
      </div>

      {!boardId ? (
        <div className={styles.canvas}>
          <div className={styles.emptyState}>Откройте доску из раздела «Разбор»</div>
        </div>
      ) : (
        <BoardCanvas
          canvasRef={canvasRef}
          creatingTopic={creatingTopic}
          draftTopic={draftTopic}
          draggingTopicId={draggingTopicId}
          links={links}
          loading={loadingBoard}
          onCanvasDoubleClick={onCanvasDoubleClick}
          onCanvasPointerDown={onCanvasPointerDown}
          onDraftTopicCancel={onDraftTopicCancel}
          onDraftTopicChange={onDraftTopicChange}
          onDraftTopicSubmit={onDraftTopicSubmit}
          onTopicClick={onTopicClick}
          onTopicPointerCancel={onTopicPointerCancel}
          onTopicPointerDown={onTopicPointerDown}
          onTopicPointerMove={onTopicPointerMove}
          onTopicPointerUp={onTopicPointerUp}
          pan={pan}
          proximityConnectHint={proximityConnectHint}
          relationships={relationships}
          rootTopicId={board?.rootTopicId ?? null}
          savingPosition={savingPosition}
          selectedTopicId={selectedTopicId}
          setPan={setPan}
          setSelectedTopicId={setSelectedTopicId}
          setZoom={setZoom}
          templateRootIds={templateRootIds}
          topics={topics}
          zoom={zoom}
        />
      )}
    </div>
  );
}
