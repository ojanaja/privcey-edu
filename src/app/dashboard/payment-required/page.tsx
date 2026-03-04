'use client';

import { motion } from 'framer-motion';
import { GlassCard, Button } from '@/components/ui';
import { Lock, QrCode, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useTranslation } from '@/lib/i18n';

export default function PaymentRequiredPage() {
    const { t } = useTranslation();

    return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
            >
                <GlassCard hoverable={false} padding="lg" className="max-w-md text-center">
                    <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                        <Lock className="w-8 h-8 text-red-400" />
                    </div>
                    <h1 className="text-xl font-bold text-foreground mb-2">{t.paymentRequired.title}</h1>
                    <p className="text-foreground/50 text-sm mb-6">
                        {t.paymentRequired.description}
                    </p>
                    <div className="space-y-3">
                        <Link href="/dashboard/payment">
                            <Button className="w-full" size="lg">
                                <QrCode className="w-5 h-5" />
                                {t.payment.payWithQris}
                                <ArrowRight className="w-4 h-4" />
                            </Button>
                        </Link>
                        <a
                            href={`https://wa.me/62XXXXXXXXXX?text=${encodeURIComponent(t.paymentRequired.whatsappMessage)}`}
                            target="_blank"
                            rel="noreferrer"
                        >
                            <Button variant="ghost" className="w-full mt-2">
                                {t.paymentRequired.contactAdmin}
                            </Button>
                        </a>
                        <Link href="/dashboard">
                            <Button variant="ghost" className="w-full">
                                {t.paymentRequired.backToDashboard}
                            </Button>
                        </Link>
                    </div>
                </GlassCard>
            </motion.div>
        </div>
    );
}
