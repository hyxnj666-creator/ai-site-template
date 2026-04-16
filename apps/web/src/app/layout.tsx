import type { Metadata, Viewport } from "next";
import { Inter, Manrope, Noto_Sans_SC, Space_Grotesk } from "next/font/google";
import { cookies } from "next/headers";
import "./globals.css";
import { Providers } from "./providers";
import { SiteBackground } from "@/components/site-background";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { LiveCursors } from "@/components/live-cursors";
import { LOCALE_COOKIE_NAME, resolveSiteLocale, toHtmlLang } from "@/lib/site-locale";

const displayFont = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

const bodyFont = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

const labelFont = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const cjkFont = Noto_Sans_SC({
  variable: "--font-cjk",
  display: "swap",
  preload: true,
  weight: ["400", "500", "600", "700"],
});

const SITE_URL = "https://yoursite.example.com";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "AI Site | Living Interface",
    template: "%s | AI Site",
  },
  description:
    "AI-native personal platform — cinematic design, adaptive interface, and intelligent systems.",
  openGraph: {
    type: "website",
    siteName: "AI Site",
    locale: "zh_CN",
    alternateLocale: "en_US",
    url: SITE_URL,
    title: "AI Site | Living Interface",
    description:
      "AI-native personal platform — cinematic design, adaptive interface, and intelligent systems.",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "AI Site – Living Interface" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Site | Living Interface",
    description:
      "AI-native personal platform — cinematic design, adaptive interface, and intelligent systems.",
    images: ["/opengraph-image"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "AI Site",
  url: SITE_URL,
  description:
    "AI-native personal platform — cinematic design, adaptive interface, and intelligent systems.",
  author: {
    "@type": "Person",
    name: "Site Owner",
    url: SITE_URL,
    jobTitle: "AI Full-Stack Engineer",
    sameAs: [],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const locale = resolveSiteLocale(cookieStore.get(LOCALE_COOKIE_NAME)?.value);

  return (
    <html
      lang={toHtmlLang(locale)}
      data-locale={locale}
      suppressHydrationWarning
      className={`${displayFont.variable} ${bodyFont.variable} ${labelFont.variable} ${cjkFont.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-background text-foreground">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <Providers initialLocale={locale}>
          <SiteBackground />
          <div className="relative flex min-h-full flex-col overflow-x-clip">
            <SiteHeader />
            {children}
            <SiteFooter />
          </div>
          <LiveCursors />
        </Providers>
      </body>
    </html>
  );
}
