import "./globals.css";
import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import { Web3Provider } from "@/components/web3-provider";
import { Toaster } from "@/components/ui/toaster";

const outfit = Outfit({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Solana Vault",
  description: "Deposit and Claim $SOL",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <Web3Provider>
        <body className={outfit.className}>
          {children}
          <Toaster />
        </body>
      </Web3Provider>
    </html>
  );
}
