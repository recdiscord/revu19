const pl = "pl-PL";

export function formatPln(value: number, digits = 2): string {
  return new Intl.NumberFormat(pl, {
    style: "currency",
    currency: "PLN",
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
}

export function formatJpy(value: number): string {
  return `${new Intl.NumberFormat(pl, { maximumFractionDigits: 0 }).format(Math.round(value))} JPY`;
}

export function formatEur(value: number): string {
  return new Intl.NumberFormat(pl, {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatGrams(grams: number): string {
  if (grams >= 1000) {
    const kg = grams / 1000;
    return `${new Intl.NumberFormat(pl, { maximumFractionDigits: kg >= 10 ? 1 : 2 }).format(kg)} kg`;
  }
  return `${Math.round(grams)} g`;
}

export function formatDatePl(iso: string): string {
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat(pl, {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
}
