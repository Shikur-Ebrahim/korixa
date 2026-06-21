import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export function CallToAction() {
  return (
    <section id="sign-up" className="px-4 py-10 sm:px-6 sm:py-14">
      <div className="mx-auto max-w-6xl">
        <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-br from-card to-[#1a2238] px-6 py-10 text-center sm:px-10 sm:py-12">
          <div className="pointer-events-none absolute -top-12 -right-12 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-12 -left-12 h-40 w-40 rounded-full bg-secondary/5 blur-3xl" />

          <div className="relative">
            <h2 className="mb-3 text-lg font-bold sm:text-xl">
              Start Your Crypto Journey Today
            </h2>
            <p className="mx-auto mb-6 max-w-md text-sm text-muted">
              Join thousands of traders on Korixa and take control of your digital
              assets with a secure, modern platform.
            </p>
            <Button href="/sign-up" variant="primary" className="px-8 py-3">
              Sign Up
            </Button>
          </div>
        </Card>
      </div>
    </section>
  );
}
