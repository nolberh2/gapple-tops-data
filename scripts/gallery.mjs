// Galería de skins populares del launcher de GappleClient.
//
// Pide a LabyNet las dos listas y las deja en gallery/skins.json. Corre en
// GitHub y no en la web porque LabyNet bloquea todo lo que sale de Cloudflare.
// LabyNet no ofrece esto oficialmente (es la consulta de su propia web), así
// que una lista rota o recortada no pisa la guardada: se queda la de ayer.
import { readFileSync, writeFileSync } from "node:fs";

const LABYNET = "https://laby.net/api/v3/search/textures/skin";
const LISTS = { trending: "trending_7d", popular: "most_used" };
// LabyNet da como mucho 100 por consulta. Se pide una tanda más porque el
// filtro tira algunas.
const PAGE = 100;
const PAGES = 2;
const KEEP = 100;
const MIN_GOOD = 12;
const OUT = "gallery/skins.json";

// Cualquiera sube skins y las etiqueta. Se compara contra trozos de las
// etiquetas en minúsculas, así que tira también las compuestas ("sexygirl").
// ponytail: lista corta a mano; ampliar cuando se cuele algo, no antes.
const BANNED = [
  "nazi", "hitler", "swastika", "kkk", "isis", "terror",
  "porn", "sex", "nude", "naked", "nackt", "hentai", "nsfw", "boob", "tits", "dick", "penis",
  "fuck", "nigg", "fag", "rape", "hure", "puta", "verga",
];
const HASH = /^[0-9a-f]{32}$/;

/** Solo lo que el launcher necesita, validado, sin repetidas ni prohibidas. */
export function cleanList(raw) {
  const seen = new Set();
  const out = [];
  for (const r of Array.isArray(raw) ? raw : []) {
    const hash = typeof r?.image_hash === "string" ? r.image_hash.toLowerCase() : "";
    if (!HASH.test(hash) || seen.has(hash)) continue;
    const tags = typeof r.tags === "string" ? r.tags.trim().slice(0, 80) : "";
    if (BANNED.some((w) => tags.toLowerCase().includes(w))) continue;
    seen.add(hash);
    out.push({
      hash,
      uses: Number.isSafeInteger(r.use_count) && r.use_count > 0 ? r.use_count : 0,
      tags,
      slim: r.slim === true,
    });
    if (out.length === KEEP) break;
  }
  return out;
}

function check() {
  const h = (c) => c.repeat(32);
  const out = cleanList([
    { image_hash: h("a"), use_count: 10, tags: "Orange Suit", slim: false },
    { image_hash: h("a"), use_count: 9, tags: "Repetida" },
    { image_hash: h("b"), use_count: 5, tags: "Sexy Girl", slim: true },
    { image_hash: "../../x", use_count: 5, tags: "Ruta" },
    { image_hash: h("C"), use_count: -3, tags: 42, slim: "sí" },
    null,
  ]);
  const want = [
    { hash: h("a"), uses: 10, tags: "Orange Suit", slim: false },
    { hash: h("c"), uses: 0, tags: "", slim: false },
  ];
  if (JSON.stringify(out) !== JSON.stringify(want)) throw new Error("cleanList: " + JSON.stringify(out));
  if (cleanList(undefined).length !== 0) throw new Error("cleanList(undefined)");
}

async function main() {
  check();
  let saved = { trending: [], popular: [] };
  try {
    saved = { ...saved, ...JSON.parse(readFileSync(OUT, "utf8")) };
  } catch {} // la primera vez no hay archivo
  let failed = 0;
  for (const [list, order] of Object.entries(LISTS)) {
    try {
      const raw = [];
      for (let i = 0; i < PAGES; i++) {
        const res = await fetch(`${LABYNET}?order=${order}&size=${PAGE}&offset=${i * PAGE}`, {
          headers: { Accept: "application/json" },
        });
        if (!res.ok) throw new Error(`LabyNet ${res.status}`);
        raw.push(...((await res.json())?.results ?? []));
      }
      const skins = cleanList(raw);
      if (skins.length < MIN_GOOD) throw new Error(`solo ${skins.length} skins`);
      saved[list] = skins;
    } catch (err) {
      failed++;
      console.error(`${list}: ${err.message}; se queda la guardada`);
    }
  }
  writeFileSync(OUT, JSON.stringify({ trending: saved.trending, popular: saved.popular }) + "\n");
  // Que falle una se ve en rojo en GitHub, pero lo bueno se guarda igual.
  if (failed) process.exitCode = 1;
}

await main();
