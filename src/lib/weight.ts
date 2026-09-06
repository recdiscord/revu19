const RULES: { test: RegExp; grams: number }[] = [
  { test: /nendoroid\s*(plus|rubber|pouch)/i, grams: 80 },
  { test: /nendoroid\s*doll/i, grams: 420 },
  { test: /hello!?\s*good\s*smile/i, grams: 90 },
  { test: /nendoroid/i, grams: 280 },
  { test: /pop\s*up\s*parade/i, grams: 650 },
  { test: /\bfigma\b/i, grams: 200 },
  { test: /1\/4/i, grams: 2800 },
  { test: /1\/6/i, grams: 1600 },
  { test: /1\/7/i, grams: 1100 },
  { test: /1\/8/i, grams: 720 },
  { test: /1\/12/i, grams: 260 },
  { test: /plushie|plush|mascot|ぬい/i, grams: 280 },
  { test: /lookup|look up/i, grams: 220 },
  { test: /prize|taito|sega prize|fuRyu|noodle stopper/i, grams: 450 },
  { test: /scale\s*figure|complete figure/i, grams: 1000 },
  { test: /model kit|gunpla|plastic model|hguc|rg |mg /i, grams: 400 },
  { test: /jigsaw|puzzle/i, grams: 700 },
  { test: /manga|book|artbook|novel/i, grams: 240 },
  { test: /blu-ray|bluray|dvd/i, grams: 140 },
  { test: /trading figure|blind box/i, grams: 90 },
  { test: /acrylic|badge|pin|keychain|strap/i, grams: 60 },
  { test: /figure/i, grams: 850 },
  { test: /goods|toy/i, grams: 180 },
];

export const WEIGHT_PRESETS = [
  { id: "nendoroid", label: "Nendoroid", grams: 280 },
  { id: "figma", label: "Figma", grams: 200 },
  { id: "prize", label: "Prize", grams: 450 },
  { id: "scale17", label: "1/7 scale", grams: 1100 },
  { id: "scale18", label: "1/8 scale", grams: 720 },
  { id: "scale14", label: "1/4 scale", grams: 2800 },
  { id: "plush", label: "Pluszak", grams: 280 },
  { id: "goods", label: "Goods", grams: 120 },
  { id: "manga", label: "Manga / BD", grams: 220 },
] as const;

export function estimateWeightGrams(name: string, gcode = ""): number {
  const hay = `${name} ${gcode}`;
  for (const rule of RULES) {
    if (rule.test.test(hay)) return rule.grams;
  }
  if (/^FIGURE-/i.test(gcode)) return 850;
  if (/^GOODS-/i.test(gcode)) return 150;
  if (/^JIGS-/i.test(gcode)) return 700;
  if (/^TOY-/i.test(gcode)) return 180;
  return 400;
}

export function packedWeightGrams(
  itemGrams: number,
  packingFlatG: number,
  packingPct: number,
): number {
  const packed = itemGrams + packingFlatG + (itemGrams * packingPct) / 100;
  return Math.max(1, Math.ceil(packed));
}
