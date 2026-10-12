export type PdfText = { name: string; pages: number; text: string };
export async function readPdf(
  file: File,
  onProgress: (page: number, total: number) => void,
  onTask: (task: { destroy: () => Promise<void> }) => void,
): Promise<PdfText> {
  if (!file.size || file.size > 25 * 1024 * 1024)
    throw new Error("Selecione um PDF de até 25 MB.");
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!new TextDecoder().decode(bytes.slice(0, 1024)).includes("%PDF-"))
    throw new Error("O arquivo não tem uma assinatura PDF válida.");
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url,
  ).toString();
  const task = pdfjs.getDocument({ data: bytes, useSystemFonts: true });
  onTask(task);
  try {
    const document = await task.promise;
    if (document.numPages > 150)
      throw new Error(
        "Este PDF tem mais de 150 páginas. Envie apenas o anexo do conteúdo programático.",
      );
    const pages: string[] = [];
    let totalLength = 0;
    for (let n = 1; n <= document.numPages; n++) {
      const page = await document.getPage(n);
      const content = await page.getTextContent();
      let text = "",
        lastY: number | null = null;
      for (const item of content.items) {
        if (!("str" in item)) continue;
        const y = item.transform[5];
        if (lastY !== null && Math.abs(y - lastY) > 3 && !text.endsWith("\n"))
          text += "\n";
        text += item.str + (item.hasEOL ? "\n" : " ");
        lastY = y;
      }
      totalLength += text.length;
      if (totalLength > 500000)
        throw new Error(
          "O documento tem texto demais. Envie somente o anexo do conteúdo programático.",
        );
      pages.push(`--- Página ${n} ---\n${text.trim()}`);
      page.cleanup();
      onProgress(n, document.numPages);
    }
    if (
      pages
        .join("")
        .replace(/--- Página \d+ ---/g, "")
        .trim().length < 30
    )
      throw new Error(
        "Não foi encontrado texto selecionável. Este PDF pode ser digitalizado como imagem; use uma versão com texto ou copie o conteúdo após OCR.",
      );
    return {
      name: file.name,
      pages: document.numPages,
      text: pages.join("\n\n"),
    };
  } catch (error) {
    if (error instanceof Error && error.name === "PasswordException")
      throw new Error(
        "Este PDF está protegido por senha. Envie uma cópia sem proteção.",
      );
    if (
      error instanceof Error &&
      ["InvalidPDFException", "UnknownErrorException"].includes(error.name)
    )
      throw new Error(
        "O PDF está danificado ou usa uma estrutura não suportada. Tente outra cópia do documento.",
      );
    throw error;
  } finally {
    await task.destroy();
  }
}
