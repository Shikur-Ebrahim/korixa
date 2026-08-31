"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaTelegramPlane } from "react-icons/fa";
import { FiCheckCircle } from "react-icons/fi";
import { Button } from "@/components/ui/Button";
import { Header } from "@/components/landing/Header";
import { Footer } from "@/components/landing/Footer";

const COUNTRIES = [
  { name: "Ethiopia", code: "+251", flag: "🇪🇹" },
  { name: "United States", code: "+1", flag: "🇺🇸" },
  { name: "United Kingdom", code: "+44", flag: "🇬🇧" },
  { name: "Canada", code: "+1", flag: "🇨🇦" },
  { name: "Australia", code: "+61", flag: "🇦🇺" },
  { name: "Germany", code: "+49", flag: "🇩🇪" },
  { name: "France", code: "+33", flag: "🇫🇷" },
  { name: "Italy", code: "+39", flag: "🇮🇹" },
  { name: "Spain", code: "+34", flag: "🇪🇸" },
  { name: "Nigeria", code: "+234", flag: "🇳🇬" },
  { name: "South Africa", code: "+27", flag: "🇿🇦" },
  { name: "Kenya", code: "+254", flag: "🇰🇪" },
  { name: "India", code: "+91", flag: "🇮🇳" },
  { name: "China", code: "+86", flag: "🇨🇳" },
  { name: "Japan", code: "+81", flag: "🇯🇵" },
  { name: "Brazil", code: "+55", flag: "🇧🇷" },
  { name: "Mexico", code: "+52", flag: "🇲🇽" },
  { name: "UAE", code: "+971", flag: "🇦🇪" },
  { name: "Saudi Arabia", code: "+966", flag: "🇸🇦" },
  { name: "Egypt", code: "+20", flag: "🇪🇬" }
];

export default function ContactPage() {
  const [formData, setFormData] = useState({
    fullName: "",
    country: "Ethiopia",
    phoneNumber: "",
    message: ""
  });
  
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [telegramUsername, setTelegramUsername] = useState("@korixapay");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await fetch("/api/settings");
        const data = await res.json();
        if (data.telegramUsername) {
          setTelegramUsername(data.telegramUsername);
        }
      } catch (e) {
        console.error("Failed to fetch settings:", e);
      }
    }
    fetchSettings();
  }, []);

  const selectedCountry = COUNTRIES.find(c => c.name === formData.country) || COUNTRIES[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        throw new Error("Failed to send message");
      }
      
      setShowSuccess(true);
      setFormData({
        fullName: "",
        country: "Ethiopia",
        phoneNumber: "",
        message: ""
      });
      
      setTimeout(() => {
        setShowSuccess(false);
      }, 6000);
    } catch (error) {
      console.error("Error submitting contact form:", error);
      alert("Failed to send message. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Header />
      
      <main className="flex-1 px-4 py-8 md:py-16">
        <div className="mx-auto max-w-2xl">
          <div className="mb-8 text-center md:mb-10">
            <h1 className="mb-3 text-3xl font-bold tracking-tight md:text-5xl">Contact Us</h1>
            <p className="text-sm text-muted-foreground md:text-base">
              We're here to help. Reach out to us via Telegram or fill out the form below.
            </p>
          </div>

          <div className="mb-6 overflow-hidden rounded-2xl border border-border bg-card p-1 md:mb-8">
            <a 
              href={`https://t.me/${telegramUsername.replace('@', '')}`}
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center justify-between rounded-xl bg-blue-500/10 px-4 py-4 transition hover:bg-blue-500/20 md:px-6"
            >
              <div className="flex items-center gap-3 md:gap-4">
                <div className="flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-full bg-blue-500 text-white shadow-lg">
                  <FaTelegramPlane className="text-xl md:text-2xl" />
                </div>
                <div>
                  <h3 className="text-sm font-bold md:text-base">Contact on Telegram</h3>
                  <p className="text-xs font-medium text-muted-foreground md:text-sm">{telegramUsername}</p>
                </div>
              </div>
              <span className="rounded-full bg-blue-500 px-3 py-1 text-xs font-bold text-white md:px-4 md:py-1.5">Chat Now</span>
            </a>
          </div>

          <div className="relative rounded-2xl border border-border bg-card p-5 shadow-sm md:p-8">
            <h2 className="mb-5 text-lg font-semibold md:mb-6 md:text-xl">Send us a message</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground md:text-sm">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-xs outline-none transition focus:border-primary focus:ring-1 focus:ring-primary md:text-sm"
                  placeholder="John Doe"
                />
              </div>

              <div className="relative">
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground md:text-sm">
                  Country
                </label>
                <div 
                  className="flex w-full cursor-pointer items-center justify-between rounded-lg border border-border bg-background px-4 py-2.5 text-xs transition hover:border-primary md:text-sm"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base md:text-lg">{selectedCountry.flag}</span>
                    <span>{selectedCountry.name}</span>
                  </div>
                  <span className={`text-muted-foreground transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}>▼</span>
                </div>
                
                <AnimatePresence>
                  {isDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute z-50 mt-2 max-h-60 w-full overflow-y-auto rounded-xl border border-border bg-card p-2 shadow-xl"
                    >
                      {COUNTRIES.map(c => (
                        <div
                          key={c.name}
                          className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm transition hover:bg-muted"
                          onClick={() => {
                            setFormData({...formData, country: c.name});
                            setIsDropdownOpen(false);
                          }}
                        >
                          <span className="text-lg">{c.flag}</span>
                          <span>{c.name}</span>
                          <span className="ml-auto text-xs text-muted-foreground">{c.code}</span>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground md:text-sm">
                  Phone Number
                </label>
                <div className="flex gap-2">
                  <div className="flex w-16 md:w-20 items-center justify-center rounded-lg border border-border bg-muted/50 text-xs md:text-sm font-medium">
                    {selectedCountry.code}
                  </div>
                  <input
                    type="tel"
                    required
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
                    className="flex-1 rounded-lg border border-border bg-background px-3 py-2.5 text-xs outline-none transition focus:border-primary focus:ring-1 focus:ring-primary md:text-sm"
                    placeholder="911 234 567"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground md:text-sm">
                  Message / Problem
                </label>
                <textarea
                  required
                  rows={4}
                  value={formData.message}
                  onChange={(e) => setFormData({...formData, message: e.target.value})}
                  className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2.5 text-xs outline-none transition focus:border-primary focus:ring-1 focus:ring-primary md:text-sm"
                  placeholder="How can we help you?"
                ></textarea>
              </div>

              <Button
                type="submit"
                variant="primary"
                disabled={loading}
                className="mt-2 w-full py-3 text-xs font-semibold md:text-sm"
              >
                {loading ? "Sending..." : "Send Message"}
              </Button>
            </form>

            <AnimatePresence>
              {showSuccess && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-2xl bg-card/95 p-6 text-center backdrop-blur-sm"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.1, type: "spring" }}
                    className="mb-4 flex h-14 w-14 md:h-16 md:w-16 items-center justify-center rounded-full bg-green-500/10 text-green-500"
                  >
                    <FiCheckCircle className="text-3xl md:text-4xl" />
                  </motion.div>
                  <h3 className="mb-2 text-lg md:text-xl font-bold">Message Sent Successfully!</h3>
                  <p className="text-xs md:text-sm text-muted-foreground font-medium">
                    The Korixapay team will reply to you soon.
                  </p>
                  <Button
                    variant="outline"
                    className="mt-6 text-xs md:text-sm"
                    onClick={() => setShowSuccess(false)}
                  >
                    Send Another Message
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
