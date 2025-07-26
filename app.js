// =================================================================
//                 app.js (還原到穩定版)
// =================================================================
// 關閉自動 restore scroll，重新整理後就不會保持舊的位置
if ('scrollRestoration' in history) {
  history.scrollRestoration = 'manual';
}

// 這裡不再 import 任何與推薦清單或委託清單相關的模組
// 因為它們的功能暫時被視為未整合或不啟動
// import { initializeRecommendPage } from './recommend.js'; 

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import { getAuth, onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';

// --- 全域設定 ---
const firebaseConfig = { apiKey: "AIzaSyD9Bt0HwGGwlRT3_CWFBDhjGcnYf5lCuZU", authDomain: "goodaymember.firebaseapp.com", projectId: "goodaymember", storageBucket: "goodaymember.appspot.com", messagingSenderId: "730801053598", appId: "1:730801053598:web:a2ec0dc91c78fef6bfc08f", measurementId: "G-J3Z7YTHJ9P" };

// 這個 Apps Script URL 將只用於 loadMemberName 函數，不用於頁面導航
window.APP_URLS = {
    main: "https://script.google.com/macros/s/AKfycbwFSVsZNUeuQXiJ9cU-KSBCg1ZZLVRs-urxiwdQVHt3n_9DJBBvWLZ1Mez0pExtM04Q/exec",
    // 推薦清單的 URL 也暫時不使用
    // recommend: "https://script.google.com/macros/s/AKfycbzdoezSaX2ujsE5ejjac3HbZWWHhDKQbX0nN1rVTIPSZm7opdCtslmwPAIq6zBNvcTp/exec"
};
export const APP_URLS = window.APP_URLS; // 確保兼容其他可能 import 的地方

let app;
let auth;
try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
} catch (error) {
    console.error("Firebase 初始化失敗:", error);
    alert("Firebase 服務載入失敗，部分功能可能無法使用。請刷新頁面或聯繫管理員。");
}


// --- 全域變數 ---
let loginEmail = null;
window.currentUserEmail = null;
const navMenu = document.getElementById("navMenu");
const loginStatus = document.getElementById("loginStatus");
const mobileUserName = document.getElementById("mobileUserName");
const desktopUserName = document.getElementById("desktopUserName");
const dynamicContentArea = document.getElementById('dynamic-content-area'); // 可能不再使用
const pages = document.querySelectorAll('.page-container'); // 可能不再使用
const navbarCollapse = document.getElementById('navbarNav');
const bsCollapse = new bootstrap.Collapse(navbarCollapse, { toggle: false });

let isInitialLoad = true; 

// --- 函數定義區 (還原到僅顯示紀念品和基本頁面，不包含委託管理等新下拉菜單) ---
const tabsBeforeLogin = [ { id: "souvenir", label: "紀念品" }, { id: "recommend", label: "推薦清單" }, { id: "notice", label: "注意事項" }, { id: "about", label: "關於我" }, { id: "login", label: "登入" } ];
// 恢復到沒有 dropdown 的版本
const tabsAfterLogin = [ { id: "souvenir", label: "紀念品" }, { id: "recommend", label: "推薦清單" }, { id: "notice", label: "注意事項" }, { id: "about", label: "關於我" }, { id: "announcement", label: "📣 公告欄" }, { id: "logout", label: "登出" } ]; // 簡化，只保留登出

function renderNavTabs() {
    navMenu.innerHTML = "";
    const tabs = loginEmail ? tabsAfterLogin : tabsBeforeLogin;
    
    tabs.forEach(tab => {
        const li = document.createElement("li");
        li.className = "nav-item";
        // 暫時移除所有下拉選單的處理，只生成普通連結
        li.innerHTML = `<a class="nav-link" href="#" data-section="${tab.id}">${tab.label}</a>`;
        navMenu.appendChild(li);
    });
}

// 會員名稱載入函數
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

// 更新登入狀態連結
function updateLoginStatusLink(isLoggedIn) {
    if (isLoggedIn) {
        loginStatus.innerHTML = `<a class="nav-link ms-3 me-3 text-red" href="#" data-section="logout">登出</a>`;
    } else {
        loginStatus.innerHTML = `<a class="nav-link ms-3 me-3 text-red" href="#" data-section="login">登入</a>`;
    }
}

// --- 頁面導航邏輯 (恢復到使用動態載入片段，不觸發整頁重載) ---
// 這部分是基於您之前能夠正常運行的 app.js 中的導航邏輯
// 它將確保頁面不會因為導航而重新載入，從而避免迴圈
async function loadExternalHtmlSection(sectionId) {
    // 顯示載入動畫
    dynamicContentArea.innerHTML = `<div class="d-flex justify-content-center align-items-center" style="height: 50vh;"><div class="spinner-border" role="status"></div></div>`;
    try {
        const response = await fetch(`/${sectionId}.html`); // 假設 HTML 檔案在根目錄
        if (!response.ok) throw new Error(`載入 ${sectionId}.html 失敗`);
        const htmlContent = await response.text();
        dynamicContentArea.innerHTML = htmlContent;
        // 重新執行載入的 HTML 中的 script 標籤
        dynamicContentArea.querySelectorAll('script').forEach(oldScript => {
            const newScript = document.createElement('script');
            Array.from(oldScript.attributes).forEach(attr => newScript.setAttribute(attr.name, attr.value));
            newScript.appendChild(document.createTextNode(oldScript.innerHTML));
            oldScript.parentNode.replaceChild(newScript, oldScript);
        });
    } catch (error) {
        console.error('載入外部內容錯誤:', error);
        dynamicContentArea.innerHTML = `<h3 class="text-center text-danger">頁面載入失敗</h3>`;
    }
}

function navigateTo(id, fromHistory = false) {
    // 獲取頁面容器
    const recommendPage = document.getElementById('page-recommend'); // 如果推薦清單是獨立的 section
    const dynamicContentArea = document.getElementById('dynamic-content-area'); // 載入外部 HTML 的區域

    // 隱藏所有頁面容器
    if (recommendPage) recommendPage.style.display = 'none';
    if (dynamicContentArea) dynamicContentArea.style.display = 'none';

    // 根據 ID 顯示對應的內容
    if (id === 'recommend') {
        if (recommendPage) {
            recommendPage.style.display = 'block';
            // initializeRecommendPage(); // 如果推薦清單有自己的初始化函數，這裡調用
        }
    } else {
        // 對於其他頁面，載入外部 HTML 片段
        if (dynamicContentArea) {
            dynamicContentArea.style.display = 'block';
            loadExternalHtmlSection(id);
        }
    }
    
    // 更新網址列的邏輯保持不變 (使用 history.pushState)
    if (!fromHistory && id && id !== "logout") {
        const url = new URL(window.location);
        url.searchParams.set('view', id); // 使用 'view' 參數來區分頁面
        window.history.pushState({ section: id }, '', url);
    }
}


// --- 事件監聽與啟動邏輯 ---
document.body.addEventListener("click", function (e) {
    const clickedLink = e.target.closest("a[data-section]");
    if (clickedLink) {
        e.preventDefault(); // 阻止所有 data-section 連結的默認行為，由 JS 處理導航
        const id = clickedLink.dataset.section;
        if (id === "logout") {
            if (auth) { // 確保 auth 已定義
                signOut(auth).catch((error) => console.error("登出失敗:", error));
            } else {
                console.error("Firebase Auth 未初始化，無法登出。");
            }
        } else {
            navigateTo(id); // 調用內部導航函數
        }
        // 手機版導覽列展開後，點擊項目應該自動收起
        if (navbarCollapse.classList.contains('show')) {
            bsCollapse.hide(); // 使用 bsCollapse.hide() 來收起導覽列
        }
    }
});

window.addEventListener('popstate', function(event) {
    if (event.state && event.state.section) {
        navigateTo(event.state.section, true); // 瀏覽器前後按鈕時重新導航
    } else {
        navigateTo('souvenir', true); // 預設導航到紀念品頁面
    }
});

// onAuthStateChanged 負責監聽登入狀態的變化，並更新 UI
document.addEventListener('DOMContentLoaded', () => { // 確保 DOM 準備好才執行
    if (!auth) { // 檢查 auth 是否已定義 (Firebase 初始化是否成功)
        console.error("Firebase Auth 未成功初始化，無法監聽登入狀態。");
        return;
    }

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
                mobileUserName.innerText = "";
                desktopUserName.innerText = "";
                navigateTo("login"); // 登出後導向登入頁面
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
            const view = urlParams.get("view") || "souvenir"; // 使用 'view' 參數
            navigateTo(view); // 首次載入時導航到指定頁面
        }
    });
});
