import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ModelWeave",
  description: "Service-oriented multi-agent language-model workflows for enterprise knowledge use cases.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

