"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";

import { useAuthStore } from "@/store/auth.store";
import styles from "../styles/auth.module.scss";
import GoogleRedirectButton from "@/shared/ui/GoogleButton/GoogleRedirectButton";

import { ILoginRequest } from "@/services/auth/auth.types";

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuth, loading, error } = useAuthStore();

  const {
    register,
    handleSubmit,
    formState: { errors, isValid, isSubmitting },
  } = useForm<ILoginRequest>({
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: { email: "", password: "" },
  });

  useEffect(() => {
    if (isAuth) router.replace("/main");
  }, [isAuth, router]);

  const onSubmit = async (data: ILoginRequest) => {
    if (loading) return;
    await login({ email: data.email.trim(), password: data.password });
  };

  const disableSubmit = !isValid || loading || isSubmitting;

  return (
    <main className={styles.container}>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className={styles.form}
        noValidate
      >
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
          <span>Пароль</span>
          <input
            type="password"
            autoComplete="current-password"
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

        <button
          type="submit"
          className={styles.submitButton}
          disabled={disableSubmit}
          aria-busy={loading}
        >
          {loading ? "Входим..." : "Войти"}
        </button>

        <div className={styles.divider} aria-hidden="true">
          <span className={styles.dividerLine} />
          <span className={styles.dividerText}>или</span>
          <span className={styles.dividerLine} />
        </div>

        <GoogleRedirectButton />

        <div className={styles.registerRow}>
          <span className={styles.registerText}>Нет аккаунта?</span>
          <Link href="/register" className={styles.registerLink}>
            Зарегистрироваться
          </Link>
        </div>
      </form>
    </main>
  );
}
