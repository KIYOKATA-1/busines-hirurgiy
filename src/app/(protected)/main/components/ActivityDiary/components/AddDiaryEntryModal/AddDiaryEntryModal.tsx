"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import styles from "./AddDiaryEntryModal.module.scss";

import ModalPortal from "@/app/components/ModalPortal/ModalPortal";
import { diaryService } from "@/services/diary/diary.service";
import type { CreateDiaryEntryPayload } from "@/services/diary/diary.types";
import { useToast } from "@/app/components/Toast/ToastProvider";

type Props = {
  open: boolean;
  onClose: () => void;
  presetTags?: string[];
  presetTitle?: string | null;
};

function uniq(arr: string[]) {
  const s = new Set<string>();
  arr.forEach((x) => {
    const v = (x ?? "").trim();
    if (v) s.add(v);
  });
  return Array.from(s);
}

function splitTags(raw: string) {
  return raw
    .split(/[,\n]/g)
    .map((x) => x.trim())
    .filter(Boolean);
}

export default function AddDiaryEntryModal({ open, onClose, presetTags, presetTitle }: Props) {
  const toast = useToast();

  const [mood, setMood] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [text, setText] = useState("");

  const [saving, setSaving] = useState(false);

  const moodRef = useRef<HTMLInputElement | null>(null);

  const baseTags = useMemo(() => uniq(presetTags ?? []), [presetTags]);

  const canSave = useMemo(() => {
    return !saving && mood.trim().length > 0 && text.trim().length > 0;
  }, [mood, text, saving]);

  useEffect(() => {
    if (!open) return;

    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKeyDown);
    setTimeout(() => moodRef.current?.focus(), 0);

    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;

    setMood("");
    setTagsInput("");
    setTags([]);
    setText("");
    setSaving(false);
  }, [open]);

  if (!open) return null;

  function addTagsFromInput() {
    const incoming = splitTags(tagsInput);
    if (!incoming.length) return;

    setTags((prev) => uniq([...prev, ...incoming]));
    setTagsInput("");
  }

  async function onSave() {
    if (!canSave) return;

    const payload: CreateDiaryEntryPayload = {
      mood: mood.trim(),
      tags: uniq([...baseTags, ...tags]),
      text: text.trim(),
    };

    setSaving(true);
    try {
      await diaryService.createEntry(payload);
      toast.success("Запись сохранена и отправлена модератору.");
      onClose();
    } catch (e: any) {
      const msg =
        e?.response?.data?.message ||
        e?.message ||
        "Не удалось сохранить запись. Попробуйте еще раз.";
      toast.error(String(msg));
    } finally {
      setSaving(false);
    }
  }

  return (
    <ModalPortal>
      <div className={styles.overlay} role="dialog" aria-modal="true" aria-label="Новая запись дневника">
        <div
          className={styles.backdrop}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        />

        <div className={styles.modal}>
          <div className={styles.head}>
            <div className={styles.headText}>
              <div className={styles.title}>{presetTitle ?? "Новая запись"}</div>
              <div className={styles.subtitle}>Заполните mood и текст. Теги — опционально.</div>

              {baseTags.length > 0 && (
                <div className={styles.presetTags}>
                  {baseTags.map((t) => (
                    <span key={t} className={styles.presetTag}>
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Закрыть">
              ✕
            </button>
          </div>

          <div className={styles.body}>
            <div className={styles.field}>
              <label className={styles.label}>Mood</label>
              <input
                ref={moodRef}
                className={styles.input}
                value={mood}
                onChange={(e) => setMood(e.target.value)}
                placeholder="Например: спокойный, бодрый, тревожный..."
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Tags</label>

              <div className={styles.tagsRow}>
                <input
                  className={styles.input}
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="Введите теги и нажмите Enter (или запятую)"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addTagsFromInput();
                    }
                    if (e.key === ",") {
                      e.preventDefault();
                      addTagsFromInput();
                    }
                  }}
                />
                <button
                  type="button"
                  className={styles.addTagBtn}
                  onClick={addTagsFromInput}
                  disabled={saving}
                >
                  Добавить
                </button>
              </div>

              {(baseTags.length > 0 || tags.length > 0) && (
                <div className={styles.chips}>
                  {baseTags.map((t) => (
                    <span key={`base-${t}`} className={styles.chipBase} title="Контекст шага/болезни">
                      {t}
                    </span>
                  ))}

                  {tags.map((t) => (
                    <button
                      key={t}
                      type="button"
                      className={styles.chip}
                      onClick={() => setTags((prev) => prev.filter((x) => x !== t))}
                      disabled={saving}
                      title="Нажмите чтобы удалить"
                    >
                      <span className={styles.chipText}>{t}</span>
                      <span className={styles.chipX} aria-hidden="true">
                        ✕
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Text</label>
              <textarea
                className={styles.textarea}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Опишите, что вы сделали по шагу, что получилось, что было трудно, какой прогресс..."
                rows={6}
              />
              <div className={styles.hint}>
                Минимум: <b>mood</b> и <b>text</b>.
              </div>
            </div>
          </div>

          <div className={styles.footer}>
            <button type="button" className={styles.cancelBtn} onClick={onClose} disabled={saving}>
              Отмена
            </button>

            <button type="button" className={styles.saveBtn} onClick={onSave} disabled={!canSave}>
              {saving ? "Сохранение..." : "Сохранить"}
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
