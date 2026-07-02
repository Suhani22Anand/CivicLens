import React from 'react';

interface LogoProps {
  className?: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export default function Logo({ className = '', showText = true, size = 'md' }: LogoProps) {
  const sizeMap = {
    sm: { icon: 'w-8 h-8', text: 'text-lg', subtitle: 'text-[9px]' },
    md: { icon: 'w-12 h-12', text: 'text-2xl', subtitle: 'text-xs' },
    lg: { icon: 'w-24 h-24', text: 'text-4xl', subtitle: 'text-base' },
  };

  const selectedSize = sizeMap[size];

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Custom Vector Logo representing the circular citizens & rising chart */}
      <div className={`${selectedSize.icon} relative flex-shrink-0`} id="civiclens-logo-svg">
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Central Bar Chart with Arrow (Green & Blue) */}
          {/* Bar 1 */}
          <rect x="36" y="52" width="6" height="16" rx="1.5" fill="#4c6c9a" />
          {/* Bar 2 */}
          <rect x="45" y="44" width="6" height="24" rx="1.5" fill="#4c6c9a" />
          {/* Bar 3 */}
          <rect x="54" y="34" width="6" height="34" rx="1.5" fill="#6b9661" />
          
          {/* Upward Rising Arrow */}
          <path
            d="M32 64 L48 42 L58 48 L72 30"
            stroke="#6b9661"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M65 30 H72 V37"
            stroke="#6b9661"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Citizen Nodes/Figures in Ring */}
          {/* Top Figure (Blue) */}
          <circle cx="50" cy="14" r="5" fill="#4c6c9a" />
          <path
            d="M36 26 C41 21, 49 21, 54 21 C59 21, 64 26, 64 26"
            stroke="#4c6c9a"
            strokeWidth="4"
            strokeLinecap="round"
          />

          {/* Bottom Figure (Green) */}
          <circle cx="50" cy="86" r="5" fill="#6b9661" />
          <path
            d="M36 74 C41 79, 49 79, 54 79 C59 79, 64 74, 64 74"
            stroke="#6b9661"
            strokeWidth="4"
            strokeLinecap="round"
          />

          {/* Left Figure (Darker Blue) */}
          <circle cx="14" cy="50" r="5" fill="#2b3e58" />
          <path
            d="M24 38 C21 41, 21 49, 21 54 C21 59, 24 62, 24 62"
            stroke="#2b3e58"
            strokeWidth="4"
            strokeLinecap="round"
          />

          {/* Right Figure (Lighter Green) */}
          <circle cx="86" cy="50" r="5" fill="#8cb882" />
          <path
            d="M76 38 C79 41, 79 49, 79 54 C79 59, 76 62, 76 62"
            stroke="#8cb882"
            strokeWidth="4"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col">
          <span className={`${selectedSize.text} font-sans font-extrabold tracking-tight text-slate-800 dark:text-white flex items-center`}>
            Civic<span className="text-[#6b9661]">Lens</span>
          </span>
          <span className={`${selectedSize.subtitle} font-sans font-medium text-slate-500 dark:text-slate-300 tracking-wider -mt-0.5 uppercase`}>
            See it. Post it. Solve it.
          </span>
        </div>
      )}
    </div>
  );
}
