import { Color, Geometry, Mesh, Program, Renderer, Texture } from "ogl";
import { visual } from "@/lib/visual-tokens";

const VERT = /* glsl */ `#version 300 es
precision highp float;

in vec2 aGrid;
in vec4 aRandom;

uniform sampler2D uTex0;
uniform sampler2D uTex1;
uniform vec2 uCover0;
uniform vec2 uCover1;
uniform float uProgress;
uniform float uDir;
uniform float uTime;
uniform float uAspect;
uniform float uPointSize;
uniform vec2 uMouse;
uniform float uMouseStrength;
uniform vec3 uAccent;

out vec3 vColor;
out float vAlpha;

vec2 cover(vec2 uv, vec2 s) {
  return (uv - 0.5) * s + 0.5;
}

float luma(vec3 c) {
  return dot(c, vec3(0.299, 0.587, 0.114));
}

void main() {
  float delay = aRandom.w * 0.35;
  float p = clamp((uProgress - delay) / 0.65, 0.0, 1.0);
  float e = p * p * (3.0 - 2.0 * p);
  float burst = sin(e * 3.14159265);

  vec4 c0 = texture(uTex0, cover(aGrid, uCover0));
  vec4 c1 = texture(uTex1, cover(aGrid, uCover1));
  vec3 color = mix(c0.rgb, c1.rgb, e);
  float lum = mix(luma(c0.rgb), luma(c1.rgb), e);

  vec2 pos = aGrid * 2.0 - 1.0;

  vec2 dir = normalize(aRandom.xy + 1e-4);
  vec2 scatter = dir * (0.18 + aRandom.z * 0.85) * burst;
  scatter.x += uDir * burst * (0.25 + aRandom.z * 0.35);
  float swirl = burst * (aRandom.z - 0.5) * 1.6;
  scatter += vec2(-pos.y, pos.x) * swirl * 0.25;
  pos += scatter * vec2(1.0 / uAspect, 1.0);

  pos += vec2(
    sin(uTime * 0.6 + aRandom.x * 6.2831),
    cos(uTime * 0.5 + aRandom.y * 6.2831)
  ) * 0.0022;

  vec2 d = pos - uMouse;
  d.x *= uAspect;
  float force = smoothstep(0.28, 0.0, length(d)) * uMouseStrength;
  pos += normalize(d + 1e-4) * force * 0.07 * vec2(1.0 / uAspect, 1.0);

  gl_Position = vec4(pos, 0.0, 1.0);
  gl_PointSize = uPointSize * (0.5 + lum * 0.7) * (1.0 + burst * 0.5);

  vColor = mix(color, uAccent, burst * 0.35 + force * 0.25);
  vAlpha = 1.0 - burst * 0.25;
}
`;

const FRAG = /* glsl */ `#version 300 es
precision highp float;

in vec3 vColor;
in float vAlpha;
out vec4 fragColor;

void main() {
  float d = length(gl_PointCoord - 0.5);
  float a = smoothstep(0.5, 0.32, d) * vAlpha;
  if (a < 0.01) discard;
  fragColor = vec4(vColor * a, a);
}
`;

const COLS = 220;
const TRANSICAO_MS = 1700;

type Slide = { texture: Texture; aspect: number; ready: Promise<void> };

export type ParticleSlider = {
  goTo: (index: number, dir: number) => void;
  setPointer: (x: number, y: number, inside: boolean) => void;
  destroy: () => void;
};

/** Lança se o navegador não tiver WebGL2. */
export function createParticleSlider(
  container: HTMLElement,
  images: string[],
  initialIndex: number,
  onFirstFrame: () => void,
): ParticleSlider {
  const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
  const renderer = new Renderer({ alpha: true, premultipliedAlpha: true, antialias: false, dpr, webgl: 2 });
  const gl = renderer.gl;
  if (!gl || !renderer.isWebgl2) {
    gl?.getExtension("WEBGL_lose_context")?.loseContext();
    throw new Error("WebGL2 indisponível");
  }
  gl.clearColor(0, 0, 0, 0);
  const canvas = gl.canvas as HTMLCanvasElement;
  canvas.style.width = "100%";
  canvas.style.height = "100%";
  canvas.style.display = "block";
  container.appendChild(canvas);

  const fallback = gradientTexture(gl);
  const slides = new Map<number, Slide>();

  function loadSlide(index: number): Slide {
    const cached = slides.get(index);
    if (cached) return cached;
    const texture = new Texture(gl, { generateMipmaps: false, minFilter: gl.LINEAR, magFilter: gl.LINEAR });
    const slide: Slide = { texture, aspect: 1, ready: Promise.resolve() };
    slide.ready = new Promise<void>((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.decoding = "async";
      img.onload = () => {
        texture.image = img;
        slide.aspect = img.naturalWidth / Math.max(img.naturalHeight, 1);
        resolve();
      };
      img.onerror = () => {
        slide.texture = fallback.texture;
        slide.aspect = fallback.aspect;
        resolve();
      };
      img.src = images[index];
    });
    slides.set(index, slide);
    return slide;
  }

  let width = container.clientWidth || 1;
  let height = container.clientHeight || 1;
  const rows = Math.max(1, Math.round(COLS / (width / height)));
  const count = COLS * rows;
  const grid = new Float32Array(count * 2);
  const random = new Float32Array(count * 4);
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < COLS; x++) {
      const i = y * COLS + x;
      grid[i * 2] = (x + 0.5) / COLS;
      grid[i * 2 + 1] = (y + 0.5) / rows;
      random[i * 4] = Math.random() * 2 - 1;
      random[i * 4 + 1] = Math.random() * 2 - 1;
      random[i * 4 + 2] = Math.random();
      random[i * 4 + 3] = Math.random();
    }
  }

  const geometry = new Geometry(gl, {
    aGrid: { size: 2, data: grid },
    aRandom: { size: 4, data: random },
  });

  const accent = new Color(visual.accentTo);
  const program = new Program(gl, {
    vertex: VERT,
    fragment: FRAG,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    uniforms: {
      uTex0: { value: fallback.texture },
      uTex1: { value: fallback.texture },
      uCover0: { value: [1, 1] },
      uCover1: { value: [1, 1] },
      uProgress: { value: 0 },
      uDir: { value: 1 },
      uTime: { value: 0 },
      uAspect: { value: width / height },
      uPointSize: { value: 2 },
      uMouse: { value: [9, 9] },
      uMouseStrength: { value: 0 },
      uAccent: { value: [accent.r, accent.g, accent.b] },
    },
  });
  const mesh = new Mesh(gl, { mode: gl.POINTS, geometry, program });

  let current = initialIndex;
  let currentSlide = loadSlide(current);
  let nextSlide: Slide | null = null;
  let transitionStart = 0;
  let pending: { index: number; dir: number } | null = null;
  let mouseTarget = 0;
  let destroyed = false;

  function coverFor(aspect: number): [number, number] {
    const plane = width / height;
    return aspect > plane ? [plane / aspect, 1] : [1, aspect / plane];
  }

  function resize() {
    width = container.clientWidth || 1;
    height = container.clientHeight || 1;
    renderer.setSize(width, height);
    program.uniforms.uAspect.value = width / height;
    program.uniforms.uPointSize.value = (width / COLS) * dpr * 1.35;
    program.uniforms.uCover0.value = coverFor(currentSlide.aspect);
    if (nextSlide) program.uniforms.uCover1.value = coverFor(nextSlide.aspect);
  }
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(container);
  resize();

  let firstFrame = false;
  currentSlide.ready.then(() => {
    if (destroyed) return;
    program.uniforms.uTex0.value = currentSlide.texture;
    program.uniforms.uTex1.value = currentSlide.texture;
    program.uniforms.uCover0.value = coverFor(currentSlide.aspect);
    program.uniforms.uCover1.value = coverFor(currentSlide.aspect);
    loadSlide((current + 1) % images.length);
    loadSlide((current - 1 + images.length) % images.length);
  });

  function start(index: number, dir: number) {
    const slide = loadSlide(index);
    nextSlide = slide;
    slide.ready.then(() => {
      if (destroyed || nextSlide !== slide) return;
      program.uniforms.uTex1.value = slide.texture;
      program.uniforms.uCover1.value = coverFor(slide.aspect);
      program.uniforms.uDir.value = dir;
      transitionStart = performance.now();
      current = index;
      loadSlide((index + dir + images.length) % images.length);
    });
  }

  let raf = 0;
  function frame(now: number) {
    raf = requestAnimationFrame(frame);
    const u = program.uniforms;
    u.uTime.value = now / 1000;
    u.uMouseStrength.value += (mouseTarget - u.uMouseStrength.value) * 0.08;

    if (transitionStart) {
      const t = Math.min((now - transitionStart) / TRANSICAO_MS, 1);
      u.uProgress.value = t;
      if (t >= 1 && nextSlide) {
        currentSlide = nextSlide;
        nextSlide = null;
        transitionStart = 0;
        u.uTex0.value = currentSlide.texture;
        u.uCover0.value = coverFor(currentSlide.aspect);
        u.uProgress.value = 0;
        if (pending && pending.index !== current) {
          const next = pending;
          pending = null;
          start(next.index, next.dir);
        } else {
          pending = null;
        }
      }
    }

    renderer.render({ scene: mesh });
    if (!firstFrame && u.uTex0.value !== fallback.texture) {
      firstFrame = true;
      onFirstFrame();
    }
  }
  raf = requestAnimationFrame(frame);

  return {
    goTo(index, dir) {
      if (nextSlide) {
        pending = { index, dir };
        return;
      }
      if (index === current) return;
      start(index, dir);
    },
    setPointer(x, y, inside) {
      program.uniforms.uMouse.value = [x, y];
      mouseTarget = inside ? 1 : 0;
    },
    destroy() {
      destroyed = true;
      cancelAnimationFrame(raf);
      resizeObserver.disconnect();
      geometry.remove();
      program.remove();
      slides.forEach((slide) => {
        if (slide.texture !== fallback.texture) gl.deleteTexture(slide.texture.texture);
      });
      gl.deleteTexture(fallback.texture.texture);
      canvas.remove();
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    },
  };
}

function gradientTexture(gl: Renderer["gl"]) {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 40;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    const gradient = ctx.createLinearGradient(0, canvas.height, canvas.width, 0);
    gradient.addColorStop(0, visual.accentFrom);
    gradient.addColorStop(1, visual.accentTo);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  const texture = new Texture(gl, { image: canvas, generateMipmaps: false });
  return { texture, aspect: canvas.width / canvas.height };
}
