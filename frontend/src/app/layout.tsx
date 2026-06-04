import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Codebase Atlas",
  description: "Explore any GitHub repo as an interactive galaxy",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
