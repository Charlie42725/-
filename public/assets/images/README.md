# 圖片資源放置指南

我已經為您創建了完整的圖片資料夾結構，請按照以下說明放置圖片：

## 📁 資料夾結構
```
public/assets/images/
├── logos/          - 網站Logo圖片
├── banners/        - 首頁輪播Banner圖片  
├── products/       - 商品展示圖片
└── README.md       - 此說明文件
```

## 🖼️ 需要的圖片文件

### Logo 圖片 (放入 `/public/assets/images/logos/`)
- **logo.png** - 網站主要Logo
  - 建議尺寸: 120x40px 或 240x80px (高解析度)
  - 格式: PNG (支援透明背景)

### Banner 圖片 (放入 `/public/assets/images/banners/`)
- **banner1.jpg** - 主要輪播圖 (如UI截圖中的FOUNTAIN OF LIFE)
  - 建議尺寸: 1920x500px 或 1280x400px
  - 格式: JPG 或 PNG
  
- **banner2.jpg** - 第二張輪播圖
  - 建議尺寸: 1920x500px 或 1280x400px
  - 格式: JPG 或 PNG

### 商品圖片 (放入 `/public/assets/images/products/`)
- **product1.jpg** - 蘋果套裝商品圖
- **product2.jpg** - ECG商品圖  
- **product3.jpg** - EGG x Cheese商品圖
- **product4.jpg** - GEISHUI商品圖
  - 建議尺寸: 400x400px (正方形)
  - 格式: JPG 或 PNG

## 🎨 圖片要求
- **檔案大小**: Banner < 300KB, 商品圖片 < 150KB, Logo < 50KB
- **品質**: 高解析度，適合網頁顯示
- **格式**: PNG(透明背景), JPG(較小檔案), WebP(最佳壓縮)

## 📝 完成圖片放置後
1. 將圖片放入對應資料夾
2. 確保檔案名稱完全符合上述要求
3. 重新啟動開發服務器: `npm run dev`
4. 檢查網站顯示效果

## 🔄 如果暫時沒有圖片
我已將組件設置為在圖片載入失敗時顯示佔位符，網站仍可正常運行。

放置完圖片後，請告訴我，我會幫您更新組件中的圖片路徑！