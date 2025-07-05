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
    console.log(data)
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

