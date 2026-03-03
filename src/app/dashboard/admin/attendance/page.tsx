'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { Button, Badge, LoadingSpinner } from '@/components/ui';
import { Calendar, Download, Search, Clock, Video, BookOpen, FileText } from 'lucide-react';
import type { AttendanceLog } from '@/types/database';
import { formatDateTime, formatDate } from '@/lib/utils';

export default function AdminAttendancePage() {
    const [logs, setLogs] = useState<AttendanceLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all');

    useEffect(() => {
        const supabase = createClient();

        const fetchLogs = async () => {
            const { data } = await supabase
                .from('attendance_logs')
                .select('*, student:profiles(full_name, email)')
                .order('timestamp', { ascending: false })
                .limit(200);

            if (data) setLogs(data);
            setIsLoading(false);
        };

        fetchLogs();
    }, []);

    const activityLabels: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
        vod_watch: { label: 'Video', icon: <Video className="w-3.5 h-3.5" />, color: 'info' },
        live_class: { label: 'Live Class', icon: <Clock className="w-3.5 h-3.5" />, color: 'success' },
        tryout: { label: 'Try Out', icon: <FileText className="w-3.5 h-3.5" />, color: 'warning' },
        emod_access: { label: 'E-Modul', icon: <BookOpen className="w-3.5 h-3.5" />, color: 'default' },
    };

    const exportCSV = () => {
        const headers = ['Nama Siswa', 'Email', 'Aktivitas', 'Judul', 'Waktu'];
        const rows = filteredLogs.map((log) => [
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
        a.download = `kehadiran-${formatDate(new Date().toISOString())}.csv`;
        a.click();
    };

    const filteredLogs = logs.filter((log) => {
        const matchSearch =
            (log.student as any)?.full_name?.toLowerCase()?.includes(searchTerm.toLowerCase()) ||
            log.activity_title?.toLowerCase()?.includes(searchTerm.toLowerCase());
        const matchType = filterType === 'all' || log.activity_type === filterType;
        return matchSearch && matchType;
    });

    if (isLoading) return <LoadingSpinner className="min-h-[50vh]" />;

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
                        <Calendar className="w-6 h-6 text-accent-1" />
                        Kehadiran (Silent Attendance)
                    </h1>
                    <p className="text-foreground/40 text-sm mt-1">
                        {logs.length} catatan aktivitas — direkam otomatis
                    </p>
                </div>
                <Button variant="outline" size="sm" onClick={exportCSV}>
                    <Download className="w-4 h-4" />
                    Export CSV
                </Button>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3 mb-6">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/30" />
                    <input
                        type="text"
                        placeholder="Cari nama siswa atau aktivitas..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="admin-input w-full pl-10 pr-4 py-2 text-sm"
                    />
                </div>
                <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="admin-input px-3 py-2 text-sm"
                >
                    <option value="all">Semua Aktivitas</option>
                    <option value="vod_watch">Video</option>
                    <option value="live_class">Live Class</option>
                    <option value="tryout">Try Out</option>
                    <option value="emod_access">E-Modul</option>
                </select>
            </div>

            {/* Table */}
            <div className="admin-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full admin-table">
                        <thead>
                            <tr>
                                <th className="px-4 py-3 text-left">Siswa</th>
                                <th className="px-4 py-3 text-left">Aktivitas</th>
                                <th className="px-4 py-3 text-left">Judul</th>
                                <th className="px-4 py-3 text-left">Waktu</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredLogs.map((log) => {
                                const activity = activityLabels[log.activity_type];
                                return (
                                    <tr key={log.id}>
                                        <td className="px-4 py-3 text-sm text-foreground font-medium">
                                            {(log.student as any)?.full_name || '-'}
                                        </td>
                                        <td className="px-4 py-3">
                                            <Badge variant={activity?.color as any || 'default'}>
                                                {activity?.icon}
                                                <span className="ml-1">{activity?.label}</span>
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-foreground/50">
                                            {log.activity_title || '-'}
                                        </td>
                                        <td className="px-4 py-3 text-xs text-foreground/40">
                                            {formatDateTime(log.timestamp)}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                {filteredLogs.length === 0 && (
                    <div className="text-center py-12 text-foreground/30 text-sm">
                        Tidak ada data kehadiran
                    </div>
                )}
            </div>
        </motion.div>
    );
}
