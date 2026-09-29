export default function PrivacidadePage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-semibold tracking-tight">Política de Privacidade</h1>
      <p className="mt-2 text-sm text-muted-foreground">Culturama — TCC. Última atualização: setembro de 2026.</p>

      <div className="prose prose-neutral mt-8 max-w-none space-y-4 text-sm leading-relaxed">
        <p>
          Esta política explica quais dados o Culturama coleta no cadastro e como eles são usados. Ao criar
          uma conta, você precisa marcar o aceite explícito deste texto (LGPD).
        </p>
        <h2 className="text-lg font-semibold">Dados que coletamos</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>Nome, e-mail e senha (ou dados básicos da conta Google)</li>
          <li>Data de nascimento, para restringir o cadastro a maiores de 18 anos</li>
          <li>Data e hora do aceite desta política</li>
          <li>Se você for organizador: CPF ou CNPJ, nome da empresa/coletivo e arquivo do documento</li>
        </ul>
        <h2 className="text-lg font-semibold">Para que usamos</h2>
        <p>
          Autenticar sua conta, cumprir a restrição de idade, verificar organizadores e, nas fases seguintes,
          personalizar descoberta de eventos só com interesses declarados e localização pontual no mapa — sem
          rastreamento contínuo.
        </p>
        <h2 className="text-lg font-semibold">Seus direitos</h2>
        <p>
          Você pode pedir acesso, correção e exclusão da conta. A exclusão será real (apagamos ou anonimizamos
          os dados), não apenas um campo “inativo”. Esse endpoint entra junto com o restante da conformidade
          LGPD; nesta Fase 1 o aceite e a política já fazem parte do cadastro.
        </p>
        <h2 className="text-lg font-semibold">Pagamentos</h2>
        <p>
          O Culturama não guarda dados de cartão. Quando houver checkout, o pagamento acontece no Mercado Pago.
        </p>
      </div>
    </main>
  );
}
