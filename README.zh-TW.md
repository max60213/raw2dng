# raw2dng

[English README](./README.md)

這個專案是為了讓在行動裝置上也能處理 RAW 檔。

很多能良好處理 RAW 檔的專業軟體都需要付費，例如 Lightroom 或 Photomator。把 RAW 檔轉成開放的 DNG 格式之後，就能讓更多軟體支援與處理。

P.S. 這個工具的動機很大一部分來自 Google Snapseed。Snapseed 真的免費又好用，但它對 RAW 檔的支援仍有限，這也是我自己動手寫這個轉換工具的原因。

## 目前狀態

- 已實作以瀏覽器為主的 RAW → DNG 轉換流程。
- `LibRaw` 已編譯成 WebAssembly，並隨 repo 一起提供。
- 目前預設輸出路線優先考慮較小、較容易被軟體打開的 DNG。
- repo 內仍保留 `Linear Raw / Linear DNG` 的實驗性處理路線，作為後續畫質與色彩研究用途，但它目前不是預設輸出模式。

## 常用指令

```bash
npm install
npm run dev
npm run check
```

## Browser Smoke

用 repo 內建的 Canon 範例 RAW 做一次真實瀏覽器 smoke test：

```bash
bash scripts/browser-smoke.sh
```

Playwright 產生的暫存檔會放在 `.playwright-cli/`，並且已加入 git ignore。

## Metadata Smoke

產生 round-trip DNG 並用 `exiftool` 檢查關鍵 metadata：

```bash
bash scripts/exiftool-smoke.sh
```

## Roadmap

未來計畫請看 [docs/roadmap.md](./docs/roadmap.md)。

下一個主要方向是改用 Adobe DNG SDK，讓專案能輸出真正的 Raw DNG，而不是只依賴目前的自製輸出流程。

## 專案結構

- `apps/web`: React + Vite 前端
- `packages/raw-core`: 共用型別、能力限制、metadata 正規化
- `packages/dng-writer`: DNG/TIFF 寫入邏輯
- `packages/libraw-wasm`: LibRaw bridge 與 WASM runtime
- `packages/worker-runtime`: Worker 協定與轉換流程

## LibRaw WASM

repo 已包含生成好的：

- `packages/libraw-wasm/src/generated/libraw.js`
- `packages/libraw-wasm/src/generated/libraw.wasm`

如果要本機重編：

```bash
source .tools/emsdk/emsdk_env.sh
bash packages/libraw-wasm/scripts/build-wasm.sh
```
