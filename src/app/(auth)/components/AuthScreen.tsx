"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { AnimatePresence, motion } from "framer-motion";

import { useAuthStore } from "@/store/auth.store";
import GoogleRedirectButton from "@/shared/ui/GoogleButton/GoogleRedirectButton";

import { MailIcon } from "@/shared/ui/icons/MailIcon";
import { PasswordIcon } from "@/shared/ui/icons/PasswordIcon";
import { UserIcon } from "@/shared/ui/icons/UserIcon";

import type { ILoginRequest, IRegistRequest } from "@/services/auth/auth.types";
import styles from "../styles/auth.module.scss";

type Mode = "login" | "register";
type RegisterForm = Omit<IRegistRequest, "role"> & { confirm: string };

type Props = {
  initialMode?: Mode;
  syncUrl?: boolean;
};

function modeFromPath(pathname: string): Mode {
  if (pathname.includes("/register")) return "register";
  return "login";
}

export default function AuthScreen({ initialMode = "login", syncUrl = true }: Props) {
  const router = useRouter();
  const pathname = usePathname();

  const { login, register: registerAction, isAuth, loading, error } = useAuthStore();

  const [mode, setMode] = useState<Mode>(() => {
    if (syncUrl) return modeFromPath(pathname);
    return initialMode;
  });

  const isLogin = mode === "login";

  useEffect(() => {
    if (!syncUrl) return;
    const m = modeFromPath(pathname);
    setMode(m);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, syncUrl]);

  useEffect(() => {
    if (isAuth) router.replace("/main");
  }, [isAuth, router]);

  const loginForm = useForm<ILoginRequest>({
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: { email: "", password: "" },
  });

  const registerForm = useForm<RegisterForm>({
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

  const passwordValue = registerForm.watch("password");

  const pushMode = (next: Mode) => {
    if (!syncUrl) return;
    router.push(next === "login" ? "/login" : "/register");
  };

  const switchMode = (next: Mode) => {
    if (loading) return;
    loginForm.clearErrors();
    registerForm.clearErrors();

    if (syncUrl) {
      pushMode(next);
      return;
    }

    setMode(next);
  };

  const onSubmitLogin = async (data: ILoginRequest) => {
    if (loading) return;
    await login({ email: data.email.trim(), password: data.password });
  };

  const onSubmitRegister = async (data: RegisterForm) => {
    if (loading) return;

    await registerAction({
      email: data.email.trim(),
      name: data.name.trim(),
      surname: data.surname.trim(),
      password: data.password,
      role: "participant",
    });

    loginForm.setValue("email", data.email.trim(), { shouldValidate: true });
    loginForm.setValue("password", "", { shouldValidate: false });

    if (syncUrl) router.replace("/login");
    else setMode("login");
  };

  const disableSubmit = useMemo(() => {
    if (loading) return true;

    if (isLogin) {
      return !loginForm.formState.isValid || loginForm.formState.isSubmitting;
    }

    return !registerForm.formState.isValid || registerForm.formState.isSubmitting;
  }, [
    loading,
    isLogin,
    loginForm.formState.isValid,
    loginForm.formState.isSubmitting,
    registerForm.formState.isValid,
    registerForm.formState.isSubmitting,
  ]);

  return (
    <main className={styles.container}>
      <motion.section
        className={styles.shell}
        initial={{ opacity: 0, y: 10, filter: "blur(8px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: 0.55, ease: [0.2, 0.8, 0.2, 1] }}
      >
        <motion.div className={styles.form} layout>
          <div className={styles.logoContainer}>
            <div className={styles.logo}>
              <Image
                src="/assets/logo.svg"
                alt="Logo"
                fill
                priority
                sizes="64px"
                style={{ objectFit: "contain" }}
              />
            </div>
          </div>

          <div className={styles.head}>
            <h1 className={styles.title}>Платформа Анатомии Бизнеса</h1>
            <p className={styles.subtitle}>Диагностируйте и лечите ваш бизнес</p>

            <div className={styles.switcher} role="tablist" aria-label="Переключатель">
              <button
                type="button"
                className={`${styles.switchBtn} ${isLogin ? styles.active : ""}`}
                onClick={() => switchMode("login")}
                aria-selected={isLogin}
                role="tab"
                disabled={loading}
              >
                Вход
              </button>

              <button
                type="button"
                className={`${styles.switchBtn} ${!isLogin ? styles.active : ""}`}
                onClick={() => switchMode("register")}
                aria-selected={!isLogin}
                role="tab"
                disabled={loading}
              >
                Регистрация
              </button>

              <motion.span
                className={styles.switchPill}
                layout
                transition={{ type: "spring", stiffness: 520, damping: 38 }}
                style={{ left: isLogin ? 4 : "calc(50% + 2px)" }}
              />
            </div>
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <motion.div
            className={styles.animatedArea}
            layout
            transition={{ type: "spring", stiffness: 420, damping: 38 }}
          >
            <AnimatePresence mode="wait" initial={false}>
              {isLogin ? (
                <motion.form
                  key="login"
                  onSubmit={loginForm.handleSubmit(onSubmitLogin)}
                  className={styles.innerForm}
                  noValidate
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.22, ease: [0.2, 0.8, 0.2, 1] }}
                >
                  <label className={styles.label}>
                    <span>Email</span>

                    <div className={styles.inputWrap}>
                      <input
                        type="email"
                        inputMode="email"
                        autoComplete="email"
                        placeholder="name@example.com"
                        disabled={loading}
                        aria-invalid={!!loginForm.formState.errors.email}
                        {...loginForm.register("email", {
                          required: "Введите email",
                          pattern: {
                            value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                            message: "Некорректный email",
                          },
                        })}
                        className={`${styles.input} ${
                          loginForm.formState.errors.email ? styles.inputError : ""
                        }`}
                      />
                      <span className={styles.inputIcon} aria-hidden="true">
                        <MailIcon />
                      </span>
                    </div>

                    {loginForm.formState.errors.email?.message && (
                      <p className={styles.fieldError}>{loginForm.formState.errors.email.message}</p>
                    )}
                  </label>

                  <label className={styles.label}>
                    <span>Пароль</span>

                    <div className={styles.inputWrap}>
                      <input
                        type="password"
                        autoComplete="current-password"
                        placeholder="••••••••"
                        disabled={loading}
                        aria-invalid={!!loginForm.formState.errors.password}
                        {...loginForm.register("password", {
                          required: "Введите пароль",
                          minLength: { value: 6, message: "Минимум 6 символов" },
                        })}
                        className={`${styles.input} ${
                          loginForm.formState.errors.password ? styles.inputError : ""
                        }`}
                      />
                      <span className={styles.inputIcon} aria-hidden="true">
                        <PasswordIcon />
                      </span>
                    </div>

                    {loginForm.formState.errors.password?.message && (
                      <p className={styles.fieldError}>
                        {loginForm.formState.errors.password.message}
                      </p>
                    )}
                  </label>

                  <motion.button
                    type="submit"
                    className={styles.submitButton}
                    disabled={disableSubmit}
                    aria-busy={loading}
                    whileHover={!disableSubmit ? { y: -1 } : undefined}
                    whileTap={!disableSubmit ? { y: 0 } : undefined}
                    transition={{ type: "spring", stiffness: 520, damping: 30 }}
                  >
                    {loading ? "Входим..." : "Войти"}
                  </motion.button>

                  <div className={styles.divider} aria-hidden="true">
                    <span className={styles.dividerLine} />
                    <span className={styles.dividerText}>или</span>
                    <span className={styles.dividerLine} />
                  </div>

                  <GoogleRedirectButton />
                </motion.form>
              ) : (
                <motion.form
                  key="register"
                  onSubmit={registerForm.handleSubmit(onSubmitRegister)}
                  className={styles.innerForm}
                  noValidate
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.22, ease: [0.2, 0.8, 0.2, 1] }}
                >
                  <label className={styles.label}>
                    <span>Email</span>

                    <div className={styles.inputWrap}>
                      <input
                        type="email"
                        inputMode="email"
                        autoComplete="email"
                        placeholder="name@example.com"
                        disabled={loading}
                        aria-invalid={!!registerForm.formState.errors.email}
                        {...registerForm.register("email", {
                          required: "Введите email",
                          pattern: {
                            value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                            message: "Некорректный email",
                          },
                        })}
                        className={`${styles.input} ${
                          registerForm.formState.errors.email ? styles.inputError : ""
                        }`}
                      />
                      <span className={styles.inputIcon} aria-hidden="true">
                        <MailIcon />
                      </span>
                    </div>

                    {registerForm.formState.errors.email?.message && (
                      <p className={styles.fieldError}>
                        {registerForm.formState.errors.email.message}
                      </p>
                    )}
                  </label>

                  <div className={styles.row2}>
                    <label className={styles.label}>
                      <span>Имя</span>

                      <div className={styles.inputWrap}>
                        <input
                          type="text"
                          autoComplete="given-name"
                          placeholder="Ваше имя"
                          disabled={loading}
                          aria-invalid={!!registerForm.formState.errors.name}
                          {...registerForm.register("name", {
                            required: "Введите имя",
                            minLength: { value: 2, message: "Минимум 2 символа" },
                          })}
                          className={`${styles.input} ${
                            registerForm.formState.errors.name ? styles.inputError : ""
                          }`}
                        />
                        <span className={styles.inputIcon} aria-hidden="true">
                          <UserIcon />
                        </span>
                      </div>

                      {registerForm.formState.errors.name?.message && (
                        <p className={styles.fieldError}>
                          {registerForm.formState.errors.name.message}
                        </p>
                      )}
                    </label>

                    <label className={styles.label}>
                      <span>Фамилия</span>

                      <div className={styles.inputWrap}>
                        <input
                          type="text"
                          autoComplete="family-name"
                          placeholder="Ваша фамилия"
                          disabled={loading}
                          aria-invalid={!!registerForm.formState.errors.surname}
                          {...registerForm.register("surname", {
                            required: "Введите фамилию",
                            minLength: { value: 2, message: "Минимум 2 символа" },
                          })}
                          className={`${styles.input} ${
                            registerForm.formState.errors.surname ? styles.inputError : ""
                          }`}
                        />
                        <span className={styles.inputIcon} aria-hidden="true">
                          <UserIcon />
                        </span>
                      </div>

                      {registerForm.formState.errors.surname?.message && (
                        <p className={styles.fieldError}>
                          {registerForm.formState.errors.surname.message}
                        </p>
                      )}
                    </label>
                  </div>

                  <label className={styles.label}>
                    <span>Пароль</span>

                    <div className={styles.inputWrap}>
                      <input
                        type="password"
                        autoComplete="new-password"
                        placeholder="••••••••"
                        disabled={loading}
                        aria-invalid={!!registerForm.formState.errors.password}
                        {...registerForm.register("password", {
                          required: "Введите пароль",
                          minLength: { value: 6, message: "Минимум 6 символов" },
                        })}
                        className={`${styles.input} ${
                          registerForm.formState.errors.password ? styles.inputError : ""
                        }`}
                      />
                      <span className={styles.inputIcon} aria-hidden="true">
                        <PasswordIcon />
                      </span>
                    </div>

                    {registerForm.formState.errors.password?.message && (
                      <p className={styles.fieldError}>
                        {registerForm.formState.errors.password.message}
                      </p>
                    )}
                  </label>

                  <label className={styles.label}>
                    <span>Повторите пароль</span>

                    <div className={styles.inputWrap}>
                      <input
                        type="password"
                        autoComplete="new-password"
                        placeholder="••••••••"
                        disabled={loading}
                        aria-invalid={!!registerForm.formState.errors.confirm}
                        {...registerForm.register("confirm", {
                          required: "Повторите пароль",
                          validate: (value) => value === passwordValue || "Пароли не совпадают",
                        })}
                        className={`${styles.input} ${
                          registerForm.formState.errors.confirm ? styles.inputError : ""
                        }`}
                      />
                      <span className={styles.inputIcon} aria-hidden="true">
                        <PasswordIcon />
                      </span>
                    </div>

                    {registerForm.formState.errors.confirm?.message && (
                      <p className={styles.fieldError}>
                        {registerForm.formState.errors.confirm.message}
                      </p>
                    )}
                  </label>

                  <motion.button
                    type="submit"
                    className={styles.submitButton}
                    disabled={disableSubmit}
                    aria-busy={loading}
                    whileHover={!disableSubmit ? { y: -1 } : undefined}
                    whileTap={!disableSubmit ? { y: 0 } : undefined}
                    transition={{ type: "spring", stiffness: 520, damping: 30 }}
                  >
                    {loading ? "Создаём..." : "Зарегистрироваться"}
                  </motion.button>
                </motion.form>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      </motion.section>
    </main>
  );
}
