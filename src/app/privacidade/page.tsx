import type { Metadata } from "next";
export const metadata: Metadata = { title: "Privacidade" };

export default function PrivacidadePage() {
  return (
    <main className="mx-auto max-w-page px-4 py-12 sm:py-16">
      <p className="text-xs text-muted-foreground">Legal</p>
      <h1 className="mt-3 text-display">Política de Privacidade</h1>
      <p className="mt-3 text-sm text-muted-foreground">Culturama — TCC. Última atualização: outubro de 2026.</p>

      <div className="prose prose-neutral mt-8 max-w-none space-y-4 text-sm leading-relaxed">
        <p>
          Esta política explica quais dados o Culturama coleta no cadastro e como eles são usados. Ao criar
          uma conta, você precisa marcar o aceite explícito deste texto (LGPD).
        </p>
        <h2 className="text-display">Dados que coletamos</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>Nome, e-mail e senha (ou dados básicos da conta Google)</li>
          <li>Data de nascimento, para restringir o cadastro a maiores de 18 anos</li>
          <li>Data e hora do aceite desta política</li>
          <li>Se você for organizador: CPF ou CNPJ, nome da empresa/coletivo e arquivo do documento</li>
        </ul>
        <h2 className="text-display">Para que usamos</h2>
        <p>
          Autenticar sua conta, cumprir a restrição de idade, verificar organizadores, proteger o site contra abuso e
          personalizar descoberta de eventos só com interesses declarados e localização pontual no mapa — sem
          rastreamento contínuo.
        </p>
        <h2 className="text-display">Por quanto tempo guardamos</h2>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong>Arquivo do documento (CPF ou CNPJ):</strong> serve só para verificar o organizador. Ele é apagado
            30 dias depois da decisão da equipe, prazo para você contestar uma recusa. O número do documento continua
            guardado, e aparece mascarado para a equipe, para impedir cadastro duplicado.
          </li>
          <li>
            <strong>Proteção contra abuso:</strong> para barrar tentativas repetidas de login, cadastro, comentário e
            rota, contamos as tentativas por um código embaralhado (hash) da sua conexão ou do seu e-mail, nunca o
            endereço em si. A contagem some quando a janela de tempo acaba, em no máximo um dia.
          </li>
          <li>
            <strong>Localização:</strong> é usada na hora, para o Perto de mim e a rota, e não fica salva.
          </li>
          <li>
            <strong>Conta:</strong> enquanto ela existir. Se você pedir a exclusão, apagamos de verdade os seus dados e
            arquivos, não só marcamos a conta como inativa.
          </li>
        </ul>
        <h2 className="text-display">Seus direitos</h2>
        <p>
          Você pode pedir à equipe do Culturama acesso aos seus dados, correção e exclusão da conta, como prevê a LGPD
          (Lei nº 13.709/2018).
        </p>
        <h2 className="text-display">Pagamentos</h2>
        <p>
          O Culturama não guarda dados de cartão. Quando houver checkout, o pagamento acontece no Mercado Pago.
        </p>
      </div>
    </main>
  );
}
