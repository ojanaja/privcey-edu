'use client';

import { motion } from 'framer-motion';
import { GlassCard, Button } from '@/components/ui';
import { Lock, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function PaymentRequiredPage() {
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
                    <h1 className="text-xl font-bold text-foreground mb-2">Akses Terkunci</h1>
                    <p className="text-foreground/50 text-sm mb-6">
                        Iuran bulanan kamu (Rp70.000) telah melewati batas waktu.
                        Silakan hubungi admin untuk memperbarui pembayaran agar bisa mengakses
                        Try Out, E-Modul, dan Video Belajar.
                    </p>
                    <div className="space-y-3">
                        <a
                            href="https://wa.me/62XXXXXXXXXX?text=Halo%20Admin,%20saya%20ingin%20memperbarui%20pembayaran%20Privcey%20Edu"
                            target="_blank"
                            rel="noreferrer"
                        >
                            <Button className="w-full" size="lg">
                                Hubungi Admin via WhatsApp
                                <ArrowRight className="w-4 h-4" />
                            </Button>
                        </a>
                        <Link href="/dashboard">
                            <Button variant="ghost" className="w-full">
                                Kembali ke Dashboard
                            </Button>
                        </Link>
                    </div>
                </GlassCard>
            </motion.div>
        </div>
    );
}
