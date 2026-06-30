"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { FiArrowLeft, FiCheck, FiChevronDown, FiCopy, FiInfo, FiUpload, FiImage } from "react-icons/fi";
import { QRCodeSVG } from "qrcode.react";
import { appTheme } from "@/components/layout/app-theme";
import { useAuth } from "@/components/auth/AuthProvider";

export default function CryptoDepositPage() {
  const router = useRouter();
  const { getIdToken } = useAuth();
  
  const [networks, setNetworks] = useState<any[]>([]);
  const [loadingNetworks, setLoadingNetworks] = useState(true);
  
  // Selection
  const [coinDropdownOpen, setCoinDropdownOpen] = useState(false);
  const [selectedCoin, setSelectedCoin] = useState("USDT");
  const [networkDropdownOpen, setNetworkDropdownOpen] = useState(false);
  const [selectedNetwork, setSelectedNetwork] = useState<any | null>(null);

  // Form
  const [amount, setAmount] = useState("");
  const [txId, setTxId] = useState("");
  const [screenshotUrl, setScreenshotUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/deposit/networks")
      .then(res => res.json())
      .then(data => {
        setNetworks(data);
        setLoadingNetworks(false);
      })
      .catch(err => {
        console.error(err);
        setLoadingNetworks(false);
      });
  }, []);

  const copyAddress = () => {
    if (!selectedNetwork) return;
    navigator.clipboard.writeText(selectedNetwork.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("Image must be less than 5MB");
      return;
    }

    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        const token = await getIdToken();
        const res = await fetch("/api/upload", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ file: base64, folder: "korixa/deposits" })
        });
        
        const data = await res.json();
        if (data.success) {
          setScreenshotUrl(data.secure_url);
        } else {
          alert("Upload failed: " + data.error);
        }
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error(err);
      alert("Upload error");
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !screenshotUrl) return alert("Please enter amount and upload screenshot");

    setSubmitting(true);
    try {
      const token = await getIdToken();
      const res = await fetch("/api/deposit/crypto/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          amount: Number(amount),
          txId,
          screenshotUrl,
          networkId: selectedNetwork.id,
          coin: selectedCoin,
        })
      });

      const data = await res.json();
      if (res.ok) {
        setSuccessMsg("Deposit request submitted successfully. Waiting for admin approval.");
        setAmount("");
        setTxId("");
        setScreenshotUrl("");
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        alert(data.error || "Failed to submit deposit");
      }
    } catch (err) {
      console.error(err);
      alert("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingNetworks) {
    return (
      <div className={appTheme.page}>
        <div className={appTheme.header}>
          <div className="mx-auto flex h-14 max-w-lg items-center px-4">
            <button onClick={() => router.back()} className="p-1.5 -ml-1.5 rounded-full hover:bg-white/[0.06]"><FiArrowLeft size={20} className="text-[#848e9c]" /></button>
            <h1 className="ml-2 font-bold text-white">Deposit Crypto</h1>
          </div>
        </div>
        <div className="flex h-[60vh] items-center justify-center"><div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div></div>
      </div>
    );
  }

  return (
    <div className={appTheme.page}>
      <div className={appTheme.header}>
        <div className="mx-auto flex h-14 max-w-lg items-center px-4">
          <button
            onClick={() => router.push("/dashboard")}
            className="p-1.5 -ml-1.5 rounded-full hover:bg-white/[0.06] transition"
          >
            <FiArrowLeft size={20} className="text-[#848e9c]" />
          </button>
          <h1 className="ml-2 text-base font-bold text-white">Deposit Crypto</h1>
        </div>
      </div>

      <main className={appTheme.main}>
        {successMsg ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20 text-green-500">
              <FiCheck size={32} />
            </div>
            <h2 className="mb-2 text-xl font-bold text-white">Request Submitted</h2>
            <p className="text-center text-sm text-[#848e9c] px-6">
              Your deposit request has been received. Our team will review your screenshot and credit your account shortly.
            </p>
            <button
              onClick={() => router.push("/profile/funding")}
              className="mt-8 rounded-xl bg-primary px-8 py-3 font-bold text-[#0b0e11] transition hover:bg-primary/90"
            >
              View Wallet
            </button>
          </div>
        ) : (
          <>
            {/* Coin */}
            <div className="mb-4">
              <label className="mb-1.5 block text-xs font-semibold text-[#848e9c]">Coin</label>
              <div className="flex items-center gap-2 rounded-xl bg-[#1e2329] p-3">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#2b3139]">
                  <img src="https://assets.coingecko.com/coins/images/325/thumb/Tether.png" alt="USDT" className="h-4 w-4" />
                </div>
                <span className="text-sm font-bold text-white">USDT <span className="font-normal text-[#848e9c] ml-1">Tether US</span></span>
              </div>
            </div>

            {/* Network list */}
            <div className="mb-6">
              <label className="mb-2 block text-xs font-semibold text-[#848e9c]">Select Network</label>
              <div className="space-y-2">
                {networks.map(n => (
                  <button
                    key={n.id}
                    onClick={() => setSelectedNetwork(selectedNetwork?.id === n.id ? null : n)}
                    className={`flex w-full items-center justify-between rounded-xl border p-4 transition ${
                      selectedNetwork?.id === n.id
                        ? "border-primary/60 bg-primary/10"
                        : "border-white/[0.06] bg-[#1e2329] hover:bg-[#2b3139]"
                    }`}
                  >
                    <div className="text-left">
                      <div className="text-sm font-bold text-white">{n.name}</div>
                      <div className="text-[11px] text-[#848e9c] mt-0.5">Min: {n.minDeposit} USDT</div>
                    </div>
                    {selectedNetwork?.id === n.id && (
                      <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center shrink-0">
                        <FiCheck size={12} className="text-[#0b0e11] font-bold" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {selectedNetwork && (
              <div className="space-y-6">
                {/* QR Code and Address */}
                <div className="rounded-2xl border border-white/[0.04] bg-[#161a1e] p-6 text-center shadow-lg">
                  <div className="mx-auto mb-5 flex aspect-square w-48 items-center justify-center rounded-xl bg-white p-3">
                    <QRCodeSVG value={selectedNetwork.address} size={168} level="M" />
                  </div>
                  <div className="text-[11px] text-[#848e9c] mb-1.5 font-medium">Wallet Address</div>
                  <div className="flex items-center gap-2 rounded-xl bg-[#0b0e11] p-3 border border-white/[0.04]">
                    <span className="flex-1 truncate text-left text-sm font-medium text-white select-all">
                      {selectedNetwork.address}
                    </span>
                    <button
                      onClick={copyAddress}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#2b3139] text-[#848e9c] hover:bg-[#3b4149] hover:text-white transition"
                    >
                      {copied ? <FiCheck className="text-green-500" /> : <FiCopy />}
                    </button>
                  </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-[#848e9c]">Deposit Amount (USDT)</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Enter amount sent"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full rounded-xl bg-[#1e2329] p-3.5 text-sm text-white focus:bg-[#2b3139] outline-none transition"
                      required
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-[#848e9c]">Payment Screenshot (Required)</label>
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-white/10 bg-[#1e2329] p-6 hover:bg-[#2b3139] transition"
                    >
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileChange} 
                        accept="image/*" 
                        className="hidden" 
                      />
                      {uploading ? (
                        <div className="flex flex-col items-center">
                          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent mb-2"></div>
                          <span className="text-xs text-[#848e9c]">Uploading...</span>
                        </div>
                      ) : screenshotUrl ? (
                        <div className="flex flex-col items-center">
                          <img src={screenshotUrl} alt="Preview" className="h-20 w-auto rounded object-contain mb-2" />
                          <span className="text-[10px] text-green-500 font-medium flex items-center gap-1"><FiCheck /> Uploaded Successfully</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center text-[#848e9c]">
                          <FiUpload size={24} className="mb-2" />
                          <span className="text-xs font-medium text-white mb-1">Click to upload screenshot</span>
                          <span className="text-[10px]">JPG, PNG max 5MB</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-4">
                    <button
                      type="submit"
                      disabled={submitting || uploading || !screenshotUrl}
                      className="w-full rounded-xl bg-primary py-3.5 text-sm font-bold text-[#0b0e11] hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                      {submitting ? "Submitting..." : "Submit Deposit Request"}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
