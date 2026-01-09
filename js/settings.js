/**
 * 個人設定頁面功能
 */

import { checkAuth, logoutUser, getCurrentUser, getSupabase } from './auth.js';

// DOM 元素
const currentUsername = document.getElementById('currentUsername');
const logoutBtn = document.getElementById('logoutBtn');
const settingsForm = document.getElementById('settingsForm');
const accountInput = document.getElementById('account');
const nameInput = document.getElementById('name');
const passwordInput = document.getElementById('password');
const phoneInput = document.getElementById('phone');
const addressInput = document.getElementById('address');
const loadingMessage = document.getElementById('loadingMessage');
const errorMessage = document.getElementById('errorMessage');
const successMessage = document.getElementById('successMessage');

/**
 * 顯示錯誤訊息
 */
function showError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.add('show');
    successMessage.classList.remove('show');
}

/**
 * 顯示成功訊息
 */
function showSuccess(message) {
    successMessage.textContent = message;
    successMessage.classList.add('show');
    errorMessage.classList.remove('show');
}

/**
 * 初始化頁面
 */
async function init() {
    // 檢查登入狀態
    const authResult = await checkAuth();
    
    if (!authResult.isLoggedIn) {
        window.location.href = 'index.html';
        return;
    }
    
    // 顯示用戶資訊
    const user = getCurrentUser();
    if (user) {
        currentUsername.textContent = `目前用戶：${user.會員帳號}`;
    }
    
    // 載入用戶資料
    await loadUserData();
    
    // 設定事件監聽器
    setupEventListeners();
}

/**
 * 設定事件監聽器
 */
function setupEventListeners() {
    // 登出按鈕
    logoutBtn.addEventListener('click', async () => {
        await logoutUser();
        window.location.href = 'index.html';
    });
    
    // 表單提交
    settingsForm.addEventListener('submit', handleFormSubmit);
}

/**
 * 載入用戶資料
 */
async function loadUserData() {
    try {
        loadingMessage.style.display = 'block';
        errorMessage.classList.remove('show');
        
        const user = getCurrentUser();
        if (!user) {
            throw new Error('無法取得用戶資訊');
        }
        
        const client = getSupabase();
        const { data, error } = await client
            .from('users')
            .select('*')
            .eq('會員帳號', user.會員帳號)
            .single();
        
        if (error) throw error;
        
        // 填入表單資料
        accountInput.value = data.會員帳號 || '';
        nameInput.value = data.會員姓名 || '';
        passwordInput.value = '••••••••'; // 顯示假密碼
        phoneInput.value = data.會員連絡電話 || '';
        addressInput.value = data.會員地址 || '';
        
        loadingMessage.style.display = 'none';
    } catch (error) {
        console.error('載入用戶資料錯誤：', error);
        showError('載入用戶資料失敗：' + (error.message || '未知錯誤'));
        loadingMessage.style.display = 'none';
    }
}

/**
 * 處理表單提交
 */
async function handleFormSubmit(e) {
    e.preventDefault();
    
    const user = getCurrentUser();
    if (!user) {
        showError('無法取得用戶資訊');
        return;
    }
    
    const phone = phoneInput.value.trim();
    const address = addressInput.value.trim();
    
    // 禁用按鈕
    const submitButton = settingsForm.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    submitButton.textContent = '儲存中...';
    
    try {
        const client = getSupabase();
        const { error } = await client
            .from('users')
            .update({
                會員連絡電話: phone || null,
                會員地址: address || null,
                更新時間: new Date().toISOString()
            })
            .eq('會員帳號', user.會員帳號);
        
        if (error) throw error;
        
        showSuccess('設定已成功儲存！');
        
        // 2秒後可以再次提交
        setTimeout(() => {
            submitButton.disabled = false;
            submitButton.textContent = '儲存設定';
        }, 2000);
        
    } catch (error) {
        console.error('儲存設定錯誤：', error);
        showError('儲存失敗：' + (error.message || '未知錯誤'));
        submitButton.disabled = false;
        submitButton.textContent = '儲存設定';
    }
}

// 頁面載入時初始化
init();
