'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { Button, Badge, LoadingSpinner } from '@/components/ui';
import { useAuthStore } from '@/stores/auth-store';
import { FileText, Plus, Edit2, Trash2, Eye, EyeOff } from 'lucide-react';
import type { TryOut, Subject, ClassGroup } from '@/types/database';
import { formatDateTime } from '@/lib/utils';

export default function AdminTryoutsPage() {
    const { user } = useAuthStore();
    const [tryouts, setTryouts] = useState<TryOut[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [classes, setClasses] = useState<ClassGroup[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        title: '',
        subject_id: '',
        class_id: '',
        description: '',
        duration_minutes: 60,
        passing_grade: 70,
    });

    useEffect(() => {
        const supabase = createClient();

        const fetchData = async () => {
            const { data: tryoutData } = await supabase
                .from('tryouts')
                .select('*, subject:subjects(*)')
                .order('created_at', { ascending: false });

            if (tryoutData) setTryouts(tryoutData);

            const { data: subjectData } = await supabase.from('subjects').select('*');
            if (subjectData) setSubjects(subjectData);

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

        if (editingId) {
            const { data } = await supabase
                .from('tryouts')
                .update({
                    title: formData.title,
                    subject_id: formData.subject_id,
                    class_id: formData.class_id || null,
                    description: formData.description,
                    duration_minutes: formData.duration_minutes,
                    passing_grade: formData.passing_grade,
                })
                .eq('id', editingId)
                .select('*, subject:subjects(*)')
                .single();

            if (data) {
                setTryouts((prev) => prev.map((t) => (t.id === editingId ? data : t)));
                resetForm();
            }
            return;
        }

        const { data, error } = await supabase
            .from('tryouts')
            .insert({
                ...formData,
                class_id: formData.class_id || null,
                created_by: user.id,
            })
            .select('*, subject:subjects(*)')
            .single();

        if (data) {
            setTryouts([data, ...tryouts]);
            resetForm();
        }
    };

    const startEdit = (tryout: TryOut) => {
        setEditingId(tryout.id);
        setFormData({
            title: tryout.title,
            subject_id: tryout.subject_id,
            class_id: tryout.class_id || '',
            description: tryout.description || '',
            duration_minutes: tryout.duration_minutes,
            passing_grade: tryout.passing_grade,
        });
        setShowForm(true);
    };

    const resetForm = () => {
        setShowForm(false);
        setEditingId(null);
        setFormData({
            title: '',
            subject_id: '',
            class_id: '',
            description: '',
            duration_minutes: 60,
            passing_grade: 70,
        });
    };

    const toggleActive = async (id: string, current: boolean) => {
        const supabase = createClient();
        await supabase.from('tryouts').update({ is_active: !current }).eq('id', id);
        setTryouts((prev) =>
            prev.map((t) => (t.id === id ? { ...t, is_active: !current } : t))
        );
    };

    const deleteTryout = async (id: string) => {
        if (!confirm('Hapus Try Out ini? Semua soal dan jawaban terkait akan ikut terhapus.')) return;
        const supabase = createClient();
        await supabase.from('tryouts').delete().eq('id', id);
        setTryouts((prev) => prev.filter((t) => t.id !== id));
    };

    if (isLoading) return <LoadingSpinner className="min-h-[50vh]" />;

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
                        <FileText className="w-6 h-6 text-accent-1" />
                        Manajemen Try Out
                    </h1>
                    <p className="text-foreground/40 text-sm mt-1">{tryouts.length} Try Out</p>
                </div>
                <Button onClick={() => showForm ? resetForm() : setShowForm(true)}>
                    <Plus className="w-4 h-4" />
                    Buat Try Out
                </Button>
            </div>

            {showForm && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mb-6"
                >
                    <div className="admin-card p-6">
                        <h2 className="text-lg font-semibold text-foreground mb-4">
                            {editingId ? 'Edit Try Out' : 'Buat Try Out Baru'}
                        </h2>
                        <form onSubmit={handleCreate} className="grid md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs text-foreground/40 mb-1">Judul</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className="admin-input w-full px-3 py-2 text-sm"
                                    placeholder="Try Out Matematika Bab 1"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-foreground/40 mb-1">Mata Pelajaran</label>
                                <select
                                    required
                                    value={formData.subject_id}
                                    onChange={(e) => setFormData({ ...formData, subject_id: e.target.value })}
                                    className="admin-input w-full px-3 py-2 text-sm"
                                >
                                    <option value="">Pilih Mapel</option>
                                    {subjects.map((s) => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs text-foreground/40 mb-1">Kelas (opsional)</label>
                                <select
                                    value={formData.class_id}
                                    onChange={(e) => setFormData({ ...formData, class_id: e.target.value })}
                                    className="admin-input w-full px-3 py-2 text-sm"
                                >
                                    <option value="">Semua Kelas</option>
                                    {classes.map((c) => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs text-foreground/40 mb-1">Durasi (menit)</label>
                                <input
                                    type="number"
                                    required
                                    min={1}
                                    value={formData.duration_minutes}
                                    onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) })}
                                    className="admin-input w-full px-3 py-2 text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-foreground/40 mb-1">KKM</label>
                                <input
                                    type="number"
                                    required
                                    min={0}
                                    max={100}
                                    value={formData.passing_grade}
                                    onChange={(e) => setFormData({ ...formData, passing_grade: parseInt(e.target.value) })}
                                    className="admin-input w-full px-3 py-2 text-sm"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-xs text-foreground/40 mb-1">Deskripsi</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="admin-input w-full px-3 py-2 text-sm h-20 resize-none"
                                    placeholder="Deskripsi singkat..."
                                />
                            </div>
                            <div className="md:col-span-2 flex gap-3 justify-end">
                                <Button variant="ghost" onClick={resetForm}>Batal</Button>
                                <Button type="submit">{editingId ? 'Update' : 'Simpan'}</Button>
                            </div>
                        </form>
                    </div>
                </motion.div>
            )}

            <div className="admin-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full admin-table">
                        <thead>
                            <tr>
                                <th className="px-4 py-3 text-left">Judul</th>
                                <th className="px-4 py-3 text-left">Mapel</th>
                                <th className="px-4 py-3 text-center">Durasi</th>
                                <th className="px-4 py-3 text-center">KKM</th>
                                <th className="px-4 py-3 text-center">Status</th>
                                <th className="px-4 py-3 text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tryouts.map((tryout) => (
                                <tr key={tryout.id}>
                                    <td className="px-4 py-3 text-sm text-foreground font-medium">{tryout.title}</td>
                                    <td className="px-4 py-3">
                                        <Badge variant="info">{tryout.subject?.name}</Badge>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-foreground/50 text-center">
                                        {tryout.duration_minutes} min
                                    </td>
                                    <td className="px-4 py-3 text-sm text-foreground/50 text-center">
                                        {tryout.passing_grade}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <Badge variant={tryout.is_active ? 'success' : 'danger'}>
                                            {tryout.is_active ? 'Aktif' : 'Nonaktif'}
                                        </Badge>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <div className="flex items-center justify-center gap-1">
                                            <button
                                                onClick={() => startEdit(tryout)}
                                                className="p-1.5 rounded hover:bg-foreground/5 text-foreground/40 hover:text-accent-1 transition-colors"
                                                title="Edit"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => toggleActive(tryout.id, tryout.is_active)}
                                                className="p-1.5 rounded hover:bg-foreground/5 text-foreground/40 hover:text-foreground transition-colors"
                                                title={tryout.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                                            >
                                                {tryout.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                            <button
                                                onClick={() => deleteTryout(tryout.id)}
                                                className="p-1.5 rounded hover:bg-red-500/10 text-foreground/40 hover:text-red-400 transition-colors"
                                                title="Hapus"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {tryouts.length === 0 && (
                    <div className="text-center py-12 text-foreground/30 text-sm">
                        Belum ada Try Out. Klik &quot;Buat Try Out&quot; untuk memulai.
                    </div>
                )}
            </div>
        </motion.div>
    );
}
