export function uberDeepLink(lat: number, lng: number, nome: string): string {
  const params = new URLSearchParams({
    action: "setPickup",
    pickup: "my_location",
    "dropoff[latitude]": String(lat),
    "dropoff[longitude]": String(lng),
    "dropoff[nickname]": nome.slice(0, 80),
  });
  return `https://m.uber.com/ul/?${params.toString()}`;
}

export function noventaNoveLink(lat: number, lng: number, nome: string): string {
  const params = new URLSearchParams({
    dropoff_latitude: String(lat),
    dropoff_longitude: String(lng),
    dropoff_nickname: nome.slice(0, 80),
  });
  return `https://99app.com/open?${params.toString()}`;
}

export function googleMapsDirLink(
  originLat: number,
  originLng: number,
  destLat: number,
  destLng: number,
  mode: "driving" | "transit" | "walking",
): string {
  const params = new URLSearchParams({
    api: "1",
    origin: `${originLat},${originLng}`,
    destination: `${destLat},${destLng}`,
    travelmode: mode,
  });
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}
