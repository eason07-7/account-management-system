# 資料庫更新 SQL

## 新增欄位到 users 表

請在 Supabase 的 SQL Editor 中執行以下 SQL 語句，為 users 表添加新欄位：

```sql
-- 添加會員連絡電話欄位
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS 會員連絡電話 TEXT;

-- 添加會員地址欄位
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS 會員地址 TEXT;
```

執行完成後，users 表將包含以下欄位：
- id (UUID)
- 會員帳號 (TEXT)
- 會員姓名 (TEXT)
- 帳號密碼 (TEXT)
- 會員連絡電話 (TEXT) - 新增
- 會員地址 (TEXT) - 新增
- 用戶角色 (TEXT)
- 建立時間 (TIMESTAMP)
- 更新時間 (TIMESTAMP)
