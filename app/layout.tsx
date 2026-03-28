import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SponsorMatch — Sponsoring-Akquise für Eventveranstalter",
  description:
    "SponsorMatch hilft Eventveranstaltern, Sponsoren systematisch zu finden, anzusprechen und zu gewinnen — mit Pipeline, Kontaktdatenbank und KI-Sponsor-Finder.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body style={{ margin: 0, padding: 0 }}>{children}</body>
    </html>
  );
}
