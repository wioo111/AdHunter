import cloudbase from '@cloudbase/js-sdk';

import fallbackLevels from '../../content/levels.json';
import { normalizeLevels } from '../../shared/levelValidation';
import type { LevelData } from '../../shared/types';

export type LevelSource = 'cloud' | 'fallback';

export interface LoadedLevels {
  levels: LevelData[];
  source: LevelSource;
  warning?: string;
}

const envId = import.meta.env.VITE_CLOUDBASE_ENV_ID?.trim();
const accessKey = import.meta.env.VITE_CLOUDBASE_PUBLISHABLE_KEY?.trim();

const cloudbaseApp =
  envId && accessKey
    ? cloudbase.init({
        env: envId,
        accessKey,
      })
    : null;

const throwIfAborted = (signal?: AbortSignal) => {
  if (signal?.aborted) {
    throw new DOMException('The operation was aborted.', 'AbortError');
  }
};

const fetchCloudLevels = async (signal?: AbortSignal): Promise<LevelData[]> => {
  if (!cloudbaseApp) {
    throw new Error('缺少 CloudBase 环境 ID 或 Publishable Key');
  }

  throwIfAborted(signal);
  const result = await cloudbaseApp.database().collection('levels').limit(100).get();
  throwIfAborted(signal);

  if (typeof result.code === 'string' && result.code) {
    throw new Error(result.message || `CloudBase 查询失败：${result.code}`);
  }

  return normalizeLevels(result.data);
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
