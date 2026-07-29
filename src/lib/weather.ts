// The bar's weather widget. Rendered server-side and TTL-cached (same pattern as
// latestCode.ts), so it stays current without a redeploy, never ships client JS,
// and never touches the visitor's browser: only this server calls out, for one
// fixed decoy location. Falls back to a static value so a render never breaks.

export type WeatherKind = 'clear' | 'partly' | 'cloud' | 'fog' | 'rain' | 'snow' | 'storm';

export interface WeatherSnapshot {
  tempF: number;
  summary: string;
  kind: WeatherKind;
}

// Indianapolis — John's city, already public in the About memoir. City-level
// coordinates, not a precise location, and the widget shows no place name anyway.
const LAT = 39.7684;
const LON = -86.1581;

const URL =
  `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}` +
  `&current=temperature_2m,weather_code&temperature_unit=fahrenheit`;

const TTL_MS = 1_800_000; // 30 minutes

const FALLBACK: WeatherSnapshot = { tempF: 72, summary: 'Clear', kind: 'clear' };

// WMO weather codes -> a short label + an icon kind for the bar.
function describe(code: number): { summary: string; kind: WeatherKind } {
  if (code === 0) return { summary: 'Clear', kind: 'clear' };
  if (code === 1) return { summary: 'Mainly clear', kind: 'clear' };
  if (code === 2) return { summary: 'Partly cloudy', kind: 'partly' };
  if (code === 3) return { summary: 'Overcast', kind: 'cloud' };
  if (code === 45 || code === 48) return { summary: 'Fog', kind: 'fog' };
  if (code >= 51 && code <= 57) return { summary: 'Drizzle', kind: 'rain' };
  if (code >= 61 && code <= 67) return { summary: 'Rain', kind: 'rain' };
  if (code >= 71 && code <= 77) return { summary: 'Snow', kind: 'snow' };
  if (code >= 80 && code <= 82) return { summary: 'Showers', kind: 'rain' };
  if (code === 85 || code === 86) return { summary: 'Snow showers', kind: 'snow' };
  if (code >= 95) return { summary: 'Thunderstorms', kind: 'storm' };
  return FALLBACK; // unknown code -> safe default
}

let cache: Promise<WeatherSnapshot> | null = null;
let cachedAt = 0;

async function fetchWeather(): Promise<WeatherSnapshot> {
  try {
    const res = await fetch(URL, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) throw new Error(`open-meteo ${res.status}`);
    const data = await res.json();
    const c = data?.current;
    if (!c || typeof c.temperature_2m !== 'number') throw new Error('no current weather');
    const { summary, kind } = describe(Number(c.weather_code));
    return { tempF: Math.round(c.temperature_2m), summary, kind };
  } catch (err) {
    console.warn('[weather] using fallback:', (err as Error).message);
    return FALLBACK;
  }
}

export function getWeatherSnapshot(): Promise<WeatherSnapshot> {
  if (!cache || Date.now() - cachedAt > TTL_MS) {
    cachedAt = Date.now();
    cache = fetchWeather();
  }
  return cache;
}
