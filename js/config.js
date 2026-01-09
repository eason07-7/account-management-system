/**
 * Supabase 配置檔案
 * 
 * 注意：在部署到 GitHub Pages 之前，需要將這些值替換為實際的 Supabase 專案資訊
 * 為了安全起見，建議使用環境變數或配置檔案來管理這些敏感資訊
 */

// TODO: 請將以下兩個值替換為您的 Supabase 專案資訊
// 這些資訊可以在 Supabase 專案的 Settings > API 頁面找到

export const SUPABASE_CONFIG = {
    // Supabase 專案 URL
    url: 'https://iitvgczfavskshqmhzpm.supabase.co',
    
    // Supabase anon public key
    anonKey: 'sb_publishable_Q2i_I5gYeUrtzaXU3vJ6oQ_IuaNE5OY'
};

// 檢查配置是否已設定
export function checkConfig() {
    if (SUPABASE_CONFIG.url === 'YOUR_SUPABASE_URL' || 
        SUPABASE_CONFIG.anonKey === 'YOUR_SUPABASE_ANON_KEY') {
        console.error('⚠️ Supabase 配置尚未設定！請更新 js/config.js 檔案。');
        return false;
    }
    return true;
}
