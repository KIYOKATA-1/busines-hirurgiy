"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";

import { useAuthStore } from "@/store/auth.store";
import styles from "../styles/auth.module.scss";

import { IRegistRequest } from "@/services/auth/auth.types";

type RegisterForm = Omit<IRegistRequest, "role"> & {
  confirm: string;
};

export default function RegisterPage() {
  const router = useRouter();
  const { register: registerAction, loading, error, isAuth } = useAuthStore();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isValid, isSubmitting },
  } = useForm<RegisterForm>({
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: {
      email: "",
      name: "",
      surname: "",
      password: "",
      confirm: "",
    },
  });

  useEffect(() => {
    if (isAuth) router.replace("/main");
  }, [isAuth, router]);

  const passwordValue = watch("password");

  const onSubmit = async (data: RegisterForm) => {
    if (loading) return;

    await registerAction({
      email: data.email.trim(),
      name: data.name.trim(),
      surname: data.surname.trim(),
      password: data.password,
      role: "participant",
    });

    router.replace("/login");
  };

  const disableSubmit = !isValid || loading || isSubmitting;

  return (
    <main className={styles.container}>
      <form onSubmit={handleSubmit(onSubmit)} className={styles.form} noValidate>
        <div className={styles.logoContainer}>
          <Image src="/assets/logo.svg" alt="Logo" width={32} height={32} />
        </div>

        <div className={styles.head}>
          <h1 className={styles.title}>Платформа Анатомии Бизнеса</h1>
          <p className={styles.subtitle}>Диагностируйте и лечите ваш бизнес</p>
        </div>

        {error && <p className={styles.error}>{error}</p>}

        <label className={styles.label}>
          <span>Email</span>
          <input
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="name@example.com"
            disabled={loading}
            aria-invalid={!!errors.email}
            {...register("email", {
              required: "Введите email",
              pattern: {
                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: "Некорректный email",
              },
            })}
            className={`${styles.input} ${errors.email ? styles.inputError : ""}`}
          />
          {errors.email?.message && (
            <p className={styles.fieldError}>{errors.email.message}</p>
          )}
        </label>

        <label className={styles.label}>
          <span>Имя</span>
          <input
            type="text"
            autoComplete="given-name"
            placeholder="Ваше имя"
            disabled={loading}
            aria-invalid={!!errors.name}
            {...register("name", {
              required: "Введите имя",
              minLength: { value: 2, message: "Минимум 2 символа" },
            })}
            className={`${styles.input} ${errors.name ? styles.inputError : ""}`}
          />
          {errors.name?.message && (
            <p className={styles.fieldError}>{errors.name.message}</p>
          )}
        </label>

        <label className={styles.label}>
          <span>Фамилия</span>
          <input
            type="text"
            autoComplete="family-name"
            placeholder="Ваша фамилия"
            disabled={loading}
            aria-invalid={!!errors.surname}
            {...register("surname", {
              required: "Введите фамилию",
              minLength: { value: 2, message: "Минимум 2 символа" },
            })}
            className={`${styles.input} ${
              errors.surname ? styles.inputError : ""
            }`}
          />
          {errors.surname?.message && (
            <p className={styles.fieldError}>{errors.surname.message}</p>
          )}
        </label>

        <label className={styles.label}>
          <span>Пароль</span>
          <input
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            disabled={loading}
            aria-invalid={!!errors.password}
            {...register("password", {
              required: "Введите пароль",
              minLength: { value: 6, message: "Минимум 6 символов" },
            })}
            className={`${styles.input} ${
              errors.password ? styles.inputError : ""
            }`}
          />
          {errors.password?.message && (
            <p className={styles.fieldError}>{errors.password.message}</p>
          )}
        </label>

        <label className={styles.label}>
          <span>Повторите пароль</span>
          <input
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            disabled={loading}
            aria-invalid={!!errors.confirm}
            {...register("confirm", {
              required: "Повторите пароль",
              validate: (value) =>
                value === passwordValue || "Пароли не совпадают",
            })}
            className={`${styles.input} ${
              errors.confirm ? styles.inputError : ""
            }`}
          />
          {errors.confirm?.message && (
            <p className={styles.fieldError}>{errors.confirm.message}</p>
          )}
        </label>

        <button
          type="submit"
          disabled={disableSubmit}
          className={styles.submitButton}
          aria-busy={loading}
        >
          {loading ? "..." : "Зарегистрироваться"}
        </button>

        <div className={styles.bottomLinkRow}>
          <span className={styles.bottomText}>Есть аккаунт?</span>
          <Link href="/login" className={styles.bottomLink}>
            Войти
          </Link>
        </div>
      </form>
    </main>
  );
}
