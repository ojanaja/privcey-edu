'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth-store';
import { getInitials } from '@/lib/utils';
import {
    LayoutDashboard,
    BookOpen,
    FileText,
    Video,
    Radio,
    BarChart3,
    Trophy,
    Zap,
    Calendar,
    LogOut,
    Menu,
    X,
    GraduationCap,
    UserCog,
} from 'lucide-react';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { ThemeToggle } from '@/components/theme-toggle';

const studentNavItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/dashboard/tryout', label: 'Try Out', icon: FileText },
    { href: '/dashboard/latsol', label: 'Latihan Soal', icon: BookOpen },
    { href: '/dashboard/emod', label: 'E-Modul', icon: BookOpen },
    { href: '/dashboard/vod', label: 'Video Belajar', icon: Video },
    { href: '/dashboard/live', label: 'Live Class', icon: Radio },
    { href: '/dashboard/scores', label: 'Nilai Saya', icon: BarChart3 },
    { href: '/dashboard/leaderboard', label: 'Leaderboard', icon: Trophy },
    { href: '/dashboard/strengthens', label: 'STRENGTHENS', icon: Zap },
];

const adminNavItems = [
    { href: '/dashboard/admin', label: 'Overview', icon: LayoutDashboard },
    { href: '/dashboard/admin/users', label: 'Pengguna', icon: UserCog },
    { href: '/dashboard/admin/students', label: 'Siswa', icon: GraduationCap },
    { href: '/dashboard/admin/tryouts', label: 'Try Out', icon: FileText },
    { href: '/dashboard/admin/questions', label: 'Bank Soal', icon: BookOpen },
    { href: '/dashboard/admin/content', label: 'Konten', icon: Video },
    { href: '/dashboard/admin/attendance', label: 'Kehadiran', icon: Calendar },
    { href: '/dashboard/admin/announcements', label: 'Pengumuman', icon: Menu },
    { href: '/dashboard/admin/analytics', label: 'Analitik', icon: BarChart3 },
];

const tutorNavItems = [
    { href: '/dashboard/tutor', label: 'Overview', icon: LayoutDashboard },
    { href: '/dashboard/tutor/tryouts', label: 'Try Out', icon: FileText },
    { href: '/dashboard/tutor/questions', label: 'Bank Soal', icon: BookOpen },
    { href: '/dashboard/tutor/scores', label: 'Nilai Siswa', icon: BarChart3 },
    { href: '/dashboard/tutor/attendance', label: 'Kehadiran', icon: Calendar },
];

export function Sidebar() {
    const pathname = usePathname();
    const { user } = useAuthStore();
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const router = useRouter();

    const navItems =
        user?.role === 'admin'
            ? adminNavItems
            : user?.role === 'tutor'
                ? tutorNavItems
                : studentNavItems;

    const handleLogout = async () => {
        const supabase = createClient();
        const isStaff = user?.role === 'admin' || user?.role === 'tutor';
        await supabase.auth.signOut();
        router.push(isStaff ? '/auth/staff-login' : '/auth/login');
    };

    const NavContent = () => (
        <div className="flex flex-col h-full">
            {/* Logo */}
            <div className="px-6 py-6 border-b border-foreground/5">
                <Link href="/dashboard" className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-accent-1 flex items-center justify-center">
                        <GraduationCap className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold text-accent-1">Privcey Edu</h1>
                        <p className="text-[10px] text-foreground/30 uppercase tracking-widest">
                            {user?.role === 'admin' ? 'Admin Panel' : user?.role === 'tutor' ? 'Tutor Panel' : 'Student Portal'}
                        </p>
                    </div>
                </Link>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
                {navItems.map((item) => {
                    const isActive = pathname === item.href ||
                        (item.href !== '/dashboard' && item.href !== '/dashboard/admin' && item.href !== '/dashboard/tutor' && pathname.startsWith(item.href));
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setIsMobileOpen(false)}
                            className={cn(
                                'flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-all relative',
                                isActive
                                    ? 'text-accent-1 bg-accent-1/10 font-medium'
                                    : 'text-foreground/50 hover:text-foreground/80 hover:bg-foreground/[0.03]'
                            )}
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="activeTab"
                                    className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full bg-accent-1"
                                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                                />
                            )}
                            <Icon className="w-4.5 h-4.5" />
                            <span>{item.label}</span>
                        </Link>
                    );
                })}
            </nav>

            {/* User Info */}
            <div className="px-4 py-4 border-t border-foreground/5">
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 rounded-xl bg-accent-1/15 flex items-center justify-center text-accent-1 text-sm font-bold">
                        {user ? getInitials(user.full_name) : '..'}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                            {user?.full_name || 'Loading...'}
                        </p>
                        <p className="text-[11px] text-foreground/30 truncate">{user?.email}</p>
                    </div>
                    <ThemeToggle />
                </div>
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-foreground/40 hover:text-red-500 hover:bg-red-500/10 transition-all"
                >
                    <LogOut className="w-4 h-4" />
                    Keluar
                </button>
            </div>
        </div>
    );

    return (
        <>
            {/* Mobile toggle button */}
            <button
                onClick={() => setIsMobileOpen(!isMobileOpen)}
                className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-xl glass"
            >
                {isMobileOpen ? <X className="w-5 h-5 text-foreground" /> : <Menu className="w-5 h-5 text-foreground" />}
            </button>

            {/* Mobile overlay */}
            {isMobileOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
                    onClick={() => setIsMobileOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={cn(
                    'fixed lg:static top-0 left-0 z-40 h-screen w-64 glass-sidebar transition-transform duration-300',
                    isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
                )}
            >
                <NavContent />
            </aside>
        </>
    );
}
