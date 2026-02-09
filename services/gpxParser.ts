import { GPXPoint, ActivitySummary, ZoneStats } from '../types';

const haversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export const parseGPX = (gpxContent: string): ActivitySummary => {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(gpxContent, "text/xml");
  const trkpts = xmlDoc.getElementsByTagName("trkpt");

  const points: GPXPoint[] = [];
  let totalHr = 0;
  let maxHr = 0;
  let totalPower = 0;
  let maxPower = 0;
  let totalCadence = 0;
  let hrCount = 0;
  let powerCount = 0;
  let cadCount = 0;
  
  // Totals
  let totalDistanceKm = 0;
  let totalElevationGain = 0;

  for (let i = 0; i < trkpts.length; i++) {
    const pt = trkpts[i];
    const lat = parseFloat(pt.getAttribute("lat") || "0");
    const lon = parseFloat(pt.getAttribute("lon") || "0");
    
    const eleNode = pt.getElementsByTagName("ele")[0];
    const ele = eleNode ? parseFloat(eleNode.textContent || "0") : 0;

    const timeNode = pt.getElementsByTagName("time")[0];
    const time = timeNode ? new Date(timeNode.textContent || "") : new Date();

    // Helper to find value recursively or by tag name ignoring namespace prefixes
    const findValue = (parent: Element, tagName: string): number | undefined => {
      const tags = parent.getElementsByTagName("*");
      for (let j = 0; j < tags.length; j++) {
        if (tags[j].tagName === tagName || tags[j].tagName.endsWith(`:${tagName}`)) {
           return parseFloat(tags[j].textContent || "0");
        }
      }
      return undefined;
    };

    const extensions = pt.getElementsByTagName("extensions")[0];
    
    let power = 0;
    let hr = 0;
    let cad = 0;

    if (extensions) {
      const p = findValue(extensions, "power");
      if (p !== undefined) {
        power = p;
        totalPower += p;
        if (p > maxPower) maxPower = p;
        powerCount++;
      }

      const h = findValue(extensions, "hr");
      if (h !== undefined) {
        hr = h;
        totalHr += h;
        if (h > maxHr) maxHr = h;
        hrCount++;
      }

      const c = findValue(extensions, "cad");
      if (c !== undefined) {
        cad = c;
        totalCadence += c;
        cadCount++;
      }
    }
    
    // Calculate Distance & Elevation Accumulation
    if (i > 0) {
        const prev = points[i-1];
        const dist = haversineDistance(prev.lat, prev.lon, lat, lon);
        totalDistanceKm += dist;

        const eleDiff = ele - prev.ele;
        if (eleDiff > 0) {
            totalElevationGain += eleDiff;
        }
    }

    points.push({
      time,
      lat,
      lon,
      ele,
      power: power || undefined,
      hr: hr || undefined,
      cad: cad || undefined,
    });
  }

  // Basic stats
  const startTime = points.length > 0 ? points[0].time : new Date();
  const endTime = points.length > 0 ? points[points.length - 1].time : new Date();
  
  const durationMs = points.length > 1 
    ? endTime.getTime() - startTime.getTime()
    : 0;
  const durationMinutes = Math.floor(durationMs / 60000);
  const avgHr = hrCount > 0 ? Math.round(totalHr / hrCount) : 0;
  const avgPower = powerCount > 0 ? Math.round(totalPower / powerCount) : 0;
  const avgCadence = cadCount > 0 ? Math.round(totalCadence / cadCount) : 0;

  // --- DERIVED METRICS ---

  // 1. Efficiency Factor (EF) = Normalized Power / Avg HR
  const efficiency = avgHr > 0 ? parseFloat((avgPower / avgHr).toFixed(2)) : 0;

  // 2. Zone Calculation (HR)
  const referenceMaxHr = Math.max(maxHr, 185); 
  
  const hrZones: ZoneStats = { z1: 0, z2: 0, z3: 0, z4: 0, z5: 0 };

  // Calculate time in zones based on point duration (approx 1s usually, but we use time diff)
  for (let i = 0; i < points.length - 1; i++) {
      const p1 = points[i];
      const p2 = points[i+1];
      const diffSec = (p2.time.getTime() - p1.time.getTime()) / 1000;
      
      // Skip pauses
      if (diffSec > 10) continue; 

      const hr = p1.hr || 0;
      if (hr === 0) continue;

      const pct = hr / referenceMaxHr;
      
      if (pct < 0.6) hrZones.z1 += diffSec;
      else if (pct < 0.7) hrZones.z2 += diffSec;
      else if (pct < 0.8) hrZones.z3 += diffSec;
      else if (pct < 0.9) hrZones.z4 += diffSec;
      else hrZones.z5 += diffSec;
  }

  // Convert seconds to minutes
  hrZones.z1 = Math.round(hrZones.z1 / 60);
  hrZones.z2 = Math.round(hrZones.z2 / 60);
  hrZones.z3 = Math.round(hrZones.z3 / 60);
  hrZones.z4 = Math.round(hrZones.z4 / 60);
  hrZones.z5 = Math.round(hrZones.z5 / 60);

  const id = `act_${startTime.getTime()}`;

  return {
    id,
    date: startTime.toLocaleDateString(),
    timestamp: startTime.getTime(),
    durationMinutes,
    distanceKm: parseFloat(totalDistanceKm.toFixed(2)),
    totalElevationGain: Math.round(totalElevationGain),
    avgHr,
    maxHr,
    avgPower,
    maxPower,
    avgCadence,
    efficiency,
    hrZones,
    points
  };
};