import { AppShell } from "@/components/layout/AppShell";
import { appTheme } from "@/components/layout/app-theme";
import { AssetsScreen } from "@/components/assets/AssetsScreen";

export default function AssetsPage() {
  return (
    <AppShell>
      <div className="mb-4">
        <h1 className={appTheme.title}>Assets</h1>
        <p className={appTheme.subtitle}>Portfolio & wallet</p>
      </div>
      <AssetsScreen />
    </AppShell>
  );
}
