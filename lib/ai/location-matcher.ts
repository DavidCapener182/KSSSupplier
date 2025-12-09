export interface Location {
  lat: number;
  lon: number;
  display_name: string;
}

export interface DistanceResult {
  distanceMiles: number;
  formattedDistance: string;
  source: 'geocoded' | 'text-match' | 'unknown';
}

const CACHE = new Map<string, Location>();

// Helper to calculate Haversine distance
function calculateHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959; // Radius of Earth in miles
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

// Geocode address using OpenStreetMap Nominatim API
export async function geocodeAddress(address: string): Promise<Location | null> {
  // Normalize address
  const cleanAddress = address.trim();
  if (!cleanAddress) return null;

  // Check cache
  if (CACHE.has(cleanAddress)) {
    return CACHE.get(cleanAddress)!;
  }

  try {
    // Add user-agent as required by Nominatim usage policy
    const params = new URLSearchParams({
      q: cleanAddress,
      format: 'json',
      limit: '1',
    });

    const response = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
      headers: {
        'User-Agent': 'KSS-Supplier-Portal/1.0',
      },
    });

    if (!response.ok) {
      console.error('Geocoding failed:', response.statusText);
      return null;
    }

    const data = await response.json();
    if (data && data.length > 0) {
      const result: Location = {
        lat: parseFloat(data[0].lat),
        lon: parseFloat(data[0].lon),
        display_name: data[0].display_name,
      };
      CACHE.set(cleanAddress, result);
      return result;
    }
  } catch (error) {
    console.error('Error geocoding address:', error);
  }

  return null;
}

export async function calculateDistance(
  providerAddress: string, 
  eventLocation: string
): Promise<DistanceResult> {
  // Try to geocode both
  const start = await geocodeAddress(providerAddress);
  const end = await geocodeAddress(eventLocation);

  if (start && end) {
    const distance = calculateHaversineDistance(start.lat, start.lon, end.lat, end.lon);
    return {
      distanceMiles: distance,
      formattedDistance: `${distance.toFixed(1)} miles`,
      source: 'geocoded'
    };
  }

  // Fallback: simple text matching for known locations (could be expanded)
  // This is a very basic fallback for common venue names vs city names
  // In a real app, you might have a database of venue coordinates
  
  return {
    distanceMiles: 0,
    formattedDistance: 'Unknown distance',
    source: 'unknown'
  };
}
