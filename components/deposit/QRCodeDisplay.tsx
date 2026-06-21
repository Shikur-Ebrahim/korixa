"use client";

type QRCodeDisplayProps = {
  qrCode: string;
  loading?: boolean;
};

export function QRCodeDisplay({ qrCode, loading }: QRCodeDisplayProps) {
  if (loading) {
    return (
      <div className="mx-auto flex h-[220px] w-[220px] animate-pulse items-center justify-center rounded-2xl bg-white/5" />
    );
  }

  return (
    <div className="mx-auto w-fit rounded-2xl border border-white/[0.08] bg-white p-3 shadow-[0_8px_32px_rgba(0,0,0,0.35)]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={qrCode} alt="Deposit QR code" className="h-[200px] w-[200px]" />
    </div>
  );
}
