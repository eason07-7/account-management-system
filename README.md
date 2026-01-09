# 帳戶管理系統

一個基於網頁的帳戶管理系統，提供用戶登入、註冊、查看帳戶資訊等功能，並區分一般用戶與管理員權限。

## 功能特色

- ✅ 用戶註冊與登入
- ✅ 帳戶資訊查看
- ✅ 管理員權限管理（新增、編輯、刪除帳戶）
- ✅ 響應式設計，支援各種裝置
- ✅ 安全的認證機制

## 技術棧

- **前端：** HTML5, CSS3, JavaScript (ES6+)
- **後端：** Supabase
- **部署：** GitHub Pages

## 專案結構

```
webdepoyment/
├── index.html          # 登入頁面
├── register.html       # 註冊頁面
├── home.html          # 首頁（帳戶列表）
├── styles/            # CSS 樣式檔案
│   ├── main.css       # 主要樣式
│   └── home.css       # 首頁樣式
├── js/                # JavaScript 檔案
│   ├── config.js      # Supabase 配置
│   ├── auth.js        # 認證功能
│   ├── login.js       # 登入功能
│   ├── register.js    # 註冊功能
│   └── home.js        # 首頁功能
├── docs/              # 文件
│   ├── PRD.md         # 產品需求文件
│   └── 開發步驟清單.md
└── infer/             # 資料檔案
    └── 預設會員資料.xlsx
```

## 設定說明

### 1. Supabase 配置

在 `js/config.js` 中設定您的 Supabase 專案資訊：

```javascript
export const SUPABASE_CONFIG = {
    url: 'YOUR_SUPABASE_URL',
    anonKey: 'YOUR_SUPABASE_ANON_KEY'
};
```

### 2. 資料庫設定

請參考 `docs/開發步驟清單.md` 中的步驟 2，建立 Supabase 資料表。

## 使用說明

1. 開啟 `index.html` 進入登入頁面
2. 點擊「立即註冊」建立新帳號
3. 登入後可查看所有帳戶資訊
4. 管理員帳號可以新增、編輯、刪除帳戶

## 開發狀態

目前開發中，請參考 `docs/開發步驟清單.md` 了解完整開發進度。

## 授權

本專案僅供學習與開發使用。
