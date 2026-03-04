'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { GlassCard, LoadingSpinner, Badge } from '@/components/ui';
import { BarChart3, TrendingUp, Users, FileText, Target } from 'lucide-react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    LineChart,
    Line,
    PieChart,
    Pie,
    Cell,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    Radar,
} from 'recharts';
import { useTranslation } from '@/lib/i18n';

export default function AdminAnalyticsPage() {
    const { t } = useTranslation();
    const [isLoading, setIsLoading] = useState(true);
    const [subjectStats, setSubjectStats] = useState<any[]>([]);
    const [difficultyStats, setDifficultyStats] = useState<any[]>([]);
    const [monthlyAttempts, setMonthlyAttempts] = useState<any[]>([]);
    const [topStudents, setTopStudents] = useState<any[]>([]);
    const [hardestQuestions, setHardestQuestions] = useState<any[]>([]);

    useEffect(() => {
        const supabase = createClient();

        const fetchAnalytics = async () => {
            const { data: attempts } = await supabase
                .from('tryout_attempts')
                .select('score, finished_at, tryout:tryouts(subject:subjects(name))')
                .eq('is_submitted', true);

            if (attempts) {
                const subjectMap = new Map<string, number[]>();
                attempts.forEach((a: any) => {
                    const name = a.tryout?.subject?.name || 'Unknown';
                    if (!subjectMap.has(name)) subjectMap.set(name, []);
                    subjectMap.get(name)!.push(a.score || 0);
                });

                setSubjectStats(
                    Array.from(subjectMap.entries()).map(([name, scores]) => ({
                        subject: name,
                        avg: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
                        count: scores.length,
                    }))
                );
            }

            const { data: answers } = await supabase
                .from('student_answers')
                .select('is_correct, question:questions(difficulty)')
                .not('is_correct', 'is', null);

            if (answers) {
                const diffMap = new Map<string, { correct: number; total: number }>();
                answers.forEach((a: any) => {
                    const diff = a.question?.difficulty || 'medium';
                    if (!diffMap.has(diff)) diffMap.set(diff, { correct: 0, total: 0 });
                    const entry = diffMap.get(diff)!;
                    entry.total++;
                    if (a.is_correct) entry.correct++;
                });

                setDifficultyStats(
                    ['easy', 'medium', 'hard'].map((d) => {
                        const entry = diffMap.get(d) || { correct: 0, total: 0 };
                        return {
                            difficulty: d,
                            rate: entry.total > 0 ? Math.round((entry.correct / entry.total) * 100) : 0,
                            total: entry.total,
                        };
                    })
                );
            }

            const { data: scoreData } = await supabase
                .from('tryout_attempts')
                .select('student_id, score, student:profiles(full_name)')
                .eq('is_submitted', true)
                .not('score', 'is', null);

            if (scoreData) {
                const studentMap = new Map<string, { name: string; scores: number[] }>();
                scoreData.forEach((s: any) => {
                    if (!studentMap.has(s.student_id)) {
                        studentMap.set(s.student_id, { name: s.student?.full_name || 'Unknown', scores: [] });
                    }
                    studentMap.get(s.student_id)!.scores.push(s.score);
                });

                const sorted = Array.from(studentMap.entries())
                    .map(([, data]) => ({
                        name: data.name,
                        avg: Math.round(data.scores.reduce((a, b) => a + b, 0) / data.scores.length),
                        attempts: data.scores.length,
                    }))
                    .sort((a, b) => b.avg - a.avg)
                    .slice(0, 10);

                setTopStudents(sorted);
            }

            const { data: allAnswers } = await supabase
                .from('student_answers')
                .select('question_id, is_correct, question:questions(question_text, difficulty, tryout:tryouts(subject:subjects(name)))')
                .not('is_correct', 'is', null);

            if (allAnswers) {
                const questionMap = new Map<string, { text: string; subject: string; difficulty: string; correct: number; total: number }>();
                allAnswers.forEach((a: any) => {
                    const qid = a.question_id;
                    if (!questionMap.has(qid)) {
                        questionMap.set(qid, {
                            text: a.question?.question_text || '—',
                            subject: a.question?.tryout?.subject?.name || '—',
                            difficulty: a.question?.difficulty || 'medium',
                            correct: 0,
                            total: 0,
                        });
                    }
                    const entry = questionMap.get(qid)!;
                    entry.total++;
                    if (a.is_correct) entry.correct++;
                });

                const hardest = Array.from(questionMap.entries())
                    .filter(([, d]) => d.total >= 5)
                    .map(([id, d]) => ({
                        id,
                        text: d.text.length > 80 ? d.text.slice(0, 80) + '…' : d.text,
                        subject: d.subject,
                        difficulty: d.difficulty,
                        errorRate: Math.round(((d.total - d.correct) / d.total) * 100),
                        total: d.total,
                    }))
                    .sort((a, b) => b.errorRate - a.errorRate)
                    .slice(0, 10);

                setHardestQuestions(hardest);
            }

            setIsLoading(false);
        };

        fetchAnalytics();
    }, []);

    if (isLoading) return <LoadingSpinner className="min-h-[50vh]" />;

    const COLORS = ['#22c55e', '#eab308', '#ef4444'];

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
                    <BarChart3 className="w-6 h-6 text-accent-1" />
                    {t.adminAnalytics.title}
                </h1>
                <p className="text-foreground/40 text-sm mt-1">{t.adminAnalytics.subtitle}</p>
            </div>

            <div className="grid lg:grid-cols-2 gap-6 mb-6">
                <div className="admin-card p-6">
                    <h2 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
                        <Target className="w-4 h-4 text-accent-1" />
                        {t.adminAnalytics.avgPerSubject}
                    </h2>
                    {subjectStats.length > 0 ? (
                        <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={subjectStats}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--card-border)" />
                                <XAxis dataKey="subject" stroke="var(--card-border)" tick={{ fill: 'var(--foreground)', fontSize: 11 }} />
                                <YAxis domain={[0, 100]} stroke="var(--card-border)" tick={{ fill: 'var(--foreground)', fontSize: 11 }} />
                                <Tooltip
                                    contentStyle={{ background: 'var(--tooltip-bg)', border: '1px solid var(--tooltip-border)', borderRadius: '8px', color: 'var(--tooltip-color)', fontSize: '12px' }}
                                />
                                <Bar dataKey="avg" fill="#6366f1" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-62.5 flex items-center justify-center text-foreground/30 text-sm">{t.common.noData}</div>
                    )}
                </div>

                <div className="admin-card p-6">
                    <h2 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-accent-1" />
                        {t.adminAnalytics.correctnessRate}
                    </h2>
                    {difficultyStats.length > 0 ? (
                        <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={difficultyStats}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--card-border)" />
                                <XAxis dataKey="difficulty" stroke="var(--card-border)" tick={{ fill: 'var(--foreground)', fontSize: 11 }} tickFormatter={(val) => ({ easy: t.adminAnalytics.easy, medium: t.adminAnalytics.medium, hard: t.adminAnalytics.hard }[val as string] || val)} />
                                <YAxis domain={[0, 100]} stroke="var(--card-border)" tick={{ fill: 'var(--foreground)', fontSize: 11 }} />
                                <Tooltip
                                    contentStyle={{ background: 'var(--tooltip-bg)', border: '1px solid var(--tooltip-border)', borderRadius: '8px', color: 'var(--tooltip-color)', fontSize: '12px' }}
                                />
                                <Bar dataKey="rate" radius={[4, 4, 0, 0]}>
                                    {difficultyStats.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-62.5 flex items-center justify-center text-foreground/30 text-sm">{t.common.noData}</div>
                    )}
                </div>
            </div>

            <div className="admin-card p-6 mb-6">
                <h2 className="text-base font-semibold text-foreground mb-1 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-accent-1" />
                    {t.adminAnalytics.hardestQuestions}
                </h2>
                <p className="text-xs text-foreground/30 mb-4">{t.adminAnalytics.hardestQuestionsDesc}</p>
                {hardestQuestions.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full admin-table">
                            <thead>
                                <tr>
                                    <th className="px-4 py-3 text-left">{t.adminAnalytics.rank}</th>
                                    <th className="px-4 py-3 text-left">{t.adminAnalytics.questionText}</th>
                                    <th className="px-4 py-3 text-center">{t.adminAnalytics.subject}</th>
                                    <th className="px-4 py-3 text-center">{t.adminAnalytics.difficulty}</th>
                                    <th className="px-4 py-3 text-center">{t.adminAnalytics.errorRate}</th>
                                    <th className="px-4 py-3 text-center">{t.adminAnalytics.totalAnswered}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {hardestQuestions.map((q: any, idx: number) => (
                                    <tr key={q.id}>
                                        <td className="px-4 py-3 text-sm text-foreground/50 font-bold">#{idx + 1}</td>
                                        <td className="px-4 py-3 text-sm text-foreground max-w-xs truncate">{q.text}</td>
                                        <td className="px-4 py-3 text-center">
                                            <Badge variant="info">{q.subject}</Badge>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <Badge variant={q.difficulty === 'hard' ? 'danger' : q.difficulty === 'easy' ? 'success' : 'warning'}>
                                                {({ easy: t.adminAnalytics.easy, medium: t.adminAnalytics.medium, hard: t.adminAnalytics.hard })[q.difficulty as string] || q.difficulty}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`font-bold ${q.errorRate >= 70 ? 'text-red-400' : q.errorRate >= 40 ? 'text-yellow-400' : 'text-green-400'}`}>
                                                {q.errorRate}%
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-foreground/50 text-center">{q.total}x</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="text-center py-12 text-foreground/30 text-sm">{t.common.noData}</div>
                )}
            </div>

            <div className="admin-card p-6">
                <h2 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Users className="w-4 h-4 text-accent-1" />
                    {t.adminAnalytics.topStudents}
                </h2>
                {topStudents.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full admin-table">
                            <thead>
                                <tr>
                                    <th className="px-4 py-3 text-left">{t.adminAnalytics.rank}</th>
                                    <th className="px-4 py-3 text-left">{t.common.name}</th>
                                    <th className="px-4 py-3 text-center">{t.common.average}</th>
                                    <th className="px-4 py-3 text-center">{t.nav.tryout}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {topStudents.map((student, idx) => (
                                    <tr key={idx}>
                                        <td className="px-4 py-3 text-sm text-foreground/50 font-bold">
                                            {idx < 3 ? ['🥇', '🥈', '🥉'][idx] : `#${idx + 1}`}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-foreground font-medium">{student.name}</td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`font-bold ${student.avg >= 80 ? 'text-green-400' : student.avg >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
                                                {student.avg}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-foreground/50 text-center">{student.attempts}x</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="text-center py-12 text-foreground/30 text-sm">{t.common.noData}</div>
                )}
            </div>
        </motion.div>
    );
}
