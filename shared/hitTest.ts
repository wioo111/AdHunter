import type { AdHotspot } from './types';

export const findHitAd = (
  ads: AdHotspot[],
  x: number,
  y: number,
): AdHotspot | undefined =>
  ads
    .map((ad) => ({
      ad,
      distance: Math.hypot(x - ad.x, y - ad.y),
    }))
    .filter(({ ad, distance }) => distance <= ad.radius)
    .sort((left, right) => left.distance - right.distance)[0]?.ad;
