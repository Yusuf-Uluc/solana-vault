"use client";

import { ArrowUp, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useCallback, useEffect, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { Badge } from "@/components/ui/badge";
import { LAMPORTS_PER_SOL, PublicKey, SystemProgram } from "@solana/web3.js";
import Image from "next/image";
import {
  SolanaVault,
  getCounterPDA,
  getVaultPDA,
  programID,
} from "@/utils/anchor";
import { useSolanaProvider } from "@/hooks/solanaProvider";
import { BN, Program } from "@coral-xyz/anchor";
import idl from "@/utils/idl.json";
import { useToast } from "@/components/ui/use-toast";

export function DepositCard() {
  const { publicKey, connected, sendTransaction, signTransaction } =
    useWallet();
  const { connection } = useConnection();
  const provider = useSolanaProvider();
  const toast = useToast();

  const [userBalance, setUserBalance] = useState(0);
  const [vaultBalance, setVaultBalance] = useState(0);
  const [amount, setAmount] = useState<number>();
  const [isLoading, setIsLoading] = useState(false);
  const [interactionsData, setInteractionsData] = useState<{
    totalDeposits: number;
    totalWithdrawals: number;
  }>();

  const correctAmount = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      try {
        const value = e.target.valueAsNumber;
        if (value < 0) {
          // If the value is negative or NaN set it to 0
          setAmount(0);
        } else if (value * LAMPORTS_PER_SOL > userBalance) {
          // If the value is greater than the user balance set it to the user balance - 0.000001 padding
          setAmount(userBalance / LAMPORTS_PER_SOL - 0.000001);
        } else {
          // Otherwise set the amount to the value
          setAmount(value);
        }
      } catch (e) {}
    },
    [userBalance, setAmount]
  );

  const onMoveFunds = async (type: "deposit" | "withdraw") => {
    if (!provider || !publicKey || !sendTransaction) return;

    // The program variable is an instance of the Program class.
    // It takes our program's idl and the programId as arguments.
    // Using the idl it generates a set of methods that can be called on the program.
    // The programID is the public key of the program. It is used to interact with the program on-chain.
    const program = new Program<SolanaVault>(idl as any, programID, provider);

    setIsLoading(true);

    try {
      const counterPDA = getCounterPDA(publicKey);
      const userVaultPDA = getVaultPDA(publicKey);

      // The sig variable is the transaction signature.
      // It is used to track the transaction on-chain.
      let sig: string | undefined;

      if (type === "deposit") {
        sig = await program.methods
          .deposit(new BN(amount! * LAMPORTS_PER_SOL))
          .accounts({
            totalInteractionsCounter: counterPDA,
            userVaultAccount: userVaultPDA, // The userVaultPDA is the public key of the user's vault account.
            systemProgram: SystemProgram.programId, //  The systemProgram is the public key of the system program (Constant).
            signer: publicKey, // The signer is the public key of our user.
          })
          .rpc(); // The rpc method sends the transaction to the cluster and returns the transaction signature.
      }
      if (type === "withdraw") {
        sig = await program.methods
          .withdraw(new BN(amount! * LAMPORTS_PER_SOL))
          .accounts({
            totalInteractionsCounter: counterPDA,
            userVaultAccount: userVaultPDA, // The userVaultPDA is the public key of the user's vault account.
            systemProgram: SystemProgram.programId, //  The systemProgram is the public key of the system program (Constant).
            signer: publicKey, // The signer is the public key of our user.
          })
          .rpc(); // The rpc method sends the transaction to the cluster and returns the transaction signature.
      }

      console.log("Transaction Signature: ", sig);
      toast.toast({
        title: "Succes!",
        description: "Your transaction was succesful",
      });

      // After the transaction is sent we update the balances of the user and the vault.
      await Promise.all([setBalances(), setInteractions()]);
    } catch (err) {
      console.log("Transaction Error: ", err);
      toast.toast({
        title: "Error!",
        description: "Your transaction failed",
      });
    }
    setIsLoading(false);
  };

  const setBalances = async () => {
    if (!publicKey || !connected) return;

    const userVaultPDA = getVaultPDA(publicKey);

    // We use Promise.all to run both requests at the same time.
    await Promise.all([
      connection.getBalance(publicKey).then((balance) => {
        setUserBalance(balance);
      }),
      connection.getBalance(userVaultPDA).then((balance) => {
        setVaultBalance(balance);
      }),
    ]);
  };

  const setInteractions = async () => {
    if (!publicKey || !connected) return;

    const counterPDA = getCounterPDA(publicKey);

    const program = new Program<SolanaVault>(idl as any, programID, provider);

    const data = await program.account.TotalInteractions.fetch(counterPDA);

    setInteractionsData({
      totalDeposits: data.totalDeposits.toNumber(),
      totalWithdrawals: data.totalWithdrawals.toNumber(),
    });
  };

  useEffect(() => {
    // If the user is not connected we set the balances to 0.
    if (connected === false) {
      setUserBalance(0);
      setVaultBalance(0);
      return;
    }
    if (!publicKey) return;

    // If the user is connected we fetch and set the balances and interactions.
    setBalances();
    setInteractions();
  }, [publicKey, connected]);

  return (
    <Card
      className={`w-[450px] transition-all duration-500 ${
        isLoading &&
        "animate-pulse duration-1000 pointer-events-none cursor-not-allowed grayscale"
      } ${
        !connected && "pointer-events-none cursor-not-allowed grayscale blur-sm"
      }`}
    >
      <CardHeader>
        <CardTitle className="flex flex-row items-center space-x-3">
          <p>Move Funds</p>
          <Badge variant="outline" className="font-light text-sm space-x-1">
            <Image src="/solana.png" alt="" width={12} height={12} />
            <p>{(userBalance / LAMPORTS_PER_SOL).toFixed(2)}</p>
          </Badge>
        </CardTitle>
        <CardDescription>
          Deposit or withdraw funds from your vault.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="p-5 space-y-4 flex flex-col items-center justify-center rounded-md border">
          <p className="text-sm font-normal text-white/80">
            Current Vault Balance
          </p>
          <p className="text-3xl font-semibold">
            {(vaultBalance / LAMPORTS_PER_SOL).toFixed(2)}
          </p>
        </div>

        <div className="flex flex-row space-x-2">
          <div className="w-full p-2 text-center rounded-md border">
            <p>{interactionsData?.totalDeposits ?? 0}</p>
            <p className="text-sm text-white/50 font-light">Deposits</p>
          </div>
          <div className="w-full p-2 text-center rounded-md border">
            <p>{interactionsData?.totalWithdrawals ?? 0}</p>
            <p className="text-sm text-white/50 font-light">Withdrawls</p>
          </div>
        </div>

        <Input
          type="number"
          placeholder="Amount"
          min={0}
          onChange={correctAmount}
          value={amount}
        />
      </CardContent>

      <CardFooter className="space-x-2">
        <Button
          variant="outline"
          className="w-full text-red-500 hover:bg-red-700"
          disabled={
            amount === 0 ||
            !amount ||
            isLoading ||
            !connected ||
            userBalance === 0 ||
            amount * LAMPORTS_PER_SOL > userBalance
          }
          onClick={() => onMoveFunds("deposit")}
        >
          <ArrowDown className="mr-2 h-4 w-4" /> Deposit
        </Button>
        <Button
          variant="outline"
          className="w-full text-green-500 hover:bg-green-700"
          disabled={
            amount === 0 ||
            !amount ||
            isLoading ||
            !connected ||
            vaultBalance === 0 ||
            amount * LAMPORTS_PER_SOL > vaultBalance
          }
          onClick={() => onMoveFunds("withdraw")}
        >
          <ArrowUp className="mr-2 h-4 w-4" /> Withdraw
        </Button>
      </CardFooter>
    </Card>
  );
}
