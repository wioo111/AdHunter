import React, { useState, useEffect } from 'react';

export interface AdHotspot {
  id: string;
  x: number;
  y: number;
  radius: number;
  name: string;
  sarcasmText: string;
}

export interface LevelData {
  levelId: number;
  title: string;
  imageUrl: string;
  ads: AdHotspot[];
}

export const AdHunterEngine: React.FC<{ 
  level: LevelData; 
  onNextLevel: () => void;
  debugMode?: boolean;
  onAddAd?: (x: number, y: number) => void;
  // 新增接口：选中某个热区和修改热区半径
  activeAdId?: string | null;
  onSelectAd?: (id: string | null) => void;
}> = ({ level, onNextLevel, debugMode = false, onAddAd, activeAdId, onSelectAd }) => {
  const [foundAds, setFoundAds] = useState<string[]>([]);
  const [activePopup, setActivePopup] = useState<AdHotspot | null>(null);

  useEffect(() => {
    setFoundAds([]);
    setActivePopup(null);
  }, [level.levelId]);
  
  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickXPercent = ((e.clientX - rect.left) / rect.width) * 100;
    const clickYPercent = ((e.clientY - rect.top) / rect.height) * 100;

    if (debugMode) {
      // 检查是否点击在已有的热区内，如果是，则选中它而不是创建新热区
      const clickedExistingAd = level.ads.find(ad => {
        const dist = Math.sqrt(Math.pow(clickXPercent - ad.x, 2) + Math.pow(clickYPercent - ad.y, 2));
        return dist <= ad.radius;
      });

      if (clickedExistingAd && onSelectAd) {
        onSelectAd(clickedExistingAd.id);
      } else if (onAddAd) {
        onAddAd(clickXPercent, clickYPercent);
      }
      return; 
    }

    const hitAd = level.ads.find(ad => {
      const dist = Math.sqrt(Math.pow(clickXPercent - ad.x, 2) + Math.pow(clickYPercent - ad.y, 2));
      return dist <= ad.radius;
    });

    if (hitAd && !foundAds.includes(hitAd.id)) {
      setFoundAds([...foundAds, hitAd.id]);
      setActivePopup(hitAd);
      setTimeout(() => setActivePopup(null), 3000);
    } else {
      e.currentTarget.classList.remove('shake');
      void e.currentTarget.offsetWidth;
      e.currentTarget.classList.add('shake');
    }
  };

  const isComplete = foundAds.length === level.ads.length && level.ads.length > 0 && !debugMode;

  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: '800px', margin: '0 auto', color: 'white' }}>
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

      <div style={{ padding: '10px 20px', background: '#333', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0, fontSize: '16px' }}>{debugMode ? `🛠️ [录制模式] ${level.title}` : level.title}</h2>
        {!debugMode && <span style={{ fontWeight: 'bold', color: '#ff4d4f' }}>已找到: {foundAds.length} / {level.ads.length}</span>}
        {debugMode && <span style={{ fontWeight: 'bold', color: '#4caf50' }}>已标记: {level.ads.length} 处</span>}
      </div>

      <div 
        onClick={handleImageClick}
        style={{ position: 'relative', width: '100%', overflow: 'hidden', cursor: debugMode ? 'crosshair' : 'pointer', userSelect: 'none' }}
      >
        <img 
          src={level.imageUrl} 
          alt="场景" 
          style={{ width: '100%', height: 'auto', display: 'block', pointerEvents: 'none' }} 
        />

        {level.ads.filter(ad => debugMode || foundAds.includes(ad.id)).map(ad => {
          const isActive = debugMode && activeAdId === ad.id;
          return (
            <div 
              key={ad.id}
              style={{
                position: 'absolute', left: `${ad.x}%`, top: `${ad.y}%`, width: `${ad.radius * 2}%`, height: `${ad.radius * 2}%`,
                transform: 'translate(-50%, -50%)', 
                // 选中状态下，边框变粗且变成黄色，方便调节时观察
                border: isActive ? '6px dashed #fadb14' : '4px solid #ff4d4f', 
                borderRadius: '50%',
                boxShadow: isActive ? '0 0 20px rgba(250, 219, 20, 0.8)' : '0 0 15px rgba(255, 77, 79, 0.8)', 
                pointerEvents: 'none',
                backgroundColor: debugMode ? (isActive ? 'rgba(250, 219, 20, 0.3)' : 'rgba(255, 77, 79, 0.3)') : 'transparent',
                transition: 'all 0.1s ease-out'
              }}
            />
          );
        })}
      </div>

      {activePopup && !debugMode && (
        <div style={{
          position: 'absolute', top: '20%', left: '50%', transform: 'translate(-50%, -50%)',
          background: 'rgba(0,0,0,0.85)', padding: '20px', borderRadius: '12px', zIndex: 100,
          border: '2px solid #ff4d4f', width: '80%', maxWidth: '400px', textAlign: 'center'
        }}>
          <h3 style={{ color: '#ff4d4f', margin: '0 0 10px 0' }}>📸 抓到了！{activePopup.name}</h3>
          <p style={{ margin: 0, fontSize: '16px', lineHeight: '1.5' }}>{activePopup.sarcasmText}</p>
        </div>
      )}

      {isComplete && (
        <div style={{
          position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
          background: 'rgba(0,0,0,0.9)', display: 'flex', flexDirection: 'column',
          justifyContent: 'center', alignItems: 'center', zIndex: 200
        }}>
          <h1 style={{ color: '#ff4d4f', fontSize: '32px', marginBottom: '10px' }}>通关！</h1>
          <p style={{ fontSize: '18px', color: '#ccc', marginBottom: '30px' }}>资本的软广无处遁形。</p>
          <button 
            onClick={onNextLevel}
            style={{
              padding: '12px 30px', background: '#ff4d4f', color: 'white', border: 'none',
              borderRadius: '25px', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer'
          }}>进入下一关</button>
        </div>
      )}
    </div>
  );
};
