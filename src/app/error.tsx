"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="min-h-screen grid place-items-center p-6">
      <section role="alert" className="panel p-8 max-w-lg space-y-4">
        <h1 className="text-2xl font-bold">
          Não foi possível abrir esta tela.
        </h1>
        <p className="muted">
          Tente novamente. Os dados já salvos no navegador não são apagados ao
          recarregar.
        </p>
        <button className="btn" onClick={reset}>
          Tentar novamente
        </button>
      </section>
    </main>
  );
}
