import {
  MouseEvent,
  PointerEvent as ReactPointerEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { createLink } from "../api/links";
import { createRootTopic, createTopic, getBoardSnapshot } from "../api/boards";
import { patchTopic } from "../api/topics";
import type { BoardSnapshot, CanvasPoint, Link, Relationship, Topic, TopicCore } from "../types";
import { screenToCanvas } from "../utils/screenToCanvas";

const DEFAULT_TOPIC_WIDTH = 180;
const DEFAULT_TOPIC_HEIGHT = 54;
const CONNECT_PROXIMITY_THRESHOLD = 128;
const AUTO_LINK_HORIZONTAL_GAP = 280;
const AUTO_LINK_VERTICAL_GAP = 112;
const TEMPLATE_ROOT_VERTICAL_GAP = 220;
const TEMPLATE_SECTION_DIVIDER_PADDING = 18;

const TEMPLATE_ROOT_TITLE_ORDER: Record<string, number> = {
  "Стратегия лечения": 0,
  "Общие данные": 1,
  Разбор: 2,
};

type TopicsMap = Record<string, Topic>;

type DragState = {
  initialPositions: Record<string, CanvasPoint>;
  isSubtree: boolean;
  moved: boolean;
  pointerId: number;
  sectionRootByTopicId: Record<string, string | null>;
  startPointerCanvas: CanvasPoint;
  topicId: string;
  topicIdsToMove: string[];
};

type ConnectHint = {
  childTopicId: string;
  parentTopicId: string;
};

type DraftTopic = {
  clientPoint: CanvasPoint;
  height: number;
  isRoot: boolean;
  parentTopicId: string | null;
  title: string;
  width: number;
};

function topicFromCore(core: TopicCore, prev?: Topic): Topic {
  return {
    ...core,
    inDegree: prev?.inDegree ?? 0,
    outDegree: prev?.outDegree ?? 0,
  };
}

function getTopicBounds(topic: Topic) {
  const halfW = topic.width / 2;
  const halfH = topic.height / 2;

  return {
    bottom: topic.y + halfH,
    left: topic.x - halfW,
    right: topic.x + halfW,
    top: topic.y - halfH,
  };
}

function getTopicGapDistance(a: Topic, b: Topic) {
  const aBounds = getTopicBounds(a);
  const bBounds = getTopicBounds(b);

  const dx = Math.max(aBounds.left - bBounds.right, bBounds.left - aBounds.right, 0);
  const dy = Math.max(aBounds.top - bBounds.bottom, bBounds.top - aBounds.bottom, 0);

  return Math.hypot(dx, dy);
}

function normalizeTopics(topics: Topic[]) {
  return topics.reduce<TopicsMap>((acc, topic) => {
    acc[topic.id] = topic;
    return acc;
  }, {});
}

function getTemplateRootIds(board: BoardSnapshot, topics: Topic[]) {
  if (board.rootTopicId) return [];

  return topics
    .filter((topic) => topic.inDegree === 0 && TEMPLATE_ROOT_TITLE_ORDER[topic.title] !== undefined)
    .sort((a, b) => TEMPLATE_ROOT_TITLE_ORDER[a.title] - TEMPLATE_ROOT_TITLE_ORDER[b.title])
    .map((topic) => topic.id);
}

function spreadOverlappingTemplateRoots(board: BoardSnapshot, topics: Topic[]) {
  if (board.rootTopicId || topics.length < 2) return topics;

  const templateRootIds = new Set(getTemplateRootIds(board, topics));
  const templateRoots = topics.filter((topic) => templateRootIds.has(topic.id));
  const rootTopics = templateRoots.length >= 2 ? templateRoots : topics.filter((topic) => topic.inDegree === 0);
  if (rootTopics.length < 2) return topics;

  const [first, ...rest] = rootTopics;
  const overlapEpsilon = 0.001;
  const areOverlapping = rest.every(
    (topic) =>
      Math.abs(topic.x - first.x) <= overlapEpsilon && Math.abs(topic.y - first.y) <= overlapEpsilon
  );

  if (!areOverlapping) return topics;

  const orderById = new Map<string, number>();
  rootTopics
    .slice()
    .sort((a, b) => {
      const aOrder = TEMPLATE_ROOT_TITLE_ORDER[a.title];
      const bOrder = TEMPLATE_ROOT_TITLE_ORDER[b.title];
      if (aOrder !== undefined && bOrder !== undefined) return aOrder - bOrder;
      if (aOrder !== undefined) return -1;
      if (bOrder !== undefined) return 1;
      return a.title.localeCompare(b.title, "ru");
    })
    .forEach((topic, index) => {
      orderById.set(topic.id, index);
    });

  const centerIndex = (rootTopics.length - 1) / 2;
  const baseY = first.y - centerIndex * TEMPLATE_ROOT_VERTICAL_GAP;

  return topics.map((topic) => {
    const order = orderById.get(topic.id);
    if (order === undefined) return topic;

    return {
      ...topic,
      x: first.x,
      y: baseY + order * TEMPLATE_ROOT_VERTICAL_GAP,
    };
  });
}

function isAutoParent(topic: Topic) {
  return topic.inDegree === 0 && topic.outDegree > 0;
}

function isTemplateRootPair(
  parent: Topic | undefined,
  child: Topic | undefined,
  templateRootIds: Set<string>
) {
  if (!parent || !child) return false;
  if (parent.id === child.id) return false;

  return templateRootIds.has(parent.id) && templateRootIds.has(child.id);
}

function collectSubtreeTopicIds(rootId: string, links: Link[]) {
  const adjacency = new Map<string, string[]>();

  links.forEach((link) => {
    const items = adjacency.get(link.parentTopicId) ?? [];
    items.push(link.childTopicId);
    adjacency.set(link.parentTopicId, items);
  });

  const visited = new Set<string>();
  const stack = [rootId];
  const ids: string[] = [];

  while (stack.length) {
    const nodeId = stack.pop();
    if (!nodeId || visited.has(nodeId)) continue;

    visited.add(nodeId);
    ids.push(nodeId);

    const children = adjacency.get(nodeId) ?? [];
    children.forEach((childId) => {
      if (!visited.has(childId)) stack.push(childId);
    });
  }

  return ids;
}

function collectConnectedTopicIds(rootId: string, links: Link[]) {
  const adjacency = new Map<string, string[]>();

  links.forEach((link) => {
    const parentNeighbors = adjacency.get(link.parentTopicId) ?? [];
    parentNeighbors.push(link.childTopicId);
    adjacency.set(link.parentTopicId, parentNeighbors);

    const childNeighbors = adjacency.get(link.childTopicId) ?? [];
    childNeighbors.push(link.parentTopicId);
    adjacency.set(link.childTopicId, childNeighbors);
  });

  const visited = new Set<string>();
  const stack = [rootId];
  const ids: string[] = [];

  while (stack.length) {
    const nodeId = stack.pop();
    if (!nodeId || visited.has(nodeId)) continue;

    visited.add(nodeId);
    ids.push(nodeId);

    const neighbors = adjacency.get(nodeId) ?? [];
    neighbors.forEach((neighborId) => {
      if (!visited.has(neighborId)) stack.push(neighborId);
    });
  }

  return ids;
}

function getCanvasPoint(clientX: number, clientY: number, canvasRect: DOMRect, pan: CanvasPoint, zoom: number) {
  const localX = clientX - canvasRect.left;
  const localY = clientY - canvasRect.top;
  return screenToCanvas(localX, localY, pan, zoom);
}

function getBranchDirectionSign(boardDirection: string | undefined, parent: Topic, child: Topic) {
  const normalizedDirection = (boardDirection ?? "").toLowerCase();

  if (normalizedDirection === "left") return -1;
  if (normalizedDirection === "right") return 1;
  return child.x >= parent.x ? 1 : -1;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

type TemplateSectionBounds = {
  maxY: number;
  minY: number;
};

function resolveTemplateSectionRootId(params: {
  fallbackToNearest?: boolean;
  links: Link[];
  templateRootIds: Set<string>;
  topicId: string;
  topics: TopicsMap;
}) {
  const { fallbackToNearest = false, links, templateRootIds, topicId, topics } = params;
  if (templateRootIds.size === 0) return null;

  const parentByChild = new Map<string, string>();
  links.forEach((link) => {
    parentByChild.set(link.childTopicId, link.parentTopicId);
  });

  const visited = new Set<string>();
  let cursor: string | undefined = topicId;

  while (cursor && !templateRootIds.has(cursor)) {
    if (visited.has(cursor)) {
      cursor = undefined;
      break;
    }
    visited.add(cursor);
    cursor = parentByChild.get(cursor);
  }

  if (cursor && templateRootIds.has(cursor)) return cursor;
  if (!fallbackToNearest) return null;

  const source = topics[topicId];
  if (!source) return null;

  let bestId: string | null = null;
  let bestDistance = Number.POSITIVE_INFINITY;

  templateRootIds.forEach((rootId) => {
    const root = topics[rootId];
    if (!root) return;

    const distance = Math.abs(root.y - source.y);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestId = rootId;
    }
  });

  return bestId;
}

function getTemplateSectionBounds(params: {
  links: Link[];
  sectionRootId?: string | null;
  templateRootIds: Set<string>;
  topicId: string;
  topics: TopicsMap;
}): TemplateSectionBounds | null {
  const { links, sectionRootId = null, templateRootIds, topicId, topics } = params;
  if (templateRootIds.size < 2) return null;

  const templateRoots = Array.from(templateRootIds)
    .map((id) => topics[id])
    .filter((topic): topic is Topic => Boolean(topic))
    .sort((a, b) => a.y - b.y);

  if (templateRoots.length < 2) return null;

  const resolvedSectionRootId =
    sectionRootId ??
    resolveTemplateSectionRootId({
      fallbackToNearest: true,
      links,
      templateRootIds,
      topicId,
      topics,
    });

  if (!resolvedSectionRootId) return null;
  const sectionIndex = templateRoots.findIndex((topic) => topic.id === resolvedSectionRootId);
  if (sectionIndex === -1) return null;

  const dividerYByIndex = templateRoots.slice(0, -1).map((rootTopic, index) => {
    const nextRootTopic = templateRoots[index + 1];
    return (rootTopic.y + nextRootTopic.y) / 2;
  });

  const minY = sectionIndex > 0 ? dividerYByIndex[sectionIndex - 1] : Number.NEGATIVE_INFINITY;
  const maxY = sectionIndex < templateRoots.length - 1 ? dividerYByIndex[sectionIndex] : Number.POSITIVE_INFINITY;

  return { maxY, minY };
}

function clampTopicYInTemplateSection(params: {
  height: number;
  links: Link[];
  padding?: number;
  sectionRootId?: string | null;
  templateRootIds: Set<string>;
  topicId: string;
  topics: TopicsMap;
  y: number;
}) {
  const {
    height,
    links,
    padding = TEMPLATE_SECTION_DIVIDER_PADDING,
    sectionRootId = null,
    templateRootIds,
    topicId,
    topics,
    y,
  } = params;
  const bounds = getTemplateSectionBounds({
    links,
    sectionRootId,
    templateRootIds,
    topicId,
    topics,
  });
  if (!bounds) return y;

  const halfHeightWithPadding = height / 2 + padding;
  const minY = Number.isFinite(bounds.minY) ? bounds.minY + halfHeightWithPadding : bounds.minY;
  const maxY = Number.isFinite(bounds.maxY) ? bounds.maxY - halfHeightWithPadding : bounds.maxY;

  if (minY > maxY) {
    if (Number.isFinite(bounds.minY) && Number.isFinite(bounds.maxY)) {
      return (bounds.minY + bounds.maxY) / 2;
    }
    return y;
  }

  return clamp(y, minY, maxY);
}

function getAutoPlacedChildPoint(params: {
  boardDirection: string | undefined;
  childTopicId: string;
  links: Link[];
  parentTopicId: string;
  templateRootIds: Set<string>;
  topics: TopicsMap;
}) {
  const { boardDirection, childTopicId, links, parentTopicId, templateRootIds, topics } = params;
  const parent = topics[parentTopicId];
  const child = topics[childTopicId];
  if (!parent || !child) return null;

  const siblingIds = Array.from(
    new Set(links.filter((link) => link.parentTopicId === parentTopicId).map((link) => link.childTopicId))
  );

  if (!siblingIds.includes(childTopicId)) {
    siblingIds.push(childTopicId);
  }

  const siblings = siblingIds
    .map((id) => (id === childTopicId ? child : topics[id]))
    .filter((topic): topic is Topic => Boolean(topic))
    .sort((a, b) => a.y - b.y || a.x - b.x);

  const childIndex = siblings.findIndex((topic) => topic.id === childTopicId);
  if (childIndex === -1) return null;

  const directionSign = getBranchDirectionSign(boardDirection, parent, child);
  const offsetY = (childIndex - (siblings.length - 1) / 2) * AUTO_LINK_VERTICAL_GAP;
  const nextY = clampTopicYInTemplateSection({
    height: child.height,
    links,
    templateRootIds,
    topicId: childTopicId,
    topics,
    y: parent.y + offsetY,
  });

  return {
    x: parent.x + directionSign * AUTO_LINK_HORIZONTAL_GAP,
    y: nextY,
  };
}

export function useBoard(boardId: string) {
  const [board, setBoard] = useState<BoardSnapshot | null>(null);
  const [topics, setTopics] = useState<TopicsMap>({});
  const [links, setLinks] = useState<Link[]>([]);
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const [templateRootIds, setTemplateRootIds] = useState<string[]>([]);

  const [pan, setPan] = useState<CanvasPoint>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);

  const [loading, setLoading] = useState(false);
  const [creatingTopic, setCreatingTopic] = useState(false);
  const [savingPosition, setSavingPosition] = useState(false);
  const [draggingTopicId, setDraggingTopicId] = useState<string | null>(null);
  const [connectParentTopicId, setConnectParentTopicId] = useState<string | null>(null);
  const [proximityConnectHint, setProximityConnectHint] = useState<ConnectHint | null>(null);
  const [draftTopic, setDraftTopic] = useState<DraftTopic | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canvasRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<DragState | null>(null);
  const topicsRef = useRef<TopicsMap>({});
  const linksRef = useRef<Link[]>([]);
  const selectedTopicIdRef = useRef<string | null>(null);
  const proximityConnectHintRef = useRef<ConnectHint | null>(null);
  const boardVersionRef = useRef(0);
  const draftTopicRef = useRef<DraftTopic | null>(null);
  const boardRef = useRef<BoardSnapshot | null>(null);
  const templateRootIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    topicsRef.current = topics;
  }, [topics]);

  useEffect(() => {
    linksRef.current = links;
  }, [links]);

  useEffect(() => {
    selectedTopicIdRef.current = selectedTopicId;
  }, [selectedTopicId]);

  useEffect(() => {
    proximityConnectHintRef.current = proximityConnectHint;
  }, [proximityConnectHint]);

  useEffect(() => {
    boardVersionRef.current = board?.version ?? 0;
  }, [board?.version]);

  useEffect(() => {
    boardRef.current = board;
  }, [board]);

  useEffect(() => {
    templateRootIdsRef.current = new Set(templateRootIds);
  }, [templateRootIds]);

  useEffect(() => {
    draftTopicRef.current = draftTopic;
  }, [draftTopic]);

  const setBoardVersion = useCallback((version: number) => {
    setBoard((prev) => {
      if (!prev) return prev;
      return { ...prev, version: Math.max(prev.version, version) };
    });
  }, []);

  const createParentChildLink = useCallback(
    async (parentTopicId: string, childTopicId: string) => {
      if (!boardId || !parentTopicId || !childTopicId) return;
      if (parentTopicId === childTopicId) return;
      if (boardRef.current?.rootTopicId === childTopicId) return;

      const parentTopic = topicsRef.current[parentTopicId];
      const childTopic = topicsRef.current[childTopicId];
      if (templateRootIdsRef.current.has(childTopicId)) {
        setError("Шаблонные родительские темы нельзя делать дочерними.");
        return;
      }
      if (isTemplateRootPair(parentTopic, childTopic, templateRootIdsRef.current)) {
        setError("Корневые шаблонные темы нельзя соединять друг с другом.");
        return;
      }

      if (
        linksRef.current.some(
          (item) => item.parentTopicId === parentTopicId && item.childTopicId === childTopicId
        )
      ) {
        return;
      }

      const existingParent = linksRef.current.find((item) => item.childTopicId === childTopicId);
      if (existingParent && existingParent.parentTopicId !== parentTopicId) {
        setError("У узла уже есть родитель. Для MVP поддерживается только один parent.");
        return;
      }

      const childSubtree = collectSubtreeTopicIds(childTopicId, linksRef.current);
      if (childSubtree.includes(parentTopicId)) {
        setError("Нельзя соединить узел с его потомком.");
        return;
      }

      const linkResponse = await createLink(boardId, {
        childTopicId,
        parentTopicId,
      });

      const nextLinks = [...linksRef.current, linkResponse.link];
      linksRef.current = nextLinks;
      setLinks(nextLinks);

      const autoPlacedChildPoint = getAutoPlacedChildPoint({
        boardDirection: boardRef.current?.direction,
        childTopicId,
        links: nextLinks,
        parentTopicId,
        templateRootIds: templateRootIdsRef.current,
        topics: topicsRef.current,
      });

      setTopics((prev) => {
        const parent = prev[parentTopicId];
        const child = prev[childTopicId];
        if (!parent || !child) return prev;

        return {
          ...prev,
          [parentTopicId]: { ...parent, outDegree: parent.outDegree + 1 },
          [childTopicId]: {
            ...child,
            inDegree: child.inDegree + 1,
            ...(autoPlacedChildPoint
              ? {
                  x: autoPlacedChildPoint.x,
                  y: autoPlacedChildPoint.y,
                }
              : {}),
          },
        };
      });

      let latestVersion = linkResponse.version;

      if (autoPlacedChildPoint) {
        try {
          const patchResponse = await patchTopic(childTopicId, {
            x: autoPlacedChildPoint.x,
            y: autoPlacedChildPoint.y,
          });

          latestVersion = Math.max(latestVersion, patchResponse.version);

          setTopics((prev) => ({
            ...prev,
            [patchResponse.topic.id]: topicFromCore(patchResponse.topic, prev[patchResponse.topic.id]),
          }));
        } catch {
          setError("Связь создана, но не удалось аккуратно выровнять позицию.");
        }
      }

      setBoardVersion(latestVersion);
    },
    [boardId, setBoardVersion]
  );

  const findProximityConnectParent = useCallback(
    (drag: DragState): ConnectHint | null => {
      const child = topicsRef.current[drag.topicId];
      if (!child) return null;

      if (board?.rootTopicId && child.id === board.rootTopicId) return null;
      if (templateRootIdsRef.current.has(child.id)) return null;
      const existingParentId = linksRef.current.find((link) => link.childTopicId === child.id)?.parentTopicId;

      const blockedIds = new Set(drag.topicIdsToMove);
      let bestParentId: string | null = null;
      let bestDistance = Number.POSITIVE_INFINITY;

      Object.values(topicsRef.current).forEach((candidate) => {
        if (blockedIds.has(candidate.id)) return;
        if (existingParentId && existingParentId !== candidate.id) return;
        if (isTemplateRootPair(candidate, child, templateRootIdsRef.current)) return;

        const alreadyLinked = linksRef.current.some(
          (link) => link.parentTopicId === candidate.id && link.childTopicId === child.id
        );
        if (alreadyLinked) return;

        const distance = getTopicGapDistance(candidate, child);
        if (distance > CONNECT_PROXIMITY_THRESHOLD) return;

        if (distance < bestDistance) {
          bestDistance = distance;
          bestParentId = candidate.id;
        }
      });

      if (!bestParentId) return null;

      return {
        childTopicId: child.id,
        parentTopicId: bestParentId,
      };
    },
    [board?.rootTopicId]
  );

  const loadSnapshot = useCallback(async () => {
    if (!boardId) return;

    try {
      setLoading(true);
      setError(null);

      const snapshot = await getBoardSnapshot(boardId);
      const normalizedTopics = spreadOverlappingTemplateRoots(snapshot.board, snapshot.topics ?? []);
      const map = normalizeTopics(normalizedTopics);
      const nextTemplateRootIds = getTemplateRootIds(snapshot.board, normalizedTopics);

      setBoard(snapshot.board);
      setTopics(map);
      setLinks(snapshot.links ?? []);
      setRelationships(snapshot.relationships ?? []);
      setTemplateRootIds(nextTemplateRootIds);
      setSelectedTopicId((prev) => (prev && map[prev] ? prev : snapshot.board.rootTopicId ?? null));
    } catch {
      setError("Не удалось загрузить доску");
    } finally {
      setLoading(false);
    }
  }, [boardId]);

  useEffect(() => {
    if (!boardId) return;
    void loadSnapshot();
  }, [boardId, loadSnapshot]);

  const onCanvasPointerDown = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement | null;
    if (target?.closest("[data-topic-id]") || target?.closest("[data-topic-draft]")) return;
    setSelectedTopicId(null);
    setProximityConnectHint(null);
  }, []);

  const onCanvasDoubleClick = useCallback(
    async (event: MouseEvent<HTMLDivElement>) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest("[data-topic-id]") || target?.closest("[data-topic-draft]")) return;
      if (!boardId || !board || creatingTopic || draftTopicRef.current) return;

      const canvasRect = canvasRef.current?.getBoundingClientRect();
      if (!canvasRect) return;

      const clientPoint = getCanvasPoint(event.clientX, event.clientY, canvasRect, pan, zoom);
      const hasAnyTopics = Object.keys(topicsRef.current).length > 0;
      const isRootCreation = !board.rootTopicId && !hasAnyTopics;

      setError(null);
      setDraftTopic({
        clientPoint,
        height: DEFAULT_TOPIC_HEIGHT,
        isRoot: isRootCreation,
        parentTopicId: isRootCreation ? null : selectedTopicIdRef.current,
        title: "",
        width: DEFAULT_TOPIC_WIDTH,
      });
    },
    [boardId, board, creatingTopic, pan, zoom]
  );

  const onDraftTopicChange = useCallback((title: string) => {
    setDraftTopic((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        title,
      };
    });
  }, []);

  const onDraftTopicCancel = useCallback(() => {
    setDraftTopic(null);
  }, []);

  const onDraftTopicSubmit = useCallback(async () => {
    const currentDraft = draftTopicRef.current;
    if (!currentDraft || !boardId) return;

    const title = currentDraft.title.trim();
    if (!title) {
      setError("Название темы не может быть пустым");
      return;
    }

    try {
      setCreatingTopic(true);
      setError(null);

      if (currentDraft.isRoot) {
        const response = await createRootTopic(boardId, {
          clientPoint: currentDraft.clientPoint,
          height: currentDraft.height,
          title,
          width: currentDraft.width,
        });

        setBoard((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            rootAnchor: response.board.rootAnchor,
            rootTopicId: response.board.rootTopicId,
            status: response.board.status,
            version: response.board.version,
          };
        });

        setTopics((prev) => ({
          ...prev,
          [response.rootTopic.id]: topicFromCore(response.rootTopic, prev[response.rootTopic.id]),
        }));
        setSelectedTopicId(response.rootTopic.id);
        setDraftTopic(null);
        return;
      }

      const created = await createTopic(boardId, {
        clientPoint: currentDraft.clientPoint,
        height: currentDraft.height,
        title,
        width: currentDraft.width,
      });

      const createdTopicId = created.topic.id;
      setTopics((prev) => ({
        ...prev,
        [createdTopicId]: topicFromCore(created.topic, prev[createdTopicId]),
      }));
      setBoardVersion(created.version);
      setSelectedTopicId(createdTopicId);

      if (currentDraft.parentTopicId) {
        await createParentChildLink(currentDraft.parentTopicId, createdTopicId);
      }

      setDraftTopic(null);
    } catch {
      setError("Не удалось создать элемент");
    } finally {
      setCreatingTopic(false);
    }
  }, [boardId, createParentChildLink, setBoardVersion]);

  const createTopicFromPicker = useCallback(
    async (rawTitle: string) => {
      const title = rawTitle.trim();
      if (!boardId || !title) return false;

      try {
        setCreatingTopic(true);
        setError(null);

        const currentBoard = boardRef.current;
        const currentTopics = topicsRef.current;
        const hasAnyTopics = Object.keys(currentTopics).length > 0;
        const shouldCreateRoot = !currentBoard?.rootTopicId && !hasAnyTopics;

        if (shouldCreateRoot) {
          const response = await createRootTopic(boardId, {
            clientPoint: { x: 0, y: 0 },
            height: DEFAULT_TOPIC_HEIGHT,
            title,
            width: DEFAULT_TOPIC_WIDTH,
          });

          setBoard((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              rootAnchor: response.board.rootAnchor,
              rootTopicId: response.board.rootTopicId,
              status: response.board.status,
              version: response.board.version,
            };
          });

          setTopics((prev) => ({
            ...prev,
            [response.rootTopic.id]: topicFromCore(response.rootTopic, prev[response.rootTopic.id]),
          }));
          setSelectedTopicId(response.rootTopic.id);
          return true;
        }

        const anchorTopicId =
          selectedTopicIdRef.current ??
          currentBoard?.rootTopicId ??
          Object.values(currentTopics).find((topic) => topic.inDegree === 0)?.id ??
          null;
        const anchorTopic = anchorTopicId ? currentTopics[anchorTopicId] : null;
        const initialY = anchorTopic
          ? clampTopicYInTemplateSection({
              height: DEFAULT_TOPIC_HEIGHT,
              links: linksRef.current,
              templateRootIds: templateRootIdsRef.current,
              topicId: anchorTopicId,
              topics: currentTopics,
              y: anchorTopic.y + 28,
            })
          : 0;

        const created = await createTopic(boardId, {
          clientPoint: anchorTopic
            ? {
                x: anchorTopic.x + 28,
                y: initialY,
              }
            : { x: 0, y: 0 },
          height: DEFAULT_TOPIC_HEIGHT,
          title,
          width: DEFAULT_TOPIC_WIDTH,
        });

        const createdTopicId = created.topic.id;
        setTopics((prev) => ({
          ...prev,
          [createdTopicId]: topicFromCore(created.topic, prev[createdTopicId]),
        }));
        setBoardVersion(created.version);
        setSelectedTopicId(createdTopicId);

        return true;
      } catch {
        setError("Не удалось создать тему");
        return false;
      } finally {
        setCreatingTopic(false);
      }
    },
    [boardId, setBoardVersion]
  );

  const onTopicPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>, topicId: string) => {
      if (event.button !== 0) return;
      if (!boardId || creatingTopic || savingPosition) return;

      const topic = topicsRef.current[topicId];
      if (!topic) return;

      const canvasRect = canvasRef.current?.getBoundingClientRect();
      if (!canvasRect) return;

      const startPointerCanvas = getCanvasPoint(event.clientX, event.clientY, canvasRect, pan, zoom);
      const autoParent = isAutoParent(topic);
      const topicIdsToMove = autoParent ? collectConnectedTopicIds(topicId, linksRef.current) : [topicId];

      const initialPositions = topicIdsToMove.reduce<Record<string, CanvasPoint>>((acc, id) => {
        const node = topicsRef.current[id];
        if (!node) return acc;

        acc[id] = {
          x: node.x,
          y: node.y,
        };
        return acc;
      }, {});
      const sectionRootByTopicId = topicIdsToMove.reduce<Record<string, string | null>>((acc, id) => {
        acc[id] = resolveTemplateSectionRootId({
          fallbackToNearest: true,
          links: linksRef.current,
          templateRootIds: templateRootIdsRef.current,
          topicId: id,
          topics: topicsRef.current,
        });
        return acc;
      }, {});

      dragRef.current = {
        initialPositions,
        isSubtree: autoParent && topicIdsToMove.length > 1,
        moved: false,
        pointerId: event.pointerId,
        sectionRootByTopicId,
        startPointerCanvas,
        topicId,
        topicIdsToMove,
      };

      setDraggingTopicId(topicId);
      setSelectedTopicId(topicId);
      setProximityConnectHint(null);
      event.preventDefault();
      event.stopPropagation();
      event.currentTarget.setPointerCapture(event.pointerId);
    },
    [boardId, creatingTopic, pan, savingPosition, zoom]
  );

  const onTopicPointerMove = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const drag = dragRef.current;
      if (!drag || event.pointerId !== drag.pointerId) return;

      const canvasRect = canvasRef.current?.getBoundingClientRect();
      if (!canvasRect) return;

      const pointerCanvas = getCanvasPoint(event.clientX, event.clientY, canvasRect, pan, zoom);
      const dx = pointerCanvas.x - drag.startPointerCanvas.x;
      const dy = pointerCanvas.y - drag.startPointerCanvas.y;

      if (Math.abs(dx) > 0.0001 || Math.abs(dy) > 0.0001) {
        drag.moved = true;
      }

      setTopics((prev) => {
        const next = { ...prev };

        drag.topicIdsToMove.forEach((id) => {
          const base = drag.initialPositions[id];
          const node = next[id];
          if (!base || !node) return;

          const nextY = clampTopicYInTemplateSection({
            height: node.height,
            links: linksRef.current,
            sectionRootId: drag.sectionRootByTopicId[id],
            templateRootIds: templateRootIdsRef.current,
            topicId: id,
            topics: next,
            y: base.y + dy,
          });

          next[id] = {
            ...node,
            x: base.x + dx,
            y: nextY,
          };
        });

        return next;
      });

      const hint = findProximityConnectParent(drag);
      setProximityConnectHint((prev) => {
        if (!hint && !prev) return prev;
        if (!hint && prev) return null;
        if (!prev && hint) return hint;
        if (!hint || !prev) return prev;
        if (prev.parentTopicId === hint.parentTopicId && prev.childTopicId === hint.childTopicId) {
          return prev;
        }
        return hint;
      });

      event.preventDefault();
    },
    [findProximityConnectParent, pan, zoom]
  );

  const finishDrag = useCallback(
    async (event: ReactPointerEvent<HTMLDivElement>, cancel: boolean) => {
      const drag = dragRef.current;
      if (!drag || event.pointerId !== drag.pointerId) return;

      dragRef.current = null;
      setDraggingTopicId(null);
      const proximityHint = proximityConnectHintRef.current;
      setProximityConnectHint(null);

      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }

      if (cancel) {
        setTopics((prev) => {
          const next = { ...prev };
          Object.entries(drag.initialPositions).forEach(([id, point]) => {
            const topic = next[id];
            if (!topic) return;
            next[id] = { ...topic, x: point.x, y: point.y };
          });
          return next;
        });
        return;
      }

      if (!drag.moved) return;

      try {
        setSavingPosition(true);
        setError(null);

        if (drag.isSubtree) {
          const patchTargets = drag.topicIdsToMove
            .map((id) => topicsRef.current[id])
            .filter((item): item is Topic => Boolean(item))
            .map((item) =>
              patchTopic(item.id, {
                x: item.x,
                y: item.y,
              })
            );

          const responses = await Promise.all(patchTargets);
          const maxVersion = responses.reduce(
            (acc, item) => Math.max(acc, item.version),
            boardVersionRef.current
          );

          setTopics((prev) => {
            const next = { ...prev };
            responses.forEach((response) => {
              const topic = response.topic;
              next[topic.id] = topicFromCore(topic, next[topic.id]);
            });
            return next;
          });

          setBoardVersion(maxVersion);
        } else {
          const current = topicsRef.current[drag.topicId];
          if (!current) return;

          const response = await patchTopic(drag.topicId, {
            x: current.x,
            y: current.y,
          });

          setTopics((prev) => ({
            ...prev,
            [response.topic.id]: topicFromCore(response.topic, prev[response.topic.id]),
          }));
          setBoardVersion(response.version);
        }

        if (
          proximityHint &&
          proximityHint.childTopicId === drag.topicId &&
          proximityHint.parentTopicId !== drag.topicId
        ) {
          await createParentChildLink(proximityHint.parentTopicId, proximityHint.childTopicId);
        }
      } catch {
        setError("Не удалось сохранить позицию");
        setTopics((prev) => {
          const next = { ...prev };
          Object.entries(drag.initialPositions).forEach(([id, point]) => {
            const topic = next[id];
            if (!topic) return;
            next[id] = { ...topic, x: point.x, y: point.y };
          });
          return next;
        });
      } finally {
        setSavingPosition(false);
      }
    },
    [createParentChildLink, setBoardVersion]
  );

  const onTopicPointerUp = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      void finishDrag(event, false);
    },
    [finishDrag]
  );

  const onTopicPointerCancel = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      void finishDrag(event, true);
    },
    [finishDrag]
  );

  const onTopicClick = useCallback(
    async (topicId: string) => {
      setSelectedTopicId(topicId);

      const parentId = connectParentTopicId;
      if (!parentId || parentId === topicId) return;

      try {
        setError(null);
        await createParentChildLink(parentId, topicId);
      } catch {
        setError("Не удалось создать связь");
      } finally {
        setConnectParentTopicId(null);
      }
    },
    [connectParentTopicId, createParentChildLink]
  );

  const startConnectMode = useCallback(() => {
    if (!selectedTopicIdRef.current) return false;
    setConnectParentTopicId(selectedTopicIdRef.current);
    setProximityConnectHint(null);
    return true;
  }, []);

  const cancelConnectMode = useCallback(() => {
    setConnectParentTopicId(null);
    setProximityConnectHint(null);
  }, []);

  return {
    board,
    canvasRef,
    cancelConnectMode,
    connectParentTopicId,
    creatingTopic,
    draggingTopicId,
    error,
    links,
    loading,
    onCanvasDoubleClick,
    onCanvasPointerDown,
    onTopicPointerCancel,
    onTopicClick,
    onTopicPointerDown,
    onTopicPointerMove,
    onTopicPointerUp,
    pan,
    proximityConnectHint,
    relationships,
    reload: loadSnapshot,
    savingPosition,
    selectedTopicId,
    draftTopic,
    onDraftTopicCancel,
    onDraftTopicChange,
    onDraftTopicSubmit,
    createTopicFromPicker,
    setPan,
    setSelectedTopicId,
    setZoom,
    startConnectMode,
    templateRootIds,
    topics,
    zoom,
  };
}
