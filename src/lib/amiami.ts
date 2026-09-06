export type AmiItem = {
  gcode: string;
  name: string;
  maker: string;
  priceJpy: number;
  listPriceJpy: number | null;
  image: string | null;
  status: string | null;
  url: string;
};

const CODE_RE = /\b([A-Z]{2,12}-\d{3,}(?:-[A-Z0-9]+)?)\b/i;
const URL_CODE_RE = /[?&](?:gcode|scode)=([A-Z]{2,12}-\d{3,}(?:-[A-Z0-9]+)?)/i;

export function extractGcode(input: string): string | null {
  const trimmed = input.trim();
  const fromUrl = trimmed.match(URL_CODE_RE);
  if (fromUrl?.[1]) return fromUrl[1].toUpperCase();
  if (/amiami\.com/i.test(trimmed)) {
    const m = trimmed.match(CODE_RE);
    return m ? m[1].toUpperCase() : null;
  }
  const only = trimmed.match(/^([A-Z]{2,12}-\d{3,}(?:-[A-Z0-9]+)?)$/i);
  return only ? only[1].toUpperCase() : null;
}

export function isAmiAmiProductInput(input: string): boolean {
  return Boolean(extractGcode(input));
}

export function amiamiUrl(gcode: string): string {
  return `https://www.amiami.com/eng/detail/?gcode=${encodeURIComponent(gcode)}`;
}

export function parseSearchMarkdown(md: string): AmiItem[] {
  const items: AmiItem[] = [];
  const seen = new Set<string>();
  const re =
    /\[!\[[^\]]*\]\((https:\/\/img\.amiami\.com\/images\/product\/[^)\s]+)\)\s*([^\]]+)\]\(https:\/\/www\.amiami\.com\/(?:eng|cn)\/detail\/?\?(?:gcode|scode)=([A-Za-z0-9-]+(?:-[A-Z0-9]+)?)\)/g;

  let match: RegExpExecArray | null;
  while ((match = re.exec(md))) {
    const image = match[1] ?? null;
    const raw = (match[2] ?? "").replace(/\s+/g, " ").trim();
    const gcode = (match[3] ?? "").toUpperCase();
    if (!gcode || seen.has(gcode)) continue;
    const parsed = parseListingText(raw, gcode, image);
    if (!parsed) continue;
    seen.add(gcode);
    items.push(parsed);
  }
  return items;
}

const FLAG_NAMES = [
  "Order Closed",
  "Sold Out",
  "Pre-owned",
  "Preowned",
  "Pre-order",
  "Back-order",
  "Backorder",
  "Limited",
  "Sale",
];

const FLAG_RE = new RegExp(
  `^(?:\\*\\s*)?(?:${FLAG_NAMES.join("|")})\\s+`,
  "i",
);

function parseListingText(raw: string, gcode: string, image: string | null): AmiItem | null {
  let text = raw.replace(/^\*\s*/, "");
  const stripped: string[] = [];
  while (FLAG_RE.test(text)) {
    const m = text.match(FLAG_RE);
    if (!m) break;
    stripped.push(m[0].replace(/^\*\s*/, "").trim());
    text = text.replace(FLAG_RE, "");
  }

  const jpy = text.match(/([\d,]+)\s*JPY(?:\s*([\d,]+))?/i);
  if (!jpy) return null;
  const priceJpy = Number((jpy[1] ?? "0").replace(/,/g, ""));
  const maybeList = jpy[2] ? Number(jpy[2].replace(/,/g, "")) : null;
  if (!Number.isFinite(priceJpy) || priceJpy <= 0) return null;

  let listPriceJpy: number | null = null;
  if (maybeList && maybeList > priceJpy) listPriceJpy = maybeList;

  const namePart = text.slice(0, jpy.index).trim().replace(/\s+\*\s*$/, "");
  const { name, maker } = splitNameMaker(namePart);

  // AmiAmi dumps every filter chip into some listings — ignore those.
  let status: string | null = null;
  if (stripped.length === 1) {
    status = normalizeFlag(stripped[0] ?? "");
  }

  return {
    gcode,
    name: name || gcode,
    maker,
    priceJpy,
    listPriceJpy,
    image,
    status,
    url: amiamiUrl(gcode),
  };
}

function normalizeFlag(flag: string): string {
  const f = flag.replace(/\*$/, "").trim();
  if (/preowned/i.test(f)) return "Pre-owned";
  if (/backorder/i.test(f)) return "Back-order";
  return f;
}

const MAKERS = [
  "Good Smile Company",
  "Good Smile Arts Shanghai",
  "Max Factory",
  "Kotobukiya",
  "MegaHouse",
  "Bandai",
  "Banpresto",
  "Taito",
  "SEGA",
  "Aniplex",
  "Alter",
  "FREEing",
  "Native",
  "Union Creative",
  "Kadokawa",
  "Square Enix",
  "Phat Company",
  "Phat",
  "Orange Rouge",
  "Good Smile",
  "POP UP PARADE",
  "Epoch",
  "Ensky",
  "Tenyo",
  "FuRyu",
  "Youtooz",
  "WarrenJames",
];

function splitNameMaker(text: string): { name: string; maker: string } {
  for (const maker of MAKERS) {
    const idx = text.toLowerCase().lastIndexOf(maker.toLowerCase());
    if (idx >= 0) {
      const name = text.slice(0, idx).trim();
      const found = text.slice(idx, idx + maker.length);
      return { name: name || text, maker: found };
    }
  }
  return { name: text, maker: "" };
}

export type OfficialItem = {
  gcode?: string;
  scode?: string;
  sname?: string;
  maker_name?: string;
  min_price?: number;
  price?: number;
  thumb_url?: string;
  main_image_url?: string;
  image_url?: string;
  instock_flg?: number;
  preorder_flg?: number;
  list_price?: number;
};

export function fromOfficial(raw: OfficialItem): AmiItem | null {
  const gcode = (raw.gcode ?? raw.scode ?? "").toUpperCase();
  const price = Number(raw.min_price ?? raw.price ?? 0);
  if (!gcode || !price) return null;
  const thumb = raw.thumb_url || raw.main_image_url || raw.image_url || "";
  const image = thumb
    ? thumb.startsWith("http")
      ? thumb
      : `https://img.amiami.com${thumb}`
    : null;
  let status: string | null = null;
  if (raw.preorder_flg) status = "Pre-order";
  return {
    gcode,
    name: raw.sname ?? gcode,
    maker: raw.maker_name ?? "",
    priceJpy: price,
    listPriceJpy: raw.list_price && raw.list_price > price ? raw.list_price : null,
    image,
    status,
    url: amiamiUrl(gcode),
  };
}
