"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Home, CheckCircle } from "lucide-react";

export default function SuccessPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="text-center mb-6">
        <CheckCircle size={120} className="text-green-500 mx-auto mb-6" strokeWidth={1.5} />
        <h1 className="text-3xl font-bold mb-2">Payment Successful!</h1>
        <p className="text-gray-500">Your transaction has been completed.</p>
      </div>
      
      <Button 
        variant="outline" 
        onClick={() => router.push("/")}
        className="flex items-center gap-2"
      >
        <Home size={16} />
        Back to Home
      </Button>
    </div>
  );
}
