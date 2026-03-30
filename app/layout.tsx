import type { Metadata } from "next";
import { Geist, Geist_Mono, Playfair_Display, Libre_Baskerville } from "next/font/google";
import { ToastProvider } from "@/src/components/Toast";
import { TopNav } from "@/src/components/TopNav";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Editorial Bridal System — Display serif
const playfairDisplay = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

// Editorial Bridal System — Body serif
const libreBaskerville = Libre_Baskerville({
  variable: "--font-baskerville",
  subsets: ["latin"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Seasonality Planner",
  description: "Plan event florals by season",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${playfairDisplay.variable} ${libreBaskerville.variable}`}
    >
      <body className="antialiased">
        <ToastProvider>
          <TopNav />
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
