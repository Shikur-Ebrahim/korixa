"use client";

import { useRouter } from "next/navigation";
import { FiArrowLeft, FiCheck } from "react-icons/fi";
import { appTheme } from "@/components/layout/app-theme";

const LANGUAGES = [
  { code: "en", name: "English", active: true },
  { code: "es", name: "Español", active: false },
  { code: "fr", name: "Français", active: false },
  { code: "ar", name: "العربية", active: false },
  { code: "zh", name: "简体中文", active: false },
];

export default function LanguagePage() {
  const router = useRouter();

  return (
    <div className={appTheme.page}>
      <div className={appTheme.header}>
        <div className="mx-auto flex h-14 max-w-lg items-center px-4">
          <button
            onClick={() => router.push("/dashboard?profile=open")}
            className="p-1.5 -ml-1.5 rounded-full hover:bg-white/[0.06] transition"
          >
            <FiArrowLeft size={20} className="text-[#848e9c]" />
          </button>
          <h1 className="ml-2 text-sm md:text-base font-bold text-white">Language</h1>
        </div>
      </div>

      <main className={appTheme.main}>
        <div className="mb-6">
          <h1 className={appTheme.title}>Select Language</h1>
          <p className={appTheme.subtitle}>
            Choose your preferred language for the application interface.
          </p>
        </div>

        <div className={appTheme.card}>
          <div className="divide-y divide-white/[0.04]">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                disabled={!lang.active}
                className={`flex w-full items-center justify-between py-3.5 px-2 -mx-2 transition ${
                  lang.active 
                    ? "opacity-100 hover:bg-white/[0.04] rounded-lg" 
                    : "opacity-40 cursor-not-allowed"
                }`}
              >
                <span className={`text-xs md:text-sm font-medium ${lang.active ? "text-white" : "text-[#848e9c]"}`}>
                  {lang.name}
                </span>
                {lang.active && (
                  <FiCheck className="text-primary" size={18} />
                )}
              </button>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
