import type { AdHotspot, LevelData } from './types';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const asFiniteNumber = (value: unknown, field: string): number => {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(`${field} 必须是有限数字`);
  }
  return value;
};

const asString = (value: unknown, field: string): string => {
  if (typeof value !== 'string') {
    throw new Error(`${field} 必须是字符串`);
  }
  return value;
};

const parseHotspot = (value: unknown, levelId: number, index: number): AdHotspot => {
  if (!isRecord(value)) {
    throw new Error(`关卡 ${levelId} 的第 ${index + 1} 个热点格式错误`);
  }

  const id = asString(value.id, `关卡 ${levelId} 热点 id`).trim();
  const x = asFiniteNumber(value.x, `关卡 ${levelId} 热点 x`);
  const y = asFiniteNumber(value.y, `关卡 ${levelId} 热点 y`);
  const radius = asFiniteNumber(value.radius, `关卡 ${levelId} 热点 radius`);

  if (!id) throw new Error(`关卡 ${levelId} 存在空热点 id`);
  if (x < 0 || x > 100 || y < 0 || y > 100) {
    throw new Error(`关卡 ${levelId} 热点 ${id} 的坐标必须在 0 到 100 之间`);
  }
  if (radius <= 0 || radius > 50) {
    throw new Error(`关卡 ${levelId} 热点 ${id} 的半径必须大于 0 且不超过 50`);
  }

  return {
    id,
    x,
    y,
    radius,
    name: asString(value.name ?? '', `关卡 ${levelId} 热点 name`),
    sarcasmText: asString(value.sarcasmText ?? '', `关卡 ${levelId} 热点 sarcasmText`),
  };
};

const parseLevel = (value: unknown, index: number): LevelData => {
  if (!isRecord(value)) {
    throw new Error(`第 ${index + 1} 个关卡格式错误`);
  }

  const levelId = asFiniteNumber(value.levelId, `第 ${index + 1} 个关卡 levelId`);
  const title = asString(value.title, `关卡 ${levelId} title`).trim();
  const imageUrl = asString(value.imageUrl, `关卡 ${levelId} imageUrl`).trim();

  if (!Number.isInteger(levelId) || levelId <= 0) {
    throw new Error('关卡 levelId 必须是正整数');
  }
  if (!title) throw new Error(`关卡 ${levelId} 缺少标题`);
  if (!imageUrl) throw new Error(`关卡 ${levelId} 缺少图片地址`);
  if (!Array.isArray(value.ads) || value.ads.length === 0) {
    throw new Error(`关卡 ${levelId} 至少需要一个热点`);
  }

  const ads = value.ads.map((ad, adIndex) => parseHotspot(ad, levelId, adIndex));
  const hotspotIds = new Set<string>();
  for (const ad of ads) {
    if (hotspotIds.has(ad.id)) {
      throw new Error(`关卡 ${levelId} 存在重复热点 id：${ad.id}`);
    }
    hotspotIds.add(ad.id);
  }

  return { levelId, title, imageUrl, ads };
};

export const normalizeLevels = (value: unknown): LevelData[] => {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error('关卡数据必须是非空数组');
  }

  const levels = value.map(parseLevel).sort((a, b) => a.levelId - b.levelId);
  const levelIds = new Set<number>();
  for (const level of levels) {
    if (levelIds.has(level.levelId)) {
      throw new Error(`存在重复关卡 id：${level.levelId}`);
    }
    levelIds.add(level.levelId);
  }

  return levels;
};
