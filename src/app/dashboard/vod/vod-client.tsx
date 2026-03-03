'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/stores/auth-store';
import { createClient } from '@/lib/supabase/client';
import { GlassCard, Badge } from '@/components/ui';
import { Video, Play, Clock, Search } from 'lucide-react';
import Image from 'next/image';
import type { VodContent } from '@/types/database';
import { useTranslation } from '@/lib/i18n';

export function VodClientPage({ initialVods }: { initialVods: VodContent[] }) {
    const { user } = useAuthStore();
    const { t } = useTranslation();
    const [vods] = useState<VodContent[]>(initialVods);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedVod, setSelectedVod] = useState<VodContent | null>(null);

    const handleWatchVod = async (vod: VodContent) => {
        setSelectedVod(vod);

        if (user) {
            const supabase = createClient();
            await supabase.from('attendance_logs').insert({
                student_id: user.id,
                activity_type: 'vod_watch',
                activity_id: vod.id,
                activity_title: vod.title,
            });
        }
    };

    const filtered = vods.filter(
        (v) =>
            v.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            v.subject?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
                        <Video className="w-6 h-6 text-accent-1" />
                        {t.nav.videoLearning}
                    </h1>
                    <p className="text-foreground/40 text-sm mt-1">{t.vod.subtitle}</p>
                </div>
            </div>

            <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/30" />
                <input
                    type="text"
                    placeholder={t.vod.searchPlaceholder}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="glass-input w-full pl-10 pr-4 py-2.5 text-sm"
                />
            </div>

            {selectedVod && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <GlassCard hoverable={false} padding="md">
                        <div className="aspect-video rounded-xl overflow-hidden mb-4 bg-black">
                            <iframe
                                src={`https://www.youtube.com/embed/${selectedVod.youtube_id}`}
                                title={selectedVod.title}
                                className="w-full h-full"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            />
                        </div>
                        <h2 className="text-lg font-semibold text-foreground mb-1">{selectedVod.title}</h2>
                        <div className="flex items-center gap-3 mb-2">
                            <Badge variant="info">{selectedVod.subject?.name}</Badge>
                            {selectedVod.duration && (
                                <span className="text-xs text-foreground/30 flex items-center gap-1">
                                    <Clock className="w-3 h-3" /> {selectedVod.duration}
                                </span>
                            )}
                        </div>
                        <p className="text-sm text-foreground/40">{selectedVod.description}</p>
                    </GlassCard>
                </motion.div>
            )}

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtered.map((vod, idx) => (
                    <motion.div
                        key={vod.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                    >
                        <GlassCard
                            className="cursor-pointer group h-full"
                            padding="sm"
                            onClick={() => handleWatchVod(vod)}
                        >
                            <div className="relative aspect-video rounded-xl overflow-hidden mb-3 bg-foreground/5">
                                <Image
                                    src={vod.thumbnail_url || `https://img.youtube.com/vi/${vod.youtube_id}/mqdefault.jpg`}
                                    alt={vod.title}
                                    fill
                                    className="object-cover"
                                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                />
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <div className="w-12 h-12 rounded-full bg-accent-1/80 flex items-center justify-center">
                                        <Play className="w-5 h-5 text-foreground ml-0.5" />
                                    </div>
                                </div>
                                {vod.duration && (
                                    <span className="absolute bottom-2 right-2 bg-black/70 text-foreground text-[10px] px-1.5 py-0.5 rounded">
                                        {vod.duration}
                                    </span>
                                )}
                            </div>
                            <div className="px-2 pb-2">
                                <h3 className="text-sm font-semibold text-foreground mb-1 line-clamp-2 group-hover:text-accent-1 transition-colors">
                                    {vod.title}
                                </h3>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs">{vod.subject?.icon}</span>
                                    <span className="text-xs text-foreground/30">{vod.subject?.name}</span>
                                </div>
                            </div>
                        </GlassCard>
                    </motion.div>
                ))}
            </div>

            {filtered.length === 0 && (
                <div className="text-center py-16 text-foreground/30 text-sm">
                    {t.vod.noVideos}
                </div>
            )}
        </motion.div>
    );
}
