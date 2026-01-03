"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import styles from "./DiseaseDropdown.module.scss";
import { MenuPos, Props } from "./DiseaseDropdown.types";


export default function DiseaseDropdown({
  value,
  options,
  placeholder = "Выберите болезнь",
  disabled = false,
  onChange,
  className,
  menuMaxHeight = 280,
}: Props) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [pos, setPos] = useState<MenuPos | null>(null);
  const [activeIdx, setActiveIdx] = useState<number>(-1);

  const selected = useMemo(() => {
    return options.find((o) => o.value === value) ?? null;
  }, [options, value]);

  const enabledOptions = useMemo(() => options.filter((o) => !o.disabled), [options]);

  const calcPos = () => {
    const el = btnRef.current;
    if (!el) return;

    const r = el.getBoundingClientRect();
    setPos({ top: r.bottom + 8, left: r.left, width: r.width });
  };

  const close = () => {
    setOpen(false);
    setActiveIdx(-1);
  };

  const openMenu = () => {
    if (disabled) return;
    calcPos();
    setOpen(true);

    const idx = enabledOptions.findIndex((o) => o.value === value);
    setActiveIdx(idx >= 0 ? idx : 0);
  };

  const toggle = () => {
    if (disabled) return;
    if (open) close();
    else openMenu();
  };

  const pick = (val: string) => {
    onChange(val);
    close();
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;

    const onDown = (e: MouseEvent) => {
      const t = e.target as Node | null;
      const wrap = wrapRef.current;
      const menu = menuRef.current;

      if (!t) return;
      if (wrap && wrap.contains(t)) return;
      if (menu && menu.contains(t)) return;

      close();
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };

    const onRecalc = () => calcPos();

    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    window.addEventListener("resize", onRecalc);
    window.addEventListener("scroll", onRecalc, true);

    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onRecalc);
      window.removeEventListener("scroll", onRecalc, true);
    };
  }, [open, disabled, value, enabledOptions.length]);

  const onButtonKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;

    if (!open) {
      if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
        e.preventDefault();
        openMenu();
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, enabledOptions.length - 1));
      return;
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
      return;
    }

    if (e.key === "Enter") {
      e.preventDefault();
      const opt = enabledOptions[activeIdx];
      if (opt) pick(opt.value);
      return;
    }

    if (e.key === "Escape") {
      e.preventDefault();
      close();
      return;
    }
  };

  useEffect(() => {
    if (!open) return;
    const menu = menuRef.current;
    if (!menu) return;

    const el = menu.querySelector(`[data-idx="${activeIdx}"]`) as HTMLElement | null;
    if (!el) return;

    el.scrollIntoView({ block: "nearest" });
  }, [activeIdx, open]);

  return (
    <div ref={wrapRef} className={`${styles.wrap} ${className ?? ""}`}>
      <button
        ref={btnRef}
        type="button"
        className={styles.button}
        onClick={toggle}
        onKeyDown={onButtonKeyDown}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <div className={styles.text}>
          {selected ? (
            <>
              <div className={styles.label}>{selected.label}</div>
              {selected.subLabel ? <div className={styles.subLabel}>{selected.subLabel}</div> : null}
            </>
          ) : (
            <div className={styles.placeholder}>{placeholder}</div>
          )}
        </div>

        <span className={`${styles.chevron} ${open ? styles.chevronOpen : ""}`} aria-hidden="true">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path
              d="M6 9l6 6 6-6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </button>

      {mounted && open && pos
        ? createPortal(
            <div
              ref={menuRef}
              className={styles.menu}
              style={{
                top: `${pos.top}px`,
                left: `${pos.left}px`,
                width: `${pos.width}px`,
                maxHeight: `${menuMaxHeight}px`,
              }}
              role="listbox"
            >
              {options.length === 0 ? (
                <div className={styles.empty}>Нет вариантов</div>
              ) : (
                options.map((o) => {
                  const enabledIdx = enabledOptions.findIndex((x) => x.value === o.value);
                  const isActive = enabledIdx === activeIdx && !o.disabled;
                  const isSelected = o.value === value;

                  return (
                    <button
                      key={o.value}
                      type="button"
                      className={`${styles.item} ${isActive ? styles.active : ""} ${
                        isSelected ? styles.selected : ""
                      } ${o.disabled ? styles.disabled : ""}`}
                      onMouseEnter={() => {
                        if (o.disabled) return;
                        if (enabledIdx >= 0) setActiveIdx(enabledIdx);
                      }}
                      onClick={() => {
                        if (o.disabled) return;
                        pick(o.value);
                      }}
                      disabled={o.disabled}
                      data-idx={enabledIdx}
                      role="option"
                      aria-selected={isSelected}
                    >
                      <div className={styles.itemText}>
                        <div className={styles.itemLabel}>{o.label}</div>
                        {o.subLabel ? <div className={styles.itemSub}>{o.subLabel}</div> : null}
                      </div>

                      {isSelected ? (
                        <span className={styles.check} aria-hidden="true">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                            <path
                              d="M20 6L9 17l-5-5"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </span>
                      ) : null}
                    </button>
                  );
                })
              )}
            </div>,
            document.body
          )
        : null}
    </div>
  );
}
