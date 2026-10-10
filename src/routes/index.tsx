import { createFileRoute } from "@tanstack/react-router";
import { Bench } from "@/components/bench";
import { Shell } from "@/components/shell";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return (
    <Shell>
      <Bench />
    </Shell>
  );
}
