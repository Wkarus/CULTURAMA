"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type Matter from "matter-js";
import { Check, Loader2 } from "lucide-react";
import { salvarInteresses } from "@/actions/social";
import { buttonVariants } from "@/components/ui/button";
import { iconeLucide } from "@/lib/perfil";
import { cn } from "@/lib/utils";
import { visual } from "@/lib/visual-tokens";

type Categoria = { id: string; nome: string; slug: string; icone: string };

const MINIMO = 3;
const ESCALA_MARCADA = 1.35;
const ESCALA_SAINDO = 0.6;
const VARIACAO_RAIO = [1, 0.9, 1.1, 0.94, 1.06, 0.88, 1.12, 0.97, 1.03];
const SEM_FISICA = "(prefers-reduced-motion: reduce), (max-width: 359px), (max-height: 559px)";
const PASSO_MS = 1000 / 60;
const ATRITO_AR = 0.035;
const ARRASTE_MINIMO = 6;
const DURACAO_FAISCA = 520;
const CORES_FAISCA = [visual.accentHoverText, visual.accentTo, visual.onDark];
const DURACAO_SAIDA_MS = 1000;

const FOCO_ESCURO =
  "outline-none focus-visible:ring-2 focus-visible:ring-accent-hover focus-visible:ring-offset-2 focus-visible:ring-offset-surface-dark";

type Bolha = {
  nome: string;
  corpo: Matter.Body;
  raio: number;
  escala: number;
  velocidadeEscala: number;
  fase: number;
  oculta: boolean;
};

type Faisca = { bolha: Bolha; inicio: number; giro: number };

function useSemFisica() {
  const [semFisica, setSemFisica] = useState<boolean | null>(null);
  useEffect(() => {
    const consulta = window.matchMedia(SEM_FISICA);
    const atualizar = () => setSemFisica(consulta.matches);
    atualizar();
    consulta.addEventListener("change", atualizar);
    return () => consulta.removeEventListener("change", atualizar);
  }, []);
  return semFisica;
}

function Palco({
  categorias,
  marcadosRef,
  saindoRef,
  marcados,
  saindo,
  onAlternar,
  acoesRef,
}: {
  categorias: Categoria[];
  marcadosRef: React.MutableRefObject<Set<string>>;
  saindoRef: React.MutableRefObject<boolean>;
  marcados: Set<string>;
  saindo: boolean;
  onAlternar: (nome: string) => void;
  acoesRef: React.MutableRefObject<{ celebrar: (nome: string) => void } | null>;
}) {
  const palcoRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const elementos = useRef(new Map<string, HTMLButtonElement>());
  const ignorarClique = useRef(false);

  useEffect(() => {
    const palco = palcoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!palco || !canvas || !ctx) return;

    let cancelado = false;
    let desmontar = () => {};

    import("matter-js").then(({ default: M }) => {
      if (cancelado) return;
      const { Body, Bodies, Composite, Constraint, Engine, Vector } = M;

      const engine = Engine.create({ gravity: { x: 0, y: 0, scale: 0 } });
      let largura = palco.clientWidth;
      let altura = palco.clientHeight;
      const n = categorias.length;
      const raioBase = Math.min(88, Math.max(46, Math.sqrt((largura * altura * 0.26) / (n * Math.PI))));

      const ESPESSURA = 400;
      const COMPRIMENTO = 20000;
      const parede = (w: number, h: number) => Bodies.rectangle(0, 0, w, h, { isStatic: true });
      const chao = parede(COMPRIMENTO, ESPESSURA);
      const esquerda = parede(ESPESSURA, COMPRIMENTO);
      const direita = parede(ESPESSURA, COMPRIMENTO);
      const teto = parede(COMPRIMENTO, ESPESSURA);
      let tetoAtivo = false;

      const posicionarParedes = () => {
        Body.setPosition(chao, { x: largura / 2, y: altura + ESPESSURA / 2 });
        Body.setPosition(esquerda, { x: -ESPESSURA / 2, y: altura / 2 });
        Body.setPosition(direita, { x: largura + ESPESSURA / 2, y: altura / 2 });
        Body.setPosition(teto, { x: largura / 2, y: -ESPESSURA / 2 });
      };
      posicionarParedes();
      Composite.add(engine.world, [chao, esquerda, direita]);

      const bolhas: Bolha[] = categorias.map((cat, i) => {
        const raio = raioBase * VARIACAO_RAIO[i % VARIACAO_RAIO.length];
        const x = largura * (0.15 + 0.7 * ((i * 0.618 + 0.2) % 1));
        const y = -raio - i * raio * 0.7 - Math.random() * 60;
        const corpo = Bodies.circle(x, y, raio, { restitution: 0.45, friction: 0.02, frictionAir: ATRITO_AR });
        Body.setVelocity(corpo, { x: (Math.random() - 0.5) * 5, y: 7 + Math.random() * 5 });

        const el = elementos.current.get(cat.slug);
        if (el) {
          el.style.width = `${raio * 2}px`;
          el.style.height = `${raio * 2}px`;
          el.style.setProperty("--r", `${raio}px`);
        }
        return { nome: cat.slug, corpo, raio, escala: 1, velocidadeEscala: 0, fase: Math.random() * Math.PI * 2, oculta: false };
      });
      Composite.add(
        engine.world,
        bolhas.map((b) => b.corpo),
      );

      const porNome = new Map(bolhas.map((b) => [b.nome, b]));
      let faiscas: Faisca[] = [];
      let canvasSujo = false;

      const ajustarCanvas = () => {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.round(largura * dpr);
        canvas.height = Math.round(altura * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      };
      ajustarCanvas();

      acoesRef.current = {
        celebrar(nome) {
          const alvo = porNome.get(nome);
          if (!alvo) return;
          const raioFinal = alvo.raio * ESCALA_MARCADA;
          for (const b of bolhas) {
            if (b === alvo || b.oculta) continue;
            const d = Vector.sub(b.corpo.position, alvo.corpo.position);
            const dist = Vector.magnitude(d) || 1;
            const alcance = raioFinal + b.raio * b.escala + 36;
            if (dist < alcance) {
              const forca = (1 - dist / alcance) * 7;
              Body.setVelocity(b.corpo, Vector.add(b.corpo.velocity, Vector.mult(d, forca / dist)));
            }
          }
          faiscas.push({ bolha: alvo, inicio: performance.now(), giro: Math.random() * Math.PI });
        },
      };

      const forcas = (t: number) => {
        const saindoAgora = saindoRef.current;
        const cx = largura / 2;
        const cy = altura / 2;
        const k = saindoAgora ? 4e-6 : 6e-7;
        const proporcao = Math.min(2.2, Math.max(1, largura / altura));
        let todasDentro = true;

        for (const b of bolhas) {
          const marcada = marcadosRef.current.has(b.nome);
          const oculta = saindoAgora && !marcada;
          if (oculta !== b.oculta) {
            b.oculta = oculta;
            b.corpo.collisionFilter.mask = oculta ? 0 : -1;
          }
          b.corpo.frictionAir = saindoAgora && marcada ? 0.12 : ATRITO_AR;

          const alvo = oculta ? ESCALA_SAINDO : marcada ? ESCALA_MARCADA : 1;
          b.velocidadeEscala = (b.velocidadeEscala + (alvo - b.escala) * 0.16) * 0.74;
          const nova = Math.max(0.4, b.escala + b.velocidadeEscala);
          Body.scale(b.corpo, nova / b.escala, nova / b.escala);
          b.escala = nova;

          if (oculta) continue;
          const { position, mass } = b.corpo;
          if (position.y < b.raio * b.escala) todasDentro = false;
          Body.applyForce(b.corpo, position, {
            x: (cx - position.x) * k * mass + Math.cos(t * 0.0006 + b.fase) * 3.6e-5 * mass,
            y: (cy - position.y) * k * proporcao * mass + Math.sin(t * 0.0008 + b.fase) * 3.6e-5 * mass,
          });
        }

        if (!tetoAtivo && todasDentro) {
          tetoAtivo = true;
          Composite.add(engine.world, teto);
        }
      };

      const desenhar = (agora: number) => {
        for (const b of bolhas) {
          const el = elementos.current.get(b.nome);
          if (!el) continue;
          const { x, y } = b.corpo.position;
          el.style.transform = `translate3d(${x - b.raio}px, ${y - b.raio}px, 0) scale(${b.escala})`;
        }

        if (faiscas.length === 0 && !canvasSujo) return;
        ctx.clearRect(0, 0, largura, altura);
        faiscas = faiscas.filter((f) => agora - f.inicio < DURACAO_FAISCA);
        canvasSujo = faiscas.length > 0;
        for (const f of faiscas) {
          const p = (agora - f.inicio) / DURACAO_FAISCA;
          const e = 1 - (1 - p) ** 3;
          const { x, y } = f.bolha.corpo.position;
          const r = f.bolha.raio * f.bolha.escala;

          ctx.globalAlpha = (1 - p) * 0.55;
          ctx.lineWidth = 2;
          ctx.strokeStyle = visual.accentHoverText;
          ctx.beginPath();
          ctx.arc(x, y, r * (1 + 0.3 * e), 0, Math.PI * 2);
          ctx.stroke();

          ctx.globalAlpha = 1 - p;
          ctx.lineCap = "round";
          ctx.lineWidth = 2.5;
          for (let i = 0; i < 12; i++) {
            const angulo = f.giro + (i * Math.PI * 2) / 12;
            const inicio = r + 8 + e * 36;
            const fim = inicio + 14 * (1 - e);
            ctx.strokeStyle = CORES_FAISCA[i % CORES_FAISCA.length];
            ctx.beginPath();
            ctx.moveTo(x + Math.cos(angulo) * inicio, y + Math.sin(angulo) * inicio);
            ctx.lineTo(x + Math.cos(angulo) * fim, y + Math.sin(angulo) * fim);
            ctx.stroke();
          }
        }
        ctx.globalAlpha = 1;
      };

      let raf = 0;
      let ultimo = 0;
      let acumulado = 0;
      const quadro = (agora: number) => {
        acumulado = Math.min(acumulado + (agora - ultimo), PASSO_MS * 4);
        ultimo = agora;
        while (acumulado >= PASSO_MS) {
          forcas(engine.timing.timestamp);
          Engine.update(engine, PASSO_MS);
          acumulado -= PASSO_MS;
        }
        desenhar(agora);
        raf = requestAnimationFrame(quadro);
      };
      const iniciar = () => {
        if (raf) return;
        ultimo = performance.now();
        acumulado = PASSO_MS;
        raf = requestAnimationFrame(quadro);
      };
      const parar = () => {
        cancelAnimationFrame(raf);
        raf = 0;
      };
      const aoMudarVisibilidade = () => (document.hidden ? parar() : iniciar());
      document.addEventListener("visibilitychange", aoMudarVisibilidade);
      if (!document.hidden) iniciar();

      const observador = new ResizeObserver(() => {
        largura = palco.clientWidth;
        altura = palco.clientHeight;
        posicionarParedes();
        ajustarCanvas();
        canvasSujo = true;
        for (const b of bolhas) {
          const r = b.raio * b.escala;
          const { x, y } = b.corpo.position;
          const dentroX = Math.min(Math.max(x, r), Math.max(r, largura - r));
          const dentroY = tetoAtivo ? Math.min(Math.max(y, r), Math.max(r, altura - r)) : Math.min(y, altura - r);
          if (dentroX !== x || dentroY !== y) Body.setPosition(b.corpo, { x: dentroX, y: dentroY });
        }
      });
      observador.observe(palco);

      let arraste: { bolha: Bolha; mola: Matter.Constraint; origem: Matter.Vector; id: number; moveu: boolean } | null = null;
      const pontoLocal = (e: PointerEvent) => {
        const caixa = palco.getBoundingClientRect();
        return { x: e.clientX - caixa.left, y: e.clientY - caixa.top };
      };
      const aoPressionar = (e: PointerEvent) => {
        if (arraste || saindoRef.current || e.button !== 0) return;
        const nome = (e.target as Element).closest<HTMLElement>("[data-bolha]")?.dataset.bolha;
        const bolha = nome ? porNome.get(nome) : undefined;
        if (!bolha) return;
        const ponto = pontoLocal(e);
        const mola = Constraint.create({
          pointA: ponto,
          bodyB: bolha.corpo,
          pointB: Vector.sub(ponto, bolha.corpo.position),
          length: 0,
          stiffness: 0.12,
          damping: 0.08,
        });
        Composite.add(engine.world, mola);
        arraste = { bolha, mola, origem: ponto, id: e.pointerId, moveu: false };
      };
      const aoMover = (e: PointerEvent) => {
        if (!arraste || e.pointerId !== arraste.id) return;
        const ponto = pontoLocal(e);
        arraste.mola.pointA = ponto;
        if (!arraste.moveu && Vector.magnitude(Vector.sub(ponto, arraste.origem)) > ARRASTE_MINIMO) {
          arraste.moveu = true;
          palco.setPointerCapture(e.pointerId);
        }
      };
      const aoSoltar = (e: PointerEvent) => {
        if (!arraste || e.pointerId !== arraste.id) return;
        Composite.remove(engine.world, arraste.mola);
        if (arraste.moveu) {
          ignorarClique.current = true;
          window.setTimeout(() => {
            ignorarClique.current = false;
          }, 0);
        }
        arraste = null;
      };
      palco.addEventListener("pointerdown", aoPressionar);
      palco.addEventListener("pointermove", aoMover);
      palco.addEventListener("pointerup", aoSoltar);
      palco.addEventListener("pointercancel", aoSoltar);

      desmontar = () => {
        parar();
        document.removeEventListener("visibilitychange", aoMudarVisibilidade);
        observador.disconnect();
        palco.removeEventListener("pointerdown", aoPressionar);
        palco.removeEventListener("pointermove", aoMover);
        palco.removeEventListener("pointerup", aoSoltar);
        palco.removeEventListener("pointercancel", aoSoltar);
        acoesRef.current = null;
        Composite.clear(engine.world, false);
        Engine.clear(engine);
      };
    });

    return () => {
      cancelado = true;
      desmontar();
    };
  }, [categorias, marcadosRef, saindoRef, acoesRef]);

  return (
    <div ref={palcoRef} className="relative min-h-[360px] flex-1 overflow-hidden">
      <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 z-20 size-full" aria-hidden />
      {categorias.map((cat) => {
        const rotulo = cat.nome;
        const Icone = iconeLucide(cat.icone);
        const marcado = marcados.has(cat.slug);
        return (
          <button
            key={cat.id}
            ref={(el) => {
              if (el) elementos.current.set(cat.slug, el);
              else elementos.current.delete(cat.slug);
            }}
            type="button"
            role="checkbox"
            aria-checked={marcado}
            data-bolha={cat.slug}
            disabled={saindo}
            onClick={() => {
              if (ignorarClique.current) {
                ignorarClique.current = false;
                return;
              }
              onAlternar(cat.slug);
            }}
            className={cn(
              "absolute left-0 top-0 flex touch-none select-none flex-col items-center justify-center gap-[calc(var(--r)*0.07)] rounded-full border text-center will-change-transform [transform:translate3d(-9999px,0,0)]",
              "cursor-grab transition-[opacity,background-color,border-color,box-shadow,color] duration-300 active:cursor-grabbing",
              FOCO_ESCURO,
              marcado
                ? "z-10 border-transparent bg-accent-gradient text-on-dark shadow-cta"
                : "border-[color-mix(in_srgb,var(--color-on-dark)_14%,transparent)] bg-[color-mix(in_srgb,var(--color-on-dark)_7%,var(--color-surface-dark))] text-on-dark shadow-card hover:border-[color-mix(in_srgb,var(--color-on-dark)_30%,transparent)]",
              saindo && !marcado && "opacity-0",
            )}
          >
            <Icone
              className={cn("size-[calc(var(--r)*0.4)] transition-colors", marcado ? "text-on-dark" : "text-accent-hover")}
              strokeWidth={1.6}
              aria-hidden
            />
            <span className="max-w-[84%] text-balance font-display text-[length:max(13px,calc(var(--r)*0.22))] font-semibold leading-[1.05]">
              {rotulo}
            </span>
            <span
              className={cn(
                "absolute right-[8%] top-[8%] inline-flex size-[max(22px,calc(var(--r)*0.4))] items-center justify-center rounded-full bg-on-dark text-accent-to shadow-card",
                "transition-[transform,opacity] duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]",
                marcado ? "scale-100 opacity-100" : "scale-0 opacity-0",
              )}
              aria-hidden
            >
              <Check className="size-[60%]" strokeWidth={3} />
            </span>
          </button>
        );
      })}
    </div>
  );
}

function GradeChips({
  categorias,
  marcados,
  saindo,
  onAlternar,
}: {
  categorias: Categoria[];
  marcados: Set<string>;
  saindo: boolean;
  onAlternar: (nome: string) => void;
}) {
  return (
    <div className="mx-auto grid w-full max-w-3xl flex-1 content-center grid-cols-2 gap-3 px-4 py-8 sm:flex sm:flex-wrap sm:justify-center">
      {categorias.map((cat) => {
        const rotulo = cat.nome;
        const Icone = iconeLucide(cat.icone);
        const marcado = marcados.has(cat.slug);
        return (
          <button
            key={cat.id}
            type="button"
            role="checkbox"
            aria-checked={marcado}
            disabled={saindo}
            onClick={() => onAlternar(cat.slug)}
            className={cn(
              "inline-flex h-16 items-center justify-center gap-2.5 rounded-control border px-5 text-lg font-medium transition-[opacity,transform,background-color,border-color] duration-300",
              FOCO_ESCURO,
              marcado
                ? "border-transparent bg-accent-gradient text-on-dark shadow-cta"
                : "border-[color-mix(in_srgb,var(--color-on-dark)_16%,transparent)] text-muted-on-dark hover:text-on-dark",
              saindo && !marcado && "scale-95 opacity-0",
            )}
          >
            <Icone className="size-5 shrink-0" strokeWidth={1.75} aria-hidden />
            {rotulo}
            {marcado ? <Check className="size-5 shrink-0" strokeWidth={2.25} aria-hidden /> : null}
          </button>
        );
      })}
    </div>
  );
}

export function OnboardingInteresses({ categorias }: { categorias: Categoria[] }) {
  const router = useRouter();
  const semFisica = useSemFisica();
  const [marcados, setMarcados] = useState<Set<string>>(() => new Set());
  const [saindo, setSaindo] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const marcadosRef = useRef(marcados);
  const saindoRef = useRef(false);
  const acoesRef = useRef<{ celebrar: (nome: string) => void } | null>(null);

  const total = marcados.size;
  const pronto = total >= MINIMO;

  const alternar = (nome: string) => {
    if (saindoRef.current) return;
    const proximo = new Set(marcadosRef.current);
    const marcando = !proximo.has(nome);
    if (marcando) proximo.add(nome);
    else proximo.delete(nome);
    marcadosRef.current = proximo;
    setMarcados(proximo);
    if (marcando) acoesRef.current?.celebrar(nome);
  };

  const continuar = async () => {
    if (!pronto || saindoRef.current) return;
    saindoRef.current = true;
    setSaindo(true);
    setErro(null);

    const dados = new FormData();
    marcadosRef.current.forEach((nome) => dados.append("interesse", nome));
    await new Promise((resolver) => setTimeout(resolver, semFisica ? 350 : DURACAO_SAIDA_MS));

    try {
      const resultado = await salvarInteresses({}, dados);
      if (resultado.error) throw new Error(resultado.error);
      router.push("/eventos");
    } catch (e) {
      saindoRef.current = false;
      setSaindo(false);
      setErro(e instanceof Error && e.message ? e.message : "Não deu pra salvar agora. Tenta de novo.");
    }
  };

  return (
    <main className="relative isolate flex min-h-dvh flex-col overflow-clip bg-surface-dark pt-16 text-on-dark">
      <div className="hero-orbs pointer-events-none absolute inset-0 -z-10 opacity-60" aria-hidden>
        <span className="hero-orb hero-orb-a" />
        <span className="hero-orb hero-orb-b" />
        <span className="hero-orb hero-orb-c" />
      </div>

      <header className="px-4 pt-8 text-center sm:pt-12">
        <h1 id="onboarding-titulo" className="text-balance font-display text-[clamp(2.25rem,5vw,3.75rem)] font-bold leading-[1.05] tracking-display">
          Do que você <span className="text-accent-gradient">curte?</span>
        </h1>
        <p className="mx-auto mt-3 max-w-[40ch] text-balance text-lg text-muted-on-dark">
          Escolha pelo menos {MINIMO} pra gente montar seu rolê
        </p>
      </header>

      <div role="group" aria-labelledby="onboarding-titulo" className="flex flex-1 flex-col">
        {semFisica === null ? (
          <div className="min-h-[360px] flex-1" />
        ) : semFisica ? (
          <GradeChips categorias={categorias} marcados={marcados} saindo={saindo} onAlternar={alternar} />
        ) : (
          <Palco
            categorias={categorias}
            marcadosRef={marcadosRef}
            saindoRef={saindoRef}
            marcados={marcados}
            saindo={saindo}
            onAlternar={alternar}
            acoesRef={acoesRef}
          />
        )}
      </div>

      <footer className="sticky bottom-0 z-30 border-t border-[color-mix(in_srgb,var(--color-on-dark)_10%,transparent)] bg-[color-mix(in_srgb,var(--color-surface-dark)_82%,transparent)] backdrop-blur-md">
        <div className="mx-auto flex max-w-page flex-wrap items-center justify-between gap-x-6 gap-y-3 px-4 py-4">
          <div className="grid w-full gap-2 sm:w-56">
            <p className="text-sm font-medium" aria-live="polite">
              {pronto ? `${total} escolhidas` : `${total} de ${MINIMO} escolhidas`}
            </p>
            <div className="rule-dark h-1.5 overflow-hidden rounded-pill" aria-hidden>
              <div
                className="h-full rounded-pill bg-accent-gradient transition-[width] duration-500 ease-out"
                style={{ width: `${Math.min(total / MINIMO, 1) * 100}%` }}
              />
            </div>
          </div>
          {erro ? (
            <p role="alert" className="order-last w-full text-sm text-danger sm:order-none sm:w-auto sm:flex-1">
              {erro}
            </p>
          ) : null}
          <div className="flex w-full items-center justify-end gap-5 sm:w-auto">
            <Link
              href="/eventos"
              className={cn("rounded-sm text-sm font-semibold text-muted-on-dark underline-offset-4 hover:text-on-dark hover:underline", FOCO_ESCURO)}
            >
              Pular por agora
            </Link>
            <button
              type="button"
              onClick={continuar}
              disabled={!pronto || saindo}
              className={cn(buttonVariants(), "h-12 min-w-36 gap-2 px-6 text-base font-medium disabled:opacity-50", saindo && "disabled:opacity-100", FOCO_ESCURO)}
            >
              {saindo ? <Loader2 className="size-5 animate-spin" aria-hidden /> : null}
              {saindo ? "Salvando…" : "Continuar"}
            </button>
          </div>
        </div>
      </footer>
    </main>
  );
}
