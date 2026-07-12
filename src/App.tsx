import { useEffect, useMemo, useState } from 'react';
import type { AdHotspot, LevelData } from '../shared/types';
import { loadLevels, type LevelSource } from './data/loadLevels';
import { DebugPanel } from './editor/DebugPanel';
import { AdHunterEngine } from './game/AdHunterEngine';

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export const App = () => {
  const [levels, setLevels] = useState<LevelData[]>([]);
  const [currentLevelIndex, setCurrentLevelIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [levelSource, setLevelSource] = useState<LevelSource>('fallback');
  const [sourceWarning, setSourceWarning] = useState<string>();
  const [isDebugMode, setIsDebugMode] = useState(false);
  const [activeAdId, setActiveAdId] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const usesCommandKey = event.ctrlKey || event.metaKey;
      if (usesCommandKey && event.shiftKey && event.key.toLowerCase() === 'd') {
        event.preventDefault();
        setIsDebugMode((current) => {
          const next = !current;
          console.info(`标注模式已${next ? '开启' : '关闭'}`);
          return next;
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    const fetchLevels = async () => {
      try {
        setIsLoading(true);
        setErrorMsg(null);
        const result = await loadLevels(controller.signal);
        setLevels(result.levels);
        setLevelSource(result.source);
        setSourceWarning(result.warning);
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        const message = error instanceof Error ? error.message : '未知错误';
        setErrorMsg(`关卡数据加载失败：${message}`);
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    };

    void fetchLevels();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    setActiveAdId(null);
  }, [currentLevelIndex, isDebugMode]);

  const currentLevel = levels[currentLevelIndex];
  const activeAd = useMemo(
    () => currentLevel?.ads.find((ad) => ad.id === activeAdId) ?? null,
    [activeAdId, currentLevel],
  );

  const updateCurrentLevel = (updater: (level: LevelData) => LevelData) => {
    setLevels((currentLevels) =>
      currentLevels.map((level, index) => (index === currentLevelIndex ? updater(level) : level)),
    );
  };

  const handleAddAd = (x: number, y: number) => {
    const newAd: AdHotspot = {
      id: `ad_${Date.now()}`,
      x: Number(x.toFixed(2)),
      y: Number(y.toFixed(2)),
      radius: 5,
      name: '',
      sarcasmText: '请输入吐槽文案',
    };

    updateCurrentLevel((level) => ({ ...level, ads: [...level.ads, newAd] }));
    setActiveAdId(newAd.id);
  };

  const handleUpdateActiveAd = (patch: Partial<Omit<AdHotspot, 'id'>>) => {
    if (!activeAdId) return;

    const safePatch = {
      ...patch,
      ...(typeof patch.x === 'number' ? { x: clamp(patch.x, 0, 100) } : {}),
      ...(typeof patch.y === 'number' ? { y: clamp(patch.y, 0, 100) } : {}),
      ...(typeof patch.radius === 'number' ? { radius: clamp(patch.radius, 1, 50) } : {}),
    };

    updateCurrentLevel((level) => ({
      ...level,
      ads: level.ads.map((ad) => (ad.id === activeAdId ? { ...ad, ...safePatch } : ad)),
    }));
  };

  const handleDeleteActiveAd = () => {
    if (!activeAdId || !currentLevel || currentLevel.ads.length <= 1) {
      window.alert('每个关卡至少需要保留一个热点。');
      return;
    }

    updateCurrentLevel((level) => ({
      ...level,
      ads: level.ads.filter((ad) => ad.id !== activeAdId),
    }));
    setActiveAdId(null);
  };

  const handleExportLevels = () => {
    const blob = new Blob([`${JSON.stringify(levels, null, 2)}\n`], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'levels_schema.json';
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const handleNextLevel = () => {
    setCurrentLevelIndex((current) => {
      if (current < levels.length - 1) return current + 1;
      window.alert('全部关卡已完成。');
      return 0;
    });
  };

  if (isLoading) {
    return <StatusScreen message="正在加载关卡数据…" />;
  }

  if (errorMsg) {
    return <StatusScreen message={errorMsg} />;
  }

  if (!currentLevel) {
    return <StatusScreen message="没有可用关卡。" />;
  }

  return (
    <main style={{ width: '100vw', minHeight: '100vh', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#111', padding: '16px 12px' }}>
      <AdHunterEngine
        level={currentLevel}
        onNextLevel={handleNextLevel}
        debugMode={isDebugMode}
        onAddAd={handleAddAd}
        activeAdId={activeAdId}
        onSelectAd={setActiveAdId}
      />

      {isDebugMode && (
        <DebugPanel
          level={currentLevel}
          activeAd={activeAd}
          source={levelSource}
          sourceWarning={sourceWarning}
          onChange={handleUpdateActiveAd}
          onDelete={handleDeleteActiveAd}
          onExport={handleExportLevels}
        />
      )}
    </main>
  );
};

const StatusScreen = ({ message }: { message: string }) => (
  <div style={{ width: '100vw', minHeight: '100vh', boxSizing: 'border-box', display: 'grid', placeItems: 'center', background: '#111', color: '#ff7875', padding: 20, textAlign: 'center', fontSize: 20, fontWeight: 700 }}>
    {message}
  </div>
);

