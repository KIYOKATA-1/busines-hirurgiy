"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { getBoards } from "@/app/(protected)/board/api/boards";
import type { BoardListItem } from "@/app/(protected)/board/types";

const ANALYSIS_BATCH_SIZE = 9;

type AnalysisBoardsContextValue = {
  boards: BoardListItem[];
  hasMore: boolean;
  loading: boolean;
  ensureLoaded: () => Promise<void>;
  loadMore: () => void;
  prependBoard: (board: BoardListItem) => void;
};

const AnalysisBoardsContext = createContext<AnalysisBoardsContextValue | null>(null);

export function AnalysisBoardsProvider({ children }: { children: ReactNode }) {
  const [allBoards, setAllBoards] = useState<BoardListItem[]>([]);
  const [visibleCount, setVisibleCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const inFlightRef = useRef<Promise<void> | null>(null);

  const boards = useMemo(
    () => allBoards.slice(0, Math.min(visibleCount, allBoards.length)),
    [allBoards, visibleCount]
  );
  const hasMore = visibleCount < allBoards.length;

  const ensureLoaded = useCallback(async () => {
    if (loaded) return;
    if (inFlightRef.current) {
      await inFlightRef.current;
      return;
    }

    const request = (async () => {
      setLoading(true);
      try {
        const response = await getBoards();
        const nextBoards = response ?? [];
        setAllBoards(nextBoards);
        setVisibleCount(Math.min(ANALYSIS_BATCH_SIZE, nextBoards.length));
        setLoaded(true);
      } finally {
        setLoading(false);
      }
    })();

    inFlightRef.current = request;

    try {
      await request;
    } finally {
      inFlightRef.current = null;
    }
  }, [loaded]);

  const loadMore = useCallback(() => {
    setVisibleCount((prev) => {
      if (prev >= allBoards.length) return prev;
      return Math.min(prev + ANALYSIS_BATCH_SIZE, allBoards.length);
    });
  }, [allBoards.length]);

  const prependBoard = useCallback((board: BoardListItem) => {
    setAllBoards((prev) => [board, ...prev.filter((item) => item.id !== board.id)]);
    setVisibleCount((prev) => (prev === 0 ? 1 : prev + 1));
  }, []);

  const value = useMemo<AnalysisBoardsContextValue>(
    () => ({
      boards,
      hasMore,
      loading,
      ensureLoaded,
      loadMore,
      prependBoard,
    }),
    [boards, hasMore, loading, ensureLoaded, loadMore, prependBoard]
  );

  return <AnalysisBoardsContext.Provider value={value}>{children}</AnalysisBoardsContext.Provider>;
}

export function useAnalysisBoards() {
  const ctx = useContext(AnalysisBoardsContext);

  if (!ctx) {
    throw new Error("useAnalysisBoards must be used within AnalysisBoardsProvider");
  }

  return ctx;
}
