import { Card } from "@/components/ui/Card";

export function MarketPreviewSkeleton() {
  return (
    <section id="markets" className="px-4 py-10 sm:px-6 sm:py-14">
      <div className="mx-auto max-w-6xl animate-pulse space-y-4">
        <div className="space-y-2 text-center">
          <div className="mx-auto h-5 w-40 rounded-lg bg-white/5" />
          <div className="mx-auto h-3 w-56 rounded bg-white/5" />
        </div>
        <Card className="h-24"><span className="sr-only">Loading</span></Card>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Card className="h-40"><span className="sr-only">Loading</span></Card>
          <Card className="h-40"><span className="sr-only">Loading</span></Card>
        </div>
        <Card className="h-80"><span className="sr-only">Loading</span></Card>
      </div>
    </section>
  );
}
