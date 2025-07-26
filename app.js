
// =================================================================
//                 app.js (穩定還原版)
// =================================================================
// 關閉自動 restore scroll，重新整理後就不會保持舊的位置
if ('scrollRestoration' in history) {
  history.scrollRestoration = 'manual';
}

import { initializeRecommendPage } from './recommend.js';
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import { getAuth, onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';

// --- 全域設定 ---
const firebaseConfig = { apiKey: "AIzaSyD9Bt0HwGGwlRT3_CWFBDhjGcnYf5lCuZU", authDomain: "goodaymember.firebaseapp.com", projectId: "goodaymember", storageBucket: "goodaymember.appspot.com", messagingSenderId: "730801053598", appId: "1:730801053598:web:a2ec0dc91c78fef6bfc08f", measurementId: "G-J3Z7YTHJ9P" };

export const APP_URLS = {
    main: "https://script.google.com/macros/s/AKfycbwFSVsZNUeuQXiJ9cU-KSBCg1ZZLVRs-urxiwdQVHt3n_9DJBBvWLZ1Mez0pExtM04Q/exec",
    // ✅ 請加上這一行
    recommend: "https://script.google.com/macros/s/AKfycbzdoezSaX2ujsE5ejjac3HbZWWHhDKQbX0nN1rVTIPSZm7opdCtslmwPAIq6zBNvcTp/exec"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// --- 全域變數 ---
let loginEmail = null;
window.currentUserEmail = null;
const navMenu = document.getElementById("navMenu");
const loginStatus = document.getElementById("loginStatus");
const mobileUserName = document.getElementById("mobileUserName");
const desktopUserName = document.getElementById("desktopUserName");
const dynamicContentArea = document.getElementById('dynamic-content-area');
const pages = document.querySelectorAll('.page-container');
const navbarCollapse = document.getElementById('navbarNav');
const bsCollapse = new bootstrap.Collapse(navbarCollapse, { toggle: false });

// 使用一個布林值來追蹤是否為首次載入，邏輯更清晰
let isInitialLoad = true; 

// --- 函數定義區 ---

const tabsBeforeLogin = [ { id: "souvenir", label: "紀念品" }, { id: "recommend", label: "推薦清單" }, { id: "notice", label: "注意事項" }, { id: "about", label: "關於我" }];
const tabsAfterLogin = [ { id: "souvenir", label: "紀念品" }, { id: "recommend", label: "推薦清單" }, { id: "notice", label: "注意事項" }, { id: "about", label: "關於我" }, { id: "announcement", label: "公告欄" }, { id: "delegation-manage-dropdown", label: "委託管理", isDropdown: true, children: [ { id: "delegable-list", label: "可委託代領清單" }, { id: "delegated-query", label: "已委託代領查詢" } ] }, { id: "souvenir-manage-dropdown", label: "紀念品管理", isDropdown: true, children: [ { id: "souvenir-inventory", label: "紀念品總庫存" }, { id: "souvenir-transaction-query", label: "紀念品進出查詢" }, { id: "souvenir-withdrawal-query", label: "領出申請查詢" }, { id: "souvenir-album", label: "專屬紀念品相冊" } ] }, { id: "account-management-dropdown", label: "帳戶管理", isDropdown: true, children: [ { id: "account-query", label: "帳務查詢" }, { id: "deposit-withdrawal", label: "儲值 / 提款" },{ id: "add-account-shares", label: "新增帳號／持股" } ] } ];

function renderNavTabs() {
    navMenu.innerHTML = "";
    const tabs = loginEmail ? tabsAfterLogin : tabsBeforeLogin;
    tabs.forEach(tab => {
        const li = document.createElement("li");
        li.className = "nav-item";
        if (tab.isDropdown) {
            li.className = "nav-item dropdown";
            li.innerHTML = `<a class="nav-link dropdown-toggle" href="#" id="${tab.id}Link" role="button" data-bs-toggle="dropdown" aria-expanded="false">${tab.label}</a><ul class="dropdown-menu" aria-labelledby="${tab.id}Link">${tab.children.map(child => `<li><a class="dropdown-item" href="#" data-section="${child.id}">${child.label}</a></li>`).join('')}</ul>`;
        } else {
            li.innerHTML = `<a class="nav-link" href="#" data-section="${tab.id}">${tab.label}</a>`;
        }
        navMenu.appendChild(li);
    });
}

// =================================================================
//                 會員名稱載入函數 (完整修正版)
// =================================================================
async function loadMemberName(email) {
    // 如果沒有 email，就清空名稱並退出
    if (!email) {
        document.getElementById("mobileUserName").innerText = "";
        document.getElementById("desktopUserName").innerText = "";
        return;
    }

    // 先顯示載入中...
    document.getElementById("mobileUserName").innerText = "載入中...";
    document.getElementById("desktopUserName").innerText = "載入中...";

    try {
        // 1. 建立 URL 參數物件
        const params = new URLSearchParams({
            view: 'getMemberInfo', // 使用 view 參數
            email: email
        });

        // 2. 組合出完整的請求網址
        const urlWithParams = `${APP_URLS.main}?${params.toString()}`;

        // 3. 發送 GET 請求
        const response = await fetch(urlWithParams);

        // 4. 檢查網路回應是否正常 (例如 404, 500 錯誤)
        if (!response.ok) {
            throw new Error(`網路回應錯誤: ${response.status}`);
        }

        // 5. 解析後端回傳的 JSON 資料
        const result = await response.json();

        // 6. 根據後端回報的 success 狀態來更新畫面
        if (result.success && result.data && result.data.name && result.data.name !== "未知會員") {
            const memberText = `會員：${result.data.name}`;
            document.getElementById("mobileUserName").innerText = memberText;
            document.getElementById("desktopUserName").innerText = memberText;
        } else {
            // 如果後端明確回報 success: false，也拋出錯誤
            throw new Error(result.message || "後端回報錯誤但未提供訊息");
        }

    } catch (error) {
        // 捕捉所有可能發生的錯誤 (網路錯誤、JSON 解析錯誤、後端錯誤等)
        console.error("取得會員資料失敗:", error);
        const errorText = "會員：載入失敗";
        document.getElementById("mobileUserName").innerText = errorText;
        document.getElementById("desktopUserName").innerText = errorText;
    }
}
function updateLoginStatusLink(isLoggedIn) {
    if (isLoggedIn) {
        loginStatus.innerHTML = `<a class="nav-link ms-3 me-3 text-red" href="#" data-section="logout">登出</a>`;
    } else {
        loginStatus.innerHTML = `<a class="nav-link ms-3 me-3 text-red" href="#" data-section="login">登入</a>`;
    }
}

async function loadExternalHtmlSection(sectionId) {
    if (!sectionId || sectionId === 'null') {
      dynamicContentArea.innerHTML = '';
      return;
    }
    dynamicContentArea.innerHTML = `<div class="d-flex justify-content-center align-items-center" style="height: 50vh;"><div class="spinner-border" role="status"></div></div>`;
    try {
        // ✅【修改 1】加上 cacheBuster 避免瀏覽器快取舊的 HTML 內容
        const response = await fetch(`${sectionId}.html?v=${new Date().getTime()}`);
        if (!response.ok) throw new Error(`載入 ${sectionId}.html 失敗`);
        
        dynamicContentArea.innerHTML = await response.text();
        
        // ✅【修改 2】核心步驟！
        // 在 HTML 內容成功載入後，我們手動檢查 sectionId，
        // 如果是 'delegable-list'，就呼叫它的專屬初始化函式。
        if (sectionId === 'delegable-list') {
            initializeDelegableListPage();
        }
        // 未來如果有其他頁面 (例如 add-account-shares) 需要初始化，也可以加在這裡
        // else if (sectionId === 'add-account-shares') {
        //     initializeAppSharesPage(); 
        // }
    } catch (error) {
        console.error('載入外部內容錯誤:', error);
        dynamicContentArea.innerHTML = `<h3 class="text-center text-danger">頁面載入失敗</h3>`;
    }
}

function navigateTo(id, fromHistory = false) {
    // 為了穩定，我們在函式內部重新獲取元素
    const recommendPage = document.getElementById('page-recommend');
    const dynamicContentArea = document.getElementById('dynamic-content-area');

    // 先隱藏所有區塊
    if (recommendPage) recommendPage.style.display = 'none';
    if (dynamicContentArea) dynamicContentArea.style.display = 'none';

    if (id === 'recommend') {
        // 如果點擊的是推薦清單，就顯示專用區塊
        if (recommendPage) {
            recommendPage.style.display = 'block';
            initializeRecommendPage(); // 並且呼叫它的初始化函數來填入資料
        }
    } else {
        // 其他頁面，才使用動態載入
        if (dynamicContentArea) {
            dynamicContentArea.style.display = 'block';
            loadExternalHtmlSection(id);
        }
    }
    
    // 更新網址列的邏輯保持不變
    if (!fromHistory && id && id !== "logout") {
        const url = new URL(window.location);
        url.searchParams.set('view', id);
        window.history.pushState({ section: id }, '', url);
    }
}

// --- 事件監聽與啟動邏輯 ---
document.body.addEventListener("click", function (e) {
    const clickedLink = e.target.closest("a[data-section]");
    if (clickedLink) {
        e.preventDefault();
        const id = clickedLink.dataset.section;
        if (id === "logout") {
            signOut(auth).catch((error) => console.error("登出失敗:", error));
        } else {
            navigateTo(id);
        }
        if (navbarCollapse.classList.contains('show')) {
            bsCollapse.hide();
        }
    }
});

window.addEventListener('popstate', function(event) {
    if (event.state && event.state.section) {
        navigateTo(event.state.section, true);
    } else {
        navigateTo('souvenir', true);
    }
});

// onAuthStateChanged 負責監聽登入狀態的變化，並更新 UI
onAuthStateChanged(auth, (user) => {
    const wasLoggedIn = !!loginEmail;
    loginEmail = user ? user.email : null;
    window.currentUserEmail = loginEmail;
    const isLoggedIn = !!user;

    // 只有在登入狀態真實改變時，才更新大部分 UI
    if (isLoggedIn !== wasLoggedIn) {
        renderNavTabs();
        updateLoginStatusLink(isLoggedIn);
        if (isLoggedIn) {
            loadMemberName(loginEmail);
        } else {
            // 登出時清空會員名稱並導向到預設頁面
            document.getElementById("mobileUserName").innerText = "";
            document.getElementById("desktopUserName").innerText = "";
            navigateTo("souvenir");
        }
    }

    // 只有在首次載入頁面時，才執行這段邏輯
    if (isInitialLoad) {
        isInitialLoad = false; // 將旗標設為 false，確保此區塊只執行一次
        document.getElementById("initialLoading")?.remove();

        // 首次載入時，根據登入狀態，預先渲染一次 UI
        renderNavTabs();
        updateLoginStatusLink(isLoggedIn);
        if (isLoggedIn) {
            loadMemberName(loginEmail);
        }
        
        // 根據 URL 參數決定要顯示哪個頁面，若無則顯示預設頁面
        const urlParams = new URLSearchParams(window.location.search);
        const view = urlParams.get("view") || "souvenir";
        navigateTo(view);
    }
});
// =================================================================
//          可委託代領清單頁面 (delegable-list) 的專屬邏輯
// =================================================================

// 這個函式會在 delegable-list.html 被載入到頁面後才執行
function initializeDelegableListPage() {
    
    // 您的後端網址
    const APPS_SCRIPT_WEB_APP_URL = "https://script.google.com/macros/s/AKfycbzk_RKeBgLtWsVJe79WUIYklyOnLL94nVZ41rb_zG_bV-LOSsi9PtSHQX0H0a2hMId0/exec"; // ‼️ 請換成您自己的

    // 共用的 fetch 函式
    async function fetchDataFromBackend(action, payload = {}) {
        const userEmail = window.currentUserEmail;
        if (!userEmail) throw new Error("無法獲取登入狀態，請重新整理或登入。");
        const fullPayload = { action, email: userEmail, ...payload };
        const response = await fetch(APPS_SCRIPT_WEB_APP_URL, {
            method: 'POST',
            body: JSON.stringify(fullPayload),
            headers: { 'Content-Type': 'application/json' }
        });
        if (!response.ok) throw new Error(`網路錯誤: ${response.statusText}`);
        const result = await response.json();
        if (!result.success) throw new Error(result.data.message || "後端處理時發生未知錯誤");
        return result.data;
    }

    // 檢查登入狀態
    if (!window.currentUserEmail) {
        $('#delegableTable tbody').html('<tr><td colspan="7" class="text-center alert alert-danger">請先登入才能查看您的委託清單。</td></tr>');
        return;
    }

    // 初始化 DataTables
    const table = new DataTable('#delegableTable', {
        ajax: async (data, callback, settings) => {
            try {
                const responseData = await fetchDataFromBackend("getDelegableList");
                callback({ data: responseData });
            } catch (error) {
                console.error("載入可委託清單失敗:", error);
                $('#delegableTable tbody').html(`<tr><td colspan="7" class="text-center alert alert-danger">${error.message}</td></tr>`);
            }
        },
        columns: [
            { data: 'stockCode' },
            { data: 'stockName' },
            { data: 'eVotingStartDate', defaultContent: '-' },
            { data: 'delegationDeadline', defaultContent: '-' },
            { data: 'delegationConditions', defaultContent: '-' },
            {
                data: 'totalHoldingAccounts',
                className: 'text-center',
                render: (data, type, row) => `<button class="btn btn-sm btn-outline-primary view-details-btn" data-details='${JSON.stringify(row.holdingsDetail)}' data-company="${row.stockName} (${row.stockCode})" data-stock-code="${row.stockCode}" data-conditions="${row.delegationConditions}">${data}</button>`
            },
            { data: 'delegatedAccounts', className: 'text-center' }
        ],
        language: { url: 'https://cdn.datatables.net/plug-ins/2.0.8/i18n/zh-HANT.json' },
        responsive: true,
        order: [[3, 'asc']]
    });

    // Modal 相關邏輯
    const detailsModal = new bootstrap.Modal(document.getElementById('detailsModal'));

    $('#delegableTable tbody').on('click', '.view-details-btn', function () {
        const button = $(this);
        const details = JSON.parse(button.attr('data-details'));
        const companyName = button.attr('data-company');
        const stockCode = button.attr('data-stock-code');
        const delegationConditions = button.attr('data-conditions');

        $('#modalCompanyName').text(companyName);
        const modalTableBody = $('#modalTableBody');
        modalTableBody.empty();

        details.forEach(account => {
            let actionHtml = '';
            const docType = String(account.documentType || '').trim();
            const isDocMatch = delegationConditions.includes("身分證") ? docType === "身分證" : true;

            if (account.delegationStatus === '已委託') {
                actionHtml = `<span class="badge bg-success">已委託</span>`;
            } else if (account.delegationStatus === '已收購') {
                actionHtml = `<span class="badge bg-info">已收購</span>`;
            } else if (!isDocMatch) {
                actionHtml = `<span class="badge bg-danger">證件不符</span>`;
            } else {
                actionHtml = `<button class="btn btn-primary btn-sm action-btn" data-status="已委託" data-account-name="${account.accountName}" data-stock-code="${stockCode}">我要委託</button>
                              <button class="btn btn-info btn-sm action-btn ms-1" data-status="已收購" data-account-name="${account.accountName}" data-stock-code="${stockCode}">我要收購</button>`;
            }
            modalTableBody.append(`<tr><td>${account.accountName}</td><td>${docType || '未提供'}</td><td class="text-center">${actionHtml}</td></tr>`);
        });
        detailsModal.show();
    });

    $('#modalTableBody').on('click', '.action-btn', async function () {
        const btn = $(this);
        const newStatus = btn.data('status');
        const accountName = btn.data('account-name');
        const stockCode = btn.data('stock-code');
        btn.prop('disabled', true).html('<span class="spinner-border spinner-border-sm"></span>');
        try {
            const result = await fetchDataFromBackend("updateDelegationStatus", { subAccountName: accountName, stockCode: stockCode, newStatus: newStatus });
            detailsModal.hide();
            table.ajax.reload();
            alert(result.message);
        } catch (error) {
            alert("更新失敗：" + error.message);
            btn.prop('disabled', false).text(newStatus === '已委託' ? '我要委託' : '我要收購');
        }
    });
}
