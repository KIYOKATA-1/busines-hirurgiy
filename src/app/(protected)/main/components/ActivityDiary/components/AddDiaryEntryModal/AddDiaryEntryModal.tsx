"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import styles from "./AddDiaryEntryModal.module.scss";

import ModalPortal from "@/app/components/ModalPortal/ModalPortal";
import DiseaseDropdown from "@/app/components/DiseaseDropdown/DiseaseDropdown";
import type { DiseaseDropdownOption } from "@/app/components/DiseaseDropdown/DiseaseDropdown.types";
import { diaryService } from "@/services/diary/diary.service";
import type { CreateDiaryEntryPayload } from "@/services/diary/diary.types";
import type { IUserDiseaseItem } from "@/services/userDiseases/userDiseases.types";
import { useToast } from "@/app/components/Toast/ToastProvider";

type Props = {
  open: boolean;
  onClose: () => void;
  presetTags?: string[];
  presetTitle?: string | null;
  diseases?: IUserDiseaseItem[];
  defaultDiseaseId?: string | null;
  lockDisease?: boolean;
  onSaved?: (opts?: { diseaseId?: string }) => void | Promise<void>;
};

const MAX_TAG_LENGTH = 32;

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

function normalizeTag(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  return trimmed.length > MAX_TAG_LENGTH ? trimmed.slice(0, MAX_TAG_LENGTH) : trimmed;
}

function normalizeTags(rawTags: string[]) {
  return uniq(
    rawTags
      .map((tag) => normalizeTag(tag))
      .filter((tag): tag is string => Boolean(tag))
  );
}

export default function AddDiaryEntryModal({
  open,
  onClose,
  presetTags,
  presetTitle,
  diseases,
  defaultDiseaseId,
  lockDisease = false,
  onSaved,
}: Props) {
  const toast = useToast();

  const [mood, setMood] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [text, setText] = useState("");
  const [selectedDiseaseId, setSelectedDiseaseId] = useState("");

  const [saving, setSaving] = useState(false);

  const moodRef = useRef<HTMLInputElement | null>(null);

  const diseaseOptions: DiseaseDropdownOption[] = useMemo(() => {
    return (diseases ?? []).map((d) => ({
      value: d.userDiseaseId,
      label: d.diseaseName || "Без названия",
      subLabel: [d.categoryName, d.organName].filter(Boolean).join(" • "),
    }));
  }, [diseases]);

  const selectedDisease = useMemo(() => {
    return (diseases ?? []).find((d) => d.userDiseaseId === selectedDiseaseId) ?? null;
  }, [diseases, selectedDiseaseId]);

  const diseaseTag = selectedDisease?.diseaseName
    ? `disease:${selectedDisease.diseaseName}`
    : null;

  const baseTags = useMemo(() => {
    const incoming = presetTags ?? [];
    return normalizeTags([...incoming, ...(diseaseTag ? [diseaseTag] : [])]);
  }, [presetTags, diseaseTag]);

  const hasDiseaseOptions = diseaseOptions.length > 0;
  const requiresDisease = typeof diseases !== "undefined";

  const canSave = useMemo(() => {
    if (requiresDisease && !selectedDiseaseId) return false;
    return !saving && mood.trim().length > 0 && text.trim().length > 0;
  }, [mood, text, saving, requiresDisease, selectedDiseaseId]);

  const modalTitle = useMemo(() => {
    if (selectedDisease?.diseaseName) {
      return `Отчёт • ${selectedDisease.diseaseName}`;
    }
    return presetTitle ?? "Новая запись";
  }, [presetTitle, selectedDisease?.diseaseName]);

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

  useEffect(() => {
    if (!open) return;
    const nextId = defaultDiseaseId ?? diseases?.[0]?.userDiseaseId ?? "";
    setSelectedDiseaseId(nextId);
  }, [open, defaultDiseaseId, diseases]);

  if (!open) return null;

  function addTagsFromInput() {
    const incoming = splitTags(tagsInput);
    if (!incoming.length) return;

    setTags((prev) => uniq([...prev, ...normalizeTags(incoming)]));
    setTagsInput("");
  }

  async function onSave() {
    if (!canSave) return;

    const payload: CreateDiaryEntryPayload = {
      mood: mood.trim(),
      tags: normalizeTags([...baseTags, ...tags]),
      text: text.trim(),
    };

    setSaving(true);
    try {
      await diaryService.createEntry(payload);
      toast.success("Запись сохранена и отправлена модератору.");
      void onSaved?.({ diseaseId: selectedDiseaseId || undefined });
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
              <div className={styles.title}>{modalTitle}</div>
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
              <label className={styles.label}>Болезнь</label>
              <DiseaseDropdown
                value={selectedDiseaseId}
                options={diseaseOptions}
                placeholder={hasDiseaseOptions ? "Выберите болезнь" : "Нет доступных болезней"}
                onChange={setSelectedDiseaseId}
                disabled={lockDisease || saving || !hasDiseaseOptions}
              />
              {requiresDisease && !hasDiseaseOptions && (
                <div className={styles.hint}>Нет доступных болезней для отчёта.</div>
              )}
            </div>

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
