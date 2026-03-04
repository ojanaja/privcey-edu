'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { GlassCard, Button, Badge, LoadingSpinner } from '@/components/ui';
import {
    QrCode,
    CheckCircle2,
    XCircle,
    Clock,
    RefreshCw,
    ArrowLeft,
    CreditCard,
    Shield,
} from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';
import Image from 'next/image';

type PaymentState = 'idle' | 'loading' | 'pending' | 'settlement' | 'expire' | 'error';

const MONTHLY_FEE = 70000;

function formatRupiah(amount: number): string {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(amount);
}

function formatCountdown(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export default function PaymentPage() {
    const { user } = useAuthStore();
    const router = useRouter();
    const { t } = useTranslation();
    const [state, setState] = useState<PaymentState>('idle');
    const [qrisUrl, setQrisUrl] = useState<string | null>(null);
    const [orderId, setOrderId] = useState<string | null>(null);
    const [expiresAt, setExpiresAt] = useState<string | null>(null);
    const [countdown, setCountdown] = useState(0);
    const [errorMsg, setErrorMsg] = useState('');
    const pollRef = useRef<NodeJS.Timeout | null>(null);
    const countdownRef = useRef<NodeJS.Timeout | null>(null);

    const createPayment = useCallback(async () => {
        setState('loading');
        setErrorMsg('');
        try {
            const res = await fetch('/api/payment/create-qris', { method: 'POST' });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to create payment');

            setQrisUrl(data.transaction.qris_url);
            setOrderId(data.transaction.order_id);
            setExpiresAt(data.transaction.expires_at);
            setState(data.transaction.status === 'settlement' ? 'settlement' : 'pending');
        } catch (err) {
            setErrorMsg(err instanceof Error ? err.message : 'Something went wrong');
            setState('error');
        }
    }, []);

    useEffect(() => {
        if (state !== 'pending' || !orderId) return;

        const checkStatus = async () => {
            try {
                const res = await fetch(`/api/payment/status?order_id=${orderId}`);
                const data = await res.json();
                if (data.status === 'settlement') {
                    setState('settlement');
                } else if (data.status === 'expire') {
                    setState('expire');
                } else if (data.status === 'cancel' || data.status === 'deny') {
                    setState('error');
                    setErrorMsg('Payment was declined');
                }
            } catch (err) {
                console.warn('Failed to check payment status:', err);
            }
        };

        pollRef.current = setInterval(checkStatus, 5000);
        return () => {
            if (pollRef.current) clearInterval(pollRef.current);
        };
    }, [state, orderId]);

    useEffect(() => {
        if (state !== 'pending' || !expiresAt) return;

        const tick = () => {
            const diff = Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));
            setCountdown(diff);
            if (diff <= 0) {
                setState('expire');
            }
        };

        tick();
        countdownRef.current = setInterval(tick, 1000);
        return () => {
            if (countdownRef.current) clearInterval(countdownRef.current);
        };
    }, [state, expiresAt]);

    useEffect(() => {
        return () => {
            if (pollRef.current) clearInterval(pollRef.current);
            if (countdownRef.current) clearInterval(countdownRef.current);
        };
    }, []);

    if (user?.payment_status === 'active') {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <GlassCard hoverable={false} padding="lg" className="max-w-md text-center">
                    <CheckCircle2 className="w-16 h-16 text-green-400 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-foreground mb-2">{t.payment.alreadyActive}</h2>
                    <p className="text-foreground/50 text-sm mb-4">{t.payment.alreadyActiveDesc}</p>
                    <Button onClick={() => router.push('/dashboard')} className="w-full">
                        <ArrowLeft className="w-4 h-4" />
                        {t.payment.backToDashboard}
                    </Button>
                </GlassCard>
            </div>
        );
    }

    if (state === 'idle') {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-center min-h-[60vh]"
            >
                <GlassCard hoverable={false} padding="lg" className="max-w-md w-full">
                    <div className="text-center mb-6">
                        <div className="w-16 h-16 rounded-2xl bg-accent-1/10 flex items-center justify-center mx-auto mb-4">
                            <CreditCard className="w-8 h-8 text-accent-1" />
                        </div>
                        <h1 className="text-xl font-bold text-foreground mb-1">{t.payment.title}</h1>
                        <p className="text-foreground/50 text-sm">{t.payment.subtitle}</p>
                    </div>

                    <div className="p-4 rounded-xl bg-foreground/[0.03] border border-foreground/[0.06] mb-6">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-sm text-foreground/60">{t.payment.monthlyFee}</span>
                            <span className="text-2xl font-bold text-accent-1">{formatRupiah(MONTHLY_FEE)}</span>
                        </div>
                        <div className="space-y-2 text-xs text-foreground/40">
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                                {t.payment.benefit1}
                            </div>
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                                {t.payment.benefit2}
                            </div>
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                                {t.payment.benefit3}
                            </div>
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                                {t.payment.benefit4}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 mb-4 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                        <Shield className="w-4 h-4 text-blue-400 shrink-0" />
                        <p className="text-[11px] text-blue-300">{t.payment.secureNote}</p>
                    </div>

                    <Button onClick={createPayment} className="w-full" size="lg">
                        <QrCode className="w-5 h-5" />
                        {t.payment.payWithQris}
                    </Button>

                    <button
                        onClick={() => router.push('/dashboard')}
                        className="w-full mt-3 text-center text-xs text-foreground/30 hover:text-foreground/50 transition-colors"
                    >
                        {t.payment.backToDashboard}
                    </button>
                </GlassCard>
            </motion.div>
        );
    }

    if (state === 'loading') {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <GlassCard hoverable={false} padding="lg" className="max-w-md w-full text-center">
                    <LoadingSpinner className="mb-4" />
                    <p className="text-foreground/50 text-sm">{t.payment.generatingQris}</p>
                </GlassCard>
            </div>
        );
    }

    if (state === 'settlement') {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                >
                    <GlassCard hoverable={false} padding="lg" className="max-w-md text-center">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
                        >
                            <CheckCircle2 className="w-20 h-20 text-green-400 mx-auto mb-4" />
                        </motion.div>
                        <h2 className="text-xl font-bold text-foreground mb-2">{t.payment.successTitle}</h2>
                        <p className="text-foreground/50 text-sm mb-2">{t.payment.successDesc}</p>
                        <Badge variant="success" className="mb-6">{formatRupiah(MONTHLY_FEE)}</Badge>
                        <Button
                            onClick={() => {
                                window.location.href = '/dashboard';
                            }}
                            className="w-full"
                            size="lg"
                        >
                            {t.payment.startLearning}
                        </Button>
                    </GlassCard>
                </motion.div>
            </div>
        );
    }

    if (state === 'expire') {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <GlassCard hoverable={false} padding="lg" className="max-w-md text-center">
                    <Clock className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-foreground mb-2">{t.payment.expiredTitle}</h2>
                    <p className="text-foreground/50 text-sm mb-6">{t.payment.expiredDesc}</p>
                    <Button onClick={() => { setState('idle'); setQrisUrl(null); setOrderId(null); }} className="w-full" size="lg">
                        <RefreshCw className="w-4 h-4" />
                        {t.payment.tryAgain}
                    </Button>
                </GlassCard>
            </div>
        );
    }

    if (state === 'error') {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <GlassCard hoverable={false} padding="lg" className="max-w-md text-center">
                    <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-foreground mb-2">{t.payment.errorTitle}</h2>
                    <p className="text-foreground/50 text-sm mb-2">{errorMsg || t.payment.errorDesc}</p>
                    <div className="flex gap-3 mt-6">
                        <Button variant="ghost" onClick={() => router.push('/dashboard')} className="flex-1">
                            {t.payment.backToDashboard}
                        </Button>
                        <Button onClick={() => { setState('idle'); setErrorMsg(''); }} className="flex-1">
                            <RefreshCw className="w-4 h-4" />
                            {t.payment.tryAgain}
                        </Button>
                    </div>
                </GlassCard>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-center min-h-[60vh]"
        >
            <GlassCard hoverable={false} padding="lg" className="max-w-md w-full">
                <div className="text-center mb-4">
                    <h2 className="text-lg font-bold text-foreground mb-1">{t.payment.scanQris}</h2>
                    <p className="text-foreground/50 text-xs">{t.payment.scanQrisDesc}</p>
                </div>

                <div className="bg-white rounded-2xl p-4 mb-4 flex items-center justify-center">
                    {qrisUrl ? (
                        <Image
                            src={qrisUrl}
                            alt="QRIS Payment"
                            width={280}
                            height={280}
                            className="w-full max-w-[280px] h-auto"
                            unoptimized
                        />
                    ) : (
                        <div className="w-[280px] h-[280px] flex items-center justify-center bg-gray-100 rounded-xl">
                            <QrCode className="w-20 h-20 text-gray-300" />
                        </div>
                    )}
                </div>

                <div className="text-center mb-4">
                    <p className="text-foreground/40 text-xs mb-1">{t.payment.totalPayment}</p>
                    <p className="text-2xl font-bold text-accent-1">{formatRupiah(MONTHLY_FEE)}</p>
                </div>

                <div className={cn(
                    'flex items-center justify-center gap-2 py-2 px-4 rounded-xl mb-4',
                    countdown < 120 ? 'bg-red-500/10 text-red-400' : 'bg-foreground/[0.03] text-foreground/50'
                )}>
                    <Clock className="w-4 h-4" />
                    <span className="text-sm font-mono font-medium">{formatCountdown(countdown)}</span>
                    <span className="text-xs">{t.payment.remaining}</span>
                </div>

                <div className="flex items-center justify-center gap-2 mb-4">
                    <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
                    <span className="text-xs text-foreground/40">{t.payment.waitingPayment}</span>
                </div>

                <div className="text-center mb-4">
                    <p className="text-[10px] text-foreground/30 mb-2">{t.payment.supportedApps}</p>
                    <div className="flex items-center justify-center gap-3 text-[10px] text-foreground/40">
                        <span>GoPay</span>
                        <span>•</span>
                        <span>OVO</span>
                        <span>•</span>
                        <span>DANA</span>
                        <span>•</span>
                        <span>ShopeePay</span>
                        <span>•</span>
                        <span>LinkAja</span>
                    </div>
                </div>

                <button
                    onClick={() => router.push('/dashboard')}
                    className="w-full text-center text-xs text-foreground/30 hover:text-foreground/50 transition-colors"
                >
                    {t.payment.payLater}
                </button>
            </GlassCard>
        </motion.div>
    );
}
