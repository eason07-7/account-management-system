/**
 * 首頁功能
 * 顯示帳戶列表、管理員功能等
 */

import { checkAuth, logoutUser, getCurrentUser, isAdmin, getSupabase } from './auth.js';

// DOM 元素
const currentUsername = document.getElementById('currentUsername');
const logoutBtn = document.getElementById('logoutBtn');
const accountsTable = document.getElementById('accountsTable');
const loadingMessage = document.getElementById('loadingMessage');
const errorMessage = document.getElementById('errorMessage');
const adminControls = document.getElementById('adminControls');
const addUserBtn = document.getElementById('addUserBtn');
const userModal = document.getElementById('userModal');
const userForm = document.getElementById('userForm');
const modalTitle = document.getElementById('modalTitle');
const cancelBtn = document.getElementById('cancelBtn');
const closeModal = document.querySelector('.close');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const clearSearchBtn = document.getElementById('clearSearchBtn');
const searchAnimation = document.getElementById('searchAnimation');
const lottieSearchContainer = document.getElementById('lottieSearchContainer');
const pagination = document.getElementById('pagination');

let currentEditingId = null;
let allAccounts = []; // 儲存所有帳戶資料
let filteredAccounts = []; // 儲存篩選後的帳戶資料
let currentPage = 1; // 目前頁碼
const itemsPerPage = 10; // 每頁顯示10筆
let searchQuery = ''; // 搜尋關鍵字
let lottieSearchAnimation = null; // Lottie 動畫實例

/**
 * 初始化頁面
 */
async function init() {
    // 檢查登入狀態
    const authResult = await checkAuth();
    
    if (!authResult.isLoggedIn) {
        // 未登入，跳轉至登入頁
        window.location.href = 'index.html';
        return;
    }
    
    // 顯示用戶資訊
    const user = getCurrentUser();
    if (user) {
        currentUsername.textContent = `目前用戶：${user.會員帳號}`;
        
        // 檢查是否為管理員
        if (isAdmin()) {
            adminControls.style.display = 'block';
        }
    }
    
    // 載入帳戶列表
    await loadAccounts();
    
    // 設定事件監聽器
    setupEventListeners();
    
    // 初始化 Lottie 動畫
    initLottieSearchAnimation();
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
    
    // 新增帳戶按鈕
    addUserBtn.addEventListener('click', () => {
        openModal('add');
    });
    
    // 關閉彈窗
    closeModal.addEventListener('click', closeModalHandler);
    cancelBtn.addEventListener('click', closeModalHandler);
    
    // 點擊彈窗外部關閉
    userModal.addEventListener('click', (e) => {
        if (e.target === userModal) {
            closeModalHandler();
        }
    });
    
    // 表單提交
    userForm.addEventListener('submit', handleFormSubmit);
    
    // 搜尋功能
    searchBtn.addEventListener('click', handleSearch);
    clearSearchBtn.addEventListener('click', handleClearSearch);
    
    // 按 Enter 鍵搜尋
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    });
}

/**
 * 初始化 Lottie 搜尋動畫
 */
function initLottieSearchAnimation() {
    if (typeof lottie !== 'undefined') {
        lottieSearchAnimation = lottie.loadAnimation({
            container: lottieSearchContainer,
            renderer: 'svg',
            loop: true,
            autoplay: false,
            path: 'https://lottie.host/d8276ed5-cb0f-4f20-b6a1-ff3b52ea2d13/ALYjHAeDw4.lottie'
        });
    }
}

/**
 * 顯示搜尋動畫
 */
function showSearchAnimation() {
    if (lottieSearchAnimation) {
        searchAnimation.style.display = 'flex';
        lottieSearchAnimation.play();
    }
}

/**
 * 隱藏搜尋動畫
 */
function hideSearchAnimation() {
    if (lottieSearchAnimation) {
        lottieSearchAnimation.stop();
        searchAnimation.style.display = 'none';
    }
}

/**
 * 載入帳戶列表
 */
async function loadAccounts(searchTerm = '') {
    try {
        loadingMessage.style.display = 'block';
        errorMessage.classList.remove('show');
        accountsTable.innerHTML = '';
        pagination.innerHTML = '';
        
        const client = getSupabase();
        
        // 先取得所有資料
        const { data, error } = await client
            .from('users')
            .select('*')
            .order('建立時間', { ascending: false });
        
        if (error) {
            throw error;
        }
        
        // 儲存所有資料
        allAccounts = data || [];
        
        // 如果有搜尋關鍵字，進行前端篩選
        if (searchTerm) {
            const searchLower = searchTerm.toLowerCase();
            filteredAccounts = allAccounts.filter(account => {
                const accountLower = (account.會員帳號 || '').toLowerCase();
                const nameLower = (account.會員姓名 || '').toLowerCase();
                return accountLower.includes(searchLower) || nameLower.includes(searchLower);
            });
        } else {
            filteredAccounts = allAccounts;
        }
        
        // 重置到第一頁
        currentPage = 1;
        
        // 渲染表格和分頁
        renderTableWithPagination();
        
        loadingMessage.style.display = 'none';
    } catch (error) {
        console.error('載入帳戶列表錯誤：', error);
        errorMessage.textContent = '載入帳戶列表失敗：' + (error.message || '未知錯誤');
        errorMessage.classList.add('show');
        loadingMessage.style.display = 'none';
    }
}

/**
 * 處理搜尋
 */
async function handleSearch() {
    const searchTerm = searchInput.value.trim();
    searchQuery = searchTerm;
    
    if (!searchTerm) {
        return;
    }
    
    // 顯示搜尋動畫
    showSearchAnimation();
    
    // 記錄開始時間
    const searchStartTime = Date.now();
    
    // 執行搜尋
    await loadAccounts(searchTerm);
    
    // 計算搜尋耗時
    const searchDuration = Date.now() - searchStartTime;
    
    // 確保動畫至少顯示3秒（從開始搜尋到結束後3秒）
    const minDisplayTime = 3000;
    const remainingTime = Math.max(0, minDisplayTime - searchDuration);
    
    // 等待剩餘時間後隱藏動畫
    setTimeout(() => {
        hideSearchAnimation();
    }, remainingTime);
    
    // 顯示清除按鈕
    clearSearchBtn.style.display = 'inline-block';
}

/**
 * 清除搜尋
 */
async function handleClearSearch() {
    searchInput.value = '';
    searchQuery = '';
    clearSearchBtn.style.display = 'none';
    currentPage = 1;
    await loadAccounts('');
}

/**
 * 渲染表格和分頁
 */
function renderTableWithPagination() {
    const totalItems = filteredAccounts.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    
    // 計算目前頁的資料範圍
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentPageData = filteredAccounts.slice(startIndex, endIndex);
    
    // 渲染表格
    if (currentPageData.length > 0) {
        renderAccountsTable(currentPageData);
    } else {
        accountsTable.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📭</div>
                <div class="empty-state-text">${searchQuery ? '找不到符合搜尋條件的帳戶' : '目前沒有任何帳戶資料'}</div>
            </div>
        `;
    }
    
    // 渲染分頁
    renderPagination(totalPages, totalItems);
}

/**
 * 渲染分頁控制
 */
function renderPagination(totalPages, totalItems) {
    if (totalPages <= 1) {
        pagination.innerHTML = '';
        return;
    }
    
    let paginationHTML = '';
    
    // 上一頁按鈕
    paginationHTML += `
        <button class="btn" onclick="goToPage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>
            上一頁
        </button>
    `;
    
    // 頁碼按鈕
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage < maxVisiblePages - 1) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    if (startPage > 1) {
        paginationHTML += `<button class="btn" onclick="goToPage(1)">1</button>`;
        if (startPage > 2) {
            paginationHTML += `<span class="page-info">...</span>`;
        }
    }
    
    for (let i = startPage; i <= endPage; i++) {
        paginationHTML += `
            <button class="btn ${i === currentPage ? 'active' : ''}" onclick="goToPage(${i})">
                ${i}
            </button>
        `;
    }
    
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            paginationHTML += `<span class="page-info">...</span>`;
        }
        paginationHTML += `<button class="btn" onclick="goToPage(${totalPages})">${totalPages}</button>`;
    }
    
    // 下一頁按鈕
    paginationHTML += `
        <button class="btn" onclick="goToPage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>
            下一頁
        </button>
    `;
    
    // 顯示頁數資訊
    const startIndex = (currentPage - 1) * itemsPerPage;
    const startItem = totalItems === 0 ? 0 : startIndex + 1;
    const endItem = Math.min(startIndex + itemsPerPage, totalItems);
    paginationHTML += `
        <span class="page-info">第 ${startItem}-${endItem} 筆，共 ${totalItems} 筆</span>
    `;
    
    pagination.innerHTML = paginationHTML;
}

/**
 * 跳轉到指定頁碼（全域函數）
 */
window.goToPage = function(page) {
    const totalPages = Math.ceil(filteredAccounts.length / itemsPerPage);
    if (page >= 1 && page <= totalPages) {
        currentPage = page;
        renderTableWithPagination();
        // 滾動到頂部
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
};

/**
 * 渲染帳戶表格
 */
function renderAccountsTable(accounts) {
    const isAdminUser = isAdmin();
    
    // 建立表格
    let tableHTML = `
        <table class="accounts-table">
            <thead>
                <tr>
                    <th>會員帳號</th>
                    <th>會員姓名</th>
                    ${isAdminUser ? '<th>帳號密碼</th><th>會員連絡電話</th><th>會員地址</th>' : ''}
                    <th>用戶角色</th>
                    ${isAdminUser ? '<th>建立時間</th>' : ''}
                    <th>建立時間</th>
                    ${isAdminUser ? '<th>操作</th>' : ''}
                </tr>
            </thead>
            <tbody>
    `;
    
    accounts.forEach(account => {
        const createTime = new Date(account.建立時間).toLocaleString('zh-TW');
        const roleText = account.用戶角色 === 'admin' ? '管理員' : '一般用戶';
        const phone = account.會員連絡電話 || '';
        const address = account.會員地址 || '';
        
        tableHTML += `
            <tr>
                <td>${escapeHtml(account.會員帳號)}</td>
                <td>${escapeHtml(account.會員姓名)}</td>
                ${isAdminUser ? `
                    <td>••••••••</td>
                    <td>${escapeHtml(phone)}</td>
                    <td>${escapeHtml(address)}</td>
                ` : ''}
                <td>${roleText}</td>
                ${isAdminUser ? `<td>${createTime}</td>` : ''}
                <td>${createTime}</td>
                ${isAdminUser ? `
                    <td>
                        <div class="action-buttons">
                            <button class="btn btn-secondary" onclick="editAccount('${account.id}')">編輯</button>
                            <button class="btn btn-danger" onclick="deleteAccount('${account.id}', '${escapeHtml(account.會員帳號)}')">刪除</button>
                        </div>
                    </td>
                ` : ''}
            </tr>
        `;
    });
    
    tableHTML += `
            </tbody>
        </table>
    `;
    
    accountsTable.innerHTML = tableHTML;
}

/**
 * 開啟新增/編輯彈窗
 */
function openModal(mode, accountId = null) {
    currentEditingId = accountId;
    
    if (mode === 'add') {
        modalTitle.textContent = '新增帳戶';
        userForm.reset();
        document.getElementById('userId').value = '';
        document.getElementById('modalPassword').required = true;
        document.getElementById('passwordHint').textContent = '';
        document.getElementById('modalRole').value = 'user';
    } else {
        modalTitle.textContent = '編輯帳戶';
        // 載入帳戶資料
        loadAccountData(accountId);
        // 編輯模式下，密碼為選填（留空則不修改）
        document.getElementById('modalPassword').required = false;
        document.getElementById('passwordHint').textContent = '編輯時留空則不修改密碼';
    }
    
    userModal.classList.add('show');
    document.getElementById('modalAccount').focus();
}

/**
 * 載入帳戶資料到表單
 */
async function loadAccountData(accountId) {
    try {
        const client = getSupabase();
        const { data, error } = await client
            .from('users')
            .select('*')
            .eq('id', accountId)
            .single();
        
        if (error) throw error;
        
        document.getElementById('userId').value = data.id;
        document.getElementById('modalAccount').value = data.會員帳號 || '';
        document.getElementById('modalName').value = data.會員姓名 || '';
        document.getElementById('modalPassword').value = ''; // 編輯時清空，留空則不修改
        document.getElementById('modalPhone').value = data.會員連絡電話 || '';
        document.getElementById('modalAddress').value = data.會員地址 || '';
        document.getElementById('modalRole').value = data.用戶角色 || 'user';
    } catch (error) {
        console.error('載入帳戶資料錯誤：', error);
        showModalError('載入帳戶資料失敗');
    }
}

/**
 * 關閉彈窗
 */
function closeModalHandler() {
    userModal.classList.remove('show');
    userForm.reset();
    currentEditingId = null;
    document.getElementById('modalErrorMessage').classList.remove('show');
}

/**
 * 處理表單提交
 */
async function handleFormSubmit(e) {
    e.preventDefault();
    
    const userId = document.getElementById('userId').value;
    const account = document.getElementById('modalAccount').value.trim();
    const name = document.getElementById('modalName').value.trim();
    const password = document.getElementById('modalPassword').value;
    const phone = document.getElementById('modalPhone').value.trim();
    const address = document.getElementById('modalAddress').value.trim();
    const role = document.getElementById('modalRole').value;
    
    // 驗證
    if (!account || !name) {
        showModalError('請填寫所有必填欄位');
        return;
    }
    
    try {
        const client = getSupabase();
        let result;
        
        if (userId) {
            // 編輯模式（管理員可以修改所有欄位）
            const updateData = {
                會員帳號: account,
                會員姓名: name,
                會員連絡電話: phone || null,
                會員地址: address || null,
                用戶角色: role,
                更新時間: new Date().toISOString()
            };
            
            // 如果密碼有輸入，則更新密碼
            if (password && password.length >= 4) {
                updateData.帳號密碼 = password;
            }
            
            // 檢查帳號是否與其他用戶重複（排除自己）
            const { data: existingUser } = await client
                .from('users')
                .select('id, 會員帳號')
                .eq('會員帳號', account)
                .neq('id', userId)
                .maybeSingle();
            
            if (existingUser) {
                showModalError('此會員帳號已被其他用戶使用');
                return;
            }
            
            result = await client
                .from('users')
                .update(updateData)
                .eq('id', userId)
                .select()
                .single();
        } else {
            // 新增模式
            if (!password || password.length < 4) {
                showModalError('新增帳戶時必須設定密碼（至少4個字元）');
                return;
            }
            
            // 檢查帳號是否已存在
            const { data: existingUser } = await client
                .from('users')
                .select('會員帳號')
                .eq('會員帳號', account)
                .maybeSingle();
            
            if (existingUser) {
                showModalError('此會員帳號已被使用');
                return;
            }
            
            result = await client
                .from('users')
                .insert({
                    會員帳號: account,
                    會員姓名: name,
                    帳號密碼: password,
                    會員連絡電話: phone || null,
                    會員地址: address || null,
                    用戶角色: role
                })
                .select()
                .single();
        }
        
        if (result.error) {
            throw result.error;
        }
        
        // 成功，關閉彈窗並重新載入列表
        closeModalHandler();
        await loadAccounts(searchQuery);
        
    } catch (error) {
        console.error('儲存帳戶錯誤：', error);
        showModalError(error.message || '儲存失敗，請稍後再試');
    }
}

/**
 * 編輯帳戶（全域函數，供 HTML 呼叫）
 */
window.editAccount = function(accountId) {
    openModal('edit', accountId);
};

/**
 * 刪除帳戶（全域函數，供 HTML 呼叫）
 */
window.deleteAccount = async function(accountId, accountName) {
    if (!confirm(`確定要刪除帳戶「${accountName}」嗎？此操作無法復原。`)) {
        return;
    }
    
    try {
        const client = getSupabase();
        const { error } = await client
            .from('users')
            .delete()
            .eq('id', accountId);
        
        if (error) throw error;
        
        // 重新載入列表
        await loadAccounts(searchQuery);
    } catch (error) {
        console.error('刪除帳戶錯誤：', error);
        alert('刪除失敗：' + (error.message || '未知錯誤'));
    }
};

/**
 * 顯示彈窗錯誤訊息
 */
function showModalError(message) {
    const errorEl = document.getElementById('modalErrorMessage');
    errorEl.textContent = message;
    errorEl.classList.add('show');
    setTimeout(() => {
        errorEl.classList.remove('show');
    }, 5000);
}

/**
 * HTML 轉義（防止 XSS）
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 頁面載入時初始化
init();
