"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaTelegramPlane } from "react-icons/fa";
import { FiCheckCircle, FiChevronDown, FiSearch } from "react-icons/fi";
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
  { name: "Egypt", code: "+20", flag: "🇪🇬" },
  { name: "Ghana", code: "+233", flag: "🇬🇭" },
  { name: "Tanzania", code: "+255", flag: "🇹🇿" },
  { name: "Uganda", code: "+256", flag: "🇺🇬" },
  { name: "Rwanda", code: "+250", flag: "🇷🇼" },
  { name: "Somalia", code: "+252", flag: "🇸🇴" },
  { name: "Sudan", code: "+249", flag: "🇸🇩" },
  { name: "Eritrea", code: "+291", flag: "🇪🇷" },
  { name: "Djibouti", code: "+253", flag: "🇩🇯" },
  { name: "Morocco", code: "+212", flag: "🇲🇦" },
  { name: "Algeria", code: "+213", flag: "🇩🇿" },
  { name: "Tunisia", code: "+216", flag: "🇹🇳" },
  { name: "Libya", code: "+218", flag: "🇱🇾" },
  { name: "Senegal", code: "+221", flag: "🇸🇳" },
  { name: "Ivory Coast", code: "+225", flag: "🇨🇮" },
  { name: "Cameroon", code: "+237", flag: "🇨🇲" },
  { name: "DR Congo", code: "+243", flag: "🇨🇩" },
  { name: "Angola", code: "+244", flag: "🇦🇴" },
  { name: "Mozambique", code: "+258", flag: "🇲🇿" },
  { name: "Zimbabwe", code: "+263", flag: "🇿🇼" },
  { name: "Zambia", code: "+260", flag: "🇿🇲" },
  { name: "Malawi", code: "+265", flag: "🇲🇼" },
  { name: "Botswana", code: "+267", flag: "🇧🇼" },
  { name: "Namibia", code: "+264", flag: "🇳🇦" },
  { name: "Pakistan", code: "+92", flag: "🇵🇰" },
  { name: "Bangladesh", code: "+880", flag: "🇧🇩" },
  { name: "Sri Lanka", code: "+94", flag: "🇱🇰" },
  { name: "Nepal", code: "+977", flag: "🇳🇵" },
  { name: "Indonesia", code: "+62", flag: "🇮🇩" },
  { name: "Malaysia", code: "+60", flag: "🇲🇾" },
  { name: "Philippines", code: "+63", flag: "🇵🇭" },
  { name: "Vietnam", code: "+84", flag: "🇻🇳" },
  { name: "Thailand", code: "+66", flag: "🇹🇭" },
  { name: "Singapore", code: "+65", flag: "🇸🇬" },
  { name: "South Korea", code: "+82", flag: "🇰🇷" },
  { name: "Turkey", code: "+90", flag: "🇹🇷" },
  { name: "Iran", code: "+98", flag: "🇮🇷" },
  { name: "Iraq", code: "+964", flag: "🇮🇶" },
  { name: "Jordan", code: "+962", flag: "🇯🇴" },
  { name: "Kuwait", code: "+965", flag: "🇰🇼" },
  { name: "Qatar", code: "+974", flag: "🇶🇦" },
  { name: "Bahrain", code: "+973", flag: "🇧🇭" },
  { name: "Oman", code: "+968", flag: "🇴🇲" },
  { name: "Yemen", code: "+967", flag: "🇾🇪" },
  { name: "Lebanon", code: "+961", flag: "🇱🇧" },
  { name: "Israel", code: "+972", flag: "🇮🇱" },
  { name: "Russia", code: "+7", flag: "🇷🇺" },
  { name: "Ukraine", code: "+380", flag: "🇺🇦" },
  { name: "Poland", code: "+48", flag: "🇵🇱" },
  { name: "Netherlands", code: "+31", flag: "🇳🇱" },
  { name: "Belgium", code: "+32", flag: "🇧🇪" },
  { name: "Sweden", code: "+46", flag: "🇸🇪" },
  { name: "Norway", code: "+47", flag: "🇳🇴" },
  { name: "Denmark", code: "+45", flag: "🇩🇰" },
  { name: "Finland", code: "+358", flag: "🇫🇮" },
  { name: "Switzerland", code: "+41", flag: "🇨🇭" },
  { name: "Austria", code: "+43", flag: "🇦🇹" },
  { name: "Portugal", code: "+351", flag: "🇵🇹" },
  { name: "Greece", code: "+30", flag: "🇬🇷" },
  { name: "Czech Republic", code: "+420", flag: "🇨🇿" },
  { name: "Romania", code: "+40", flag: "🇷🇴" },
  { name: "Hungary", code: "+36", flag: "🇭🇺" },
  { name: "Argentina", code: "+54", flag: "🇦🇷" },
  { name: "Colombia", code: "+57", flag: "🇨🇴" },
  { name: "Chile", code: "+56", flag: "🇨🇱" },
  { name: "Peru", code: "+51", flag: "🇵🇪" },
  { name: "Venezuela", code: "+58", flag: "🇻🇪" },
  { name: "Ecuador", code: "+593", flag: "🇪🇨" },
  { name: "Bolivia", code: "+591", flag: "🇧🇴" },
  { name: "Paraguay", code: "+595", flag: "🇵🇾" },
  { name: "Uruguay", code: "+598", flag: "🇺🇾" },
  { name: "New Zealand", code: "+64", flag: "🇳🇿" },
  { name: "Cuba", code: "+53", flag: "🇨🇺" },
  { name: "Jamaica", code: "+1", flag: "🇯🇲" },
  { name: "Haiti", code: "+509", flag: "🇭🇹" },
  { name: "Myanmar", code: "+95", flag: "🇲🇲" },
  { name: "Cambodia", code: "+855", flag: "🇰🇭" },
  { name: "Laos", code: "+856", flag: "🇱🇦" },
  { name: "Mongolia", code: "+976", flag: "🇲🇳" },
  { name: "Kazakhstan", code: "+7", flag: "🇰🇿" },
  { name: "Uzbekistan", code: "+998", flag: "🇺🇿" },
  { name: "Afghanistan", code: "+93", flag: "🇦🇫" },
  { name: "Madagascar", code: "+261", flag: "🇲🇬" },
];

export default function ContactPage() {
  const [formData, setFormData] = useState({
    fullName: "",
    country: "Ethiopia",
    phoneNumber: "",
    message: "",
  });

  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [telegramUsername, setTelegramUsername] = useState("@korixapay");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await fetch("/api/settings");
        const data = await res.json();
        if (data.telegramUsername) setTelegramUsername(data.telegramUsername);
      } catch (e) {
        console.error("Failed to fetch settings:", e);
      }
    }
    fetchSettings();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
        setCountrySearch("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedCountry = COUNTRIES.find((c) => c.name === formData.country) || COUNTRIES[0];

  const filteredCountries = COUNTRIES.filter((c) =>
    c.name.toLowerCase().includes(countrySearch.toLowerCase())
  );

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
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to send message");
      }

      setShowSuccess(true);
      setFormData({ fullName: "", country: "Ethiopia", phoneNumber: "", message: "" });
      setTimeout(() => setShowSuccess(false), 7000);
    } catch (error: any) {
      console.error("Error submitting contact form:", error);
      alert(error.message || "Failed to send message. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Header />

      <main className="flex-1 px-4 py-8 md:py-16">
        <div className="mx-auto max-w-2xl">
          {/* Header */}
          <div className="mb-8 text-center md:mb-10">
            <h1 className="mb-3 text-3xl font-bold tracking-tight md:text-5xl">Contact Us</h1>
            <p className="text-sm text-muted-foreground md:text-base">
              We&apos;re here to help. Reach out via Telegram or fill out the form below.
            </p>
          </div>

          {/* Telegram card */}
          <div className="mb-6 overflow-hidden rounded-2xl border border-border bg-card p-1 md:mb-8">
            <a
              href={`https://t.me/${telegramUsername.replace("@", "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between rounded-xl bg-blue-500/10 px-4 py-4 transition hover:bg-blue-500/20 md:px-6"
            >
              <div className="flex items-center gap-3 md:gap-4">
                <div className="flex h-11 w-11 md:h-14 md:w-14 items-center justify-center rounded-full bg-blue-500 text-white shadow-lg">
                  <FaTelegramPlane className="text-xl md:text-2xl" />
                </div>
                <div>
                  <h3 className="text-sm font-bold md:text-base">Contact on Telegram</h3>
                  <p className="text-xs font-medium text-muted-foreground md:text-sm">
                    {telegramUsername}
                  </p>
                </div>
              </div>
              <span className="rounded-full bg-blue-500 px-3 py-1.5 text-xs font-bold text-white shadow-md md:px-4">
                Chat Now
              </span>
            </a>
          </div>

          {/* Form card */}
          <div className="relative rounded-2xl border border-border bg-card p-5 shadow-sm md:p-8">
            <h2 className="mb-5 text-lg font-semibold md:mb-6 md:text-xl">Send us a message</h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Full Name */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground md:text-sm">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                  placeholder="John Doe"
                />
              </div>

              {/* Country custom dropdown */}
              <div ref={dropdownRef} className="relative">
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground md:text-sm">
                  Country
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setIsDropdownOpen(!isDropdownOpen);
                    setCountrySearch("");
                  }}
                  className="flex w-full items-center justify-between rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition hover:border-primary focus:border-primary focus:ring-2 focus:ring-primary/20"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl">{selectedCountry.flag}</span>
                    <span>{selectedCountry.name}</span>
                    <span className="text-xs text-muted-foreground">{selectedCountry.code}</span>
                  </div>
                  <FiChevronDown
                    className={`text-muted-foreground transition-transform duration-200 ${
                      isDropdownOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                <AnimatePresence>
                  {isDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.98 }}
                      transition={{ duration: 0.15 }}
                      className="absolute z-50 mt-2 w-full overflow-hidden rounded-xl border border-border bg-card shadow-2xl"
                    >
                      {/* Search */}
                      <div className="flex items-center gap-2 border-b border-border px-3 py-2.5">
                        <FiSearch className="shrink-0 text-muted-foreground" />
                        <input
                          type="text"
                          autoFocus
                          value={countrySearch}
                          onChange={(e) => setCountrySearch(e.target.value)}
                          placeholder="Search country..."
                          className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                        />
                      </div>
                      {/* List */}
                      <div className="max-h-56 overflow-y-auto p-1.5">
                        {filteredCountries.length === 0 ? (
                          <p className="py-4 text-center text-xs text-muted-foreground">
                            No country found
                          </p>
                        ) : (
                          filteredCountries.map((c) => (
                            <button
                              type="button"
                              key={c.name}
                              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition hover:bg-muted ${
                                formData.country === c.name ? "bg-primary/10 text-primary" : ""
                              }`}
                              onClick={() => {
                                setFormData({ ...formData, country: c.name });
                                setIsDropdownOpen(false);
                                setCountrySearch("");
                              }}
                            >
                              <span className="text-xl">{c.flag}</span>
                              <span className="flex-1 text-left">{c.name}</span>
                              <span className="text-xs text-muted-foreground">{c.code}</span>
                            </button>
                          ))
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Phone Number */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground md:text-sm">
                  Phone Number
                </label>
                <div className="flex gap-2">
                  <div className="flex min-w-[64px] items-center justify-center rounded-xl border border-border bg-muted/50 px-3 py-3 text-sm font-medium">
                    {selectedCountry.code}
                  </div>
                  <input
                    type="tel"
                    required
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                    className="flex-1 rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                    placeholder="911 234 567"
                  />
                </div>
              </div>

              {/* Message */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground md:text-sm">
                  Message / Problem
                </label>
                <textarea
                  required
                  rows={4}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full resize-none rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                  placeholder="Describe your issue or question..."
                />
              </div>

              {/* Submit */}
              <Button
                type="submit"
                variant="primary"
                disabled={loading}
                className="mt-2 w-full rounded-xl py-3.5 text-sm font-bold"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                    Sending...
                  </span>
                ) : (
                  "Send Message"
                )}
              </Button>
            </form>

            {/* Success popup overlay */}
            <AnimatePresence>
              {showSuccess && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-20 flex flex-col items-center justify-center rounded-2xl bg-card/97 p-6 text-center backdrop-blur-sm"
                >
                  <motion.div
                    initial={{ scale: 0, rotate: -10 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                    className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-green-500/15 text-green-500"
                  >
                    <FiCheckCircle className="text-5xl" />
                  </motion.div>

                  <motion.h3
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                    className="mb-2 text-xl font-bold"
                  >
                    Message Sent! ✅
                  </motion.h3>

                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35 }}
                    className="mb-1 text-sm font-medium text-muted-foreground"
                  >
                    Thank you for reaching out.
                  </motion.p>
                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.45 }}
                    className="text-sm font-semibold text-primary"
                  >
                    The Korixapay team will reply to you soon! 🚀
                  </motion.p>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.55 }}
                    className="mt-6"
                  >
                    <a
                      href={`https://t.me/${telegramUsername.replace("@", "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center rounded-xl bg-blue-500 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-600 active:scale-95"
                      onClick={() => setShowSuccess(false)}
                    >
                      <FaTelegramPlane className="mr-2 text-lg" />
                      Contact on Telegram
                    </a>
                  </motion.div>
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
