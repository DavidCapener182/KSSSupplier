export interface WeatherForecast {
  temp: number; // Celsius
  condition: string;
  description: string;
  precipitation_prob: number; // 0-1
  wind_speed: number; // m/s
  icon?: string;
}

const OPENWEATHER_API_KEY = process.env.OPENWEATHERMAP_API_KEY;

export async function getWeatherForecast(location: string, date: string): Promise<WeatherForecast | null> {
  if (!OPENWEATHER_API_KEY) {
    console.warn('OpenWeatherMap API key missing');
    return null;
  }

  try {
    // 1. Geocode location
    const geoRes = await fetch(
      `http://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(location)}&limit=1&appid=${OPENWEATHER_API_KEY}`
    );
    const geoData = await geoRes.json();
    
    if (!geoData || geoData.length === 0) return null;
    
    const { lat, lon } = geoData[0];

    // 2. Get forecast
    // Note: Free tier standard forecast is 5 days / 3 hour steps.
    // One Call API 3.0 is better but requires subscription (even if free tier).
    // Using standard 5-day forecast for now.
    
    const weatherRes = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}&units=metric`
    );
    const weatherData = await weatherRes.json();

    if (!weatherData || !weatherData.list) return null;

    // Find forecast closest to event date (at noon)
    const eventDate = new Date(date);
    eventDate.setHours(12, 0, 0, 0);
    const eventTime = eventDate.getTime();

    // Find closest timestamp
    const closest = weatherData.list.reduce((prev: any, curr: any) => {
      const prevDiff = Math.abs((prev.dt * 1000) - eventTime);
      const currDiff = Math.abs((curr.dt * 1000) - eventTime);
      return currDiff < prevDiff ? curr : prev;
    });

    return {
      temp: closest.main.temp,
      condition: closest.weather[0].main,
      description: closest.weather[0].description,
      precipitation_prob: closest.pop || 0,
      wind_speed: closest.wind.speed,
      icon: closest.weather[0].icon
    };

  } catch (error) {
    console.error('Weather fetch error:', error);
    return null;
  }
}

export function calculateWeatherRisk(weather: WeatherForecast): { riskMultiplier: number, reasoning: string[] } {
  let multiplier = 1.0;
  const reasoning = [];

  if (weather.precipitation_prob > 0.5) {
    multiplier += 0.15; // +15% attrition risk
    reasoning.push(`High rain probability (${(weather.precipitation_prob * 100).toFixed(0)}%) increases no-show risk.`);
  }

  if (weather.temp < 5) {
    multiplier += 0.05;
    reasoning.push(`Cold weather (${weather.temp.toFixed(1)}°C) slightly increases attrition.`);
  } else if (weather.temp > 30) {
    multiplier += 0.10;
    reasoning.push(`Extreme heat (${weather.temp.toFixed(1)}°C) increases fatigue and drop-out risk.`);
  }

  if (weather.wind_speed > 10) {
    multiplier += 0.05;
    reasoning.push(`High winds (${weather.wind_speed} m/s) may impact outdoor staff comfort.`);
  }

  return { riskMultiplier: multiplier, reasoning };
}

