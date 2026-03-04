import type { Metadata } from 'next';
import LandingClient from './landing-client';

export const metadata: Metadata = {
  title: 'Privcey Edu — Platform E-Learning Premium',
  description:
    'Platform e-learning all-in-one untuk persiapan ujian. Try Out CBT, Video on Demand, E-Modul, Score Tracker, dan Leaderboard — semua dalam satu tempat.',
  keywords: [
    'e-learning',
    'try out online',
    'CBT',
    'persiapan ujian',
    'video belajar',
    'e-modul',
    'score tracker',
    'privcey edu',
  ],
  openGraph: {
    title: 'Privcey Edu — Belajar Lebih Cerdas',
    description:
      'Platform e-learning all-in-one untuk persiapan ujian. Try Out, Video, E-Modul, dan analitik performa.',
    type: 'website',
  },
};

export default function LandingPage() {
  return <LandingClient />;
}
