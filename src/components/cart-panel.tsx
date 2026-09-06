import { Minus, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProductThumb } from "@/components/product-thumb";
import type { AmiItem } from "@/lib/amiami";
import { formatGrams, formatJpy } from "@/lib/format";
import { useCart } from "@/lib/store";

const SAMPLE: AmiItem[] = [
  {
    gcode: "FIGURE-201709",
    name: "Nendoroid Frieren: Beyond Journey's End Frieren",
    maker: "Good Smile Company",
    priceJpy: 5850,
    listPriceJpy: 6500,
    image: "https://img.amiami.com/images/product/main/262/FIGURE-201709.jpg",
    status: null,
    url: "https://www.amiami.com/eng/detail/?gcode=FIGURE-201709",
  },
  {
    gcode: "FIGURE-197879",
    name: "LookUp Frieren: Beyond Journey's End Frieren Shoboshobo Ver.",
    maker: "MegaHouse",
    priceJpy: 3920,
    listPriceJpy: 4620,
    image: "https://img.amiami.com/images/product/main/261/FIGURE-197879.jpg",
    status: null,
    url: "https://www.amiami.com/eng/detail/?gcode=FIGURE-197879",
  },
];

export function CartPanel() {
  const items = useCart((s) => s.items);
  const addItem = useCart((s) => s.addItem);
  const setQty = useCart((s) => s.setQty);
  const setWeight = useCart((s) => s.setWeight);
  const setPrice = useCart((s) => s.setPrice);
  const remove = useCart((s) => s.remove);
  const clear = useCart((s) => s.clear);

  const pieceCount = items.reduce((n, i) => n + i.qty, 0);
  const rawG = items.reduce((n, i) => n + i.weightG * i.qty, 0);

  return (
    <section className="paper-card rounded-xl p-4 md:p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-xl tracking-tight">Zamówienie</h2>
          <p className="mt-1 text-sm text-muted">
            {items.length === 0
              ? "Pusto — dodaj produkty z wyszukiwarki."
              : `${pieceCount} szt. · towar ${formatGrams(rawG)} (bez kartonu)`}
          </p>
        </div>
        {items.length ? (
          <Button variant="ghost" size="sm" onClick={clear}>
            Wyczyść
          </Button>
        ) : null}
      </div>

      {items.length === 0 ? (
        <div className="mt-4 rounded-lg bg-bg px-4 py-8 text-center shadow-[var(--shadow-border)]">
          <p className="font-display text-lg text-fg">Zacznij od figurki</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted">
            Szukaj po nazwie albo wklej adres z amiami.com. Wagę szacujemy po typie — możesz ją poprawić.
          </p>
          <Button
            className="mt-4"
            variant="secondary"
            onClick={() => {
              for (const item of SAMPLE) addItem(item);
            }}
          >
            Wczytaj przykład Frieren
          </Button>
        </div>
      ) : (
        <ul className="mt-4 grid gap-2">
          {items.map((item) => (
            <li
              key={item.id}
              className="grid grid-cols-[auto_1fr] gap-3 rounded-lg bg-bg p-2.5 shadow-[var(--shadow-border)] sm:grid-cols-[auto_1fr_auto]"
            >
              <ProductThumb src={item.image} alt="" gcode={item.gcode} className="size-16 rounded-md" />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{item.name}</p>
                <p className="font-mono text-[11px] text-subtle">{item.gcode}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <div className="flex h-9 items-center rounded-sm bg-bg-subtle shadow-[var(--shadow-border)]">
                    <button
                      type="button"
                      className="flex size-9 items-center justify-center text-muted hover:text-fg"
                      onClick={() => setQty(item.id, item.qty - 1)}
                      aria-label="Mniej"
                    >
                      <Minus className="size-3.5" />
                    </button>
                    <span className="tabular w-6 text-center text-sm">{item.qty}</span>
                    <button
                      type="button"
                      className="flex size-9 items-center justify-center text-muted hover:text-fg"
                      onClick={() => setQty(item.id, item.qty + 1)}
                      aria-label="Więcej"
                    >
                      <Plus className="size-3.5" />
                    </button>
                  </div>
                  <label className="flex h-9 items-center gap-1 rounded-sm bg-bg-subtle px-2 text-xs text-muted shadow-[var(--shadow-border)]">
                    <Input
                      className="tabular h-9 w-20 border-0 bg-transparent px-1 shadow-none"
                      inputMode="numeric"
                      value={item.priceJpy}
                      onChange={(e) => setPrice(item.id, Number(e.target.value) || 0)}
                      aria-label="Cena JPY"
                    />
                    JPY
                  </label>
                  <label className="flex h-9 items-center gap-1 rounded-sm bg-bg-subtle px-2 text-xs text-muted shadow-[var(--shadow-border)]">
                    <Input
                      className="tabular h-9 w-16 border-0 bg-transparent px-1 shadow-none"
                      inputMode="numeric"
                      value={item.weightG}
                      onChange={(e) => setWeight(item.id, Number(e.target.value) || 1)}
                      aria-label="Waga gram"
                    />
                    g
                    {!item.weightManual ? <span className="text-subtle">szac.</span> : null}
                  </label>
                </div>
              </div>
              <div className="col-span-2 flex items-center justify-between sm:col-span-1 sm:flex-col sm:items-end sm:justify-between">
                <p className="tabular text-sm font-medium">{formatJpy(item.priceJpy * item.qty)}</p>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => remove(item.id)}
                  aria-label="Usuń"
                >
                  <Trash2 />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
