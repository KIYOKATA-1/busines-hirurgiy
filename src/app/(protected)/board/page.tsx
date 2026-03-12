"use client";

import { useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";

import { useToast } from "@/app/components/Toast/ToastProvider";
import { useSession } from "@/hooks/useSession";
import { ArrowLeftIcon } from "@/shared/ui/icons";

import { BoardCanvas } from "./components/BoardCanvas";
import { useBoard } from "./hooks/useBoard";
import styles from "./board.module.scss";

export default function BoardPage() {
  const params = useParams<{ boardId?: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const toast = useToast();
  const { initialized, loading, isAuth } = useSession();

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

  if (!initialized || loading) {
    return (
      <div className={styles.loader}>
        <div className={styles.spinner} />
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.island}>
        <button type="button" className={styles.islandBackBtn} onClick={() => router.push("/main")}>
          <ArrowLeftIcon />
          <span>Назад</span>
        </button>

        <div className={styles.boardBadge}>
          {board ? `${board.title} • ${board.status} • v${board.version}` : "Разбор"}
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
