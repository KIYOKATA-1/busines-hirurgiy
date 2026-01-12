import React from "react";

export const MailIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => {
  return (
    <svg
      width="1em"
      height="1em"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <g clipPath="url(#clip0_mail)">
        <path
          d="M14.665 4.66626L8.67159 8.48387C8.4682 8.602 8.23719 8.66422 8.00199 8.66422C7.76679 8.66422 7.53577 8.602 7.33239 8.48387L1.33301 4.66626"
          stroke="currentColor"
          strokeWidth="1.3332"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M13.3318 2.6665H2.6662C1.9299 2.6665 1.33301 3.2634 1.33301 3.9997V11.9989C1.33301 12.7352 1.9299 13.3321 2.6662 13.3321H13.3318C14.0681 13.3321 14.665 12.7352 14.665 11.9989V3.9997C14.665 3.2634 14.0681 2.6665 13.3318 2.6665Z"
          stroke="currentColor"
          strokeWidth="1.3332"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      <defs>
        <clipPath id="clip0_mail">
          <rect width="15.9984" height="15.9984" fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
};
