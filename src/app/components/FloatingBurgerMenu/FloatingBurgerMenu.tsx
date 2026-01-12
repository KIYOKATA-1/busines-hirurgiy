"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./FloatingBurgerMenu.module.scss";

import type { Role } from "@/app/components/Tablet/Tablet";
import { ArrowLeftIcon, BurgerIcon, ShieldIcon, UserIcon } from "@/shared/ui/icons";

type Props = {
  role: Role;

  position?: "left" | "right";

  showBack?: boolean;
  showPersonal?: boolean;
  showAdmin?: boolean;
  backLabel?: string;
  personalLabel?: string;
  adminLabel?: string;
  onBack?: () => void;
  onPersonal?: () => void;
  onAdmin?: () => void;
};

export default function FloatingBurgerMenu({
  role,
  position = "right",

  showBack = false,
  showPersonal = true,
  showAdmin = true,

  backLabel = "Назад",
  personalLabel = "Личный кабинет",
  adminLabel = "Админ панель",

  onBack,
  onPersonal,
  onAdmin,
}: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  const canSeeAdmin = role === "admin" || role === "moderator";

  const actions = useMemo(() => {
    const a: Array<{
      key: string;
      label: string;
      icon: React.FC<React.SVGProps<SVGSVGElement>>;
      onClick?: () => void;
      hidden?: boolean;
    }> = [
        {
          key: "back",
          label: backLabel,
          icon: ArrowLeftIcon,
          onClick: onBack,
          hidden: !showBack,
        },
        {
          key: "personal",
          label: personalLabel,
          icon: UserIcon,
          onClick: onPersonal,
          hidden: !showPersonal,
        },
        {
          key: "admin",
          label: adminLabel,
          icon: ShieldIcon,
          onClick: onAdmin,
          hidden: !showAdmin || !canSeeAdmin,
        },
      ];

    return a.filter((x) => !x.hidden && typeof x.onClick === "function");
  }, [
    showBack,
    showPersonal,
    showAdmin,
    canSeeAdmin,
    backLabel,
    personalLabel,
    adminLabel,
    onBack,
    onPersonal,
    onAdmin,
  ]);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (!open) return;
      if (rootRef.current && e.target instanceof Node && !rootRef.current.contains(e.target)) {
        setOpen(false);
      }
    };

    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", onClickOutside);
    window.addEventListener("keydown", onEsc);

    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      window.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  if (actions.length === 0) return null;

  return (
    <div
      ref={rootRef}
      className={`${styles.root} ${position === "left" ? styles.left : styles.right}`}
    >
      <div className={`${styles.stack} ${open ? styles.stackOpen : ""}`}>
        {actions.map((a) => {
          const Icon = a.icon;

          return (
            <button
              key={a.key}
              type="button"
              className={styles.actionBtn}
              onClick={() => {
                setOpen(false);
                a.onClick?.();
              }}
            >
              <span className={styles.actionIcon}>
                <Icon width={16} height={16} />
              </span>
              <span className={styles.actionText}>{a.label}</span>
            </button>
          );
        })}
      </div>

      <button
        type="button"
        className={`${styles.fab} ${open ? styles.fabOpen : ""}`}
        onClick={() => setOpen((v) => !v)}
        aria-label="Меню"
        aria-expanded={open}
      >
        <BurgerIcon open={open} />
      </button>
    </div>
  );
}
