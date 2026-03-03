'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { Announcement } from '@/types/database';
import { X, Info, AlertTriangle, CheckCircle, AlertCircle } from 'lucide-react';
import { useState } from 'react';

interface AnnouncementBannerProps {
    announcements: Announcement[];
}

export function AnnouncementBanner({ announcements }: AnnouncementBannerProps) {
    const [dismissed, setDismissed] = useState<Set<string>>(new Set());

    const activeAnnouncements = announcements.filter(
        (a) => a.is_active && !dismissed.has(a.id)
    );

    if (activeAnnouncements.length === 0) return null;

    const icons = {
        info: <Info className="w-4 h-4" />,
        warning: <AlertTriangle className="w-4 h-4" />,
        success: <CheckCircle className="w-4 h-4" />,
        urgent: <AlertCircle className="w-4 h-4" />,
    };

    const colors = {
        info: 'bg-blue-500/10 border-blue-500/20 text-blue-300',
        warning: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-300',
        success: 'bg-green-500/10 border-green-500/20 text-green-300',
        urgent: 'bg-red-500/10 border-red-500/20 text-red-300 animate-pulse-glow',
    };

    return (
        <div className="space-y-2 mb-6">
            <AnimatePresence>
                {activeAnnouncements.map((announcement) => (
                    <motion.div
                        key={announcement.id}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className={cn(
                            'flex items-center gap-3 px-4 py-3 rounded-xl border',
                            colors[announcement.type]
                        )}
                    >
                        {icons[announcement.type]}
                        <div className="flex-1">
                            <p className="text-sm font-medium">{announcement.title}</p>
                            <p className="text-xs opacity-70">{announcement.content}</p>
                        </div>
                        <button
                            onClick={() => {
                                const newDismissed = new Set(dismissed);
                                newDismissed.add(announcement.id);
                                setDismissed(newDismissed);
                            }}
                            className="p-1 hover:bg-foreground/10 rounded-lg transition-colors"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}
