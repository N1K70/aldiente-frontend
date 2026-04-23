import React from 'react';

export const ToothMark: React.FC<{ size?: number; color?: string }> = ({
  size = 28,
  color = 'url(#toothGrad)',
}) => (
  <svg width={size} height={size} viewBox="0 0 40 40" fill="none" style={{ display: 'block' }}>
    <defs>
      <linearGradient id="toothGrad" x1="0" y1="0" x2="0" y2="40" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#3DC4DC" />
        <stop offset="100%" stopColor="#0E8AA5" />
      </linearGradient>
    </defs>
    <path
      d="M14 4c-4 0-7 3-7 7.5 0 2.5.5 4.5 1.3 6.5.7 1.6.8 3.3 1 5 .4 4 1.5 11 4 11 1.7 0 2.2-2.2 2.9-5 .6-2.8 1.1-4 2.8-4s2.2 1.2 2.8 4c.7 2.8 1.2 5 2.9 5 2.5 0 3.6-7 4-11 .2-1.7.3-3.4 1-5 .8-2 1.3-4 1.3-6.5C31 7 28 4 24 4c-2.7 0-3.5 1.6-5 1.6S16.7 4 14 4Z"
      fill={color}
    />
    <path
      d="M17 11c-1 0-2 .8-2 2s.5 2 1.2 2.5"
      stroke="rgba(255,255,255,0.7)"
      strokeWidth="1.4"
      strokeLinecap="round"
      fill="none"
    />
  </svg>
);

export const Wordmark: React.FC<{ size?: number; color?: string }> = ({
  size = 22,
  color = 'var(--ink-900)',
}) => (
  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 9 }}>
    <ToothMark size={size * 1.1} />
    <span style={{
      fontFamily: 'var(--font-display)',
      fontWeight: 700,
      fontSize: size,
      letterSpacing: '-0.035em',
      color,
      lineHeight: 1,
    }}>
      al<span style={{ color: 'var(--brand-600)' }}>diente</span>
    </span>
  </div>
);
