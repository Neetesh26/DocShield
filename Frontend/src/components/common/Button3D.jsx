import React from 'react';

/**
 * Button3D Component
 * A tactile, physical 3D push-button with spring-like press physics and bevel depth.
 * Complies with the non-dark, non-green, non-blue theme using rich Violet, Amber, Ruby and Slate.
 *
 * @param {('primary'|'secondary'|'light'|'amber'|'rose'|'charcoal')} variant - Visual styling theme
 * @param {('sm'|'md'|'lg')} size - Button dimensions and shadow depth
 * @param {React.ReactNode} icon - Optional icon element
 * @param {('left'|'right')} iconPosition - Placement of the icon
 * @param {boolean} loading - Display loading spinner
 * @param {boolean} fullWidth - Expand to 100% width
 * @param {string} className - Additional CSS classes
 */
export const Button3D = ({
  children,
  variant = 'primary',
  size = 'md',
  icon = null,
  iconPosition = 'left',
  loading = false,
  disabled = false,
  fullWidth = false,
  className = '',
  onClick,
  type = 'button',
  ...props
}) => {
  // Size configurations: padding, font size, height, and tactile 3D shadow depth
  const sizeStyles = {
    sm: 'h-8 px-3 text-xs gap-1.5 rounded-lg active:translate-y-[2px]',
    md: 'h-10 px-4 text-xs font-bold gap-2 rounded-xl active:translate-y-[3px]',
    lg: 'h-12 px-6 text-sm font-bold gap-2.5 rounded-xl active:translate-y-[4px]'
  };

  // 3D tactile color slabs (face + bottom bevel slab)
  const variantStyles = {
    // Primary: Vibrant Bhagwa Saffron Orange
    primary: `
      bg-gradient-to-b from-orange-500 to-orange-600 text-white
      border-t border-orange-300/50
      shadow-[0_4px_0_0_#9a3412,0_6px_12px_rgba(234,88,12,0.3)]
      hover:from-orange-400 hover:to-orange-500 hover:shadow-[0_4px_0_0_#9a3412,0_8px_16px_rgba(234,88,12,0.35)]
      active:shadow-[0_1px_0_0_#9a3412,0_2px_4px_rgba(234,88,12,0.2)]
    `,
    // Secondary / Light: Clean White-Pearl in light mode, Dark Slate in dark mode
    light: `
      bg-gradient-to-b from-white to-slate-100 dark:from-slate-800 dark:to-slate-900
      text-slate-800 dark:text-slate-100
      border border-slate-200 dark:border-slate-700 border-t-white dark:border-t-slate-600
      shadow-[0_4px_0_0_#cbd5e1,0_4px_8px_rgba(0,0,0,0.06)] dark:shadow-[0_4px_0_0_#020617,0_4px_8px_rgba(0,0,0,0.4)]
      hover:from-slate-50 hover:to-slate-100 dark:hover:from-slate-700 dark:hover:to-slate-800 hover:text-slate-900 dark:hover:text-white
      hover:shadow-[0_4px_0_0_#94a3b8,0_6px_10px_rgba(0,0,0,0.08)] dark:hover:shadow-[0_4px_0_0_#020617,0_6px_10px_rgba(0,0,0,0.5)]
      active:shadow-[0_1px_0_0_#cbd5e1,0_1px_2px_rgba(0,0,0,0.05)] dark:active:shadow-[0_1px_0_0_#020617,0_1px_2px_rgba(0,0,0,0.2)]
    `,
    secondary: `
      bg-gradient-to-b from-orange-50 to-orange-100 text-orange-950
      border border-orange-200 border-t-white
      shadow-[0_4px_0_0_#fed7aa,0_4px_8px_rgba(234,88,12,0.12)]
      hover:from-orange-100 hover:to-orange-200 hover:shadow-[0_4px_0_0_#fdba74,0_6px_12px_rgba(234,88,12,0.18)]
      active:shadow-[0_1px_0_0_#fed7aa,0_1px_2px_rgba(234,88,12,0.1)]
    `,
    // Amber / Golden Honey: Regulatory Warning & Highlights
    amber: `
      bg-gradient-to-b from-amber-400 to-amber-500 text-slate-950 font-black
      border-t border-amber-200/60
      shadow-[0_4px_0_0_#b45309,0_6px_12px_rgba(180,83,9,0.25)]
      hover:from-amber-300 hover:to-amber-400 hover:shadow-[0_4px_0_0_#b45309,0_8px_16px_rgba(180,83,9,0.3)]
      active:shadow-[0_1px_0_0_#b45309,0_2px_4px_rgba(180,83,9,0.2)]
    `,
    // Rose / Ruby: Danger, Destruction & Strict Audits
    rose: `
      bg-gradient-to-b from-rose-500 to-rose-600 text-white
      border-t border-rose-300/40
      shadow-[0_4px_0_0_#9f1239,0_6px_12px_rgba(159,18,57,0.25)]
      hover:from-rose-400 hover:to-rose-500 hover:shadow-[0_4px_0_0_#9f1239,0_8px_16px_rgba(159,18,57,0.3)]
      active:shadow-[0_1px_0_0_#9f1239,0_2px_4px_rgba(159,18,57,0.2)]
    `,
    // Charcoal / Executive: High-contrast Dark Neutral Slab
    charcoal: `
      bg-gradient-to-b from-slate-700 to-slate-800 text-white
      border-t border-slate-600
      shadow-[0_4px_0_0_#1e293b,0_6px_12px_rgba(15,23,42,0.25)]
      hover:from-slate-600 hover:to-slate-700 hover:shadow-[0_4px_0_0_#1e293b,0_8px_16px_rgba(15,23,42,0.3)]
      active:shadow-[0_1px_0_0_#1e293b,0_2px_4px_rgba(15,23,42,0.2)]
    `
  };

  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      disabled={isDisabled}
      onClick={onClick}
      className={`
        relative inline-flex items-center justify-center
        font-sans tracking-wide uppercase tracking-wider
        select-none cursor-pointer outline-none
        transition-all duration-75 ease-out
        btn-3d btn-3d-${variant}
        ${sizeStyles[size] || sizeStyles.md}
        ${variantStyles[variant] || variantStyles.primary}
        ${fullWidth ? 'w-full' : ''}
        ${isDisabled ? 'opacity-55 cursor-not-allowed !transform-none !shadow-none' : ''}
        ${className}
      `}
      {...props}
    >
      {/* Specular Top Sheen Overlay */}
      <span
        className="pointer-events-none absolute inset-x-0 top-0 h-[35%] rounded-t-[inherit] bg-gradient-to-b from-white/25 to-transparent dark:from-white/10"
        aria-hidden="true"
      />

      {loading ? (
        <span className="flex items-center gap-2">
          <svg
            className="animate-spin h-4 w-4 text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v8H4z"
            />
          </svg>
          <span>Processing...</span>
        </span>
      ) : (
        <>
          {icon && iconPosition === 'left' && <span className="shrink-0">{icon}</span>}
          <span>{children}</span>
          {icon && iconPosition === 'right' && <span className="shrink-0">{icon}</span>}
        </>
      )}
    </button>
  );
};

export default Button3D;
