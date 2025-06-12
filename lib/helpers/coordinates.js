
/**
 * 
 * @param {number} coord number 
 * @returns number
 * @description If you’re worried about GPS noise, consider rounding coordinates to a fixed number of decimal places before saving them (e.g., 5 decimals gives ~1m precision)
 */
export function normalizeCoord(coord) {
    return parseFloat(coord.toFixed(5));
}



/**
 * Calculates the great-circle distance between two coordinates
 * using the Haversine formula.
 *
 * @param {number} lat1 Latitude of the first point in decimal degrees.
 * @param {number} lon1 Longitude of the first point in decimal degrees.
 * @param {number} lat2 Latitude of the second point in decimal degrees.
 * @param {number} lon2 Longitude of the second point in decimal degrees.
 * @returns {number} Distance in meters between the two points.
 */
function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth's radius in meters
  const toRad = x => (x * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Finds a location within a small bounding box around the target coordinates
 * and applies a more accurate Haversine distance check.
 *
 * @param {number} latitude Target latitude.
 * @param {number} longitude Target longitude.
 * @param {number} maxDistanceMeters Maximum allowed distance for fuzzy match.
 * @returns {Promise<Object|null>} A nearby location if found, otherwise null.
 */
async function findNearbyLocation(latitude, longitude, maxDistanceMeters = 20) {
  const delta = 0.0002; // Roughly ~20 meters

  const candidates = await prisma.location.findMany({
    where: {
      latitude: { gte: latitude - delta, lte: latitude + delta },
      longitude: { gte: longitude - delta, lte: longitude + delta },
    },
  });

  for (const loc of candidates) {
    const distance = haversineDistance(latitude, longitude, loc.latitude, loc.longitude);
    if (distance <= maxDistanceMeters) {
      return loc;
    }
  }

  return null;
}

/**
 * Attempts to find an existing nearby location using fuzzy match.
 * If not found, creates a new one with the given label.
 *
 * @param {number} latitude Latitude of the location.
 * @param {number} longitude Longitude of the location.
 * @param {string} [label] Optional label for the location.
 * @returns {Promise<Object>} The found or newly created location.
 */
export async function getOrCreateFuzzyLocation(latitude, longitude, label) {
  let location = await findNearbyLocation(latitude, longitude);

  if (!location) {
    location = await prisma.location.create({
      data: {
        latitude,
        longitude,
        label,
      },
    });
  }

  return location;
}