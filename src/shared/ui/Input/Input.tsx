'use client';
import { InputHTMLAttributes } from 'react';

export default function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      style={{
        width: '100%',
        padding: '10px 12px',
        borderRadius: 6,
        border: '1px solid #2a2d35',
        background: '#0f1116',
        color: '#e9e9f0',
      }}
    />
  );
}
