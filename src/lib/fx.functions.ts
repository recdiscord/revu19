import { createServerFn } from "@tanstack/react-start";
import type { Rates } from "@/lib/calc";

const FALLBACK: Rates = {
  jpyPln: 0.02375,
  eurPln: 4.32,
  jpyDate: "2026-09-04",
  eurDate: "2026-09-04",
};

let memo: { at: number; rates: Rates } | null = null;
const TTL_MS = 60 * 60 * 1000;

export const getRates = createServerFn({ method: "GET" }).handler(async () => {
  if (memo && Date.now() - memo.at < TTL_MS) return memo.rates;
  try {
    const [jpyRes, eurRes] = await Promise.all([
      fetch("https://api.nbp.pl/api/exchangerates/rates/a/jpy/?format=json", {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(8000),
      }),
      fetch("https://api.nbp.pl/api/exchangerates/rates/a/eur/?format=json", {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(8000),
      }),
    ]);
    if (!jpyRes.ok || !eurRes.ok) throw new Error("nbp");
    const jpy = (await jpyRes.json()) as NbpTable;
    const eur = (await eurRes.json()) as NbpTable;
    const jpyMid = jpy.rates[0]?.mid;
    const eurMid = eur.rates[0]?.mid;
    if (!jpyMid || !eurMid) throw new Error("nbp-empty");
    const rates: Rates = {
      jpyPln: jpyMid,
      eurPln: eurMid,
      jpyDate: jpy.rates[0]?.effectiveDate ?? FALLBACK.jpyDate,
      eurDate: eur.rates[0]?.effectiveDate ?? FALLBACK.eurDate,
    };
    memo = { at: Date.now(), rates };
    return rates;
  } catch {
    return FALLBACK;
  }
});

type NbpTable = {
  rates: { mid: number; effectiveDate: string }[];
};
