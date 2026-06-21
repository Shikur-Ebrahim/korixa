import { AppShell } from "@/components/layout/AppShell";
import { appTheme } from "@/components/layout/app-theme";
import { CardScreen } from "@/components/card/CardScreen";

export default function CardPage() {
  return (
    <AppShell>
      <div className="mb-4">
        <h1 className={appTheme.title}>Card</h1>
        <p className={appTheme.subtitle}>Spend crypto anywhere</p>
      </div>
      <CardScreen />
    </AppShell>
  );
}
