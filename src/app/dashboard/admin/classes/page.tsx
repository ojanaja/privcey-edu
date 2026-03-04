'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { Button, Badge, LoadingSpinner } from '@/components/ui';
import {
    School,
    Plus,
    Trash2,
    Edit2,
    Users,
    X,
    Save,
} from 'lucide-react';
import type { Profile } from '@/types/database';
import { formatDate } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';

interface ClassWithMeta {
    id: string;
    name: string;
    description: string | null;
    tutor_id: string | null;
    max_students: number;
    created_at: string;
    student_count: number;
    tutor_name: string | null;
}

export default function AdminClassesPage() {
    const { t } = useTranslation();
    const [classes, setClasses] = useState<ClassWithMeta[]>([]);
    const [tutors, setTutors] = useState<Profile[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        max_students: 25,
        tutor_id: '',
    });

    const fetchClasses = useCallback(async () => {
        const res = await fetch('/api/admin/classes');
        const data = await res.json();
        if (data.classes) setClasses(data.classes);
        setIsLoading(false);
    }, []);

    const fetchTutors = useCallback(async () => {
        const supabase = createClient();
        const { data } = await supabase
            .from('profiles')
            .select('id, full_name, email')
            .in('role', ['tutor', 'admin'])
            .order('full_name');
        if (data) setTutors(data as Profile[]);
    }, []);

    useEffect(() => {
        fetchClasses();
        fetchTutors();
    }, [fetchClasses, fetchTutors]);

    const resetForm = () => {
        setFormData({ name: '', description: '', max_students: 25, tutor_id: '' });
        setEditingId(null);
        setShowForm(false);
        setError('');
    };

    const startEdit = (cls: ClassWithMeta) => {
        setFormData({
            name: cls.name,
            description: cls.description || '',
            max_students: cls.max_students,
            tutor_id: cls.tutor_id || '',
        });
        setEditingId(cls.id);
        setShowForm(true);
        setError('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setError('');

        try {
            const method = editingId ? 'PUT' : 'POST';
            const body = editingId
                ? { id: editingId, ...formData }
                : formData;

            const res = await fetch('/api/admin/classes', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            const data = await res.json();
            if (!res.ok) {
                setError(data.error || 'Gagal menyimpan');
                return;
            }

            resetForm();
            fetchClasses();
        } catch {
            setError('Terjadi kesalahan');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (cls: ClassWithMeta) => {
        if (cls.student_count > 0) {
            alert(t.adminClasses.cannotDeleteWithStudents);
            return;
        }
        if (!confirm(t.adminClasses.confirmDelete)) return;

        const res = await fetch(`/api/admin/classes?id=${cls.id}`, { method: 'DELETE' });
        const data = await res.json();
        if (!res.ok) {
            alert(data.error);
            return;
        }
        fetchClasses();
    };

    const totalStudents = classes.reduce((sum, c) => sum + c.student_count, 0);
    const totalCapacity = classes.reduce((sum, c) => sum + c.max_students, 0);

    if (isLoading) return <LoadingSpinner className="min-h-[50vh]" />;

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
                        <School className="w-6 h-6 text-accent-1" />
                        {t.adminClasses.title}
                    </h1>
                    <p className="text-foreground/40 text-sm mt-1">
                        {classes.length} {t.adminClasses.subtitle} · {totalStudents}/{totalCapacity} {t.adminClasses.studentsCapacity}
                    </p>
                </div>
                <Button onClick={() => { resetForm(); setShowForm(!showForm); }}>
                    <Plus className="w-4 h-4" />
                    {t.adminClasses.create}
                </Button>
            </div>

            {showForm && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mb-6"
                >
                    <div className="admin-card p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-foreground">
                                {editingId ? t.adminClasses.editClass : t.adminClasses.newClass}
                            </h2>
                            <button onClick={resetForm} className="text-foreground/30 hover:text-foreground/60 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {error && (
                            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs text-foreground/40 mb-1">{t.adminClasses.nameLabel}</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="admin-input w-full px-3 py-2 text-sm"
                                        placeholder={t.adminClasses.namePlaceholder}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-foreground/40 mb-1">{t.adminClasses.maxStudentsLabel}</label>
                                    <input
                                        type="number"
                                        min={1}
                                        max={100}
                                        value={formData.max_students}
                                        onChange={(e) => setFormData({ ...formData, max_students: parseInt(e.target.value) || 25 })}
                                        className="admin-input w-full px-3 py-2 text-sm"
                                    />
                                </div>
                            </div>
                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs text-foreground/40 mb-1">{t.adminClasses.descriptionLabel}</label>
                                    <input
                                        type="text"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className="admin-input w-full px-3 py-2 text-sm"
                                        placeholder={t.adminClasses.descriptionPlaceholder}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-foreground/40 mb-1">{t.adminClasses.tutorLabel}</label>
                                    <select
                                        value={formData.tutor_id}
                                        onChange={(e) => setFormData({ ...formData, tutor_id: e.target.value })}
                                        className="admin-input w-full px-3 py-2 text-sm"
                                    >
                                        <option value="">{t.adminClasses.noTutor}</option>
                                        {tutors.map((tutor) => (
                                            <option key={tutor.id} value={tutor.id}>
                                                {tutor.full_name} ({tutor.email})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="flex gap-3 justify-end">
                                <Button variant="ghost" type="button" onClick={resetForm}>{t.common.cancel}</Button>
                                <Button type="submit" disabled={isSaving}>
                                    <Save className="w-4 h-4" />
                                    {isSaving ? t.common.loading : (editingId ? t.common.save : t.adminClasses.create)}
                                </Button>
                            </div>
                        </form>
                    </div>
                </motion.div>
            )}

            {classes.length > 0 ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {classes.map((cls, idx) => {
                        const usage = cls.max_students > 0 ? (cls.student_count / cls.max_students) * 100 : 0;
                        const isFull = cls.student_count >= cls.max_students;

                        return (
                            <motion.div
                                key={cls.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.04 }}
                                className="admin-card p-5"
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div>
                                        <h3 className="text-base font-semibold text-foreground">{cls.name}</h3>
                                        {cls.description && (
                                            <p className="text-xs text-foreground/40 mt-0.5">{cls.description}</p>
                                        )}
                                    </div>
                                    <Badge variant={isFull ? 'danger' : 'success'}>
                                        {isFull ? t.adminClasses.full : t.adminClasses.available}
                                    </Badge>
                                </div>

                                <div className="mb-3">
                                    <div className="flex items-center justify-between text-xs mb-1.5">
                                        <span className="text-foreground/50 flex items-center gap-1">
                                            <Users className="w-3.5 h-3.5" />
                                            {cls.student_count}/{cls.max_students} {t.common.student}
                                        </span>
                                        <span className="text-foreground/30">{Math.round(usage)}%</span>
                                    </div>
                                    <div className="h-1.5 rounded-full bg-foreground/5 overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all ${usage >= 90 ? 'bg-red-400' : usage >= 70 ? 'bg-yellow-400' : 'bg-green-400'
                                                }`}
                                            style={{ width: `${Math.min(usage, 100)}%` }}
                                        />
                                    </div>
                                </div>

                                <div className="text-xs text-foreground/40 mb-4">
                                    {t.common.tutor}: <span className="text-foreground/60">{cls.tutor_name || '-'}</span>
                                </div>

                                <div className="flex items-center gap-2 pt-3 border-t border-foreground/5">
                                    <button
                                        onClick={() => startEdit(cls)}
                                        className="flex items-center gap-1.5 text-xs text-accent-1 hover:text-accent-2 transition-colors px-2 py-1 rounded hover:bg-accent-1/10"
                                    >
                                        <Edit2 className="w-3.5 h-3.5" />
                                        {t.common.edit}
                                    </button>
                                    <button
                                        onClick={() => handleDelete(cls)}
                                        className={`flex items-center gap-1.5 text-xs transition-colors px-2 py-1 rounded ${cls.student_count > 0
                                                ? 'text-foreground/20 cursor-not-allowed'
                                                : 'text-red-400 hover:text-red-300 hover:bg-red-500/10'
                                            }`}
                                        disabled={cls.student_count > 0}
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                        {t.common.delete}
                                    </button>
                                    <span className="ml-auto text-[10px] text-foreground/20">
                                        {formatDate(cls.created_at)}
                                    </span>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            ) : (
                <div className="admin-card p-12 text-center text-foreground/30 text-sm">
                    <School className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    {t.adminClasses.noClasses}
                </div>
            )}
        </motion.div>
    );
}
