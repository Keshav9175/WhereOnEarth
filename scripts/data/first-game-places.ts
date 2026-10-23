// The first-game map (new players' first game): world-famous landmarks, each with a street-level point close to it.
// Chosen by us (public, well-known places; coordinates are approximate viewpoints). The seed script
// asks Google for the nearest official outdoor panorama to each point and saves THAT position.
// Spread over every continent, so a 5-round game visits 5 different countries.

export type FamousPlace = {
  landmark: string;
  countryCode: string; // ISO two-letter code
  lat: number;
  lng: number;
};

export const FIRST_GAME_PLACES: FamousPlace[] = [
  { landmark: "Eiffel Tower", countryCode: "FR", lat: 48.8576, lng: 2.2953 },
  { landmark: "Colosseum", countryCode: "IT", lat: 41.8902, lng: 12.4929 },
  { landmark: "Big Ben", countryCode: "GB", lat: 51.5008, lng: -0.1246 },
  { landmark: "Sagrada Família", countryCode: "ES", lat: 41.4034, lng: 2.1739 },
  { landmark: "Brandenburg Gate", countryCode: "DE", lat: 52.5162, lng: 13.3787 },
  { landmark: "Times Square", countryCode: "US", lat: 40.758, lng: -73.9855 },
  { landmark: "Golden Gate Bridge", countryCode: "US", lat: 37.8077, lng: -122.4752 },
  { landmark: "CN Tower", countryCode: "CA", lat: 43.6421, lng: -79.3868 },
  { landmark: "Christ the Redeemer", countryCode: "BR", lat: -22.9516, lng: -43.2104 },
  { landmark: "Machu Picchu", countryCode: "PE", lat: -13.1629, lng: -72.5448 },
  { landmark: "Sydney Opera House", countryCode: "AU", lat: -33.8588, lng: 151.2134 },
  { landmark: "Taj Mahal", countryCode: "IN", lat: 27.1739, lng: 78.0421 },
  { landmark: "Shibuya Crossing", countryCode: "JP", lat: 35.6594, lng: 139.7006 },
  { landmark: "Marina Bay Sands", countryCode: "SG", lat: 1.2846, lng: 103.8592 },
  { landmark: "Petronas Towers", countryCode: "MY", lat: 3.1577, lng: 101.7123 },
  { landmark: "Burj Khalifa", countryCode: "AE", lat: 25.1957, lng: 55.2747 },
  { landmark: "Pyramids of Giza", countryCode: "EG", lat: 29.9765, lng: 31.1313 },
  { landmark: "Table Mountain from Cape Town", countryCode: "ZA", lat: -33.9083, lng: 18.4196 },
];
