'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  BookOpen,
  FileText,
  Video,
  BarChart3,
  Shield,
  Zap,
  ArrowRight,
  Star,
  Users,
  Trophy,
} from 'lucide-react';

const features = [
  {
    icon: <FileText className="w-6 h-6" />,
    title: 'Try Out (CBT)',
    description: 'Ujian online dengan timer, navigasi soal, dan auto-grading instan.',
  },
  {
    icon: <Video className="w-6 h-6" />,
    title: 'Video on Demand',
    description: 'Materi video berkualitas yang bisa ditonton kapan saja.',
  },
  {
    icon: <BookOpen className="w-6 h-6" />,
    title: 'E-Modul',
    description: 'Modul digital PDF yang terintegrasi dengan Google Drive.',
  },
  {
    icon: <BarChart3 className="w-6 h-6" />,
    title: 'Score Tracker',
    description: 'Pantau perkembangan skor dengan grafik trendline interaktif.',
  },
  {
    icon: <Zap className="w-6 h-6" />,
    title: 'STRENGTHENS',
    description: 'Modul adaptif untuk memperkuat materi yang belum dikuasai.',
  },
  {
    icon: <Trophy className="w-6 h-6" />,
    title: 'Leaderboard',
    description: 'Kompetisi sehat dengan ranking real-time antar siswa.',
  },
];

const stats = [
  { value: '100+', label: 'Siswa Aktif' },
  { value: '4', label: 'Kelas' },
  { value: '500+', label: 'Bank Soal' },
  { value: '98%', label: 'Kepuasan' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Navbar */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-accent-1 flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-accent-1">Privcey Edu</span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/auth/login"
            className="text-sm text-foreground/60 hover:text-foreground transition-colors px-4 py-2"
          >
            Masuk
          </Link>
          <Link
            href="/auth/register"
            className="text-sm font-medium text-foreground bg-accent-1/10 hover:bg-accent-1/15 border border-accent-1/20 rounded-xl px-5 py-2 transition-colors"
          >
            Daftar
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 pt-20 pb-32 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          <div className="inline-flex items-center gap-2 bg-accent-1/10 border border-accent-1/20 rounded-full px-4 py-1.5 text-xs text-accent-1 mb-6">
            <Star className="w-3.5 h-3.5" />
            Platform E-Learning Premium
          </div>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-foreground leading-tight mb-6">
            Belajar Lebih Cerdas
            <br />
            <span className="text-accent-1">dengan Privcey Edu</span>
          </h1>
          <p className="text-lg md:text-xl text-foreground/40 max-w-2xl mx-auto mb-10">
            Platform e-learning all-in-one untuk persiapan ujian. Try Out, Video,
            E-Modul, dan analitik performa — semua dalam satu tempat.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link
              href="/auth/register"
              className="inline-flex items-center gap-2 text-sm font-medium text-white glass-button px-8 py-3.5 rounded-xl hover:scale-105 transition-transform"
            >
              Mulai Sekarang
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/auth/login"
              className="inline-flex items-center gap-2 text-sm text-foreground/60 hover:text-foreground px-6 py-3.5 transition-colors"
            >
              Sudah punya akun? Masuk
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Stats */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 pb-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="glass-card p-6 text-center"
            >
              <p className="text-3xl font-bold text-accent-1">{stat.value}</p>
              <p className="text-xs text-foreground/40 mt-1">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 pb-32">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
            Fitur <span className="text-accent-1">Unggulan</span>
          </h2>
          <p className="text-foreground/40 max-w-lg mx-auto">
            Semua yang kamu butuhkan untuk mempersiapkan ujian dengan lebih efektif.
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="glass-card p-6 group hover:border-accent-1/30 transition-colors"
            >
              <div className="w-12 h-12 rounded-xl bg-accent-1/10 flex items-center justify-center text-accent-1 mb-4 group-hover:scale-110 transition-transform">
                {feature.icon}
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-1">{feature.title}</h3>
              <p className="text-sm text-foreground/40">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 max-w-4xl mx-auto px-6 pb-20">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="glass-card p-10 md:p-14 text-center"
        >
          <Users className="w-10 h-10 text-accent-1 mx-auto mb-4" />
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
            Siap Bergabung?
          </h2>
          <p className="text-foreground/40 mb-8 max-w-md mx-auto">
            Daftar sekarang dan mulai perjalanan belajarmu bersama Privcey Edu.
          </p>
          <Link
            href="/auth/register"
            className="inline-flex items-center gap-2 text-sm font-medium text-white glass-button px-8 py-3.5 rounded-xl hover:scale-105 transition-transform"
          >
            Daftar Gratis
            <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-foreground/5 py-8 text-center">
        <p className="text-xs text-foreground/20">
          © {new Date().getFullYear()} Privcey Edu. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
