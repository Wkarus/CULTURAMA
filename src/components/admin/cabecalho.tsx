export function CabecalhoAdmin({
  titulo,
  descricao,
  acoes,
}: {
  titulo: string;
  descricao?: string;
  acoes?: React.ReactNode;
}) {
  return (
    <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div className="grid max-w-2xl gap-2">
        <h1 className="font-display text-3xl font-bold tracking-display lg:text-4xl">{titulo}</h1>
        {descricao ? <p className="text-sm text-muted-on-dark lg:text-base">{descricao}</p> : null}
      </div>
      {acoes ? <div className="flex flex-wrap items-center gap-2">{acoes}</div> : null}
    </header>
  );
}

export function Vazio({ children }: { children: React.ReactNode }) {
  return <p className="panel-dark rounded-card px-5 py-8 text-center text-sm text-muted-on-dark">{children}</p>;
}
