/**
 * Excel 資料匯入功能
 */

import { checkAuth, logoutUser, getCurrentUser, isAdmin, getSupabase } from './auth.js';

// DOM 元素
const currentUsername = document.getElementById('currentUsername');
const logoutBtn = document.getElementById('logoutBtn');
const fileInput = document.getElementById('fileInput');
const fileUploadArea = document.getElementById('fileUploadArea');
const previewSection = document.getElementById('previewSection');
const previewTable = document.getElementById('previewTable');
const rowCount = document.getElementById('rowCount');
const importBtn = document.getElementById('importBtn');
const cancelBtn = document.getElementById('cancelBtn');
const importProgress = document.getElementById('importProgress');
const lottieContainer = document.getElementById('lottieContainer');
const progressText = document.getElementById('progressText');
const importResults = document.getElementById('importResults');
const loadingMessage = document.getElementById('loadingMessage');
const errorMessage = document.getElementById('errorMessage');
const successMessage = document.getElementById('successMessage');

let excelData = [];
let lottieAnimation = null;

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
    
    // 檢查是否為管理員（只有管理員可以匯入資料）
    if (!isAdmin()) {
        alert('只有管理員可以匯入資料');
        window.location.href = 'home.html';
        return;
    }
    
    // 顯示用戶資訊
    const user = getCurrentUser();
    if (user) {
        currentUsername.textContent = `目前用戶：${user.會員帳號}`;
    }
    
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
    
    // 檔案選擇
    fileInput.addEventListener('change', handleFileSelect);
    
    // 拖放功能
    fileUploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        fileUploadArea.classList.add('dragover');
    });
    
    fileUploadArea.addEventListener('dragleave', () => {
        fileUploadArea.classList.remove('dragover');
    });
    
    fileUploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        fileUploadArea.classList.remove('dragover');
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFile(files[0]);
        }
    });
    
    // 匯入按鈕
    importBtn.addEventListener('click', handleImport);
    
    // 取消按鈕
    cancelBtn.addEventListener('click', () => {
        resetForm();
    });
}

/**
 * 處理檔案選擇
 */
function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) {
        handleFile(file);
    }
}

/**
 * 處理檔案
 */
function handleFile(file) {
    if (!file.name.match(/\.(xlsx|xls)$/)) {
        showError('請選擇 Excel 檔案（.xlsx 或 .xls）');
        return;
    }
    
    loadingMessage.style.display = 'block';
    errorMessage.classList.remove('show');
    
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            
            // 讀取第一個工作表
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(firstSheet, { defval: '' });
            
            if (jsonData.length === 0) {
                showError('Excel 檔案中沒有資料');
                loadingMessage.style.display = 'none';
                return;
            }
            
            // 處理資料
            excelData = processExcelData(jsonData);
            
            if (excelData.length === 0) {
                showError('無法解析 Excel 資料，請檢查檔案格式');
                loadingMessage.style.display = 'none';
                return;
            }
            
            // 顯示預覽
            displayPreview(excelData);
            loadingMessage.style.display = 'none';
            
        } catch (error) {
            console.error('讀取 Excel 錯誤：', error);
            showError('讀取 Excel 檔案失敗：' + error.message);
            loadingMessage.style.display = 'none';
        }
    };
    
    reader.readAsArrayBuffer(file);
}

/**
 * 處理 Excel 資料
 */
function processExcelData(jsonData) {
    const processedData = [];
    
    jsonData.forEach((row, index) => {
        // 嘗試不同的欄位名稱（支援繁體中文和簡體中文）
        const account = row['會員帳號'] || row['会员账号'] || row['帳號'] || row['账号'] || '';
        const name = row['會員姓名'] || row['会员姓名'] || row['姓名'] || row['名称'] || '';
        const password = row['帳號密碼'] || row['账号密码'] || row['密碼'] || row['密码'] || '';
        const phone = row['會員連絡電話'] || row['会员连络电话'] || row['連絡電話'] || row['连络电话'] || row['電話'] || row['电话'] || '';
        const address = row['會員地址'] || row['会员地址'] || row['地址'] || '';
        
        // 驗證必填欄位
        if (!account || !name || !password) {
            console.warn(`第 ${index + 2} 行資料不完整，已跳過`);
            return;
        }
        
        // 驗證密碼長度
        if (password.length < 4) {
            console.warn(`第 ${index + 2} 行密碼太短，已跳過`);
            return;
        }
        
        processedData.push({
            會員帳號: account.toString().trim(),
            會員姓名: name.toString().trim(),
            帳號密碼: password.toString().trim(),
            會員連絡電話: phone ? phone.toString().trim() : null,
            會員地址: address ? address.toString().trim() : null,
            用戶角色: 'user'
        });
    });
    
    return processedData;
}

/**
 * 顯示預覽
 */
function displayPreview(data) {
    rowCount.textContent = data.length;
    
    // 建立表頭
    const thead = previewTable.querySelector('thead');
    thead.innerHTML = `
        <tr>
            <th>會員帳號</th>
            <th>會員姓名</th>
            <th>會員連絡電話</th>
            <th>會員地址</th>
        </tr>
    `;
    
    // 建立表格內容
    const tbody = previewTable.querySelector('tbody');
    tbody.innerHTML = data.map(row => `
        <tr>
            <td>${escapeHtml(row.會員帳號)}</td>
            <td>${escapeHtml(row.會員姓名)}</td>
            <td>${escapeHtml(row.會員連絡電話 || '')}</td>
            <td>${escapeHtml(row.會員地址 || '')}</td>
        </tr>
    `).join('');
    
    previewSection.style.display = 'block';
    fileUploadArea.style.display = 'none';
}

/**
 * 初始化 Lottie 動畫
 */
function initLottieAnimation() {
    if (lottieAnimation) {
        lottieAnimation.destroy();
    }
    
    lottieAnimation = lottie.loadAnimation({
        container: lottieContainer,
        renderer: 'svg',
        loop: true,
        autoplay: true,
        path: 'assets/progress-bar.json'
    });
}

/**
 * 更新 Lottie 動畫進度
 */
function updateLottieProgress(progress) {
    if (lottieAnimation) {
        // 根據進度計算動畫的播放位置（0-100% 對應動畫的 0-100 幀）
        const totalFrames = lottieAnimation.totalFrames;
        const currentFrame = Math.floor((progress / 100) * totalFrames);
        lottieAnimation.goToAndStop(currentFrame, true);
    }
}

/**
 * 處理匯入
 */
async function handleImport() {
    if (excelData.length === 0) {
        showError('沒有可匯入的資料');
        return;
    }
    
    importBtn.disabled = true;
    previewSection.style.display = 'none';
    importProgress.style.display = 'block';
    
    // 初始化 Lottie 動畫
    initLottieAnimation();
    
    const client = getSupabase();
    let successCount = 0;
    let errorCount = 0;
    let skippedCount = 0;
    
    importResults.innerHTML = '';
    
    for (let i = 0; i < excelData.length; i++) {
        const data = excelData[i];
        
        // 更新進度
        const progress = ((i + 1) / excelData.length) * 100;
        updateLottieProgress(progress);
        progressText.textContent = `正在匯入第 ${i + 1} / ${excelData.length} 筆資料...`;
        
        try {
            // 檢查帳號是否已存在
            const { data: existingUser } = await client
                .from('users')
                .select('會員帳號')
                .eq('會員帳號', data.會員帳號)
                .maybeSingle();
            
            if (existingUser) {
                skippedCount++;
                addResultItem('skipped', `帳號「${data.會員帳號}」已存在，已跳過`);
                continue;
            }
            
            // 插入資料
            const { error } = await client
                .from('users')
                .insert(data);
            
            if (error) {
                throw error;
            }
            
            successCount++;
            addResultItem('success', `成功匯入：${data.會員帳號} - ${data.會員姓名}`);
            
        } catch (error) {
            console.error('匯入錯誤：', error);
            errorCount++;
            addResultItem('error', `匯入失敗：${data.會員帳號} - ${error.message}`);
        }
    }
    
    // 完成 - 讓動畫播放到最後
    updateLottieProgress(100);
    progressText.textContent = `匯入完成！成功：${successCount}，失敗：${errorCount}，跳過：${skippedCount}`;
    importBtn.disabled = false;
    
    // 3秒後可以重新匯入
    setTimeout(() => {
        if (confirm('匯入完成！是否要重新匯入其他檔案？')) {
            resetForm();
        } else {
            window.location.href = 'home.html';
        }
    }, 3000);
}

/**
 * 新增結果項目
 */
function addResultItem(type, message) {
    const item = document.createElement('div');
    item.className = `result-item ${type}`;
    item.textContent = message;
    importResults.appendChild(item);
    importResults.scrollTop = importResults.scrollHeight;
}

/**
 * 重置表單
 */
function resetForm() {
    fileInput.value = '';
    excelData = [];
    previewSection.style.display = 'none';
    importProgress.style.display = 'none';
    fileUploadArea.style.display = 'block';
    importResults.innerHTML = '';
    if (lottieAnimation) {
        lottieAnimation.destroy();
        lottieAnimation = null;
    }
    errorMessage.classList.remove('show');
    successMessage.classList.remove('show');
}

/**
 * 顯示錯誤訊息
 */
function showError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.add('show');
    successMessage.classList.remove('show');
}

/**
 * HTML 轉義
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 頁面載入時初始化
init();
