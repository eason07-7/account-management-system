/**
 * 註冊頁面功能
 */

import { registerUser } from './auth.js';

// DOM 元素
const registerForm = document.getElementById('registerForm');
const accountInput = document.getElementById('account');
const nameInput = document.getElementById('name');
const passwordInput = document.getElementById('password');
const confirmPasswordInput = document.getElementById('confirmPassword');
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
 * 驗證表單資料
 */
function validateForm() {
    const account = accountInput.value.trim();
    const name = nameInput.value.trim();
    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;
    
    // 清除之前的錯誤訊息
    errorMessage.classList.remove('show');
    
    // 驗證帳號
    if (!account) {
        showError('請輸入會員帳號');
        accountInput.focus();
        return false;
    }
    
    if (account.length < 3) {
        showError('會員帳號至少需要 3 個字元');
        accountInput.focus();
        return false;
    }
    
    // 驗證姓名
    if (!name) {
        showError('請輸入會員姓名');
        nameInput.focus();
        return false;
    }
    
    // 驗證密碼
    if (!password) {
        showError('請輸入帳號密碼');
        passwordInput.focus();
        return false;
    }
    
    if (password.length < 4) {
        showError('密碼至少需要 4 個字元');
        passwordInput.focus();
        return false;
    }
    
    // 驗證確認密碼
    if (password !== confirmPassword) {
        showError('兩次輸入的密碼不一致');
        confirmPasswordInput.focus();
        return false;
    }
    
    return true;
}

/**
 * 處理註冊表單提交
 */
registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // 驗證表單
    if (!validateForm()) {
        return;
    }
    
    // 取得表單資料
    const account = accountInput.value.trim();
    const name = nameInput.value.trim();
    const password = passwordInput.value;
    
    // 禁用按鈕，防止重複提交
    const submitButton = registerForm.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    submitButton.textContent = '註冊中...';
    
    try {
        // 執行註冊
        const result = await registerUser(account, name, password);
        
        if (result.success) {
            // 註冊成功，顯示成功訊息並跳轉
            showSuccess('註冊成功！正在跳轉...');
            
            // 等待 1 秒後跳轉至首頁
            setTimeout(() => {
                window.location.href = 'home.html';
            }, 1000);
        } else {
            // 註冊失敗，顯示錯誤訊息
            showError(result.error || '註冊失敗，請稍後再試');
            passwordInput.value = '';
            confirmPasswordInput.value = '';
        }
    } catch (error) {
        console.error('註冊錯誤：', error);
        showError('註冊時發生錯誤，請稍後再試');
    } finally {
        // 恢復按鈕狀態
        submitButton.disabled = false;
        submitButton.textContent = '註冊';
    }
});

// 即時驗證密碼匹配
confirmPasswordInput.addEventListener('input', () => {
    if (confirmPasswordInput.value && passwordInput.value) {
        if (confirmPasswordInput.value !== passwordInput.value) {
            confirmPasswordInput.setCustomValidity('密碼不一致');
        } else {
            confirmPasswordInput.setCustomValidity('');
        }
    }
});

// 頁面載入時自動聚焦到帳號輸入欄位
window.addEventListener('DOMContentLoaded', () => {
    accountInput.focus();
});
