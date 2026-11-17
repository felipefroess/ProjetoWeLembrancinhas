import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Plus_Jakarta_Sans, Playfair_Display, Dancing_Script, Lora } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/context/CartContext";
import { StoreSettingsProvider } from "@/context/StoreSettingsContext";
import { AnalyticsTracker } from "@/components/AnalyticsTracker";
import { getStoreSettings } from "@/lib/storeSettingsStore";
import { StoreSettings, DEFAULT_SETTINGS } from "@/types/storeSettings";

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

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

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
  title: {
    default: "Wê Lembrancinhas | Papelaria Afetiva & Personalizados",
    template: "%s | Wê Lembrancinhas",
  },
  description: "Lembrancinhas personalizadas para qualquer ocasião: topos de bolo, caixas milk luxo, batizados, aniversários e datas especiais em Pouso Alegre e Paraisópolis - MG.",
  keywords: [
    "welembrancinhas",
    "we lembrancinhas",
    "wê lembrancinhas",
    "welembrancinhas instagram",
    "welembrancinhas pouso alegre",
    "welembrancinhas paraisopolis",
    "Wê Lembrancinhas",
    "Lembrancinhas personalizadas",
    "Papelaria personalizada",
    "Papelaria afetiva",
    "Topo de bolo",
    "Pouso Alegre",
    "Paraisópolis",
    "Batizado",
    "Caixa milk luxo",
    "Wenilze Fróes"
  ],
  alternates: {
    canonical: "https://welembrancinhas.com.br",
  },
  verification: {
    google: "Ni4GsTTIbYm4AV382BOuE17g7Ort1C-8P9WmbbEDM0M",
  },
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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let initialSettings: StoreSettings = DEFAULT_SETTINGS;
  try {
    initialSettings = await getStoreSettings();
  } catch {}

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": "Wê Lembrancinhas",
    "alternateName": [
      "welembrancinhas",
      "We Lembrancinhas",
      "Wê Lembrancinhas Personalizados",
      "welembrancinhas instagram"
    ],
    "description": "Lembrancinhas personalizadas e papelaria afetiva para topos de bolo, batizados, aniversários e datas especiais em Pouso Alegre e Paraisópolis - MG.",
    "url": "https://welembrancinhas.com.br",
    "telephone": "+5535984026382",
    "image": "https://welembrancinhas.com.br/icon.png",
    "sameAs": [
      "https://www.instagram.com/welembrancinhas",
      "https://instagram.com/welembrancinhas"
    ],
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Pouso Alegre",
      "addressRegion": "MG",
      "addressCountry": "BR"
    },
    "areaServed": [
      { "@type": "City", "name": "Pouso Alegre" },
      { "@type": "City", "name": "Paraisópolis" }
    ]
  };

  return (
    <html lang="pt-BR" className={`${cormorant.variable} ${jakarta.variable} ${playfair.variable} ${dancingScript.variable} ${lora.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body suppressHydrationWarning>
        <StoreSettingsProvider initialSettings={initialSettings}>
          <CartProvider>
            <AnalyticsTracker />
            {children}
          </CartProvider>
        </StoreSettingsProvider>
      </body>
    </html>
  );
}
