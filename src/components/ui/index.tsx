'use client';

import { motion, type HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';
import { forwardRef } from 'react';
import { useTranslation } from '@/lib/i18n';

interface GlassCardProps extends HTMLMotionProps<'div'> {
    children: React.ReactNode;
    className?: string;
    hoverable?: boolean;
    padding?: 'sm' | 'md' | 'lg';
}

export const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
    ({ children, className, hoverable = true, padding = 'md', ...props }, ref) => {
        const paddingClass = {
            sm: 'p-4',
            md: 'p-6',
            lg: 'p-8',
        }[padding];

        return (
            <motion.div
                ref={ref}
                className={cn(
                    hoverable ? 'glass-card' : 'glass',
                    paddingClass,
                    className
                )}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                {...props}
            >
                {children}
            </motion.div>
        );
    }
);
GlassCard.displayName = 'GlassCard';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'outline' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    isLoading?: boolean;
    children: React.ReactNode;
}

export function Button({
    variant = 'primary',
    size = 'md',
    isLoading = false,
    className,
    children,
    disabled,
    ...props
}: ButtonProps) {
    const variants = {
        primary: 'glass-button',
        outline: 'glass-button-outline',
        ghost: 'bg-transparent hover:bg-foreground/5 text-foreground/70 hover:text-foreground rounded-xl transition-all',
        danger: 'bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 rounded-xl transition-all',
    };

    const sizes = {
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-5 py-2.5 text-sm',
        lg: 'px-8 py-3 text-base',
    };

    return (
        <button
            className={cn(
                variants[variant],
                sizes[size],
                'font-medium inline-flex items-center justify-center gap-2',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                className
            )}
            disabled={disabled || isLoading}
            {...props}
        >
            {isLoading && (
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                    />
                    <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                </svg>
            )}
            {children}
        </button>
    );
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
}

export function Input({ label, error, className, ...props }: InputProps) {
    return (
        <div className="space-y-1.5">
            {label && (
                <label className="block text-sm font-medium text-foreground/60">
                    {label}
                </label>
            )}
            <input
                className={cn(
                    'glass-input w-full px-4 py-2.5 text-sm',
                    error && 'border-red-500/50 focus:border-red-500',
                    className
                )}
                {...props}
            />
            {error && <p className="text-xs text-red-400">{error}</p>}
        </div>
    );
}

interface BadgeProps {
    children: React.ReactNode;
    variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
    className?: string;
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
    const variants = {
        default: 'bg-foreground/10 text-foreground/70 border-foreground/10',
        success: 'bg-green-500/15 text-green-400 border-green-500/20',
        warning: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/20',
        danger: 'bg-red-500/15 text-red-400 border-red-500/20',
        info: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
    };

    return (
        <span
            className={cn(
                'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
                variants[variant],
                className
            )}
        >
            {children}
        </span>
    );
}

interface ScoreRingProps {
    score: number;
    size?: number;
    strokeWidth?: number;
    className?: string;
}

export function ScoreRing({ score, size = 120, strokeWidth = 8, className }: ScoreRingProps) {
    const { t } = useTranslation();
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (score / 100) * circumference;

    const getColor = (s: number) => {
        if (s >= 80) return '#22c55e';
        if (s >= 60) return '#eab308';
        return '#ef4444';
    };

    return (
        <div className={cn('relative inline-flex items-center justify-center', className)}>
            <svg width={size} height={size} className="score-ring">
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="var(--ring-track)"
                    strokeWidth={strokeWidth}
                    fill="none"
                />
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke={getColor(score)}
                    strokeWidth={strokeWidth}
                    fill="none"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    className="score-ring-circle"
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-foreground">{Math.round(score)}</span>
                <span className="text-xs text-foreground/50">{t.ui.scoreRingLabel}</span>
            </div>
        </div>
    );
}

export function LoadingSpinner({ className }: { className?: string }) {
    return (
        <div className={cn('flex items-center justify-center', className)}>
            <div className="relative">
                <div className="w-10 h-10 border-2 border-foreground/10 rounded-full" />
                <div className="absolute inset-0 w-10 h-10 border-2 border-transparent border-t-accent-1 rounded-full animate-spin" />
            </div>
        </div>
    );
}

interface EmptyStateProps {
    icon?: React.ReactNode;
    title: string;
    description?: string;
    action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center py-16 text-center">
            {icon && <div className="text-foreground/20 mb-4">{icon}</div>}
            <h3 className="text-lg font-medium text-foreground/60 mb-2">{title}</h3>
            {description && <p className="text-sm text-foreground/40 max-w-md">{description}</p>}
            {action && <div className="mt-6">{action}</div>}
        </div>
    );
}

interface StatCardProps {
    label: string;
    value: string | number;
    icon: React.ReactNode;
    trend?: { value: number; isPositive: boolean };
    className?: string;
}

export function StatCard({ label, value, icon, trend, className }: StatCardProps) {
    return (
        <GlassCard className={cn('flex items-start justify-between', className)} padding="md">
            <div>
                <p className="text-sm text-foreground/50 mb-1">{label}</p>
                <motion.p
                    className="text-2xl font-bold text-foreground"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    {value}
                </motion.p>
                {trend && (
                    <p className={cn('text-xs mt-1', trend.isPositive ? 'text-green-400' : 'text-red-400')}>
                        {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
                    </p>
                )}
            </div>
            <div className="p-3 rounded-xl bg-accent-1/10 text-accent-1">{icon}</div>
        </GlassCard>
    );
}
