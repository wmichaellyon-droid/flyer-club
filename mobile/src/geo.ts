import { EventItem, UserLocation } from './types';

interface GeoPoint {
  latitude: number;
  longitude: number;
}

export function milesBetweenPoints(a: GeoPoint, b: GeoPoint) {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const earthMiles = 3958.8;
  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);

  const h =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);

  return 2 * earthMiles * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

export function milesFromUserToEvent(userLocation: UserLocation, event: EventItem) {
  return milesBetweenPoints(userLocation, {
    latitude: event.latitude,
    longitude: event.longitude,
  });
}
