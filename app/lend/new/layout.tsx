import type { Metadata } from "next";
import { Inter } from "next/font/google";
import '../../globals.css';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "bond nft - new bond",
  description: "this is where you will lend to a borrower",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
