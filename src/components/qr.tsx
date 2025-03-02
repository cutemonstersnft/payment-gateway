"use client";

import { useState, useEffect } from "react";
import QRCode from "react-qr-code";
import { useSearchParams } from 'next/navigation';

export default function QrCode() {
  const [qrUrl, setQrUrl] = useState<string>("");
  const searchParams = useSearchParams();
  
  useEffect(() => {
    const amount = searchParams.get('amount');
    const tokenMint = searchParams.get('tokenMint');
    
    if (amount && tokenMint) {
      // Encode the URL part after solana:
      const baseUrl = 'https://7452-218-212-33-201.ngrok-free.app/api/checkout';
      const params = new URLSearchParams({ amount, tokenMint }).toString();
      const encodedUrl = encodeURIComponent(`${baseUrl}?${params}`);
      
      // Create the Solana URL with encoded part after solana:
      const url = `solana:${encodedUrl}`;
      setQrUrl(url);
      
      // Log the final URL to verify
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <h1 className="text-2xl mb-4">Scan to Pay</h1>
      {qrUrl && (
        <div style={{ background: 'white', padding: '16px' }}>
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
    </div>
  );
}
