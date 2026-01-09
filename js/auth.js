/**
 * 認證相關功能
 * 處理登入、註冊、登出、權限檢查等功能
 */

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import { SUPABASE_CONFIG, checkConfig } from './config.js';

// 初始化 Supabase 客戶端
let supabase = null;

/**
 * 初始化 Supabase 客戶端
 */
export function initSupabase() {
    if (!checkConfig()) {
        throw new Error('Supabase 配置尚未設定');
    }
    
    if (!supabase) {
        supabase = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
    }
    return supabase;
}

/**
 * 取得 Supabase 客戶端實例
 */
export function getSupabase() {
    if (!supabase) {
        return initSupabase();
    }
    return supabase;
}

/**
 * 註冊新用戶
 * @param {string} account - 會員帳號
 * @param {string} name - 會員姓名
 * @param {string} password - 帳號密碼
 * @returns {Promise<{success: boolean, data: object|null, error: string|null}>}
 */
export async function registerUser(account, name, password) {
    try {
        const client = getSupabase();
        
        // 檢查帳號是否已存在
        const { data: existingUser, error: checkError } = await client
            .from('users')
            .select('會員帳號')
            .eq('會員帳號', account)
            .maybeSingle();
        
        // 如果查詢到用戶，表示帳號已存在
        if (existingUser) {
            return {
                success: false,
                data: null,
                error: '此帳號已被使用，請選擇其他帳號'
            };
        }
        
        // 直接插入到 users 資料表（簡化版本，不使用 Supabase Auth）
        // 如果帳號是 'admin'，自動設置為管理員角色
        const userRole = (account.toLowerCase() === 'admin') ? 'admin' : 'user';
        
        const { data: userData, error: userError } = await client
            .from('users')
            .insert({
                會員帳號: account,
                會員姓名: name,
                帳號密碼: password,
                用戶角色: userRole
            })
            .select()
            .single();
        
        if (userError) {
            console.error('插入用戶錯誤：', userError);
            return {
                success: false,
                data: null,
                error: userError.message || '建立用戶資料失敗，請稍後再試'
            };
        }
        
        // 註冊成功後自動登入
        const loginResult = await loginUser(account, password);
        
        return loginResult;
        
    } catch (error) {
        console.error('註冊錯誤：', error);
        return {
            success: false,
            data: null,
            error: error.message || '註冊時發生錯誤，請稍後再試'
        };
    }
}

/**
 * 用戶登入
 * @param {string} account - 會員帳號
 * @param {string} password - 帳號密碼
 * @returns {Promise<{success: boolean, data: object|null, error: string|null}>}
 */
export async function loginUser(account, password) {
    try {
        const client = getSupabase();
        
        // 從 users 資料表查詢用戶
        const { data: user, error: userError } = await client
            .from('users')
            .select('*')
            .eq('會員帳號', account)
            .maybeSingle();
        
        if (userError) {
            console.error('查詢用戶錯誤：', userError);
            return {
                success: false,
                data: null,
                error: '查詢用戶時發生錯誤，請稍後再試'
            };
        }
        
        if (!user) {
            return {
                success: false,
                data: null,
                error: '帳號或密碼錯誤'
            };
        }
        
        // 驗證密碼（簡化版本，直接比對）
        if (user.帳號密碼 !== password) {
            return {
                success: false,
                data: null,
                error: '帳號或密碼錯誤'
            };
        }
        
        // 儲存用戶資訊到 session storage
        const sessionData = {
            user: {
                會員帳號: user.會員帳號,
                會員姓名: user.會員姓名,
                用戶角色: user.用戶角色
            },
            timestamp: Date.now()
        };
        sessionStorage.setItem('auth_session', JSON.stringify(sessionData));
        
        return {
            success: true,
            data: user,
            error: null
        };
        
    } catch (error) {
        console.error('登入錯誤：', error);
        return {
            success: false,
            data: null,
            error: error.message || '登入時發生錯誤，請稍後再試'
        };
    }
}

/**
 * 用戶登出
 */
export async function logoutUser() {
    try {
        // 清除 session storage
        sessionStorage.removeItem('auth_session');
        
        return {
            success: true,
            error: null
        };
    } catch (error) {
        console.error('登出錯誤：', error);
        // 即使出錯也清除本地 session
        sessionStorage.removeItem('auth_session');
        return {
            success: true,
            error: null
        };
    }
}

/**
 * 檢查用戶是否已登入
 * @returns {Promise<{isLoggedIn: boolean, user: object|null}>}
 */
export async function checkAuth() {
    try {
        // 檢查 session storage
        const sessionData = sessionStorage.getItem('auth_session');
        if (sessionData) {
            const session = JSON.parse(sessionData);
            // 檢查 session 是否過期（24小時）
            const now = Date.now();
            const expireTime = 24 * 60 * 60 * 1000; // 24小時
            if (now - session.timestamp < expireTime) {
                return {
                    isLoggedIn: true,
                    user: session.user
                };
            } else {
                // Session 過期，清除
                sessionStorage.removeItem('auth_session');
            }
        }
        
        return {
            isLoggedIn: false,
            user: null
        };
    } catch (error) {
        console.error('檢查認證錯誤：', error);
        return {
            isLoggedIn: false,
            user: null
        };
    }
}

/**
 * 取得目前登入的用戶資訊
 * @returns {object|null}
 */
export function getCurrentUser() {
    try {
        const sessionData = sessionStorage.getItem('auth_session');
        if (sessionData) {
            const session = JSON.parse(sessionData);
            return session.user;
        }
        return null;
    } catch (error) {
        console.error('取得用戶資訊錯誤：', error);
        return null;
    }
}

/**
 * 檢查用戶是否為管理員
 * @returns {boolean}
 */
export function isAdmin() {
    const user = getCurrentUser();
    return user && user.用戶角色 === 'admin';
}
