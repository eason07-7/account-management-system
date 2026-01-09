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

let currentEditingId = null;

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
}

/**
 * 載入帳戶列表
 */
async function loadAccounts() {
    try {
        loadingMessage.style.display = 'block';
        errorMessage.classList.remove('show');
        accountsTable.innerHTML = '';
        
        const client = getSupabase();
        const { data, error } = await client
            .from('users')
            .select('*')
            .order('建立時間', { ascending: false });
        
        if (error) {
            throw error;
        }
        
        if (data && data.length > 0) {
            renderAccountsTable(data);
        } else {
            accountsTable.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📭</div>
                    <div class="empty-state-text">目前沒有任何帳戶資料</div>
                </div>
            `;
        }
        
        loadingMessage.style.display = 'none';
    } catch (error) {
        console.error('載入帳戶列表錯誤：', error);
        errorMessage.textContent = '載入帳戶列表失敗：' + (error.message || '未知錯誤');
        errorMessage.classList.add('show');
        loadingMessage.style.display = 'none';
    }
}

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
        await loadAccounts();
        
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
        await loadAccounts();
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
