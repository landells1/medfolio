'use client';

import { cn } from '@/lib/utils';

interface ProgressRingProps {
  value: number; // 0-100
  size?: number;
  strokeWidth?: number;
  className?: string;
  label?: string;
  sublabel?: string;
}

export function ProgressRing({
  value,
  size = 120,
  strokeWidth = 8,
  className,
  label,
  sublabel,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (Math.min(value, 100) / 100) * circumference;

  const color =
    value >= 100 ? '#059669' : value >= 60 ? '#06c4b1' : value >= 30 ? '#f59e0b' : '#ef4444';

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <svg width={size} height={size} className="progress-ring -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-surface-100"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{
            transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display font-bold text-lg text-surface-800">
          {Math.round(value)}%
        </span>
        {label && (
          <span className="text-xs text-surface-500 font-medium">{label}</span>
        )}
        {sublabel && (
          <span className="text-[10px] text-surface-400">{sublabel}</span>
        )}
      </div>
    </div>
  );
}

interface ProgressBarProps {
  value: number;
  max: number;
  className?: string;
  showLabel?: boolean;
  size?: 'sm' | 'md';
}

export function ProgressBar({
  value,
  max,
  className,
  showLabel = true,
  size = 'md',
}: ProgressBarProps) {
  const percentage = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  const color =
    percentage >= 100
      ? 'bg-emerald-500'
      : percentage >= 60
      ? 'bg-brand-500'
      : percentage >= 30
      ? 'bg-amber-500'
      : 'bg-red-400';

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div
        className={cn(
          'flex-1 rounded-full bg-surface-100 overflow-hidden',
          size === 'sm' ? 'h-1.5' : 'h-2'
        )}
      >
        <div
          className={cn('h-full rounded-full transition-all duration-700 ease-out', color)}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-xs font-medium text-surface-500 tabular-nums min-w-[3rem] text-right">
          {value}/{max}
        </span>
      )}
    </div>
  );
}
