import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css"; // <--- A LINHA MÁGICA QUE CARREGA O ESTILO

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Organize.ia",
  description: "AI Productivity System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.className} bg-[#0f1115] text-slate-200 antialiased`}>
        {children}
      </body>
    </html>
  );
}