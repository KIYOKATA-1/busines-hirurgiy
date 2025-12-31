"use client";

import { useSyncExternalStore } from "react";

function getMql(query: string): MediaQueryList | null {
  if (typeof window === "undefined") return null;
  return window.matchMedia(query);
}

function subscribe(query: string, callback: () => void) {
  const mql = getMql(query);
  if (!mql) return () => {};

  const handler = () => callback();

  mql.addEventListener("change", handler);
  return () => mql.removeEventListener("change", handler);
}

function getSnapshot(query: string) {
  const mql = getMql(query);
  return mql ? mql.matches : false;
}

export function useMediaQuery(query: string) {
  return useSyncExternalStore(
    (cb) => subscribe(query, cb),
    () => getSnapshot(query),
    () => false
  );
}
