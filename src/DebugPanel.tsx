import type { CSSProperties } from 'react';
import type { AdHotspot, LevelData } from './AdHunterEngine';
import type { LevelSource } from './levelData';

interface DebugPanelProps {
  level: LevelData;
  activeAd: AdHotspot | null;
  source: LevelSource;
  sourceWarning?: string;
  onChange: (patch: Partial<Omit<AdHotspot, 'id'>>) => void;
  onDelete: () => void;
  onExport: () => void;
}

const inputStyle: CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  border: '1px solid #555',
  borderRadius: 6,
  background: '#1f1f1f',
  color: '#fff',
  padding: '8px 10px',
};

export const DebugPanel = ({
  level,
  activeAd,
  source,
  sourceWarning,
  onChange,
  onDelete,
  onExport,
}: DebugPanelProps) => (
  <section
    style={{
      width: '100%',
      maxWidth: 800,
      boxSizing: 'border-box',
      marginTop: 12,
      padding: 16,
      border: '1px solid #444',
      borderRadius: 10,
      background: '#181818',
      color: '#fff',
    }}
  >
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
      <div>
        <strong>关卡标注器</strong>
        <div style={{ marginTop: 4, color: '#aaa', fontSize: 13 }}>
          数据源：{source === 'cloud' ? 'CloudBase' : '本地兜底'} · 关卡 {level.levelId} · {level.ads.length} 个热点
        </div>
      </div>
      <button type="button" onClick={onExport} style={{ padding: '8px 14px', cursor: 'pointer' }}>
        导出全部 JSON
      </button>
    </div>

    {sourceWarning && source === 'fallback' && (
      <p style={{ margin: '12px 0 0', color: '#f0ad4e', fontSize: 13 }}>
        云端读取失败：{sourceWarning}
      </p>
    )}

    {!activeAd ? (
      <p style={{ margin: '16px 0 0', color: '#bbb' }}>点击图片中的已有热点进行编辑，点击空白处创建新热点。</p>
    ) : (
      <div style={{ marginTop: 16, display: 'grid', gap: 12 }}>
        <div style={{ color: '#bbb', fontSize: 13 }}>当前热点：{activeAd.id}</div>

        <label>
          <span style={{ display: 'block', marginBottom: 6 }}>名称</span>
          <input
            value={activeAd.name}
            onChange={(event) => onChange({ name: event.target.value })}
            style={inputStyle}
          />
        </label>

        <label>
          <span style={{ display: 'block', marginBottom: 6 }}>吐槽文案</span>
          <textarea
            value={activeAd.sarcasmText}
            onChange={(event) => onChange({ sarcasmText: event.target.value })}
            rows={3}
            style={{ ...inputStyle, resize: 'vertical' }}
          />
        </label>

        <label>
          <span style={{ display: 'block', marginBottom: 6 }}>判定半径：{activeAd.radius.toFixed(1)}</span>
          <input
            type="range"
            min="1"
            max="20"
            step="0.5"
            value={activeAd.radius}
            onChange={(event) => onChange({ radius: Number(event.target.value) })}
            style={{ width: '100%' }}
          />
        </label>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <label>
            <span style={{ display: 'block', marginBottom: 6 }}>X（%）</span>
            <input
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={Number(activeAd.x.toFixed(2))}
              onChange={(event) => onChange({ x: Number(event.target.value) })}
              style={inputStyle}
            />
          </label>
          <label>
            <span style={{ display: 'block', marginBottom: 6 }}>Y（%）</span>
            <input
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={Number(activeAd.y.toFixed(2))}
              onChange={(event) => onChange({ y: Number(event.target.value) })}
              style={inputStyle}
            />
          </label>
        </div>

        <button
          type="button"
          onClick={onDelete}
          style={{ justifySelf: 'start', padding: '8px 14px', color: '#fff', background: '#8b1e1e', border: 0, borderRadius: 6, cursor: 'pointer' }}
        >
          删除当前热点
        </button>
      </div>
    )}
  </section>
);
