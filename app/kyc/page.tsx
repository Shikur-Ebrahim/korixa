"use client";

import { AppShell } from "@/components/layout/AppShell";
import dynamic from "next/dynamic";

const KycWizard = dynamic(
  () => import("@/components/kyc/KycWizard").then((m) => m.KycWizard),
  { ssr: false }
);

export default function KycPage() {
  return (
    <AppShell>
      <KycWizard />
    </AppShell>
  );
}
