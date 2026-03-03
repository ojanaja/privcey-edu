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
import { useTranslation } from '@/lib/i18n';

export default function LandingPage() {
  const { t } = useTranslation();

  const features = [
    {
      icon: <FileText className="w-6 h-6" />,
      title: t.landing.features.tryout.title,
      description: t.landing.features.tryout.description,
    },
    {
      icon: <Video className="w-6 h-6" />,
      title: t.landing.features.vod.title,
      description: t.landing.features.vod.description,
    },
    {
      icon: <BookOpen className="w-6 h-6" />,
      title: t.landing.features.emod.title,
      description: t.landing.features.emod.description,
    },
    {
      icon: <BarChart3 className="w-6 h-6" />,
      title: t.landing.features.scoreTracker.title,
      description: t.landing.features.scoreTracker.description,
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: t.landing.features.strengthens.title,
      description: t.landing.features.strengthens.description,
    },
    {
      icon: <Trophy className="w-6 h-6" />,
      title: t.landing.features.leaderboard.title,
      description: t.landing.features.leaderboard.description,
    },
  ];

  const stats = [
    { value: '100+', label: t.landing.activeStudents },
    { value: '4', label: t.landing.classes },
    { value: '500+', label: t.landing.questionBank },
    { value: '98%', label: t.landing.satisfaction },
  ];

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
            {t.landing.login}
          </Link>
          <Link
            href="/auth/register"
            className="text-sm font-medium text-foreground bg-accent-1/10 hover:bg-accent-1/15 border border-accent-1/20 rounded-xl px-5 py-2 transition-colors"
          >
            {t.landing.register}
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
            {t.landing.premiumPlatform}
          </div>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-foreground leading-tight mb-6">
            {t.landing.heroTitle1}
            <br />
            <span className="text-accent-1">{t.landing.heroTitle2}</span>
          </h1>
          <p className="text-lg md:text-xl text-foreground/40 max-w-2xl mx-auto mb-10">
            {t.landing.heroDescription}
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link
              href="/auth/register"
              className="inline-flex items-center gap-2 text-sm font-medium text-white glass-button px-8 py-3.5 rounded-xl hover:scale-105 transition-transform"
            >
              {t.landing.startNow}
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/auth/login"
              className="inline-flex items-center gap-2 text-sm text-foreground/60 hover:text-foreground px-6 py-3.5 transition-colors"
            >
              {t.landing.haveAccount}
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
            {t.landing.featuresTitle} <span className="text-accent-1">{t.landing.featuresHighlight}</span>
          </h2>
          <p className="text-foreground/40 max-w-lg mx-auto">
            {t.landing.featuresDescription}
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
            {t.landing.readyToJoin}
          </h2>
          <p className="text-foreground/40 mb-8 max-w-md mx-auto">
            {t.landing.joinDescription}
          </p>
          <Link
            href="/auth/register"
            className="inline-flex items-center gap-2 text-sm font-medium text-white glass-button px-8 py-3.5 rounded-xl hover:scale-105 transition-transform"
          >
            {t.landing.registerFree}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-foreground/5 py-8 text-center">
        <p className="text-xs text-foreground/20">
          {t.landing.copyright}
        </p>
      </footer>
    </div>
  );
}
