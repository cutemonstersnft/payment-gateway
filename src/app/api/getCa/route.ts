import { NextResponse } from "next/server";

interface Token {
  symbol: string;
  address: string;
  name: string;
  [key: string]: any;
}

export async function GET(req: Request) {
  try {
    // Get symbol from query params
    const { searchParams } = new URL(req.url);
    const rawSymbol = searchParams.get("symbol");

    if (!rawSymbol) {
      return NextResponse.json(
        { error: "Symbol parameter is required" },
        { status: 400 }
      );
    }

    const symbol = rawSymbol.toUpperCase();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(
      "https://api.jup.ag/tokens/v1/tagged/verified",
      {
        signal: controller.signal,
        headers: {
          Accept: "application/json",
        },
      }
    );


    clearTimeout(timeoutId);

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch token data" },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // Find the exact token with matching symbol
    const token = (data as Token[]).find(
      (token) => token.symbol.toUpperCase() === symbol
    );

    if (!token) {
      return NextResponse.json({ error: "Token not found" }, { status: 404 });
    }

    // Return token details
    return NextResponse.json({
      symbol: token.symbol,
      mint: token.address,
      name: token.name,
      decimals: token.decimals,
      logoURI: token.logoURI,
      tags: token.tags,
      daily_volume: token.daily_volume,
      created_at: token.created_at
    });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
