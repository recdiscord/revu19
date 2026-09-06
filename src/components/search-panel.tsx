import { useMutation } from "@tanstack/react-query";
import { Link2, Plus, Search } from "lucide-react";
import { useState, type ClipboardEvent, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductThumb } from "@/components/product-thumb";
import { searchAmiAmi } from "@/lib/amiami.functions";
import { extractGcode, type AmiItem } from "@/lib/amiami";
import { formatJpy } from "@/lib/format";
import { useCart } from "@/lib/store";
import { WEIGHT_PRESETS, estimateWeightGrams } from "@/lib/weight";
import { cn } from "@/lib/utils";

const CHIPS = ["Frieren", "Nendoroid", "Bocchi", "1/7", "Jujutsu", "Gundam"];

export function SearchPanel() {
  const [q, setQ] = useState("");
  const addItem = useCart((s) => s.addItem);
  const addManual = useCart((s) => s.addManual);
  const [manualOpen, setManualOpen] = useState(false);

  const search = useMutation({
    mutationFn: async (query: string) => searchAmiAmi({ data: { q: query } }),
    onSuccess: (data, query) => {
      const code = extractGcode(query);
      if (!code || data.items.length !== 1) return;
      const hit = data.items[0];
      if (!hit || hit.gcode !== code) return;
      if (useCart.getState().items.some((i) => i.gcode === hit.gcode)) {
        toast.message("Ten produkt jest już w wycenie");
        return;
      }
      addItem(hit);
      toast.success("Dodano z linku AmiAmi");
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Wyszukiwanie nie powiodło się");
      setManualOpen(true);
    },
  });

  function runSearch(query: string) {
    const trimmed = query.trim();
    if (!trimmed) return;
    search.mutate(trimmed);
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    runSearch(q);
  }

  function onPaste(e: ClipboardEvent<HTMLInputElement>) {
    const text = e.clipboardData.getData("text").trim();
    if (!/amiami\.com/i.test(text) && !extractGcode(text)) return;
    e.preventDefault();
    setQ(text);
    runSearch(text);
  }

  function add(item: AmiItem) {
    addItem(item);
    toast.success("Dodano do wyceny");
  }

  return (
    <section className="paper-card rounded-xl p-4 md:p-5">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-xl tracking-tight">Katalog AmiAmi</h2>
          <p className="mt-1 text-sm text-muted">Wklej link (gcode lub scode), kod produktu albo nazwę.</p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setManualOpen((v) => !v)}>
          Wpisz ręcznie
        </Button>
      </div>

      <form onSubmit={onSubmit} className="mt-4 flex gap-2">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-subtle" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onPaste={onPaste}
            placeholder="wklej amiami.com/eng/detail?scode=…"
            className="pl-10"
            aria-label="Szukaj w AmiAmi"
          />
        </div>
        <Button type="submit" disabled={search.isPending || !q.trim()}>
          Szukaj
        </Button>
      </form>

      <div className="mt-3 flex flex-wrap gap-2">
        {CHIPS.map((chip) => (
          <button
            key={chip}
            type="button"
            className="h-9 rounded-full bg-bg-subtle px-3 text-sm text-muted shadow-[var(--shadow-border)] hover:text-fg"
            onClick={() => {
              setQ(chip);
              runSearch(chip);
            }}
          >
            {chip}
          </button>
        ))}
      </div>

      {manualOpen ? <div className="mt-4 overflow-hidden"><ManualForm onAdd={addManual} onClose={() => setManualOpen(false)} /></div> : null}

      <div className="mt-4 overflow-hidden">
        {search.isPending ? (
          <div className="grid gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-lg" />
            ))}
          </div>
        ) : search.data?.items.length ? (
          <ul className="grid gap-2 overflow-hidden">
            {search.data.items.map((item) => (
              <li
                key={item.gcode}
                className="flex items-center gap-3 rounded-lg bg-bg p-2.5 shadow-[var(--shadow-border)] overflow-hidden"
              >
                <ProductThumb src={item.image} alt="" gcode={item.gcode} className="size-[72px] rounded-md shrink-0" />
                <div className="min-w-0 flex-1 overflow-hidden">
                  <div className="flex flex-wrap items-center gap-2">
                    {item.status ? (
                      <Badge tone={item.status === "Pre-order" ? "warn" : "muted"}>{item.status}</Badge>
                    ) : null}
                    <span className="font-mono text-[11px] text-subtle shrink-0">{item.gcode}</span>
                  </div>
                  <p className="mt-0.5 truncate text-sm font-medium">{item.name}</p>
                  <p className="truncate text-xs text-muted">
                    {item.maker || "AmiAmi"} · ok. {estimateWeightGrams(item.name, item.gcode)} g
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2 ml-2">
                  <div className="text-right">
                    <p className="tabular text-sm font-medium">{formatJpy(item.priceJpy)}</p>
                    {item.listPriceJpy ? (
                      <p className="tabular text-xs text-subtle line-through">
                        {formatJpy(item.listPriceJpy)}
                      </p>
                    ) : null}
                  </div>
                  <Button size="sm" variant="secondary" onClick={() => add(item)}>
                    <Plus />
                    Dodaj
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        ) : search.isError ? (
          <p className="text-sm text-danger">
            Nie udało się wczytać tej karty. Wklej kod FIGURE-… albo wpisz cenę i wagę ręcznie.
          </p>
        ) : (
          <p className="flex items-center gap-2 text-sm text-muted">
            <Link2 className="size-4" />
            Działa wklejenie adresu z gcode albo scode.
          </p>
        )}
      </div>
    </section>
  );
}

function ManualForm({
  onAdd,
  onClose,
}: {
  onAdd: (input: { name: string; priceJpy: number; weightG: number; gcode?: string }) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("5800");
  const [weight, setWeight] = useState("280");
  const [gcode, setGcode] = useState("");

  function submit(e: FormEvent) {
    e.preventDefault();
    const priceJpy = Number(price.replace(",", "."));
    const weightG = Number(weight.replace(",", "."));
    if (!Number.isFinite(priceJpy) || priceJpy <= 0) return;
    if (!Number.isFinite(weightG) || weightG <= 0) return;
    onAdd({ name: name || "Produkt AmiAmi", priceJpy, weightG, gcode: gcode || undefined });
    toast.success("Dodano ręcznie");
    onClose();
  }

  return (
    <form
      onSubmit={submit}
      className="grid gap-3 rounded-lg bg-bg p-3 shadow-[var(--shadow-border)] md:grid-cols-2 overflow-hidden"
    >
      <label className="grid gap-1.5 text-xs font-medium text-muted md:col-span-2">
        Nazwa
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nendoroid Frieren" className="truncate" />
      </label>
      <label className="grid gap-1.5 text-xs font-medium text-muted">
        Cena (JPY)
        <Input inputMode="numeric" value={price} onChange={(e) => setPrice(e.target.value)} className="truncate" />
      </label>
      <label className="grid gap-1.5 text-xs font-medium text-muted">
        Waga (g)
        <Input inputMode="numeric" value={weight} onChange={(e) => setWeight(e.target.value)} className="truncate" />
      </label>
      <label className="grid gap-1.5 text-xs font-medium text-muted md:col-span-2">
        Kod AmiAmi (opcjonalnie)
        <Input value={gcode} onChange={(e) => setGcode(e.target.value)} placeholder="FIGURE-207871" className="truncate" />
      </label>
      <div className="flex flex-wrap gap-2 md:col-span-2">
        {WEIGHT_PRESETS.slice(0, 6).map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setWeight(String(p.grams))}
            className={cn(
              "h-8 rounded-full px-2.5 text-xs text-muted shadow-[var(--shadow-border)]",
              Number(weight) === p.grams && "bg-accent text-accent-fg",
            )}
          >
            {p.label}
          </button>
        ))}
      </div>
      <div className="flex gap-2 md:col-span-2">
        <Button type="submit" size="sm">
          Dodaj do wyceny
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onClose}>
          Anuluj
        </Button>
      </div>
    </form>
  );
}
