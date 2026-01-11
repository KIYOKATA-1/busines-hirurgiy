"use client";

import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import styles from "./ToastProvider.module.scss";

export type ToastKind = "success" | "error" | "info";

export type ToastItem = {
  id: string;
  kind: ToastKind;
  message: string;
  createdAt: number;
};

type ToastOptions = {
  durationMs?: number;
};

type ToastApi = {
  show: (kind: ToastKind, message: string, options?: ToastOptions) => void;
  success: (message: string, options?: ToastOptions) => void;
  error: (message: string, options?: ToastOptions) => void;
  info: (message: string, options?: ToastOptions) => void;
  remove: (id: string) => void;
  clear: () => void;
};

const ToastContext = createContext<ToastApi | null>(null);

function uid() {
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

type ProviderProps = {
  children: React.ReactNode;
  max?: number;
  defaultDurationMs?: number;
};

export default function ToastProvider({
  children,
  max = 4,
  defaultDurationMs = 3500,
}: ProviderProps) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timersRef = useRef<Record<string, number>>({});

  const remove = useCallback((id: string) => {
    const t = timersRef.current[id];
    if (t) window.clearTimeout(t);
    delete timersRef.current[id];

    setToasts((prev) => prev.filter((x) => x.id !== id));
  }, []);

  const clear = useCallback(() => {
    Object.values(timersRef.current).forEach((t) => window.clearTimeout(t));
    timersRef.current = {};
    setToasts([]);
  }, []);

  const show = useCallback(
    (kind: ToastKind, message: string, options?: ToastOptions) => {
      const id = uid();
      const durationMs = Math.max(800, options?.durationMs ?? defaultDurationMs);

      setToasts((prev) => {
        const next = [{ id, kind, message, createdAt: Date.now() }, ...prev];
        return next.slice(0, Math.max(1, max));
      });

      timersRef.current[id] = window.setTimeout(() => {
        remove(id);
      }, durationMs);
    },
    [defaultDurationMs, max, remove]
  );

  const api: ToastApi = useMemo(
    () => ({
      show,
      success: (m, o) => show("success", m, o),
      error: (m, o) => show("error", m, o),
      info: (m, o) => show("info", m, o),
      remove,
      clear,
    }),
    [remove, show, clear]
  );

  return (
    <ToastContext.Provider value={api}>
      {children}

      <div className={styles.toastRoot} aria-live="polite" aria-atomic="true">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={[
              styles.toast,
              t.kind === "success" ? styles.toastSuccess : "",
              t.kind === "error" ? styles.toastError : "",
              t.kind === "info" ? styles.toastInfo : "",
            ].join(" ")}
            role="status"
          >
            <div className={styles.toastDot} aria-hidden="true" />
            <div className={styles.toastText}>{t.message}</div>

            <button
              type="button"
              className={styles.toastClose}
              onClick={() => remove(t.id)}
              aria-label="Закрыть уведомление"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    return {
      show: () => {},
      success: () => {},
      error: () => {},
      info: () => {},
      remove: () => {},
      clear: () => {},
    };
  }
  return ctx;
}
