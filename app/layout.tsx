import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Sidebar } from "@/app/components/Sidebar";
import { mockLeads } from "@/lib/mockData";
import { LeadsProvider } from "@/lib/leadsStore";
import "./globals.css";

export const dynamic = "force-dynamic";

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
  return (
    <html
      lang="pt-PT"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex h-full bg-zinc-50 text-zinc-900">
        <LeadsProvider initialLeads={mockLeads}>
          <Sidebar />
          <div className="flex-1 overflow-y-auto">{children}</div>
          {modal}
        </LeadsProvider>
      </body>
    </html>
  );
}
