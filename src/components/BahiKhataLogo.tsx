import React from 'react';

interface LogoProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
}

export const BahiKhataLogo: React.FC<LogoProps> = ({ size = 28, ...props }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
      className={`text-bk-brand-primary shrink-0 ${props.className || ''}`}
    >
      {/* Red cloth cover of traditional Bahi Khata book */}
      <path
        d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19v18H6.5a2.5 2.5 0 0 1-2.5-2.5Z"
        fill="currentColor"
        stroke="currentColor"
      />
      {/* Spine binding border (Gold/Amber String representation) */}
      <path
        d="M6.5 2v18"
        stroke="#ffffff"
        strokeWidth="1.5"
      />
      {/* Golden tying cord closure system representing Bahi string */}
      <circle
        cx="13"
        cy="10"
        r="2"
        fill="#e65100"
        stroke="#e65100"
        strokeWidth="1"
      />
      <path
        d="M13 12c1.5 1 2 2.5 1.5 4"
        stroke="#e65100"
        strokeWidth="1.5"
      />
      <path
        d="M12 9c-1-1-2.5-1.5-4-.5"
        stroke="#e65100"
        strokeWidth="1"
      />
      {/* Page ledger line markers */}
      <line x1="9.5" y1="6" x2="16" y2="6" stroke="#ffffff" strokeWidth="1.5" />
      <line x1="9.5" y1="10" x2="11" y2="10" stroke="#ffffff" strokeWidth="1.5" />
      <line x1="9.5" y1="14" x2="16" y2="14" stroke="#ffffff" strokeWidth="1.5" />
    </svg>
  );
};
