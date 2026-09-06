import { lookupShippingJpy, SHIPPING_METHODS, type ShippingId } from "@/lib/shipping";

export const VAT_RATE = 0.23;
export const LOW_VALUE_EUR = 150;
export const FLAT_DUTY_EUR = 3;

export type DutyMode = "shipment" | "line";
export type HsCategory = "figure-epa" | "plastic" | "other" | "figure-standard";

export const HS_RATES: Record<HsCategory, { rate: number; label: string; hint: string }> = {
  "figure-epa": {
    rate: 0,
    label: "Figurki / zabawki (EPA Japonia)",
    hint: "HS 9503 — przy pochodzeniu JP umowa UE–Japonia zwykle zeruje cło powyżej 150 EUR.",
  },
  plastic: {
    rate: 0.065,
    label: "Ozdoby z tworzyw (6,5%)",
    hint: "HS 3926 — bywa stosowane do figurek dekoracyjnych, gdy nie uznano ich za zabawki.",
  },
  other: {
    rate: 0.047,
    label: "Inne / 4,7%",
    hint: "Typowa stawka dla zabawek bez preferencji. Możesz zmienić, gdy znasz kod taryfy.",
  },
  "figure-standard": {
    rate: 0.047,
    label: "Figurki / zabawki (4,7%)",
    hint: "Standardowa stawka cła dla figurek i zabawek bez preferencji EPA.",
  },
};

export type CartLine = {
  id: string;
  qty: number;
  priceJpy: number;
  weightG: number;
};

export type Rates = {
  jpyPln: number;
  eurPln: number;
  jpyDate: string;
  eurDate: string;
};

export type QuoteSettings = {
  shippingId: ShippingId;
  packingFlatG: number;
  packingPct: number;
  dutyMode: DutyMode;
  hs: HsCategory;
  customDutyRate: number;
  includeHandling: boolean;
  pocztaHandlingPln: number;
  dhlHandlingEur: number;
};

export const DEFAULT_SETTINGS: QuoteSettings = {
  shippingId: "ems",
  packingFlatG: 220,
  packingPct: 8,
  dutyMode: "shipment",
  hs: "figure-standard",
  customDutyRate: 0.047,
  includeHandling: true,
  pocztaHandlingPln: 12.5,
  dhlHandlingEur: 16.5,
};

export type MethodBreakdown = {
  id: ShippingId;
  available: boolean;
  unavailableReason?: string;
  shippingJpy: number;
  shippingPln: number;
  goodsPln: number;
  goodsEur: number;
  cifPln: number;
  dutyPln: number;
  dutyNote: string;
  vatPln: number;
  handlingPln: number;
  totalPln: number;
  billableG: number;
};

function packedGrams(lines: CartLine[], packingFlatG: number, packingPct: number): number {
  const items = lines.reduce((sum, line) => sum + line.weightG * line.qty, 0);
  if (items <= 0) return 0;
  return Math.ceil(items + packingFlatG + (items * packingPct) / 100);
}

function dutyRate(settings: QuoteSettings): number {
  if (settings.hs === "other") return settings.customDutyRate;
  return HS_RATES[settings.hs].rate;
}

export function quoteMethod(
  lines: CartLine[],
  settings: QuoteSettings,
  rates: Rates,
  shippingId: ShippingId,
): MethodBreakdown {
  const method = SHIPPING_METHODS.find((m) => m.id === shippingId)!;
  const goodsJpy = lines.reduce((sum, line) => sum + line.priceJpy * line.qty, 0);
  const itemCount = lines.reduce((sum, line) => sum + line.qty, 0);
  const lineCount = lines.length;
  const goodsPln = goodsJpy * rates.jpyPln;
  const goodsEur = rates.eurPln > 0 ? goodsPln / rates.eurPln : 0;
  const billableG = packedGrams(lines, settings.packingFlatG, settings.packingPct);

  if (lines.length === 0) {
    return {
      id: shippingId,
      available: false,
      unavailableReason: "Dodaj produkty",
      shippingJpy: 0,
      shippingPln: 0,
      goodsPln: 0,
      goodsEur: 0,
      cifPln: 0,
      dutyPln: 0,
      dutyNote: "",
      vatPln: 0,
      handlingPln: 0,
      totalPln: 0,
      billableG: 0,
    };
  }

  if (billableG > method.maxG) {
    return emptyUnavailable(
      shippingId,
      goodsPln,
      goodsEur,
      billableG,
      `Limit ${method.maxG / 1000} kg — podziel zamówienie`,
    );
  }
  if (billableG < method.minG) {
    return emptyUnavailable(
      shippingId,
      goodsPln,
      goodsEur,
      billableG,
      `Min. ${method.minG >= 1000 ? `${method.minG / 1000} kg` : `${method.minG} g`}`,
    );
  }

  const shippingJpy = lookupShippingJpy(method, billableG);
  if (shippingJpy == null) {
    return emptyUnavailable(shippingId, goodsPln, goodsEur, billableG, "Brak stawki dla tej wagi");
  }

  const shippingPln = shippingJpy * rates.jpyPln;
  const cifPln = goodsPln + shippingPln;

  let dutyPln = 0;
  let dutyNote = "";
  if (goodsEur <= LOW_VALUE_EUR) {
    const units = settings.dutyMode === "line" ? Math.max(1, lineCount) : 1;
    dutyPln = FLAT_DUTY_EUR * units * rates.eurPln;
    dutyNote =
      settings.dutyMode === "line"
        ? `Ryczałt ${FLAT_DUTY_EUR} EUR × ${units} ${units === 1 ? "pozycja" : "pozycje"} (do ${LOW_VALUE_EUR} EUR)`
        : `Ryczałt ${FLAT_DUTY_EUR} EUR na paczkę (wartość towaru ≤ ${LOW_VALUE_EUR} EUR)`;
  } else {
    const rate = dutyRate(settings);
    dutyPln = cifPln * rate;
    dutyNote =
      rate === 0
        ? "Powyżej 150 EUR — stawka EPA 0% (figurki/zabawki JP)"
        : `Powyżej 150 EUR — cło ${(rate * 100).toFixed(1).replace(".", ",")}% od towaru + wysyłki`;
  }

  const vatPln = (cifPln + dutyPln) * VAT_RATE;
  const handlingPln = settings.includeHandling
    ? method.carrier === "dhl"
      ? settings.dhlHandlingEur * rates.eurPln
      : settings.pocztaHandlingPln
    : 0;

  const totalPln = cifPln + dutyPln + vatPln + handlingPln;

  return {
    id: shippingId,
    available: true,
    shippingJpy,
    shippingPln,
    goodsPln,
    goodsEur,
    cifPln,
    dutyPln,
    dutyNote,
    vatPln,
    handlingPln,
    totalPln,
    billableG,
  };
}

function emptyUnavailable(
  id: ShippingId,
  goodsPln: number,
  goodsEur: number,
  billableG: number,
  reason: string,
): MethodBreakdown {
  return {
    id,
    available: false,
    unavailableReason: reason,
    shippingJpy: 0,
    shippingPln: 0,
    goodsPln,
    goodsEur,
    cifPln: goodsPln,
    dutyPln: 0,
    dutyNote: "",
    vatPln: 0,
    handlingPln: 0,
    totalPln: 0,
    billableG,
  };
}

export function quoteAll(lines: CartLine[], settings: QuoteSettings, rates: Rates): MethodBreakdown[] {
  return SHIPPING_METHODS.map((m) => quoteMethod(lines, settings, rates, m.id));
}

export function cheapestAvailable(quotes: MethodBreakdown[]): MethodBreakdown | null {
  const ok = quotes.filter((q) => q.available);
  if (!ok.length) return null;
  return ok.reduce((best, q) => (q.totalPln < best.totalPln ? q : best));
}

export function fastestPreferred(quotes: MethodBreakdown[]): MethodBreakdown | null {
  const order: ShippingId[] = ["dhl", "ems", "air", "air-small", "surface"];
  for (const id of order) {
    const q = quotes.find((x) => x.id === id && x.available);
    if (q) return q;
  }
  return null;
}

export { packedGrams };
