import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "AprovaPE | Seu plano de aprovação",
  description: "Plataforma pessoal de estudos para concursos de Pernambuco",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
