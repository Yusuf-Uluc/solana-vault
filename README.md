# Solana Vault Demo

<div style="display: flex; flex-direction: column; align-items: center">

<img src="./public/wad_logo.svg" width="100"/>
<p style="font-size:25px; text-align: center; margin: 20px 0; font-weight: medium">
Demo dApp for the WeAreDevelopers World Congress.
<p/>
<img src="./assets/preview.png" />

</div>

<br/>

## Purpose

The purpose of this demo is to grasp the following concepts:

- What's an IDL?
- Interact with contracts that were built with Anchor
- Storing data on PDAs (Program Derived Addresses)
- Transfering funds from user to a PDA
- Transfering funds from a PDA to user

## What's an IDL?

An IDL (Interface Definition Language) is a way to define how objects can be used by other programs. It helps describe what functions and features those objects offer to other parts of the program, making it easier for clients to interact with these interfaces.

In the code below, we have a snippet from the IDL of our program. Let's break down the `deposit` instruction:

```json
{
  "instructions": [
    {
      "name": "deposit",
      "accounts": [
        { "name": "userVaultAccount", "isMut": true, "isSigner": false },
        {
          "name": "userInteractionsCounter",
          "isMut": true,
          "isSigner": false
        },
        { "name": "signer", "isMut": true, "isSigner": true },
        { "name": "systemProgram", "isMut": false, "isSigner": false }
      ],
      "args": [{ "name": "amount", "type": "u64" }]
    }
  ],
  "accounts": [
    {
      "name": "UserInteractions",
      "type": {
        "kind": "struct",
        "fields": [
          { "name": "totalDeposits", "type": "u64" },
          { "name": "totalWithdrawals", "type": "u64" }
        ]
      }
    }
  ]
}
```

### 1. Deposit Instruction:

**Accounts** <br/>
This section lists the accounts that are required for executing this instruction. An account can be mutable (can be modified during the instruction) or immutable (cannot be modified during the instruction). It can also be a signer (required to sign the transaction). In this case, the "deposit" instruction requires four accounts:

- `userVaultAccount`: This account represents the user's vault where funds will be deposited or withdrawn. It is mutable (isMut: true) but not a signer (isSigner: false), meaning it can be modified during the instruction, but is not responsible for signing the transaction.

- `userInteractionsCounter`: This is another account, presumably used to keep track of the total interactions with the contract. It is mutable (it's data can be updated) but not a signer.

- `signer`: This refers to an account that must sign the transaction. It is both mutable and a signer, meaning it can be modified and is required to sign the transaction.

- `systemProgram`: This is a built-in system program account required for certain operations. You usually have to include this in every instruction.

**Args**<br/>
This section specifies the arguments required for the `deposit` instruction. In this case, it expects a single argument:

- `amount`: This is of type "u64," which represents an unsigned 64-bit integer. This specifies the amount to be deposited to the `userVaultAccount`.

### 2. UserInteractions Account

The account with the name `UserInteractions` is a (rust) struct with the fields `totalDeposits` and `totalWithdrawls`. Both fields are of the type u64.

## How to interact with our Program using the IDL?

Now that we've learnt how IDLs work, we'll look into how we can use them to interact with our program from a React frontend.

First we have to define a provider:

```ts
const connection = new Connection("https://api.devnet.solana.com");
// this hook comes with the @solana/wallet-adapter-react package.
// We need to connect our wallet first, otherwise `wallet` will be undefined.
const wallet = useAnchorWallet();

const provider = new AnchorProvider(
  connection,
  wallet,
  AnchorProvider.defaultOptions()
);
```

Now we can use this provider to create a program object:

```ts
import idl from "/your/path/idl.json";

const programID = "YOUR_PROGRAM_ID";

type ProgramNameIDL = {
  // IDL goes here...
};

// By using the `ProgramNameIDL` type we signifficantly improve the DX.
// By doing so the IDE will be able to provide us with autocompletion and type checking.
const program = new Program<ProgramNameIDL>(idl as any, programID, provider);
```

Once you have the program object, you can finally interact with your on-chain program:

```ts
// Get PDAs by calling `PublicKey.findProgramAddressSync`
const [vaultPDA] = PublicKey.findProgramAddressSync(
  // Pass in the seeds you defined in the contract
  [Buffer.from("vault"), publicKey.toBuffer()],
  // The PublicKey of your program
  programID
);

// Now do the same for the counter account
const [counterPDA] = PublicKey.findProgramAddressSync(
  // Pass in the seeds you defined in the contract
  [Buffer.from("counter"), publicKey.toBuffer()],
  // The PublicKey of your program
  programID
);

// Now we can call the instruction and get a transaction signature back
const txSig = await program.methods
  .deposit(
    // Pass in Args (amount)
    new BN(amountToDeposit)
  )
  .accounts({
    // Pass in Accounts (userVaultAccount, userInteractionsCounter, systemProgram, signer)
    userVaultAccount: vaultPDA, // PublicKey of the vault account
    userInteractionsCounter: counterPDA, // PublicKey of the userInteractionsCounter account
    systemProgram: SystemProgram.programId, // PublicKey of Solana's system program
    signer: publicKey, // The signer (in this case) is the public key of our user
  })
  // The rpc method sends the transaction to the cluster
  // and returns the transaction signature.
  .rpc();

console.log(`Transaction Signature: ${txSig}`);
```

If you want to fetch the data from the program, you can do so by calling the `fetch` method:

```ts
const [counterPDA] = PublicKey.findProgramAddressSync(
  // Pass in the seeds you defined in the contract
  [Buffer.from("counter"), publicKey.toBuffer()],
  // The PublicKey of your program
  programID
);

const counterData = program.accounts.userInteractionsCounter.fetch(counterPDA);

console.log(`Counter Data: ${counterData}`);
```

To find out the balance of the `vaultPDA` you don't need to fetch the data stored on the account but instead use an rpc to get the account's balance.

```ts
import { LAMPORTS_PER_SOL } from "@solana/web3.js";

const [vaultPDA] = PublicKey.findProgramAddressSync(
  [Buffer.from("vault"), publicKey.toBuffer()],
  programID
);

const vaultBalance = await connection.getBalance(vaultPDA);

console.log(`Balance in Lamports: ${vaultBalance}`); // 1 SOL = 1,000,000,000 Lamports
console.log(`Balance in SOL: ${vaultBalance / LAMPORTS_PER_SOL}`);
```

If you want to get a stream of data from an account, you can use the `subscribe` method (websocket):

```ts
// Create a websocket connection
program.account.userInteractions
  .subscribe(counterPDA, "processed")
  .on("change", (data: { totalDeposits: BN; totalWithdrawals: BN }) => {
    console.log(`Total Deposits: ${data.totalDeposits}`);
    console.log(`Total Withdrawals: ${data.totalWithdrawals}`);
  });
```

## Putting it all together

Now that we've learnt how to interact with our program, you can create a simple Frontend using React, Vue or any other framework of your choice. In this example I used Next.js.

The UI was built using Tailwind CSS and shadcn.

## How to run the demo?

1. Clone the repo
2. Run `yarn` to install the dependencies
3. Run `yarn dev` to start the dev server
4. Open `localhost:3000` in your browser
5. Enjoy!

## Smart Contract

```rs
use anchor_lang::prelude::*;
use anchor_lang::system_program;

// This is your program's public key and it will update
// automatically when you build the project.
declare_id!("7MtYccqQ745U3ohVr6YVibhpvZCMHUer11BR69zYjrZw");

#[program]
mod hello_anchor {
    use super::*;
    pub fn deposit(ctx: Context<Deposit>, amount: u64) -> Result<()> {
        system_program::transfer(
            CpiContext::new(
                ctx.accounts.system_program.to_account_info(),
                system_program::Transfer {
                    from: ctx.accounts.signer.to_account_info(),
                    to: ctx.accounts.user_vault_account.to_account_info(),
                },
            ),
            amount,
        )?;

        ctx.accounts.user_interactions_counter.total_deposits += 1;

        Ok(())
    }

    pub fn withdraw(ctx: Context<Withdraw>, amount: u64) -> Result<()> {
        let bump = *ctx.bumps.get("user_vault_account").unwrap();

        let ix = anchor_lang::solana_program::system_instruction::transfer(
            &ctx.accounts.user_vault_account.key(),
            &ctx.accounts.signer.key(),
            amount,
        );
        anchor_lang::solana_program::program::invoke_signed(
            &ix,
            &[
                ctx.accounts.user_vault_account.to_account_info(),
                ctx.accounts.signer.to_account_info(),
            ],
            &[&[b"vault", ctx.accounts.signer.key().as_ref(), &[bump]]],
        )?;

        ctx.accounts.user_interactions_counter.total_withdrawals += 1;

        Ok(())
    }
}

#[derive(Accounts)]
pub struct Deposit<'info> {
    #[account(mut, seeds=[b"vault", signer.key().as_ref()], bump)]
    pub user_vault_account: AccountInfo<'info>,
    #[account(init_if_needed, space = 16 + 8, seeds=[b"counter", signer.key().as_ref()], bump, payer = signer)]
    pub user_interactions_counter: Account<'info, UserInteractions>,
    #[account(mut)]
    pub signer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Withdraw<'info> {
    #[account(mut, seeds=[b"vault", signer.key().as_ref()], bump)]
    pub user_vault_account: AccountInfo<'info>,
    #[account(mut, seeds=[b"counter", signer.key().as_ref()], bump)]
    pub user_interactions_counter: Account<'info, UserInteractions>,
    #[account(mut)]
    pub signer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[account]
pub struct UserInteractions {
    total_deposits: u64,
    total_withdrawals: u64,
}
```

### Tests

```ts
describe("Test", () => {
  const userVaultAccount = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("vault"), pg.wallet.publicKey.toBuffer()],
    pg.program.programId
  )[0];

  const totalInteractionsAccount = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("counter"), pg.wallet.publicKey.toBuffer()],
    pg.program.programId
  )[0];

  it("Deposit into Vault", async () => {
    // Send transaction
    const amount = new BN(100000000);
    const depositTx = await pg.program.methods
      .deposit(amount)
      .accounts({
        userVaultAccount: userVaultAccount,
        signer: pg.wallet.publicKey,
        userInteractionsCounter: totalInteractionsAccount,
        systemProgram: web3.SystemProgram.programId,
      })
      .rpc();

    // Confirm transaction
    await pg.connection.confirmTransaction(depositTx);

    // Fetch the created account
    const vaultData = await pg.program.account.userInteractions.fetch(
      totalInteractionsAccount
    );

    console.log("On-chain data is:", vaultData.totalDeposits);
  });

  it("Withdraw from vault", async () => {
    // Send transaction
    const amount = new BN(10000000);
    const depositTx = await pg.program.methods
      .withdraw(amount)
      .accounts({
        userVaultAccount: userVaultAccount,
        signer: pg.wallet.publicKey,
        userInteractionsCounter: totalInteractionsAccount,
        systemProgram: web3.SystemProgram.programId,
      })
      .signers([pg.wallet.keypair])
      .rpc();

    // Confirm transaction
    await pg.connection.confirmTransaction(depositTx);
  });
});
```
