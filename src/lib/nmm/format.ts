export function money(n: number): string {
  if (!Number.isFinite(n)) return "—";
  if (n < 0.01) return `$${n.toFixed(4)}`;
  return `$${n.toFixed(3)}`;
}

export function tokens(n: number): string {
  return Math.round(n).toLocaleString("en-US");
}

export function pct(n: number, digits = 0): string {
  return `${(n * 100).toFixed(digits)}%`;
}

export function ccg(n: number): string {
  return n.toFixed(2);
}

export function seconds(ms: number): string {
  return `${(ms / 1000).toFixed(1)}s`;
}
