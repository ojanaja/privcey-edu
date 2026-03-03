'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/auth-store';
import { Button, Badge, LoadingSpinner } from '@/components/ui';
import { Megaphone, Plus, Trash2, Eye, EyeOff } from 'lucide-react';
import type { Announcement, ClassGroup } from '@/types/database';
import { formatDateTime } from '@/lib/utils';

export default function AdminAnnouncementsPage() {
    const { user } = useAuthStore();
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [classes, setClasses] = useState<ClassGroup[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        type: 'info' as Announcement['type'],
        target_class_id: '',
    });

    useEffect(() => {
        const supabase = createClient();

        const fetchData = async () => {
            const { data: annData } = await supabase
                .from('announcements')
                .select('*')
                .order('created_at', { ascending: false });

            if (annData) setAnnouncements(annData);

            const { data: classData } = await supabase.from('class_groups').select('*');
            if (classData) setClasses(classData);

            setIsLoading(false);
        };

        fetchData();
    }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        const supabase = createClient();
        const { data, error } = await supabase
            .from('announcements')
            .insert({
                ...formData,
                target_class_id: formData.target_class_id || null,
                created_by: user.id,
            })
            .select()
            .single();

        if (data) {
            setAnnouncements([data, ...announcements]);
            setShowForm(false);
            setFormData({ title: '', content: '', type: 'info', target_class_id: '' });
        }
    };

    const toggleActive = async (id: string, current: boolean) => {
        const supabase = createClient();
        await supabase.from('announcements').update({ is_active: !current }).eq('id', id);
        setAnnouncements((prev) =>
            prev.map((a) => (a.id === id ? { ...a, is_active: !current } : a))
        );
    };

    const deleteAnnouncement = async (id: string) => {
        if (!confirm('Hapus pengumuman ini?')) return;
        const supabase = createClient();
        await supabase.from('announcements').delete().eq('id', id);
        setAnnouncements((prev) => prev.filter((a) => a.id !== id));
    };

    const typeColors = {
        info: 'info',
        warning: 'warning',
        success: 'success',
        urgent: 'danger',
    } as const;

    if (isLoading) return <LoadingSpinner className="min-h-[50vh]" />;

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
                        <Megaphone className="w-6 h-6 text-accent-1" />
                        Pengumuman
                    </h1>
                    <p className="text-foreground/40 text-sm mt-1">Centralized Broadcast ke semua siswa</p>
                </div>
                <Button onClick={() => setShowForm(!showForm)}>
                    <Plus className="w-4 h-4" />
                    Buat Pengumuman
                </Button>
            </div>

            {/* Create Form */}
            {showForm && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mb-6"
                >
                    <div className="admin-card p-6">
                        <h2 className="text-lg font-semibold text-foreground mb-4">Pengumuman Baru</h2>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs text-foreground/40 mb-1">Judul</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        className="admin-input w-full px-3 py-2 text-sm"
                                        placeholder="Judul pengumuman"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs text-foreground/40 mb-1">Tipe</label>
                                        <select
                                            value={formData.type}
                                            onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                                            className="admin-input w-full px-3 py-2 text-sm"
                                        >
                                            <option value="info">Info</option>
                                            <option value="warning">Peringatan</option>
                                            <option value="success">Sukses</option>
                                            <option value="urgent">Urgent</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs text-foreground/40 mb-1">Target Kelas</label>
                                        <select
                                            value={formData.target_class_id}
                                            onChange={(e) => setFormData({ ...formData, target_class_id: e.target.value })}
                                            className="admin-input w-full px-3 py-2 text-sm"
                                        >
                                            <option value="">Semua Kelas</option>
                                            {classes.map((c) => (
                                                <option key={c.id} value={c.id}>{c.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs text-foreground/40 mb-1">Isi Pengumuman</label>
                                <textarea
                                    required
                                    value={formData.content}
                                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                    className="admin-input w-full px-3 py-2 text-sm h-24 resize-none"
                                    placeholder="Tuliskan isi pengumuman..."
                                />
                            </div>
                            <div className="flex gap-3 justify-end">
                                <Button variant="ghost" onClick={() => setShowForm(false)}>Batal</Button>
                                <Button type="submit">Publikasikan</Button>
                            </div>
                        </form>
                    </div>
                </motion.div>
            )}

            {/* Announcements List */}
            <div className="space-y-3">
                {announcements.map((ann, idx) => (
                    <motion.div
                        key={ann.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.03 }}
                        className="admin-card p-4"
                    >
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <h3 className="text-sm font-semibold text-foreground">{ann.title}</h3>
                                    <Badge variant={typeColors[ann.type]}>{ann.type}</Badge>
                                    <Badge variant={ann.is_active ? 'success' : 'danger'}>
                                        {ann.is_active ? 'Aktif' : 'Nonaktif'}
                                    </Badge>
                                </div>
                                <p className="text-xs text-foreground/40 line-clamp-2">{ann.content}</p>
                                <p className="text-[10px] text-foreground/20 mt-1">
                                    {formatDateTime(ann.created_at)}
                                </p>
                            </div>
                            <div className="flex gap-1">
                                <button
                                    onClick={() => toggleActive(ann.id, ann.is_active)}
                                    className="p-1.5 rounded hover:bg-foreground/5 text-foreground/40 hover:text-foreground transition-colors"
                                >
                                    {ann.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                                <button
                                    onClick={() => deleteAnnouncement(ann.id)}
                                    className="p-1.5 rounded hover:bg-red-500/10 text-foreground/40 hover:text-red-400 transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                ))}
                {announcements.length === 0 && (
                    <div className="admin-card text-center py-12 text-foreground/30 text-sm">
                        Belum ada pengumuman
                    </div>
                )}
            </div>
        </motion.div>
    );
}
