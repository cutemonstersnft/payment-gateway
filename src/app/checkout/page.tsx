import QrCode from "@/components/qr";
import { Suspense } from "react";

export default function Home() {
  return (
    <div>
      <Suspense fallback={<div>Loading QR code...</div>}>
        <QrCode />
      </Suspense>
    </div>
  );
}
