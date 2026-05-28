'use client';

/**
 * Tooltip híbrido — 2026-05-28.
 *
 * Variants:
 *   - inline (default): envuelve texto con border-dotted subtle
 *   - header: icon ⓘ adjacent al children (para section headers densos)
 *   - badge: el children ES el tooltipped element (sin envoltura visual extra)
 *
 * Accesible: aria-describedby + role="tooltip" + keyboard focus.
 * CSS-only positioning, sin portal — funciona inline en flex layouts.
 */

import { useId, useState, type ReactNode } from 'react';
import { Info } from 'lucide-react';
import { cn } from '@/lib/cn';

interface TooltipProps {
  /** El texto que mostrará el tooltip al hover/focus */
  content: ReactNode;
  /** Contenido envuelto. En 'badge' mode, el children es el target del tooltip directamente. */
  children: ReactNode;
  /** Variante visual */
  variant?: 'inline' | 'header' | 'badge';
  /** Posición del bubble */
  position?: 'top' | 'bottom' | 'left' | 'right';
  /** Class opcional para el wrapper */
  className?: string;
}

const POSITION_CLASSES: Record<NonNullable<TooltipProps['position']>, string> = {
  top: 'bottom-full left-1/2 -translate-x-1/2 mb-1.5',
  bottom: 'top-full left-1/2 -translate-x-1/2 mt-1.5',
  left: 'right-full top-1/2 -translate-y-1/2 mr-1.5',
  right: 'left-full top-1/2 -translate-y-1/2 ml-1.5',
};

export function Tooltip({
  content,
  children,
  variant = 'inline',
  position = 'top',
  className,
}: TooltipProps) {
  const [show, setShow] = useState(false);
  const id = useId();

  const bubble = show ? (
    <span
      role="tooltip"
      id={id}
      className={cn(
        'absolute z-[100] px-2 py-1.5 rounded shadow-lg',
        'bg-[#1f2937] text-[#e5e7eb] border border-[#374151]',
        'text-[11px] leading-snug font-normal',
        'max-w-[300px] w-max whitespace-normal pointer-events-none',
        POSITION_CLASSES[position]
      )}
    >
      {content}
    </span>
  ) : null;

  const handlers = {
    onMouseEnter: () => setShow(true),
    onMouseLeave: () => setShow(false),
    onFocus: () => setShow(true),
    onBlur: () => setShow(false),
  };

  if (variant === 'badge') {
    return (
      <span
        className={cn('relative inline-block', className)}
        aria-describedby={show ? id : undefined}
        {...handlers}
      >
        {children}
        {bubble}
      </span>
    );
  }

  if (variant === 'header') {
    return (
      <span className={cn('relative inline-flex items-center gap-1', className)}>
        {children}
        <button
          type="button"
          aria-label="Más info"
          aria-describedby={show ? id : undefined}
          className="inline-flex items-center justify-center text-[var(--color-muted)] hover:text-[var(--color-text)] focus:text-[var(--color-text)] focus:outline-none rounded"
          {...handlers}
        >
          <Info className="w-3 h-3" aria-hidden="true" />
        </button>
        {bubble}
      </span>
    );
  }

  // inline (default)
  return (
    <span
      className={cn(
        'relative inline border-b border-dotted border-[var(--color-muted)] cursor-help',
        className
      )}
      tabIndex={0}
      aria-describedby={show ? id : undefined}
      {...handlers}
    >
      {children}
      {bubble}
    </span>
  );
}
