"use client";

import React, { useCallback, useMemo, useRef, useState } from "react";

import type { CanvasPoint, Link, Relationship, Topic } from "../types";
import { canvasToScreen } from "../utils/canvasToScreen";
import { screenToCanvas } from "../utils/screenToCanvas";
import styles from "../board.module.scss";

const MIN_ZOOM = 0.2;
const MAX_ZOOM = 2.5;
const GRID_STEP = 24;
const FIT_PADDING = 120;
const FIT_MAX_ZOOM = 1;

type PanStateSetter = React.Dispatch<React.SetStateAction<CanvasPoint>>;
type ZoomStateSetter = React.Dispatch<React.SetStateAction<number>>;

type PanDragState = {
  pointerId: number;
  startClientX: number;
  startClientY: number;
  startPan: CanvasPoint;
};

type Props = {
  canvasRef: React.RefObject<HTMLDivElement | null>;
  creatingTopic: boolean;
  draftTopic: {
    clientPoint: CanvasPoint;
    height: number;
    isRoot: boolean;
    title: string;
    width: number;
  } | null;
  draggingTopicId: string | null;
  links: Link[];
  loading: boolean;
  onCanvasDoubleClick: (event: React.MouseEvent<HTMLDivElement>) => void;
  onCanvasPointerDown: (event: React.PointerEvent<HTMLDivElement>) => void;
  onDraftTopicCancel: () => void;
  onDraftTopicChange: (title: string) => void;
  onDraftTopicSubmit: () => void;
  onTopicClick: (topicId: string) => void;
  onTopicPointerCancel: (event: React.PointerEvent<HTMLDivElement>) => void;
  onTopicPointerDown: (event: React.PointerEvent<HTMLDivElement>, topicId: string) => void;
  onTopicPointerMove: (event: React.PointerEvent<HTMLDivElement>) => void;
  onTopicPointerUp: (event: React.PointerEvent<HTMLDivElement>) => void;
  pan: CanvasPoint;
  proximityConnectHint: { childTopicId: string; parentTopicId: string } | null;
  relationships: Relationship[];
  rootTopicId: string | null;
  savingPosition: boolean;
  selectedTopicId: string | null;
  setPan: PanStateSetter;
  setSelectedTopicId: (id: string | null) => void;
  setZoom: ZoomStateSetter;
  templateRootIds: string[];
  topics: Record<string, Topic>;
  zoom: number;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function getTopicEdgeAnchor(topic: Topic, toward: CanvasPoint): CanvasPoint {
  const cx = topic.x;
  const cy = topic.y;
  const halfW = Math.max(topic.width / 2, 1);
  const halfH = Math.max(topic.height / 2, 1);
  const dx = toward.x - cx;
  const dy = toward.y - cy;

  if (Math.abs(dx) < 0.0001 && Math.abs(dy) < 0.0001) {
    return { x: cx + halfW, y: cy };
  }

  const scale = 1 / Math.max(Math.abs(dx) / halfW, Math.abs(dy) / halfH);

  return {
    x: cx + dx * scale,
    y: cy + dy * scale,
  };
}

export function BoardCanvas({
  canvasRef,
  creatingTopic,
  draftTopic,
  draggingTopicId,
  links,
  loading,
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
  rootTopicId,
  savingPosition,
  selectedTopicId,
  setPan,
  setSelectedTopicId,
  setZoom,
  templateRootIds,
  topics,
  zoom,
}: Props) {
  const topicMap = topics;
  const topicList = useMemo(() => Object.values(topicMap), [topicMap]);
  const templateRootIdSet = useMemo(() => new Set(templateRootIds), [templateRootIds]);
  const [isPanning, setIsPanning] = useState(false);
  const panDragRef = useRef<PanDragState | null>(null);

  const topicBounds = useMemo(() => {
    if (topicList.length === 0) return null;

    return topicList.reduce(
      (acc, topic) => {
        const left = topic.x - topic.width / 2;
        const right = topic.x + topic.width / 2;
        const top = topic.y - topic.height / 2;
        const bottom = topic.y + topic.height / 2;

        return {
          maxX: Math.max(acc.maxX, right),
          maxY: Math.max(acc.maxY, bottom),
          minX: Math.min(acc.minX, left),
          minY: Math.min(acc.minY, top),
        };
      },
      {
        maxX: Number.NEGATIVE_INFINITY,
        maxY: Number.NEGATIVE_INFINITY,
        minX: Number.POSITIVE_INFINITY,
        minY: Number.POSITIVE_INFINITY,
      }
    );
  }, [topicList]);

  const rootSectionDividers = useMemo(() => {
    if (!topicBounds) return [];

    const templateRootTopics = templateRootIds
      .map((id) => topicMap[id])
      .filter((topic): topic is Topic => Boolean(topic))
      .sort((a, b) => a.y - b.y);

    if (templateRootTopics.length < 2) return [];

    const horizontalPadding = 360;
    const x1 = topicBounds.minX - horizontalPadding;
    const x2 = topicBounds.maxX + horizontalPadding;

    return templateRootTopics.slice(0, -1).map((topic, index) => ({
      id: `${topic.id}-${templateRootTopics[index + 1].id}`,
      y: (topic.y + templateRootTopics[index + 1].y) / 2,
      x1,
      x2,
    }));
  }, [templateRootIds, topicBounds, topicMap]);

  const treeLines = useMemo(() => {
    return links
      .map((link) => {
        const parent = topicMap[link.parentTopicId];
        const child = topicMap[link.childTopicId];
        if (!parent || !child) return null;

        const distance = Math.abs(child.x - parent.x);
        const curve = Math.max(48, distance * 0.35);
        const c1x = parent.x + (child.x >= parent.x ? curve : -curve);
        const c2x = child.x - (child.x >= parent.x ? curve : -curve);

        return {
          id: link.id,
          path: `M ${parent.x} ${parent.y} C ${c1x} ${parent.y}, ${c2x} ${child.y}, ${child.x} ${child.y}`,
        };
      })
      .filter(Boolean) as Array<{ id: string; path: string }>;
  }, [links, topicMap]);

  const relationLines = useMemo(() => {
    return relationships
      .map((relationship) => {
        const source = topicMap[relationship.sourceTopicId];
        const target = topicMap[relationship.targetTopicId];
        if (!source || !target) return null;

        return {
          id: relationship.id,
          x1: source.x,
          x2: target.x,
          y1: source.y,
          y2: target.y,
        };
      })
      .filter(Boolean) as Array<{ id: string; x1: number; x2: number; y1: number; y2: number }>;
  }, [relationships, topicMap]);

  const connectPreviewPath = useMemo(() => {
    if (!proximityConnectHint) return null;

    const parent = topicMap[proximityConnectHint.parentTopicId];
    const child = topicMap[proximityConnectHint.childTopicId];
    if (!parent || !child) return null;

    const start = getTopicEdgeAnchor(parent, { x: child.x, y: child.y });
    const end = getTopicEdgeAnchor(child, { x: parent.x, y: parent.y });
    const vx = end.x - start.x;
    const vy = end.y - start.y;
    const length = Math.hypot(vx, vy) || 1;
    const curve = clamp(length * 0.3, 32, 120);
    const ux = vx / length;
    const uy = vy / length;
    const c1x = start.x + ux * curve;
    const c1y = start.y + uy * curve;
    const c2x = end.x - ux * curve;
    const c2y = end.y - uy * curve;

    return `M ${start.x} ${start.y} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${end.x} ${end.y}`;
  }, [proximityConnectHint, topicMap]);

  const statusText = creatingTopic
    ? "Создание темы..."
    : draftTopic
      ? "Введите название в блоке и нажмите Enter"
    : savingPosition
      ? "Сохранение позиции..."
      : proximityConnectHint
        ? "Подсказка: отпустите узел для соединения"
      : null;

  const gridSize = Math.max(8, GRID_STEP * zoom);
  const gridOffsetX = ((pan.x % gridSize) + gridSize) % gridSize;
  const gridOffsetY = ((pan.y % gridSize) + gridSize) % gridSize;

  const onViewportPointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      onCanvasPointerDown(event);

      if (event.button !== 0) return;

      const target = event.target as HTMLElement | null;
      if (target?.closest("[data-topic-id]")) return;
      if (target?.closest("[data-board-control]")) return;

      panDragRef.current = {
        pointerId: event.pointerId,
        startClientX: event.clientX,
        startClientY: event.clientY,
        startPan: pan,
      };

      setIsPanning(true);
      event.preventDefault();

      try {
        event.currentTarget.setPointerCapture(event.pointerId);
      } catch {
        panDragRef.current = null;
        setIsPanning(false);
      }
    },
    [onCanvasPointerDown, pan]
  );

  const onViewportPointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const panDrag = panDragRef.current;
      if (!panDrag || event.pointerId !== panDrag.pointerId) return;

      const dx = event.clientX - panDrag.startClientX;
      const dy = event.clientY - panDrag.startClientY;

      setPan({
        x: panDrag.startPan.x + dx,
        y: panDrag.startPan.y + dy,
      });

      event.preventDefault();
    },
    [setPan]
  );

  const stopPan = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    const panDrag = panDragRef.current;
    if (!panDrag || event.pointerId !== panDrag.pointerId) return;

    panDragRef.current = null;
    setIsPanning(false);

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }, []);

  const onViewportWheel = useCallback(
    (event: React.WheelEvent<HTMLDivElement>) => {
      const canvasRect = canvasRef.current?.getBoundingClientRect();
      if (!canvasRect) return;

      event.preventDefault();

      const localX = event.clientX - canvasRect.left;
      const localY = event.clientY - canvasRect.top;
      const shouldZoom = event.ctrlKey || event.metaKey;

      if (!shouldZoom) {
        setPan((prev) => ({
          x: prev.x - event.deltaX,
          y: prev.y - event.deltaY,
        }));
        return;
      }

      const delta = -event.deltaY;
      const nextZoom = clamp(zoom * (1 + delta * 0.001), MIN_ZOOM, MAX_ZOOM);
      if (Math.abs(nextZoom - zoom) < 0.0001) return;

      const anchorCanvas = screenToCanvas(localX, localY, pan, zoom);
      const anchorScreenAtNextZoom = canvasToScreen(anchorCanvas.x, anchorCanvas.y, { x: 0, y: 0 }, nextZoom);

      setZoom(nextZoom);
      setPan({
        x: localX - anchorScreenAtNextZoom.x,
        y: localY - anchorScreenAtNextZoom.y,
      });
    },
    [canvasRef, pan, setPan, setZoom, zoom]
  );

  const onFitToContent = useCallback(() => {
    const viewportRect = canvasRef.current?.getBoundingClientRect();
    if (!viewportRect) return;

    if (topicList.length === 0) {
      setZoom(1);
      setPan({ x: viewportRect.width / 2, y: viewportRect.height / 2 });
      return;
    }

    const bounds = topicList.reduce(
      (acc, topic) => {
        const left = topic.x - topic.width / 2;
        const right = topic.x + topic.width / 2;
        const top = topic.y - topic.height / 2;
        const bottom = topic.y + topic.height / 2;

        return {
          maxX: Math.max(acc.maxX, right),
          maxY: Math.max(acc.maxY, bottom),
          minX: Math.min(acc.minX, left),
          minY: Math.min(acc.minY, top),
        };
      },
      {
        maxX: Number.NEGATIVE_INFINITY,
        maxY: Number.NEGATIVE_INFINITY,
        minX: Number.POSITIVE_INFINITY,
        minY: Number.POSITIVE_INFINITY,
      }
    );

    const contentWidth = Math.max(1, bounds.maxX - bounds.minX);
    const contentHeight = Math.max(1, bounds.maxY - bounds.minY);
    const scaleX = viewportRect.width / (contentWidth + FIT_PADDING * 2);
    const scaleY = viewportRect.height / (contentHeight + FIT_PADDING * 2);
    const nextZoom = clamp(Math.min(scaleX, scaleY), MIN_ZOOM, Math.min(MAX_ZOOM, FIT_MAX_ZOOM));

    const centerCanvasX = (bounds.minX + bounds.maxX) / 2;
    const centerCanvasY = (bounds.minY + bounds.maxY) / 2;

    setZoom(nextZoom);
    setPan({
      x: viewportRect.width / 2 - centerCanvasX * nextZoom,
      y: viewportRect.height / 2 - centerCanvasY * nextZoom,
    });
  }, [canvasRef, setPan, setZoom, topicList]);

  return (
    <div
      ref={canvasRef}
      className={`${styles.canvas} ${isPanning ? styles.canvasPanning : ""}`}
      onDoubleClick={onCanvasDoubleClick}
      onPointerCancel={stopPan}
      onPointerDown={onViewportPointerDown}
      onPointerMove={onViewportPointerMove}
      onPointerUp={stopPan}
      onWheel={onViewportWheel}
    >
      <div
        className={styles.canvasGrid}
        style={{
          backgroundPosition: `${gridOffsetX}px ${gridOffsetY}px`,
          backgroundSize: `${gridSize}px ${gridSize}px`,
        }}
      />

      <div className={styles.canvasControls} data-board-control>
        <button
          type="button"
          className={styles.canvasControlButton}
          data-board-control
          onClick={onFitToContent}
          onPointerDown={(event) => {
            event.stopPropagation();
          }}
        >
          Fit to content
        </button>
      </div>

      <div
        className={styles.world}
        style={{
          transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${zoom})`,
        }}
      >
        <svg className={styles.linksSvg} height={1} width={1}>
          {rootSectionDividers.map((divider) => (
            <g key={divider.id}>
              <line
                x1={divider.x1}
                x2={divider.x2}
                y1={divider.y}
                y2={divider.y}
                className={styles.rootDividerLineGlow}
              />
              <line
                x1={divider.x1}
                x2={divider.x2}
                y1={divider.y}
                y2={divider.y}
                className={styles.rootDividerLine}
              />
            </g>
          ))}

          {treeLines.map((line) => (
            <path key={line.id} d={line.path} className={styles.linkPath} />
          ))}

          {relationLines.map((line) => (
            <line
              key={line.id}
              x1={line.x1}
              x2={line.x2}
              y1={line.y1}
              y2={line.y2}
              className={styles.relationLine}
            />
          ))}

          {connectPreviewPath && <path d={connectPreviewPath} className={styles.linkPathPreview} />}
        </svg>

        {topicList.map((topic) => {
          const isDragging = draggingTopicId === topic.id;
          const isTemplateRoot = templateRootIdSet.has(topic.id);
          const isRoot = rootTopicId === topic.id || isTemplateRoot;
          const isSelected = selectedTopicId === topic.id;
          const isConnectHintTarget = proximityConnectHint?.parentTopicId === topic.id;

          return (
            <div
              key={topic.id}
              data-topic-id={topic.id}
              className={[
                styles.topicNode,
                isRoot ? styles.topicNodeRoot : "",
                isSelected ? styles.topicNodeSelected : "",
                isDragging ? styles.topicNodeDragging : "",
                isConnectHintTarget ? styles.topicNodeConnectHint : "",
              ].join(" ")}
              style={{
                height: `${topic.height}px`,
                left: `${topic.x}px`,
                top: `${topic.y}px`,
                width: `${topic.width}px`,
              }}
              onClick={(event) => {
                event.stopPropagation();
                onTopicClick(topic.id);
              }}
              onPointerCancel={onTopicPointerCancel}
              onPointerDown={(event) => {
                setSelectedTopicId(topic.id);
                onTopicPointerDown(event, topic.id);
              }}
              onPointerMove={onTopicPointerMove}
              onPointerUp={onTopicPointerUp}
            >
              {topic.title}
            </div>
          );
        })}

        {draftTopic && (
          <form
            data-topic-draft
            className={`${styles.topicDraft} ${draftTopic.isRoot ? styles.topicDraftRoot : ""}`}
            style={{
              height: `${draftTopic.height}px`,
              left: `${draftTopic.clientPoint.x}px`,
              top: `${draftTopic.clientPoint.y}px`,
              width: `${draftTopic.width}px`,
            }}
            onPointerDown={(event) => {
              event.stopPropagation();
            }}
            onSubmit={(event) => {
              event.preventDefault();
              void onDraftTopicSubmit();
            }}
          >
            <input
              autoFocus
              className={styles.topicDraftInput}
              data-topic-draft
              maxLength={120}
              placeholder={draftTopic.isRoot ? "Название главной темы" : "Название темы"}
              value={draftTopic.title}
              onChange={(event) => {
                onDraftTopicChange(event.target.value);
              }}
              onKeyDown={(event) => {
                if (event.key === "Escape") {
                  event.preventDefault();
                  onDraftTopicCancel();
                }
              }}
            />
          </form>
        )}

        {proximityConnectHint && topicMap[proximityConnectHint.parentTopicId] && (
          <div
            className={styles.connectHintBadge}
            style={{
              left: `${topicMap[proximityConnectHint.parentTopicId].x}px`,
              top: `${topicMap[proximityConnectHint.parentTopicId].y - 48}px`,
            }}
          >
            Можно соединить
          </div>
        )}
      </div>

      {loading && <div className={styles.emptyState}>Загрузка доски...</div>}
      {!loading && topicList.length === 0 && (
        <div className={styles.emptyState}>Двойной клик создаст root-topic.</div>
      )}
      {!loading && topicList.length > 0 && !statusText && (
        <div className={styles.emptyHint}>Двойной клик создает тему. Клик по пустому месту снимает выбор.</div>
      )}
      {statusText && <div className={styles.emptyHint}>{statusText}</div>}
    </div>
  );
}
