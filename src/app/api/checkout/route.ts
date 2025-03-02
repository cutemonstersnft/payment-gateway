import {
  Connection,
  PublicKey,
  SystemProgram,
  TransactionInstruction,
  VersionedTransaction,
  TransactionMessage,
  AddressLookupTableAccount,
} from "@solana/web3.js";
import type { NextRequest } from "next/server";
import { getAssociatedTokenAddress } from "@solana/spl-token";
export type MakeTransactionGetResponse = {
  label: string;
  icon: string;
};

export async function GET(request: NextRequest) {
  return new Response(
    JSON.stringify({
      label: "Solana Pay Checkout",
      icon: "https://cdnmonstre.xyz/solana_logo.webp",
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
}

export async function POST(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    console.log("Search Params:", Object.fromEntries(searchParams));

    const amount = searchParams.get("amount");
    const tokenMint = searchParams.get("tokenMint");
    const reference = searchParams.get("reference");
    const shopPublicKey = searchParams.get("shopPublicKey");

    if (!amount || !tokenMint || !reference || !shopPublicKey) {
      return new Response(
        JSON.stringify({ error: "Missing required parameters" }),
        { status: 400 }
      );
    }

    // Parse the request body
    const body = await request.json();
    console.log("Parsed Body:", body);
    const account = body.account;

    const buyerPubKey = new PublicKey(account);
    const USDC_MINT = new PublicKey(
      "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
    );

    const shopUsdcAddress = await getAssociatedTokenAddress(
      USDC_MINT,
      new PublicKey(shopPublicKey)
    );

    console.log("Shop USDC Address:", shopUsdcAddress.toString());

    // Format amount properly for USDC's 6 decimals
    // If amount is in human-readable format (e.g., 1.5), convert to lamports/smallest unit
    // Always convert to USDC's 6 decimal places (1 USDC = 1,000,000 base units)
    const formattedAmount = (parseFloat(amount) * 1_000_000).toString();

    console.log("Formatted Amount for USDC (6 decimals):", formattedAmount);

    const connection = new Connection(
      "https://api.mainnet-beta.solana.com"
    );

    // Set up abort controller for API requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      // 1. Get quote for exact output amount (USDC)
      const quoteResponse = await fetch(
        `https://api.jup.ag/swap/v1/quote?inputMint=${tokenMint}&outputMint=${USDC_MINT.toString()}&amount=${formattedAmount}&slippageBps=50&swapMode=ExactOut`,
        {
          signal: controller.signal,
          headers: {
            Accept: "application/json",
          },
        }
      );

      if (!quoteResponse.ok) {
        console.error(
          "Quote response not OK:",
          quoteResponse.status,
          quoteResponse.statusText
        );
        return new Response(
          JSON.stringify({ error: "Failed to fetch quote" }),
          { status: 500, headers: { "Content-Type": "application/json" } }
        );
      }

      const quoteData = await quoteResponse.json();
      console.log("Quote Data:", quoteData);

      // 2. Get swap instructions instead of a complete transaction
      const instructionsResponse = await fetch(
        "https://api.jup.ag/swap/v1/swap-instructions",
        {
          method: "POST",
          signal: controller.signal,
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            quoteResponse: quoteData,
            userPublicKey: buyerPubKey.toString(),
            dynamicComputeUnitLimit: true,
            dynamicSlippage: true,
            destinationTokenAccount: shopUsdcAddress.toString(),
          }),
        }
      );

      if (!instructionsResponse.ok) {
        console.error(
          "Instructions response not OK:",
          instructionsResponse.status,
          instructionsResponse.statusText
        );
        return new Response(
          JSON.stringify({ error: "Failed to create swap instructions" }),
          { status: 500, headers: { "Content-Type": "application/json" } }
        );
      }

      const instructions = await instructionsResponse.json();
      console.log("Instructions Data:", instructions);

      if (instructions.error) {
        throw new Error(
          "Failed to get swap instructions: " + instructions.error
        );
      }

      // 3. Get the latest blockhash
      const { blockhash } =
        await connection.getLatestBlockhash();

      // 4. Helper function to deserialize instructions
      interface InstructionData {
        programId: string;
        accounts: Array<{
          pubkey: string;
          isSigner: boolean;
          isWritable: boolean;
        }>;
        data: string;
      }

      const deserializeInstruction = (instruction: InstructionData) => {
        return new TransactionInstruction({
          programId: new PublicKey(instruction.programId),
          keys: instruction.accounts.map((key) => ({
            pubkey: new PublicKey(key.pubkey),
            isSigner: key.isSigner,
            isWritable: key.isWritable,
          })),
          data: Buffer.from(instruction.data, "base64"),
        });
      };

      // 5. Create a tip instruction
      const transferTipInstruction = SystemProgram.transfer({
        fromPubkey: buyerPubKey,
        lamports: 8000,
        toPubkey: new PublicKey("HFqU5x63VTqvQss8hp11i4wVV8bD44PvwucfZ2bU7gRe"),
      });

      transferTipInstruction.keys.push({
        pubkey: new PublicKey(reference),
        isSigner: false,
        isWritable: false,
      });

      // 6. Get address lookup table accounts if needed
      const getAddressLookupTableAccounts = async (keys: string[]) => {
        if (!keys || keys.length === 0) return [];

        const addressLookupTableAccountInfos =
          await connection.getMultipleAccountsInfo(
            keys.map((key) => new PublicKey(key))
          );

        return addressLookupTableAccountInfos.reduce(
          (acc: AddressLookupTableAccount[], accountInfo, index) => {
            const addressLookupTableAddress = keys[index];
            if (accountInfo) {
              const addressLookupTableAccount = new AddressLookupTableAccount({
                key: new PublicKey(addressLookupTableAddress),
                state: AddressLookupTableAccount.deserialize(accountInfo.data),
              });
              acc.push(addressLookupTableAccount);
            }
            return acc;
          },
          []
        );
      };

      const addressLookupTableAccounts = await getAddressLookupTableAccounts(
        instructions.addressLookupTableAddresses || []
      );

      // 7. Construct all the instructions we need
      const allInstructions = [
        // Add compute budget instructions if they exist
        ...(instructions.computeBudgetInstructions || []).map(
          deserializeInstruction
        ),
        // Add setup instructions if they exist
        ...(instructions.setupInstructions || []).map(deserializeInstruction),
        // Add the main swap instruction
        deserializeInstruction(instructions.swapInstruction),
        // Add cleanup instruction if it exists
        ...(instructions.cleanupInstruction
          ? [deserializeInstruction(instructions.cleanupInstruction)]
          : []),
        // Add our tip instruction
        transferTipInstruction,
      ];

      // 8. Create a versioned transaction
      const messageV0 = new TransactionMessage({
        payerKey: buyerPubKey,
        recentBlockhash: blockhash,
        instructions: allInstructions,
      }).compileToV0Message(addressLookupTableAccounts);

      const transaction = new VersionedTransaction(messageV0);

      // 9. Serialize the transaction
      const serializedTransaction = transaction.serialize();
      const base64 = Buffer.from(serializedTransaction).toString("base64");

      const message = "Thank you for your purchase!";

      return new Response(JSON.stringify({ transaction: base64, message }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } finally {
      clearTimeout(timeoutId);
    }
  } catch (err: any) {
    console.error("Error in transaction processing:", err);
    return new Response(
      JSON.stringify({
        error: "Error creating transaction",
        details: err.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
