'use client';

import React, { useState } from 'react';

// ── Icons ─────────────────────────────────────────────────────
interface IconProps { name: string; size?: number; color?: string; stroke?: number; }

export const Icon: React.FC<IconProps> = ({ name, size = 24, color = 'currentColor', stroke = 1.8 }) => {
  const paths: Record<string, React.ReactNode> = {
    tooth: <><path d="M8.5 3.5c-2.5 0-4 2-4 5 0 1.5.3 3 .8 4.3.4 1 .5 2 .6 3.2.2 2.5.9 4.5 2.1 4.5 1 0 1.4-1.3 1.8-3 .4-1.7.7-2.5 2.2-2.5s1.8.8 2.2 2.5c.4 1.7.8 3 1.8 3 1.2 0 1.9-2 2.1-4.5.1-1.2.2-2.2.6-3.2.5-1.3.8-2.8.8-4.3 0-3-1.5-5-4-5-1.6 0-2.4 1-3.5 1s-1.9-1-3.5-1Z"/></>,
    sparkle: <><path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8"/></>,
    shield: <><path d="M12 3 4 6v6c0 4.5 3.5 8 8 9 4.5-1 8-4.5 8-9V6l-8-3Z"/><path d="m9 12 2 2 4-4"/></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/></>,
    chat: <><path d="M21 12a8 8 0 0 1-11.8 7L4 20.5l1.5-5.2A8 8 0 1 1 21 12Z"/></>,
    user: <><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7"/></>,
    home: <><path d="m3 11 9-7 9 7v9a1 1 0 0 1-1 1h-5v-7h-6v7H4a1 1 0 0 1-1-1v-9Z"/></>,
    search: <><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></>,
    arrow_right: <><path d="M5 12h14M13 6l6 6-6 6"/></>,
    arrow_left: <><path d="M19 12H5M11 6l-6 6 6 6"/></>,
    check: <><path d="m5 12 5 5L20 7"/></>,
    close: <><path d="M6 6l12 12M18 6 6 18"/></>,
    eye: <><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></>,
    eye_off: <><path d="M3 3l18 18"/><path d="M10.6 6.1A9.7 9.7 0 0 1 12 6c6.5 0 10 7 10 7a13.8 13.8 0 0 1-2.4 3.3M6.7 7.7A13.8 13.8 0 0 0 2 12s3.5 7 10 7c1.5 0 2.9-.3 4.1-.9"/><path d="M14.1 14.1A3 3 0 0 1 9.9 9.9"/></>,
    star: <><path d="m12 2.8 2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.7l-5.9 3.2 1.3-6.6L2.5 9.7l6.6-.8L12 2.8Z"/></>,
    heart: <><path d="M12 20s-8-4.6-8-11a5 5 0 0 1 9-3 5 5 0 0 1 9 3c0 6.4-8 11-8 11Z" strokeLinejoin="round"/></>,
    lock: <><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V8a4 4 0 1 1 8 0v3"/></>,
    mail: <><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></>,
    clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
    bell: <><path d="M6 8a6 6 0 1 1 12 0c0 4 1.5 5.5 2 6.5H4C4.5 13.5 6 12 6 8Z"/><path d="M10 19a2 2 0 1 0 4 0"/></>,
    phone: <><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z"/></>,
    chevron: <><path d="m9 6 6 6-6 6"/></>,
    graduation: <><path d="M2 9 12 4l10 5-10 5L2 9Z"/><path d="M6 11v5c0 1.5 3 3 6 3s6-1.5 6-3v-5"/></>,
    sun: <><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></>,
    zap: <><path d="m13 2-9 12h7l-1 8 9-12h-7l1-8Z"/></>,
    plus: <><path d="M12 5v14M5 12h14"/></>,
    google: <><path d="M21.8 12.2c0-.8-.1-1.5-.2-2.2H12v4.2h5.5c-.2 1.3-1 2.4-2 3.1v2.6h3.2c1.9-1.7 3.1-4.3 3.1-7.7Z" fill="#4285F4" stroke="none"/><path d="M12 22c2.7 0 5-.9 6.6-2.4l-3.2-2.5c-.9.6-2 1-3.4 1-2.6 0-4.8-1.8-5.6-4.1H3.1v2.6A10 10 0 0 0 12 22Z" fill="#34A853" stroke="none"/><path d="M6.4 14c-.2-.6-.3-1.3-.3-2s.1-1.4.3-2V7.4H3.1a10 10 0 0 0 0 9.2L6.4 14Z" fill="#FBBC04" stroke="none"/><path d="M12 6c1.4 0 2.7.5 3.8 1.5l2.8-2.8A10 10 0 0 0 3.1 7.4L6.4 10C7.2 7.8 9.4 6 12 6Z" fill="#EA4335" stroke="none"/></>,
    apple: <><path d="M15.5 3.5c-1 0-2.2.6-3 1.4-.8.7-1.5 1.9-1.3 3 1.2 0 2.3-.6 3-1.4.8-.8 1.4-1.9 1.3-3Z" fill={color} stroke="none"/><path d="M19 17.3c-.6 1.4-1 2-1.8 3.2-1.1 1.7-2.6 3.8-4.5 3.8-1.7 0-2.1-1.1-4.4-1.1-2.2 0-2.7 1.1-4.4 1.1-1.9 0-3.4-1.9-4.5-3.6C-.3 17.9-1 11.4 3.7 8c1.6-1 3.4-1.2 4.7-.4 1.3.8 2 .5 2.9.5 1 0 1.6-.4 3.3-.5 1.3-.1 2.8.4 3.8 1.3-3.4 1.8-2.8 6.7.6 8.4Z" fill={color} stroke="none"/></>,
    users: <><circle cx="9" cy="8" r="3"/><path d="M3 20c0-3.3 2.7-5 6-5s6 1.7 6 5"/><path d="M16 6a3 3 0 0 1 0 6M21 20c0-3-2-5-5-5"/></>,
    edit: <><path d="M11 4H4a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7"/><path d="M18.5 2.5a2 2 0 0 1 3 3l-9 9-4 1 1-4 9-9Z"/></>,
    chart: <><path d="M3 3v18h18"/><path d="m7 16 4-7 4 3 4-8"/></>,
    help_circle: <><circle cx="12" cy="12" r="9"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></>,
    chevron_right: <><path d="m9 6 6 6-6 6"/></>,
    chevron_left: <><path d="m15 18-6-6 6-6"/></>,
  };
  const p = paths[name];
  if (!p) return null;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round"
      style={{ flexShrink: 0, display: 'block' }}>
      {p}
    </svg>
  );
};

// ── Glass surface ─────────────────────────────────────────────
interface GlassProps {
  children: React.ReactNode;
  hi?: boolean;
  radius?: number;
  style?: React.CSSProperties;
  onClick?: () => void;
  className?: string;
}

export const Glass: React.FC<GlassProps> = ({ children, hi = false, style = {}, radius = 20, onClick, className }) => (
  <div
    className={`${hi ? 'glass-hi' : 'glass'} ${className ?? ''}`}
    style={{ borderRadius: radius, ...style }}
    onClick={onClick}
  >
    {children}
  </div>
);

// ── Primary button ────────────────────────────────────────────
interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'glass' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  icon?: string;
  trailingIcon?: string;
  full?: boolean;
  disabled?: boolean;
  style?: React.CSSProperties;
  type?: 'button' | 'submit' | 'reset';
}

export const Button: React.FC<ButtonProps> = ({
  children, onClick, variant = 'primary', size = 'md',
  icon, trailingIcon, full = false, disabled = false, style = {}, type = 'button',
}) => {
  const [hover, setHover] = useState(false);
  const [press, setPress] = useState(false);

  const sizes = {
    sm: { h: 40, fs: 15, px: 16, gap: 8, r: 12 },
    md: { h: 52, fs: 17, px: 22, gap: 10, r: 16 },
    lg: { h: 60, fs: 18, px: 28, gap: 12, r: 18 },
  };
  const s = sizes[size];

  const variantStyles: Record<string, React.CSSProperties> = {
    primary: {
      background: 'linear-gradient(180deg, #1BB9D6 0%, #0E8AA5 100%)',
      color: '#fff',
      boxShadow: press
        ? '0 2px 6px rgba(14,138,165,0.3), inset 0 1px 0 rgba(255,255,255,0.2)'
        : hover
        ? '0 18px 40px rgba(14,138,165,0.45), 0 4px 10px rgba(14,138,165,0.2), inset 0 1px 0 rgba(255,255,255,0.35)'
        : '0 14px 30px rgba(16,169,198,0.35), 0 4px 10px rgba(16,169,198,0.2), inset 0 1px 0 rgba(255,255,255,0.35)',
      border: '1px solid rgba(14,138,165,0.4)',
    },
    glass: {
      background: hover ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.78)',
      color: 'var(--ink-900)',
      backdropFilter: 'blur(20px) saturate(180%)',
      WebkitBackdropFilter: 'blur(20px) saturate(180%)',
      boxShadow: '0 8px 20px rgba(10,22,40,0.08), inset 0 1px 0 rgba(255,255,255,0.9)',
      border: '1px solid rgba(255,255,255,0.9)',
    },
    ghost: {
      background: hover ? 'rgba(16,169,198,0.08)' : 'transparent',
      color: 'var(--brand-700)',
      border: '1px solid transparent',
    },
    outline: {
      background: 'rgba(255,255,255,0.6)',
      color: 'var(--ink-900)',
      border: '1.5px solid var(--ink-200)',
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
    },
  };

  return (
    <button
      type={type}
      onClick={!disabled ? onClick : undefined}
      disabled={disabled}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => { setHover(false); setPress(false); }}
      onMouseDown={() => setPress(true)}
      onMouseUp={() => setPress(false)}
      style={{
        height: s.h,
        padding: `0 ${s.px}px`,
        gap: s.gap,
        borderRadius: s.r,
        fontSize: s.fs,
        fontWeight: 600,
        fontFamily: 'var(--font-body)',
        letterSpacing: '-0.01em',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'transform 180ms var(--ease-out-quart), box-shadow 180ms var(--ease-out-quart), background 180ms',
        transform: press ? 'scale(0.98) translateY(1px)' : hover ? 'translateY(-1px)' : 'none',
        width: full ? '100%' : 'auto',
        ...variantStyles[variant],
        ...style,
      }}
    >
      {icon && <Icon name={icon} size={size === 'lg' ? 22 : 20} color="currentColor" />}
      {children}
      {trailingIcon && <Icon name={trailingIcon} size={size === 'lg' ? 22 : 20} color="currentColor" />}
    </button>
  );
};

// ── Text input ────────────────────────────────────────────────
interface TextFieldProps {
  label: string;
  icon?: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  trailing?: React.ReactNode;
  autoFocus?: boolean;
  help?: string;
}

export const TextField: React.FC<TextFieldProps> = ({
  label, icon, type = 'text', value, onChange, placeholder, trailing, autoFocus = false, help,
}) => {
  const [focus, setFocus] = useState(false);
  const filled = value && value.length > 0;

  return (
    <label style={{ display: 'block' }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink-700)', marginBottom: 8, letterSpacing: '-0.005em' }}>
        {label}
      </div>
      <div style={{
        position: 'relative',
        height: 56,
        borderRadius: 16,
        background: 'rgba(255,255,255,0.75)',
        backdropFilter: 'blur(12px) saturate(180%)',
        WebkitBackdropFilter: 'blur(12px) saturate(180%)',
        border: `1.5px solid ${focus ? 'var(--brand-500)' : 'rgba(10,22,40,0.08)'}`,
        boxShadow: focus
          ? '0 0 0 4px rgba(16,169,198,0.18), 0 2px 8px rgba(10,22,40,0.04)'
          : '0 2px 6px rgba(10,22,40,0.04), inset 0 1px 0 rgba(255,255,255,0.8)',
        transition: 'border 160ms, box-shadow 160ms',
        display: 'flex',
        alignItems: 'center',
        padding: '0 18px',
        gap: 12,
      }}>
        {icon && <Icon name={icon} size={20} color={focus || filled ? 'var(--brand-600)' : 'var(--ink-400)'} />}
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoFocus={autoFocus}
          onFocus={() => setFocus(true)}
          onBlur={() => setFocus(false)}
          style={{
            flex: 1,
            border: 'none',
            outline: 'none',
            background: 'transparent',
            fontFamily: 'var(--font-body)',
            fontSize: 17,
            fontWeight: 500,
            color: 'var(--ink-900)',
            minWidth: 0,
          }}
        />
        {trailing}
      </div>
      {help && <div style={{ fontSize: 13, color: 'var(--ink-500)', marginTop: 8, paddingLeft: 4 }}>{help}</div>}
    </label>
  );
};
