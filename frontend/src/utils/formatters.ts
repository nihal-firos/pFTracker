export function toNumber(value: string | number): number {
  if (typeof value === "number") {
    return value;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function formatCurrency(value: string | number): string {
  const amount = toNumber(value);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatShortMonth(dateIso: string): string {
  const date = new Date(dateIso);
  return new Intl.DateTimeFormat("en-US", { month: "short", year: "2-digit" }).format(date);
}

export function formatDate(dateIso: string): string {
  const date = new Date(dateIso);
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(date);
}