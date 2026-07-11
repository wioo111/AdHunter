import fallbackLevels from './fallback_data.json';
import type { AdHotspot, LevelData } from './AdHunterEngine';

export type LevelSource = 'cloud' | 'fallback';

export interface LoadedLevels {
  levels: LevelData[];
  source: LevelSource;
  warning?: string;
}

const DEFAULT_CLOUDBASE_ENV_ID = 'q-1-d5gib3mzr6ba550d2';

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

const decodeCloudData = (value: unknown): unknown => {
  if (!Array.isArray(value)) return value;

  return value.map((item) => {
    if (typeof item !== 'string') return item;
    try {
      return JSON.parse(item) as unknown;
    } catch {
      throw new Error('云端关卡数据包含无法解析的 JSON 字符串');
    }
  });
};

const fetchCloudLevels = async (signal?: AbortSignal): Promise<LevelData[]> => {
  const envId = import.meta.env.VITE_CLOUDBASE_ENV_ID?.trim() || DEFAULT_CLOUDBASE_ENV_ID;
  const query = 'db.collection("levels").limit(100).get()';
  const response = await fetch(
    `https://${envId}.ap-shanghai.tcb-api.tencentcloudapi.com/web?env=${envId}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'database.queryDocument', query }),
      signal,
    },
  );

  if (!response.ok) {
    throw new Error(`云端接口返回 HTTP ${response.status}`);
  }

  const payload: unknown = await response.json();
  if (!isRecord(payload)) {
    throw new Error('云端接口返回格式错误');
  }

  return normalizeLevels(decodeCloudData(payload.data));
};

export const loadLevels = async (signal?: AbortSignal): Promise<LoadedLevels> => {
  try {
    return { levels: await fetchCloudLevels(signal), source: 'cloud' };
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw error;
    }

    const warning = error instanceof Error ? error.message : '未知云端错误';
    console.warn(`云端关卡加载失败，使用本地兜底数据：${warning}`);
    return {
      levels: normalizeLevels(fallbackLevels),
      source: 'fallback',
      warning,
    };
  }
};
