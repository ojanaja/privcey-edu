'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/auth-store';
import { Button, Badge, LoadingSpinner } from '@/components/ui';
import {
    Video,
    BookOpen,
    Radio,
    Plus,
    Trash2,
    Eye,
    EyeOff,
    ExternalLink,
} from 'lucide-react';
import type { Subject, VodContent, EmodContent, LiveClass } from '@/types/database';
import Image from 'next/image';
import { formatDateTime, cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';

type Tab = 'vod' | 'emod' | 'live';

function extractYoutubeId(url: string): string {
    const match = url.match(
        /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?\s]+)/
    );
    return match?.[1] || '';
}

export default function AdminContentPage() {
    const { t } = useTranslation();
    const { user } = useAuthStore();
    const [tab, setTab] = useState<Tab>('vod');
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [vods, setVods] = useState<VodContent[]>([]);
    const [showVodForm, setShowVodForm] = useState(false);
    const [vodForm, setVodForm] = useState({
        title: '',
        description: '',
        youtube_url: '',
        subject_id: '',
        duration: '',
    });

    const [emods, setEmods] = useState<EmodContent[]>([]);
    const [showEmodForm, setShowEmodForm] = useState(false);
    const [emodForm, setEmodForm] = useState({
        title: '',
        description: '',
        drive_url: '',
        subject_id: '',
        chapter: '',
    });

    const [liveClasses, setLiveClasses] = useState<LiveClass[]>([]);
    const [showLiveForm, setShowLiveForm] = useState(false);
    const [liveForm, setLiveForm] = useState({
        title: '',
        description: '',
        meet_url: '',
        scheduled_at: '',
        subject_id: '',
    });

    useEffect(() => {
        const supabase = createClient();

        const fetchAll = async () => {
            const [{ data: subjectData }, { data: vodData }, { data: emodData }, { data: liveData }] =
                await Promise.all([
                    supabase.from('subjects').select('*'),
                    supabase
                        .from('vod_content')
                        .select('*, subject:subjects(name, icon)')
                        .order('order'),
                    supabase
                        .from('emod_content')
                        .select('*, subject:subjects(name, icon)')
                        .order('order'),
                    supabase
                        .from('live_classes')
                        .select('*, subject:subjects(name, icon), tutor:profiles(full_name)')
                        .order('scheduled_at', { ascending: false }),
                ]);

            if (subjectData) setSubjects(subjectData);
            if (vodData) setVods(vodData);
            if (emodData) setEmods(emodData);
            if (liveData) setLiveClasses(liveData);
            setIsLoading(false);
        };

        fetchAll();
    }, []);

    const createVod = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        const supabase = createClient();
        const youtubeId = extractYoutubeId(vodForm.youtube_url);
        const { data } = await supabase
            .from('vod_content')
            .insert({
                title: vodForm.title,
                description: vodForm.description || null,
                youtube_url: vodForm.youtube_url,
                youtube_id: youtubeId,
                subject_id: vodForm.subject_id || null,
                duration: vodForm.duration || null,
                thumbnail_url: `https://img.youtube.com/vi/${youtubeId}/mqdefault.jpg`,
                order: vods.length,
                created_by: user.id,
            })
            .select('*, subject:subjects(name, icon)')
            .single();
        if (data) {
            setVods([...vods, data]);
            setShowVodForm(false);
            setVodForm({ title: '', description: '', youtube_url: '', subject_id: '', duration: '' });
        }
    };

    const toggleVod = async (id: string, current: boolean) => {
        const supabase = createClient();
        await supabase.from('vod_content').update({ is_active: !current }).eq('id', id);
        setVods((prev) => prev.map((v) => (v.id === id ? { ...v, is_active: !current } : v)));
    };

    const deleteVod = async (id: string) => {
        if (!confirm(t.adminContent.confirmDeleteVideo)) return;
        const supabase = createClient();
        await supabase.from('vod_content').delete().eq('id', id);
        setVods((prev) => prev.filter((v) => v.id !== id));
    };

    const createEmod = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        const supabase = createClient();
        const { data } = await supabase
            .from('emod_content')
            .insert({
                title: emodForm.title,
                description: emodForm.description || null,
                drive_url: emodForm.drive_url,
                subject_id: emodForm.subject_id || null,
                chapter: emodForm.chapter || null,
                order: emods.length,
                created_by: user.id,
            })
            .select('*, subject:subjects(name, icon)')
            .single();
        if (data) {
            setEmods([...emods, data]);
            setShowEmodForm(false);
            setEmodForm({ title: '', description: '', drive_url: '', subject_id: '', chapter: '' });
        }
    };

    const toggleEmod = async (id: string, current: boolean) => {
        const supabase = createClient();
        await supabase.from('emod_content').update({ is_active: !current }).eq('id', id);
        setEmods((prev) => prev.map((e) => (e.id === id ? { ...e, is_active: !current } : e)));
    };

    const deleteEmod = async (id: string) => {
        if (!confirm(t.adminContent.confirmDeleteModule)) return;
        const supabase = createClient();
        await supabase.from('emod_content').delete().eq('id', id);
        setEmods((prev) => prev.filter((e) => e.id !== id));
    };

    const createLive = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        const supabase = createClient();
        const { data } = await supabase
            .from('live_classes')
            .insert({
                title: liveForm.title,
                description: liveForm.description || null,
                meet_url: liveForm.meet_url,
                scheduled_at: liveForm.scheduled_at,
                subject_id: liveForm.subject_id || null,
                tutor_id: user.id,
            })
            .select('*, subject:subjects(name, icon), tutor:profiles(full_name)')
            .single();
        if (data) {
            setLiveClasses([data, ...liveClasses]);
            setShowLiveForm(false);
            setLiveForm({ title: '', description: '', meet_url: '', scheduled_at: '', subject_id: '' });
        }
    };

    const toggleLive = async (id: string, current: boolean) => {
        const supabase = createClient();
        await supabase.from('live_classes').update({ is_active: !current }).eq('id', id);
        setLiveClasses((prev) =>
            prev.map((l) => (l.id === id ? { ...l, is_active: !current } : l))
        );
    };

    const deleteLive = async (id: string) => {
        if (!confirm(t.adminContent.confirmDeleteLive)) return;
        const supabase = createClient();
        await supabase.from('live_classes').delete().eq('id', id);
        setLiveClasses((prev) => prev.filter((l) => l.id !== id));
    };

    if (isLoading) return <LoadingSpinner className="min-h-[50vh]" />;

    const tabs: { key: Tab; label: string; icon: React.ReactNode; count: number }[] = [
        { key: 'vod', label: t.adminContent.tabs.vod, icon: <Video className="w-4 h-4" />, count: vods.length },
        { key: 'emod', label: t.adminContent.tabs.emod, icon: <BookOpen className="w-4 h-4" />, count: emods.length },
        {
            key: 'live',
            label: t.adminContent.tabs.liveClass,
            icon: <Radio className="w-4 h-4" />,
            count: liveClasses.length,
        },
    ];

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
                    <Video className="w-6 h-6 text-accent-1" />
                    {t.adminContent.title}
                </h1>
                <p className="text-foreground/40 text-sm mt-1">
                    {t.adminContent.subtitle}
                </p>
            </div>

            <div className="flex gap-2 mb-6 overflow-x-auto">
                {tabs.map((t) => (
                    <button
                        key={t.key}
                        onClick={() => setTab(t.key)}
                        className={cn(
                            'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap',
                            tab === t.key
                                ? 'bg-accent-1/20 text-accent-1 border border-accent-3/30'
                                : 'text-foreground/40 hover:text-foreground/60 border border-transparent hover:bg-foreground/5'
                        )}
                    >
                        {t.icon}
                        {t.label}
                        <span className="text-[10px] bg-foreground/10 px-1.5 py-0.5 rounded-full">{t.count}</span>
                    </button>
                ))}
            </div>

            {tab === 'vod' && (
                <>
                    <div className="flex justify-end mb-4">
                        <Button size="sm" onClick={() => setShowVodForm(!showVodForm)}>
                            <Plus className="w-4 h-4" />
                            {t.adminContent.addVideo}
                        </Button>
                    </div>

                    {showVodForm && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="mb-6"
                        >
                            <div className="admin-card p-6">
                                <h2 className="text-base font-semibold text-foreground mb-4">{t.adminContent.newVideo}</h2>
                                <form onSubmit={createVod} className="grid md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs text-foreground/40 mb-1">{t.common.title}</label>
                                        <input
                                            type="text"
                                            required
                                            value={vodForm.title}
                                            onChange={(e) => setVodForm({ ...vodForm, title: e.target.value })}
                                            className="admin-input w-full px-3 py-2 text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-foreground/40 mb-1">{t.adminContent.youtubeUrl}</label>
                                        <input
                                            type="url"
                                            required
                                            value={vodForm.youtube_url}
                                            onChange={(e) => setVodForm({ ...vodForm, youtube_url: e.target.value })}
                                            className="admin-input w-full px-3 py-2 text-sm"
                                            placeholder="https://youtube.com/watch?v=..."
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-foreground/40 mb-1">{t.common.subject}</label>
                                        <select
                                            value={vodForm.subject_id}
                                            onChange={(e) => setVodForm({ ...vodForm, subject_id: e.target.value })}
                                            className="admin-input w-full px-3 py-2 text-sm"
                                        >
                                            <option value="">{t.common.selectSubject}</option>
                                            {subjects.map((s) => (
                                                <option key={s.id} value={s.id}>
                                                    {s.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs text-foreground/40 mb-1">{t.adminContent.durationLabel}</label>
                                        <input
                                            type="text"
                                            value={vodForm.duration}
                                            onChange={(e) => setVodForm({ ...vodForm, duration: e.target.value })}
                                            className="admin-input w-full px-3 py-2 text-sm"
                                            placeholder="25:30"
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-xs text-foreground/40 mb-1">{t.common.description}</label>
                                        <textarea
                                            value={vodForm.description}
                                            onChange={(e) => setVodForm({ ...vodForm, description: e.target.value })}
                                            className="admin-input w-full px-3 py-2 text-sm h-16 resize-none"
                                        />
                                    </div>
                                    <div className="md:col-span-2 flex gap-3 justify-end">
                                        <Button variant="ghost" onClick={() => setShowVodForm(false)}>
                                            {t.common.cancel}
                                        </Button>
                                        <Button type="submit">{t.common.save}</Button>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    )}

                    <div className="space-y-3">
                        {vods.map((vod, idx) => (
                            <motion.div
                                key={vod.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.02 }}
                                className="admin-card p-4"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="relative w-24 h-14 rounded-lg overflow-hidden bg-foreground/5 flex-shrink-0">
                                        <Image
                                            src={vod.thumbnail_url || `https://img.youtube.com/vi/${vod.youtube_id}/default.jpg`}
                                            alt={vod.title}
                                            fill
                                            className="object-cover"
                                            sizes="96px"
                                        />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-sm font-semibold text-foreground truncate">{vod.title}</h3>
                                        <div className="flex items-center gap-2 mt-1">
                                            <Badge variant="info">{vod.subject?.name || 'Umum'}</Badge>
                                            {vod.duration && (
                                                <span className="text-[10px] text-foreground/30">{vod.duration}</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 flex-shrink-0">
                                        <Badge variant={vod.is_active ? 'success' : 'danger'}>
                                            {vod.is_active ? t.common.active : t.common.off}
                                        </Badge>
                                        <button
                                            onClick={() => toggleVod(vod.id, vod.is_active)}
                                            className="p-1.5 rounded hover:bg-foreground/5 text-foreground/40 hover:text-foreground transition-colors"
                                        >
                                            {vod.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                        <button
                                            onClick={() => deleteVod(vod.id)}
                                            className="p-1.5 rounded hover:bg-red-500/10 text-foreground/40 hover:text-red-400 transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                        {vods.length === 0 && (
                            <div className="admin-card text-center py-12 text-foreground/30 text-sm">
                                {t.adminContent.noVideos}
                            </div>
                        )}
                    </div>
                </>
            )}

            {tab === 'emod' && (
                <>
                    <div className="flex justify-end mb-4">
                        <Button size="sm" onClick={() => setShowEmodForm(!showEmodForm)}>
                            <Plus className="w-4 h-4" />
                            {t.adminContent.addModule}
                        </Button>
                    </div>

                    {showEmodForm && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="mb-6"
                        >
                            <div className="admin-card p-6">
                                <h2 className="text-base font-semibold text-foreground mb-4">{t.adminContent.newModule}</h2>
                                <form onSubmit={createEmod} className="grid md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs text-foreground/40 mb-1">{t.common.title}</label>
                                        <input
                                            type="text"
                                            required
                                            value={emodForm.title}
                                            onChange={(e) => setEmodForm({ ...emodForm, title: e.target.value })}
                                            className="admin-input w-full px-3 py-2 text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-foreground/40 mb-1">{t.adminContent.driveUrl}</label>
                                        <input
                                            type="url"
                                            required
                                            value={emodForm.drive_url}
                                            onChange={(e) => setEmodForm({ ...emodForm, drive_url: e.target.value })}
                                            className="admin-input w-full px-3 py-2 text-sm"
                                            placeholder="https://drive.google.com/file/d/..."
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-foreground/40 mb-1">{t.common.subject}</label>
                                        <select
                                            value={emodForm.subject_id}
                                            onChange={(e) => setEmodForm({ ...emodForm, subject_id: e.target.value })}
                                            className="admin-input w-full px-3 py-2 text-sm"
                                        >
                                            <option value="">{t.common.selectSubject}</option>
                                            {subjects.map((s) => (
                                                <option key={s.id} value={s.id}>
                                                    {s.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs text-foreground/40 mb-1">{t.adminContent.chapter}</label>
                                        <input
                                            type="text"
                                            value={emodForm.chapter}
                                            onChange={(e) => setEmodForm({ ...emodForm, chapter: e.target.value })}
                                            className="admin-input w-full px-3 py-2 text-sm"
                                            placeholder={t.adminContent.chapterPlaceholder}
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-xs text-foreground/40 mb-1">{t.common.description}</label>
                                        <textarea
                                            value={emodForm.description}
                                            onChange={(e) => setEmodForm({ ...emodForm, description: e.target.value })}
                                            className="admin-input w-full px-3 py-2 text-sm h-16 resize-none"
                                        />
                                    </div>
                                    <div className="md:col-span-2 flex gap-3 justify-end">
                                        <Button variant="ghost" onClick={() => setShowEmodForm(false)}>
                                            {t.common.cancel}
                                        </Button>
                                        <Button type="submit">{t.common.save}</Button>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    )}

                    <div className="space-y-3">
                        {emods.map((emod, idx) => (
                            <motion.div
                                key={emod.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.02 }}
                                className="admin-card p-4"
                            >
                                <div className="flex items-center justify-between gap-3">
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-sm font-semibold text-foreground truncate">{emod.title}</h3>
                                        <div className="flex items-center gap-2 mt-1">
                                            <Badge variant="info">{emod.subject?.name || 'Umum'}</Badge>
                                            {emod.chapter && <Badge>{emod.chapter}</Badge>}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 flex-shrink-0">
                                        <Badge variant={emod.is_active ? 'success' : 'danger'}>
                                            {emod.is_active ? t.common.active : t.common.off}
                                        </Badge>
                                        <a
                                            href={emod.drive_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="p-1.5 rounded hover:bg-foreground/5 text-foreground/40 hover:text-foreground transition-colors"
                                        >
                                            <ExternalLink className="w-4 h-4" />
                                        </a>
                                        <button
                                            onClick={() => toggleEmod(emod.id, emod.is_active)}
                                            className="p-1.5 rounded hover:bg-foreground/5 text-foreground/40 hover:text-foreground transition-colors"
                                        >
                                            {emod.is_active ? (
                                                <EyeOff className="w-4 h-4" />
                                            ) : (
                                                <Eye className="w-4 h-4" />
                                            )}
                                        </button>
                                        <button
                                            onClick={() => deleteEmod(emod.id)}
                                            className="p-1.5 rounded hover:bg-red-500/10 text-foreground/40 hover:text-red-400 transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                        {emods.length === 0 && (
                            <div className="admin-card text-center py-12 text-foreground/30 text-sm">
                                {t.adminContent.noModules}
                            </div>
                        )}
                    </div>
                </>
            )}

            {tab === 'live' && (
                <>
                    <div className="flex justify-end mb-4">
                        <Button size="sm" onClick={() => setShowLiveForm(!showLiveForm)}>
                            <Plus className="w-4 h-4" />
                            {t.adminContent.scheduleLive}
                        </Button>
                    </div>

                    {showLiveForm && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="mb-6"
                        >
                            <div className="admin-card p-6">
                                <h2 className="text-base font-semibold text-foreground mb-4">{t.adminContent.newLiveClass}</h2>
                                <form onSubmit={createLive} className="grid md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs text-foreground/40 mb-1">{t.common.title}</label>
                                        <input
                                            type="text"
                                            required
                                            value={liveForm.title}
                                            onChange={(e) => setLiveForm({ ...liveForm, title: e.target.value })}
                                            className="admin-input w-full px-3 py-2 text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-foreground/40 mb-1">{t.adminContent.meetLink}</label>
                                        <input
                                            type="url"
                                            required
                                            value={liveForm.meet_url}
                                            onChange={(e) => setLiveForm({ ...liveForm, meet_url: e.target.value })}
                                            className="admin-input w-full px-3 py-2 text-sm"
                                            placeholder="https://meet.google.com/..."
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-foreground/40 mb-1">{t.adminContent.schedule}</label>
                                        <input
                                            type="datetime-local"
                                            required
                                            value={liveForm.scheduled_at}
                                            onChange={(e) => setLiveForm({ ...liveForm, scheduled_at: e.target.value })}
                                            className="admin-input w-full px-3 py-2 text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-foreground/40 mb-1">{t.common.subject}</label>
                                        <select
                                            value={liveForm.subject_id}
                                            onChange={(e) => setLiveForm({ ...liveForm, subject_id: e.target.value })}
                                            className="admin-input w-full px-3 py-2 text-sm"
                                        >
                                            <option value="">{t.common.selectSubject}</option>
                                            {subjects.map((s) => (
                                                <option key={s.id} value={s.id}>
                                                    {s.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-xs text-foreground/40 mb-1">{t.common.description}</label>
                                        <textarea
                                            value={liveForm.description}
                                            onChange={(e) => setLiveForm({ ...liveForm, description: e.target.value })}
                                            className="admin-input w-full px-3 py-2 text-sm h-16 resize-none"
                                        />
                                    </div>
                                    <div className="md:col-span-2 flex gap-3 justify-end">
                                        <Button variant="ghost" onClick={() => setShowLiveForm(false)}>
                                            {t.common.cancel}
                                        </Button>
                                        <Button type="submit">{t.common.save}</Button>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    )}

                    <div className="space-y-3">
                        {liveClasses.map((lc, idx) => {
                            const isUpcoming = new Date(lc.scheduled_at) > new Date();
                            return (
                                <motion.div
                                    key={lc.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.02 }}
                                    className="admin-card p-4"
                                >
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="text-sm font-semibold text-foreground truncate">{lc.title}</h3>
                                                {isUpcoming && (
                                                    <Badge variant="success">Upcoming</Badge>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Badge variant="info">{lc.subject?.name || 'Umum'}</Badge>
                                                <span className="text-[10px] text-foreground/30">
                                                    {formatDateTime(lc.scheduled_at)}
                                                </span>
                                                {lc.tutor && (
                                                    <span className="text-[10px] text-foreground/30">
                                                        — {lc.tutor.full_name}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1 flex-shrink-0">
                                            <Badge variant={lc.is_active ? 'success' : 'danger'}>
                                                {lc.is_active ? t.common.active : t.common.off}
                                            </Badge>
                                            <a
                                                href={lc.meet_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="p-1.5 rounded hover:bg-foreground/5 text-foreground/40 hover:text-foreground transition-colors"
                                            >
                                                <ExternalLink className="w-4 h-4" />
                                            </a>
                                            <button
                                                onClick={() => toggleLive(lc.id, lc.is_active)}
                                                className="p-1.5 rounded hover:bg-foreground/5 text-foreground/40 hover:text-foreground transition-colors"
                                            >
                                                {lc.is_active ? (
                                                    <EyeOff className="w-4 h-4" />
                                                ) : (
                                                    <Eye className="w-4 h-4" />
                                                )}
                                            </button>
                                            <button
                                                onClick={() => deleteLive(lc.id)}
                                                className="p-1.5 rounded hover:bg-red-500/10 text-foreground/40 hover:text-red-400 transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                        {liveClasses.length === 0 && (
                            <div className="admin-card text-center py-12 text-foreground/30 text-sm">
                                {t.adminContent.noLiveClasses}
                            </div>
                        )}
                    </div>
                </>
            )}
        </motion.div>
    );
}
