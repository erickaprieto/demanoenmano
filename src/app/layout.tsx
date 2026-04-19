import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "De Mano en Mano",
    template: "%s · De Mano en Mano",
  },
  description:
    "De Mano en Mano — marketplace móvil en Costa Rica: descubrí, vendé y pagá seguro.",
  applicationName: "De Mano en Mano",
  icons: {
    icon: [{ url: "/demanoenmano-neon-logo.png", type: "image/png" }],
    apple: [{ url: "/demanoenmano-neon-logo.png", sizes: "180x180", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    title: "De Mano en Mano",
    statusBarStyle: "black-translucent",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#1A1A1A",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${inter.variable} h-full`}>
      <body className="min-h-dvh bg-black font-sans text-zinc-100 antialiased">
        {children}
      </body>
    </html>
  );
}
