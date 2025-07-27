// =================================================================
//                 app.js (真正穩定版)
// =================================================================

// 關閉自動 restore scroll
if ('scrollRestoration' in history) {
  history.scrollRestoration = 'manual';
}

// ✅ 註解掉 recommend.js 的 import 來隔離問題
// import { initializeRecommendPage } from './recommend.js';
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

function renderNavTabs() { /* 保持您原本的函式內容 */ }
async function loadMemberName(email) { /* 保持您原本的函式內容 */ }
function updateLoginStatusLink(isLoggedIn) { /* 保持您原本的函式內容 */ }
async function loadExternalHtmlSection(sectionId) { /* 保持您原本的函式內容 */ }
function initializeDelegableListPage() { /* 保持您原本的函式內容 */ }
// 為了避免干擾，我們暫時假設 initializeRecommendPage 是一個空函式
function initializeRecommendPage() { console.log("Recommend page initialized (placeholder)"); }


// ✅ 【迴圈修正】重寫 navigateTo 函式
async function navigateTo(id, fromHistory = false) {
    const recommendPage = document.getElementById('page-recommend');
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
            await loadExternalHtmlSection(id);
            if (id === 'delegable-list') {
                initializeDelegableListPage();
            }
        }
    }
    
    // 只有在不是由瀏覽器上一頁/下一頁觸發時，才更新 URL
    if (!fromHistory && id && id !== "logout") {
        const url = new URL(window.location);
        url.searchParams.set('view', id);
        // 使用 replaceState 而非 pushState 來避免產生不必要的歷史紀錄
        window.history.replaceState({ section: id }, '', url);
    }
}


// --- 啟動邏輯 ---
window.addEventListener('DOMContentLoaded', function() {
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
            if (navbarCollapse && navbarCollapse.classList.contains('show')) {
                bsCollapse.hide();
            }
        }
    });

    window.addEventListener('popstate', function(event) {
        const section = (event.state && event.state.section) || 'souvenir';
        navigateTo(section, true);
    });

    onAuthStateChanged(auth, (user) => {
        const wasLoggedIn = !!loginEmail;
        loginEmail = user ? user.email : null;
        window.currentUserEmail = loginEmail;
        const isLoggedIn = !!user;

        if (isInitialLoad || isLoggedIn !== wasLoggedIn) {
            renderNavTabs();
            updateLoginStatusLink(isLoggedIn);
            loadMemberName(loginEmail);
        }

        if (isInitialLoad) {
            isInitialLoad = false;
            const initialLoadingEl = document.getElementById("initialLoading");
            if(initialLoadingEl) initialLoadingEl.remove();
            
            const urlParams = new URLSearchParams(window.location.search);
            const view = urlParams.get("view") || "souvenir";
            
            // ✅ 【迴圈修正】首次載入時，將 fromHistory 設為 true 來阻止 pushState
            navigateTo(view, true);
        }

        if (isLoggedIn !== wasLoggedIn && !isLoggedIn) {
            navigateTo("souvenir");
        }
    });
});
