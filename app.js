// =================================================================
//                 app.js (最終修正版)
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
const navbarCollapse = document.getElementById('navbarNav');
const bsCollapse = new bootstrap.Collapse(navbarCollapse, { toggle: false });
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

async function loadMemberName(email) {
    if (!email) {
        document.getElementById("mobileUserName").innerText = "";
        document.getElementById("desktopUserName").innerText = "";
        return;
    }
    document.getElementById("mobileUserName").innerText = "載入中...";
    document.getElementById("desktopUserName").innerText = "載入中...";
    try {
        const params = new URLSearchParams({ view: 'getMemberInfo', email: email });
        const urlWithParams = `${APP_URLS.main}?${params.toString()}`;
        const response = await fetch(urlWithParams);
        if (!response.ok) { throw new Error(`網路回應錯誤: ${response.status}`); }
        const result = await response.json();
        if (result.success && result.data && result.data.name && result.data.name !== "未知會員") {
            const memberText = `會員：${result.data.name}`;
            document.getElementById("mobileUserName").innerText = memberText;
            document.getElementById("desktopUserName").innerText = memberText;
        } else {
            throw new Error(result.message || "後端回報錯誤但未提供訊息");
        }
    } catch (error) {
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
        const response = await fetch(`${sectionId}.html?v=${new Date().getTime()}`);
        if (!response.ok) throw new Error(`載入 ${sectionId}.html 失敗`);
        dynamicContentArea.innerHTML = await response.text();
        
        // 在 HTML 內容成功載入後，呼叫對應的初始化函式
        if (sectionId === 'delegable-list') {
            initializeDelegableListPage();
        }

    } catch (error) {
        console.error('載入外部內容錯誤:', error);
        dynamicContentArea.innerHTML = `<h3 class="text-center text-danger">頁面載入失敗</h3>`;
    }
}

function navigateTo(id, fromHistory = false) {
    console.log(`[導航追蹤] navigateTo 正在執行，目標頁面 ID: ${id}`); // ✅ 請加上這一行追蹤碼
    const recommendPage = document.getElementById('page-recommend');
    const dynamicContentArea = document.getElementById('dynamic-content-area');
    if (recommendPage) recommendPage.style.display = 'none';
    if (dynamicContentArea) dynamicContentArea.style.display = 'none';

    if (id === 'recommend') {
        if (recommendPage) {
            recommendPage.style.display = 'block';
            initializeRecommendPage();
        }
    } else {
        if (dynamicContentArea) {
            dynamicContentArea.style.display = 'block';
            loadExternalHtmlSection(id);
        }
    }
    if (!fromHistory && id && id !== "logout") {
        const url = new URL(window.location);
        url.searchParams.set('view', id);
        window.history.pushState({ section: id }, '', url);
    }
}

// =================================================================
//          可委託代領清單頁面 (delegable-list) 的專屬邏輯
// =================================================================
function initializeDelegableListPage() {
    const APPS_SCRIPT_WEB_APP_URL = APP_URLS.main; // ✅ 直接使用全域設定的網址

    async function fetchDataFromBackend(action, payload = {}) {
        const userEmail = window.currentUserEmail;
        if (!userEmail) throw new Error("無法獲取登入狀態，請重新整理或登入。");
        const fullPayload = { action, email: userEmail, ...payload };
        const response = await fetch(APPS_SCRIPT_WEB_APP_URL, {
            method: 'POST', body: JSON.stringify(fullPayload), headers: { 'Content-Type': 'application/json' }
        });
        if (!response.ok) throw new Error(`網路錯誤: ${response.statusText}`);
        const result = await response.json();
        if (!result.success) throw new Error(result.data.message || "後端處理時發生未知錯誤");
        return result.data;
    }

    if (!window.currentUserEmail) {
        $('#delegableTable tbody').html('<tr><td colspan="7" class="text-center alert alert-danger">請先登入才能查看您的委託清單。</td></tr>');
        return;
    }

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
            { data: 'stockCode' }, { data: 'stockName' }, { data: 'eVotingStartDate', defaultContent: '-' },
            { data: 'delegationDeadline', defaultContent: '-' }, { data: 'delegationConditions', defaultContent: '-' },
            { data: 'totalHoldingAccounts', className: 'text-center', render: (data, type, row) => `<button class="btn btn-sm btn-outline-primary view-details-btn" data-details='${JSON.stringify(row.holdingsDetail)}' data-company="${row.stockName} (${row.stockCode})" data-stock-code="${row.stockCode}" data-conditions="${row.delegationConditions}">${data}</button>` },
            { data: 'delegatedAccounts', className: 'text-center' }
        ],
        language: { url: 'https://cdn.datatables.net/plug-ins/2.0.8/i18n/zh-HANT.json' },
        responsive: true, order: [[3, 'asc']]
    });

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


// =================================================================
//                      【核心修正】啟動邏輯
// =================================================================
window.addEventListener('DOMContentLoaded', function() {
    // 將所有「啟動邏輯」都放在這裡面，確保外部函式庫 (jQuery, DataTables) 已載入
    
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

    onAuthStateChanged(auth, (user) => {
        const wasLoggedIn = !!loginEmail;
        loginEmail = user ? user.email : null;
        window.currentUserEmail = loginEmail;
        const isLoggedIn = !!user;

        if (isLoggedIn !== wasLoggedIn) {
            renderNavTabs();
            updateLoginStatusLink(isLoggedIn);
            if (isLoggedIn) {
                loadMemberName(loginEmail);
            } else {
                document.getElementById("mobileUserName").innerText = "";
                document.getElementById("desktopUserName").innerText = "";
                navigateTo("souvenir");
            }
        }

        if (isInitialLoad) {
            isInitialLoad = false;
            document.getElementById("initialLoading")?.remove();
            renderNavTabs();
            updateLoginStatusLink(isLoggedIn);
            if (isLoggedIn) {
                loadMemberName(loginEmail);
            }
            const urlParams = new URLSearchParams(window.location.search);
            const view = urlParams.get("view") || "souvenir";
            navigateTo(view);
        }
    });
});
