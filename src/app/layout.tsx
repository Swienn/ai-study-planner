import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";
import CookieBanner from "@/components/CookieBanner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://studytool.academy";
const title = "StudyTool — turn your PDFs into a day-by-day study plan";
const description =
  "Upload your study material, set your exam date, and get a personalised, day-by-day study schedule — with AI summaries, flashcards, and quizzes for every topic.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: title,
    template: "%s · StudyTool",
  },
  description,
  applicationName: "StudyTool",
  keywords: [
    "study planner",
    "study schedule",
    "exam preparation",
    "flashcards",
    "quiz generator",
    "PDF to study plan",
    "AI study tool",
    "revision planner",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: "StudyTool",
    url: "/",
    title,
    description,
    locale: "en_GB",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-white text-slate-900">
        {children}
        <CookieBanner />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
