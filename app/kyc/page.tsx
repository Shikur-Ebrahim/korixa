import { AppShell } from "@/components/layout/AppShell";
import { KycWizard } from "@/components/kyc/KycWizard";

export default function KycPage() {
  return (
    <AppShell>
      <KycWizard />
    </AppShell>
  );
}
