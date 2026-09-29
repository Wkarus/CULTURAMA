export const SAO_PAULO = { lat: -23.5505, lng: -46.6333 };

export function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const earth = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * earth * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function hasValidCoords(lat: number, lng: number): boolean {
  return Number.isFinite(lat) && Number.isFinite(lng) && !(lat === 0 && lng === 0);
}

export function parseCoord(raw: string | undefined): number | null {
  if (!raw) return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

export function mensagemGeolocalizacao(code?: number): string {
  if (code === 1) {
    return "O navegador bloqueou a localização. Clique no cadeado ao lado do endereço, permita a localização e tente de novo.";
  }
  if (code === 2) {
    return "Não achei sua posição. No Windows, ligue a localização em Configurações > Privacidade e tente de novo.";
  }
  if (code === 3) {
    return "A localização demorou demais. Tente de novo.";
  }
  return "Não consegui ler a localização. Permita o acesso só nesta vez, para filtrar por distância.";
}
