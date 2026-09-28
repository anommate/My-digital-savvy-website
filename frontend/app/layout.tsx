import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://mydigitalsavvy.com"),
  title: {
    default: "My Digital Savvy — Digital marketing agency in Nagpur",
    template: "%s — My Digital Savvy",
  },
  description:
    "My Digital Savvy runs Meta Ads, builds websites and creates content for businesses across Nagpur, Indore, Raipur, Hyderabad and Jabalpur.",
  openGraph: {
    type: "website",
    siteName: "My Digital Savvy",
    title: "My Digital Savvy — Digital marketing agency in Nagpur",
    description:
      "My Digital Savvy runs Meta Ads, builds websites and creates content for businesses across Nagpur, Indore, Raipur, Hyderabad and Jabalpur.",
    url: "https://mydigitalsavvy.com/",
  },
  twitter: {
    card: "summary",
    title: "My Digital Savvy — Digital marketing agency in Nagpur",
    description:
      "My Digital Savvy runs Meta Ads, builds websites and creates content for businesses across Nagpur, Indore, Raipur, Hyderabad and Jabalpur.",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable}`}>
      <body className="bg-background text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}
