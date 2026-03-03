'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/stores/auth-store';
import { createClient } from '@/lib/supabase/client';
import { GlassCard, Badge, Button } from '@/components/ui';
import { BookOpen, ExternalLink, FileText, Search } from 'lucide-react';
import type { EmodContent } from '@/types/database';
import { useTranslation } from '@/lib/i18n';

export function EmodClientPage({ initialEmods }: { initialEmods: EmodContent[] }) {
    const { user } = useAuthStore();
    const { t } = useTranslation();
    const [emods] = useState<EmodContent[]>(initialEmods);
    const [searchTerm, setSearchTerm] = useState('');

    const handleOpenEmod = async (emod: EmodContent) => {
        if (user) {
            const supabase = createClient();
            await supabase.from('attendance_logs').insert({
                student_id: user.id,
                activity_type: 'emod_access',
                activity_id: emod.id,
                activity_title: emod.title,
            });
        }
        window.open(emod.drive_url, '_blank');
    };

    const filtered = emods.filter(
        (e) =>
            e.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            e.subject?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            e.chapter?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
                        <BookOpen className="w-6 h-6 text-accent-1" />
                        {t.emod.title}
                    </h1>
                    <p className="text-foreground/40 text-sm mt-1">{t.emod.subtitle}</p>
                </div>
            </div>

            <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/30" />
                <input
                    type="text"
                    placeholder={t.emod.searchPlaceholder}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="glass-input w-full pl-10 pr-4 py-2.5 text-sm"
                />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
                {filtered.map((emod, idx) => (
                    <motion.div
                        key={emod.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                    >
                        <GlassCard className="h-full" padding="md">
                            <div className="flex items-start gap-3 mb-3">
                                <span className="text-2xl">{emod.subject?.icon || '📄'}</span>
                                <div className="flex-1">
                                    <h3 className="text-base font-semibold text-foreground">{emod.title}</h3>
                                    <div className="flex items-center gap-2 mt-1">
                                        <Badge variant="info">{emod.subject?.name}</Badge>
                                        {emod.chapter && <Badge>{emod.chapter}</Badge>}
                                    </div>
                                </div>
                            </div>
                            <p className="text-sm text-foreground/40 mb-4">{emod.description}</p>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleOpenEmod(emod)}
                                className="w-full"
                            >
                                <FileText className="w-4 h-4" />
                                {t.emod.openModule}
                                <ExternalLink className="w-3.5 h-3.5" />
                            </Button>
                        </GlassCard>
                    </motion.div>
                ))}
            </div>

            {filtered.length === 0 && (
                <div className="text-center py-16 text-foreground/30 text-sm">
                    {t.emod.noModules}
                </div>
            )}
        </motion.div>
    );
}
