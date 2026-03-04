'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/stores/auth-store';
import { GlassCard, Badge, Button } from '@/components/ui';
import { Radio, Clock, ExternalLink, User } from 'lucide-react';
import type { LiveClass } from '@/types/database';
import { formatDateTime } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';

export function LiveClientPage({ initialClasses }: { initialClasses: LiveClass[] }) {
    const { user } = useAuthStore();
    const { t } = useTranslation();
    const [liveClasses] = useState<LiveClass[]>(initialClasses);

    const handleJoin = async (lc: LiveClass) => {
        if (user) {
            await fetch('/api/attendance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    activity_type: 'live_class',
                    activity_id: lc.id,
                    activity_title: lc.title,
                }),
            });
        }
        window.open(lc.meet_url, '_blank');
    };

    const now = new Date();
    const upcoming = liveClasses.filter((lc) => new Date(lc.scheduled_at) >= now);
    const past = liveClasses.filter((lc) => new Date(lc.scheduled_at) < now);

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
                    <Radio className="w-6 h-6 text-accent-1" />
                    {t.liveClassPage.title}
                </h1>
                <p className="text-foreground/40 text-sm mt-1">{t.liveClassPage.subtitle}</p>
            </div>

            {upcoming.length > 0 && (
                <div className="mb-8">
                    <h2 className="text-sm font-semibold text-foreground/60 uppercase tracking-wider mb-4">
                        {t.liveClassPage.upcoming}
                    </h2>
                    <div className="space-y-4">
                        {upcoming.map((lc, idx) => {
                            const scheduledDate = new Date(lc.scheduled_at);
                            const diffMs = scheduledDate.getTime() - now.getTime();
                            const diffMins = Math.floor(diffMs / 60000);
                            const isLive = diffMins <= 15 && diffMins >= -120;

                            return (
                                <motion.div
                                    key={lc.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                >
                                    <GlassCard padding="md" className="relative overflow-hidden">
                                        {isLive && (
                                            <div className="absolute top-0 left-0 right-0 h-0.5 bg-red-500 animate-pulse" />
                                        )}
                                        <div className="flex items-start gap-4">
                                            <div className="w-14 h-14 rounded-xl bg-accent-1/20 flex flex-col items-center justify-center text-accent-1 shrink-0">
                                                <span className="text-lg font-bold leading-none">
                                                    {scheduledDate.getDate()}
                                                </span>
                                                <span className="text-[10px] text-accent-1/70 uppercase">
                                                    {scheduledDate.toLocaleString('id', { month: 'short' })}
                                                </span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h3 className="text-base font-semibold text-foreground truncate">
                                                        {lc.title}
                                                    </h3>
                                                    {isLive && (
                                                        <Badge variant="danger">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse mr-1" />
                                                            LIVE
                                                        </Badge>
                                                    )}
                                                </div>
                                                <div className="flex flex-wrap items-center gap-2 mb-2">
                                                    <Badge variant="info">
                                                        {lc.subject?.icon} {lc.subject?.name || 'Umum'}
                                                    </Badge>
                                                    <span className="text-xs text-foreground/30 flex items-center gap-1">
                                                        <Clock className="w-3 h-3" />
                                                        {scheduledDate.toLocaleTimeString('id', {
                                                            hour: '2-digit',
                                                            minute: '2-digit',
                                                        })}{' '}
                                                        {t.liveClassPage.timezone}
                                                    </span>
                                                    {lc.tutor && (
                                                        <span className="text-xs text-foreground/30 flex items-center gap-1">
                                                            <User className="w-3 h-3" />
                                                            {(lc.tutor as unknown as { full_name: string }).full_name}
                                                        </span>
                                                    )}
                                                </div>
                                                {lc.description && (
                                                    <p className="text-sm text-foreground/40 mb-3">{lc.description}</p>
                                                )}
                                            </div>
                                            <Button
                                                size="sm"
                                                variant={isLive ? 'primary' : 'outline'}
                                                onClick={() => handleJoin(lc)}
                                                className="shrink-0"
                                            >
                                                <ExternalLink className="w-4 h-4" />
                                                {isLive ? t.liveClassPage.joinNow : t.liveClassPage.openLink}
                                            </Button>
                                        </div>
                                    </GlassCard>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            )}

            {past.length > 0 && (
                <div>
                    <h2 className="text-sm font-semibold text-foreground/60 uppercase tracking-wider mb-4">
                        {t.liveClassPage.past}
                    </h2>
                    <div className="space-y-3">
                        {past.map((lc, idx) => (
                            <motion.div
                                key={lc.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.03 }}
                            >
                                <GlassCard padding="sm" className="opacity-60">
                                    <div className="flex items-center gap-3">
                                        <span className="text-lg">{lc.subject?.icon || '📚'}</span>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-sm font-medium text-foreground truncate">
                                                {lc.title}
                                            </h3>
                                            <span className="text-xs text-foreground/30">
                                                {formatDateTime(lc.scheduled_at)}
                                            </span>
                                        </div>
                                        <Badge>{t.common.finished}</Badge>
                                    </div>
                                </GlassCard>
                            </motion.div>
                        ))}
                    </div>
                </div>
            )}

            {liveClasses.length === 0 && (
                <GlassCard hoverable={false} className="text-center py-16">
                    <Radio className="w-12 h-12 text-foreground/20 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-foreground/50 mb-2">{t.liveClassPage.noSchedule}</h3>
                    <p className="text-sm text-foreground/30">
                        {t.liveClassPage.noScheduleDesc}
                    </p>
                </GlassCard>
            )}
        </motion.div>
    );
}
