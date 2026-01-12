"use client";

import React, { useEffect, useLayoutEffect, useRef } from "react";
import styles from "./Tablet.module.scss";

export type Role = "participant" | "moderator" | "admin";
export type TabKey = "anatomy" | "progress" | "diary" | "library" | "participants";

export type TabConfig = {
  key: TabKey;
  label: string;
  icon: React.FC<React.SVGProps<SVGSVGElement>>;
};

type Props = {
  role: Role;
  tabsByRole: Record<Role, readonly TabConfig[]>;
  value: TabKey;
  onChange: (key: TabKey) => void;
};

export function Tablet({ role, tabsByRole, value, onChange }: Props) {
  const tabletRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLDivElement>(null);

  const tabRefs = useRef<Record<TabKey, HTMLButtonElement | null>>({
    anatomy: null,
    progress: null,
    diary: null,
    library: null,
    participants: null,
  });

  const tabs = tabsByRole[role];

  const syncIndicator = () => {
    const active = tabRefs.current[value];
    const indicator = indicatorRef.current;
    const tablet = tabletRef.current;

    if (!active || !indicator || !tablet) return;

    indicator.style.width = `${active.offsetWidth}px`;
    indicator.style.height = `${active.offsetHeight}px`;
    indicator.style.transform = `translate3d(${active.offsetLeft}px, ${active.offsetTop}px, 0)`;
  };

  useLayoutEffect(() => {
    syncIndicator();
    requestAnimationFrame(syncIndicator);
  }, [value, role]);

  useEffect(() => {
    const tablet = tabletRef.current;
    if (!tablet) return;

    const ro = new ResizeObserver(() => syncIndicator());
    ro.observe(tablet);

    Object.values(tabRefs.current).forEach((btn) => {
      if (btn) ro.observe(btn);
    });

    const onResize = () => syncIndicator();
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      ro.disconnect();
    };
  }, [value, role]);

  return (
    <div ref={tabletRef} className={styles.tablet} role="tablist" aria-label="Навигация">
      <div ref={indicatorRef} className={styles.indicator} aria-hidden="true" />

      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = value === tab.key;

        return (
          <button
            key={tab.key}
            ref={(el) => {
              tabRefs.current[tab.key] = el;
            }}
            type="button"
            role="tab"
            aria-selected={isActive}
            tabIndex={isActive ? 0 : -1}
            className={`${styles.tab} ${isActive ? styles.active : ""}`}
            onClick={() => onChange(tab.key)}
          >
            <span className={styles.icon} aria-hidden="true">
              <Icon />
            </span>
            <span className={styles.label}>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
