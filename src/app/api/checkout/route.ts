import {
  Connection,
  PublicKey,
  Transaction,
  ComputeBudgetProgram,
  SystemProgram,
} from "@solana/web3.js";
import type { NextRequest } from "next/server";

export type MakeTransactionGetResponse = {
  label: string;
  icon: string;
};

export async function GET(request: NextRequest) {
  return new Response(
    JSON.stringify({
      label: "Solana Pay Checkout",
      icon: "", // TODO: add icon
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
}

export async function POST(request: NextRequest) {
  try {
    // Use nextUrl.searchParams directly instead of creating new URL
    const searchParams = request.nextUrl.searchParams;
    console.log("Search Params:", Object.fromEntries(searchParams));

    const amount = searchParams.get("amount");
    const tokenMint = searchParams.get("tokenMint");

    console.log("Amount:", amount);
    console.log("Token Mint:", tokenMint);

    // Parse the request body
    const body = await request.json();
    console.log("Parsed Body:", body);
    const account = body.account;

    const buyerPubKey = new PublicKey(account);

    const connection = new Connection(
      "https://mainnet.helius-rpc.com/?api-key=d2f90a57-4fe4-4543-a875-4c13663556f1"
    ); // rpc url

    const [{ blockhash, lastValidBlockHeight }] = await Promise.all([
      connection.getLatestBlockhash(),
    ]);

    const transaction = new Transaction({
      feePayer: buyerPubKey,
      blockhash,
      lastValidBlockHeight,
    });

    const transferTipInstruction = SystemProgram.transfer({
      fromPubkey: buyerPubKey,
      lamports: 2000,
      toPubkey: new PublicKey("HFqU5x63VTqvQss8hp11i4wVV8bD44PvwucfZ2bU7gRe"),
    }); // jito tip address

    // transferTipInstruction.keys.push({
    //   pubkey: referenceKey.publicKey,
    //   isSigner: false,
    //   isWritable: false,
    // });

    transaction.add(transferTipInstruction);

    // const computePriceIx = ComputeBudgetProgram.setComputeUnitPrice({
    //   microLamports: 80000,
    // });

    // const computeLimitIx = ComputeBudgetProgram.setComputeUnitLimit({
    //   units: 200_000,
    // });

    // computePriceIx.keys.push({
    //   pubkey: buyerPubKey,
    //   isSigner: true,
    //   isWritable: false,
    // });

    // transaction.add(computePriceIx, computeLimitIx);

    const serializedTransaction = transaction.serialize({
      requireAllSignatures: false,
    });
    const base64 = serializedTransaction.toString("base64");

    const message = "Thank you for your purchase!";

    return new Response(JSON.stringify({ transaction: base64, message }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Error in transaction processing:", err);
    return new Response(
      JSON.stringify({ error: "Error creating transaction" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
