import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ModelWeave",
  description: "Document-grounded language-model agent platform for academic workflow automation.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
