'use client';
import { useState } from 'react';
import Input from '@/shared/ui/Input/Input';
import Button from '@/shared/ui/Button/Button';
import Link from 'next/link';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`register: ${email} / ${password}`);
  };

  return (
    <main className="container">
      <h2>Регистрация</h2>
      <form onSubmit={onSubmit}>
        <label>Email</label>
        <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <label>Пароль</label>
        <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <Button type="submit">Создать аккаунт</Button>
      </form>
      <p style={{ marginTop: 16 }}>
        Уже есть аккаунт? <Link href="/login">Войти</Link>
      </p>
    </main>
  );
}
