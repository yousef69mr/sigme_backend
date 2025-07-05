import { db } from "../../database.js";
import { findNearbyLocation } from "../../helpers/coordinates.js";

/**
 * تصنيف جودة الإشارة حسب قيمة الـ dBm
 */
function classifySignal(avgDbm) {
  if (avgDbm >= -70) return "Excellent";
  if (avgDbm >= -85) return "Good";
  if (avgDbm >= -100) return "Weak";
  return "No Signal";
}

/**
 * تحليل الإشارة لمكان معين بناءً على إحداثياته
 * @param {number} lat
 * @param {number} lng
 * @param {number} [maxDistance=15] أقصى مسافة مطابقة (بالمتر)
 * @returns {Promise<{ carrier: string, avgDbm: number, quality: string, count: number }[]>}
 */
export async function classifySignalByCarrier(lat, lng, maxDistance = 15) {
  const location = await findNearbyLocation(lat, lng, maxDistance);
  if (!location) return [];

  const logs = await db.connectivityInfo.findMany({
    where: {
      locationId: location.id,
      mobileNetworkInfo: {
        isNot: null
      }
    },
    select: {
      mobileNetworkInfo: {
        select: {
          carrier: true,
          signalDbm: true
        }
      }
    }
  });

  const grouped = {};

  for (const log of logs) {
    const info = log.mobileNetworkInfo;
    if (!info?.carrier || typeof info.signalDbm !== 'number') continue;

    const carrier = info.carrier.toUpperCase();
    if (!grouped[carrier]) grouped[carrier] = { total: 0, count: 0 };

    grouped[carrier].total += info.signalDbm;
    grouped[carrier].count += 1;
  }

  return Object.entries(grouped).map(([carrier, { total, count }]) => {
    const avgDbm = total / count;
    return {
      carrier,
      avgDbm: Math.round(avgDbm),
      quality: classifySignal(avgDbm),
      count
    };
  });
}
