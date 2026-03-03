'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { GlassCard, StatCard, Badge } from '@/components/ui';
import {
    Users,
    FileText,
    BookOpen,
    DollarSign,
    TrendingUp,
    AlertCircle,
    CheckCircle2,
    Clock,
} from 'lucide-react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
} from 'recharts';

export default function AdminDashboard() {
    const [stats, setStats] = useState({
        totalStudents: 0,
        activeStudents: 0,
        expiredPayments: 0,
        totalTryouts: 0,
        avgClassScore: 0,
    });
    const [classDistribution, setClassDistribution] = useState<any[]>([]);
    const [paymentStatus, setPaymentStatus] = useState<any[]>([]);

    useEffect(() => {
        const supabase = createClient();

        const fetchStats = async () => {
            const { count: totalStudents } = await supabase
                .from('profiles')
                .select('*', { count: 'exact', head: true })
                .eq('role', 'student');

            const { count: activeStudents } = await supabase
                .from('profiles')
                .select('*', { count: 'exact', head: true })
                .eq('role', 'student')
                .eq('payment_status', 'active');

            const { count: expiredPayments } = await supabase
                .from('profiles')
                .select('*', { count: 'exact', head: true })
                .eq('role', 'student')
                .eq('payment_status', 'expired');

            const { count: totalTryouts } = await supabase
                .from('tryouts')
                .select('*', { count: 'exact', head: true });

            setStats({
                totalStudents: totalStudents || 0,
                activeStudents: activeStudents || 0,
                expiredPayments: expiredPayments || 0,
                totalTryouts: totalTryouts || 0,
                avgClassScore: 0,
            });

            const { data: classes } = await supabase
                .from('class_groups')
                .select('name, id');

            if (classes) {
                const dist = await Promise.all(
                    classes.map(async (cls) => {
                        const { count } = await supabase
                            .from('profiles')
                            .select('*', { count: 'exact', head: true })
                            .eq('class_id', cls.id)
                            .eq('role', 'student');
                        return { name: cls.name, students: count || 0 };
                    })
                );
                setClassDistribution(dist);
            }

            setPaymentStatus([
                { name: 'Aktif', value: activeStudents || 0, color: '#22c55e' },
                { name: 'Expired', value: expiredPayments || 0, color: '#ef4444' },
                { name: 'Pending', value: (totalStudents || 0) - (activeStudents || 0) - (expiredPayments || 0), color: '#eab308' },
            ]);
        };

        fetchStats();
    }, []);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
        >
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
                <p className="text-foreground/40 text-sm mt-1">Overview operasional Privcey Edu</p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <StatCard
                    label="Total Siswa"
                    value={stats.totalStudents}
                    icon={<Users className="w-5 h-5" />}
                />
                <StatCard
                    label="Siswa Aktif"
                    value={stats.activeStudents}
                    icon={<CheckCircle2 className="w-5 h-5" />}
                    trend={stats.activeStudents > 0 ? { value: Math.round((stats.activeStudents / Math.max(stats.totalStudents, 1)) * 100), isPositive: true } : undefined}
                />
                <StatCard
                    label="Iuran Tertunggak"
                    value={stats.expiredPayments}
                    icon={<AlertCircle className="w-5 h-5" />}
                />
                <StatCard
                    label="Total Try Out"
                    value={stats.totalTryouts}
                    icon={<FileText className="w-5 h-5" />}
                />
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
                <div className="admin-card p-6">
                    <h2 className="text-lg font-semibold text-foreground mb-4">Distribusi Kelas</h2>
                    {classDistribution.length > 0 ? (
                        <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={classDistribution}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--card-border)" />
                                <XAxis
                                    dataKey="name"
                                    stroke="var(--card-border)"
                                    tick={{ fill: 'var(--foreground)', fontSize: 12 }}
                                />
                                <YAxis
                                    stroke="var(--card-border)"
                                    tick={{ fill: 'var(--foreground)', fontSize: 12 }}
                                />
                                <Tooltip
                                    contentStyle={{
                                        background: 'var(--tooltip-bg)',
                                        border: '1px solid var(--tooltip-border)',
                                        borderRadius: '8px',
                                        color: 'var(--tooltip-color)',
                                        fontSize: '12px',
                                    }}
                                />
                                <Bar dataKey="students" fill="#6366f1" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-[250px] flex items-center justify-center text-foreground/30 text-sm">
                            Belum ada data
                        </div>
                    )}
                </div>

                <div className="admin-card p-6">
                    <h2 className="text-lg font-semibold text-foreground mb-4">Status Pembayaran</h2>
                    <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                            <Pie
                                data={paymentStatus}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={100}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {paymentStatus.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{
                                    background: 'var(--tooltip-bg)',
                                    border: '1px solid var(--tooltip-border)',
                                    borderRadius: '8px',
                                    color: 'var(--tooltip-color)',
                                    fontSize: '12px',
                                }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="flex justify-center gap-4 mt-2">
                        {paymentStatus.map((status) => (
                            <div key={status.name} className="flex items-center gap-1.5 text-xs text-foreground/50">
                                <span className="w-2.5 h-2.5 rounded-full" style={{ background: status.color }} />
                                {status.name}: {status.value}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
