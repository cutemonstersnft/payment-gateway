"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import debounce from "lodash/debounce";
import { Search, Loader } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface TokenInfo {
  symbol: string;
  mint: string;
  name: string;
  logoURI: string;
}

export default function Checkout() {
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [tokenResults, setTokenResults] = useState<TokenInfo | null>(null);
  const [selectedToken, setSelectedToken] = useState<TokenInfo | null>(null);

  const debouncedSearch = debounce(async (term: string) => {
    if (!term) {
      setTokenResults(null);
      return;
    }

    const toastId = toast.loading('Searching for token...');
    setIsLoading(true);
    
    try {
      const response = await fetch(`/api/getCa?symbol=${term}`);
      const data = await response.json();
      setTokenResults(data);
    } catch (error) {
      console.error("Error fetching token:", error);
      toast.error('Failed to fetch token');
    } finally {
      setIsLoading(false);
      toast.dismiss(toastId);
    }
  }, 2000);

  useEffect(() => {
    debouncedSearch(searchTerm);
    return () => debouncedSearch.cancel();
  }, [searchTerm]);

  const formatMint = (mint: string) => {
    if (!mint) return "";
    return `${mint.slice(0, 5)}...${mint.slice(-5)}`;
  };

  const handleTokenSelect = (token: TokenInfo) => {
    setSelectedToken(token);
    setSearchTerm("");
    setTokenResults(null);
  };

  const handleCheckout = () => {
    if (!amount || !selectedToken) return;
    
    const searchParams = new URLSearchParams({
      amount: amount,
      tokenMint: selectedToken.mint
    });

    router.push(`/checkout?${searchParams.toString()}`);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-[400px]">
        <CardHeader>
          <CardTitle>Checkout</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="amount">Amount (USDC)</Label>
            <Input
              id="amount"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="Enter USDC amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="text-base [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
          </div>

          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="token">Token</Label>
            <div className="relative">
              <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
              <Input
                id="token"
                type="text"
                placeholder="Search token symbol..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>

            {selectedToken && !searchTerm && (
              <div className="flex items-center gap-2 mt-2 p-2 border rounded-lg bg-muted">
                <img
                  src={selectedToken.logoURI}
                  alt={selectedToken.name}
                  className="h-10 w-10 rounded-full"
                />
                <div>
                  <div className="font-medium">{selectedToken.name}</div>
                  <div className="text-sm text-gray-500">
                    {formatMint(selectedToken.mint)}
                  </div>
                </div>
              </div>
            )}

            {tokenResults && !isLoading && (
              <div
                className="flex items-center gap-2 mt-2 p-2 border rounded-lg hover:bg-muted cursor-pointer"
                onClick={() => handleTokenSelect(tokenResults)}
              >
                <img
                  src={tokenResults.logoURI}
                  alt={tokenResults.name}
                  className="h-10 w-10 rounded-full"
                />
                <div>
                  <div className="font-medium">{tokenResults.name}</div>
                  <div className="text-sm text-gray-500">
                    {formatMint(tokenResults.mint)}
                  </div>
                </div>
              </div>
            )}
          </div>

          <Button
            className="w-full mt-4"
            disabled={!amount || !selectedToken}
            onClick={handleCheckout}
          >
            Checkout
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
