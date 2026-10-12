export const officialSources = [
  {
    name: "Secretaria de Defesa Social de Pernambuco",
    url: "https://www.sds.pe.gov.br/",
  },
  { name: "Instituto AOCP", url: "https://www.institutoaocp.org.br/" },
  { name: "Cebraspe", url: "https://www.cebraspe.org.br/concursos/" },
];
export type Notice = { title: string; url: string };
const hosts = new Set([
  "www.sds.pe.gov.br",
  "sds.pe.gov.br",
  "www.institutoaocp.org.br",
  "institutoaocp.org.br",
  "www.cebraspe.org.br",
  "cebraspe.org.br",
  "cdn.cebraspe.org.br",
]);
export function isOfficialUrl(value: string) {
  try {
    const u = new URL(value);
    return (
      u.protocol === "https:" &&
      hosts.has(u.hostname) &&
      !u.username &&
      !u.password &&
      (!u.port || u.port === "443")
    );
  } catch {
    return false;
  }
}
const clean = (text: string) =>
  text
    .replace(/<[^>]*>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;|&#160;/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
export function extractNotices(
  html: string,
  base: string,
  exam: string,
): Notice[] {
  const acronym = exam.startsWith("PMPE")
    ? "PMPE"
    : exam.startsWith("CBMPE")
      ? "CBMPE"
      : "PCPE";
  const name =
    acronym === "PMPE"
      ? /pol[ií]cia\s+militar/i
      : acronym === "CBMPE"
        ? /bombeiros/i
        : /pol[ií]cia\s+civil/i;
  const matches: Notice[] = [];
  for (const match of html.matchAll(
    /<a\b[^>]*href\s*=\s*["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi,
  )) {
    const title = clean(match[2]);
    let url: string;
    try {
      url = new URL(match[1].replace(/&amp;/g, "&"), base).href;
    } catch {
      continue;
    }
    if (!isOfficialUrl(url) || title.length < 5 || title.length > 500) continue;
    if (
      (new RegExp(acronym, "i").test(title + " " + url) || name.test(title)) &&
      /edital|concurso|sele[çc][aã]o|retifica/i.test(title + " " + url)
    )
      matches.push({ title, url });
  }
  return Array.from(new Map(matches.map((n) => [n.url, n])).values()).slice(
    0,
    20,
  );
}
