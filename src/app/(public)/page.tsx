import Link from 'next/link';

export const revalidate = 0; // Disable ISR for real-time content

export default async function LandingPage() {
  return (
    <main className="container">
      <h1>Добро пожаловать в MyApp</h1>
      <p>Минимальный SSR-лендинг с авторизацией и регистрацией.</p>
      <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
        <Link href="/login">Войти</Link>
        <Link href="/register">Регистрация</Link>
      </div>
    </main>
  );
}
