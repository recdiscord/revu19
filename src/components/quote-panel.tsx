import { Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  HS_RATES,
  LOW_VALUE_EUR,
  VAT_RATE,
  cheapestAvailable,
  quoteAll,
  type DutyMode,
  type HsCategory,
  type Rates,
} from "@/lib/calc";
import { formatEur, formatGrams, formatJpy, formatPln } from "@/lib/format";
import { SHIPPING_METHODS, type ShippingId } from "@/lib/shipping";
import { useCart } from "@/lib/store";
import { cn } from "@/lib/utils";

export function QuotePanel({ rates }: { rates: Rates }) {
  const items = useCart((s) => s.items);
  const settings = useCart((s) => s.settings);
  const setShipping = useCart((s) => s.setShipping);
  const patchSettings = useCart((s) => s.patchSettings);

  const lines = items.map((i) => ({
    id: i.id,
    qty: i.qty,
    priceJpy: i.priceJpy,
    weightG: i.weightG,
  }));
  const quotes = quoteAll(lines, settings, rates);
  const selected = quotes.find((q) => q.id === settings.shippingId) ?? quotes[0];
  const cheap = cheapestAvailable(quotes);
  const goodsJpy = items.reduce((n, i) => n + i.priceJpy * i.qty, 0);

  return (
    <aside className="flex flex-col gap-4">
      <section className="paper-card rounded-xl p-4 md:p-5">
        <p className="text-xs font-medium tracking-wide text-muted uppercase">Szacowany koszt w PL</p>
        <p className="font-display mt-1 text-4xl leading-none tracking-tight tabular">
          {selected?.available ? formatPln(selected.totalPln) : "—"}
        </p>
        <p className="mt-2 text-sm text-muted">
          {selected?.available
            ? `${SHIPPING_METHODS.find((m) => m.id === selected.id)?.name} · ${formatGrams(selected.billableG)} z pakowaniem`
            : "Dodaj produkty, żeby zobaczyć wycenę"}
        </p>

        {selected?.available ? (
          <dl className="mt-5 grid gap-2 text-sm">
            <Row label="Towar" value={formatPln(selected.goodsPln)} hint={formatJpy(goodsJpy)} />
            <Row
              label="Wysyłka AmiAmi"
              value={formatPln(selected.shippingPln)}
              hint={formatJpy(selected.shippingJpy)}
            />
            <Row label="Cło" value={formatPln(selected.dutyPln)} hint={selected.dutyNote} />
            <Row
              label={`VAT ${(VAT_RATE * 100).toFixed(0)}%`}
              value={formatPln(selected.vatPln)}
              hint="Od towaru + wysyłki + cła"
            />
            {settings.includeHandling ? (
              <Row
                label="Odprawa / handling"
                value={formatPln(selected.handlingPln)}
                hint={
                  SHIPPING_METHODS.find((m) => m.id === selected.id)?.carrier === "dhl"
                    ? "DHL — opłata za zaliczkę VAT/cła"
                    : "Poczta Polska — zgłoszenie celne"
                }
              />
            ) : null}
            <div className="mt-1 flex items-baseline justify-between border-t border-border pt-3">
              <dt className="font-medium">Razem</dt>
              <dd className="font-display text-2xl tracking-tight tabular">{formatPln(selected.totalPln)}</dd>
            </div>
          </dl>
        ) : null}

        {selected?.available && selected.goodsEur > 0 ? (
          <p className="mt-3 text-xs text-subtle">
            Wartość towaru {formatEur(selected.goodsEur)}
            {selected.goodsEur <= LOW_VALUE_EUR
              ? ` — próg ${LOW_VALUE_EUR} EUR, cło ryczałtowe.`
              : ` — powyżej ${LOW_VALUE_EUR} EUR, stawka taryfowa.`}
          </p>
        ) : null}
      </section>

      <section className="paper-card rounded-xl p-4 md:p-5">
        <h2 className="font-display text-xl tracking-tight">Wysyłka do Polski</h2>
        <p className="mt-1 text-sm text-muted">Strefa 3 AmiAmi (Europa). DHL jest szacunkiem.</p>
        <ul className="mt-4 grid gap-2">
          {quotes.map((q) => {
            const meta = SHIPPING_METHODS.find((m) => m.id === q.id)!;
            const active = settings.shippingId === q.id;
            const isCheap = cheap && cheap.id === q.id && q.available;
            return (
              <li key={q.id}>
                <button
                  type="button"
                  disabled={!q.available}
                  onClick={() => setShipping(q.id as ShippingId)}
                  className={cn(
                    "flex w-full items-start gap-3 rounded-lg px-3 py-3 text-left shadow-[var(--shadow-border)] transition-[box-shadow,background-color] duration-[var(--motion-quick)]",
                    active ? "bg-accent text-accent-fg" : "bg-bg text-fg hover:shadow-[var(--shadow-border-hover)]",
                    !q.available && "cursor-not-allowed opacity-45 hover:shadow-[var(--shadow-border)]",
                  )}
                >
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium">{meta.name}</span>
                      {isCheap && !active ? <Badge tone="ok">najtaniej</Badge> : null}
                      {!meta.official ? (
                        <Badge tone={active ? "accent" : "warn"}>szacunek</Badge>
                      ) : null}
                    </span>
                    <span className={cn("mt-0.5 block text-xs", active ? "text-accent-fg/70" : "text-muted")}>
                      {meta.eta} · {meta.tracking ? "tracking" : "bez trackingu"}
                      {q.unavailableReason ? ` · ${q.unavailableReason}` : ""}
                    </span>
                  </span>
                  <span className="tabular shrink-0 text-sm font-medium">
                    {q.available ? formatPln(q.totalPln) : "—"}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <SettingsCard
        dutyMode={settings.dutyMode}
        hs={settings.hs}
        packingFlatG={settings.packingFlatG}
        packingPct={settings.packingPct}
        includeHandling={settings.includeHandling}
        onDutyMode={(dutyMode) => patchSettings({ dutyMode })}
        onHs={(hs) => patchSettings({ hs })}
        onPacking={(packingFlatG, packingPct) => patchSettings({ packingFlatG, packingPct })}
        onHandling={(includeHandling) => patchSettings({ includeHandling })}
      />
    </aside>
  );
}

function Row({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="flex items-center gap-1 text-muted">
        {label}
        {hint ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <button type="button" className="text-subtle hover:text-fg" aria-label={hint}>
                <Info className="size-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent>{hint}</TooltipContent>
          </Tooltip>
        ) : null}
      </dt>
      <dd className="tabular text-fg">{value}</dd>
    </div>
  );
}

function SettingsCard({
  dutyMode,
  hs,
  packingFlatG,
  packingPct,
  includeHandling,
  onDutyMode,
  onHs,
  onPacking,
  onHandling,
}: {
  dutyMode: DutyMode;
  hs: HsCategory;
  packingFlatG: number;
  packingPct: number;
  includeHandling: boolean;
  onDutyMode: (m: DutyMode) => void;
  onHs: (h: HsCategory) => void;
  onPacking: (flat: number, pct: number) => void;
  onHandling: (v: boolean) => void;
}) {
  return (
    <section className="paper-card rounded-xl p-4 md:p-5">
      <h2 className="font-display text-xl tracking-tight">Cło i pakowanie</h2>
      <div className="mt-4 grid gap-4">
        <fieldset>
          <legend className="text-xs font-medium tracking-wide text-muted uppercase">Ryczałt 3 EUR</legend>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {(
              [
                ["shipment", "Na paczkę"],
                ["line", "Na pozycję"],
              ] as const
            ).map(([id, label]) => (
              <Button
                key={id}
                type="button"
                size="sm"
                variant={dutyMode === id ? "primary" : "secondary"}
                onClick={() => onDutyMode(id)}
              >
                {label}
              </Button>
            ))}
          </div>
        </fieldset>

        <label className="grid gap-1.5 text-xs font-medium text-muted">
          Powyżej 150 EUR
          <select
            value={hs}
            onChange={(e) => onHs(e.target.value as HsCategory)}
            className="h-11 rounded-md bg-bg-subtle px-3 text-sm text-fg shadow-[var(--shadow-border)] focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:outline-none"
          >
            {(Object.keys(HS_RATES) as HsCategory[]).map((key) => (
              <option key={key} value={key}>
                {HS_RATES[key].label}
              </option>
            ))}
          </select>
          <span className="font-normal text-subtle">{HS_RATES[hs].hint}</span>
        </label>

        <label className="grid gap-1.5 text-xs font-medium text-muted">
          Pakowanie AmiAmi · {packingFlatG} g + {packingPct}%
          <input
            type="range"
            min={0}
            max={500}
            step={10}
            value={packingFlatG}
            onChange={(e) => onPacking(Number(e.target.value), packingPct)}
            className="w-full accent-[var(--color-accent)]"
          />
        </label>

        <label className="flex min-h-11 items-center gap-3 text-sm">
          <input
            type="checkbox"
            checked={includeHandling}
            onChange={(e) => onHandling(e.target.checked)}
            className="size-4 accent-[var(--color-accent)]"
          />
          Dolicz opłatę operatora za odprawę
        </label>
      </div>
    </section>
  );
}
