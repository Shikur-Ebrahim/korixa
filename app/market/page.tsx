import { AppShell } from "@/components/layout/AppShell";
import { MarketScreen } from "@/components/market/MarketScreen";
import { MarketScreenFallback } from "@/components/market/MarketScreenFallback";
import { getAppMarketPageData } from "@/lib/coingecko";

export const revalidate = 1800;

export default async function MarketPage() {
  let data;

  try {
    data = await getAppMarketPageData();
  } catch {
    return (
      <AppShell>
        <MarketScreenFallback />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <MarketScreen data={data} />
    </AppShell>
  );
}
