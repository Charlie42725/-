import type { Metadata, Viewport } from "next";
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

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#161B26",
};

export const metadata: Metadata = {
  title: "失控事務所 - GK.盲盒.一番賞",
  description: "歡迎失控事務所，理智請寄放在門口。GK、盲盒、一番賞，提供最公平、公正、公開的抽賞體驗。",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "失控事務所",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BottomNav from "@/components/BottomNav";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-TW">
      <head>
        <link rel="apple-touch-icon" href="/assets/images/logos/apple-touch-icon.png" />
      </head>
      <body
        className={`${russoOne.variable} ${chakraPetch.variable} antialiased bg-background text-white min-h-screen flex flex-col font-body`}
      >
        <Header />
        <main className="flex-grow pb-16 md:pb-0">
          {children}
        </main>
        <Footer />
        <BottomNav />
      </body>
    </html>
  );
}
