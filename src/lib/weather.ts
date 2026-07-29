// The bar's weather widget. Phase 1 is a build-time snapshot (no client JS, no
// tracking); Phase 3 wires this to the live weather stack for the decoy
// location. The shape stays stable so only the innards change later.

export interface WeatherSnapshot {
  tempF: number;
  summary: string;
}

export async function getWeatherSnapshot(): Promise<WeatherSnapshot> {
  // Placeholder until Phase 3 points this at the real feed.
  return { tempF: 72, summary: 'Clear' };
}
