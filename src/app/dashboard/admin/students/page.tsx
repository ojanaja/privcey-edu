'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { Badge, Button, LoadingSpinner } from '@/components/ui';
import { Users, Search, Download, CheckCircle2, XCircle, Clock, Edit2 } from 'lucide-react';
import type { Profile, ClassGroup } from '@/types/database';
import { formatDate, cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';

const PAGE_SIZE = 25;

export default function AdminStudentsPage() {
    const { t } = useTranslation();
    const [students, setStudents] = useState<Profile[]>([]);
    const [classes, setClasses] = useState<ClassGroup[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterClass, setFilterClass] = useState('all');
    const [filterPayment, setFilterPayment] = useState('all');
    const [page, setPage] = useState(0);

    useEffect(() => {
        const supabase = createClient();

        const fetchData = async () => {
            const { data: studentData } = await supabase
                .from('profiles')
                .select('*')
                .eq('role', 'student')
                .order('full_name');

            if (studentData) setStudents(studentData);

            const { data: classData } = await supabase
                .from('class_groups')
                .select('*')
                .order('name');

            if (classData) setClasses(classData);
            setIsLoading(false);
        };

        fetchData();
    }, []);

    const togglePaymentStatus = async (studentId: string, currentStatus: string) => {
        const supabase = createClient();
        const newStatus = currentStatus === 'active' ? 'expired' : 'active';
        const expiresAt = newStatus === 'active'
            ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
            : null;

        await supabase
            .from('profiles')
            .update({ payment_status: newStatus, payment_expires_at: expiresAt })
            .eq('id', studentId);

        setStudents((prev) =>
            prev.map((s) =>
                s.id === studentId ? { ...s, payment_status: newStatus as any, payment_expires_at: expiresAt } : s
            )
        );
    };

    const exportCSV = () => {
        const headers = [t.adminStudents.csvHeaders.name, t.adminStudents.csvHeaders.email, t.adminStudents.csvHeaders.class, t.adminStudents.csvHeaders.paymentStatus, t.adminStudents.csvHeaders.registeredDate];
        const rows = filteredStudents.map((s) => [
            s.full_name,
            s.email,
            classes.find((c) => c.id === s.class_id)?.name || '-',
            s.payment_status,
            formatDate(s.created_at),
        ]);

        const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'siswa-privcey-edu.csv';
        a.click();
    };

    const filteredStudents = students.filter((s) => {
        const matchSearch =
            s.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchClass = filterClass === 'all' || s.class_id === filterClass;
        const matchPayment = filterPayment === 'all' || s.payment_status === filterPayment;
        return matchSearch && matchClass && matchPayment;
    });

    const totalFiltered = filteredStudents.length;
    const paginatedStudents = filteredStudents.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

    useEffect(() => {
        setPage(0);
    }, [searchTerm, filterClass, filterPayment]);

    if (isLoading) return <LoadingSpinner className="min-h-[50vh]" />;

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
                        <Users className="w-6 h-6 text-accent-1" />
                        {t.adminStudents.title}
                    </h1>
                    <p className="text-foreground/40 text-sm mt-1">{students.length} {t.adminStudents.subtitle}</p>
                </div>
                <Button variant="outline" size="sm" onClick={exportCSV}>
                    <Download className="w-4 h-4" />
                    {t.common.exportCsv}
                </Button>
            </div>

            <div className="flex flex-wrap gap-3 mb-6">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/30" />
                    <input
                        type="text"
                        placeholder={t.adminStudents.searchPlaceholder}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="admin-input w-full pl-10 pr-4 py-2 text-sm"
                    />
                </div>
                <select
                    value={filterClass}
                    onChange={(e) => setFilterClass(e.target.value)}
                    className="admin-input px-3 py-2 text-sm"
                >
                    <option value="all">{t.common.allClasses}</option>
                    {classes.map((cls) => (
                        <option key={cls.id} value={cls.id}>{cls.name}</option>
                    ))}
                </select>
                <select
                    value={filterPayment}
                    onChange={(e) => setFilterPayment(e.target.value)}
                    className="admin-input px-3 py-2 text-sm"
                >
                    <option value="all">{t.adminStudents.allStatus}</option>
                    <option value="active">{t.common.active}</option>
                    <option value="expired">{t.common.expired}</option>
                    <option value="pending">{t.common.pending}</option>
                </select>
            </div>

            <div className="admin-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full admin-table">
                        <thead>
                            <tr>
                                <th className="px-4 py-3 text-left">{t.common.name}</th>
                                <th className="px-4 py-3 text-left">{t.common.email}</th>
                                <th className="px-4 py-3 text-left">{t.common.class}</th>
                                <th className="px-4 py-3 text-center">{t.adminStudents.payment}</th>
                                <th className="px-4 py-3 text-center">{t.common.status}</th>
                                <th className="px-4 py-3 text-center">{t.common.actions}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedStudents.map((student) => (
                                <tr key={student.id}>
                                    <td className="px-4 py-3 text-sm text-foreground font-medium">
                                        {student.full_name}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-foreground/50">{student.email}</td>
                                    <td className="px-4 py-3 text-sm text-foreground/50">
                                        {classes.find((c) => c.id === student.class_id)?.name || '-'}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <Badge
                                            variant={
                                                student.payment_status === 'active'
                                                    ? 'success'
                                                    : student.payment_status === 'expired'
                                                        ? 'danger'
                                                        : 'warning'
                                            }
                                        >
                                            {student.payment_status === 'active' && <CheckCircle2 className="w-3 h-3 mr-1" />}
                                            {student.payment_status === 'expired' && <XCircle className="w-3 h-3 mr-1" />}
                                            {student.payment_status === 'pending' && <Clock className="w-3 h-3 mr-1" />}
                                            {student.payment_status}
                                        </Badge>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <Badge variant={student.is_active ? 'success' : 'danger'}>
                                            {student.is_active ? t.common.active : t.common.inactive}
                                        </Badge>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <button
                                            onClick={() => togglePaymentStatus(student.id, student.payment_status)}
                                            className="text-xs text-accent-1 hover:text-accent-2 transition-colors px-2 py-1 rounded hover:bg-accent-1/10"
                                        >
                                            {t.adminStudents.togglePayment}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {paginatedStudents.length === 0 && (
                    <div className="text-center py-12 text-foreground/30 text-sm">
                        {t.adminStudents.noStudents}
                    </div>
                )}

                {totalFiltered > PAGE_SIZE && (
                    <div className="flex items-center justify-between px-4 py-3 border-t border-foreground/5">
                        <p className="text-xs text-foreground/40">
                            {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, totalFiltered)} dari {totalFiltered}
                        </p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setPage((p) => Math.max(0, p - 1))}
                                disabled={page === 0}
                                className="px-3 py-1 text-xs rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 transition"
                            >
                                ← Prev
                            </button>
                            <button
                                onClick={() => setPage((p) => p + 1)}
                                disabled={(page + 1) * PAGE_SIZE >= totalFiltered}
                                className="px-3 py-1 text-xs rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 transition"
                            >
                                Next →
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </motion.div>
    );
}
