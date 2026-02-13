import type { Metadata } from "next";
import { Russo_One, Chakra_Petch } from "next/font/google";
import "./globals.css";

const russoOne = Russo_One({
  weight: "400",
  variable: "--font-russo-one",
  subsets: ["latin"],
  display: "swap",
});

const chakraPetch = Chakra_Petch({
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-chakra-petch",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "萬物皆可抽 - 一番賞抽賞平台",
  description: "萬物皆可抽專營一番賞抽賞的線上平台，提供最公平、公正、公開的抽賞體驗。",
};

import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-TW">
      <body
        className={`${russoOne.variable} ${chakraPetch.variable} antialiased bg-[#050505] text-white min-h-screen flex flex-col font-body`}
      >
        <Header />
        <main className="flex-grow">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
