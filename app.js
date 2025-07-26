// =================================================================
//                 app.js (最終修訂版)
// =================================================================
// 關閉自動 restore scroll，重新整理後就不會保持舊的位置
if ('scrollRestoration' in history) {
  history.scrollRestoration = 'manual';
}

import { initializeRecommendPage } from './recommend.js'; // 如果推薦清單是內嵌的才需要
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import { getAuth, onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';

// --- 全域設定 ---
const firebaseConfig = { apiKey: "AIzaSyD9Bt0HwGGwlRT3_CWFBDhjGcnYf5lCuZU", authDomain: "goodaymember.firebaseapp.com", projectId: "goodaymember", storageBucket: "goodaymember.appspot.com", messagingSenderId: "730801053598", appId: "1:730801053598:web:a2ec0dc91c78fef6bfc08f", measurementId: "G-J3Z7YTHJ9P" };

window.APP_URLS = { // 將 APP_URLS 設置為全局可訪問
    main: "https://script.google.com/macros/s/AKfycbwFSVsZNUeuQXiJ9cU-KSBCg1ZZLVRs-urxiwdQVHt3n_9DJBBvWLZ1Mez0pExtM04Q/exec",
    recommend: "https://script.google.com/macros/s/AKfycbzdoezSaX2ujsE5ejjac3HbZWWHhDKQbX0nN1rVTIPSZm7opdCtslmwPAIq6zBNvcTp/exec"
};
export const APP_URLS = window.APP_URLS; // 確保兼容其他可能 import 的地方

let app;
let auth;
try {
    app = initializeApp(firebaseConfig); // 嘗試初始化 Firebase App
    auth = getAuth(app); // 嘗試獲取 Auth 實例
} catch (error) {
    console.error("Firebase 初始化失敗:", error);
    // 在這裡可以添加用戶友好的錯誤提示
    alert("Firebase 服務載入失敗，部分功能可能無法使用。請刷新頁面或聯繫管理員。");
}


// --- 全域變數 ---
let loginEmail = null;
window.currentUserEmail = null; // 全局變數
const navMenu = document.getElementById("navMenu");
const loginStatus = document.getElementById("loginStatus");
const mobileUserName = document.getElementById("mobileUserName");
const desktopUserName = document.getElementById("desktopUserName");
const dynamicContentArea = document.getElementById('dynamic-content-area'); // 這個元素在目前架構中可能已不再使用
const pages = document.querySelectorAll('.page-container'); // 這個選擇器在目前架構中可能已不再使用
const navbarCollapse = document.getElementById('navbarNav');
const bsCollapse = new bootstrap.Collapse(navbarCollapse, { toggle: false });

let isInitialLoad = true; // 用來追蹤是否為首次載入

// --- 函數定義區 ---
const tabsBeforeLogin = [ { id: "souvenir", label: "紀念品" }, { id: "recommend", label: "推薦清單" }, { id: "notice", label: "注意事項" }, { id: "about", label: "關於我" }];
const tabsAfterLogin = [ { id: "souvenir", label: "紀念品" }, { id: "recommend", label: "推薦清單" }, { id: "notice", label: "注意事項" }, { id: "about", label: "關於我" }, { id: "announcement", label: "公告欄" }, { id: "delegation-manage-dropdown", label: "委託管理", isDropdown: true, children: [ { id: "delegable-list", label: "可委託代領清單" }, { id: "delegated-query", label: "已委託代領查詢" } ] }, { id: "souvenir-manage-dropdown", label: "紀念品管理", isDropdown: true, children: [ { id: "souvenir-inventory", label: "紀念品總庫存" }, { id: "souvenir-transaction-query", label: "紀念品進出查詢" }, { id: "souvenir-withdrawal-query", label: "領出申請查詢" }, { id: "souvenir-album", label: "專屬紀念品相冊" } ] }, { id: "account-management-dropdown", label: "帳戶管理", isDropdown: true, children: [ { id: "account-query", label: "帳務查詢" }, { id: "deposit-withdrawal", label: "儲值 / 提款" },{ id: "add-account-shares", label: "新增帳號／持股" } ] } ];

function renderNavTabs() {
    navMenu.innerHTML = "";
    const tabs = loginEmail ? tabsAfterLogin : tabsBeforeLogin;
    const webAppBaseUrl = APP_URLS.main; // Apps Script Web App 的 URL

    tabs.forEach(tab => {
        const li = document.createElement("li");
        li.className = "nav-item";
        if (tab.isDropdown) {
            li.className = "nav-item dropdown";
            li.innerHTML = `<a class="nav-link dropdown-toggle" href="#" id="${tab.id}Link" role="button" data-bs-toggle="dropdown" aria-expanded="false">${tab.label}</a><ul class="dropdown-menu" aria-labelledby="${tab.id}Link">${tab.children.map(child => `<li><a class="dropdown-item" href="${webAppBaseUrl}?page=${child.id}" data-section="${child.id}">${child.label}</a></li>`).join('')}</ul>`;
        } else {
            // 所有導覽項都生成一個指向 Apps Script Web App 的 URL
            li.innerHTML = `<a class="nav-link" href="${webAppBaseUrl}?page=${tab.id}" data-section="${tab.id}">${tab.label}</a>`;
        }
        navMenu.appendChild(li);
    });
}

async function loadMemberName(email) {
    if (!email) {
        if (mobileUserName) mobileUserName.innerText = "";
        if (desktopUserName) desktopUserName.innerText = "";
        return;
    }

    if (mobileUserName) mobileUserName.innerText = "載入中...";
    if (desktopUserName) desktopUserName.innerText = "載入中...";

    try {
        const params = new URLSearchParams({ view: 'getMemberInfo', email: email });
        const urlWithParams = `${APP_URLS.main}?${params.toString()}`;
        const response = await fetch(urlWithParams);

        if (!response.ok) {
            throw new Error(`網路回應錯誤: ${response.status}`);
        }

        const result = await response.json();

        if (result.success && result.data && result.data.name && result.data.name !== "未知會員") {
            const memberText = `會員：${result.data.name}`;
            if (mobileUserName) mobileUserName.innerText = memberText;
            if (desktopUserName) desktopUserName.innerText = memberText;
        } else {
            throw new Error(result.message || "後端回報錯誤但未提供訊息");
        }

    } catch (error) {
        console.error("取得會員資料失敗:", error);
        const errorText = "會員：載入失敗";
        if (mobileUserName) mobileUserName.innerText = errorText;
        if (desktopUserName) desktopUserName.innerText = errorText;
    }
}

function updateLoginStatusLink(isLoggedIn) {
    const webAppBaseUrl = APP_URLS.main;
    if (isLoggedIn) {
        loginStatus.innerHTML = `<a class="nav-link ms-3 me-3 text-red" href="${webAppBaseUrl}?page=logout" data-section="logout">登出</a>`;
    } else {
        loginStatus.innerHTML = `<a class="nav-link ms-3 me-3 text-red" href="${webAppBaseUrl}?page=login" data-section="login">登入</a>`;
    }
}

// --- 事件監聽與啟動邏輯 ---
document.body.addEventListener("click", function (e) {
    const clickedLink = e.target.closest("a[data-section]"); // 監聽帶有 data-section 的連結
    if (clickedLink) {
        const id = clickedLink.dataset.section;
        if (id === "logout") {
            e.preventDefault(); // 阻止登出連結的默認行為，執行 Firebase 登出
            if (auth) { // 確保 auth 已定義
                signOut(auth).catch((error) => console.error("登出失敗:", error));
            } else {
                console.error("Firebase Auth 未初始化，無法登出。");
            }
        }
        // 對於其他帶有 data-section 的連結，它們的 href 已經是正確的 Apps Script URL
        // 我們不再阻止默認行為，讓瀏覽器處理頁面跳轉 (這會導致 Apps Script 重新載入對應的 HTML)
        // e.preventDefault(); // ✅ 移除這行，讓連結正常跳轉
        
        // 手機版導覽列展開後，點擊項目應該自動收起
        if (navbarCollapse && navbarCollapse.classList.contains('show')) {
            navbarCollapse.classList.remove('show');
        }
    }
});

// onAuthStateChanged 負責監聽登入狀態的變化，並更新 UI
document.addEventListener('DOMContentLoaded', () => {
    if (!auth) { // 如果 auth 在 try...catch 中初始化失敗，這裡就跳過
        console.error("Firebase Auth 未成功初始化，無法監聽登入狀態。");
        return;
    }

    onAuthStateChanged(auth, (user) => {
        const wasLoggedIn = !!loginEmail;
        loginEmail = user ? user.email : null;
        window.currentUserEmail = loginEmail;
        const isLoggedIn = !!user;
        const webAppBaseUrl = APP_URLS.main;

        // 只有在登入狀態真實改變時，才更新大部分 UI
        if (isLoggedIn !== wasLoggedIn) {
            renderNavTabs();
            updateLoginStatusLink(isLoggedIn);
            if (isLoggedIn) {
                loadMemberName(loginEmail);
            } else {
                if (mobileUserName) mobileUserName.innerText = "";
                if (desktopUserName) desktopUserName.innerText = "";
                // 登出時導向預設頁面，使用 Apps Script Web App URL
                window.location.href = `${webAppBaseUrl}?page=souvenir`;
            }
        }

        // 只有在首次載入頁面時，才執行這段邏輯
        if (isInitialLoad) {
            isInitialLoad = false;
            document.getElementById("initialLoading")?.remove(); // 如果有這個載入提示

            renderNavTabs();
            updateLoginStatusLink(isLoggedIn);
            if (isLoggedIn) {
                loadMemberName(loginEmail);
            }
            
            // 根據 URL 參數決定要顯示哪個頁面，若無則顯示預設頁面
            const urlParams = new URLSearchParams(window.location.search);
            const view = urlParams.get("page") || "souvenir"; // 從 'page' 參數獲取視圖
            
            // 首次載入時，如果當前 URL 的 page 參數與應顯示的 page 不同，才進行跳轉
            // 否則，表示頁面已經是正確的，無需再次跳轉
            const currentPageParam = urlParams.get("page");
            if (!currentPageParam || currentPageParam !== view) {
                // 如果當前頁面不是預期的，則跳轉到正確的 Apps Script URL
                window.location.href = `${webAppBaseUrl}?page=${view}`;
            } else {
                // 如果頁面已經是正確的，確保 UI 狀態正確，但不觸發額外跳轉
                // 這裡可以放置任何頁面載入後需要執行的初始化代碼
                // 例如，如果是紀念品頁面，觸發其 DataTables 載入數據
                // 如果是推薦清單頁面，觸發其初始化
                // 由於這些頁面現在由 Apps Script 完全提供 HTML，其各自的 JS 會自行初始化。
            }
        }
    });
});
