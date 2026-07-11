# AdHunter（软广猎手）

一个基于 React、TypeScript 和 Vite 的图片找茬小游戏。玩家在场景图中寻找软广植入点；全部找出后进入下一关。

## 当前能力

- 从腾讯云 CloudBase `levels` 集合读取关卡。
- 云端不可用时自动切换到本地 `src/fallback_data.json`。
- 对关卡、坐标、半径和重复 ID 做运行时校验，避免坏数据进入渲染层。
- 支持热点命中、重复查看提示、通关和自动切换下一关。
- 内置标注模式，可新增、选择、移动、调整半径、修改文案、删除热点，并导出完整 JSON。

## 本地运行

```bash
npm ci
npm run dev
```

生产构建与类型检查：

```bash
npm run check
```

## 标注模式

按 `Ctrl + Shift + D`；macOS 使用 `Command + Shift + D`。

进入后：

1. 点击已有红色热点，编辑面板会选中它。
2. 点击图片空白处创建新热点。
3. 修改名称、吐槽文案、坐标和判定半径。
4. 点击“导出全部 JSON”，下载新的 `levels_schema.json`。

标注结果只存在于当前浏览器会话，不会直接写入 CloudBase。导出的 JSON 需要人工审核后再同步到云端和 `src/fallback_data.json`。

## 数据结构

```json
{
  "levelId": 1,
  "title": "关卡标题",
  "imageUrl": "/level1.png",
  "ads": [
    {
      "id": "ad_unique_id",
      "x": 50,
      "y": 50,
      "radius": 5,
      "name": "商品或品牌",
      "sarcasmText": "命中后的提示文案"
    }
  ]
}
```

`x`、`y` 和 `radius` 均使用相对于图片容器的百分比坐标。

## 环境变量

复制 `.env.example` 为 `.env.local`，可覆盖 CloudBase 环境：

```bash
VITE_CLOUDBASE_ENV_ID=your-env-id
```

CloudBase 环境 ID 不是密钥。真正的数据安全边界仍由数据库权限规则决定。

## 工程约束

- `src/fallback_data.json` 是离线兜底数据。
- 根目录 `levels_schema.json` 是便于人工维护和导入的同源副本。
- 两份数据发生变化时必须同步更新。
- Pull Request 会自动执行 TypeScript 检查和 Vite 构建。

后续开发顺序见 [ROADMAP.md](./ROADMAP.md)。
