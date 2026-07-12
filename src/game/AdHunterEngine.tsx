import React, { useEffect, useRef, useState } from 'react';
import { findHitAd } from '../../shared/hitTest';
import type { AdHotspot, LevelData } from '../../shared/types';

interface AdHunterEngineProps {
  level: LevelData;
  onNextLevel: () => void;
  debugMode?: boolean;
  onAddAd?: (x: number, y: number) => void;
  activeAdId?: string | null;
  onSelectAd?: (id: string | null) => void;
}

export const AdHunterEngine: React.FC<AdHunterEngineProps> = ({
  level,
  onNextLevel,
  debugMode = false,
  onAddAd,
  activeAdId,
  onSelectAd,
}) => {
  const [foundAds, setFoundAds] = useState<string[]>([]);
  const [activePopup, setActivePopup] = useState<AdHotspot | null>(null);
  const [imageError, setImageError] = useState(false);
  const popupTimerRef = useRef<number | null>(null);

  const clearPopupTimer = () => {
    if (popupTimerRef.current !== null) {
      window.clearTimeout(popupTimerRef.current);
      popupTimerRef.current = null;
    }
  };

  useEffect(() => {
    setFoundAds([]);
    setActivePopup(null);
    setImageError(false);
    clearPopupTimer();
  }, [level.levelId]);

  useEffect(() => () => clearPopupTimer(), []);

  const showPopup = (ad: AdHotspot) => {
    clearPopupTimer();
    setActivePopup(ad);
    popupTimerRef.current = window.setTimeout(() => {
      setActivePopup(null);
      popupTimerRef.current = null;
    }, 3000);
  };

  const handleImageClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (imageError) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const clickXPercent = ((event.clientX - rect.left) / rect.width) * 100;
    const clickYPercent = ((event.clientY - rect.top) / rect.height) * 100;
    const hitAd = findHitAd(level.ads, clickXPercent, clickYPercent);

    if (debugMode) {
      if (hitAd) {
        onSelectAd?.(hitAd.id);
      } else {
        onAddAd?.(clickXPercent, clickYPercent);
      }
      return;
    }

    if (hitAd) {
      setFoundAds((current) => (current.includes(hitAd.id) ? current : [...current, hitAd.id]));
      showPopup(hitAd);
      return;
    }

    event.currentTarget.classList.remove('shake');
    void event.currentTarget.offsetWidth;
    event.currentTarget.classList.add('shake');
  };

  const isComplete = foundAds.length === level.ads.length && level.ads.length > 0 && !debugMode;

  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: 800, margin: '0 auto', color: 'white' }}>
      <style>
        {`
          @keyframes shake {
            0% { transform: translateX(0); }
            25% { transform: translateX(-5px); }
            50% { transform: translateX(5px); }
            75% { transform: translateX(-5px); }
            100% { transform: translateX(0); }
          }
          .shake { animation: shake 0.3s; }
        `}
      </style>

      <div style={{ padding: '10px 20px', background: '#333', display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
        <h2 style={{ margin: 0, fontSize: 16 }}>{debugMode ? `🛠️ [标注模式] ${level.title}` : level.title}</h2>
        {!debugMode && <span style={{ fontWeight: 'bold', color: '#ff4d4f', whiteSpace: 'nowrap' }}>已找到：{foundAds.length} / {level.ads.length}</span>}
        {debugMode && <span style={{ fontWeight: 'bold', color: '#4caf50', whiteSpace: 'nowrap' }}>已标记：{level.ads.length}</span>}
      </div>

      <div
        onClick={handleImageClick}
        style={{ position: 'relative', width: '100%', overflow: 'hidden', cursor: debugMode ? 'crosshair' : 'pointer', userSelect: 'none', background: '#222' }}
      >
        {imageError ? (
          <div style={{ minHeight: 320, display: 'grid', placeItems: 'center', padding: 24, color: '#ff7875', textAlign: 'center' }}>
            图片加载失败：{level.imageUrl}
          </div>
        ) : (
          <img
            src={level.imageUrl}
            alt={level.title}
            draggable={false}
            onError={() => setImageError(true)}
            style={{ width: '100%', height: 'auto', display: 'block', pointerEvents: 'none' }}
          />
        )}

        {!imageError && level.ads.filter((ad) => debugMode || foundAds.includes(ad.id)).map((ad) => {
          const isActive = debugMode && activeAdId === ad.id;
          return (
            <div
              key={ad.id}
              aria-hidden="true"
              style={{
                position: 'absolute',
                left: `${ad.x}%`,
                top: `${ad.y}%`,
                width: `${ad.radius * 2}%`,
                height: `${ad.radius * 2}%`,
                transform: 'translate(-50%, -50%)',
                border: isActive ? '6px dashed #fadb14' : '4px solid #ff4d4f',
                borderRadius: '50%',
                boxSizing: 'border-box',
                boxShadow: isActive ? '0 0 20px rgba(250, 219, 20, 0.8)' : '0 0 15px rgba(255, 77, 79, 0.8)',
                pointerEvents: 'none',
                backgroundColor: debugMode ? (isActive ? 'rgba(250, 219, 20, 0.3)' : 'rgba(255, 77, 79, 0.3)') : 'transparent',
                transition: 'all 0.1s ease-out',
              }}
            />
          );
        })}
      </div>

      {activePopup && !debugMode && (
        <div style={{ position: 'absolute', top: '20%', left: '50%', transform: 'translate(-50%, -50%)', background: 'rgba(0,0,0,0.88)', padding: 20, borderRadius: 12, zIndex: 100, border: '2px solid #ff4d4f', width: '80%', maxWidth: 400, boxSizing: 'border-box', textAlign: 'center' }}>
          <h3 style={{ color: '#ff4d4f', margin: '0 0 10px' }}>抓到了{activePopup.name ? `：${activePopup.name}` : '！'}</h3>
          <p style={{ margin: 0, fontSize: 16, lineHeight: 1.5 }}>{activePopup.sarcasmText || '识别到一处软广植入。'}</p>
        </div>
      )}

      {isComplete && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.92)', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', zIndex: 200, padding: 24, textAlign: 'center' }}>
          <h1 style={{ color: '#ff4d4f', fontSize: 32, marginBottom: 10 }}>通关</h1>
          <p style={{ fontSize: 18, color: '#ccc', marginBottom: 30 }}>本关植入点已全部找出。</p>
          <button type="button" onClick={onNextLevel} style={{ padding: '12px 30px', background: '#ff4d4f', color: 'white', border: 'none', borderRadius: 25, fontSize: 18, fontWeight: 'bold', cursor: 'pointer' }}>
            进入下一关
          </button>
        </div>
      )}
    </div>
  );
};
