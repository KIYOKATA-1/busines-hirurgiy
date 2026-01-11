import type { SVGProps } from "react";

export function ProgressIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      width="100%"
      height="100%"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <g clipPath="url(#clip0_progress)">
        <path
          d="M10.666 4.66626H14.6656V8.66585"
          stroke="currentColor"
          strokeWidth="1.3332"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M14.665 4.66626L8.99889 10.3323L5.66589 6.99935L1.33301 11.3322"
          stroke="currentColor"
          strokeWidth="1.3332"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>

      <defs>
        <clipPath id="clip0_progress">
          <rect width="16" height="16" fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
}
