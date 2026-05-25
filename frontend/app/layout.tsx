import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ModelWeave",
  description: "AI workforce platform for PPC and SEO agency operations.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
