import type { FaixaInsight, LinhaInsight, TipoInsight } from "@/lib/insights-agregar";

const DIA = 86_400_000;

type Pessoa = { coorte: string; faixa: FaixaInsight };

function pessoas(prefixo: string, quantidade: number, faixa: FaixaInsight): Pessoa[] {
  return Array.from({ length: quantidade }, (_, indice) => ({ coorte: `${prefixo}-${indice + 1}`, faixa }));
}

function espalhar(
  lista: LinhaInsight[],
  agora: Date,
  evento: { eventoId: string; titulo: string; categoria: string; bairro: string; cidade: string; patrocinado: boolean; temOrganizador: boolean },
  grupo: Pessoa[],
  tipo: TipoInsight,
  diasAtras: number,
  repeticoes = 1,
) {
  grupo.forEach((pessoa, indice) => {
    for (let vez = 0; vez < repeticoes; vez += 1) {
      const deslocamento = diasAtras * DIA - (indice % 5) * 3_600_000 - vez * 60_000;
      lista.push({
        ...evento,
        tipo,
        faixa: pessoa.faixa,
        coorte: pessoa.coorte,
        data: new Date(agora.getTime() - deslocamento),
      });
    }
  });
}

/** Série fictícia, só em memória. Não persiste. */
export function dadosDemo(agora = new Date()): LinhaInsight[] {
  const jovens = pessoas("jovem", 22, "de_18_a_24");
  const adultos = pessoas("adulto", 22, "de_25_a_34");
  const seniors = pessoas("senior", 6, "de_55_ou_mais");
  const show = {
    eventoId: "demo-show",
    titulo: "Show na Vila",
    categoria: "Música",
    bairro: "Vila Madalena",
    cidade: "São Paulo",
    patrocinado: false,
    temOrganizador: true,
  };
  const peca = {
    eventoId: "demo-peca",
    titulo: "Peça no Centro",
    categoria: "Artes cênicas",
    bairro: "Centro",
    cidade: "São Paulo",
    patrocinado: true,
    temOrganizador: true,
  };
  const festival = {
    eventoId: "demo-festival",
    titulo: "Festival de jogos",
    categoria: "Geek e games",
    bairro: "Pinheiros",
    cidade: "São Paulo",
    patrocinado: false,
    temOrganizador: true,
  };
  const corrida = {
    eventoId: "demo-corrida",
    titulo: "Corrida no parque",
    categoria: "Esportes",
    bairro: "Ibirapuera",
    cidade: "São Paulo",
    patrocinado: false,
    temOrganizador: false,
  };
  const linhas: LinhaInsight[] = [];

  espalhar(linhas, agora, show, jovens, "visualizacao", 2, 2);
  espalhar(linhas, agora, show, jovens, "favorito", 3);
  espalhar(linhas, agora, show, jovens, "ingresso", 4);
  espalhar(linhas, agora, show, jovens.slice(0, 22), "visualizacao", 40);
  espalhar(linhas, agora, peca, jovens, "visualizacao", 5);
  espalhar(linhas, agora, peca, jovens, "como_chegar", 6);
  espalhar(linhas, agora, festival, adultos, "visualizacao", 1, 2);
  espalhar(linhas, agora, festival, adultos, "ingresso", 2);
  espalhar(linhas, agora, festival, adultos, "favorito", 8);
  espalhar(linhas, agora, corrida, adultos.slice(0, 10), "visualizacao", 10);
  espalhar(linhas, agora, { ...show, eventoId: "demo-sarau", titulo: "Sarau", categoria: "Literatura", bairro: "Liberdade", cidade: "São Paulo", patrocinado: false, temOrganizador: true }, seniors, "visualizacao", 3);

  return linhas;
}
