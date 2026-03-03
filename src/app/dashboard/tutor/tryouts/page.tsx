'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/auth-store';
import { Button, Badge, LoadingSpinner } from '@/components/ui';
import { useTranslation } from '@/lib/i18n';
import { FileText, Plus, Trash2, Eye, EyeOff, BookOpen } from 'lucide-react';
import type { TryOut, Subject, ClassGroup, Question } from '@/types/database';

export default function TutorTryoutsPage() {
    const { t } = useTranslation();
    const { user } = useAuthStore();
    const [tryouts, setTryouts] = useState<TryOut[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [classes, setClasses] = useState<ClassGroup[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [selectedTryout, setSelectedTryout] = useState<string | null>(null);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [formData, setFormData] = useState({
        title: '',
        subject_id: '',
        class_id: '',
        description: '',
        duration_minutes: 60,
        passing_grade: 70,
    });
    const [questionForm, setQuestionForm] = useState({
        question_text: '',
        option_a: '',
        option_b: '',
        option_c: '',
        option_d: '',
        option_e: '',
        correct_answer: 'A' as 'A' | 'B' | 'C' | 'D' | 'E',
        explanation: '',
        difficulty: 'medium' as 'easy' | 'medium' | 'hard',
    });
    const [showQuestionForm, setShowQuestionForm] = useState(false);

    useEffect(() => {
        if (!user) return;
        const supabase = createClient();

        const fetchData = async () => {
            const { data: tryoutData } = await supabase
                .from('tryouts')
                .select('*, subject:subjects(*)')
                .eq('created_by', user.id)
                .order('created_at', { ascending: false });

            if (tryoutData) setTryouts(tryoutData);

            const { data: subjectData } = await supabase.from('subjects').select('*');
            if (subjectData) setSubjects(subjectData);

            const { data: classData } = await supabase.from('class_groups').select('*');
            if (classData) setClasses(classData);

            setIsLoading(false);
        };

        fetchData();
    }, [user]);

    useEffect(() => {
        if (!selectedTryout) { setQuestions([]); return; }
        const supabase = createClient();
        supabase
            .from('questions')
            .select('*')
            .eq('tryout_id', selectedTryout)
            .order('order_number')
            .then(({ data }) => { if (data) setQuestions(data); });
    }, [selectedTryout]);

    const handleCreateTryout = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        const supabase = createClient();
        const { data } = await supabase
            .from('tryouts')
            .insert({ ...formData, class_id: formData.class_id || null, created_by: user.id })
            .select('*, subject:subjects(*)')
            .single();
        if (data) {
            setTryouts([data, ...tryouts]);
            setShowForm(false);
            setFormData({ title: '', subject_id: '', class_id: '', description: '', duration_minutes: 60, passing_grade: 70 });
        }
    };

    const handleAddQuestion = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedTryout) return;
        const supabase = createClient();
        const { data } = await supabase
            .from('questions')
            .insert({ ...questionForm, tryout_id: selectedTryout, order_number: questions.length + 1 })
            .select()
            .single();
        if (data) {
            setQuestions([...questions, data]);
            setShowQuestionForm(false);
            setQuestionForm({ question_text: '', option_a: '', option_b: '', option_c: '', option_d: '', option_e: '', correct_answer: 'A', explanation: '', difficulty: 'medium' });
        }
    };

    const deleteQuestion = async (id: string) => {
        if (!confirm(t.tutorTryouts.confirmDeleteQuestion)) return;
        const supabase = createClient();
        await supabase.from('questions').delete().eq('id', id);
        setQuestions((prev) => prev.filter((q) => q.id !== id));
    };

    const toggleActive = async (id: string, current: boolean) => {
        const supabase = createClient();
        await supabase.from('tryouts').update({ is_active: !current }).eq('id', id);
        setTryouts((prev) => prev.map((t) => (t.id === id ? { ...t, is_active: !current } : t)));
    };

    if (isLoading) return <LoadingSpinner className="min-h-[50vh]" />;

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
                        <FileText className="w-6 h-6 text-accent-1" />
                        {t.tutorTryouts.title}
                    </h1>
                    <p className="text-foreground/40 text-sm mt-1">{tryouts.length} {t.tutorTryouts.subtitle}</p>
                </div>
                <Button onClick={() => { setShowForm(!showForm); setSelectedTryout(null); }}>
                    <Plus className="w-4 h-4" />
                    {t.tutorTryouts.create}
                </Button>
            </div>

            {/* Create TryOut Form */}
            {showForm && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mb-6">
                    <div className="admin-card p-6">
                        <h2 className="text-lg font-semibold text-foreground mb-4">{t.tutorTryouts.newTryout}</h2>
                        <form onSubmit={handleCreateTryout} className="grid md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs text-foreground/40 mb-1">{t.common.title}</label>
                                <input type="text" required value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="admin-input w-full px-3 py-2 text-sm" />
                            </div>
                            <div>
                                <label className="block text-xs text-foreground/40 mb-1">{t.common.subject}</label>
                                <select required value={formData.subject_id} onChange={(e) => setFormData({ ...formData, subject_id: e.target.value })} className="admin-input w-full px-3 py-2 text-sm">
                                    <option value="">{t.tutorTryouts.selectSubject}</option>
                                    {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs text-foreground/40 mb-1">{t.tutorTryouts.classOptional}</label>
                                <select value={formData.class_id} onChange={(e) => setFormData({ ...formData, class_id: e.target.value })} className="admin-input w-full px-3 py-2 text-sm">
                                    <option value="">{t.tutorTryouts.allOption}</option>
                                    {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs text-foreground/40 mb-1">{t.tutorTryouts.durationMinutes}</label>
                                <input type="number" required min={1} value={formData.duration_minutes} onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) })} className="admin-input w-full px-3 py-2 text-sm" />
                            </div>
                            <div className="md:col-span-2 flex gap-3 justify-end">
                                <Button variant="ghost" onClick={() => setShowForm(false)}>{t.common.cancel}</Button>
                                <Button type="submit">{t.common.save}</Button>
                            </div>
                        </form>
                    </div>
                </motion.div>
            )}

            {/* Tryout List */}
            <div className="space-y-3 mb-6">
                {tryouts.map((tryout) => (
                    <div
                        key={tryout.id}
                        className={`admin-card p-4 cursor-pointer transition-all ${selectedTryout === tryout.id ? 'ring-1 ring-accent-3/50' : ''}`}
                        onClick={() => setSelectedTryout(selectedTryout === tryout.id ? null : tryout.id)}
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-sm font-semibold text-foreground">{tryout.title}</h3>
                                <p className="text-xs text-foreground/40">{tryout.subject?.name} · {tryout.duration_minutes} min</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <Badge variant={tryout.is_active ? 'success' : 'danger'}>{tryout.is_active ? t.common.active : t.common.inactive}</Badge>
                                <button
                                    onClick={(e) => { e.stopPropagation(); toggleActive(tryout.id, tryout.is_active); }}
                                    className="p-1 text-foreground/30 hover:text-foreground"
                                >
                                    {tryout.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Questions for selected tryout */}
            {selectedTryout && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                            <BookOpen className="w-4 h-4 text-accent-1" />
                            {t.tutorTryouts.questionsSection} ({questions.length})
                        </h2>
                        <Button size="sm" onClick={() => setShowQuestionForm(!showQuestionForm)}>
                            <Plus className="w-4 h-4" />
                            {t.tutorTryouts.addQuestion}
                        </Button>
                    </div>

                    {showQuestionForm && (
                        <div className="admin-card p-6 mb-4">
                            <form onSubmit={handleAddQuestion} className="space-y-3">
                                <textarea required value={questionForm.question_text} onChange={(e) => setQuestionForm({ ...questionForm, question_text: e.target.value })} className="admin-input w-full px-3 py-2 text-sm h-20 resize-none" placeholder={t.tutorTryouts.questionPlaceholder} />
                                <div className="grid grid-cols-2 gap-3">
                                    {(['A', 'B', 'C', 'D', 'E'] as const).map((opt) => (
                                        <input key={opt} type="text" required={opt !== 'E'} placeholder={`Opsi ${opt}`} value={questionForm[`option_${opt.toLowerCase()}` as keyof typeof questionForm] as string} onChange={(e) => setQuestionForm({ ...questionForm, [`option_${opt.toLowerCase()}`]: e.target.value })} className="admin-input px-3 py-2 text-sm" />
                                    ))}
                                    <select value={questionForm.correct_answer} onChange={(e) => setQuestionForm({ ...questionForm, correct_answer: e.target.value as any })} className="admin-input px-3 py-2 text-sm">
                                        {['A', 'B', 'C', 'D', 'E'].map((o) => <option key={o} value={o}>{t.tutorTryouts.answerLabel} {o}</option>)}
                                    </select>
                                </div>
                                <div className="flex gap-3 justify-end">
                                    <Button variant="ghost" size="sm" onClick={() => setShowQuestionForm(false)}>{t.common.cancel}</Button>
                                    <Button size="sm" type="submit">{t.common.save}</Button>
                                </div>
                            </form>
                        </div>
                    )}

                    <div className="space-y-2">
                        {questions.map((q, idx) => (
                            <div key={q.id} className="admin-card p-3 flex items-start justify-between gap-2">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-xs font-bold text-accent-1">#{idx + 1}</span>
                                        <Badge variant={q.difficulty === 'easy' ? 'success' : q.difficulty === 'hard' ? 'danger' : 'warning'}>{q.difficulty}</Badge>
                                    </div>
                                    <p className="text-sm text-foreground line-clamp-2">{q.question_text}</p>
                                </div>
                                <button onClick={() => deleteQuestion(q.id)} className="p-1 text-foreground/30 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
                            </div>
                        ))}
                    </div>
                </motion.div>
            )}
        </motion.div>
    );
}
