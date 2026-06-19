import { useQuery } from '@tanstack/react-query';

const OWM_BASE = 'https://api.openweathermap.org/data/2.5/weather';
const OWM_KEY = process.env.EXPO_PUBLIC_OWM_KEY ?? '';

export type WeatherData = {
  temp: number;       // Celsius
  feelsLike: number;
  humidity: number;
  windSpeed: number;  // m/s
  description: string;
  icon: string;       // OWM icon code e.g. "01d"
  iconUrl: string;    // ready-to-use URL
};

async function fetchWeather(lat: number, lon: number): Promise<WeatherData> {
  if (!OWM_KEY) throw new Error('EXPO_PUBLIC_OWM_KEY is not set');

  const url = `${OWM_BASE}?lat=${lat}&lon=${lon}&units=metric&appid=${OWM_KEY}`;
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`OpenWeatherMap error: ${res.status}`);
  }

  const json = await res.json();
  const icon = json.weather?.[0]?.icon ?? '01d';

  return {
    temp: Math.round(json.main.temp),
    feelsLike: Math.round(json.main.feels_like),
    humidity: json.main.humidity,
    windSpeed: json.wind.speed,
    description: json.weather?.[0]?.description ?? '',
    icon,
    iconUrl: `https://openweathermap.org/img/wn/${icon}@2x.png`,
  };
}

/**
 * Fetches current weather for the given coordinates.
 * staleTime = 30 minutes — prevents API hammering and saves battery.
 * Returns null data (not an error) if no coordinates provided.
 */
export function useWeather(lat: number | null | undefined, lon: number | null | undefined) {
  return useQuery({
    queryKey: ['weather', lat, lon],
    queryFn: () => fetchWeather(lat!, lon!),
    enabled: !!lat && !!lon && !!OWM_KEY,
    staleTime: 1000 * 60 * 30,   // 30 minutes
    retry: 1,                      // Don't hammer on failure (rate limits)
  });
}
