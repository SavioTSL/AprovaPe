export type SuggestedTopic = { subject: string; title: string };
const normalize = (text: string) =>
  text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
const heading =
  /^(?:(?:\d+(?:\.\d+)*[.)]?|[ivx]+[.)])\s+)?((?:lingua\s+portuguesa|portugues|lingua\s+inglesa|ingles|direito\s+[a-z ]+?|nocoes\s+de\s+[a-z ]+?|legislacao(?:\s+[a-z ]+)?|informatica|raciocinio\s+logico(?:\s+e\s+matematico)?|matematica(?:\s+e\s+raciocinio\s+logico)?|historia(?:\s+de\s+pernambuco)?|geografia(?:\s+de\s+pernambuco)?|fisica|quimica|biologia|redacao|atualidades|administracao\s+publica|estatistica|conhecimentos\s+especificos))(?::|\s*[–—-]\s*|$)/i;
export function suggestSyllabus(text: string): {
  topics: SuggestedTopic[];
  warnings: string[];
} {
  const warnings: string[] = [];
  let source = text.replace(/\r/g, "");
  const markers = Array.from(
    source.matchAll(/conte[uú]do(?:s)?\s+program[aá]tico(?:s)?/gi),
  );
  // Prefer a section followed by actual discipline headings, skipping table-of-contents entries.
  if (markers.length) {
    const marker =
      markers.find((m) => {
        const following = source.slice(
          m.index! + m[0].length,
          m.index! + m[0].length + 1200,
        );
        const nextMarker = following.search(
          /conte[uú]do(?:s)?\s+program[aá]tico/gi,
        );
        const snippet =
          nextMarker >= 0 ? following.slice(0, nextMarker) : following;
        return snippet
          .split("\n")
          .some((line) => heading.test(normalize(line.trim())));
      }) || markers[0];
    source = source.slice(marker.index! + marker[0].length);
  } else
    warnings.push(
      "Não foi localizado o título “Conteúdo programático”. Selecione o trecho correto no texto antes de organizar.",
    );
  const sections: { subject: string; body: string[] }[] = [];
  let current: (typeof sections)[number] | undefined;
  for (const original of source.split("\n")) {
    const line = original.trim();
    if (/^conteudos? programaticos?/.test(normalize(line))) continue;
    if (
      !line ||
      /^---\s*P[aá]gina\s+\d+\s*---$/.test(line) ||
      /^\d+$/.test(line)
    )
      continue;
    if (
      /^(?:anexo\s+[ivx\d]+|critérios?\s+de|das?\s+inscriç|disposições\s+finais|cronograma|teste\s+de\s+aptidão)/i.test(
        line,
      )
    ) {
      current = undefined;
      continue;
    }
    const match = normalize(line).match(heading);
    if (match && match[1].length <= 100) {
      const subjectStart = match[0].indexOf(match[1]);
      const subject = line
        .slice(subjectStart, subjectStart + match[1].length)
        .trim();
      current = { subject, body: [] };
      sections.push(current);
      const rest = line.slice(match[0].length).trim();
      if (rest) current.body.push(rest);
    } else if (current) current.body.push(line);
  }
  const topics: SuggestedTopic[] = [];
  const seen = new Set<string>();
  for (const section of sections) {
    // Rejoin wrapped lines. Separate only explicit top-level numbering or semicolons.
    const body = section.body.join(" ");
    const chunks = body
      .split(/(?:^|\s)\d{1,3}[.)]\s+(?!\d)|;\s*/)
      .map((x) => x.replace(/^[-•]\s*/, "").trim())
      .filter(Boolean);
    for (const title of chunks) {
      if (title.length > 500) {
        warnings.push(
          `Um trecho de ${section.subject} excede 500 caracteres. Divida-o no texto antes de importar.`,
        );
        continue;
      }
      const key = normalize(section.subject + "|" + title);
      if (seen.has(key)) continue;
      seen.add(key);
      topics.push({ subject: section.subject, title });
    }
  }
  if (!topics.length)
    warnings.push(
      "Não foi possível identificar disciplinas e assuntos com segurança. Edite o texto com títulos como “Disciplina:” e itens numerados, ou use a importação manual abaixo.",
    );
  if (topics.length > 500) {
    warnings.push(
      "A prévia foi limitada a 500 assuntos. Importe o restante em outro lote.",
    );
    topics.splice(500);
  }
  return { topics, warnings: Array.from(new Set(warnings)) };
}
