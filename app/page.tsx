import { Suspense } from "react";
import { Header } from "@/components/landing/Header";
import { Hero } from "@/components/landing/Hero";
import { VirtualCardSection } from "@/components/landing/VirtualCardSection";
import { MarketPreview } from "@/components/landing/MarketPreview";
import { MarketPreviewSkeleton } from "@/components/landing/MarketPreviewSkeleton";
import { P2PSection } from "@/components/landing/P2PSection";
import { GrowthSection } from "@/components/landing/GrowthSection";
import { WhyKorixa } from "@/components/landing/WhyKorixa";
import { CallToAction } from "@/components/landing/CallToAction";
import { Footer } from "@/components/landing/Footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <Hero />
        <VirtualCardSection />
        <Suspense fallback={<MarketPreviewSkeleton />}>
          <MarketPreview />
        </Suspense>
        <P2PSection />
        <GrowthSection />
        <WhyKorixa />
        <CallToAction />
      </main>
      <Footer />
    </div>
  );
}
