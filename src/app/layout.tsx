import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { ErrorBoundary } from "@/components/error-boundary";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Privcey Edu — E-Learning Platform",
  description:
    "Platform e-learning premium dengan Try Out, E-Modul, VOD, dan STRENGTHENS untuk siswa bimbel.",
  keywords: ["e-learning", "bimbel", "try out", "CBT", "education"],
  openGraph: {
    title: "Privcey Edu — E-Learning Platform",
    description: "Platform e-learning premium dengan Try Out, E-Modul, VOD, dan STRENGTHENS.",
    type: "website",
    locale: "id_ID",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <ThemeProvider>
          <ErrorBoundary>{children}</ErrorBoundary>
        </ThemeProvider>
      </body>
    </html>
  );
}
