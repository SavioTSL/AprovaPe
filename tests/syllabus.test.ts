import { strict as assert } from "node:assert";
import { test } from "node:test";
import { suggestSyllabus } from "../src/lib/syllabus.ts";
test("extracts only explicit disciplines and keeps wrapped text", () => {
  const text =
    "Informações de inscrição\nCONTEÚDO PROGRAMÁTICO\nLÍNGUA PORTUGUESA:\n1. Interpretação de texto. 2. Concordância\nverbal e nominal.\nDIREITO CONSTITUCIONAL:\n1. Direitos fundamentais; Organização do Estado.\nDISPOSIÇÕES FINAIS\n1. Taxa de inscrição";
  assert.deepEqual(suggestSyllabus(text).topics, [
    { subject: "LÍNGUA PORTUGUESA", title: "Interpretação de texto." },
    { subject: "LÍNGUA PORTUGUESA", title: "Concordância verbal e nominal." },
    { subject: "DIREITO CONSTITUCIONAL", title: "Direitos fundamentais" },
    { subject: "DIREITO CONSTITUCIONAL", title: "Organização do Estado." },
  ]);
});
test("does not invent subjects from unstructured prose", () => {
  const result = suggestSyllabus(
    "Este documento explica como participar do concurso e pagar a taxa.",
  );
  assert.equal(result.topics.length, 0);
  assert.ok(result.warnings.length > 0);
});
test("does not lose earlier topics when a section header repeats on another page", () => {
  const result = suggestSyllabus(
    "CONTEÚDO PROGRAMÁTICO\nPORTUGUÊS:\n1. Texto\n--- Página 2 ---\nCONTEÚDO PROGRAMÁTICO\nFÍSICA:\n1. Mecânica",
  );
  assert.equal(result.topics.length, 2);
  assert.equal(result.topics[0].title, "Texto");
});
test("oversized topics are flagged instead of silently truncated", () => {
  const result = suggestSyllabus(
    "CONTEÚDO PROGRAMÁTICO\nPORTUGUÊS:\n" + "a".repeat(501),
  );
  assert.equal(result.topics.length, 0);
  assert.ok(result.warnings.some((w) => w.includes("500")));
});
