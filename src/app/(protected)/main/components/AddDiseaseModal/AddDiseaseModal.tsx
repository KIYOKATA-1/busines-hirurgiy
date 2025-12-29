"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import styles from "./AddDiseaseModal.module.scss";
import { IOrgan } from "@/services/organs/organ.types";

import { authService } from "@/services/auth/auth.service";
import { ICreateDiseaseRequest, IDiseaseCategory } from "@/services/disease/disease.types";
import { diseaseService } from "@/services/disease/disease.service";
import { organService } from "@/services/organs/organs.service";

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void;
};

type FormValues = {
  title: string;
  description: string;
  categoryId: string;
  organId: string;
};

const DEFAULT_VALUES: FormValues = {
  title: "",
  description: "",
  categoryId: "",
  organId: "",
};

export default function AddDiseaseModal({ open, onClose, onCreated }: Props) {
  const [categories, setCategories] = useState<IDiseaseCategory[]>([]);
  const [organs, setOrgans] = useState<IOrgan[]>([]);

  const [catLoading, setCatLoading] = useState(false);
  const [orgLoading, setOrgLoading] = useState(false);

  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitOk, setSubmitOk] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    watch,
    formState: { errors, isValid },
  } = useForm<FormValues>({
    defaultValues: DEFAULT_VALUES,
    mode: "onChange",
  });

  const descriptionValue = watch("description") ?? "";

  const categoryOptions = useMemo(() => diseaseService.toSelectOptions(categories), [categories]);
  const organOptions = useMemo(() => organService.toSelectOptions(organs), [organs]);

  const disableCategorySelect = catLoading || categoryOptions.length <= 1;
  const disableOrganSelect = orgLoading || organOptions.length <= 1;

  useEffect(() => {
    if (!open) return;

    let mounted = true;

    reset(DEFAULT_VALUES);
    setSubmitError(null);
    setSubmitOk(null);
    setSaving(false);

    const loadCategories = async () => {
      try {
        setCatLoading(true);
        const data = await diseaseService.getCategories();
        if (!mounted) return;

        setCategories(data);

        const firstId = data[0]?.id ?? "";
        setValue("categoryId", firstId, { shouldValidate: true, shouldDirty: true });
      } catch {
        if (!mounted) return;
        setCategories([]);
        setValue("categoryId", "", { shouldValidate: true, shouldDirty: true });
      } finally {
        if (!mounted) return;
        setCatLoading(false);
      }
    };

    const loadOrgans = async () => {
      try {
        setOrgLoading(true);
        const data = await organService.getAll();
        if (!mounted) return;

        setOrgans(data);

        const firstId = data[0]?.id ?? "";
        setValue("organId", firstId, { shouldValidate: true, shouldDirty: true });
      } catch {
        if (!mounted) return;
        setOrgans([]);
        setValue("organId", "", { shouldValidate: true, shouldDirty: true });
      } finally {
        if (!mounted) return;
        setOrgLoading(false);
      }
    };

    loadCategories();
    loadOrgans();

    return () => {
      mounted = false;
    };
  }, [open, reset, setValue]);

  const onBackdrop = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  const onSubmit = async (values: FormValues) => {
    setSubmitError(null);
    setSubmitOk(null);

    const accessToken = authService.getAccessToken();
    if (!accessToken) {
      setSubmitError("Токен не найден (access_token). Перелогиньтесь.");
      return;
    }

    const payload: ICreateDiseaseRequest = {
      title: values.title.trim(),
      description: values.description.trim(),
      categoryId: values.categoryId,
      organId: values.organId,
    };

    try {
      setSaving(true);
      await diseaseService.create(payload, accessToken);
      setSubmitOk("Болезнь успешно добавлена");
      onCreated?.();
      setTimeout(() => onClose(), 350);
    } catch {
      setSubmitError("Ошибка при добавлении болезни");
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  const hasRequiredLists = categoryOptions.length > 0 && organOptions.length > 0;

  const disabledSubmit =
    saving || catLoading || orgLoading || !hasRequiredLists || !isValid;

  return (
    <div className={styles.backdrop} onMouseDown={onBackdrop}>
      <div className={styles.panel} role="dialog" aria-modal="true">
        <div className={styles.head}>
          <div className={styles.headLeft}>
            <div className={styles.title}>Добавить болезнь</div>
            <div className={styles.desc}>
              Создайте карточку проблемы и привяжите её к органу
            </div>
          </div>

          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Закрыть"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path
                d="M18 6L6 18M6 6l12 12"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        <form className={styles.body} onSubmit={handleSubmit(onSubmit)}>
          <div className={styles.grid}>
            <div className={styles.field}>
              <div className={styles.label}>Название</div>
              <input
                className={styles.input}
                placeholder="Например: Negative cash flow"
                maxLength={80}
                {...register("title", {
                  required: "Введите название",
                  minLength: { value: 2, message: "Минимум 2 символа" },
                })}
              />
              {errors.title?.message && (
                <div className={styles.inlineError}>{errors.title.message}</div>
              )}
            </div>

            <div className={styles.field}>
              <div className={styles.label}>Категория</div>
              <div className={styles.selectWrap}>
                <select
                  className={styles.select}
                  disabled={disableCategorySelect}
                  {...register("categoryId")}
                >
                  {catLoading && <option value="">Загрузка...</option>}

                  {!catLoading &&
                    categoryOptions.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                </select>

                <span className={styles.chevron} aria-hidden="true">
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
              </div>
            </div>

            <div className={styles.fieldFull}>
              <div className={styles.label}>Орган</div>
              <div className={styles.selectWrap}>
                <select
                  className={styles.select}
                  disabled={disableOrganSelect}
                  {...register("organId")}
                >
                  {orgLoading && <option value="">Загрузка...</option>}

                  {!orgLoading &&
                    organOptions.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.label}
                      </option>
                    ))}
                </select>

                <span className={styles.chevron} aria-hidden="true">
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
              </div>
            </div>

            <div className={styles.fieldFull}>
              <div className={styles.label}>Описание</div>
              <textarea
                className={styles.textarea}
                placeholder="Опишите симптомы, причины и контекст..."
                rows={6}
                maxLength={2000}
                {...register("description", {
                  required: "Введите описание",
                  minLength: { value: 5, message: "Минимум 5 символов" },
                })}
              />
              <div className={styles.hint}>{descriptionValue.trim().length}/2000</div>

              {errors.description?.message && (
                <div className={styles.inlineError}>{errors.description.message}</div>
              )}
            </div>
          </div>

          {submitError && <div className={styles.alertError}>{submitError}</div>}
          {submitOk && <div className={styles.alertOk}>{submitOk}</div>}

          <div className={styles.footer}>
            <button
              type="button"
              className={styles.secondary}
              onClick={onClose}
              disabled={saving}
            >
              Отмена
            </button>

            <button type="submit" className={styles.primary} disabled={disabledSubmit}>
              {saving ? "Сохранение..." : "Добавить"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
