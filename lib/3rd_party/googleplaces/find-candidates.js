import { classifySignalByCarrier } from './analyze-signal.js';
import fetch from 'node-fetch'; // use global fetch if Node 18+

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || '72a7b36b67msh35adb6b6a224c3cp1f1b41jsn5021bc963c35';
const RAPIDAPI_HOST = 'google-map-places.p.rapidapi.com';

export async function findCandidates(input) {
  const url = `https://${RAPIDAPI_HOST}/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(input)}&inputtype=textquery&fields=all&language=en`;

  const options = {
    method: 'GET',
    headers: {
      'X-RapidAPI-Key': RAPIDAPI_KEY,
      'X-RapidAPI-Host': RAPIDAPI_HOST
    }
  };

  try {
    
    const response = await fetch(url, options);
    const data = await response.json();

    if (data.status === 'OK' && data.candidates.length > 0) {
      return data.candidates;
    } else {
      return null;
    }
  } catch (error) {
    console.error('findPlace error:', error);
    throw new Error('API fetch failed');
  }
}


function normalizePlaceData(candidate) {
//   const photoReference = candidate.photos?.[0]?.photo_reference;
//   const photoUrl = photoReference
//     ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${photoReference}&key=${process.env.GOOGLE_API_KEY}`
//     : null;

  return {
    name: candidate.name,
    address: candidate.formatted_address,
    location: {
      lat: candidate.geometry.location.lat,
      lng: candidate.geometry.location.lng,
    },
    place_id: candidate.place_id,
    rating: candidate.rating,
    totalRatings: candidate.user_ratings_total,
    isOpen: candidate.opening_hours?.open_now ?? null,
    types: candidate.types,
    // photoUrl,
  };
}



/**
 * Adds signal quality analysis to a Google candidate result
 * @param {object} candidate Google Place candidate
 * @returns {Promise<object>}
 */
export async function enrichGoogleCandidate(candidate) {
  const { lat, lng } = candidate.geometry.location;

  const signalByCarrier = await classifySignalByCarrier(lat, lng, 2000); // 2 km

  return {
    ...normalizePlaceData(candidate),
    signalByCarrier
  };
}
