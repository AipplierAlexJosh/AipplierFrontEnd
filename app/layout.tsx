import "@/app/styles/globals.css";
import { Inter } from "next/font/google";
import type { Metadata } from "next";
import clsx from "clsx";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter"
});

export const metadata: Metadata = {
  title: "Aipplier",
  description: "Aipplier workspace – collaborative AI powered documentation."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={clsx("theme-day", inter.variable)}>
      <body>
        {children}
        <div id="portal-root" />
      </body>
    </html>
  );
}

