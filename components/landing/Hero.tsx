import Image from "next/image";
import { Button } from "@/components/ui/Button";

export function Hero() {
  return (
    <section className="relative overflow-hidden px-4 pb-12 pt-8 sm:px-6 sm:pb-16 sm:pt-12">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute top-32 -right-16 h-48 w-48 rounded-full bg-secondary/5 blur-3xl" />
      </div>

      <div className="relative mx-auto flex max-w-6xl flex-col items-center text-center">
        <div className="mb-6 animate-fade-in-up">
          <Image
            src="/app logo.jpg"
            alt="Korixa"
            width={80}
            height={80}
            className="rounded-2xl object-cover shadow-[0_8px_32px_rgba(247,147,26,0.2)] sm:h-24 sm:w-24"
            priority
          />
        </div>

        <h1 className="mb-3 max-w-md text-2xl font-bold leading-tight tracking-tight sm:max-w-xl sm:text-3xl md:text-4xl">
          Trade Smarter With Korixa
        </h1>

        <p className="mb-8 max-w-sm text-sm leading-relaxed text-muted sm:max-w-md sm:text-base">
          Buy, sell and track digital assets with a secure and modern trading
          experience.
        </p>

        <div className="flex w-full max-w-sm flex-col gap-3 sm:max-w-none sm:flex-row sm:justify-center">
          <Button href="/sign-up" variant="primary" fullWidth className="sm:w-auto sm:px-6">
            Get Started
          </Button>
          <Button href="#markets" variant="outline" fullWidth className="sm:w-auto sm:px-6">
            Explore Markets
          </Button>
        </div>
      </div>
    </section>
  );
}
