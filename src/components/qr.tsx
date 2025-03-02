"use client";

import { useState, useEffect } from "react";
import QRCode from "react-qr-code";
import { useSearchParams, useRouter } from "next/navigation";
import { Connection, PublicKey } from "@solana/web3.js";
import { findReference, FindReferenceError } from "@solana/pay";

export default function QrCode() {
  const [qrUrl, setQrUrl] = useState<string>("");
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const amount = searchParams.get("amount");
    const tokenMint = searchParams.get("tokenMint");
    const reference = searchParams.get("reference");
    const shopPublicKey = searchParams.get("shopPublicKey");

    if (amount && tokenMint && reference && shopPublicKey) {
      // Use the current origin instead of hardcoded URL
      const baseUrl = `${window.location.origin}/api/checkout`;
      const params = new URLSearchParams({
        amount,
        tokenMint,
        reference,
        shopPublicKey,
      }).toString();
      const encodedUrl = encodeURIComponent(`${baseUrl}?${params}`);

      // Create the Solana URL with encoded part after solana:
      const url = `solana:${encodedUrl}`;
      setQrUrl(url);
    }
  }, [searchParams]);

  // Add polling for transaction confirmation
  useEffect(() => {
    const reference = searchParams.get("reference");

    if (!reference) return;

    // Create connection to Solana network
    const connection = new Connection(
      "https://api.mainnet-beta.solana.com"
    );

    // Convert reference string to PublicKey
    const referencePublicKey = new PublicKey(reference);

    const interval = setInterval(async () => {
      try {
        // Check if there is any transaction for the reference
        const signatureInfo = await findReference(
          connection,
          referencePublicKey,
          { finality: "confirmed" }
        );

        // If we get here, a transaction with this reference exists and is confirmed
        console.log("Transaction found:", signatureInfo.signature);

        // Navigate to success page
        router.push("/success");
      } catch (e) {
        if (e instanceof FindReferenceError) {
          // No transaction found yet, ignore this error
          return;
        }
        console.error("Unknown error", e);
      }
    }, 500);

    return () => {
      clearInterval(interval);
    };
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <h1 className="text-2xl mb-4">Scan to Pay</h1>
      {qrUrl && (
        <div style={{ background: "white", padding: "16px" }}>
          <QRCode
            size={256}
            style={{ height: "auto", maxWidth: "100%", width: "100%" }}
            value={qrUrl}
            viewBox={`0 0 256 256`}
            fgColor="#000000"
            bgColor="#FFFFFF"
            level="L"
          />
        </div>
      )}
      <p className="mt-4 text-center text-sm text-gray-500">
        Waiting for payment confirmation...
      </p>
    </div>
  );
}
