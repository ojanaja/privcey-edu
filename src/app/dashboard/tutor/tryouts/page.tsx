'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/auth-store';
import { Button, Badge, LoadingSpinner } from '@/components/ui';
import { useTranslation } from '@/lib/i18n';
import { FileText, Plus, Trash2, Eye, EyeOff, BookOpen, BarChart2, X } from 'lucide-react';
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

    const [showAnalysis, setShowAnalysis] = useState(false);
    const [analysisLoading, setAnalysisLoading] = useState(false);
    const [analysisStats, setAnalysisStats] = useState<any[]>([]);

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

    const fetchAnalysis = async (tryoutId: string) => {
        setAnalysisLoading(true);
        setShowAnalysis(true);
        setSelectedTryout(tryoutId); 

        const supabase = createClient();

        try {
            const { data: qData } = await supabase
                .from('questions')
                .select('id, question_text, correct_answer, difficulty, order_number')
                .eq('tryout_id', tryoutId)
                .order('order_number');

            if (!qData || qData.length === 0) {
                setAnalysisStats([]);
                setAnalysisLoading(false);
                return;
            }

            const qIds = qData.map(q => q.id);
            const { data: aData } = await supabase
                .from('student_answers')
                .select('question_id, selected_answer, is_correct')
                .in('question_id', qIds);

            const stats = qData.map(q => {
                const answers = aData?.filter(a => a.question_id === q.id) || [];
                const total = answers.length;
                const correct = answers.filter(a => a.is_correct).length;
                const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;

                const distribution = { A: 0, B: 0, C: 0, D: 0, E: 0 };
                answers.forEach(a => {
                    const ans = a.selected_answer as keyof typeof distribution;
                    if (ans && distribution[ans] !== undefined) distribution[ans]++;
                });

                return {
                    ...q,
                    total,
                    correct,
                    accuracy,
                    distribution,
                    errorRate: 100 - accuracy
                };
            }).sort((a, b) => b.errorRate - a.errorRate); 

            setAnalysisStats(stats);
        } catch (error) {
            console.error('Error fetching analysis:', error);
        } finally {
            setAnalysisLoading(false);
        }
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
                                <button
                                    onClick={(e) => { e.stopPropagation(); fetchAnalysis(tryout.id); }}
                                    className="p-1 mr-2 text-foreground/30 hover:text-accent-1"
                                    title="Analisis Butir Soal"
                                >
                                    <BarChart2 className="w-4 h-4" />
                                </button>
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

            {showAnalysis && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-background border border-white/10 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
                        <div className="p-4 border-b border-white/10 flex justify-between items-center bg-card">
                            <h2 className="text-lg font-bold flex items-center gap-2 text-foreground">
                                <BarChart2 className="w-5 h-5 text-accent-1" />
                                Analisis Butir Soal
                            </h2>
                            <button onClick={() => setShowAnalysis(false)} className="p-1 hover:bg-white/5 rounded-full text-foreground/50 hover:text-foreground"><X className="w-5 h-5" /></button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 bg-card/50">
                            {analysisLoading ? <LoadingSpinner /> : (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="admin-card p-4 bg-red-500/10 border-red-500/20">
                                            <h3 className="text-xs font-semibold text-red-400 mb-1">Soal Tersulit</h3>
                                            <p className="text-2xl font-bold text-foreground">#{analysisStats[0]?.order_number || '-'}</p>
                                            <p className="text-xs text-foreground/50">Akurasi: {analysisStats[0]?.accuracy || 0}%</p>
                                        </div>
                                        <div className="admin-card p-4 bg-green-500/10 border-green-500/20">
                                            <h3 className="text-xs font-semibold text-green-400 mb-1">Soal Termudah</h3>
                                            <p className="text-2xl font-bold text-foreground">#{analysisStats[analysisStats.length - 1]?.order_number || '-'}</p>
                                            <p className="text-xs text-foreground/50">Akurasi: {analysisStats[analysisStats.length - 1]?.accuracy || 0}%</p>
                                        </div>
                                        <div className="admin-card p-4">
                                            <h3 className="text-xs font-semibold text-accent-1 mb-1">Total Responden</h3>
                                            <p className="text-2xl font-bold text-foreground">{analysisStats[0]?.total || 0}</p>
                                            <p className="text-xs text-foreground/50">Siswa</p>
                                        </div>
                                    </div>

                                    <div className="admin-card overflow-hidden">
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm">
                                                <thead className="bg-white/5">
                                                    <tr>
                                                        <th className="px-4 py-3 text-left font-medium text-foreground/70">No</th>
                                                        <th className="px-4 py-3 text-left font-medium text-foreground/70">Soal</th>
                                                        <th className="px-4 py-3 text-center font-medium text-foreground/70">Tingkat Kesulitan</th>
                                                        <th className="px-4 py-3 text-center font-medium text-foreground/70">Akurasi</th>
                                                        <th className="px-4 py-3 text-left font-medium text-foreground/70" style={{ minWidth: '200px' }}>Distribusi Jawaban</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-white/5">
                                                    {analysisStats.map((stat) => (
                                                        <tr key={stat.id} className="hover:bg-white/5 transition-colors">
                                                            <td className="px-4 py-3 font-medium text-foreground">#{stat.order_number}</td>
                                                            <td className="px-4 py-3 max-w-xs text-foreground/70 text-xs">
                                                                <p className="line-clamp-2" title={stat.question_text}>{stat.question_text}</p>
                                                            </td>
                                                            <td className="px-4 py-3 text-center">
                                                                <Badge variant={stat.difficulty === 'hard' ? 'danger' : stat.difficulty === 'easy' ? 'success' : 'warning'}>
                                                                    {stat.difficulty}
                                                                </Badge>
                                                            </td>
                                                            <td className="px-4 py-3 text-center font-bold text-accent-1">{stat.accuracy}%</td>
                                                            <td className="px-4 py-3">
                                                                <div className="flex items-end gap-1 h-12 pt-2">
                                                                    {['A', 'B', 'C', 'D', 'E'].map(opt => {
                                                                        const count = stat.distribution?.[opt] || 0;
                                                                        const height = stat.total > 0 ? (count / stat.total) * 100 : 0;
                                                                        const isCorrect = stat.correct_answer === opt;
                                                                        return (
                                                                            <div key={opt} className="flex-1 flex flex-col justify-end items-center gap-1 group relative h-full" title={`${opt}: ${count} siswa (${Math.round(height)}%)`}>
                                                                                <div
                                                                                    className={`w-full rounded-t-sm transition-all min-h-[4px] ${isCorrect ? 'bg-green-500' : 'bg-white/10 group-hover:bg-red-400/50'}`}
                                                                                    style={{ height: `${height}%` }}
                                                                                />
                                                                                <span className={`text-[9px] ${isCorrect ? 'text-green-400 font-bold' : 'text-foreground/30'}`}>{opt}</span>
                                                                            </div>
                                                                        )
                                                                    })}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}

        </motion.div>
    );
}
