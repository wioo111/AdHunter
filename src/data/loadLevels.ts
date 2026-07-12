import fallbackLevels from '../../content/levels.json';
import { normalizeLevels } from '../../shared/levelValidation';
import type { LevelData } from '../../shared/types';

export type LevelSource = 'cloud' | 'fallback';

export interface LoadedLevels {
  levels: LevelData[];
  source: LevelSource;
  warning?: string;
}

const DEFAULT_CLOUDBASE_ENV_ID = 'q-1-d5gib3mzr6ba550d2';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

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
