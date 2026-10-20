import type { Coordinates } from "@/types/geo";

// A location as we write it in the seed list: a point plus its country.
export type SeedLocation = Coordinates & { country: string };

// Busy, well-known streets on 6 continents — very likely to have Street View coverage.
// Coverage is verified properly with Google in Phase 8.
export const SEED_LOCATIONS: SeedLocation[] = [
  { lat: 48.8698, lng: 2.3076, country: "France" }, // Paris, Champs-Élysées
  { lat: 35.6595, lng: 139.7005, country: "Japan" }, // Tokyo, Shibuya Crossing
  { lat: 40.758, lng: -73.9855, country: "United States" }, // New York, Times Square
  { lat: -22.9711, lng: -43.1822, country: "Brazil" }, // Rio de Janeiro, Copacabana
  { lat: -33.8688, lng: 151.2069, country: "Australia" }, // Sydney, George Street
  { lat: -33.9225, lng: 18.418, country: "South Africa" }, // Cape Town, Long Street
  { lat: 18.943, lng: 72.8238, country: "India" }, // Mumbai, Marine Drive
  { lat: 51.5045, lng: -0.1265, country: "United Kingdom" }, // London, Whitehall
  { lat: 41.8925, lng: 12.4853, country: "Italy" }, // Rome, Via dei Fori Imperiali
  { lat: 43.6561, lng: -79.3802, country: "Canada" }, // Toronto, Yonge Street
  { lat: 19.427, lng: -99.1677, country: "Mexico" }, // Mexico City, Paseo de la Reforma
  { lat: -34.6037, lng: -58.3816, country: "Argentina" }, // Buenos Aires, Avenida 9 de Julio
  { lat: -1.2841, lng: 36.8233, country: "Kenya" }, // Nairobi, Kenyatta Avenue
  { lat: 13.738, lng: 100.56, country: "Thailand" }, // Bangkok, Sukhumvit Road
  { lat: 59.9133, lng: 10.7389, country: "Norway" }, // Oslo, Karl Johans gate
  { lat: -45.0312, lng: 168.6626, country: "New Zealand" }, // Queenstown
  { lat: 52.517, lng: 13.3889, country: "Germany" }, // Berlin, Unter den Linden
  { lat: -33.445, lng: -70.655, country: "Chile" }, // Santiago, Alameda
  { lat: -8.5069, lng: 115.2625, country: "Indonesia" }, // Bali, Ubud
  { lat: 64.1455, lng: -21.927, country: "Iceland" }, // Reykjavík, Laugavegur
];
