import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "DonationTracker",
  description: "Tax Deduction Tracker",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="h-full antialiased dark"
    >
      <body className="min-h-full flex flex-row">
        <Sidebar />
        <main className="flex-1 overflow-auto bg-background">
          {children}
        </main>
      </body>
    </html>
  );
}
