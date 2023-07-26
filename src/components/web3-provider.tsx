"use client";

import * as React from "react";
import { Adapter, WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { clusterApiUrl } from "@solana/web3.js";

export function Web3Provider({ children }: { children: React.ReactNode }) {
  // The network can be set to 'devnet', 'testnet', or 'mainnet-beta'.
  // We will be using devnet for this example.
  const network = WalletAdapterNetwork.Devnet;

  // You can also provide a custom RPC endpoint.
  const endpoint = React.useMemo(() => clusterApiUrl(network), [network]);

  // By using an empty array the wallet will default to the wallets the user has installed.
  const wallets: Adapter[] = [];
  return (
    <ConnectionProvider
      endpoint={endpoint}
      config={{
        // We're setting the commitment to 'processed'.
        // This lets us read data that has been confirmed by the cluster but not yet finalized.
        // This means that the data we're reading is most likely what will end up on-chain but is not guaranteed.
        commitment: "processed",
      }}
    >
      <WalletProvider wallets={wallets}>{children}</WalletProvider>
    </ConnectionProvider>
  );
}
