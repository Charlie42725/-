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
  title: "失控抽抽 - GK.盲盒.一番賞",
  description: "失控抽抽 — 失控事務所線上抽賞平台，GK、盲盒、一番賞，提供最公平、公正、公開的抽賞體驗。",
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
        className={`${russoOne.variable} ${chakraPetch.variable} antialiased bg-[#09090b] text-white min-h-screen flex flex-col font-body`}
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
