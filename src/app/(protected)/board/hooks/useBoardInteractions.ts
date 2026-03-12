import {
  MouseEvent,
  PointerEvent as ReactPointerEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { boardService } from "@/services/board/board.service";
import type { IBoardTopic, ICanvasPoint } from "@/services/board/board.types";

import { screenToCanvas } from "../utils/screenToCanvas";

type TopicPartial = Partial<Pick<IBoardTopic, "x" | "y" | "width" | "height" | "title">>;

export type TopicsStoreApi = {
  add: (topic: IBoardTopic) => void;
  patch: (id: string, partial: TopicPartial) => void;
  get: (id: string) => IBoardTopic | undefined;
  upsert: (topic: IBoardTopic) => void;
};

export type BoardStoreApi = {
  setVersion: (version: number) => void;
};

type DragState = {
  initialTopicPosition: ICanvasPoint;
  pointerId: number;
  startPointerCanvas: ICanvasPoint;
  topicId: string;
  moved: boolean;
};

type UseBoardInteractionsParams = {
  boardId: string;
  rootTopicId: string | null | undefined;
  pan: ICanvasPoint;
  zoom: number;
  getCanvasRect: () => DOMRect | null;
  topicsStore: TopicsStoreApi;
  boardStore: BoardStoreApi;
  defaultTopicTitle?: string;
  defaultTopicWidth?: number;
  defaultTopicHeight?: number;
  onTopicCreated?: (topic: IBoardTopic) => void;
  onError?: (message: string) => void;
};

function useLatestRef<T>(value: T) {
  const ref = useRef(value);
  useEffect(() => {
    ref.current = value;
  }, [value]);
  return ref;
}

export function useBoardInteractions({
  boardId,
  rootTopicId,
  pan,
  zoom,
  getCanvasRect,
  topicsStore,
  boardStore,
  defaultTopicTitle = "",
  defaultTopicWidth = 180,
  defaultTopicHeight = 54,
  onTopicCreated,
  onError,
}: UseBoardInteractionsParams) {
  const [creatingTopic, setCreatingTopic] = useState(false);
  const [savingTopicPosition, setSavingTopicPosition] = useState(false);
  const [draggingTopicId, setDraggingTopicId] = useState<string | null>(null);

  const boardIdRef = useLatestRef(boardId);
  const rootTopicIdRef = useLatestRef(rootTopicId);
  const panRef = useLatestRef(pan);
  const zoomRef = useLatestRef(zoom);
  const getCanvasRectRef = useLatestRef(getCanvasRect);
  const topicsStoreRef = useLatestRef(topicsStore);
  const boardStoreRef = useLatestRef(boardStore);
  const onTopicCreatedRef = useLatestRef(onTopicCreated);
  const onErrorRef = useLatestRef(onError);
  const defaultTopicTitleRef = useLatestRef(defaultTopicTitle);
  const defaultTopicWidthRef = useLatestRef(defaultTopicWidth);
  const defaultTopicHeightRef = useLatestRef(defaultTopicHeight);

  const dragRef = useRef<DragState | null>(null);

  const createTopicAt = useCallback(async (screenClientX: number, screenClientY: number) => {
    const currentBoardId = boardIdRef.current;
    const currentRootTopicId = rootTopicIdRef.current;
    if (!currentBoardId || !currentRootTopicId) return;

    const canvasRect = getCanvasRectRef.current();
    if (!canvasRect) return;

    const localClientX = screenClientX - canvasRect.left;
    const localClientY = screenClientY - canvasRect.top;
    const clientPoint = screenToCanvas(localClientX, localClientY, panRef.current, zoomRef.current);

    try {
      setCreatingTopic(true);

      const response = await boardService.createTopic(currentBoardId, {
        clientPoint,
        height: defaultTopicHeightRef.current,
        title: defaultTopicTitleRef.current,
        width: defaultTopicWidthRef.current,
      });

      topicsStoreRef.current.add(response.topic);
      boardStoreRef.current.setVersion(response.version);
      onTopicCreatedRef.current?.(response.topic);
    } catch {
      onErrorRef.current?.("Не удалось создать тему");
    } finally {
      setCreatingTopic(false);
    }
  }, [
    boardIdRef,
    boardStoreRef,
    defaultTopicHeightRef,
    defaultTopicTitleRef,
    defaultTopicWidthRef,
    getCanvasRectRef,
    onErrorRef,
    onTopicCreatedRef,
    panRef,
    rootTopicIdRef,
    topicsStoreRef,
    zoomRef,
  ]);

  const onCanvasDoubleClick = useCallback((event: MouseEvent<HTMLElement>) => {
    const target = event.target as HTMLElement | null;
    if (target?.closest("[data-topic-id]")) return;
    if (creatingTopic) return;

    void createTopicAt(event.clientX, event.clientY);
  }, [createTopicAt, creatingTopic]);

  const onTopicPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLElement>, topicId: string) => {
      if (!boardIdRef.current || creatingTopic || savingTopicPosition) return;
      if (event.button !== 0) return;

      const topic = topicsStoreRef.current.get(topicId);
      if (!topic) return;

      const canvasRect = getCanvasRectRef.current();
      if (!canvasRect) return;

      const localClientX = event.clientX - canvasRect.left;
      const localClientY = event.clientY - canvasRect.top;
      const pointerCanvas = screenToCanvas(localClientX, localClientY, panRef.current, zoomRef.current);

      dragRef.current = {
        initialTopicPosition: { x: topic.x, y: topic.y },
        moved: false,
        pointerId: event.pointerId,
        startPointerCanvas: pointerCanvas,
        topicId,
      };

      setDraggingTopicId(topicId);

      event.preventDefault();
      event.stopPropagation();

      try {
        event.currentTarget.setPointerCapture(event.pointerId);
      } catch {
        dragRef.current = null;
        setDraggingTopicId(null);
      }
    },
    [
      boardIdRef,
      creatingTopic,
      getCanvasRectRef,
      panRef,
      savingTopicPosition,
      topicsStoreRef,
      zoomRef,
    ]
  );

  const onTopicPointerMove = useCallback((event: ReactPointerEvent<HTMLElement>) => {
    const drag = dragRef.current;
    if (!drag) return;
    if (event.pointerId !== drag.pointerId) return;

    const canvasRect = getCanvasRectRef.current();
    if (!canvasRect) return;

    const localClientX = event.clientX - canvasRect.left;
    const localClientY = event.clientY - canvasRect.top;
    const pointerCanvas = screenToCanvas(localClientX, localClientY, panRef.current, zoomRef.current);
    const dx = pointerCanvas.x - drag.startPointerCanvas.x;
    const dy = pointerCanvas.y - drag.startPointerCanvas.y;

    if (Math.abs(dx) > 0.001 || Math.abs(dy) > 0.001) {
      drag.moved = true;
    }

    topicsStoreRef.current.patch(drag.topicId, {
      x: drag.initialTopicPosition.x + dx,
      y: drag.initialTopicPosition.y + dy,
    });

    event.preventDefault();
  }, [getCanvasRectRef, panRef, topicsStoreRef, zoomRef]);

  const finishDrag = useCallback(async (event: ReactPointerEvent<HTMLElement>, persist: boolean) => {
    const drag = dragRef.current;
    if (!drag) return;
    if (event.pointerId !== drag.pointerId) return;

    dragRef.current = null;
    setDraggingTopicId(null);

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    event.preventDefault();

    if (!persist) {
      topicsStoreRef.current.patch(drag.topicId, drag.initialTopicPosition);
      return;
    }

    if (!drag.moved) return;

    const currentTopic = topicsStoreRef.current.get(drag.topicId);
    if (!currentTopic) return;

    try {
      setSavingTopicPosition(true);

      const response = await boardService.updateTopic(drag.topicId, {
        x: currentTopic.x,
        y: currentTopic.y,
      });

      topicsStoreRef.current.upsert(response.topic);
      boardStoreRef.current.setVersion(response.version);
    } catch {
      topicsStoreRef.current.patch(drag.topicId, drag.initialTopicPosition);
      onErrorRef.current?.("Не удалось сохранить позицию темы");
    } finally {
      setSavingTopicPosition(false);
    }
  }, [boardStoreRef, onErrorRef, topicsStoreRef]);

  const onTopicPointerUp = useCallback((event: ReactPointerEvent<HTMLElement>) => {
    void finishDrag(event, true);
  }, [finishDrag]);

  const onTopicPointerCancel = useCallback((event: ReactPointerEvent<HTMLElement>) => {
    void finishDrag(event, false);
  }, [finishDrag]);

  return {
    creatingTopic,
    draggingTopicId,
    onCanvasDoubleClick,
    onTopicPointerCancel,
    onTopicPointerDown,
    onTopicPointerMove,
    onTopicPointerUp,
    savingTopicPosition,
  };
}
