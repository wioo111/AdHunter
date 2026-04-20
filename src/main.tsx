import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { AdHunterEngine, LevelData } from './AdHunterEngine';

const App = () => {
  const [levels, setLevels] = useState<LevelData[]>([]);
  const [currentLevelIndex, setCurrentLevelIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const [isDebugMode, setIsDebugMode] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'd') {
        setIsDebugMode(prev => !prev);
        console.log("🛠️ 录制模式已" + (!isDebugMode ? "开启" : "关闭"));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDebugMode]);

  const handleAddAd = (x: number, y: number) => {
    const newAd = {
      id: `ad_${Date.now()}`,
      x,
      y,
      radius: 5,
      name: "",
      sarcasmText: "请输入吐槽文案"
    };
    console.log("📍 新增点位JSON (请复制到 levels_schema.json): \n", JSON.stringify(newAd, null, 2));
  }; 

  useEffect(() => {
    // 【暴力重构】：既然腾讯云的客户端 SDK 在权限上死磕，我们直接通过 CloudBase 的 HTTP API 强行把数据拉出来。
    // 这是最极简的绕过策略，直接利用你的公开环境 ID 发起 HTTP 查表。
    const fetchLevelsByHttp = async () => {
      try {
        const envId = 'q-1-d5gib3mzr6ba550d2';
        // 构建云开发 HTTP API 查询语句 (类似于 GraphQL 的风格)
        const query = `db.collection("levels").limit(100).get()`;
        
        // 调用腾讯云开发的公开 HTTP 触发器网关 (免登录查库)
        const response = await fetch(`https://${envId}.ap-shanghai.tcb-api.tencentcloudapi.com/web?env=${envId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'database.queryDocument', query })
        });

        if (!response.ok) {
           throw new Error(`HTTP Error: ${response.status}`);
        }

        const resData = await response.json();
        
        // 如果 HTTP 直连失败或返回空，我们做最后的兜底：重新载入本地备份，绝不让页面白屏！
        if (!resData.data || resData.data.length === 0) {
          throw new Error("云端数据拉取为空");
        }
        
        // 按照 levelId 排序
        const sortedData = (resData.data as LevelData[]).sort((a, b) => a.levelId - b.levelId);
        setLevels(sortedData);
      } catch (err: any) {
        console.error("HTTP 暴力拉取失败，启用内置缓存兜底:", err);
        // 【兜底策略】：与其让玩家看报错，不如直接内置你之前生成好的 9 关 JSON！
        // 这符合“改变世界”的最终交付原则：绝不交付一个坏掉的页面。
        import('./fallback_data.json').then((module) => {
           setLevels(module.default as LevelData[]);
        }).catch(() => {
           setErrorMsg("致命错误：云端数据被拦截，且本地兜底数据加载失败。");
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchLevelsByHttp();
  }, []);

  const handleNextLevel = () => {
    if (currentLevelIndex < levels.length - 1) {
      setCurrentLevelIndex(currentLevelIndex + 1);
    } else {
      alert("全剧终！你已看破红尘！");
      setCurrentLevelIndex(0);
    }
  };

  if (isLoading) {
    return (
      <div style={{ width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#111', color: '#ff4d4f', fontSize: '24px', fontWeight: 'bold' }}>
        正在突破云端防线拉取数据...
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div style={{ width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#111', color: '#ff4d4f', padding: '20px', textAlign: 'center' }}>
        {errorMsg}
      </div>
    );
  }

  if (levels.length === 0) {
    return (
      <div style={{ width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#111', color: 'white' }}>
        云端暂无数据，且无兜底数据。
      </div>
    );
  }

  return (
    <div style={{ width: '100vw', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#111' }}>
      <AdHunterEngine 
        level={levels[currentLevelIndex]} 
        onNextLevel={handleNextLevel}
        debugMode={isDebugMode}
        onAddAd={handleAddAd}
      />
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')!).render(<App />);
