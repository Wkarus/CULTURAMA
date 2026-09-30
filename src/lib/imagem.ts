/** URL da imagem servida pelo próprio site: uploads locais já são mesma origem; externas passam por `/api/imagem`. */
export function imagemMesmaOrigem(src: string): string {
  if (src.startsWith("/")) return src;
  return `/api/imagem?url=${encodeURIComponent(src)}`;
}
