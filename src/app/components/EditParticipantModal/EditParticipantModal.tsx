"use client";

import { useEffect, useId, useRef, useState } from "react";
import styles from "./EditParticipantModal.module.scss";
import ModalPortal from "@/app/components/ModalPortal/ModalPortal";

type Props = {
  open: boolean;

  initialName: string;
  initialSurname: string;

  title?: string;

  loading?: boolean;
  error?: string | null;

  onClose: () => void;
  onSave: (payload: { name: string; surname: string }) => void;
};

function norm(v: string) {
  return (v ?? "").trim();
}

export default function EditParticipantModal({
  open,
  initialName,
  initialSurname,
  title = "Редактировать участника",
  loading = false,
  error = null,
  onClose,
  onSave,
}: Props) {
  const nameId = useId();
  const surnameId = useId();

  const [name, setName] = useState(initialName ?? "");
  const [surname, setSurname] = useState(initialSurname ?? "");
  const [touched, setTouched] = useState({ name: false, surname: false });

  const nameRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!open) return;

    document.body.classList.add("modalOpen");

    setName(initialName ?? "");
    setSurname(initialSurname ?? "");
    setTouched({ name: false, surname: false });

    const t = window.setTimeout(() => {
      nameRef.current?.focus();
      nameRef.current?.select();
    }, 0);

    return () => {
      window.clearTimeout(t);
      document.body.classList.remove("modalOpen");
    };
  }, [open, initialName, initialSurname]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (!loading) onClose();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose, loading]);

  if (!open) return null;

  const nameV = norm(name);
  const surnameV = norm(surname);

  const nameErr = touched.name && !nameV ? "Введите имя" : "";
  const surnameErr = touched.surname && !surnameV ? "Введите фамилию" : "";

  const canSave = !loading && !!nameV && !!surnameV;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ name: true, surname: true });

    if (!nameV || !surnameV || loading) return;
    onSave({ name: nameV, surname: surnameV });
  };

  const closeSafe = () => {
    if (loading) return;
    onClose();
  };

  const onOverlayMouseDown = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) closeSafe();
  };

  return (
    <ModalPortal>
      <section
        className={styles.overlay}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onMouseDown={onOverlayMouseDown}
      >
        <form className={styles.modal} onSubmit={submit}>
          <header className={styles.head}>
            <h3 className={styles.title}>{title}</h3>
            <button type="button" className={styles.closeBtn} onClick={closeSafe} aria-label="Закрыть">
              ✕
            </button>
          </header>

          <section className={styles.content}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor={nameId}>Имя</label>
              <input
                ref={nameRef}
                id={nameId}
                className={`${styles.input} ${nameErr ? styles.inputError : ""}`}
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={() => setTouched((s) => ({ ...s, name: true }))}
                placeholder="Введите имя"
                autoComplete="off"
                disabled={loading}
              />
              {nameErr ? <p className={styles.hintError}>{nameErr}</p> : null}
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor={surnameId}>Фамилия</label>
              <input
                id={surnameId}
                className={`${styles.input} ${surnameErr ? styles.inputError : ""}`}
                value={surname}
                onChange={(e) => setSurname(e.target.value)}
                onBlur={() => setTouched((s) => ({ ...s, surname: true }))}
                placeholder="Введите фамилию"
                autoComplete="off"
                disabled={loading}
              />
              {surnameErr ? <p className={styles.hintError}>{surnameErr}</p> : null}
            </div>

            {error ? <div className={styles.serverError} role="alert">{error}</div> : null}
          </section>

          <footer className={styles.footer}>
            <button type="button" className={styles.secondaryBtn} onClick={closeSafe} disabled={loading}>
              Отмена
            </button>
            <button type="submit" className={styles.primaryBtn} disabled={!canSave}>
              {loading ? "Сохранение..." : "Сохранить"}
            </button>
          </footer>
        </form>
      </section>
    </ModalPortal>
  );
}
