# raw2dng

[English README](./README.md)

網站：https://raw2dng.maxlin.tw

這個專案是為了讓在行動裝置上也能處理 RAW 檔。

很多能良好處理 RAW 檔的專業軟體都需要付費，例如 Lightroom 或 Photomator。把 RAW 檔轉成開放的 DNG 格式之後，就能讓更多軟體支援與處理。

P.S. 這個工具的動機很大一部分來自 Google Snapseed。Snapseed 真的免費又好用，但它對 RAW 檔的支援仍有限，這也是我自己動手寫這個轉換工具的原因。

## 目前狀態

- 已實作以瀏覽器為主的 RAW → DNG 轉換流程。
- `LibRaw` 已編譯成 WebAssembly，並隨 repo 一起提供。
- `Adobe DNG SDK` 的 WebAssembly 整合已完成，實作位於 `packages/adobe-dng-wasm`。
- 主要輸出流程現在會優先使用 Adobe DNG SDK backend；若執行環境不可用或 encode 失敗，則回退到既有 writer。
- repo 內仍保留 `Linear Raw / Linear DNG` 的實驗性處理路線，作為後續畫質與色彩研究用途。

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
Adobe DNG SDK 整合里程碑已完成，接下來重點是相容性強化、輸出一致性與跨編輯器畫質驗證。

## 專案結構

- `apps/web`: React + Vite 前端
- `packages/raw-core`: 共用型別、能力限制、metadata 正規化
- `packages/dng-writer`: DNG/TIFF 寫入邏輯
- `packages/libraw-wasm`: LibRaw bridge 與 WASM runtime
- `packages/adobe-dng-wasm`: Adobe DNG SDK WASM adapter 與 runtime 載入
- `packages/worker-runtime`: Worker 協定與轉換流程

## WASM 產物

repo 已包含生成好的：

- `packages/libraw-wasm/src/generated/libraw.js`
- `packages/libraw-wasm/src/generated/libraw.wasm`
- `packages/adobe-dng-wasm/src/generated/adobeDng.js`
- `packages/adobe-dng-wasm/src/generated/adobeDng.wasm`

如果要本機重編：

```bash
source .tools/emsdk/emsdk_env.sh
bash packages/libraw-wasm/scripts/build-wasm.sh
bash packages/adobe-dng-wasm/scripts/build-wasm.sh
```
