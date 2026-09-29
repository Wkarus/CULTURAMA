export async function geocodeEndereco(endereco: string): Promise<{ lat: number; lng: number } | null> {
  const query = endereco.trim();
  if (query.length < 5) return null;

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", query);
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "1");
  url.searchParams.set("countrycodes", "br");

  const response = await fetch(url, {
    headers: { "User-Agent": "CulturamaTCC/1.0 (evento-cultural)" },
    cache: "no-store",
  });
  if (!response.ok) return null;

  const rows = (await response.json()) as { lat: string; lon: string }[];
  if (!rows[0]) return null;
  return { lat: Number(rows[0].lat), lng: Number(rows[0].lon) };
}
