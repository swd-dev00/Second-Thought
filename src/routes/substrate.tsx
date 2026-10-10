import { createFileRoute } from "@tanstack/react-router";
import { Shell } from "@/components/shell";
import { SubstrateView } from "@/components/substrate-view";

export const Route = createFileRoute("/substrate")({ component: SubstratePage });

function SubstratePage() {
  return (
    <Shell>
      <SubstrateView />
    </Shell>
  );
}
