import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Voice Notes",
  description: "Record, save, and play back voice notes in your browser.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
