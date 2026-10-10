import { Link, useRouterState } from "@tanstack/react-router";
import { clsx } from "clsx";
import type { ReactNode } from "react";

const LINKS = [
  { to: "/", label: "Bench" },
  { to: "/lab", label: "Evaluation lab" },
  { to: "/substrate", label: "Substrate" },
] as const;

export function Shell({ children }: { children: ReactNode }) {
  const path = useRouterState({ select: (state) => state.location.pathname });

  return (
    <div className="min-h-screen bg-ink text-fg">
      <header className="sticky top-0 z-20 border-b border-line bg-ink/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <Link to="/" className="min-w-0">
            <span className="block font-display text-2xl leading-none text-fg">
              Second <span className="italic text-amber">Thought</span>
            </span>
            <span className="mt-1 block text-xs tracking-widest text-muted uppercase">Powered by NMM</span>
          </Link>
          <nav className="flex flex-wrap gap-2">
            {LINKS.map((link) => {
              const active = link.to === "/" ? path === "/" : path.startsWith(link.to);
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={clsx(
                    "inline-flex h-11 items-center px-3 text-sm",
                    active ? "bg-amber text-ink" : "border border-line text-fg hover:border-amber",
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>
    </div>
  );
}
