import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import { AuthProvider } from "./context/AuthContext";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
});

export const metadata: Metadata = {
  title: "StockGuessr | Trade & Compete",
  description: "1v1 trading game where you compete against others in stock prediction challenges",
  keywords: ["trading", "game", "stock", "prediction", "competition"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} ${spaceGrotesk.variable} overflow-x-hidden`}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
