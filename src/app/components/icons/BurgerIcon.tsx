import React from "react";

type Props = {
  open?: boolean;
};

export const BurgerIcon: React.FC<
  Props & React.SVGProps<SVGSVGElement>
> = ({ open = false, ...props }) => {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      {...props}
    >
      <path
        d="M4 6h16"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        style={{
          transformOrigin: "12px 6px",
          transform: open ? "translateY(6px) rotate(45deg)" : undefined,
          transition: "transform 180ms ease",
        }}
      />
      <path
        d="M4 12h16"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        style={{
          opacity: open ? 0 : 1,
          transition: "opacity 140ms ease",
        }}
      />
      <path
        d="M4 18h16"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        style={{
          transformOrigin: "12px 18px",
          transform: open ? "translateY(-6px) rotate(-45deg)" : undefined,
          transition: "transform 180ms ease",
        }}
      />
    </svg>
  );
};
