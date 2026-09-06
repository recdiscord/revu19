import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { CartPanel } from "@/components/cart-panel";
import { QuotePanel } from "@/components/quote-panel";
import { SakuraField } from "@/components/sakura-field";
import { SearchPanel } from "@/components/search-panel";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { getRates } from "@/lib/fx.functions";
import { quoteMethod, type Rates } from "@/lib/calc";
import { formatDatePl, formatPln } from "@/lib/format";
import { useCart } from "@/lib/store";

const FALLBACK_RATES: Rates = {
  jpyPln: 0.02375,
  eurPln: 4.32,
  jpyDate: "2026-09-04",
  eurDate: "2026-09-04",
};

export function AppHome() {
  const fx = useQuery({ queryKey: ["nbp-rates"], queryFn: () => getRates() });
  const rates = fx.data ?? FALLBACK_RATES;
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);

  return (
    <div className="paper-wash relative min-h-dvh">
      <SakuraField />
      <div className="relative z-10">
        <header>
          <div className="mx-auto flex max-w-6xl flex-wrap items-end justify-between gap-4 px-4 py-6 md:px-6 md:py-8">
            <div>
              <h1 className="font-display flex items-center gap-3 text-4xl tracking-tight md:text-5xl">
                <SakuraMark />
                AmiPLN
              </h1>

            </div>
            <div className="text-right">
              <p className="text-xs text-subtle">Kurs średni NBP</p>
              <p className="tabular mt-1 text-sm text-fg">
                100 JPY = {formatPln(rates.jpyPln * 100, 2)}
              </p>
              <p className="tabular text-sm text-muted">1 EUR = {formatPln(rates.eurPln)}</p>
              <p className="mt-1 text-xs text-subtle">{formatDatePl(rates.jpyDate)}</p>
            </div>
          </div>
        </header>

        <main className="mx-auto grid max-w-6xl gap-6 px-4 py-6 pb-28 md:px-6 md:py-8 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start lg:pb-10 overflow-hidden">
          <div className="grid gap-6 overflow-hidden">
            <SearchPanel />
            {hydrated ? <CartPanel /> : <div className="paper-card h-40 rounded-xl" />}
          </div>
          <div className="hidden lg:block lg:sticky lg:top-6 overflow-hidden">
            {hydrated ? <QuotePanel rates={rates} /> : <div className="paper-card h-96 rounded-xl" />}
          </div>
        </main>

        {hydrated ? <MobileDock rates={rates} /> : null}

        <footer className="mx-auto max-w-6xl px-4 pb-10 text-xs leading-relaxed text-subtle md:px-6">
          Wycena jest szacunkiem. Stawki EMS / Air / Surface / Small Packet pochodzą z cennika AmiAmi dla strefy 3
          (Europa). DHL zmienia się co tydzień. VAT importowy 23% liczony jest od towaru, frachtu i cła. Od 1 lipca
          2026 r. paczki do 150 EUR (wartość towaru) mają ryczałtowe cło 3 EUR; powyżej — według taryfy. Operator
          (Poczta / DHL) może doliczyć własną opłatę. To nie jest porada celna.
        </footer>
      </div>
    </div>
  );
}

function SakuraMark() {
  return (
    <svg
      viewBox="0 0 32 32"
      className="size-8 shrink-0 text-accent md:size-9"
      aria-hidden
      fill="currentColor"
    >
      <circle cx="16" cy="9.2" r="6.1" />
      <circle cx="23.2" cy="14.4" r="6.1" />
      <circle cx="20.4" cy="22.8" r="6.1" />
      <circle cx="11.6" cy="22.8" r="6.1" />
      <circle cx="8.8" cy="14.4" r="6.1" />
      <circle cx="16" cy="16.2" r="3.2" className="text-bg-elevated" fill="currentColor" />
    </svg>
  );
}

function MobileDock({ rates }: { rates: Rates }) {
  const items = useCart((s) => s.items);
  const settings = useCart((s) => s.settings);
  const lines = items.map((i) => ({
    id: i.id,
    qty: i.qty,
    priceJpy: i.priceJpy,
    weightG: i.weightG,
  }));
  const selected = quoteMethod(lines, settings, rates, settings.shippingId);

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-bg-elevated/90 px-4 py-3 backdrop-blur-sm lg:hidden">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
        <div>
          <p className="text-xs text-muted">Do zapłaty</p>
          <p className="font-display text-2xl leading-none tracking-tight tabular">
            {selected.available ? formatPln(selected.totalPln) : "—"}
          </p>
        </div>
        <Sheet>
          <SheetTrigger asChild>
            <Button size="lg">Szczegóły</Button>
          </SheetTrigger>
          <SheetContent>
            <SheetTitle className="pr-10">Wycena</SheetTitle>
            <div className="mt-4">
              <QuotePanel rates={rates} />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}
