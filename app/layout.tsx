import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Sidebar } from "@/app/components/Sidebar";
import { getLeadsList } from "@/lib/api";
import { LeadsProvider } from "@/lib/leadsStore";
import { PartnersProvider } from "@/lib/partnersStore";
import { getPartnersList } from "@/lib/partnersApi";
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
  description: "Dashboard de leads imobiliários e parcerias",
};

export default async function RootLayout({
  children,
  modal,
}: Readonly<{
  children: React.ReactNode;
  modal: React.ReactNode;
}>) {
  const [leads, partners] = await Promise.all([getLeadsList(), getPartnersList()]);

  return (
    <html
      lang="pt-PT"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex h-full bg-canvas text-ink">
        <LeadsProvider initialLeads={leads}>
          <PartnersProvider initialPartners={partners}>
            <Sidebar />
            <div className="flex-1 overflow-y-auto">{children}</div>
            {modal}
          </PartnersProvider>
        </LeadsProvider>
      </body>
    </html>
  );
}
