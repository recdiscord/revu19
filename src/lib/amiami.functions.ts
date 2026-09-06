import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  extractGcode,
  fromOfficial,
  parseSearchMarkdown,
  type AmiItem,
  type OfficialItem,
} from "@/lib/amiami";

const searchInput = z.object({
  q: z.string().trim().min(1).max(2000),
});

type CacheEntry = { at: number; items: AmiItem[] };
const cache = new Map<string, CacheEntry>();
const TTL_MS = 10 * 60 * 1000;

export const searchAmiAmi = createServerFn({ method: "POST" })
  .validator((data) => searchInput.parse(data))
  .handler(async ({ data }) => {
    const q = data.q;
    const gcode = extractGcode(q);
    const query = gcode ?? q;
    const key = query.toLowerCase();
    const hit = cache.get(key);
    if (hit && Date.now() - hit.at < TTL_MS) {
      return { ok: true as const, source: "cache" as const, items: preferExact(hit.items, gcode) };
    }

    const official = await tryOfficial(query, gcode);
    if (official.length) {
      const items = preferExact(official, gcode);
      cache.set(key, { at: Date.now(), items });
      return { ok: true as const, source: "amiami" as const, items };
    }

    const scraped = await scrapeSearch(query);
    const items = preferExact(scraped, gcode);
    cache.set(key, { at: Date.now(), items });
    return { ok: true as const, source: "amiami" as const, items };
  });

function preferExact(items: AmiItem[], gcode: string | null): AmiItem[] {
  if (!gcode) return items;
  const exact = items.filter((i) => i.gcode === gcode);
  if (exact.length) return exact;
  return items;
}

async function tryOfficial(query: string, gcode: string | null): Promise<AmiItem[]> {
  if (gcode) {
    const one = await fetchOfficialItem(gcode);
    if (one) return [one];
  }
  const url = new URL("https://api.amiami.com/api/v1.0/items");
  url.searchParams.set("s_keywords", query);
  url.searchParams.set("pagemax", "20");
  url.searchParams.set("pagecnt", "1");
  url.searchParams.set("lang", "eng");
  try {
    const res = await fetch(url, {
      headers: officialHeaders(),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return [];
    const json = (await res.json()) as {
      items?: OfficialItem[];
      data?: { items?: OfficialItem[] };
    };
    const raw = json.items ?? json.data?.items ?? [];
    return raw.map(fromOfficial).filter((x): x is AmiItem => x !== null);
  } catch {
    return [];
  }
}

async function fetchOfficialItem(code: string): Promise<AmiItem | null> {
  try {
    const url = new URL("https://api.amiami.com/api/v1.0/item");
    url.searchParams.set("scode", code);
    url.searchParams.set("gcode", code);
    url.searchParams.set("lang", "eng");
    const res = await fetch(url, {
      headers: officialHeaders(),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { item?: OfficialItem; data?: { item?: OfficialItem } };
    const raw = json.item ?? json.data?.item;
    return raw ? fromOfficial(raw) : null;
  } catch {
    return null;
  }
}

function officialHeaders(): HeadersInit {
  return {
    Accept: "application/json",
    "X-User-Key": "amiami_dev",
    Origin: "https://www.amiami.com",
    Referer: "https://www.amiami.com/eng/",
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
  };
}

async function scrapeSearch(query: string): Promise<AmiItem[]> {
  const target = `https://www.amiami.com/eng/search/list/?s_keywords=${encodeURIComponent(query)}`;
  const res = await fetch(`https://r.jina.ai/${target}`, {
    headers: {
      Accept: "text/plain",
      "User-Agent": "AmiPLN/1.0",
    },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) {
    throw new Error("Nie udało się odczytać katalogu AmiAmi. Wpisz produkt ręcznie.");
  }
  const md = await res.text();
  const items = parseSearchMarkdown(md);
  if (!items.length) {
    throw new Error("Nie znaleziono tej karty w AmiAmi. Sprawdź link albo wpisz cenę ręcznie.");
  }
  return items;
}
