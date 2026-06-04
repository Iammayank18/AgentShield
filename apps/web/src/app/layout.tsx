import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AgentShield — Zero-Trust Runtime Security for AI Agents",
  description: "Deterministic runtime enforcement preventing prompt injection and privilege escalation in AI agents.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#0a0a0f] text-slate-200 antialiased">{children}</body>
    </html>
  );
}
