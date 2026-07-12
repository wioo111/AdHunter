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
