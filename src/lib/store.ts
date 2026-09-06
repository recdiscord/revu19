import { create } from "zustand";
import { persist } from "zustand/middleware";
import { DEFAULT_SETTINGS, type QuoteSettings } from "@/lib/calc";
import type { ShippingId } from "@/lib/shipping";
import { estimateWeightGrams } from "@/lib/weight";
import type { AmiItem } from "@/lib/amiami";

export type CartItem = {
  id: string;
  gcode: string;
  name: string;
  maker: string;
  priceJpy: number;
  image: string | null;
  url: string;
  qty: number;
  weightG: number;
  weightManual: boolean;
};

type Store = {
  items: CartItem[];
  settings: QuoteSettings;
  addItem: (item: AmiItem, weightG?: number) => void;
  addManual: (input: { name: string; priceJpy: number; weightG: number; gcode?: string }) => void;
  remove: (id: string) => void;
  setQty: (id: string, qty: number) => void;
  setWeight: (id: string, weightG: number) => void;
  setPrice: (id: string, priceJpy: number) => void;
  setShipping: (id: ShippingId) => void;
  patchSettings: (patch: Partial<QuoteSettings>) => void;
  clear: () => void;
};

export const useCart = create<Store>()(
  persist(
    (set, get) => ({
      items: [],
      settings: DEFAULT_SETTINGS,
      addItem: (item, weightG) => {
        const existing = get().items.find((x) => x.gcode === item.gcode);
        if (existing) {
          set({
            items: get().items.map((x) =>
              x.gcode === item.gcode ? { ...x, qty: x.qty + 1 } : x,
            ),
          });
          return;
        }
        const grams = weightG ?? estimateWeightGrams(item.name, item.gcode);
        const next: CartItem = {
          id: `${item.gcode}-${Date.now()}`,
          gcode: item.gcode,
          name: item.name,
          maker: item.maker,
          priceJpy: item.priceJpy,
          image: item.image,
          url: item.url,
          qty: 1,
          weightG: grams,
          weightManual: false,
        };
        set({ items: [...get().items, next] });
      },
      addManual: ({ name, priceJpy, weightG, gcode }) => {
        const code = gcode?.trim() || `MANUAL-${Date.now()}`;
        const next: CartItem = {
          id: `manual-${Date.now()}`,
          gcode: code,
          name: name.trim() || "Produkt",
          maker: "",
          priceJpy,
          image: null,
          url: gcode ? `https://www.amiami.com/eng/detail/?gcode=${gcode}` : "",
          qty: 1,
          weightG,
          weightManual: true,
        };
        set({ items: [...get().items, next] });
      },
      remove: (id) => set({ items: get().items.filter((x) => x.id !== id) }),
      setQty: (id, qty) =>
        set({
          items: get().items
            .map((x) => (x.id === id ? { ...x, qty: Math.max(1, Math.min(99, qty)) } : x)),
        }),
      setWeight: (id, weightG) =>
        set({
          items: get().items.map((x) =>
            x.id === id ? { ...x, weightG: Math.max(1, Math.round(weightG)), weightManual: true } : x,
          ),
        }),
      setPrice: (id, priceJpy) =>
        set({
          items: get().items.map((x) =>
            x.id === id ? { ...x, priceJpy: Math.max(0, Math.round(priceJpy)) } : x,
          ),
        }),
      setShipping: (id) => set({ settings: { ...get().settings, shippingId: id } }),
      patchSettings: (patch) => set({ settings: { ...get().settings, ...patch } }),
      clear: () => set({ items: [] }),
    }),
    { name: "amipln-cart-v1" },
  ),
);
