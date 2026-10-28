import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Sidebar } from "@/app/components/Sidebar";
import { getLeadsList } from "@/lib/api";
import { LeadsProvider } from "@/lib/leadsStore";
import { PartnersProvider } from "@/lib/partnersStore";
import { getPartnersList } from "@/lib/partnersApi";
import { RecruitmentProvider } from "@/lib/recruitmentStore";
import { getRecruitmentList } from "@/lib/recruitmentApi";
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
  title: "Dashboard — André Reis",
  description: "Dashboard de leads imobiliários, parcerias e recrutamento",
};

export default async function RootLayout({
  children,
  modal,
}: Readonly<{
  children: React.ReactNode;
  modal: React.ReactNode;
}>) {
  const [leads, partners, candidates] = await Promise.all([getLeadsList(), getPartnersList(), getRecruitmentList()]);

  return (
    <html
      lang="pt-PT"
      className={`${geistSans.variable} ${geistMono.variable} min-h-full antialiased`}
    >
      <body className="flex min-h-dvh bg-canvas text-ink">
        <LeadsProvider initialLeads={leads}>
          <PartnersProvider initialPartners={partners}>
            <RecruitmentProvider initialCandidates={candidates}>
              <Sidebar />
              <div className="dashboard-content min-w-0 flex-1">{children}</div>
              {modal}
            </RecruitmentProvider>
          </PartnersProvider>
        </LeadsProvider>
      </body>
    </html>
  );
}
