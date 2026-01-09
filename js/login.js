/**
 * 登入頁面功能
 */

import { loginUser } from './auth.js';

// DOM 元素
const loginForm = document.getElementById('loginForm');
const accountInput = document.getElementById('account');
const passwordInput = document.getElementById('password');
const errorMessage = document.getElementById('errorMessage');

/**
 * 顯示錯誤訊息
 */
function showError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.add('show');
    setTimeout(() => {
        errorMessage.classList.remove('show');
    }, 5000);
}

/**
 * 處理登入表單提交
 */
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // 清除之前的錯誤訊息
    errorMessage.classList.remove('show');
    
    // 取得表單資料
    const account = accountInput.value.trim();
    const password = passwordInput.value;
    
    // 基本驗證
    if (!account) {
        showError('請輸入會員帳號');
        accountInput.focus();
        return;
    }
    
    if (!password) {
        showError('請輸入密碼');
        passwordInput.focus();
        return;
    }
    
    // 禁用按鈕，防止重複提交
    const submitButton = loginForm.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    submitButton.textContent = '登入中...';
    
    try {
        // 執行登入
        const result = await loginUser(account, password);
        
        if (result.success) {
            // 登入成功，跳轉至首頁
            window.location.href = 'home.html';
        } else {
            // 登入失敗，顯示錯誤訊息
            showError(result.error || '登入失敗，請檢查帳號密碼');
            passwordInput.value = '';
            passwordInput.focus();
        }
    } catch (error) {
        console.error('登入錯誤：', error);
        showError('登入時發生錯誤，請稍後再試');
    } finally {
        // 恢復按鈕狀態
        submitButton.disabled = false;
        submitButton.textContent = '登入';
    }
});

// 頁面載入時自動聚焦到帳號輸入欄位
window.addEventListener('DOMContentLoaded', () => {
    accountInput.focus();
});
