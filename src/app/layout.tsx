import type { Metadata } from "next";
import { Cormorant_Garamond, Plus_Jakarta_Sans, Playfair_Display, Dancing_Script, Lora } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/context/CartContext";
import { StoreSettingsProvider } from "@/context/StoreSettingsContext";
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

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  display: "swap",
});

const dancingScript = Dancing_Script({
  variable: "--font-dancing",
  subsets: ["latin"],
  weight: ["600", "700"],
  display: "swap",
});

const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://welembrancinhas.com.br"),
  icons: {
    icon: [
      { url: '/icon.png?v=2', sizes: '512x512', type: 'image/png' },
      { url: '/favicon.ico?v=2' },
    ],
    apple: [
      { url: '/apple-icon.png?v=2', sizes: '180x180', type: 'image/png' },
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
    url: "https://welembrancinhas.com.br",
    siteName: "Wê Lembrancinhas",
    locale: "pt_BR",
    type: "website",
    images: [
      {
        url: "/icon.png?v=2",
        width: 512,
        height: 512,
        alt: "Wê Lembrancinhas",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "Wê Lembrancinhas | Papelaria Afetiva & Personalizados",
    description: "Lembrancinhas personalizadas para aniversários, batizados e momentos inesquecíveis.",
    images: ["/icon.png?v=2"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${cormorant.variable} ${jakarta.variable} ${playfair.variable} ${dancingScript.variable} ${lora.variable}`}>
      <body>
        <StoreSettingsProvider>
          <CartProvider>
            <AnalyticsTracker />
            {children}
          </CartProvider>
        </StoreSettingsProvider>
      </body>
    </html>
  );
}
