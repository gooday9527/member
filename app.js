// =================================================================
//                 app.js (修正 onAuthStateChanged 執行時機)
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

window.APP_URLS = {
    main: "https://script.google.com/macros/s/AKfycbwFSVsZNUeuQXiJ9cU-KSBCg1ZZLVRs-urxiwdQVHt3n_9DJBBvWLZ1Mez0pExtM04Q/exec",
    recommend: "https://script.google.com/macros/s/AKfycbzdoezSaX2ujsE5ejjac3HbZWWHhDKQbX0nN1rVTIPSZm7opdCtslmwPAIq6zBNvcTp/exec"
};

export const APP_URLS = window.APP_URLS; // 為了兼容其他地方可能仍然使用 import

const app = initializeApp(firebaseConfig); // Firebase 應用初始化
const auth = getAuth(app); // 獲取 Auth 實例，這裡 auth 變數被定義

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

let isInitialLoad = true; 

// --- 函數定義區 ---
const tabsBeforeLogin = [ { id: "souvenir", label: "紀念品" }, { id: "recommend", label: "推薦清單" }, { id: "notice", label: "注意事項" }, { id: "about", label: "關於我" }];
const tabsAfterLogin = [ { id: "souvenir", label: "紀念品" }, { id: "recommend", label: "推薦清單" }, { id: "notice", label: "注意事項" }, { id: "about", label: "關於我" }, { id: "announcement", label: "公告欄" }, { id: "delegation-manage-dropdown", label: "委託管理", isDropdown: true, children: [ { id: "delegable-list", label: "可委託代領清單" }, { id: "delegated-query", label: "已委託代領查詢" } ] }, { id: "souvenir-manage-dropdown", label: "紀念品管理", isDropdown: true, children: [ { id: "souvenir-inventory", label: "紀念品總庫存" }, { id: "souvenir-transaction-query", label: "紀念品進出查詢" }, { id: "souvenir-withdrawal-query", label: "領出申請查詢" }, { id: "souvenir-album", label: "專屬紀念品相冊" } ] }, { id: "account-management-dropdown", label: "帳戶管理", isDropdown: true, children: [ { id: "account-query", label: "帳務查詢" }, { id: "deposit-withdrawal", label: "儲值 / 提款" },{ id: "add-account-shares", label: "新增帳號／持股" } ] } ];

function renderNavTabs() {
    navMenu.innerHTML = "";
    const tabs = loginEmail ? tabsAfterLogin : tabsBeforeLogin;
    // 獲取 Apps Script Web App 的 URL 作為基礎
    const webAppBaseUrl = APP_URLS.main; 

    tabs.forEach(tab => {
        const li = document.createElement("li");
        li.className = "nav-item";
        if (tab.isDropdown) {
            li.className = "nav-item dropdown";
            li.innerHTML = `<a class="nav-link dropdown-toggle" href="#" id="${tab.id}Link" role="button" data-bs-toggle="dropdown" aria-expanded="false">${tab.label}</a><ul class="dropdown-menu" aria-labelledby="${tab.id}Link">${tab.children.map(child => `<li><a class="dropdown-item" href="${webAppBaseUrl}?page=${child.id}" data-section="${child.id}">${child.label}</a></li>`).join('')}</ul>`;
        } else {
            // 所有非下拉選單的導覽項都生成一個指向 Apps Script Web App 的 URL
            li.innerHTML = `<a class="nav-link" href="${webAppBaseUrl}?page=${tab.id}" data-section="${tab.id}">${tab.label}</a>`;
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
        const params = new URLSearchParams({
            view: 'getMemberInfo',
            email: email
        });

        const urlWithParams = `${APP_URLS.main}?${params.toString()}`;
        const response = await fetch(urlWithParams);

        if (!response.ok) {
            throw new Error(`網路回應錯誤: ${response.status}`);
        }

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
    // 這裡的連結也需要指向 Apps Script Web App URL
    const webAppBaseUrl = APP_URLS.main;
    if (isLoggedIn) {
        loginStatus.innerHTML = `<a class="nav-link ms-3 me-3 text-red" href="${webAppBaseUrl}?page=logout" data-section="logout">登出</a>`;
    } else {
        loginStatus.innerHTML = `<a class="nav-link ms-3 me-3 text-red" href="${webAppBaseUrl}?page=login" data-section="login">登入</a>`;
    }
}

// 這個函數在新的頁面導航模式下不再需要，因為 Apps Script 會直接提供 HTML 頁面
// async function loadExternalHtmlSection(sectionId) { ... } // 請確保此函數已被移除

// 這個函數在新的頁面導航模式下也不再需要，因為我們直接使用 href 跳轉到 Apps Script URL
// function navigateTo(id, fromHistory = false) { ... } // 請確保此函數已被移除

// --- 事件監聽與啟動邏輯 ---
document.body.addEventListener("click", function (e) {
    const clickedLink = e.target.closest("a[data-section]"); // 監聽帶有 data-section 的連結
    if (clickedLink) {
        // 對於登出操作，我們需要阻止默認行為並執行 Firebase signOut
        if (clickedLink.dataset.section === "logout") {
            e.preventDefault(); // 阻止頁面跳轉
            signOut(auth).catch((error) => console.error("登出失敗:", error));
        }
        // 對於其他帶有 data-section 的連結，它們的 href 已經是正確的 Apps Script URL
        // 瀏覽器會自動處理跳轉，所以這裡不需要 e.preventDefault()
        // 除非您想在這裡做額外處理（如歷史記錄管理），但目前已改為完全重載

        // 手機版導覽列展開後，點擊項目應該自動收起
        if (navbarCollapse.classList.contains('show')) {
            // bsCollapse.hide(); // 這裡可能會引起錯誤，因為 bsCollapse 尚未初始化。
            // 更好的做法是直接操作 class
            navbarCollapse.classList.remove('show');
        }
    }
});

window.addEventListener('popstate', function(event) {

    if (event.state && event.state.section) {
        // 在這種模式下，popstate 已經改變了 URL，瀏覽器會重新載入，
        // 所以這裡不需要再次 navigateTo，除非您想更新一些 UI 狀態
        // alert("Popstate triggered for section: " + event.state.section); // 測試用
    }
});

// ✅ 修正：將 onAuthStateChanged 放入 DOMContentLoaded 監聽器中
// 確保在 DOM 完全載入且 auth 變數被成功定義後才執行
document.addEventListener('DOMContentLoaded', () => {
   onAuthStateChanged(auth, (user) => { 
        const wasLoggedIn = !!loginEmail;
        loginEmail = user ? user.email : null;
        window.currentUserEmail = loginEmail;
        const isLoggedIn = !!user;     
        // ★ 只做 UI 更新，不跳頁 ★
     if (isLoggedIn !== wasLoggedIn) {
       renderNavTabs();
       updateLoginStatusLink(isLoggedIn);
       if (isLoggedIn) {
         loadMemberName(loginEmail);
       } else {
         mobileUserName.innerText = "";
         desktopUserName.innerText = "";
       }
     }
            
     // --- 改成這樣：只在 UI 上做第一次渲染，就不跳轉刷新了 ---
+    if (isInitialLoad) {
+      isInitialLoad = false;
+      document.getElementById("initialLoading")?.remove();
+
+      renderNavTabs();
+      updateLoginStatusLink(isLoggedIn);
+      if (isLoggedIn) loadMemberName(loginEmail);
+      // 不要做任何 window.location.href
+    }
   });
 });

// =================================================================
// 您之前 app.js 中可能有的其他函數，請確保已移除或不再使用:
// - loadExternalHtmlSection
// - navigateTo
// ...
