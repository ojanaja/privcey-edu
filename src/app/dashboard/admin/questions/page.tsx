'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { Button, Badge, LoadingSpinner } from '@/components/ui';
import { BookOpen, Plus, Trash2, ChevronDown, Edit2 } from 'lucide-react';
import type { TryOut, Question } from '@/types/database';
import { useTranslation } from '@/lib/i18n';

export default function AdminQuestionsPage() {
    const { t } = useTranslation();
    const [tryouts, setTryouts] = useState<TryOut[]>([]);
    const [selectedTryout, setSelectedTryout] = useState<string>('');
    const [questions, setQuestions] = useState<Question[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
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

    useEffect(() => {
        const supabase = createClient();

        const fetchTryouts = async () => {
            const { data } = await supabase
                .from('tryouts')
                .select('*, subject:subjects(*)')
                .order('created_at', { ascending: false });

            if (data) setTryouts(data);
            setIsLoading(false);
        };

        fetchTryouts();
    }, []);

    useEffect(() => {
        if (!selectedTryout) return;
        const supabase = createClient();

        const fetchQuestions = async () => {
            const { data } = await supabase
                .from('questions')
                .select('*')
                .eq('tryout_id', selectedTryout)
                .order('order_number');

            if (data) setQuestions(data);
        };

        fetchQuestions();
    }, [selectedTryout]);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedTryout) return;

        const supabase = createClient();

        if (editingId) {
            const { data } = await supabase
                .from('questions')
                .update({
                    question_text: formData.question_text,
                    option_a: formData.option_a,
                    option_b: formData.option_b,
                    option_c: formData.option_c,
                    option_d: formData.option_d,
                    option_e: formData.option_e || null,
                    correct_answer: formData.correct_answer,
                    explanation: formData.explanation || null,
                    difficulty: formData.difficulty,
                })
                .eq('id', editingId)
                .select()
                .single();

            if (data) {
                setQuestions((prev) => prev.map((q) => (q.id === editingId ? data : q)));
                resetForm();
            }
            return;
        }

        const { data, error } = await supabase
            .from('questions')
            .insert({
                ...formData,
                tryout_id: selectedTryout,
                order_number: questions.length + 1,
            })
            .select()
            .single();

        if (data) {
            setQuestions([...questions, data]);
            resetForm();
        }
    };

    const startEditQuestion = (q: Question) => {
        setEditingId(q.id);
        setFormData({
            question_text: q.question_text,
            option_a: q.option_a,
            option_b: q.option_b,
            option_c: q.option_c,
            option_d: q.option_d,
            option_e: q.option_e || '',
            correct_answer: q.correct_answer,
            explanation: q.explanation || '',
            difficulty: q.difficulty,
        });
        setShowForm(true);
    };

    const resetForm = () => {
        setShowForm(false);
        setEditingId(null);
        setFormData({
            question_text: '',
            option_a: '',
            option_b: '',
            option_c: '',
            option_d: '',
            option_e: '',
            correct_answer: 'A',
            explanation: '',
            difficulty: 'medium',
        });
    };

    const deleteQuestion = async (id: string) => {
        if (!confirm(t.adminQuestions.confirmDelete)) return;
        const supabase = createClient();
        await supabase.from('questions').delete().eq('id', id);
        setQuestions((prev) => prev.filter((q) => q.id !== id));
    };

    if (isLoading) return <LoadingSpinner className="min-h-[50vh]" />;

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
                        <BookOpen className="w-6 h-6 text-accent-1" />
                        {t.adminQuestions.title}
                    </h1>
                    <p className="text-foreground/40 text-sm mt-1">{t.adminQuestions.subtitle}</p>
                </div>
            </div>

            <div className="mb-6">
                <label className="block text-xs text-foreground/40 mb-2">{t.adminQuestions.selectTryout}</label>
                <select
                    value={selectedTryout}
                    onChange={(e) => setSelectedTryout(e.target.value)}
                    className="admin-input px-4 py-2.5 text-sm w-full max-w-md"
                >
                    <option value="">{t.adminQuestions.selectTryoutDefault}</option>
                    {tryouts.map((t) => (
                        <option key={t.id} value={t.id}>
                            {t.title} ({t.subject?.name})
                        </option>
                    ))}
                </select>
            </div>

            {selectedTryout && (
                <>
                    <div className="flex items-center justify-between mb-4">
                        <p className="text-sm text-foreground/50">{questions.length} {t.adminQuestions.questionsCount}</p>
                        <Button size="sm" onClick={() => showForm ? resetForm() : setShowForm(true)}>
                            <Plus className="w-4 h-4" />
                            {t.adminQuestions.addQuestion}
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
                                    {editingId ? t.adminQuestions.editQuestion : t.adminQuestions.newQuestion}
                                </h2>
                                <form onSubmit={handleCreate} className="space-y-4">
                                    <div>
                                        <label className="block text-xs text-foreground/40 mb-1">{t.adminQuestions.questionLabel}</label>
                                        <textarea
                                            required
                                            value={formData.question_text}
                                            onChange={(e) => setFormData({ ...formData, question_text: e.target.value })}
                                            className="admin-input w-full px-3 py-2 text-sm h-24 resize-none"
                                            placeholder={t.adminQuestions.questionPlaceholder}
                                        />
                                    </div>
                                    <div className="grid md:grid-cols-2 gap-4">
                                        {(['A', 'B', 'C', 'D', 'E'] as const).map((opt) => (
                                            <div key={opt}>
                                                <label className="block text-xs text-foreground/40 mb-1">
                                                    {t.adminQuestions.optionLabel} {opt} {opt === 'E' ? t.adminQuestions.optionOptional : ''}
                                                </label>
                                                <input
                                                    type="text"
                                                    required={opt !== 'E'}
                                                    value={formData[`option_${opt.toLowerCase()}` as keyof typeof formData] as string}
                                                    onChange={(e) =>
                                                        setFormData({ ...formData, [`option_${opt.toLowerCase()}`]: e.target.value })
                                                    }
                                                    className="admin-input w-full px-3 py-2 text-sm"
                                                    placeholder={`${t.adminQuestions.optionPlaceholder} ${opt}`}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                    <div className="grid md:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-xs text-foreground/40 mb-1">{t.adminQuestions.correctAnswer}</label>
                                            <select
                                                value={formData.correct_answer}
                                                onChange={(e) => setFormData({ ...formData, correct_answer: e.target.value as any })}
                                                className="admin-input w-full px-3 py-2 text-sm"
                                            >
                                                {['A', 'B', 'C', 'D', 'E'].map((opt) => (
                                                    <option key={opt} value={opt}>{opt}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs text-foreground/40 mb-1">{t.adminQuestions.difficulty}</label>
                                            <select
                                                value={formData.difficulty}
                                                onChange={(e) => setFormData({ ...formData, difficulty: e.target.value as any })}
                                                className="admin-input w-full px-3 py-2 text-sm"
                                            >
                                                <option value="easy">{t.adminAnalytics.easy}</option>
                                                <option value="medium">{t.adminAnalytics.medium}</option>
                                                <option value="hard">{t.adminAnalytics.hard}</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs text-foreground/40 mb-1">{t.adminQuestions.explanation}</label>
                                        <textarea
                                            value={formData.explanation}
                                            onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
                                            className="admin-input w-full px-3 py-2 text-sm h-20 resize-none"
                                            placeholder={t.adminQuestions.explanationPlaceholder}
                                        />
                                    </div>
                                    <div className="flex gap-3 justify-end">
                                        <Button variant="ghost" onClick={resetForm}>{t.common.cancel}</Button>
                                        <Button type="submit">{editingId ? t.adminQuestions.updateQuestion : t.adminQuestions.saveQuestion}</Button>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    )}

                    <div className="space-y-3">
                        {questions.map((q, idx) => (
                            <motion.div
                                key={q.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.03 }}
                                className="admin-card p-4"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-xs font-bold text-accent-1">#{idx + 1}</span>
                                            <Badge
                                                variant={q.difficulty === 'easy' ? 'success' : q.difficulty === 'hard' ? 'danger' : 'warning'}
                                            >
                                                {q.difficulty}
                                            </Badge>
                                            <Badge>{t.adminQuestions.answerLabel} {q.correct_answer}</Badge>
                                        </div>
                                        <p className="text-sm text-foreground whitespace-pre-wrap">{q.question_text}</p>
                                        <div className="mt-2 grid grid-cols-2 gap-1 text-xs text-foreground/40">
                                            <span>A. {q.option_a}</span>
                                            <span>B. {q.option_b}</span>
                                            <span>C. {q.option_c}</span>
                                            <span>D. {q.option_d}</span>
                                            {q.option_e && <span>E. {q.option_e}</span>}
                                        </div>
                                    </div>
                                    <div className="flex gap-1">
                                        <button
                                            onClick={() => startEditQuestion(q)}
                                            className="p-1.5 rounded hover:bg-foreground/5 text-foreground/30 hover:text-accent-1 transition-colors"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => deleteQuestion(q.id)}
                                            className="p-1.5 rounded hover:bg-red-500/10 text-foreground/30 hover:text-red-400 transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {questions.length === 0 && (
                        <div className="admin-card text-center py-12 text-foreground/30 text-sm">
                            {t.adminQuestions.noQuestions}
                        </div>
                    )}
                </>
            )}
        </motion.div>
    );
}
