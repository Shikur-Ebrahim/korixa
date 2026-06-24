import { AppShell } from "@/components/layout/AppShell";
import { AssetsScreenFirestore } from "@/components/assets/AssetsScreenFirestore";

export default function AssetsPage() {
  return (
    <AppShell>
      <AssetsScreenFirestore />
    </AppShell>
  );
}
