import { PublicKey } from "@solana/web3.js";

export const programID = new PublicKey(
  "7MtYccqQ745U3ohVr6YVibhpvZCMHUer11BR69zYjrZw"
);

export const getVaultPDA = (publicKey: PublicKey) => {
  const [vaultPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from("vault"), publicKey.toBuffer()],
    programID
  );
  return vaultPDA;
};

export const getCounterPDA = (publicKey: PublicKey) => {
  const [counterPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from("counter"), publicKey.toBuffer()],
    programID
  );

  return counterPDA;
};

export type SolanaVault = {
  version: "0.1.0";
  name: "hello_anchor";
  instructions: [
    {
      name: "deposit";
      accounts: [
        { name: "userVaultAccount"; isMut: true; isSigner: false },
        { name: "userInteractionsCounter"; isMut: true; isSigner: false },
        { name: "signer"; isMut: true; isSigner: true },
        { name: "systemProgram"; isMut: false; isSigner: false }
      ];
      args: [{ name: "amount"; type: "u64" }];
    },
    {
      name: "withdraw";
      accounts: [
        { name: "userVaultAccount"; isMut: true; isSigner: false },
        { name: "userInteractionsCounter"; isMut: true; isSigner: false },
        { name: "signer"; isMut: true; isSigner: true },
        { name: "systemProgram"; isMut: false; isSigner: false }
      ];
      args: [{ name: "amount"; type: "u64" }];
    }
  ];
  accounts: [
    {
      name: "userInteractions";
      type: {
        kind: "struct";
        fields: [
          { name: "totalDeposits"; type: "u64" },
          { name: "totalWithdrawals"; type: "u64" }
        ];
      };
    }
  ];
};
