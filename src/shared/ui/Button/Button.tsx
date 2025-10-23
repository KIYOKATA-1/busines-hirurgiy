'use client';
import { ButtonHTMLAttributes } from 'react';

export default function Button({ children, ...rest }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...rest}
      style={{
        padding: '10px 16px',
        borderRadius: 8,
        border: '1px solid #2a2d35',
        background: '#1b1f27',
        color: '#fff',
        cursor: 'pointer',
      }}
    >
      {children}
    </button>
  );
}
