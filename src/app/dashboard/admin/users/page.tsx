'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { Badge, Button, LoadingSpinner } from '@/components/ui';
import {
    Users,
    Search,
    Shield,
    BookOpen,
    GraduationCap,
    CheckCircle2,
    XCircle,
    ChevronDown,
    X,
    UserCog,
    Plus,
    Mail,
    Lock,
    User,
} from 'lucide-react';
import Image from 'next/image';
import type { Profile, ClassGroup } from '@/types/database';
import { formatDate, cn, getInitials } from '@/lib/utils';

interface ProfileWithClass extends Profile {
    class_groups: { name: string } | null;
}

const ROLE_CONFIG = {
    admin: { label: 'Admin', icon: Shield, color: 'danger' as const },
    tutor: { label: 'Tutor', icon: BookOpen, color: 'warning' as const },
    student: { label: 'Siswa', icon: GraduationCap, color: 'info' as const },
};

export default function AdminUsersPage() {
    const [users, setUsers] = useState<ProfileWithClass[]>([]);
    const [classes, setClasses] = useState<ClassGroup[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRole, setFilterRole] = useState('all');
    const [editingUser, setEditingUser] = useState<ProfileWithClass | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [showAddForm, setShowAddForm] = useState(false);

    const fetchUsers = useCallback(async () => {
        setIsLoading(true);
        const res = await fetch(`/api/admin/users?role=${filterRole}&search=${searchTerm}`);
        const data = await res.json();
        if (data.users) setUsers(data.users);
        setIsLoading(false);
    }, [filterRole, searchTerm]);

    useEffect(() => {
        const supabase = createClient();
        const fetchClasses = async () => {
            const { data } = await supabase
                .from('class_groups')
                .select('*')
                .order('name');
            if (data) setClasses(data);
        };
        fetchClasses();
    }, []);

    useEffect(() => {
        const debounce = setTimeout(() => {
            fetchUsers();
        }, 300);
        return () => clearTimeout(debounce);
    }, [fetchUsers]);

    const handleUpdateUser = async (updates: {
        role?: string;
        classId?: string | null;
        isActive?: boolean;
        paymentStatus?: string;
        paymentExpiresAt?: string | null;
    }) => {
        if (!editingUser) return;
        setIsSaving(true);

        const res = await fetch('/api/admin/users', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: editingUser.id, ...updates }),
        });

        if (res.ok) {
            const data = await res.json();
            setUsers((prev) =>
                prev.map((u) => (u.id === editingUser.id ? { ...u, ...data.user } : u))
            );
            setEditingUser(null);
        }
        setIsSaving(false);
    };

    const quickToggleActive = async (userId: string, currentActive: boolean) => {
        const res = await fetch('/api/admin/users', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, isActive: !currentActive }),
        });
        if (res.ok) {
            setUsers((prev) =>
                prev.map((u) => (u.id === userId ? { ...u, is_active: !currentActive } : u))
            );
        }
    };

    const quickChangeRole = async (userId: string, newRole: string) => {
        const res = await fetch('/api/admin/users', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, role: newRole }),
        });
        if (res.ok) {
            const data = await res.json();
            setUsers((prev) =>
                prev.map((u) => (u.id === userId ? { ...u, ...data.user } : u))
            );
        }
    };

    const handleCreateStaff = async (staffData: {
        email: string;
        password: string;
        fullName: string;
        role: string;
    }) => {
        setIsSaving(true);
        const res = await fetch('/api/admin/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(staffData),
        });
        const data = await res.json();
        if (res.ok && data.user) {
            setUsers((prev) => [data.user, ...prev]);
            setShowAddForm(false);
        }
        setIsSaving(false);
        return data;
    };

    const roleStats = {
        total: users.length,
        admin: users.filter((u) => u.role === 'admin').length,
        tutor: users.filter((u) => u.role === 'tutor').length,
        student: users.filter((u) => u.role === 'student').length,
    };

    if (isLoading && users.length === 0) return <LoadingSpinner className="min-h-[50vh]" />;

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
                        <UserCog className="w-6 h-6 text-accent-1" />
                        Manajemen Pengguna
                    </h1>
                    <p className="text-foreground/40 text-sm mt-1">
                        Kelola role dan akses semua pengguna platform
                    </p>
                </div>
                <Button size="sm" onClick={() => setShowAddForm(true)}>
                    <Plus className="w-4 h-4" />
                    Tambah Staff
                </Button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                {[
                    { label: 'Total', value: roleStats.total, color: 'bg-foreground/10' },
                    { label: 'Admin', value: roleStats.admin, color: 'bg-red-500/15' },
                    { label: 'Tutor', value: roleStats.tutor, color: 'bg-yellow-500/15' },
                    { label: 'Siswa', value: roleStats.student, color: 'bg-blue-500/15' },
                ].map((stat) => (
                    <div
                        key={stat.label}
                        className={cn('admin-card px-4 py-3 text-center', stat.color)}
                    >
                        <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                        <p className="text-xs text-foreground/50">{stat.label}</p>
                    </div>
                ))}
            </div>

            <div className="flex flex-wrap gap-3 mb-6">
                <div className="relative flex-1 min-w-50">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/30" />
                    <input
                        type="text"
                        placeholder="Cari nama atau email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="admin-input w-full pl-10 pr-4 py-2 text-sm"
                    />
                </div>
                <select
                    value={filterRole}
                    onChange={(e) => setFilterRole(e.target.value)}
                    className="admin-input px-3 py-2 text-sm"
                >
                    <option value="all">Semua Role</option>
                    <option value="admin">Admin</option>
                    <option value="tutor">Tutor</option>
                    <option value="student">Siswa</option>
                </select>
            </div>

            <div className="admin-card px-4 py-3 mb-6 border border-accent-1/20 bg-accent-1/5">
                <p className="text-sm text-foreground/60">
                    <span className="text-accent-1 font-medium">Info:</span> Siswa otomatis terdaftar saat login dengan Google.
                    Untuk menambah <strong className="text-yellow-400">Tutor</strong> atau <strong className="text-red-400">Admin</strong> baru, klik tombol <strong className="text-foreground/80">&quot;Tambah Staff&quot;</strong> — mereka login via <code className="text-xs bg-foreground/10 px-1.5 py-0.5 rounded">/auth/staff-login</code>.
                </p>
            </div>

            <div className="admin-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full admin-table">
                        <thead>
                            <tr>
                                <th className="px-4 py-3 text-left">Pengguna</th>
                                <th className="px-4 py-3 text-left">Role</th>
                                <th className="px-4 py-3 text-left">Kelas</th>
                                <th className="px-4 py-3 text-left">Status</th>
                                <th className="px-4 py-3 text-left">Terdaftar</th>
                                <th className="px-4 py-3 text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((u) => {
                                const roleConfig = ROLE_CONFIG[u.role];
                                const RoleIcon = roleConfig.icon;
                                return (
                                    <tr key={u.id} className="border-t border-foreground/5 hover:bg-foreground/2">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                {u.avatar_url ? (
                                                    <Image
                                                        src={u.avatar_url}
                                                        alt={u.full_name}
                                                        width={32}
                                                        height={32}
                                                        className="w-8 h-8 rounded-lg object-cover"
                                                        referrerPolicy="no-referrer"
                                                    />
                                                ) : (
                                                    <div className="w-8 h-8 rounded-lg bg-accent-1/20 flex items-center justify-center text-accent-1 text-xs font-bold">
                                                        {getInitials(u.full_name)}
                                                    </div>
                                                )}
                                                <div>
                                                    <p className="text-sm font-medium text-foreground">
                                                        {u.full_name}
                                                    </p>
                                                    <p className="text-xs text-foreground/40">{u.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="relative group inline-block">
                                                <Badge variant={roleConfig.color} className="cursor-pointer">
                                                    <RoleIcon className="w-3 h-3 mr-1" />
                                                    {roleConfig.label}
                                                    <ChevronDown className="w-3 h-3 ml-1" />
                                                </Badge>
                                                <div className="absolute left-0 top-full mt-1 z-10 hidden group-hover:block">
                                                    <div className="admin-card py-1 shadow-xl min-w-30">
                                                        {(['student', 'tutor', 'admin'] as const).map(
                                                            (r) => (
                                                                <button
                                                                    key={r}
                                                                    onClick={() =>
                                                                        quickChangeRole(u.id, r)
                                                                    }
                                                                    className={cn(
                                                                        'w-full px-3 py-1.5 text-left text-sm hover:bg-foreground/10 transition-colors flex items-center gap-2',
                                                                        u.role === r
                                                                            ? 'text-accent-1'
                                                                            : 'text-foreground/60'
                                                                    )}
                                                                >
                                                                    {React.createElement(
                                                                        ROLE_CONFIG[r].icon,
                                                                        { className: 'w-3 h-3' }
                                                                    )}
                                                                    {ROLE_CONFIG[r].label}
                                                                </button>
                                                            )
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="text-sm text-foreground/50">
                                                {u.class_groups?.name || '-'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <button
                                                onClick={() =>
                                                    quickToggleActive(u.id, u.is_active)
                                                }
                                                className="flex items-center gap-1.5"
                                            >
                                                {u.is_active ? (
                                                    <Badge variant="success">
                                                        <CheckCircle2 className="w-3 h-3 mr-1" />
                                                        Aktif
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="danger">
                                                        <XCircle className="w-3 h-3 mr-1" />
                                                        Nonaktif
                                                    </Badge>
                                                )}
                                            </button>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-foreground/40">
                                            {formatDate(u.created_at)}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setEditingUser(u)}
                                            >
                                                Detail
                                            </Button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {users.length === 0 && !isLoading && (
                    <div className="py-12 text-center text-foreground/40">
                        <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
                        <p>Tidak ada pengguna ditemukan</p>
                    </div>
                )}
            </div>

            <AnimatePresence>
                {editingUser && (
                    <EditUserModal
                        user={editingUser}
                        classes={classes}
                        onClose={() => setEditingUser(null)}
                        onSave={handleUpdateUser}
                        isSaving={isSaving}
                    />
                )}
                {showAddForm && (
                    <AddStaffModal
                        onClose={() => setShowAddForm(false)}
                        onCreate={handleCreateStaff}
                        isSaving={isSaving}
                    />
                )}
            </AnimatePresence>
        </motion.div>
    );
}

import React from 'react';

function EditUserModal({
    user,
    classes,
    onClose,
    onSave,
    isSaving,
}: {
    user: ProfileWithClass;
    classes: ClassGroup[];
    onClose: () => void;
    onSave: (updates: {
        role?: string;
        classId?: string | null;
        isActive?: boolean;
        paymentStatus?: string;
        paymentExpiresAt?: string | null;
    }) => void;
    isSaving: boolean;
}) {
    const [role, setRole] = useState(user.role);
    const [classId, setClassId] = useState(user.class_id || '');
    const [isActive, setIsActive] = useState(user.is_active);
    const [paymentStatus, setPaymentStatus] = useState(user.payment_status);

    const handleSave = () => {
        onSave({
            role,
            classId: classId || null,
            isActive,
            paymentStatus,
            paymentExpiresAt:
                paymentStatus === 'active'
                    ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
                    : null,
        });
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="admin-card w-full max-w-lg p-6"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-bold text-foreground">Edit Pengguna</h2>
                    <button
                        onClick={onClose}
                        className="text-foreground/40 hover:text-foreground/70 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex items-center gap-3 mb-6 p-3 rounded-xl bg-foreground/5">
                    {user.avatar_url ? (
                        <Image
                            src={user.avatar_url}
                            alt={user.full_name}
                            width={48}
                            height={48}
                            className="w-12 h-12 rounded-xl object-cover"
                            referrerPolicy="no-referrer"
                        />
                    ) : (
                        <div className="w-12 h-12 rounded-xl bg-accent-1/20 flex items-center justify-center text-accent-1 font-bold">
                            {getInitials(user.full_name)}
                        </div>
                    )}
                    <div>
                        <p className="font-medium text-foreground">{user.full_name}</p>
                        <p className="text-sm text-foreground/40">{user.email}</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-foreground/60 mb-1.5">
                            Role
                        </label>
                        <select
                            value={role}
                            onChange={(e) => setRole(e.target.value as 'student' | 'tutor' | 'admin')}
                            className="admin-input w-full px-3 py-2 text-sm"
                        >
                            <option value="student">Siswa</option>
                            <option value="tutor">Tutor</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-foreground/60 mb-1.5">
                            Kelas
                        </label>
                        <select
                            value={classId}
                            onChange={(e) => setClassId(e.target.value)}
                            className="admin-input w-full px-3 py-2 text-sm"
                        >
                            <option value="">Tidak ada kelas</option>
                            {classes.map((cls) => (
                                <option key={cls.id} value={cls.id}>
                                    {cls.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-foreground/60">Akun Aktif</label>
                        <button
                            onClick={() => setIsActive(!isActive)}
                            className={cn(
                                'relative w-11 h-6 rounded-full transition-colors',
                                isActive ? 'bg-green-500/30' : 'bg-foreground/10'
                            )}
                        >
                            <div
                                className={cn(
                                    'absolute top-0.5 w-5 h-5 rounded-full transition-all',
                                    isActive
                                        ? 'left-5.5 bg-green-400'
                                        : 'left-0.5 bg-foreground/40'
                                )}
                            />
                        </button>
                    </div>

                    {role === 'student' && (
                        <div>
                            <label className="block text-sm font-medium text-foreground/60 mb-1.5">
                                Status Pembayaran
                            </label>
                            <select
                                value={paymentStatus}
                                onChange={(e) =>
                                    setPaymentStatus(
                                        e.target.value as 'active' | 'expired' | 'pending'
                                    )
                                }
                                className="admin-input w-full px-3 py-2 text-sm"
                            >
                                <option value="active">Aktif</option>
                                <option value="expired">Expired</option>
                                <option value="pending">Pending</option>
                            </select>
                        </div>
                    )}
                </div>

                <div className="flex gap-3 mt-6">
                    <Button
                        variant="ghost"
                        className="flex-1"
                        onClick={onClose}
                    >
                        Batal
                    </Button>
                    <Button
                        className="flex-1"
                        onClick={handleSave}
                        isLoading={isSaving}
                    >
                        Simpan Perubahan
                    </Button>
                </div>
            </motion.div>
        </motion.div>
    );
}

function AddStaffModal({
    onClose,
    onCreate,
    isSaving,
}: {
    onClose: () => void;
    onCreate: (data: {
        email: string;
        password: string;
        fullName: string;
        role: string;
    }) => Promise<{ error?: string }>;
    isSaving: boolean;
}) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [role, setRole] = useState<'tutor' | 'admin'>('tutor');
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password.length < 6) {
            setError('Password minimal 6 karakter');
            return;
        }

        const result = await onCreate({ email, password, fullName, role });
        if (result?.error) {
            setError(result.error);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="admin-card w-full max-w-lg p-6"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                        <Plus className="w-5 h-5 text-accent-1" />
                        Tambah Staff Baru
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-foreground/40 hover:text-foreground/70 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                        <div className="px-3 py-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-foreground/60 mb-1.5">
                            Nama Lengkap
                        </label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/25" />
                            <input
                                type="text"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                placeholder="Nama lengkap"
                                required
                                className="admin-input w-full pl-10 pr-4 py-2 text-sm"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-foreground/60 mb-1.5">
                            Email
                        </label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/25" />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="email@privcey.com"
                                required
                                className="admin-input w-full pl-10 pr-4 py-2 text-sm"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-foreground/60 mb-1.5">
                            Password
                        </label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/25" />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Minimal 6 karakter"
                                required
                                className="admin-input w-full pl-10 pr-4 py-2 text-sm"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-foreground/60 mb-1.5">
                            Role
                        </label>
                        <select
                            value={role}
                            onChange={(e) => setRole(e.target.value as 'tutor' | 'admin')}
                            className="admin-input w-full px-3 py-2 text-sm"
                        >
                            <option value="tutor">Tutor</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>

                    <div className="flex gap-3 mt-6">
                        <Button variant="ghost" className="flex-1" onClick={onClose} type="button">
                            Batal
                        </Button>
                        <Button className="flex-1" type="submit" isLoading={isSaving}>
                            Buat Akun Staff
                        </Button>
                    </div>
                </form>

                <p className="text-xs text-foreground/30 mt-4 text-center">
                    Staff login di <code className="bg-foreground/10 px-1 py-0.5 rounded">/auth/staff-login</code> menggunakan email &amp; password ini.
                </p>
            </motion.div>
        </motion.div>
    );
}
