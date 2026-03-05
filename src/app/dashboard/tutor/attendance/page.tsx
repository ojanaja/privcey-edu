'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { Badge, LoadingSpinner } from '@/components/ui';
import { Calendar, Search, Video, BookOpen, FileText, Clock, Download } from 'lucide-react';
import { formatDateTime } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';

export default function TutorAttendancePage() {
    const { t } = useTranslation();
    const [logs, setLogs] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const supabase = createClient();

        const fetchLogs = async () => {
            const { data } = await supabase
                .from('attendance_logs')
                .select('*, student:profiles(full_name, email)')
                .order('timestamp', { ascending: false })
                .limit(100);

            if (data) setLogs(data);
            setIsLoading(false);
        };

        fetchLogs();
    }, []);

    const activityLabels: Record<string, { label: string; icon: React.ReactNode }> = {
        vod_watch: { label: 'Video', icon: <Video className="w-3.5 h-3.5" /> },
        live_class: { label: 'Live Class', icon: <Clock className="w-3.5 h-3.5" /> },
        tryout: { label: 'Try Out', icon: <FileText className="w-3.5 h-3.5" /> },
        emod_access: { label: 'E-Modul', icon: <BookOpen className="w-3.5 h-3.5" /> },
    };

    const exportCSV = () => {
        const headers = [t.adminAttendance.csvHeaders.studentName, t.adminAttendance.csvHeaders.email, t.adminAttendance.csvHeaders.activity, t.adminAttendance.csvHeaders.title, t.adminAttendance.csvHeaders.time];
        const rows = filtered.map((log) => [
            log.student?.full_name || '-',
            log.student?.email || '-',
            activityLabels[log.activity_type]?.label || log.activity_type,
            log.activity_title || '-',
            formatDateTime(log.timestamp),
        ]);

        const csv = [headers.join(','), ...rows.map((r) => r.map((c) => `"${c}"`).join(','))].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `kehadiran-tutor-${formatDateTime(new Date().toISOString())}.csv`;
        a.click();
    };

    const filtered = logs.filter(
        (l) =>
            l.student?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            l.activity_title?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (isLoading) return <LoadingSpinner className="min-h-[50vh]" />;

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
                    <Calendar className="w-6 h-6 text-accent-1" />
                    {t.tutorAttendance.title}
                </h1>
                <p className="text-foreground/40 text-sm mt-1">{t.tutorAttendance.subtitle}</p>
            </div>

            <div className="mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="relative w-full md:max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/30" />
                    <input
                        type="text"
                        placeholder={t.tutorAttendance.searchPlaceholder}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="admin-input w-full pl-10 pr-4 py-2 text-sm"
                    />
                </div>
                <button
                    onClick={exportCSV}
                    className="admin-button-secondary w-full md:w-auto px-4 py-2 flex items-center justify-center gap-2"
                >
                    <Download className="w-4 h-4" />
                    {t.common.exportCsv}
                </button>
            </div>

            <div className="admin-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full admin-table">
                        <thead>
                            <tr>
                                <th className="px-4 py-3 text-left">{t.common.student}</th>
                                <th className="px-4 py-3 text-left">{t.common.status}</th>
                                <th className="px-4 py-3 text-left">{t.common.title}</th>
                                <th className="px-4 py-3 text-left">{t.common.duration}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((log) => (
                                <tr key={log.id}>
                                    <td className="px-4 py-3 text-sm text-foreground font-medium">{log.student?.full_name}</td>
                                    <td className="px-4 py-3">
                                        <Badge>{activityLabels[log.activity_type]?.icon} <span className="ml-1">{activityLabels[log.activity_type]?.label}</span></Badge>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-foreground/50">{log.activity_title || '-'}</td>
                                    <td className="px-4 py-3 text-xs text-foreground/40">{formatDateTime(log.timestamp)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {filtered.length === 0 && (
                    <div className="text-center py-12 text-foreground/30 text-sm">{t.tutorAttendance.noData}</div>
                )}
            </div>
        </motion.div>
    );
}
