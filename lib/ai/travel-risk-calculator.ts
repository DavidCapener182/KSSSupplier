export interface TravelRiskAnalysis {
  distanceKm: number;
  durationHours: number;
  riskLevel: 'low' | 'medium' | 'high';
  riskScore: number; // 0-100
}

// Simple Haversine distance as fallback if no API
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Mock geocoding for now (in real app, use Google Maps or Mapbox)
// We'll use a simplistic region-based heuristic or dummy coordinates
async function getCoordinates(location: string): Promise<{ lat: number, lon: number } | null> {
  // Mock data for common UK cities
  const cities: Record<string, { lat: number, lon: number }> = {
    'London': { lat: 51.5074, lon: -0.1278 },
    'Manchester': { lat: 53.4808, lon: -2.2426 },
    'Birmingham': { lat: 52.4862, lon: -1.8904 },
    'Leeds': { lat: 53.8008, lon: -1.5491 },
    'Reading': { lat: 51.4543, lon: -0.9781 },
    'Liverpool': { lat: 53.4084, lon: -2.9916 },
    'Bristol': { lat: 51.4545, lon: -2.5879 },
  };

  for (const [city, coords] of Object.entries(cities)) {
    if (location.includes(city)) return coords;
  }
  
  // Default fallback (London)
  return { lat: 51.5074, lon: -0.1278 };
}

export async function analyzeTravelRisk(
  providerAddress: string, 
  eventLocation: string
): Promise<TravelRiskAnalysis> {
  
  const providerCoords = await getCoordinates(providerAddress || 'London');
  const eventCoords = await getCoordinates(eventLocation || 'London');

  if (!providerCoords || !eventCoords) {
    return { distanceKm: 0, durationHours: 0, riskLevel: 'low', riskScore: 0 };
  }

  const distance = haversineDistance(
    providerCoords.lat, providerCoords.lon,
    eventCoords.lat, eventCoords.lon
  );

  // Estimate duration (assume 60km/h average speed + 15 mins buffer)
  const duration = (distance / 60) + 0.25;

  let riskLevel: 'low' | 'medium' | 'high' = 'low';
  let riskScore = 0;

  if (duration > 2.5) {
    riskLevel = 'high';
    riskScore = 80;
  } else if (duration > 1.5) {
    riskLevel = 'medium';
    riskScore = 40;
  } else {
    riskLevel = 'low';
    riskScore = 10;
  }

  return {
    distanceKm: Math.round(distance),
    durationHours: parseFloat(duration.toFixed(1)),
    riskLevel,
    riskScore
  };
}

