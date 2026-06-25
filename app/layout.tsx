import type { Metadata } from "next";
import { Suspense } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import { Sidebar } from "@/app/components/Sidebar";
import { mockLeads } from "@/lib/mockData";
import { ALL_STATUSES } from "@/lib/leads";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Dashboard de Leads — André Reis",
  description: "Dashboard de geração e gestão de leads imobiliários",
};

export default function RootLayout({
  children,
  modal,
}: Readonly<{
  children: React.ReactNode;
  modal: React.ReactNode;
}>) {
  const statusCounts = Object.fromEntries(
    ALL_STATUSES.map((status) => [
      status,
      mockLeads.filter((lead) => lead.status === status).length,
    ]),
  ) as Record<(typeof ALL_STATUSES)[number], number>;

  return (
    <html
      lang="pt-PT"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex h-full bg-zinc-50 text-zinc-900">
        <Suspense fallback={null}>
          <Sidebar totalLeads={mockLeads.length} statusCounts={statusCounts} />
        </Suspense>
        <div className="flex-1 overflow-y-auto">{children}</div>
        {modal}
      </body>
    </html>
  );
}
