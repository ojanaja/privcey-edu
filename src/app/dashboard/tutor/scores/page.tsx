'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/auth-store';
import { LoadingSpinner, Badge } from '@/components/ui';
import { BarChart3, Search } from 'lucide-react';

export default function TutorScoresPage() {
    const { user } = useAuthStore();
    const [attempts, setAttempts] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (!user) return;
        const supabase = createClient();

        const fetch = async () => {
            const { data: tryouts } = await supabase
                .from('tryouts')
                .select('id')
                .eq('created_by', user.id);

            const tryoutIds = tryouts?.map((t) => t.id) || [];

            if (tryoutIds.length > 0) {
                const { data } = await supabase
                    .from('tryout_attempts')
                    .select('*, student:profiles(full_name, email), tryout:tryouts(title, passing_grade)')
                    .in('tryout_id', tryoutIds)
                    .eq('is_submitted', true)
                    .order('finished_at', { ascending: false });

                if (data) setAttempts(data);
            }

            setIsLoading(false);
        };

        fetch();
    }, [user]);

    const filteredAttempts = attempts.filter(
        (a) =>
            a.student?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            a.tryout?.title?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (isLoading) return <LoadingSpinner className="min-h-[50vh]" />;

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
                    <BarChart3 className="w-6 h-6 text-accent-1" />
                    Nilai Siswa
                </h1>
                <p className="text-foreground/40 text-sm mt-1">{attempts.length} pengerjaan</p>
            </div>

            <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/30" />
                <input
                    type="text"
                    placeholder="Cari nama siswa atau try out..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="admin-input w-full pl-10 pr-4 py-2 text-sm max-w-md"
                />
            </div>

            <div className="admin-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full admin-table">
                        <thead>
                            <tr>
                                <th className="px-4 py-3 text-left">Siswa</th>
                                <th className="px-4 py-3 text-left">Try Out</th>
                                <th className="px-4 py-3 text-center">Skor</th>
                                <th className="px-4 py-3 text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredAttempts.map((a) => {
                                const passed = (a.score || 0) >= (a.tryout?.passing_grade || 70);
                                return (
                                    <tr key={a.id}>
                                        <td className="px-4 py-3 text-sm text-foreground font-medium">{a.student?.full_name}</td>
                                        <td className="px-4 py-3 text-sm text-foreground/50">{a.tryout?.title}</td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`font-bold ${passed ? 'text-green-400' : 'text-red-400'}`}>
                                                {a.score ?? '-'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <Badge variant={passed ? 'success' : 'danger'}>
                                                {passed ? 'Lulus' : 'Belum Lulus'}
                                            </Badge>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                {filteredAttempts.length === 0 && (
                    <div className="text-center py-12 text-foreground/30 text-sm">Tidak ada data</div>
                )}
            </div>
        </motion.div>
    );
}
