import { NextRequest, NextResponse } from "next/server";
import { exams } from "@/lib/data";
import { extractNotices, isOfficialUrl, officialSources } from "@/lib/editais";
export const runtime = "nodejs";
async function readOfficial(url: string): Promise<string> {
  if (!isOfficialUrl(url)) throw new Error("Fonte inválida");
  const response = await fetch(url, {
    redirect: "manual",
    signal: AbortSignal.timeout(8000),
    headers: { Accept: "text/html" },
    next: { revalidate: 3600 },
  });
  if (
    !response.ok ||
    !response.headers.get("content-type")?.includes("text/html")
  )
    throw new Error("Fonte indisponível");
  const reader = response.body?.getReader();
  if (!reader) throw new Error("Resposta vazia");
  let size = 0;
  const chunks: Uint8Array[] = [];
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > 1_000_000) throw new Error("Página muito grande");
      chunks.push(value);
    }
  } finally {
    await reader.cancel();
  }
  return new TextDecoder().decode(Buffer.concat(chunks));
}
export async function GET(request: NextRequest) {
  const exam = request.nextUrl.searchParams.get("exam");
  if (!exam || !exams.includes(exam))
    return NextResponse.json(
      { error: "Selecione um concurso válido." },
      { status: 400 },
    );
  // Fixed official destinations only; never fetch user-provided URLs.
  const sources = [
    officialSources[0],
    exam.startsWith("PCPE") ? officialSources[2] : officialSources[1],
  ];
  const results = await Promise.all(
    sources.map(async (source) => {
      try {
        return {
          source,
          available: true,
          notices: extractNotices(
            await readOfficial(source.url),
            source.url,
            exam,
          ),
        };
      } catch {
        return { source, available: false, notices: [] };
      }
    }),
  );
  return NextResponse.json({
    exam,
    checkedAt: new Date().toISOString(),
    notices: Array.from(
      new Map(
        results.flatMap((r) => r.notices).map((n) => [n.url, n]),
      ).values(),
    ),
    sources: results.map((r) => ({
      name: r.source.name,
      url: r.source.url,
      available: r.available,
    })),
    message: results.every((r) => !r.available)
      ? "Não foi possível consultar as fontes agora. Acesse os portais oficiais abaixo e tente novamente mais tarde."
      : "A consulta cobre as páginas públicas dos portais e pode não localizar documentos em páginas internas. Confira cargo, ano, edital de abertura e retificações antes de usar.",
  });
}
