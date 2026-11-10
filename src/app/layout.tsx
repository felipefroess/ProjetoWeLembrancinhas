import type { Metadata } from "next";
import { Cormorant_Garamond, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/context/CartContext";
import { AnalyticsTracker } from "@/components/AnalyticsTracker";

const cormorant = Cormorant_Garamond({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  display: "swap",
});

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/icon.png', sizes: '512x512', type: 'image/png' },
      { url: '/favicon.ico' },
    ],
    apple: [
      { url: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  title: "Wê Lembrancinhas | Papelaria Afetiva & Personalizados",
  description: "Lembrancinhas personalizadas para qualquer ocasião: topos de bolo, caixas milk luxo, batizados, aniversários e datas especiais em Pouso Alegre e Paraisópolis - MG.",
  keywords: [
    "Wê Lembrancinhas",
    "Lembrancinhas personalizadas",
    "Topo de bolo",
    "Pouso Alegre",
    "Paraisópolis",
    "Papelaria personalizada",
    "Batizado",
    "Caixa milk luxo"
  ],
  authors: [{ name: "Wenilze Fróes" }],
  openGraph: {
    title: "Wê Lembrancinhas | Papelaria Afetiva & Personalizados",
    description: "Lembrancinhas personalizadas para aniversários, batizados e momentos inesquecíveis.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${cormorant.variable} ${jakarta.variable}`}>
      <body>
        <CartProvider>
          <AnalyticsTracker />
          {children}
        </CartProvider>
      </body>
    </html>
  );
}
